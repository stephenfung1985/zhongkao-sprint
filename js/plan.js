/* ============================================================
   plan.js — 把「某一天」解析成「今天该学什么」
   纯函数、可预测：同一个日期永远得到同一份任务，不依赖打卡记录。
   ============================================================ */
const Plan = (function () {

  const START = new Date(PLAN.startDate + "T00:00:00");
  const EXAM  = new Date(PLAN.examDate + "T00:00:00");

  function parse(s) { return new Date(s + "T00:00:00"); }
  function fmt(d) {
    return d.getFullYear() + "-" +
      String(d.getMonth() + 1).padStart(2, "0") + "-" +
      String(d.getDate()).padStart(2, "0");
  }
  function diffDays(a, b) { return Math.round((b - a) / 86400000); }

  /** Day 编号：起始日为 Day 1 */
  function dayNumber(date) { return diffDays(START, date) + 1; }

  /** 距中考天数 */
  function daysLeft(date) { return diffDays(date, EXAM); }

  function phaseOf(date) {
    const s = fmt(date);
    for (const p of PLAN.phases) {
      if (s >= p.start && s <= p.end) return p;
    }
    return s < PLAN.startDate ? PLAN.phases[0] : PLAN.phases[PLAN.phases.length - 1];
  }

  /** 该日期是第几个自然周（从 Day1 所在周算起），用于周六道法/历史交替 */
  function weekIndex(date) {
    return Math.floor(diffDays(START, date) / 7);
  }

  /** 该日期主科 */
  function subjectOf(date) {
    const dow = date.getDay();
    const r = PLAN.rotation[dow];
    if (!r) return "review";
    if (r.subject === "ALT") {
      return PLAN.saturdayAlt[weekIndex(date) % PLAN.saturdayAlt.length];
    }
    return r.subject;
  }

  /** 从 Day1 到 date（含）该科目出现了几次 → 0-based 序号 */
  function occurrenceIndex(subject, date) {
    let n = -1;
    const cur = new Date(START);
    const end = fmt(date);
    let guard = 0;
    while (fmt(cur) <= end && guard++ < 400) {
      if (subjectOf(cur) === subject) n++;
      cur.setDate(cur.getDate() + 1);
    }
    return Math.max(0, n);
  }

  function poolOf(subject) {
    return (window.LESSONS && window.LESSONS[subject]) || [];
  }

  /** 补位科目：优先英语（最大失分科），其次数学，按天交替 */
  function pickFallback(date) {
    const order = ["english", "math"];
    const avail = order.filter(s => poolOf(s).length);
    if (!avail.length) return "review";
    return avail[diffDays(START, date) % avail.length];
  }

  function modeForRound(round, date) {
    // 最后一个阶段（回归基础）强制闪测
    if (fmt(date) >= PLAN.phases[4].start) return "flash";
    if (round <= 0) return "learn";
    if (round === 1) return "drill";
    return "flash";
  }

  /** 特殊日：考试日 / 报名窗口 / 里程碑 */
  function specialOf(date) {
    const s = fmt(date);
    // blocking: true 表示当天不排常规课程（只有考试期间和考完之后）
    if (s >= PLAN.examDate && s <= PLAN.examEnd) {
      return { kind: "exam", blocking: true,
        text: "🎓 中考进行中 —— 今天不学新东西，考完就把卷子忘掉，准备下一场。" };
    }
    if (s > PLAN.examEnd) {
      return { kind: "after", blocking: true,
        text: "🎉 考完了。这290天你每一天都在场，这件事本身就值得。" };
    }
    // 下面这些只是横幅提醒，正常课程照常进行
    if (s >= "2026-12-20" && s <= "2026-12-30") {
      return { kind: "signup", blocking: false,
        text: "⚠️ 中考报名窗口（12月20-30日），错过不补报。今天确认报上了吗？" };
    }
    const ms = PLAN.milestones.find(m => m.date === s);
    if (ms) return { kind: "milestone", blocking: false,
      text: "📌 " + ms.label + "：" + ms.desc.replace(/<[^>]+>/g, "") };
    return null;
  }

  /** 主入口：解析某一天 */
  function taskFor(date) {
    const s = fmt(date);
    const dayNo = dayNumber(date);
    const phase = phaseOf(date);
    const special = specialOf(date);
    const subject = subjectOf(date);
    const pool = poolOf(subject);

    let lesson = null, mode = "learn", round = 0, idx = 0;
    let actualSubject = subject;
    let fallbackFrom = null;

    // 该科课程库还没建好 → 用数学/英语补位，保证每天都能正常学
    if (!pool.length) {
      fallbackFrom = subject;
      actualSubject = pickFallback(date);
    }

    const usePool = poolOf(actualSubject);
    if (usePool.length) {
      idx = occurrenceIndex(actualSubject, date);
      // 补位日不占用该科的正常进度序号，用日期错开取课，避免和本科日重复
      if (fallbackFrom) idx = (idx + dayNo) % usePool.length;
      round = Math.floor(idx / usePool.length);
      lesson = usePool[idx % usePool.length];
      mode = modeForRound(round, date);
      if (fallbackFrom) mode = "learn";
    }

    const meta = PLAN.subjectMeta[actualSubject] || { name: "复习", color: "#6b6156" };
    const origMeta = PLAN.subjectMeta[subject] || { name: "复习" };

    return {
      date: s,
      dayNo,
      daysLeft: daysLeft(date),
      weekday: "日一二三四五六"[date.getDay()],
      phase,
      subject: actualSubject,
      subjectName: meta.name,
      subjectColor: meta.color,
      plannedSubject: subject,
      plannedSubjectName: origMeta.name,
      fallbackFrom,
      lesson,
      mode,
      round: round + 1,
      lessonIndex: idx,
      poolSize: usePool.length,
      special,
      // 周二整块攻英语，不再单独做微剂量
      needWarmup: actualSubject !== "english" && !(special && special.blocking)
    };
  }

  function taskForString(s) { return taskFor(parse(s)); }

  /** 今天（若在计划开始前，显示 Day 1；若已考完，显示考试日） */
  function todayTask() {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    if (fmt(now) < PLAN.startDate) return taskFor(START);
    return taskFor(now);
  }

  /** 某阶段已完成的天数比例 */
  function phaseProgress(phase, checkins) {
    const total = phase.days;
    let done = 0;
    Object.keys(checkins).forEach(d => {
      if (d >= phase.start && d <= phase.end) done++;
    });
    // 时间进度
    const today = fmt(new Date());
    let elapsed = 0;
    if (today > phase.end) elapsed = total;
    else if (today >= phase.start) elapsed = diffDays(parse(phase.start), parse(today)) + 1;
    return { total, done, elapsed, pct: Math.round(done / total * 100) };
  }

  /** 一周课表预览 */
  function weekPreview() {
    const rows = [];
    const names = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
    for (let d = 1; d <= 7; d++) {
      const dow = d % 7;
      const r = PLAN.rotation[dow];
      const sub = r.subject === "ALT" ? "道法 / 历史（隔周交替）" :
        (PLAN.subjectMeta[r.subject] || {}).name;
      rows.push({ day: names[dow], subject: sub, dow });
    }
    return rows;
  }

  return {
    taskFor, taskForString, todayTask, phaseProgress, weekPreview,
    dayNumber, daysLeft, phaseOf, subjectOf, fmt, parse, diffDays, START, EXAM
  };
})();
