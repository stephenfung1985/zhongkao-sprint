/* ============================================================
   exam.js — 试卷深度解析系统
   流程闭环：试卷录入 → 错因深挖 → 举一反三 → 错题闭环 → 复盘总结 → 30分钟小卷验证
   核心原则：解决一道题，搞通一类型；杜绝似懂非懂再次踩坑。
   数据：与每日冲刺共用 storage.js 的同一份学习数据（DB.exams）。
   ============================================================ */
(function () {
  "use strict";

  const $ = id => document.getElementById(id);
  const todayStr = () => {
    const d = new Date();
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  };

  /* ---------------- 错因七类（深挖引导 + 对策） ---------------- */
  const ERROR_TYPES = {
    concept: { label: "概念不清", icon: "🧠",
      ask: "这个知识点的定义/原理，你能不看书写出来吗？你错在哪一步，说明哪部分没理解？",
      fix: "回课本把概念重读一遍 → 用自己的话讲一遍（讲给空气也行）→ 再做 3 道同类基础题验证。" },
    formula: { label: "公式/方法记错", icon: "📐",
      ask: "你用的是哪个公式/方法？写出来，和课本对照一下。是公式本身记错了，还是适用条件没满足？",
      fix: "把公式抄进错题本并标注适用条件 → 连续 3 天默写一遍 → 用 2 道题专门验证适用条件。" },
    reading: { label: "审题失误", icon: "👀",
      ask: "题目里「选正确的/错误的」「单位」「保留几位小数」「恰好/至少/一个」这些关键信息，你圈出来了吗？你漏看了哪一处？",
      fix: "养成圈关键词的习惯：读题用笔圈出单位、数字、限定词 → 下笔前先复述「这题要我求什么」→ 做完回看题干。" },
    calc: { label: "计算错误", icon: "🔢",
      ask: "错在哪个环节：抄错数字、进位/约分错、单位没统一、还是草稿太乱找不到错？",
      fix: "把「我粗心」改成「我在 XX 环节出错」→ 抄写后核对一遍 → 不跳步 → 先统一单位 → 草稿分区编号。" },
    method: { label: "方法不会", icon: "🧩",
      ask: "这类题你以前见过吗？第一反应是什么？卡在思路的哪一步？是没有入手点，还是中间某步没学过？",
      fix: "把这类题的「标准解题流程」记下来 → 用 3 道同类题套流程 → 记住这个题型模型，下次直接调用。" },
    time: { label: "时间不够", icon: "⏱️",
      ask: "这道题你实际花了多久？是前面哪道题耗了太多时间？整卷的节奏哪里乱了？",
      fix: "限时训练三原则：先易后难、单题超时即跳、最后统一回头 → 平时练速要比考试快 20%，考场才有检查余量。" },
    fuzzy: { label: "似懂非懂", icon: "🌫️",
      ask: "看答案觉得「我会」，但合上答案能做对吗？如果把数字、情境变一下，还能做对吗？",
      fix: "这是最危险的错因，必须用费曼技巧把过程讲一遍 + 做变式题验证，变式全对才算真懂。坚决不放过，否则下次必踩坑。" }
  };

  /* ---------------- 科目 ---------------- */
  const SUBJECTS = (function () {
    const meta = (typeof PLAN !== "undefined" && PLAN.subjectMeta) || {};
    return [
      { key: "math", name: (meta.math || {}).name || "数学" },
      { key: "english", name: (meta.english || {}).name || "英语" },
      { key: "physics", name: (meta.physics || {}).name || "物理" },
      { key: "chem", name: (meta.chem || {}).name || "化学" },
      { key: "chinese", name: (meta.chinese || {}).name || "语文" },
      { key: "politics", name: (meta.politics || {}).name || "道法" },
      { key: "history", name: (meta.history || {}).name || "历史" }
    ];
  })();

  /* ---------------- 状态 ---------------- */
  const state = {
    view: "home",
    editingId: null,          // 编辑中的试卷 id（null=新建）
    editingItems: [],         // 编辑器中的错题草稿
    pickRow: -1,              // 当前正在选题的编辑器行
    quizMode: null,           // "variant" | "test"
    quizExamId: null,
    quizItemIid: null,
    quizSubject: "",          // 当前练习的科目（供错题本联动）
    quizPoint: ""             // 当前练习的知识点
  };

  /* ============================================================
     题库工具
     ============================================================ */
  function allQuestions() {
    const out = [];
    Object.keys(window.LESSONS || {}).forEach(subject => {
      (window.LESSONS[subject] || []).forEach(lesson => {
        (lesson.quiz || []).forEach(q => {
          out.push({ q, subject, pt: q.pt || lesson.point || "", lessonId: lesson.id, lessonPoint: lesson.point || "" });
        });
      });
    });
    return out;
  }

  function pointsOf(subject) {
    const set = {};
    (window.LESSONS[subject] || []).forEach(lesson => {
      (lesson.quiz || []).forEach(q => { if (q.pt) set[q.pt] = 1; });
      if (lesson.point) set[lesson.point] = 1;
    });
    return Object.keys(set).sort();
  }

  function pointMatch(a, b) {
    if (!a || !b) return false;
    return a.indexOf(b) >= 0 || b.indexOf(a) >= 0;
  }

  /** 按知识点抽同类题（三级回退：同知识点 → 同课 → 同科），排除原题，最多 n 道 */
  function findVariants(subject, pt, excludeQid, n) {
    const all = allQuestions();
    const sameLesson = item => item.subject === subject && item.q.id !== excludeQid &&
      (item.lessonId === findLessonId(subject, excludeQid) || pointMatch(item.lessonPoint, pt));
    const pools = [
      all.filter(it => it.subject === subject && it.q.id !== excludeQid && pointMatch(it.pt, pt)),
      all.filter(sameLesson),
      all.filter(it => it.subject === subject && it.q.id !== excludeQid)
    ];
    const lvOrder = { 基础: 0, 中档: 1, 提高: 2 };
    const seen = {}, out = [];
    pools.forEach(pool => {
      if (out.length >= n) return;
      pool
        .sort((a, b) =>
          (lvOrder[a.q.lv] !== undefined ? lvOrder[a.q.lv] : 1) - (lvOrder[b.q.lv] !== undefined ? lvOrder[b.q.lv] : 1))
        .forEach(it => {
          if (out.length >= n) return;
          if (seen[it.q.id]) return;
          seen[it.q.id] = 1;
          out.push(it.q);
        });
    });
    return out;
  }

  function findLessonId(subject, qid) {
    if (!qid) return null;
    const hit = allQuestions().find(it => it.subject === subject && it.q.id === qid);
    return hit ? hit.lessonId : null;
  }

  function findQuestion(qid) {
    if (!qid) return null;
    const hit = allQuestions().find(it => it.q.id === qid);
    return hit ? hit.q : null;
  }

  /* ============================================================
     视图切换
     ============================================================ */
  function showView(name) {
    state.view = name;
    ["home", "editor", "detail"].forEach(v => {
      const el = $("view-" + v);
      if (el) el.style.display = v === name ? "block" : "none";
    });
    window.scrollTo(0, 0);
  }

  /* ============================================================
     首页：试卷列表
     ============================================================ */
  function renderHome() {
    const exams = DB.allExams();
    const stat = $("examStatRow");
    const list = $("examList");
    if (!stat || !list) return;

    const openItems = exams.reduce((n, e) => n + (e.items || []).filter(i => i.status !== "closed").length, 0);
    const needTest = exams.filter(e => e.status === "open" && (e.items || []).every(i => i.status === "closed")).length;
    const done = exams.filter(e => e.status === "closed").length;

    stat.innerHTML = `
      <div class="exam-stat"><div class="es-num">${exams.length}</div><div class="es-lab">已分析试卷</div></div>
      <div class="exam-stat"><div class="es-num">${openItems}</div><div class="es-lab">未闭环错题</div></div>
      <div class="exam-stat"><div class="es-num">${needTest}</div><div class="es-lab">待小卷验证</div></div>
      <div class="exam-stat"><div class="es-num">${done}</div><div class="es-lab">全部闭环</div></div>`;

    if (!exams.length) {
      list.innerHTML = `<div class="empty">
        <div class="empty-big">还没有试卷分析</div>
        <div class="empty-sub">孩子考完试，把做错的题录进来，系统会带你们：<br>
        深挖错误原因 → 举一反三变式题 → 逐题闭环 → 生成 30 分钟小卷验证效果。</div>
        <button class="btn-primary" id="emptyNew">＋ 录入第一套试卷</button>
      </div>`;
      const b = $("emptyNew");
      if (b) b.onclick = () => openEditor(null);
      return;
    }

    list.innerHTML = exams.map(e => {
      const items = e.items || [];
      const closed = items.filter(i => i.status === "closed").length;
      const pct = items.length ? Math.round(closed / items.length * 100) : 0;
      const badge = e.status === "closed"
        ? `<span class="exam-badge ok">✅ 已闭环</span>`
        : (items.every(i => i.status === "closed")
            ? `<span class="exam-badge warn">🧪 待小卷验证</span>`
            : `<span class="exam-badge">🔍 复盘中 ${closed}/${items.length}</span>`);
      return `<div class="exam-card" data-id="${esc(e.id)}">
        <div class="exam-card-main">
          <div class="exam-card-top">
            <span class="subject-chip">${esc(e.subjectName || "")}</span>
            <span class="exam-date">${esc(e.date || "")}</span>
            ${badge}
          </div>
          <div class="exam-card-title">${esc(e.title || "未命名试卷")}</div>
          <div class="exam-card-sub">${esc(e.source || "")}${e.score ? " · 成绩 " + esc(e.score) : ""} · 错题 ${items.length} 道</div>
          <div class="exam-bar"><div class="exam-bar-fill" style="width:${pct}%"></div></div>
        </div>
        <button class="btn-ghost exam-open" data-id="${esc(e.id)}">打开 →</button>
      </div>`;
    }).join("");

    list.querySelectorAll(".exam-card").forEach(card => {
      card.onclick = () => openDetail(card.getAttribute("data-id"));
    });
  }

  /* ============================================================
     编辑器：新建 / 编辑试卷
     ============================================================ */
  function openEditor(exam) {
    state.editingId = exam ? exam.id : null;
    showView("editor");
    $("editorTitle").textContent = exam ? "编辑试卷" : "新建试卷分析";

    // 科目下拉
    const sel = $("efSubject");
    sel.innerHTML = SUBJECTS.map(s =>
      `<option value="${s.key}" ${exam && exam.subject === s.key ? "selected" : ""}>${esc(s.name)}</option>`).join("");

    $("efTitle").value = exam ? (exam.title || "") : "";
    $("efDate").value = exam ? (exam.date || todayStr()) : todayStr();
    $("efScore").value = exam ? (exam.score || "") : "";
    const src = $("efSource");
    src.value = exam && exam.source ? exam.source : "学校测验";

    state.editingItems = exam && exam.items
      ? exam.items.map(i => ({
          iid: i.iid, qid: i.qid || null, stem: i.stem || "",
          userAnswer: i.userAnswer || "", correctAnswer: i.correctAnswer || "",
          errorType: i.errorType || "", errorNote: i.errorNote || "",
          explain: i.explain || "", trap: i.trap || "", deep: i.deep || "", type: i.type || "choice"
        }))
      : [];
    renderEditorItems();
  }

  function renderEditorItems() {
    const box = $("editorItems");
    if (!box) return;
    if (!state.editingItems.length) {
      box.innerHTML = `<div class="tiny empty-sub">还没有错题，点右上角「＋ 添加一道错题」开始录入。</div>`;
      return;
    }
    box.innerHTML = state.editingItems.map((it, idx) => {
      const errOpts = Object.keys(ERROR_TYPES).map(k =>
        `<option value="${k}" ${it.errorType === k ? "selected" : ""}>${ERROR_TYPES[k].icon} ${ERROR_TYPES[k].label}</option>`).join("");
      return `<div class="exam-item-edit" data-idx="${idx}">
        <div class="eie-head">
          <span class="eie-no">错题 ${idx + 1}</span>
          <div class="eie-actions">
            ${it.qid ? `<span class="tagi src">题库题：${esc(it.qid)}</span>` : `<span class="tagi src">手动录入</span>`}
            <button class="btn-ghost" data-pick="${idx}">从题库选</button>
            <button class="btn-ghost danger" data-del="${idx}">删除</button>
          </div>
        </div>
        <label class="eie-field">题目
          <textarea rows="2" data-f="stem" placeholder="${it.qid ? "已从题库带入，可直接修改" : "把错题的题目原文贴进来"}">${esc(it.stem)}</textarea>
        </label>
        <div class="eie-row">
          <label>孩子选的答案<input data-f="userAnswer" value="${esc(it.userAnswer)}" placeholder="如：B"></label>
          <label>正确答案<input data-f="correctAnswer" value="${esc(it.correctAnswer)}" placeholder="如：C"></label>
        </div>
        <div class="eie-row">
          <label>错误原因（深挖）
            <select data-f="errorType">${errOpts}</select>
          </label>
          <label>原因备注（一句话说清错在哪）
            <input data-f="errorNote" value="${esc(it.errorNote)}" placeholder="如：漏看了『恰好』两个字">
          </label>
        </div>
        ${it.qid ? `<div class="eie-tip">💡 题库题会自动带上解析和易错点，举一反三变式题也能自动从课程库抽取。</div>`
                 : `<div class="eie-tip">📝 手动录入的题，举一反三会按你选择的错因类型从课程库抽取同类知识点题目。</div>`}
      </div>`;
    }).join("");

    box.querySelectorAll("button[data-pick]").forEach(b => {
      b.onclick = () => { state.pickRow = parseInt(b.getAttribute("data-pick"), 10); openPickModal(); };
    });
    box.querySelectorAll("button[data-del]").forEach(b => {
      b.onclick = () => {
        state.editingItems.splice(parseInt(b.getAttribute("data-del"), 10), 1);
        renderEditorItems();
      };
    });
    // 输入绑定
    box.querySelectorAll("input[data-f], select[data-f], textarea[data-f]").forEach(el => {
      el.oninput = () => {
        const idx = parseInt(el.closest(".exam-item-edit").getAttribute("data-idx"), 10);
        const f = el.getAttribute("data-f");
        if (state.editingItems[idx]) state.editingItems[idx][f] = el.value;
      };
    });
  }

  /* ---- 从课程库选题弹层 ---- */
  function openPickModal() {
    const modal = $("pickModal");
    const ptSel = $("pickPoint");
    const subject = $("efSubject").value;
    const pts = pointsOf(subject);
    ptSel.innerHTML = '<option value="">— 选择知识点 —</option>' +
      pts.map(p => `<option value="${esc(p)}">${esc(p)}</option>`).join("");
    $("pickQuestionList").innerHTML = `<div class="tiny empty-sub">先选知识点，下面会出现该知识点的所有题目。</div>`;
    modal.style.display = "flex";
  }

  function renderPickList() {
    const subject = $("efSubject").value;
    const pt = $("pickPoint").value;
    const box = $("pickQuestionList");
    if (!pt) { box.innerHTML = `<div class="tiny empty-sub">先选知识点。</div>`; return; }
    const list = allQuestions().filter(it => it.subject === subject && pointMatch(it.pt, pt));
    if (!list.length) { box.innerHTML = `<div class="tiny empty-sub">这个知识点下还没有题，试试其他知识点，或手动录入。</div>`; return; }
    box.innerHTML = list.map((it, i) => {
      const stemShort = it.q.stem.length > 70 ? it.q.stem.slice(0, 70) + "…" : it.q.stem;
      return `<div class="pick-q">
        <div class="pick-q-stem">${esc(stemShort)}</div>
        <div class="pick-q-meta"><span class="tagi lv">${esc(it.q.lv || "")}</span>
          <span class="tagi src">${esc(it.q.src || "")}</span>
          <span class="tagi">答案 ${esc(Array.isArray(it.q.answer) ? it.q.answer[0] : it.q.answer)}</span></div>
        <button class="btn-ghost" data-qid="${esc(it.q.id)}">选这道 →</button>
      </div>`;
    }).join("");
    box.querySelectorAll("button[data-qid]").forEach(b => {
      b.onclick = () => {
        const q = findQuestion(b.getAttribute("data-qid"));
        if (q && state.editingItems[state.pickRow]) {
          const it = state.editingItems[state.pickRow];
          it.qid = q.id;
          it.stem = q.stem;
          it.type = q.type || "choice";
          it.correctAnswer = Array.isArray(q.answer) ? q.answer[0] : q.answer;
          it.explain = q.explain || "";
          it.trap = q.trap || "";
          it.deep = q.deep || "";
          $("pickModal").style.display = "none";
          renderEditorItems();
        }
      };
    });
  }

  /* ---- 保存试卷 ---- */
  function saveEditor() {
    const subject = $("efSubject").value;
    const title = $("efTitle").value.trim();
    if (!title) { alert("请填写试卷标题"); return; }
    const date = $("efDate").value || todayStr();
    const items = state.editingItems
      .filter(i => i.stem && i.stem.trim())
      .map(i => ({
        iid: i.iid || "i" + Date.now().toString(36) + Math.floor(Math.random() * 1e4),
        qid: i.qid || null, stem: i.stem, type: i.type || "choice",
        userAnswer: i.userAnswer || "", correctAnswer: i.correctAnswer || "",
        errorType: i.errorType || "", errorNote: i.errorNote || "",
        explain: i.explain || "", trap: i.trap || "", deep: i.deep || "",
        variants: [], variantResults: {}, variantStatus: "pending",
        status: "open", closedAt: null
      }));
    if (!items.length) { alert("至少录入一道错题"); return; }

    const subjectName = (SUBJECTS.find(s => s.key === subject) || {}).name || subject;
    const now = new Date().toISOString();
    const exam = state.editingId
      ? Object.assign({}, DB.getExam(state.editingId) || {}, {
          subject, subjectName, title, date, source: $("efSource").value,
          score: $("efScore").value.trim(), items, updatedAt: now
        })
      : {
          id: "ex_" + Date.now().toString(36) + Math.floor(Math.random() * 1e4),
          subject, subjectName, title, date, source: $("efSource").value,
          score: $("efScore").value.trim(),
          items, summary: null, status: "open", test: null,
          createdAt: now, updatedAt: now
        };
    // 已闭环的题目保留原状态（编辑不倒退）
    const old = state.editingId ? DB.getExam(state.editingId) : null;
    if (old && old.items) {
      exam.items.forEach(ni => {
        const oi = old.items.find(o => o.iid === ni.iid);
        if (oi && oi.status === "closed") {
          ni.status = "closed"; ni.closedAt = oi.closedAt;
          ni.variants = oi.variants; ni.variantResults = oi.variantResults; ni.variantStatus = oi.variantStatus;
        }
      });
    }
    DB.saveExam(exam);
    openDetail(exam.id);
  }

  /* ============================================================
     详情工作台
     ============================================================ */
  function openDetail(id) {
    const exam = DB.getExam(id);
    if (!exam) { renderHome(); showView("home"); return; }
    state.editingId = id;
    showView("detail");
    renderDetail(exam);
  }

  function renderDetail(exam) {
    $("detailTitle").textContent = (exam.title || "试卷") + " · 复盘工作台";

    const items = exam.items || [];
    const closed = items.filter(i => i.status === "closed").length;
    const allClosed = items.length > 0 && closed === items.length;
    const pct = items.length ? Math.round(closed / items.length * 100) : 0;

    const meta = $("detailMeta");
    meta.innerHTML = `
      <div class="detail-meta-row">
        <span class="subject-chip">${esc(exam.subjectName || "")}</span>
        <span class="exam-date">${esc(exam.date || "")}</span>
        <span class="tagi">${esc(exam.source || "")}</span>
        ${exam.score ? `<span class="tagi">成绩 ${esc(exam.score)}</span>` : ""}
        <span class="exam-badge ${exam.status === "closed" ? "ok" : (allClosed ? "warn" : "")}">
          ${exam.status === "closed" ? "✅ 全部闭环" : (allClosed ? "🧪 待小卷验证" : "🔍 复盘中")}</span>
      </div>
      <div class="detail-goal">流程：每题「深挖错因 → 举一反三全对 → 确认闭环」；错题全部闭环后生成 30 分钟小卷，验证是真懂还是假懂。</div>`;

    const prog = $("closedProgress");
    prog.innerHTML = `
      <div class="cp-bar"><div class="cp-fill" style="width:${pct}%"></div></div>
      <div class="cp-text">错题闭环进度：<b>${closed} / ${items.length}</b>（${pct}%）</div>`;

    renderDetailItems(exam);
    renderReview(exam);
    renderTest(exam);
  }

  /* ---- 错题清单 ---- */
  function renderDetailItems(exam) {
    const box = $("detailItems");
    const items = exam.items || [];
    if (!items.length) {
      box.innerHTML = `<div class="tiny empty-sub">这套试卷没有录错题。</div>`;
      return;
    }
    box.innerHTML = items.map((it, idx) => {
      const et = ERROR_TYPES[it.errorType];
      const vs = it.variants || [];
      const doneV = Object.keys(it.variantResults || {}).length;
      const allOk = vs.length > 0 && vs.every(v => (it.variantResults || {})[v] && (it.variantResults)[v].ok);
      let vsBadge = "";
      if (it.status === "closed") vsBadge = `<span class="exam-badge ok">✅ 已闭环</span>`;
      else if (allOk) vsBadge = `<span class="exam-badge ok">✓ 变式全对</span>`;
      else if (doneV > 0) vsBadge = `<span class="exam-badge warn">变式 ${doneV}/${vs.length} 通过</span>`;
      else vsBadge = `<span class="exam-badge">○ 待做变式</span>`;

      return `<div class="exam-item" data-iid="${esc(it.iid)}">
        <div class="ei-head">
          <span class="eie-no">错题 ${idx + 1}</span>
          ${vsBadge}
        </div>
        <div class="ei-stem">${rich(it.stem || "")}</div>
        <div class="ei-answer-row">
          <span class="ei-bad">她选：${esc(it.userAnswer || "—")}</span>
          <span class="ei-good">正确：${esc(it.correctAnswer || "—")}</span>
          ${it.pt ? `<span class="tagi pt">${esc(it.pt)}</span>` : ""}
        </div>
        <div class="ei-why">
          <span class="tagi lv">${et ? et.icon + " " + et.label : "未选错因"}</span>
          ${it.errorNote ? `<span class="ei-note">${esc(it.errorNote)}</span>` : ""}
        </div>
        ${it.qid && (it.explain || it.trap) ? `
        <details class="ei-expl">
          <summary>查看解析（含易错点）</summary>
          <div class="ei-expl-body">
            ${rich(it.explain || "")}
            ${it.trap ? `<span class="trap">⚠️ <b>这题的坑：</b>${rich(it.trap)}</span>` : ""}
            ${it.deep ? `<div class="ei-deep">🔍 <b>延伸：</b>${rich(it.deep)}</div>` : ""}
          </div>
        </details>` : ""}
        <div class="ei-actions">
          <button class="btn-ghost" data-act="deep" data-iid="${esc(it.iid)}">${et ? "深挖" : "选错因"} ${et ? et.icon : ""}</button>
          <button class="btn-primary" data-act="variant" data-iid="${esc(it.iid)}" ${it.status === "closed" ? "disabled" : ""}>
            ${it.status === "closed" ? "已闭环" : (vs.length ? "重做举一反三" : "举一反三 →")}</button>
          <button class="btn-ghost ${allOk ? "ok" : ""}" data-act="close" data-iid="${esc(it.iid)}"
            ${it.status === "closed" ? "disabled" : ""}>
            ${it.status === "closed" ? "✓ 已闭环" : "确认闭环"}</button>
        </div>
        ${it.status !== "closed" && it.errorType === "fuzzy" ? `<div class="ei-warn">🌫️ 这道是「似懂非懂」——必须变式全对才能闭环，不许放过。</div>` : ""}
      </div>`;
    }).join("");

    box.querySelectorAll("button[data-act='deep']").forEach(b => {
      b.onclick = () => deepDive(exam, b.getAttribute("data-iid"));
    });
    box.querySelectorAll("button[data-act='variant']").forEach(b => {
      b.onclick = () => runVariants(exam, b.getAttribute("data-iid"));
    });
    box.querySelectorAll("button[data-act='close']").forEach(b => {
      b.onclick = () => confirmClose(exam, b.getAttribute("data-iid"));
    });
  }

  /* ---- 深挖错因 ---- */
  function deepDive(exam, iid) {
    const it = (exam.items || []).find(i => i.iid === iid);
    if (!it) return;
    const et = ERROR_TYPES[it.errorType] || ERROR_TYPES.concept;
    const html = `
      <div class="deep-card">
        <div class="deep-head">${et.icon} 深挖：${et.label}</div>
        <div class="deep-q">先别急着往下做，回答这个问题：<br><b>${et.ask}</b></div>
        <div class="deep-fix">🔧 对策：${et.fix}</div>
        ${it.errorNote ? `<div class="deep-note">📝 你记下的原因：${esc(it.errorNote)}</div>` : ""}
        <div class="deep-next">想清楚后，点「举一反三」做变式题验证——变式全对，这道题才算真会。</div>
      </div>`;
    openQuizModal("深挖 · 错误原因", html, null, () => {});
  }

  /* ---- 举一反三（变式练习，复用 Quiz 引擎） ---- */
  function runVariants(exam, iid) {
    const it = (exam.items || []).find(i => i.iid === iid);
    if (!it) return;
    let vs = (it.variants || []).map(findQuestion).filter(Boolean);
    if (vs.length < 2) {
      // 重新抽取 3 道同类题
      vs = findVariants(exam.subject, it.pt || it.errorType, it.qid, 3);
      it.variants = vs.map(q => q.id);
      DB.saveExam(exam);
    }
    if (!vs.length) {
      openQuizModal("举一反三", `<div class="deep-card">
        <div class="deep-head">📚 题库里暂时没有这个知识点的同类题</div>
        <div class="deep-fix">先确认错因并看解析，把这个知识点记进错题本（平台会自动安排复现），
        或回到每日冲刺对应课程把这一课重学一遍。</div></div>`, null, () => {});
      return;
    }
    state.quizMode = "variant";
    state.quizExamId = exam.id;
    state.quizItemIid = iid;
    state.quizSubject = exam.subject;
    state.quizPoint = it.pt || "";
    const title = "举一反三 · 搞通「" + (it.pt || "这个类型") + "」";
    openQuizModal(title, `<div class="deep-card deep-head">这 ${vs.length} 道是同一知识点的变式题。
      全做对 = 真懂；错任何一道 = 还要回来补。${it.qid ? "（已排除你做错的原题）" : ""}</div>`,
      vs, function (result) {
        // 回写结果
        const cur = DB.getExam(state.quizExamId);
        if (!cur) return;
        const item = (cur.items || []).find(i => i.iid === state.quizItemIid);
        if (!item) return;
        item.variantResults = item.variantResults || {};
        vs.forEach((q, i) => {
          const r = result.answers[i];
          item.variantResults[q.id] = { ok: !!r.ok, date: todayStr() };
        });
        const allOk = vs.every(q => item.variantResults[q.id] && item.variantResults[q.id].ok);
        item.variantStatus = allOk ? "passed" : "failed";
        DB.saveExam(cur);
        renderDetail(cur);
        if (allOk) {
          const t = $("quizResult");
          if (t) t.innerHTML = `<div class="test-pass">🎉 变式全对！这道题的类型你搞通了。现在可以点「确认闭环」。</div>`;
        } else {
          const t = $("quizResult");
          if (t) t.innerHTML = `<div class="test-fail">还有错的。别急着闭环——看看错在哪，重做一遍；如果反复错，
            说明这个知识点还没真懂，回到每日冲刺对应课程重新学。</div>`;
        }
      });
  }

  /* ---- 确认闭环 ---- */
  function confirmClose(exam, iid) {
    const it = (exam.items || []).find(i => i.iid === iid);
    if (!it) return;
    const vs = it.variants || [];
    const allOk = vs.length > 0 && vs.every(v => (it.variantResults || {})[v] && it.variantResults[v].ok);
    if (!allOk) {
      alert("先把举一反三变式题全部做对，才能闭环——这是为了防止「似懂非懂」。");
      return;
    }
    if (!confirm("确认这道错题已经搞通了吗？（变式已全对）")) return;
    it.status = "closed";
    it.closedAt = todayStr();
    DB.saveExam(exam);
    renderDetail(exam);
  }

  /* ---- 复盘总结 ---- */
  function renderReview(exam) {
    const card = $("reviewCard");
    const body = $("reviewBody");
    if (!card || !body) return;
    if (!(exam.items || []).length) { card.style.display = "none"; return; }
    card.style.display = "block";
    if (!exam.summary) {
      body.innerHTML = `<div class="tiny empty-sub">错题闭环有进展后，点「生成复盘总结」查看这套试卷的错因分布和建议。</div>`;
      return;
    }
    body.innerHTML = exam.summary.html || "";
  }

  function genReview(exam) {
    const items = exam.items || [];
    const errCount = {};
    const ptCount = {};
    items.forEach(i => {
      const k = i.errorType || "concept";
      errCount[k] = (errCount[k] || 0) + 1;
      const p = i.pt || "未归类知识点";
      ptCount[p] = (ptCount[p] || 0) + 1;
    });
    const total = items.length;
    const maxErr = Math.max(1, ...Object.values(errCount));
    const maxPt = Math.max(1, ...Object.values(ptCount));

    const errBars = Object.keys(errCount).map(k => {
      const et = ERROR_TYPES[k] || { label: k, icon: "❓" };
      const n = errCount[k];
      const w = Math.round(n / maxErr * 100);
      return `<div class="rv-row">
        <div class="rv-lab">${et.icon} ${et.label}</div>
        <div class="rv-bar"><div class="rv-fill" style="width:${w}%"></div></div>
        <div class="rv-num">${n} 题</div>
      </div>`;
    }).join("");

    const ptBars = Object.keys(ptCount).sort((a, b) => ptCount[b] - ptCount[a]).slice(0, 6).map(p => {
      const n = ptCount[p];
      const w = Math.round(n / maxPt * 100);
      return `<div class="rv-row">
        <div class="rv-lab pt">${esc(p)}</div>
        <div class="rv-bar"><div class="rv-fill pt" style="width:${w}%"></div></div>
        <div class="rv-num">${n} 题</div>
      </div>`;
    }).join("");

    // 主攻建议
    const mainErr = Object.keys(errCount).sort((a, b) => errCount[b] - errCount[a])[0];
    const et = ERROR_TYPES[mainErr] || ERROR_TYPES.concept;
    const mainPt = Object.keys(ptCount).sort((a, b) => ptCount[b] - ptCount[a])[0] || "";
    const closed = items.filter(i => i.status === "closed").length;

    const html = `
      <div class="rv-section">
        <div class="rv-title">📊 错误原因分布</div>
        ${errBars}
      </div>
      <div class="rv-section">
        <div class="rv-title">🎯 知识点薄弱分布</div>
        ${ptBars}
      </div>
      <div class="rv-section rv-advice">
        <div class="rv-title">💡 本卷复盘结论</div>
        <div>这套试卷共 <b>${total}</b> 道错题，已闭环 <b>${closed}</b> 道。
        最集中的错因是 <b>${et.icon} ${et.label}</b>（${errCount[mainErr]} 道），
        最薄弱的知识点是 <b>${esc(mainPt)}</b>。</div>
        <div class="rv-fix">针对 ${et.label}：${et.fix}</div>
        <div class="rv-fix">针对 ${esc(mainPt)}：回到每日冲刺对应课程重新学一遍 → 再做变式题验证。
        建议 ${closed === total ? "现在可以生成 30 分钟小卷做最终验证。" : "把剩余 " + (total - closed) + " 道错题闭环后，再生成小卷做最终验证。"}</div>
      </div>`;

    exam.summary = { html, generatedAt: todayStr() };
    DB.saveExam(exam);
    renderDetail(exam);
  }

  /* ---- 30分钟小卷测验 ---- */
  function renderTest(exam) {
    const card = $("testCard");
    const body = $("testBody");
    if (!card || !body) return;
    const items = exam.items || [];
    const allClosed = items.length > 0 && items.every(i => i.status === "closed");

    if (!allClosed) {
      card.style.display = "block";
      body.innerHTML = `<div class="tiny empty-sub">⏳ 错题全部闭环后（${items.filter(i => i.status === "closed").length}/${items.length}），
        这里会自动解锁「30 分钟小卷测验」，验证是不是真懂了。</div>`;
      return;
    }
    card.style.display = "block";

    if (!exam.test) {
      body.innerHTML = `<div class="test-ready">
        <div class="test-ready-title">🧪 30 分钟小卷测验已解锁</div>
        <div class="test-ready-sub">从这套试卷的薄弱知识点中抽取变式题，30 分钟限时完成。
        得分 ≥ 80% 才算这套试卷真正闭环；低于 80% 说明还有似懂非懂，重点巩固后可重测。</div>
        <button class="btn-primary" id="btnStartTest">开始 30 分钟小卷 →</button>
      </div>`;
      const b = $("btnStartTest");
      if (b) b.onclick = () => startTest(exam);
      return;
    }

    const t = exam.test;
    const passed = t.passed;
    body.innerHTML = `
      <div class="test-result ${passed ? "test-pass" : "test-fail"}">
        <div class="tr-big">${passed ? "🎉 通过！这套试卷真正闭环了" : "📖 未达标，需要再巩固"}</div>
        <div class="tr-sub">${t.date} · ${t.questions.length} 题 · 得分 ${t.score} 分（${Math.round(t.score / t.questions.length * 100)}%）
          · 用时 ${Math.round(t.seconds / 60)} 分钟</div>
        ${passed
          ? `<div class="tr-fix">错误原因已被变式题验证清除，这套试卷的错题可以正式毕业了。继续下一套！</div>`
          : `<div class="tr-fix">低于 80%，说明还有「似懂非懂」。建议：回到错题对应的课程重新学 → 重做举一反三 → 再测一次。</div>`}
        <button class="btn-primary" id="btnRetest">${passed ? "再做一套巩固卷" : "重测一次"}</button>
      </div>`;
    const b = $("btnRetest");
    if (b) b.onclick = () => startTest(exam);
  }

  function startTest(exam) {
    // 生成测验题：每个已闭环错题的知识点抽题，总量 12-16 道
    const closedItems = (exam.items || []).filter(i => i.status === "closed");
    const qs = [];
    const used = {};
    const pick = (subject, pt, n) => {
      const vs = findVariants(subject, pt, null, n).filter(q => !used[q.id]);
      vs.forEach(q => { used[q.id] = 1; qs.push(q); });
      return vs.length;
    };
    // 每知识点 2 道优先，然后轮流补到 12-16
    closedItems.forEach(it => pick(exam.subject, it.pt, 2));
    let guard = 0;
    while (qs.length < 12 && guard++ < 10) {
      let added = 0;
      closedItems.forEach(it => { added += pick(exam.subject, it.pt, 1); });
      if (!added) break;
    }
    if (qs.length < 6 && closedItems.length) {
      // 知识点太偏，从同科其他题补
      const others = allQuestions().filter(it => it.subject === exam.subject && !used[it.q.id]);
      others.slice(0, 12 - qs.length).forEach(it => { used[it.q.id] = 1; qs.push(it.q); });
    }
    if (!qs.length) { alert("找不到可用的测验题，请先确认课程库有该科目的题目。"); return; }
    const finalQs = qs.slice(0, 16);

    state.quizMode = "test";
    state.quizExamId = exam.id;
    state.quizItemIid = null;
    state.quizSubject = exam.subject;
    state.quizPoint = "";
    openQuizModal("30 分钟小卷 · " + finalQs.length + " 题", "", finalQs, result => {
      const cur = DB.getExam(state.quizExamId);
      if (!cur) return;
      const score = Math.round(result.right / result.total * 100);
      const passed = result.right / result.total >= 0.8;
      cur.test = {
        date: todayStr(),
        questions: finalQs.map(q => q.id),
        total: result.total, right: result.right,
        score, passed,
        seconds: state.testSeconds || 1800
      };
      DB.saveExam(cur);
      renderDetail(cur);
    });
  }

  /* ============================================================
     弹层（深挖 / 举一反三 / 小测验）
     ============================================================ */
  let testTimerId = null;
  function openQuizModal(title, headHtml, questions, onDone) {
    const modal = $("quizModal");
    $("quizModalTitle").textContent = title;
    const timerEl = $("quizTimer");
    const counterEl = $("quizCounter");
    const bodyEl = $("quizBody");
    const resultEl = $("quizResult");

    // 清掉上一次的计时器
    if (testTimerId) { clearInterval(testTimerId); testTimerId = null; }

    if (state.quizMode === "test" && questions && questions.length) {
      timerEl.style.display = "inline";
      let remain = 30 * 60;
      testTimerId = setInterval(() => {
        remain--;
        if (remain <= 0) { remain = 0; clearInterval(testTimerId); testTimerId = null; }
        timerEl.textContent = Math.floor(remain / 60) + ":" + String(remain % 60).padStart(2, "0");
        if (remain === 0) {
          // 时间到：强制结束
          if (typeof Quiz !== "undefined" && Quiz._forceFinish) Quiz._forceFinish();
        }
      }, 1000);
      timerEl.textContent = "30:00";
    } else {
      timerEl.style.display = "none";
    }

    modal.style.display = "flex";
    // 说明区独立于做题区，避免被 Quiz.start 清掉
    if (headHtml) {
      let intro = document.getElementById("quizIntro");
      if (!intro) {
        intro = document.createElement("div");
        intro.id = "quizIntro";
        if (counterEl && counterEl.parentNode) counterEl.parentNode.insertBefore(intro, counterEl.nextSibling);
      }
      intro.innerHTML = headHtml;
    } else if (typeof document !== "undefined") {
      const intro = document.getElementById("quizIntro");
      if (intro) intro.innerHTML = "";
    }
    if (questions && questions.length && typeof Quiz !== "undefined") {
      counterEl.textContent = "";
      resultEl.style.display = "none";
      // 测验模式：需要倒计时强制收卷——给 Quiz 加一个可选的强制结束钩子
      if (state.quizMode === "test") {
        Quiz._forceFinish = null;
        runTimedQuiz(questions, bodyEl, counterEl, resultEl, onDone);
      } else {
        resultEl.innerHTML = "";
        Quiz.start(questions, bodyEl, counterEl,
          { subject: state.quizSubject || "", point: state.quizPoint || "" }, result => {
          resultEl.style.display = "block";
          if (onDone) onDone(result);
        });
      }
    }
  }

  /** 限时测验渲染（30分钟到点自动收卷判分） */
  function runTimedQuiz(questions, boxEl, counterEl, resultEl, onDone) {
    let idx = 0;
    const result = { total: questions.length, right: 0, wrong: [], answers: [] };
    let finished = false;

    function render() {
      if (finished) return;
      if (idx >= questions.length) { finish(); return; }
      const q = questions[idx];
      if (counterEl) counterEl.textContent = "第 " + (idx + 1) + " / " + questions.length + " 题";
      const wrap = document.createElement("div");
      wrap.className = "q";
      let html = `<div class="q-meta">
          <span class="tagi pt">${esc(q.pt || "")}</span>
          <span class="tagi lv">${esc(q.lv || "")}</span>
        </div>
        <div class="q-stem">${rich(q.stem)}</div>`;
      if (q.type === "fill") {
        html += `<div class="q-fill"><input type="text" id="tFill" autocomplete="off" placeholder="${esc(q.ph || "在这里写答案")}">
          <button class="btn-primary" id="tSubmit">确定</button></div>`;
      } else {
        html += `<div class="q-opts" id="tOpts"></div>`;
      }
      html += `<div id="tFb"></div>`;
      wrap.innerHTML = html;
      boxEl.innerHTML = "";
      boxEl.appendChild(wrap);

      if (q.type === "fill") {
        const inp = wrap.querySelector("#tFill");
        wrap.querySelector("#tSubmit").onclick = () => judge(q, wrap, inp.value, false);
        inp.onkeydown = e => { if (e.key === "Enter") judge(q, wrap, inp.value, false); };
        setTimeout(() => inp.focus(), 50);
      } else {
        const optBox = wrap.querySelector("#tOpts");
        q.options.forEach(txt => {
          const b = document.createElement("button");
          b.className = "opt";
          b.innerHTML = rich(txt);
          b.onclick = () => judge(q, wrap, txt.trim()[0], true);
          optBox.appendChild(b);
        });
      }
    }

    function judge(q, wrap, given, isChoice) {
      if (finished) return;
      let ok = false;
      if (isChoice) {
        ok = given === String(q.answer).trim()[0];
        wrap.querySelectorAll(".opt").forEach(b => {
          b.disabled = true;
          if (b.textContent.trim()[0] === String(q.answer).trim()[0]) b.classList.add("picked-ok");
        });
        const btn = Array.from(wrap.querySelectorAll(".opt")).find(b => b.textContent.trim()[0] === given);
        if (btn && !ok) btn.classList.add("picked-no");
      } else {
        const accepted = Array.isArray(q.answer) ? q.answer : [q.answer];
        ok = accepted.some(a => norm(a) === norm(given));
        wrap.querySelector("#tFill").disabled = true;
        wrap.querySelector("#tSubmit").disabled = true;
      }
      result.answers.push({ id: q.id, ok, given });
      if (ok) {
        result.right++;
        // 答对 = 一次成功复现（若这题曾在错题本里）
        if (typeof DB !== "undefined" && DB.promoteWrong) DB.promoteWrong(q.id);
      } else {
        result.wrong.push(q.id);
        // 小卷里还错 = 真实漏洞，进全局错题本自动安排复现
        if (typeof DB !== "undefined" && DB.addWrong) {
          DB.addWrong(q, state.quizSubject || "", q.pt || state.quizPoint || "");
        }
      }

      const ansTxt = Array.isArray(q.answer) ? q.answer[0] : q.answer;
      const fb = wrap.querySelector("#tFb");
      fb.innerHTML = `<div class="explain ${ok ? "right" : "wrong"}">
        <span class="lab">${ok ? "✓ 对了" : "✗ 错了 —— 答案是 " + esc(ansTxt)}</span>
        ${rich(q.explain || "")}
        ${q.trap ? `<span class="trap">⚠️ <b>这题的坑：</b>${rich(q.trap)}</span>` : ""}
      </div>
      <div class="q-actions"><button class="btn-primary" id="tNext">${idx + 1 >= questions.length ? "交卷看结果 →" : "下一题 →"}</button></div>`;
      fb.querySelector("#tNext").onclick = () => { idx++; render(); };
      wrap.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    function finish() {
      if (finished) return;
      finished = true;
      if (testTimerId) { clearInterval(testTimerId); testTimerId = null; }
      const pct = Math.round(result.right / result.total * 100);
      resultEl.style.display = "block";
      resultEl.innerHTML = `<div class="test-result ${pct >= 80 ? "test-pass" : "test-fail"}">
        <div class="tr-big">${pct >= 80 ? "🎉 " + result.right + "/" + result.total + "，达标！" : "📖 " + result.right + "/" + result.total + "，未达标"}</div>
        <div class="tr-sub">得分 ${pct} 分（≥80 分算通过）</div>
        ${pct >= 80
          ? `<div class="tr-fix">这套试卷的错题经过变式验证 + 小卷测验双重检验，真正闭环了。可以放心下一套！</div>`
          : `<div class="tr-fix">还有 ${result.total - result.right} 道没做对，说明这个知识点还没真懂。
            建议：回到对应课程重学 → 重做举一反三 → 再测一次。别急着放过，下次考试还会踩坑。</div>`}
      </div>`;
      if (onDone) onDone(result);
    }

    // 超时强制收卷钩子
    if (typeof Quiz !== "undefined") {
      Quiz._forceFinish = () => {
        // 把剩余未答的记为错，直接收卷
        while (idx < questions.length) {
          result.answers.push({ id: questions[idx].id, ok: false, given: "" });
          result.wrong.push(questions[idx].id);
          idx++;
        }
        finish();
      };
    }
    render();
  }

  /* ============================================================
     顶部工具
     ============================================================ */
  function bindTheme() {
    const btn = $("themeBtn");
    const THEME_KEY = "zk2027_theme";
    function apply() {
      const t = document.documentElement.getAttribute("data-theme") || "light";
      document.documentElement.setAttribute("data-theme", t === "dark" ? "light" : "dark");
      try { localStorage.setItem(THEME_KEY, document.documentElement.getAttribute("data-theme")); } catch (e) {}
    }
    if (btn) btn.onclick = apply;
  }

  function bindCountdown() {
    const el = $("cdDays");
    if (!el) return;
    try {
      const exam = new Date((typeof PLAN !== "undefined" && PLAN.examDate ? PLAN.examDate : "2027-06-20") + "T00:00:00");
      const days = Math.ceil((exam - new Date()) / 86400000);
      el.textContent = days > 0 ? days : 0;
    } catch (e) { el.textContent = "--"; }
  }

  function bindFooter() {
    $("btnExport").onclick = () => DB.exportJSON();
    $("btnImport").onclick = () => $("fileImport").click();
    $("fileImport").onchange = e => {
      const f = e.target.files[0];
      if (!f) return;
      const r = new FileReader();
      r.onload = () => { if (DB.importJSON(r.result)) renderHome(); };
      r.readAsText(f);
    };
  }

  /* ============================================================
     初始化
     ============================================================ */
  function init() {
    bindTheme();
    bindCountdown();
    bindFooter();

    $("btnNewExam").onclick = () => openEditor(null);
    $("btnAddItem").onclick = () => {
      state.editingItems.push({
        iid: "i" + Date.now().toString(36) + Math.floor(Math.random() * 1e4),
        qid: null, stem: "", userAnswer: "", correctAnswer: "",
        errorType: "fuzzy", errorNote: "", explain: "", trap: "", deep: "", type: "choice"
      });
      renderEditorItems();
    };
    $("btnSaveExam").onclick = saveEditor;
    $("btnDelExam").onclick = () => {
      if (!state.editingId) return;
      if (!confirm("删除这套试卷的分析记录？不可恢复。")) return;
      DB.removeExam(state.editingId);
      renderHome();
      showView("home");
    };
    $("btnGenReview").onclick = () => {
      const exam = DB.getExam(state.editingId);
      if (exam) genReview(exam);
    };

    // 返回按钮
    document.querySelectorAll("[data-back='home']").forEach(b => {
      b.onclick = () => { renderHome(); showView("home"); };
    });

    // 选题弹层
    $("pickClose").onclick = () => { $("pickModal").style.display = "none"; };
    $("pickPoint").onchange = renderPickList;
    $("pickModal").onclick = e => { if (e.target === $("pickModal")) $("pickModal").style.display = "none"; };

    // 测验/变式弹层
    $("quizClose").onclick = () => {
      if (testTimerId) { clearInterval(testTimerId); testTimerId = null; }
      $("quizModal").style.display = "none";
      // 若有未回写的结果，刷新详情
      if (state.editingId) renderDetail(DB.getExam(state.editingId));
    };
    $("quizModal").onclick = e => { if (e.target === $("quizModal")) $("quizClose").onclick(); };

    // 磁盘同步初始化（静默，失败不影响使用）
    if (typeof DB !== "undefined" && DB.init) {
      DB.init().then(() => {}).catch(() => {});
    }

    renderHome();
    showView("home");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
