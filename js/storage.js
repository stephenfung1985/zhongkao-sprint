/* ============================================================
   storage.js — 本地存储：打卡记录 / 错题本 / 统计
   全部存在 localStorage，不联网。
   ============================================================ */
const DB = (function () {
  const KEY = "zk2027_v1";

  const blank = () => ({
    version: 1,
    createdAt: new Date().toISOString(),
    checkins: {},   // "2026-09-04": {date, day, subject, lessonId, mode, total, right, wrong[], feynman, mood, seconds}
    wrongs: {},     // qid: {qid, subject, point, stem, answer, explain, addedAt, reps, nextDue, mastered}
    settings: {}
  });

  let data = load();

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return blank();
      const p = JSON.parse(raw);
      return Object.assign(blank(), p);
    } catch (e) {
      console.warn("读取本地数据失败，已重置", e);
      return blank();
    }
  }

  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(data));
    } catch (e) {
      alert("保存失败，可能是浏览器存储已满。请先导出数据。");
    }
  }

  /* ---------------- 打卡 ---------------- */
  function getCheckin(dateStr) { return data.checkins[dateStr] || null; }

  function saveCheckin(rec) {
    data.checkins[rec.date] = Object.assign({}, data.checkins[rec.date], rec);
    save();
  }

  function allCheckins() { return data.checkins; }

  /** 连续打卡天数：从今天（或昨天）往回数 */
  function streak() {
    const today = new Date();
    let n = 0;
    // 若今天没打卡，从昨天开始数（当天还没学不算断）
    let cur = new Date(today);
    if (!data.checkins[fmt(cur)]) cur.setDate(cur.getDate() - 1);
    while (data.checkins[fmt(cur)]) {
      n++;
      cur.setDate(cur.getDate() - 1);
    }
    return n;
  }

  function longestStreak() {
    const dates = Object.keys(data.checkins).sort();
    if (!dates.length) return 0;
    let best = 1, run = 1;
    for (let i = 1; i < dates.length; i++) {
      const prev = new Date(dates[i - 1] + "T00:00:00");
      const cur = new Date(dates[i] + "T00:00:00");
      const gap = Math.round((cur - prev) / 86400000);
      run = gap === 1 ? run + 1 : 1;
      if (run > best) best = run;
    }
    return best;
  }

  /* ---------------- 错题本 ---------------- */
  function addWrong(q, subject, point) {
    const now = new Date();
    const existing = data.wrongs[q.id];
    if (existing) {
      // 再次做错 → 复习进度倒退一级，重新变紧急
      existing.reps = Math.max(0, (existing.reps || 0) - 1);
      existing.mastered = false;
      existing.wrongCount = (existing.wrongCount || 1) + 1;
      existing.nextDue = fmt(addDays(now, PLAN.ebbinghaus[existing.reps] || 1));
      save();
      return;
    }
    data.wrongs[q.id] = {
      qid: q.id,
      subject, point,
      stem: q.stem,
      type: q.type,
      options: q.options || null,
      answer: q.answer,
      explain: q.explain,
      trap: q.trap || "",
      addedAt: fmt(now),
      reps: 0,
      wrongCount: 1,
      nextDue: fmt(addDays(now, PLAN.ebbinghaus[0])),
      mastered: false
    };
    save();
  }

  /** 复现答对 → 推进到下一个间隔；连续到最后一级则毕业 */
  function promoteWrong(qid) {
    const w = data.wrongs[qid];
    if (!w) return;
    w.reps = (w.reps || 0) + 1;
    if (w.reps >= PLAN.ebbinghaus.length) {
      w.mastered = true;
      w.masteredAt = fmt(new Date());
      w.nextDue = null;
    } else {
      w.nextDue = fmt(addDays(new Date(), PLAN.ebbinghaus[w.reps]));
    }
    save();
  }

  function removeWrong(qid) { delete data.wrongs[qid]; save(); }

  function allWrongs() { return Object.values(data.wrongs); }

  /** 今天到期需要复现的错题 */
  function dueWrongs(limit) {
    const today = fmt(new Date());
    const list = allWrongs()
      .filter(w => !w.mastered && w.nextDue && w.nextDue <= today)
      .sort((a, b) => (b.wrongCount || 1) - (a.wrongCount || 1) || a.nextDue.localeCompare(b.nextDue));
    return limit ? list.slice(0, limit) : list;
  }

  /* ---------------- 统计 ---------------- */
  function subjectStats() {
    const out = {};
    Object.values(data.checkins).forEach(c => {
      if (!c.subject) return;
      const s = out[c.subject] || (out[c.subject] = { days: 0, total: 0, right: 0 });
      s.days++;
      s.total += c.total || 0;
      s.right += c.right || 0;
    });
    return out;
  }

  function totalMinutes() {
    return Object.values(data.checkins)
      .reduce((sum, c) => sum + Math.round((c.seconds || 0) / 60), 0);
  }

  /* ---------------- 设置 ---------------- */
  function getSetting(k, dflt) {
    return data.settings && k in data.settings ? data.settings[k] : dflt;
  }
  function setSetting(k, v) {
    data.settings = data.settings || {};
    data.settings[k] = v;
    save();
  }
  /** 取出计数器当前值并 +1，用于寄语顺序轮换 */
  function bump(k) {
    const n = getSetting(k, 0);
    setSetting(k, n + 1);
    return n;
  }

  /* ---------------- 导入导出 ---------------- */
  function exportJSON() {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "中考学习数据_" + fmt(new Date()) + ".json";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function importJSON(text) {
    try {
      const p = JSON.parse(text);
      if (!p.checkins) throw new Error("文件格式不对");
      data = Object.assign(blank(), p);
      save();
      return true;
    } catch (e) {
      alert("导入失败：" + e.message);
      return false;
    }
  }

  function reset() {
    data = blank();
    save();
  }

  /* ---------------- 工具 ---------------- */
  function fmt(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${dd}`;
  }
  function addDays(d, n) {
    const r = new Date(d);
    r.setDate(r.getDate() + n);
    return r;
  }

  return {
    getCheckin, saveCheckin, allCheckins, streak, longestStreak,
    addWrong, promoteWrong, removeWrong, allWrongs, dueWrongs,
    subjectStats, totalMinutes,
    getSetting, setSetting, bump,
    exportJSON, importJSON, reset,
    fmt, addDays
  };
})();
