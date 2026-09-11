/* ============================================================
   vocab.js — 一周背单词计划 + 奖励机制

   计划：周一到周六每天 16 个新词（约 10 分钟），周日不学新词，
         全周 96 词随机抽 30 道闯关。下一周同样 96 个词，但考法升一级。

   奖励机制的三条设计原则（别改坏了）：
     1. 只加分，不扣分。答错不减词力值，只让这个词更快再来找你。
        —— 目的是让她愿意点开，而不是怕点开。
     2. 星星按「今天有没有做」给，不按「聪明不聪明」给。
        做完就有 1 星，正确率 80% 给 2 星，全对且清完欠账才 3 星。
     3. 断一天不清零。漏掉的那天可以补做，但补做最多 2 星 ——
        补得回损失，补不回「当天就做」的那一颗，代价温和但真实。

   奖励文案（12★/16★/19★ 三档）由家长在界面上自己填，
   存在 学习数据/学习记录.json 里，换电脑不会丢。
   ============================================================ */
const Vocab = (function () {

  const KEY = "vocab";
  const BOX_DAYS = [1, 2, 4, 7, 15];      // 艾宾浩斯：答对一次往后推一格
  const WEEK_STAR_MAX = 21;               // 7 天 × 3 星

  const LEVELS = [
    { at: 0,    name: "词汇新兵" },
    { at: 300,  name: "词汇学徒" },
    { at: 800,  name: "词汇匠人" },
    { at: 1600, name: "词汇达人" },
    { at: 2800, name: "词汇宗师" }
  ];

  const BADGES = [
    { id: "first",   icon: "🌱", name: "开张大吉", cond: "第一次完成一天背词" },
    { id: "star3",   icon: "⭐", name: "满星日",   cond: "单日拿满 3 颗星" },
    { id: "combo10", icon: "🔥", name: "连击王",   cond: "单场连对 10 题" },
    { id: "perfect", icon: "🎯", name: "零失误",   cond: "单场闯关一道不错" },
    { id: "payback", icon: "🧹", name: "清账人",   cond: "把当天所有回炉词全部答对" },
    { id: "week7",   icon: "📅", name: "七日不断", cond: "一周 7 天全部完成" },
    { id: "champ",   icon: "🏆", name: "周冠军",   cond: "一周拿到 18 星以上" },
    { id: "round2",  icon: "✍️", name: "二周目",   cond: "升到第 2 轮 · 会拼" },
    { id: "round3",  icon: "🕶️", name: "盲拼者",   cond: "升到第 3 轮 · 盲拼" },
    { id: "master",  icon: "👑", name: "词汇宗师", cond: "词力值达到 2800" }
  ];

  const DEFAULT_REWARDS = [
    { stars: 12, text: "周末多一小时自由时间，她自己安排，不问用途" },
    { stars: 16, text: "一顿她点的饭，或者一次她想看的电影" },
    { stars: 19, text: "一件她惦记很久的东西（金额提前说好）" }
  ];

  /* ============================================================
     状态：整块存在 DB.settings.vocab 里，跟着 学习记录.json 一起落盘
     ============================================================ */
  function blank() {
    return {
      v: 1,
      points: 0,
      round: 0,          // 当前轮次（0 认脸 / 1 会拼 / 2 盲拼）
      weekNo: 0,
      curWeek: "",       // 本周周一的日期，形如 2026-09-07
      weeks: {},         // weekKey: {no, round, days:{1..7:{stars,right,total,makeup,ts}}, claimed:{}}
      words: {},         // 单词: {box, right, wrong, nextDue}
      badges: {},        // badgeId: 获得日期
      rewards: null,     // 家长填的三档奖励，null 表示还没改过，用默认文案
      bestWeekStars: 0
    };
  }

  function st() {
    let s = DB.getSetting(KEY, null);
    if (!s || typeof s !== "object") { s = blank(); DB.setSetting(KEY, s); }
    return s;
  }
  function save(s) { DB.setSetting(KEY, s); }

  /* ---------------- 日期 / 周 ---------------- */
  function mondayOf(d) {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    x.setDate(x.getDate() - ((x.getDay() + 6) % 7));   // 周一 = 本周第 1 天
    return x;
  }
  function dayNoOf(d) { return (d.getDay() + 6) % 7 + 1; }   // 周一→1 … 周日→7
  const todayNo = () => dayNoOf(new Date());
  const todayStr = () => DB.fmt(new Date());

  /** 跨周时结算上一周，并决定轮次要不要升级 */
  function ensureWeek(s) {
    const wk = DB.fmt(mondayOf(new Date()));
    if (s.curWeek !== wk) {
      if (s.curWeek && s.weeks[s.curWeek]) settleWeek(s, s.curWeek);
      s.weekNo = (s.weekNo || 0) + 1;
      s.curWeek = wk;
    }
    if (!s.weeks[wk]) s.weeks[wk] = { no: s.weekNo, round: s.round, days: {}, claimed: {} };
    return s.weeks[wk];
  }

  function settleWeek(s, wk) {
    const w = s.weeks[wk];
    if (!w || w.settled) return;
    const stars = weekStars(s, wk);
    const doneDays = Object.keys(w.days).length;
    if (doneDays >= 7) award(s, "week7");
    if (stars >= 18) award(s, "champ");
    if (stars > (s.bestWeekStars || 0)) s.bestWeekStars = stars;
    // 达标（≥12★）才升级考法；没达标就把同一轮再刷一遍，不惩罚、也不放水
    if (stars >= 12 && s.round < rounds().length - 1) {
      s.round++;
      if (s.round === 1) award(s, "round2");
      if (s.round === 2) award(s, "round3");
    }
    w.settled = true;
    w.finalStars = stars;
  }

  function weekStars(s, wk) {
    const w = s.weeks[wk];
    if (!w) return 0;
    return Object.values(w.days).reduce((n, d) => n + (d.stars || 0), 0);
  }

  /* ---------------- 词库 ---------------- */
  const rounds = () => (window.VOCAB_WEEK && VOCAB_WEEK.rounds) || [];
  const days = () => (window.VOCAB_WEEK && VOCAB_WEEK.days) || [];
  const dayOf = no => days().find(d => d.no === no) || null;

  let WORD_INDEX = null;
  function allWords() {
    if (!WORD_INDEX) {
      WORD_INDEX = [];
      days().forEach(d => (d.words || []).forEach(w => {
        if (!WORD_INDEX.some(x => x.w === w.w)) WORD_INDEX.push(Object.assign({ dayNo: d.no }, w));
      }));
    }
    return WORD_INDEX;
  }
  const wordByKey = k => allWords().find(w => w.w === k) || null;

  /** 到期该回炉的旧词（答错过、或到了艾宾浩斯的下一次见面时间） */
  function dueWords(s, limit, excludeDay) {
    const t = todayStr();
    const list = Object.keys(s.words)
      .filter(k => {
        const r = s.words[k];
        if (!r || !r.nextDue || r.nextDue > t) return false;
        const w = wordByKey(k);
        return w && (!excludeDay || w.dayNo !== excludeDay);
      })
      .sort((a, b) => (s.words[b].wrong || 0) - (s.words[a].wrong || 0))
      .map(wordByKey)
      .filter(Boolean);
    return limit ? list.slice(0, limit) : list;
  }

  function recWord(s, key, ok) {
    const r = s.words[key] || (s.words[key] = { box: 0, right: 0, wrong: 0, nextDue: null });
    const wasNew = !r.right && !r.wrong;
    if (ok) {
      r.right++;
      r.box = Math.min((r.box || 0) + 1, BOX_DAYS.length - 1);
    } else {
      r.wrong++;
      r.box = 0;
    }
    r.nextDue = DB.fmt(DB.addDays(new Date(), BOX_DAYS[r.box]));
    return { firstTime: wasNew && ok };
  }

  /* ---------------- 等级 / 徽章 ---------------- */
  function levelOf(points) {
    let i = 0;
    LEVELS.forEach((l, k) => { if (points >= l.at) i = k; });
    return { idx: i, cur: LEVELS[i], next: LEVELS[i + 1] || null };
  }
  function award(s, id) {
    if (!s.badges[id]) { s.badges[id] = todayStr(); return true; }
    return false;
  }
  const rewardTiers = s => (s.rewards && s.rewards.length ? s.rewards : DEFAULT_REWARDS);

  /* ---------------- 出题 ---------------- */
  function shuffle(a) {
    const r = a.slice();
    for (let i = r.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [r[i], r[j]] = [r[j], r[i]];
    }
    return r;
  }
  function pickType(mix) {
    const r = Math.random();
    let acc = 0;
    for (const k of ["e2c", "c2e", "cloze"]) {
      acc += mix[k] || 0;
      if (r < acc) return k;
    }
    return "e2c";
  }
  /** 首字母提示：give up → g _ _ _   u _ */
  function maskOf(word) {
    return word.split(" ")
      .map(p => p[0] + " " + "_ ".repeat(Math.max(0, p.length - 1)).trim())
      .join("   ");
  }
  const blankInEg = eg => eg.replace(/\*\*(.+?)\*\*/, "______");
  function egAnswer(eg) {
    const m = eg.match(/\*\*(.+?)\*\*/);
    return m ? m[1].replace(/[.,!?]$/, "") : null;
  }

  function mkQuestion(word, roundId, mix, pool, fromDue) {
    let type = pickType(mix);
    const ans = egAnswer(word.eg);
    if (type === "cloze" && !ans) type = "c2e";

    const q = { key: word.w, word, type, fromDue };
    if (type === "e2c") {
      const others = shuffle(pool.filter(x => x.w !== word.w)).slice(0, 3).map(x => x.cn);
      q.stem = `${word.w}　<span class="vw-pos">${word.pos}</span>`;
      q.ask = "它是什么意思？";
      q.options = shuffle([word.cn].concat(others));
      q.answer = [word.cn];
    } else if (type === "c2e") {
      q.stem = `${word.cn}　<span class="vw-pos">${word.pos}</span>`;
      q.ask = "写出这个英文单词";
      q.answer = [word.w];
      q.hint = maskOf(word.w);                       // 中译英永远给首字母，否则太狠
    } else {
      q.stem = blankInEg(word.eg);
      q.ask = "把句子填完整";
      q.answer = [ans];
      if (roundId !== "blind") q.hint = maskOf(ans); // 盲拼轮不给提示
    }
    return q;
  }

  function buildSession(s, dayNo) {
    const day = dayOf(dayNo);
    const round = rounds()[s.round] || rounds()[0];
    const isFinal = !!day.final;
    const pool = isFinal ? allWords() : day.words;
    const main = isFinal ? shuffle(allWords()).slice(0, 30) : day.words.slice();
    const due = isFinal ? [] : dueWords(s, 8, dayNo);

    const qs = shuffle(
      main.map(w => mkQuestion(w, round.id, round.mix, isFinal ? allWords() : pool, false))
        .concat(due.map(w => mkQuestion(w, round.id, round.mix, allWords(), true)))
    );

    return {
      dayNo, round, isFinal,
      makeup: dayNo < todayNo(),
      replay: !!(s.weeks[s.curWeek].days || {})[dayNo],
      qs, i: 0, right: 0, combo: 0, maxCombo: 0, gained: 0,
      dueTotal: due.length, dueRight: 0, wrongList: []
    };
  }

  /* ---------------- 英文发音（中文语音读英文很难听，单独走 en-US）---------------- */
  function say(text) {
    try {
      if (typeof Speech !== "undefined" && !Speech.isEnabled()) return;
      if (!("speechSynthesis" in window)) return;
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(String(text).replace(/\*\*/g, ""));
      const v = window.speechSynthesis.getVoices()
        .find(x => x.lang && x.lang.toLowerCase().startsWith("en"));
      if (v) u.voice = v;
      u.lang = "en-US";
      u.rate = 0.85;
      window.speechSynthesis.speak(u);
    } catch (e) {}
  }

  /* ============================================================
     渲染
     ============================================================ */
  let view = { name: "home", dayNo: null };
  let session = null;
  const box = () => document.getElementById("vocabBox");

  function render() {
    if (!window.VOCAB_WEEK) return;
    const s = st();
    ensureWeek(s);
    save(s);
    if (view.name === "learn") return renderLearn(s);
    if (view.name === "quiz") return renderQuiz(s);
    if (view.name === "result") return renderResult(s);
    renderHome(s);
  }

  /* ---------------- 首页 ---------------- */
  function renderHome(s) {
    const wk = s.curWeek, w = s.weeks[wk];
    const round = rounds()[s.round] || rounds()[0];
    const stars = weekStars(s, wk);
    const lv = levelOf(s.points);
    const tn = todayNo();

    const lvPct = lv.next
      ? Math.round((s.points - lv.cur.at) / (lv.next.at - lv.cur.at) * 100)
      : 100;

    let html = `
    <div class="vw-hero">
      <div class="vw-hero-top">
        <div>
          <div class="vw-week">第 ${w.no} 周 · ${esc(round.name)}</div>
          <div class="vw-round-desc">${esc(round.desc)}</div>
        </div>
        <div class="vw-points"><b>${s.points}</b><span>词力值</span></div>
      </div>
      <div class="vw-lv">
        <div class="vw-lv-row"><span>${esc(lv.cur.name)}</span>
          <span>${lv.next ? `再 ${lv.next.at - s.points} 分升「${esc(lv.next.name)}」` : "已是最高段位"}</span></div>
        <div class="vw-lv-track"><div class="vw-lv-fill" style="width:${Math.max(3, Math.min(100, lvPct))}%"></div></div>
      </div>
      <div class="vw-starline">
        <div class="vw-starnum">本周 <b>${stars}</b> / ${WEEK_STAR_MAX} ★</div>
        <div class="vw-starbar">${starDots(s, wk)}</div>
      </div>
    </div>

    <div class="vw-days">`;

    days().forEach(d => {
      const rec = w.days[d.no];
      const locked = d.no > tn;
      const cls = ["vw-day",
        rec ? "done" : "",
        d.no === tn ? "today" : "",
        locked ? "locked" : "",
        (!rec && !locked && d.no < tn) ? "missed" : ""].filter(Boolean).join(" ");
      html += `<div class="${cls}" ${locked ? "" : `data-day="${d.no}"`}>
        <div class="vw-day-no">${d.final ? "闯关" : "Day " + d.no}</div>
        <div class="vw-day-th">${esc(d.final ? "全周抽考" : d.theme.split(" · ")[0])}</div>
        <div class="vw-day-star">${rec ? "★".repeat(rec.stars) + "☆".repeat(3 - rec.stars)
          : locked ? "🔒" : d.no < tn ? "可补做" : "今天"}</div>
      </div>`;
    });
    html += `</div>`;

    /* ---- 今天该干什么 ---- */
    const today = dayOf(tn);
    const doneToday = w.days[tn];
    const due = dueWords(s, 8, tn).length;
    html += `<div class="vw-cta">
      <div class="vw-cta-head">${doneToday ? "今天已经完成 ✓" : "今天的任务"}</div>
      <div class="vw-cta-title">${esc(today.theme)}</div>
      <div class="vw-cta-sub">${esc(today.why)}</div>
      <div class="vw-cta-meta">
        <span>${today.final ? "随机 30 题" : today.words.length + " 个新词"}</span>
        ${due && !today.final ? `<span class="vw-due">+ ${due} 个回炉旧词</span>` : ""}
        <span>约 10 分钟</span>
      </div>
      <button class="btn-primary" id="vwStart">${doneToday ? "再练一遍（不再计分）" : today.final ? "开始周终闯关" : "开始背今天的词"}</button>
      ${doneToday ? `<p class="tiny" style="margin:8px 0 0">今天拿了 ${doneToday.stars} 星。加练只更新错词的复习时间，不重复给星和分 —— 免得为了刷分而刷分。</p>` : ""}
    </div>`;

    html += rewardHTML(s, stars);
    html += badgeHTML(s);
    html += rulesHTML(s);

    box().innerHTML = html;

    box().querySelectorAll("[data-day]").forEach(el => {
      el.onclick = () => enter(+el.dataset.day);
    });
    const b = document.getElementById("vwStart");
    if (b) b.onclick = () => enter(tn);
    bindReward(s);
  }

  function starDots(s, wk) {
    const w = s.weeks[wk];
    let out = "";
    for (let d = 1; d <= 7; d++) {
      const n = (w.days[d] || {}).stars || 0;
      for (let i = 1; i <= 3; i++) {
        out += `<i class="vw-dot ${i <= n ? "on" : ""}"></i>`;
      }
      if (d < 7) out += `<i class="vw-gap"></i>`;
    }
    return out;
  }

  /* ---------------- 奖励中心 ---------------- */
  function rewardHTML(s, stars) {
    const tiers = rewardTiers(s);
    const w = s.weeks[s.curWeek];
    let html = `<div class="section-t">奖励中心 · 本周 ${stars} ★</div>
      <div class="vw-rewards">`;
    tiers.forEach((t, i) => {
      const claimed = w.claimed["t" + i];
      const ok = stars >= t.stars;
      html += `<div class="vw-reward ${ok ? "ok" : ""} ${claimed ? "claimed" : ""}">
        <div class="vw-reward-star">${t.stars}★</div>
        <div class="vw-reward-body">
          <div class="vw-reward-text">${esc(t.text)}</div>
          <div class="vw-reward-state">${claimed ? "已兑换 · " + claimed
            : ok ? "已达标，可以找爸妈兑现了" : `还差 ${t.stars - stars} 颗星`}</div>
        </div>
        <button class="btn-ghost vw-claim" data-t="${i}" ${ok && !claimed ? "" : "disabled"}>${claimed ? "✓" : "兑换"}</button>
      </div>`;
    });
    html += `</div>
      <details class="vw-edit"><summary>家长设置：改这三档奖励</summary>
        <div class="vw-edit-body">
          <p class="tiny" style="margin:0 0 10px">奖励要她真的想要，否则星星就只是星星。建议：小奖当周兑现，大奖提前说好是什么，别临时加价也别赖账 —— 说话算数比奖励本身管用。</p>`;
    tiers.forEach((t, i) => {
      html += `<div class="vw-edit-row">
        <input type="number" min="1" max="21" value="${t.stars}" data-s="${i}" class="vw-in-star">
        <span class="tiny">★ 起</span>
        <input type="text" value="${esc(t.text)}" data-x="${i}" class="vw-in-text" placeholder="兑换什么">
      </div>`;
    });
    html += `<button class="btn-ghost" id="vwSaveReward">保存奖励设置</button>
      <button class="btn-ghost" id="vwResetReward">恢复默认</button>
      </div></details>`;
    return html;
  }

  function bindReward(s) {
    box().querySelectorAll(".vw-claim").forEach(b => {
      b.onclick = () => {
        const i = b.dataset.t;
        const s2 = st();
        s2.weeks[s2.curWeek].claimed["t" + i] = todayStr();
        save(s2);
        render();
        alert("已记账 ✓\n把这条拿给爸妈看，兑现它。\n\n（记录会跟着学习数据一起保存，赖不掉。）");
      };
    });
    const sv = document.getElementById("vwSaveReward");
    if (sv) sv.onclick = () => {
      const s2 = st();
      const tiers = [];
      box().querySelectorAll(".vw-in-text").forEach((el, i) => {
        const starEl = box().querySelector(`.vw-in-star[data-s="${i}"]`);
        tiers.push({
          stars: Math.max(1, Math.min(WEEK_STAR_MAX, parseInt(starEl.value, 10) || 12)),
          text: el.value.trim() || DEFAULT_REWARDS[i].text
        });
      });
      s2.rewards = tiers.sort((a, b) => a.stars - b.stars);
      save(s2);
      render();
    };
    const rs = document.getElementById("vwResetReward");
    if (rs) rs.onclick = () => { const s2 = st(); s2.rewards = null; save(s2); render(); };
  }

  /* ---------------- 徽章墙 / 规则 ---------------- */
  function badgeHTML(s) {
    const got = Object.keys(s.badges).length;
    let html = `<div class="section-t">徽章墙 ${got}/${BADGES.length}</div><div class="vw-badges">`;
    BADGES.forEach(b => {
      const d = s.badges[b.id];
      html += `<div class="vw-badge ${d ? "on" : ""}" title="${esc(b.cond)}">
        <div class="vw-badge-ic">${b.icon}</div>
        <div class="vw-badge-name">${esc(b.name)}</div>
        <div class="vw-badge-cond">${d ? d : esc(b.cond)}</div>
      </div>`;
    });
    return html + `</div>`;
  }

  function rulesHTML(s) {
    const known = Object.values(s.words).filter(w => (w.box || 0) >= 3).length;
    return `<div class="section-t">规则（一次讲清，之后不用再想）</div>
    <div class="bars vw-rules">
      <p><b>星星怎么来：</b>做完今天的闯关 = ★1；正确率 ≥ 80% = ★2；全对且回炉的旧词也全清 = ★3。
         一周满分 21 星。</p>
      <p><b>漏了一天怎么办：</b>不清零。这一周里任何一个过去的日子都能点进去补做，
         但补做最多 2 星 —— 补得回损失，补不回「当天就做」那一颗。</p>
      <p><b>词力值怎么涨：</b>答对 +2；这个词第一次答对再 +1；连对 3 个以上每题再 +1（连击）；
         做完一天 +5；满星日再 +10；周日闯关达标 +50。<b>答错不扣分</b>，只让这个词更快回来找你。</p>
      <p><b>考法会变难：</b>一周结束时拿到 12 星以上，下周升一级考法（认脸 → 会拼 → 盲拼）；
         没到 12 星就把同一轮再刷一遍。同样 96 个词，一个月里会被拷问四次。</p>
      <p style="margin-bottom:0"><b>现在的家底：</b>已经见过 ${Object.keys(s.words).length} 个词，
         其中 <b>${known}</b> 个进入长间隔复习（连对 3 次以上），历史最好周成绩 ${s.bestWeekStars || 0} ★。</p>
    </div>`;
  }

  /* ---------------- 进入某一天 ---------------- */
  function enter(dayNo) {
    const s = st();
    ensureWeek(s);
    const day = dayOf(dayNo);
    if (!day) return;
    session = buildSession(s, dayNo);
    view = { name: day.final ? "quiz" : "learn", dayNo };
    render();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  /* ---------------- 词卡学习 ---------------- */
  function renderLearn(s) {
    const day = dayOf(view.dayNo);
    const round = session.round;
    let html = `<div class="vw-bar">
        <button class="btn-ghost" id="vwBack">← 返回</button>
        <div class="vw-bar-t">Day ${day.no} · ${esc(day.theme)}</div>
        <div class="vw-bar-r">${esc(round.name)}</div>
      </div>
      <p class="tiny" style="margin:0 0 14px">${esc(day.why)}
        ${session.makeup ? "<br><b>这是补做，最多 2 星。</b>" : ""}
        ${session.replay ? "<br><b>今天已经完成过，这次是加练，不再计分。</b>" : ""}</p>
      <p class="tiny" style="margin:0 0 14px">先把 16 张卡翻一遍：<b>点卡片看意思</b>，点 🔊 听发音。
        不用背下来，看懂就行 —— 记忆发生在后面的闯关里，不在这里。</p>
      <div class="vw-cards">`;

    day.words.forEach((w, i) => {
      html += `<div class="vw-card" data-i="${i}">
        <div class="vw-card-w">${esc(w.w)} <span class="vw-pos">${esc(w.pos)}</span>
          <button class="vw-say" data-say="${esc(w.w)}">🔊</button></div>
        <div class="vw-card-back">
          <div class="vw-card-cn">${esc(w.cn)}</div>
          <div class="vw-card-eg">${rich(w.eg)}</div>
          <div class="vw-card-tip">${rich(w.tip)}</div>
        </div>
      </div>`;
    });

    html += `</div>
      <div class="q-actions" style="justify-content:center;margin-top:18px">
        <button class="btn-primary" id="vwToQuiz">看完了，去闯关 →</button>
      </div>`;

    box().innerHTML = html;
    document.getElementById("vwBack").onclick = home;
    box().querySelectorAll(".vw-card").forEach(c => {
      c.onclick = e => {
        if (e.target.classList.contains("vw-say")) return;
        c.classList.toggle("open");
      };
    });
    box().querySelectorAll(".vw-say").forEach(b => {
      b.onclick = e => { e.stopPropagation(); say(b.dataset.say); };
    });
    document.getElementById("vwToQuiz").onclick = () => {
      view.name = "quiz";
      render();
      window.scrollTo({ top: 0, behavior: "smooth" });
    };
  }

  /* ---------------- 闯关 ---------------- */
  function renderQuiz(s) {
    const q = session.qs[session.i];
    if (!q) return finish(s);

    const day = dayOf(session.dayNo);
    const n = session.qs.length;
    const typeName = { e2c: "英译中", c2e: "中译英", cloze: "例句填空" }[q.type];

    let html = `<div class="vw-bar">
        <button class="btn-ghost" id="vwBack">← 退出</button>
        <div class="vw-bar-t">${day.final ? "周终闯关" : "Day " + day.no} · ${session.i + 1}/${n}</div>
        <div class="vw-bar-r">${session.combo >= 3 ? `🔥 连对 ${session.combo}` : `${session.right} 对`}</div>
      </div>
      <div class="vw-prog"><div class="vw-prog-fill" style="width:${Math.round(session.i / n * 100)}%"></div></div>
      <div class="q" style="margin-top:16px">
        <div class="q-meta">
          <span class="tagi pt">${typeName}</span>
          ${q.fromDue ? `<span class="tagi lv">回炉词</span>` : ""}
          <span class="tagi src">${esc(session.round.name)}</span>
        </div>
        <div class="vw-q-ask">${esc(q.ask)}</div>
        <div class="vw-q-stem">${q.type === "cloze" ? rich(q.stem) : q.stem}</div>`;

    if (q.type === "e2c") {
      html += `<div class="q-opts" id="vwOpts">`;
      q.options.forEach((o, i) => html += `<button class="opt" data-o="${i}">${esc(o)}</button>`);
      html += `</div>`;
    } else {
      html += `${q.hint ? `<div class="vw-hint">提示：${esc(q.hint)}</div>` : ""}
        <div class="q-fill">
          <input type="text" id="vwIn" placeholder="填英文" autocomplete="off" autocapitalize="off" spellcheck="false">
          <button class="btn-primary" id="vwGo">确定</button>
        </div>`;
    }
    html += `<div id="vwFb"></div></div>`;

    box().innerHTML = html;
    document.getElementById("vwBack").onclick = () => {
      if (confirm("退出这一场？已经答的题不会保存星星和分数。")) home();
    };

    if (q.type === "e2c") {
      box().querySelectorAll("#vwOpts .opt").forEach(b => {
        b.onclick = () => judge(s, q, q.options[+b.dataset.o], b);
      });
    } else {
      const inp = document.getElementById("vwIn");
      const go = () => judge(s, q, inp.value);
      document.getElementById("vwGo").onclick = go;
      inp.onkeydown = e => { if (e.key === "Enter") go(); };
      setTimeout(() => inp.focus(), 60);
    }
  }

  function judge(s, q, val, btn) {
    const ok = q.answer.some(a => norm(a) === norm(val));
    const w = q.word;

    if (ok) {
      session.right++;
      session.combo++;
      session.maxCombo = Math.max(session.maxCombo, session.combo);
      if (q.fromDue) session.dueRight++;
    } else {
      session.combo = 0;
      session.wrongList.push(q);
    }

    // 计分：答对 2 分，首次答对 +1，连击 +1；答错 0 分但不扣
    const meta = recWord(s, q.key, ok);
    let got = 0;
    if (ok) {
      got = 2 + (meta.firstTime ? 1 : 0) + (session.combo >= 3 ? 1 : 0);
      session.gained += got;
    }
    save(s);

    if (btn) {
      box().querySelectorAll("#vwOpts .opt").forEach(b => {
        b.disabled = true;
        if (q.options[+b.dataset.o] === q.answer[0]) b.classList.add("picked-ok");
      });
      if (!ok) btn.classList.add("picked-no");
    } else {
      const inp = document.getElementById("vwIn");
      if (inp) inp.disabled = true;
      const g = document.getElementById("vwGo");
      if (g) g.disabled = true;
    }

    document.getElementById("vwFb").innerHTML = `
      <div class="explain ${ok ? "right" : "wrong"}">
        <span class="lab">${ok ? `✓ +${got}${session.combo >= 3 ? " · 🔥连对" + session.combo : ""}` : "✗ 正确答案：" + esc(q.answer[0])}</span>
        <b>${esc(w.w)}</b>　${esc(w.cn)}<br>
        ${rich(w.eg)}<br>
        <span style="opacity:.85">${rich(w.tip)}</span>
      </div>
      <div class="q-actions">
        <button class="btn-ghost" id="vwSay">🔊 听一遍</button>
        <button class="btn-primary" id="vwNext">${session.i + 1 >= session.qs.length ? "看结果 →" : "下一题 →"}</button>
      </div>`;

    document.getElementById("vwSay").onclick = () => say(w.eg);
    document.getElementById("vwNext").onclick = () => {
      session.i++;
      render();
      window.scrollTo({ top: 0, behavior: "smooth" });
    };
    if (!ok) say(w.w);   // 错了就念一遍，多一条记忆通道
  }

  /* ---------------- 结算 ---------------- */
  function finish(s) {
    const wk = s.curWeek, w = s.weeks[wk];
    const n = session.qs.length;
    const pct = n ? session.right / n : 0;

    let stars = 1;
    if (pct >= 0.8) stars = 2;
    if (session.right === n && (session.dueTotal === 0 || session.dueRight === session.dueTotal)) stars = 3;
    if (session.makeup) stars = Math.min(stars, 2);

    const newBadges = [];
    if (!session.replay) {
      const prev = w.days[session.dayNo];
      session.gained += 5;                                   // 完成一天
      if (stars === 3) session.gained += 10;                 // 满星日
      if (session.isFinal && pct >= 0.8) session.gained += 50; // 周终达标

      s.points += session.gained;
      w.days[session.dayNo] = {
        stars: Math.max(stars, (prev && prev.stars) || 0),
        right: session.right, total: n,
        makeup: session.makeup, ts: todayStr()
      };

      if (award(s, "first")) newBadges.push("first");
      if (stars === 3 && award(s, "star3")) newBadges.push("star3");
      if (session.maxCombo >= 10 && award(s, "combo10")) newBadges.push("combo10");
      if (session.right === n && award(s, "perfect")) newBadges.push("perfect");
      if (session.dueTotal > 0 && session.dueRight === session.dueTotal && award(s, "payback")) newBadges.push("payback");
      if (s.points >= 2800 && award(s, "master")) newBadges.push("master");
      // 周日闯关完成后当场结算本周，星星和轮次立刻生效
      if (session.isFinal) settleWeek(s, wk);
    }
    save(s);

    const stars2 = weekStars(s, wk);
    const tiers = rewardTiers(s);
    const unlocked = tiers.filter(t => stars2 >= t.stars);
    const nextTier = tiers.find(t => stars2 < t.stars);

    let verdict, sub;
    if (pct === 1) { verdict = "满贯"; sub = "一道没错。这一批词已经是你的了。"; }
    else if (pct >= 0.8) { verdict = "过关"; sub = "错的那几个已经排进回炉队列，明后天还会来找你。"; }
    else if (pct >= 0.5) { verdict = "半熟"; sub = "一半还在飘。别急着往下走，明天回炉时它们会再来一次。"; }
    else { verdict = "回炉"; sub = "今天这批词见得还不够多。见面次数不够而已，不是记性差。"; }

    let html = `<div class="scorebox">
        <div class="score-big">${session.right}/${n}</div>
        <div class="score-sub"><b>${verdict}</b> · 正确率 ${Math.round(pct * 100)}%
          ${session.maxCombo >= 3 ? `　最高连对 ${session.maxCombo}` : ""}<br>${sub}</div>
      </div>

      <div class="vw-gain">
        <div class="vw-gain-i"><b>${session.replay ? "0" : "+" + session.gained}</b><span>词力值${session.replay ? "（加练不计分）" : ""}</span></div>
        <div class="vw-gain-i"><b>${session.replay ? "—" : "★".repeat(stars) + "☆".repeat(3 - stars)}</b><span>今日星星${session.makeup ? "（补做封顶 2 星）" : ""}</span></div>
        <div class="vw-gain-i"><b>${stars2}/${WEEK_STAR_MAX}</b><span>本周累计</span></div>
      </div>`;

    if (newBadges.length) {
      html += `<div class="vw-newbadge">🎉 解锁新徽章：` +
        newBadges.map(id => {
          const b = BADGES.find(x => x.id === id);
          return `<b>${b.icon} ${esc(b.name)}</b>`;
        }).join("、") + `</div>`;
    }

    html += `<div class="vw-rewardnote">`;
    if (unlocked.length) {
      html += `本周已经够 <b>${unlocked[unlocked.length - 1].stars}★</b> 那一档：${esc(unlocked[unlocked.length - 1].text)}。
        回首页点「兑换」记账。`;
      if (nextTier) html += `<br>再拿 <b>${nextTier.stars - stars2}</b> 颗星，能换：${esc(nextTier.text)}`;
    } else if (nextTier) {
      html += `再拿 <b>${nextTier.stars - stars2}</b> 颗星就能换：${esc(nextTier.text)}`;
    }
    html += `</div>`;

    if (session.wrongList.length) {
      html += `<div class="section-t">今天错的 ${session.wrongList.length} 个（睡前再看一眼就够）</div>
        <div class="bars vw-wrongs">`;
      session.wrongList.forEach(q => {
        html += `<div class="vw-wrong">
          <div class="vw-wrong-w">${esc(q.word.w)} <span class="vw-pos">${esc(q.word.pos)}</span> — ${esc(q.word.cn)}</div>
          <div class="vw-wrong-eg">${rich(q.word.eg)}</div>
          <div class="vw-wrong-tip">${rich(q.word.tip)}</div>
        </div>`;
      });
      html += `</div>`;
    }

    html += `<div class="q-actions" style="justify-content:center;margin-top:18px">
      <button class="btn-primary" id="vwHome">回到背词首页</button></div>`;

    box().innerHTML = html;
    document.getElementById("vwHome").onclick = home;
  }

  function home() {
    session = null;
    view = { name: "home", dayNo: null };
    render();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  /** 顶部小徽标用：本周星星 / 今天做没做 */
  function todayDone() {
    const s = st();
    const w = s.weeks[s.curWeek];
    return !!(w && w.days[todayNo()]);
  }

  return { render, home, todayDone, weekStars: () => { const s = st(); return weekStars(s, s.curWeek); } };
})();
