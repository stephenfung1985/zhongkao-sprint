/* ============================================================
   app.js — 主控制器
   ============================================================ */
const $ = id => document.getElementById(id);
let viewDate = null;      // 当前查看的日期对象
let task = null;          // 当前日期的任务
let timerId = null, seconds = 0;
let runState = { warmup: null, soc: null, quiz: null, mood: null };

/* ---------------- 启动 ---------------- */
window.addEventListener("DOMContentLoaded", () => {
  bindTabs();
  bindFooter();
  bindDateNav();
  bindTheme();
  bindVoice();
  showWish();
  const t = new Date(); t.setHours(0, 0, 0, 0);
  viewDate = (Plan.fmt(t) < PLAN.startDate) ? new Date(Plan.START) : t;
  loadDay();
  renderCalendar();
  renderWrongBook();
  renderPlan();
  renderStats();
  renderHeader();
});

function bindTabs() {
  document.querySelectorAll(".tab").forEach(b => {
    b.onclick = () => {
      document.querySelectorAll(".tab").forEach(x => x.classList.remove("active"));
      document.querySelectorAll(".panel").forEach(x => x.classList.remove("active"));
      b.classList.add("active");
      $("panel-" + b.dataset.tab).classList.add("active");
      if (b.dataset.tab === "calendar") renderCalendar();
      if (b.dataset.tab === "wrong") renderWrongBook();
      if (b.dataset.tab === "stats") renderStats();
      if (b.dataset.tab === "plan") renderPlan();
      window.scrollTo({ top: 0, behavior: "smooth" });
    };
  });
}

function bindDateNav() {
  $("prevDay").onclick = () => { viewDate = DB.addDays(viewDate, -1); loadDay(); };
  $("nextDay").onclick = () => { viewDate = DB.addDays(viewDate, 1); loadDay(); };
  $("jumpToday").onclick = () => {
    const t = new Date(); t.setHours(0, 0, 0, 0);
    viewDate = (Plan.fmt(t) < PLAN.startDate) ? new Date(Plan.START) : t;
    loadDay();
  };
}

function bindFooter() {
  $("btnExport").onclick = () => DB.exportJSON();
  $("btnImport").onclick = () => $("fileImport").click();
  $("fileImport").onchange = e => {
    const f = e.target.files[0]; if (!f) return;
    const r = new FileReader();
    r.onload = () => { if (DB.importJSON(r.result)) location.reload(); };
    r.readAsText(f);
  };
  $("btnReset").onclick = () => {
    if (confirm("确定清空全部打卡记录和错题本？这个操作没法撤销。\n建议先点「导出学习数据」备份。")) {
      DB.reset(); location.reload();
    }
  };
}

/* ============================================================
   亮色 / 暗色切换
   未手动选过时跟随系统；选过之后记在本地，下次打开保持
   ============================================================ */
const THEME_KEY = "zk2027_theme";

function currentTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  if (saved === "light" || saved === "dark") return saved;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function bindTheme() {
  $("themeBtn").onclick = () => {
    const next = currentTheme() === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    try { localStorage.setItem(THEME_KEY, next); } catch (e) {}
  };
  // 没手动选过时，跟着系统实时切
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
    if (!localStorage.getItem(THEME_KEY)) document.documentElement.removeAttribute("data-theme");
  });
}

/* ============================================================
   语音讲解开关
   ============================================================ */
function bindVoice() {
  const btn = $("voiceToggle");
  if (!btn) return;
  // 初始化指示器状态
  if (typeof Speech !== "undefined") Speech.updateIndicator();
  btn.onclick = () => {
    if (typeof Speech === "undefined") return;
    const on = Speech.toggle();
    if (!on) Speech.stop();
  };
}

/* ============================================================
   家人寄语 —— 每次打开顺序轮换一句，转完一圈再从头开始
   ============================================================ */
/**
 * 数据文件按人分组存放（方便编辑），但展示时要轮着来，
 * 否则会连着看到 14 条爸爸的话才轮到妈妈。
 * 这里把索引重排成「爸爸→妈妈→弟弟→吾悦→爸爸→…」的循环顺序。
 * 某个人的话说完了就自动跳过他，剩下的继续轮。
 */
let WISH_ORDER = null;
function wishOrder(pool) {
  if (WISH_ORDER) return WISH_ORDER;
  const groups = {}, names = [];
  pool.forEach((m, i) => {
    if (!groups[m.from]) { groups[m.from] = []; names.push(m.from); }
    groups[m.from].push(i);
  });
  const order = [];
  for (let r = 0; order.length < pool.length; r++) {
    names.forEach(n => {
      if (groups[n][r] !== undefined) order.push(groups[n][r]);
    });
  }
  WISH_ORDER = order;
  return order;
}

function showWish() {
  const pool = window.FAMILY_MESSAGES || [];
  if (!pool.length) { $("wishBox").style.display = "none"; return; }

  const order = wishOrder(pool);
  const m = pool[order[DB.bump("wishIndex") % order.length]];
  const t = $("wishText"), f = $("wishFrom");
  t.textContent = m.text;
  f.textContent = "—— " + m.from;
  // 重放入场动画
  [t, f].forEach(el => {
    el.classList.remove("wish-swap");
    void el.offsetWidth;   // 强制回流，让动画能重放
    el.classList.add("wish-swap");
  });

  $("wishBox").onclick = showWish;   // 点一下换下一句
}

function renderHeader() {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const left = Plan.daysLeft(today);
  $("cdDays").textContent = left > 0 ? left : 0;
  $("cdDate").textContent = PLAN.examDate;
  $("streakNum").textContent = DB.streak();
}

/* ============================================================
   加载某一天
   ============================================================ */
function loadDay() {
  task = Plan.taskFor(viewDate);
  const rec = DB.getCheckin(task.date);

  $("dayNo").textContent = task.dayNo < 1 ? "计划尚未开始" :
    (task.dayNo > PLAN.totalDays ? "Day 290+" : "DAY " + task.dayNo + " / 290");
  $("dayDate").textContent = task.date + " 星期" + task.weekday +
    "　·　距中考 " + Math.max(0, task.daysLeft) + " 天";
  $("phaseBadge").textContent = "阶段" + task.phase.id + " " + task.phase.name;

  const chip = $("subjChip");
  chip.textContent = task.subjectName;
  chip.style.background = task.subjectColor;

  const mn = $("modeNote");
  const banner = $("dayBanner");
  // 非阻断型节点（报名提醒、里程碑）只显示横幅，课程照常
  if (task.special && !task.special.blocking) {
    banner.className = "day-banner show" + (task.special.kind === "signup" ? " urgent" : "");
    banner.textContent = task.special.text;
  } else {
    banner.className = "day-banner";
    banner.textContent = "";
  }

  if (task.special && task.special.blocking) {
    $("lessonTitle").textContent = task.special.kind === "exam" ? "中考进行中" : "290天走完了";
    $("lessonGoal").textContent = task.special.text;
    mn.className = "mode-note show";
    mn.textContent = task.special.text;
  } else if (task.lesson) {
    $("lessonTitle").textContent = task.lesson.title;
    $("lessonGoal").textContent = task.lesson.goal || "";
    const m = PLAN.modes[task.mode];
    mn.className = "mode-note show";
    if (task.fallbackFrom) {
      mn.innerHTML = `📌 按计划今天是<b>${esc(task.plannedSubjectName)}</b>，` +
        `但${esc(task.plannedSubjectName)}课程库还没建好 —— 今天用<b>${esc(task.subjectName)}</b>补位。` +
        `补位日不占用${esc(task.subjectName)}的正常进度。`;
    } else {
      mn.textContent = `${m.label}（第 ${task.round} 轮 · 本科目第 ${task.lessonIndex + 1} 课）　${m.note}`;
    }
  } else {
    $("lessonTitle").textContent = "今天没有排到课程";
    $("lessonGoal").textContent = "数学和英语课程库也为空。请检查 data/ 目录下的文件是否正常加载。";
    mn.className = "mode-note";
  }

  // 重置流程
  ["stage-warmup", "stage-socratic", "stage-quiz", "stage-review"].forEach(s => $(s).style.display = "none");
  $("stage-start").style.display = "block";
  runState = { warmup: null, soc: null, quiz: null, mood: null };
  stopTimer(); seconds = 0; $("timer").textContent = "00:00";
  setSteps(-1);

  const note = $("doneNote");
  if (rec) {
    note.style.display = "block";
    note.innerHTML = `✅ 这天已打卡：做对 <b>${rec.right}/${rec.total}</b> 题，用时 ${Math.round((rec.seconds || 0) / 60)} 分钟。` +
      (rec.feynman ? `<br>她当时写的：「${esc(rec.feynman)}」` : "") +
      `<br><span style="opacity:.7">可以重做，成绩会覆盖。</span>`;
    $("btnStart").textContent = "再做一遍";
  } else {
    note.style.display = "none";
    $("btnStart").textContent = task.dayNo < 1 ? "先预习一下（计划 9月4日 正式开始）" : "开始今天的 30 分钟";
  }
  $("btnStart").onclick = startFlow;
  renderHeader();
}

function setSteps(active) {
  const box = $("progressSteps");
  box.innerHTML = "";
  PLAN.timebox.forEach((t, i) => {
    const d = document.createElement("div");
    d.className = "pstep" + (i < active ? " done" : i === active ? " now" : "");
    d.title = t.title + " · " + t.min + "分钟";
    box.appendChild(d);
  });
}

function startTimer() {
  stopTimer();
  timerId = setInterval(() => {
    seconds++;
    const m = String(Math.floor(seconds / 60)).padStart(2, "0");
    const s = String(seconds % 60).padStart(2, "0");
    $("timer").textContent = m + ":" + s;
    if (seconds === 1800) $("timer").style.color = "var(--acc)";
  }, 1000);
}
function stopTimer() { if (timerId) clearInterval(timerId); timerId = null; }

/* ============================================================
   流程：START → WARMUP → SOCRATIC → QUIZ → REVIEW
   ============================================================ */
function startFlow() {
  $("stage-start").style.display = "none";
  startTimer();
  if (task.needWarmup) goWarmup(); else goSocratic();
}

/* ---------- STEP 1：英语微剂量 ---------- */
function goWarmup() {
  setSteps(0);
  $("stage-warmup").style.display = "block";
  const pool = window.ENGLISH_DAILY || [];
  if (!pool.length) { goSocratic(); return; }

  const item = pool[(task.dayNo - 1 + pool.length) % pool.length];
  const round = Math.floor(Math.max(0, task.dayNo - 1) / pool.length) + 1;
  $("warmupTitle").textContent = item.topic;

  const body = $("warmupBody");
  const isListening = task.date >= "2027-05-01";
  let html = `<p class="tiny" style="margin:0 0 12px">
    英语是她全卷最大的失分科（120分只拿65.5）。每天见一面5分钟，比周末补两小时有用。
    ${round > 1 ? `这是第 ${round} 轮见到这组词，应该越来越快。` : ""}
    ${isListening ? "<br><b>5月起改成朗读模式：每个词组请出声念3遍，为听力机考铺路。</b>" : ""}
    </p><div class="chat">`;
  item.cards.forEach(c => {
    html += `<div class="bubble ask"><b>${esc(c.front)}</b>　—　${rich(c.back)}
      ${c.eg ? `<br><span style="opacity:.75;font-size:.92em">${rich(c.eg)}</span>` : ""}</div>`;
  });
  html += `</div><div id="warmQuiz"></div>`;
  body.innerHTML = html;

  // 微剂量小测
  let wi = 0, wRight = 0;
  const wq = body.querySelector("#warmQuiz");
  function drawW() {
    if (wi >= item.check.length) {
      runState.warmup = { total: item.check.length, right: wRight };
      wq.innerHTML = `<div class="explain right"><span class="lab">微剂量完成 ${wRight}/${item.check.length}</span>
        ${wRight === item.check.length ? "这组词你已经拿住了。" : "错的那个已经进错题本，过两天还会找你。"}</div>`;
      $("btnWarmupNext").style.display = "inline-block";
      return;
    }
    const c = item.check[wi];
    wq.innerHTML = `<div class="q"><div class="q-meta">
        <span class="tagi pt">英语 · ${esc(item.topic)}</span>
        <span class="tagi lv">微剂量 ${wi + 1}/${item.check.length}</span></div>
      <div class="q-stem">${rich(c.stem)}</div>
      <div class="q-fill"><input type="text" id="wIn" placeholder="填英文" autocomplete="off">
      <button class="btn-primary" id="wGo">确定</button></div><div id="wFb"></div></div>`;
    const inp = wq.querySelector("#wIn");
    const go = () => {
      const acc = Array.isArray(c.answer) ? c.answer : [c.answer];
      const ok = acc.some(a => norm(a) === norm(inp.value));
      if (ok) wRight++;
      else DB.addWrong({
        id: "ed-" + item.id + "-" + wi, stem: c.stem, type: "fill",
        answer: acc, explain: c.note || ("正确答案：" + acc[0]), pt: item.topic
      }, "english", item.topic);
      wq.querySelector("#wFb").innerHTML =
        `<div class="explain ${ok ? "right" : "wrong"}">
          <span class="lab">${ok ? "✓" : "✗ 答案：" + esc(acc[0])}</span>${rich(c.note || "")}</div>
         <div class="q-actions"><button class="btn-primary" id="wNext">继续 →</button></div>`;
      wq.querySelector("#wNext").onclick = () => { wi++; drawW(); };
      inp.disabled = true; wq.querySelector("#wGo").disabled = true;
    };
    wq.querySelector("#wGo").onclick = go;
    inp.onkeydown = e => { if (e.key === "Enter") go(); };
    setTimeout(() => inp.focus(), 60);
  }
  drawW();

  $("btnWarmupNext").style.display = "none";
  $("btnWarmupNext").onclick = () => { $("stage-warmup").style.display = "none"; goSocratic(); };
}

/* ---------- STEP 2：苏格拉底对话 ---------- */
function goSocratic() {
  setSteps(1);
  const lesson = task.lesson;
  const chain = lesson && lesson.socratic ? lesson.socratic : null;

  // drill / flash 模式跳过完整讲解，只做一次「还记得吗」回忆
  if (!chain || task.mode !== "learn") {
    $("stage-socratic").style.display = "block";
    const box = $("chatBox"), inp = $("chatInput");
    box.innerHTML = ""; inp.innerHTML = "";
    const recall = lesson && lesson.recall ? lesson.recall :
      "今天这个考点，你还记得核心那一句话是什么吗？先自己在心里说一遍。";
    const recallBubble = document.createElement("div");
    recallBubble.className = "bubble ask";
    recallBubble.innerHTML = rich(recall);
    box.appendChild(recallBubble);
    if (typeof Speech !== "undefined") { Speech.setBubble(recallBubble); Speech.speak(recall); }
    if (lesson && lesson.key) {
      inp.innerHTML = `<button class="opt" id="showKey">我想好了，给我看标准答案</button>`;
      inp.querySelector("#showKey").onclick = () => {
        const keyBubble = document.createElement("div");
        keyBubble.className = "bubble good";
        keyBubble.innerHTML = `<b>核心一句话：</b>${rich(lesson.key)}`;
        box.appendChild(keyBubble);
        if (typeof Speech !== "undefined") { Speech.setBubble(keyBubble); Speech.speak("核心一句话：" + lesson.key); }
        inp.innerHTML = "";
        $("btnSocDone").style.display = "inline-block";
      };
    } else {
      $("btnSocDone").style.display = "inline-block";
    }
    $("btnSocDone").textContent = "直接上题 →";
    $("btnSocDone").onclick = () => { $("stage-socratic").style.display = "none"; goQuiz(); };
    return;
  }

  $("stage-socratic").style.display = "block";
  $("btnSocDone").style.display = "none";
  $("btnSocDone").textContent = "我想明白了，去练 →";
  Socratic.start(chain, $("chatBox"), $("chatInput"), stats => {
    runState.soc = stats;
    $("btnSocDone").style.display = "inline-block";
    $("btnSocDone").onclick = () => { $("stage-socratic").style.display = "none"; goQuiz(); };
  });
}

/* ---------- STEP 3：练习（含错题复现） ---------- */
function buildQuizList() {
  const lesson = task.lesson;
  let qs = lesson && lesson.quiz ? lesson.quiz.slice() : [];

  // flash 模式只做标了 flash 的题，没标就取前 3 道
  if (task.mode === "flash" && qs.length > 3) {
    const f = qs.filter(q => q.flash);
    qs = f.length ? f : qs.slice(0, 3);
  }

  // 错题复现：周日复盘日多插几道，平时插 2 道
  const dueN = task.subject === "review" ? 6 : 2;
  const due = DB.dueWrongs(dueN).map(w => ({
    id: w.qid, src: "📕 错题复现", pt: w.point || "", lv: "复现",
    type: w.type || "fill", stem: w.stem, options: w.options,
    answer: w.answer, explain: w.explain, trap: w.trap
  }));

  return due.concat(qs);
}

function goQuiz() {
  setSteps(2);
  $("stage-quiz").style.display = "block";
  const qs = buildQuizList();
  if (!qs.length) {
    $("quizBody").innerHTML = `<div class="empty-note">今天没有排到题目，也没有到期的错题。<br>
      直接去复盘打卡，把今天读过的内容用一句话说清楚。</div>
      <div class="q-actions"><button class="btn-primary" id="skipQ">去复盘 →</button></div>`;
    $("quizBody").querySelector("#skipQ").onclick = () => {
      runState.quiz = { total: 0, right: 0, wrong: [] };
      $("stage-quiz").style.display = "none"; goReview();
    };
    return;
  }
  Quiz.start(qs, $("quizBody"), $("quizCounter"),
    { subject: task.subject, point: task.lesson ? task.lesson.point : "" },
    res => {
      runState.quiz = res;
      $("stage-quiz").style.display = "none";
      $("quizBody").innerHTML = "";   // 清空，避免隐藏的旧按钮残留在 DOM 里
      goReview();
    });
}

/* ---------- STEP 4：复盘打卡 ---------- */
function goReview() {
  setSteps(3);
  stopTimer();
  $("stage-review").style.display = "block";

  const q = runState.quiz || { total: 0, right: 0, wrong: [] };
  const w = runState.warmup;
  const total = q.total + (w ? w.total : 0);
  const right = q.right + (w ? w.right : 0);
  const pct = total ? Math.round(right / total * 100) : 0;

  let verdict, sub;
  if (total === 0) { verdict = "完成"; sub = "今天没做题，但你来了。"; }
  else if (pct >= 90) { verdict = "稳"; sub = "这个考点已经是你的了。明天别复习它，去攻下一个。"; }
  else if (pct >= 70) { verdict = "过关"; sub = "会了但还不熟。错的那几道已经进错题本，过两天自动找你。"; }
  else if (pct >= 40) { verdict = "有洞"; sub = "不是笨，是这个知识点前面还欠着东西。别慌，错题本会带你回来。"; }
  else { verdict = "重来"; sub = "今天这个点没吃透，很正常。明天平台会把它重新排给你。这不算失败，算发现。"; }

  const prompt = (task.lesson && task.lesson.feynman) ||
    "用你自己的话，一句话说清今天学的是什么。写给一个完全没学过的人看。";

  $("reviewBody").innerHTML = `
    <div class="scorebox">
      <div class="score-big">${right}/${total}</div>
      <div class="score-sub"><b>${verdict}</b> · 正确率 ${pct}%　用时 ${Math.floor(seconds / 60)} 分 ${seconds % 60} 秒<br>${sub}</div>
    </div>

    <div class="feyn">
      <p style="font-size:14px;margin:0 0 8px"><b>费曼一句话</b>　${esc(prompt)}</p>
      <textarea id="feynIn" placeholder="不用写得漂亮，写得明白就行。写不出来 = 其实还没懂。"></textarea>
    </div>

    <p style="font-size:14px;margin:18px 0 0"><b>今天感觉怎么样？</b></p>
    <div class="mood" id="moodBox">
      <button data-m="轻松">😌</button>
      <button data-m="还行">🙂</button>
      <button data-m="有点累">😮‍💨</button>
      <button data-m="很吃力">😣</button>
      <button data-m="不想学">😑</button>
    </div>

    <div class="q-actions" style="justify-content:center">
      <button class="btn-primary" id="btnCheckin">完成打卡 ✓</button>
    </div>
    <p class="tiny" style="text-align:center">连续打卡 ${DB.streak()} 天。断一天不要紧，别断两天。</p>`;

  $("moodBox").querySelectorAll("button").forEach(b => {
    b.onclick = () => {
      $("moodBox").querySelectorAll("button").forEach(x => x.classList.remove("sel"));
      b.classList.add("sel");
      runState.mood = b.dataset.m;
    };
  });

  $("btnCheckin").onclick = () => {
    DB.saveCheckin({
      date: task.date, day: task.dayNo,
      subject: task.subject, subjectName: task.subjectName,
      lessonId: task.lesson ? task.lesson.id : null,
      lessonTitle: task.lesson ? task.lesson.title : "",
      mode: task.mode, total, right,
      wrong: q.wrong, feynman: $("feynIn").value.trim(),
      mood: runState.mood, seconds
    });
    const s = DB.streak();
    $("reviewBody").innerHTML = `<div class="scorebox">
      <div class="score-big">✓</div>
      <div class="score-sub">Day ${task.dayNo} 打卡完成　·　连续 <b>${s}</b> 天<br>
      距中考还有 <b>${Math.max(0, task.daysLeft)}</b> 天。<br><br>
      ${s >= 7 ? "连续一周了。习惯正在成形，这比今天做对几道题重要得多。" : "明天见。"}</div></div>`;
    renderHeader(); renderCalendar(); renderStats(); renderWrongBook();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
}

/* ============================================================
   打卡日历
   ============================================================ */
function renderCalendar() {
  const box = $("calendarBox");
  const checkins = DB.allCheckins();
  const todayStr = Plan.fmt(new Date());
  const msMap = {}; PLAN.milestones.forEach(m => msMap[m.date] = m);

  let html = "";
  let cur = new Date(PLAN.startDate + "T00:00:00");
  cur.setDate(1);
  const last = new Date(PLAN.examEnd + "T00:00:00");

  while (cur <= last) {
    const y = cur.getFullYear(), mo = cur.getMonth();
    const first = new Date(y, mo, 1);
    const dim = new Date(y, mo + 1, 0).getDate();
    html += `<div class="cal-month"><h4>${y} 年 ${mo + 1} 月</h4><div class="cal-grid">`;
    ["日", "一", "二", "三", "四", "五", "六"].forEach(d => html += `<div class="cal-dow">${d}</div>`);
    for (let i = 0; i < first.getDay(); i++) html += `<div class="cal-cell empty"></div>`;
    for (let d = 1; d <= dim; d++) {
      const ds = `${y}-${String(mo + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const rec = checkins[ds];
      let cls = "cal-cell";
      let tip = ds;
      if (msMap[ds]) { cls += " milestone"; tip += " · " + msMap[ds].label; }
      else if (rec) {
        const perfect = rec.total > 0 && rec.right === rec.total;
        cls += perfect ? " perfect" : " done";
        tip += ` · ${rec.subjectName || ""} ${rec.right}/${rec.total}`;
      }
      if (ds === todayStr) cls += " today";
      const clickable = ds >= PLAN.startDate && ds <= PLAN.examEnd;
      html += `<div class="${cls}" title="${esc(tip)}" ${clickable ? `data-d="${ds}"` : ""}>${d}</div>`;
    }
    html += `</div></div>`;
    cur.setMonth(cur.getMonth() + 1);
  }
  box.innerHTML = html;
  box.querySelectorAll("[data-d]").forEach(c => {
    c.onclick = () => {
      viewDate = Plan.parse(c.dataset.d);
      loadDay();
      document.querySelector('.tab[data-tab="today"]').click();
    };
  });
}

/* ============================================================
   错题本
   ============================================================ */
let wrongFilter = "due";
function renderWrongBook() {
  const all = DB.allWrongs();
  const due = DB.dueWrongs();
  const active = all.filter(w => !w.mastered);
  const mastered = all.filter(w => w.mastered);

  $("wrongStat").innerHTML =
    `待消灭 <b>${active.length}</b> 道　·　今天到期 ${due.length} 道　·　已攻克 ${mastered.length} 道`;

  const filters = [
    { k: "due", n: "今天该复现 (" + due.length + ")" },
    { k: "all", n: "全部待消灭 (" + active.length + ")" },
    { k: "hot", n: "反复错的" },
    { k: "done", n: "已攻克 (" + mastered.length + ")" }
  ];
  $("wrongFilters").innerHTML = filters.map(f =>
    `<button class="${wrongFilter === f.k ? "on" : ""}" data-k="${f.k}">${f.n}</button>`).join("");
  $("wrongFilters").querySelectorAll("button").forEach(b => {
    b.onclick = () => { wrongFilter = b.dataset.k; renderWrongBook(); };
  });

  let list;
  if (wrongFilter === "due") list = due;
  else if (wrongFilter === "all") list = active;
  else if (wrongFilter === "hot") list = active.filter(w => (w.wrongCount || 1) > 1)
    .sort((a, b) => (b.wrongCount || 1) - (a.wrongCount || 1));
  else list = mastered;

  if (!list.length) {
    $("wrongBox").innerHTML = `<div class="empty-note">${
      wrongFilter === "due" ? "今天没有到期的错题 —— 干净。<br>做完今天的课，新错题会自动排进来。" :
      wrongFilter === "done" ? "还没有攻克的错题。<br>同一道题连对 5 次（1/3/7/15/30天）才算毕业。" :
      "错题本是空的。<br>做题时答错会自动收进来，不用手动记。"}</div>`;
    return;
  }

  const todayStr = Plan.fmt(new Date());
  $("wrongBox").innerHTML = list.map(w => {
    const overdue = w.nextDue && w.nextDue <= todayStr;
    const subName = (PLAN.subjectMeta[w.subject] || {}).name || w.subject || "";
    const ans = Array.isArray(w.answer) ? w.answer[0] : w.answer;
    return `<div class="wcard ${w.mastered ? "mastered" : ""}">
      <div class="wcard-meta">
        <span class="tagi pt">${esc(subName)}</span>
        <span class="tagi src">${esc(w.point || "")}</span>
        <span class="tagi lv">进度 ${w.reps || 0}/${PLAN.ebbinghaus.length}</span>
        ${(w.wrongCount || 1) > 1 ? `<span class="due-badge">错过 ${w.wrongCount} 次</span>` : ""}
        ${w.mastered ? `<span class="tagi lv">已攻克</span>` :
          `<span class="due-badge ${overdue ? "" : "soon"}">${overdue ? "今天该复现" : w.nextDue + " 复现"}</span>`}
      </div>
      <div class="wcard-stem">${rich(w.stem)}</div>
      <div class="wcard-ans"><b>答案：${esc(ans)}</b><br>${rich(w.explain || "")}</div>
      <div class="wcard-act">
        ${!w.mastered ? `<button class="btn-ghost" data-ok="${esc(w.qid)}">这道我已经会了</button>` : ""}
        <button class="btn-ghost" data-del="${esc(w.qid)}">移出错题本</button>
      </div></div>`;
  }).join("");

  $("wrongBox").querySelectorAll("[data-ok]").forEach(b =>
    b.onclick = () => { DB.promoteWrong(b.dataset.ok); renderWrongBook(); });
  $("wrongBox").querySelectorAll("[data-del]").forEach(b =>
    b.onclick = () => { DB.removeWrong(b.dataset.del); renderWrongBook(); });
}

/* ============================================================
   290 天规划
   ============================================================ */
function renderPlan() {
  const checkins = DB.allCheckins();
  const todayStr = Plan.fmt(new Date());
  let html = "";

  /* 分值结构 */
  html += `<div class="section-t">中考分值结构（天津 · 文化课760 + 体育40 = 800）</div>
    <div class="bars"><table class="week-table">
    <tr><th>科目</th><th>满分</th><th>八下期末</th><th>得分率</th><th>说明</th></tr>`;
  PLAN.scoreTable.forEach(s => {
    const rate = s.rate == null ? "—" : Math.round(s.rate * 100) + "%";
    const color = s.rate == null ? "var(--ink2)" :
      s.rate < 0.6 ? "var(--bad)" : s.rate < 0.75 ? "var(--warn)" : "var(--ok)";
    html += `<tr><td>${s.subj}</td><td>${s.full}</td><td>${s.base == null ? "—" : s.base}</td>
      <td style="color:${color};font-weight:700">${rate}</td>
      <td style="font-size:12.5px;color:var(--ink2)">${s.note}</td></tr>`;
  });
  html += `</table>
    <p class="tiny" style="margin-top:12px">
    八下期末 422.5/660 = <b>64%</b>。按同样得分率折到中考760分文化课，约 <b>480 分</b>上下（化学未知，按0估另算）。<br>
    最大缺口：<b>英语 55%</b>（丢54.5分）、<b>道法 56%</b>（开卷丢44分）、<b>历史 65%</b>（开卷丢35分）。
    道法+历史两科开卷共丢 79 分 —— 这不是「不会」，是「不会查书、不会按格式答」，是全卷提分最快的地方。<br>
    <b>化学</b>是九年级新科目，零欠账，最有机会变成优势科。
    </p></div>`;

  /* 每周轮转 */
  html += `<div class="section-t">每周轮转表（每天 30 分钟）</div>
    <div class="bars"><table class="week-table">
    <tr><th>星期</th><th>主科（22分钟）</th><th>固定项</th></tr>`;
  Plan.weekPreview().forEach(r => {
    html += `<tr><td>${r.day}</td><td>${r.subject}</td>
      <td style="font-size:12.5px;color:var(--ink2)">${
        r.dow === 2 ? "整块攻英语，当天不做微剂量" :
        r.dow === 0 ? "错题清零 + 本周知识点闪测" :
        "5分钟英语微剂量 + 3分钟费曼复盘"}</td></tr>`;
  });
  html += `</table>
    <p class="tiny" style="margin-top:12px">
    <b>为什么这么排：</b>英语是最大失分项，但一周只给一天不够——所以拆成「每天5分钟微剂量 + 周二整块22分钟」。
    词汇和固定搭配靠的是<b>见面次数</b>，不是单次时长。<br>
    道法和历史都是开卷，考的是检索速度和答题格式，不需要每天练，隔周各一次足够。<br>
    周日不学新东西，只清错题——<b>不清错题的刷题等于白刷</b>。</p></div>`;

  /* 时间盒 */
  html += `<div class="section-t">30 分钟怎么花（知识点 : 练习 ≈ 4 : 6）</div>
    <div class="bars"><table class="week-table">
    <tr><th>环节</th><th>时长</th><th>做什么</th></tr>`;
  PLAN.timebox.forEach(t => {
    html += `<tr><td style="width:auto">${t.title}</td><td>${t.min} 分钟</td>
      <td style="font-size:12.5px;color:var(--ink2)">${t.desc}</td></tr>`;
  });
  html += `</table>
    <p class="tiny" style="margin-top:12px">
    针对「基础薄弱、常错送分题」，讲解和练习的比例定在 <b>8:13</b>（约4:6）。<br>
    讲多了记不住，练多了打击信心。一天只攻一个考点、只做 5-6 道题，
    宁可少而透——目标是<b>今天这个点明天不会再错</b>，不是今天做了多少题。</p></div>`;

  /* 五个阶段 */
  html += `<div class="section-t">五个阶段（2026-09-04 → 2027-06-20，共 290 天）</div>`;
  PLAN.phases.forEach(p => {
    const pr = Plan.phaseProgress(p, checkins);
    const isCur = todayStr >= p.start && todayStr <= p.end;
    html += `<div class="phase ${isCur ? "cur" : ""}" style="--acc:${p.color}">
      <div class="phase-t"><h3>阶段${p.id} · ${p.name}${isCur ? " 　← 现在" : ""}</h3>
        <span class="phase-days">${p.start} ~ ${p.end} · ${p.days}天</span></div>
      <div class="phase-goal">${esc(p.goal)}</div>
      <div class="phase-bar"><i style="width:${pr.pct}%;background:${p.color}"></i></div>
      <p class="tiny" style="margin:0 0 10px">已打卡 ${pr.done} / ${pr.total} 天（${pr.pct}%）</p>
      <ul>${p.focus.map(f => `<li>${f}</li>`).join("")}</ul></div>`;
  });

  /* 里程碑 */
  html += `<div class="section-t">关键时间节点</div><div class="bars">`;
  PLAN.milestones.forEach(m => {
    const past = m.date < todayStr;
    const left = Plan.diffDays(new Date(), Plan.parse(m.date));
    html += `<div class="milestone-row" style="${past ? "opacity:.45" : ""}">
      <div class="ms-date">${m.date}</div>
      <div class="ms-txt"><b>${m.label}</b> — ${m.desc}
        ${!past && left >= 0 ? `　<span style="color:var(--acc)">还有 ${left} 天</span>` : ""}</div></div>`;
  });
  html += `</div>`;

  html += `<p class="tiny" style="margin-top:20px">
    <b>关于题目来源：</b>平台里的题按天津卷近三年（2023–2025）的题型结构、考点分布和难度梯度编写，
    每题都标了来源类型（真题改编 / 真题同源 / 高频考点）。
    这些是<b>仿真题，不是逐字真题原文</b>——考点和陷阱是真的，题面是重写的。
    到了 3 月一轮复习，建议同时买一本天津中考真题卷做整套限时训练，平台负责补基础，真题卷负责练手感。</p>`;

  $("planBox").innerHTML = html;
}

/* ============================================================
   数据看板
   ============================================================ */
function renderStats() {
  const checkins = DB.allCheckins();
  const days = Object.keys(checkins);
  const totalQ = days.reduce((s, d) => s + (checkins[d].total || 0), 0);
  const rightQ = days.reduce((s, d) => s + (checkins[d].right || 0), 0);
  const acc = totalQ ? Math.round(rightQ / totalQ * 100) : 0;
  const mins = DB.totalMinutes();
  const wrongs = DB.allWrongs();
  const activeW = wrongs.filter(w => !w.mastered).length;
  const masteredW = wrongs.filter(w => w.mastered).length;
  const todayStr = Plan.fmt(new Date());
  // 计划开始前 elapsed 会 ≤0，用打卡天数兜底，避免出现 0% 或除零
  const elapsedRaw = Plan.diffDays(Plan.START, new Date()) + 1;
  const elapsed = Math.min(Math.max(elapsedRaw, days.length, 1), PLAN.totalDays);
  const rate = Math.min(100, Math.round(days.length / elapsed * 100));

  let html = `<div class="stat-grid">
    <div class="stat-card"><div class="stat-v" style="color:var(--acc)">${days.length}</div>
      <div class="stat-l">累计打卡天数</div></div>
    <div class="stat-card"><div class="stat-v" style="color:var(--ok)">${DB.streak()}</div>
      <div class="stat-l">当前连续 · 最长 ${DB.longestStreak()}</div></div>
    <div class="stat-card"><div class="stat-v">${rate}%</div>
      <div class="stat-l">出勤率（已过 ${elapsed} 天）</div></div>
    <div class="stat-card"><div class="stat-v" style="color:${acc >= 75 ? "var(--ok)" : acc >= 55 ? "var(--warn)" : "var(--bad)"}">${acc}%</div>
      <div class="stat-l">总正确率（${rightQ}/${totalQ}）</div></div>
    <div class="stat-card"><div class="stat-v">${mins}</div>
      <div class="stat-l">累计分钟 ≈ ${(mins / 60).toFixed(1)} 小时</div></div>
    <div class="stat-card"><div class="stat-v" style="color:var(--bad)">${activeW}</div>
      <div class="stat-l">待消灭错题 · 已攻克 ${masteredW}</div></div>
  </div>`;

  /* 分科正确率 */
  const st = DB.subjectStats();
  const keys = Object.keys(PLAN.subjectMeta).filter(k => st[k]);
  html += `<div class="section-t">分科正确率（做得越少越不准，先攒够 3 天再看）</div><div class="bars">`;
  if (!keys.length) {
    html += `<div class="empty-note" style="padding:20px">还没有数据。打卡几天后这里会出现每一科的真实正确率。</div>`;
  } else {
    keys.forEach(k => {
      const s = st[k], m = PLAN.subjectMeta[k];
      const p = s.total ? Math.round(s.right / s.total * 100) : 0;
      html += `<div class="bar-row">
        <div class="bar-name">${m.name}</div>
        <div class="bar-track"><div class="bar-fill" style="width:${Math.max(p, 8)}%;background:${m.color}">${p}%</div></div>
        <div class="bar-n">${s.right}/${s.total} · ${s.days}天</div></div>`;
    });
  }
  html += `</div>`;

  /* 错题分科分布 */
  const wByS = {};
  wrongs.filter(w => !w.mastered).forEach(w => {
    wByS[w.subject] = (wByS[w.subject] || 0) + 1;
  });
  const wk = Object.keys(wByS).sort((a, b) => wByS[b] - wByS[a]);
  if (wk.length) {
    const max = Math.max(...Object.values(wByS));
    html += `<div class="section-t">错题堆在哪一科（这里最高的那一科，就是下个月的主战场）</div><div class="bars">`;
    wk.forEach(k => {
      const m = PLAN.subjectMeta[k] || { name: k, color: "#999" };
      html += `<div class="bar-row">
        <div class="bar-name">${m.name}</div>
        <div class="bar-track"><div class="bar-fill" style="width:${Math.round(wByS[k] / max * 100)}%;background:${m.color}">${wByS[k]}</div></div>
        <div class="bar-n">${wByS[k]} 道</div></div>`;
    });
    html += `</div>`;
  }

  /* 最近 10 次打卡 */
  const recent = days.sort().slice(-10).reverse();
  if (recent.length) {
    html += `<div class="section-t">最近 10 次</div><div class="bars"><table class="week-table">
      <tr><th>日期</th><th>科目</th><th>内容</th><th>成绩</th><th>状态</th></tr>`;
    recent.forEach(d => {
      const c = checkins[d];
      const p = c.total ? Math.round(c.right / c.total * 100) : 0;
      html += `<tr><td style="width:auto;font-weight:400">${d.slice(5)}</td>
        <td>${c.subjectName || ""}</td>
        <td style="font-size:12.5px;color:var(--ink2)">${esc((c.lessonTitle || "").slice(0, 18))}</td>
        <td style="color:${p >= 75 ? "var(--ok)" : p >= 50 ? "var(--warn)" : "var(--bad)"};font-weight:700">${c.right}/${c.total}</td>
        <td>${c.mood || ""}</td></tr>`;
    });
    html += `</table></div>`;
  }

  html += `<p class="tiny" style="margin-top:18px">
    <b>怎么看这块数据：</b>别盯正确率高低，盯<b>「错题堆在哪一科」</b>那张图。
    正确率会因为题目难度波动，但错题堆积的方向不会骗人。<br>
    每个月底看一次，把最高的那一科在下个月加一天（在 data/plan-config.js 的 rotation 里改星期几）。</p>`;

  $("statsBox").innerHTML = html;
}
