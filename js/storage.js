/* ============================================================
   storage.js — 打卡记录 / 错题本 / 统计

   存储策略（重要）：
     磁盘文件  学习数据/学习记录.json   ← 唯一权威，浏览器清理动不了它
     localStorage                      ← 仅作离线缓存和断网兜底

   为什么这么做：
     以前只存 localStorage。用 file:// 双击打开时，浏览器把这些数据归类为
     「本地文件站点数据」，清理浏览数据 / 关闭浏览器时清除 / 电脑清理软件
     扫一遍，都会连打卡记录一起删掉 —— 这就是「第二天记录没了」的原因。
     现在通过 启动学习平台.bat 打开，数据实时写进磁盘文件，彻底绕开这个问题。
   ============================================================ */
const DB = (function () {
  const KEY = "zk2027_v1";
  const BROKEN_KEY = "zk2027_v1_损坏备份";   // 解析失败时把原始内容留一份，绝不静默丢弃

  const blank = () => ({
    version: 1,
    createdAt: new Date().toISOString(),
    checkins: {},   // "2026-09-04": {date, day, subject, lessonId, mode, total, right, wrong[], feynman, mood, seconds}
    wrongs: {},     // qid: {qid, subject, point, stem, answer, explain, addedAt, reps, nextDue, mastered}
    exams: {},      // examId: {id, subject, title, date, source, score, items[], summary, status, test, createdAt, updatedAt}
    settings: {}
  });

  let data = load();

  /* ---- 磁盘同步状态（供界面显示）---- */
  const sync = {
    server: false,        // 是否连上了本地服务器
    lastSaved: null,      // 最近一次成功写盘时间
    file: "",             // 磁盘文件路径
    error: ""             // 最近一次写盘失败原因
  };
  const listeners = [];
  function onSyncChange(fn) { listeners.push(fn); }
  function emit() { listeners.forEach(fn => { try { fn(sync); } catch (e) {} }); }

  function load() {
    let raw = null;
    try {
      raw = localStorage.getItem(KEY);
    } catch (e) {
      console.warn("localStorage 不可用：", e);
      return blank();
    }
    if (!raw) return blank();
    try {
      return Object.assign(blank(), JSON.parse(raw));
    } catch (e) {
      // 解析失败时把原文另存一份，而不是当作空数据覆盖掉
      try { localStorage.setItem(BROKEN_KEY, raw); } catch (_) {}
      console.error("本地数据解析失败，原始内容已存到 " + BROKEN_KEY + " 备查", e);
      return blank();
    }
  }

  /** 写 localStorage（快），同时异步推到磁盘（稳） */
  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(data));
    } catch (e) {
      console.warn("localStorage 写入失败：", e);
    }
    pushToDisk();
  }

  /* ---------------- 磁盘同步 ---------------- */
  let pushTimer = null, pushing = false, pendingAgain = false;

  /** 打卡这种关键动作要立刻落盘，其余合并成 600ms 一次，避免频繁写文件 */
  function pushToDisk(immediate) {
    if (location.protocol === "file:") return;   // 没走服务器，落盘能力不可用
    clearTimeout(pushTimer);
    if (immediate) return doPush();
    pushTimer = setTimeout(doPush, 600);
  }

  function doPush() {
    if (pushing) { pendingAgain = true; return; }
    pushing = true;
    fetch("/api/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    })
      .then(r => r.json())
      .then(res => {
        if (res && res.ok) {
          sync.server = true;
          sync.lastSaved = new Date();
          sync.error = "";
        } else {
          sync.error = (res && res.error) || "服务器拒绝了保存请求";
        }
      })
      .catch(e => { sync.server = false; sync.error = String(e.message || e); })
      .finally(() => {
        pushing = false;
        emit();
        if (pendingAgain) { pendingAgain = false; doPush(); }
      });
  }

  /** 两份数据取并集，逐条按时间戳保留较新的那条——任何一边都不会丢 */
  function mergeData(a, b) {
    const newer = (x, y) => {
      if (!x) return y;
      if (!y) return x;
      return (y._t || 0) >= (x._t || 0) ? y : x;
    };
    const out = blank();
    out.createdAt = a.createdAt || b.createdAt || out.createdAt;
    ["checkins", "wrongs", "exams"].forEach(field => {
      const keys = new Set([
        ...Object.keys(a[field] || {}),
        ...Object.keys(b[field] || {})
      ]);
      keys.forEach(k => {
        out[field][k] = newer((a[field] || {})[k], (b[field] || {})[k]);
      });
    });
    out.settings = Object.assign({}, a.settings, b.settings);
    // 计数器类设置取较大值，避免寄语轮换倒退
    const wi = Math.max((a.settings || {}).wishIndex || 0, (b.settings || {}).wishIndex || 0);
    if (wi) out.settings.wishIndex = wi;
    return out;
  }

  /**
   * 启动时调用：把磁盘上的记录读回来，和浏览器里的合并。
   * 必须在渲染界面之前 await 它，否则会先显示成"没有记录"。
   */
  async function init() {
    if (location.protocol === "file:") {
      sync.server = false;
      sync.error = "file";     // 界面据此提示改用 启动学习平台.bat
      emit();
      return sync;
    }
    try {
      const r = await fetch("/api/load", { cache: "no-store" });
      const res = await r.json();
      sync.server = true;
      const diskData = res && res.data;
      const localDays = Object.keys(data.checkins || {}).length;
      const diskDays = diskData ? Object.keys(diskData.checkins || {}).length : 0;

      if (diskData) {
        data = mergeData(data, diskData);
        const mergedDays = Object.keys(data.checkins).length;
        console.info(`[存储] 磁盘 ${diskDays} 天 + 浏览器 ${localDays} 天 → 合并后 ${mergedDays} 天`);
        try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) {}
        // 合并结果比磁盘上多，说明浏览器里有磁盘没有的记录，补写回去
        if (mergedDays > diskDays) pushToDisk(true);
      } else if (localDays) {
        // 磁盘上还没有文件，把浏览器里已有的记录迁移过去
        console.info(`[存储] 首次落盘，迁移浏览器里的 ${localDays} 天记录`);
        pushToDisk(true);
      }
      const p = await fetch("/api/ping").then(x => x.json()).catch(() => null);
      if (p && p.file) sync.file = p.file;
    } catch (e) {
      sync.server = false;
      sync.error = String(e.message || e);
      console.warn("[存储] 连不上本地服务器，本次只用浏览器缓存：", e);
    }
    emit();
    return sync;
  }

  /* ---------------- 打卡 ---------------- */
  function getCheckin(dateStr) { return data.checkins[dateStr] || null; }

  function saveCheckin(rec) {
    data.checkins[rec.date] = Object.assign({}, data.checkins[rec.date], rec, { _t: Date.now() });
    try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) {}
    pushToDisk(true);   // 打卡是最关键的一笔，立刻写盘，不等合并窗口
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
      existing._t = Date.now();
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
      mastered: false,
      _t: Date.now()
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
    w._t = Date.now();
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

  /* ---------------- 试卷深度解析 ---------------- */
  function getExam(id) { return data.exams[id] || null; }
  function allExams() {
    return Object.values(data.exams).sort((a, b) =>
      (b.date || "").localeCompare(a.date || "") || (b.updatedAt || "").localeCompare(a.updatedAt || ""));
  }
  function saveExam(exam) {
    if (!exam || !exam.id) return;
    data.exams[exam.id] = Object.assign({}, data.exams[exam.id], exam,
      { updatedAt: new Date().toISOString(), _t: Date.now() });
    try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) {}
    pushToDisk(true);
  }
  function removeExam(id) {
    if (data.exams[id]) { delete data.exams[id]; save(); }
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
      pushToDisk(true);
      return true;
    } catch (e) {
      alert("导入失败：" + e.message);
      return false;
    }
  }

  function reset() {
    data = blank();
    save();
    pushToDisk(true);
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
    getExam, allExams, saveExam, removeExam,
    subjectStats, totalMinutes,
    getSetting, setSetting, bump,
    exportJSON, importJSON, reset,
    init, onSyncChange, syncState: () => sync, flush: () => pushToDisk(true),
    fmt, addDays
  };
})();
