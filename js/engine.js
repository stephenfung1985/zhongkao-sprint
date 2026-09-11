/* ============================================================
   engine.js — 苏格拉底对话引擎 + 练习引擎
   苏格拉底原则：答错不给答案，只给下一个问题。
   ============================================================ */

/* ---------- 通用工具 ---------- */
function esc(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
/** 允许题目里用 **加粗** 和 `代码` */
function rich(s) {
  return esc(s)
    .replace(/\*\*(.+?)\*\*/g, "<b>$1</b>")
    .replace(/`(.+?)`/g, "<code>$1</code>");
}
/** 填空题答案归一化：去空格、全角转半角、忽略大小写 */
function norm(s) {
  return String(s || "")
    .trim()
    .replace(/[！-～]/g, ch => String.fromCharCode(ch.charCodeAt(0) - 0xfee0))
    .replace(/　/g, "")
    .replace(/\s+/g, "")
    .replace(/[，。；、""'']/g, "")
    .toLowerCase();
}

/* ============================================================
   语音播放模块 —— 封装浏览器原生 speechSynthesis
   离线可用，不需要联网，不需要音频文件
   ============================================================ */
const Speech = (function () {
  let enabled = true;
  let voice = null;
  let speaking = false;
  const VOICE_KEY = "zk2027_voice";

  function init() {
    try {
      if (!("speechSynthesis" in window)) { enabled = false; return; }
      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
      const saved = localStorage.getItem(VOICE_KEY);
      if (saved === "off") enabled = false;
    } catch (e) { enabled = false; }
  }

  function loadVoices() {
    try {
      const voices = window.speechSynthesis.getVoices();
      if (!voices.length) return;
      // 优先选中文普通话，其次任意中文，最后第一个
      voice = voices.find(v => v.lang === "zh-CN") ||
              voices.find(v => v.lang && v.lang.startsWith("zh")) ||
              voices[0] || null;
    } catch (e) { voice = null; }
  }

  /** 按字数估算朗读大概要花多久，用作 onEnd 迟迟不来时的保险丝。
   *  中文正常语速约每秒4-5字，这里按稍慢的语速估，且给足余量；
   *  最短1.2秒（太短的字幕也该有个停留），最长20秒封顶（避免长文本卡太久）。*/
  function estimateMs(text) {
    const len = String(text || "").length;
    return Math.min(20000, Math.max(1200, len * 220));
  }

  /**
   * 朗读一段文字，自动停止之前的朗读。
   * onEnd：讲完之后调用，用于「先讲解、讲完再进入下一步」这类需要等待的场景。
   *        —— 正常情况下由 speechSynthesis 的 onend/onerror 触发；
   *        —— 但少数电脑上语音服务异常时，这两个事件可能永远不触发，
   *           那样界面会卡住不动，所以额外兜底：按估算时长强制放行一次，
   *           先到先得，不会重复调用。
   */
  function speak(text, onEnd) {
    if (!enabled || !("speechSynthesis" in window)) { if (onEnd) onEnd(); return; }
    const clean = String(text || "").replace(/\*\*(.+?)\*\*/g, "$1")  // 去加粗标记
                                    .replace(/`(.+?)`/g, "$1")         // 去代码标记
                                    .replace(/<[^>]+>/g, "")           // 去HTML标签
                                    .trim();
    if (!clean) { if (onEnd) onEnd(); return; }
    let done = false;
    const finish = () => { if (done) return; done = true; if (onEnd) onEnd(); };
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(clean);
      if (voice) u.voice = voice;
      u.lang = "zh-CN";
      u.rate = 0.92;    // 稍慢，适合听讲
      u.pitch = 1.0;
      u.volume = 1.0;
      u.onstart = () => { speaking = true; updateIndicator(); highlightBubble(true); };
      u.onend = () => { speaking = false; updateIndicator(); highlightBubble(false); finish(); };
      u.onerror = () => { speaking = false; updateIndicator(); highlightBubble(false); finish(); };
      window.speechSynthesis.speak(u);
      if (onEnd) setTimeout(finish, estimateMs(clean));
    } catch (e) { finish(); }
  }

  function stop() {
    try { window.speechSynthesis.cancel(); } catch (e) {}
    speaking = false;
    updateIndicator();
    highlightBubble(false);
  }

  function toggle() {
    enabled = !enabled;
    if (!enabled) stop();
    try { localStorage.setItem(VOICE_KEY, enabled ? "on" : "off"); } catch (e) {}
    updateIndicator();
    return enabled;
  }

  function isEnabled() { return enabled; }
  function isSpeaking() { return speaking; }

  /** 顶部语音状态指示器 */
  function updateIndicator() {
    const el = document.getElementById("voiceIndicator");
    if (el) {
      el.textContent = speaking ? "🔊 朗读中…" : (enabled ? "🔊 语音讲解" : "🔇 已静音");
      el.classList.toggle("on", enabled);
    }
  }

  /** 给当前朗读的气泡加高亮 */
  let currentBubble = null;
  function highlightBubble(on) {
    if (currentBubble) {
      currentBubble.classList.toggle("speaking", on);
      if (!on) currentBubble = null;
    }
  }
  function setBubble(el) { currentBubble = el; }

  init();
  return { speak, stop, toggle, isEnabled, isSpeaking, updateIndicator, setBubble };
})();

/* ============================================================
   苏格拉底对话引擎
   ============================================================ */
const Socratic = (function () {
  let chain = [], step = 0, boxEl = null, inputEl = null, onDone = null;
  let attempts = 0, stats = { asked: 0, firstTry: 0 };

  function start(socraticChain, chatBox, chatInput, doneCb) {
    chain = socraticChain || [];
    step = 0; attempts = 0;
    stats = { asked: 0, firstTry: 0 };
    boxEl = chatBox; inputEl = chatInput; onDone = doneCb;
    boxEl.innerHTML = ""; inputEl.innerHTML = "";
    if (!chain.length) { finish(); return; }
    ask();
  }

  function bubble(cls, html) {
    const d = document.createElement("div");
    d.className = "bubble " + cls;
    d.innerHTML = html;
    boxEl.appendChild(d);
    d.scrollIntoView({ behavior: "smooth", block: "nearest" });
    return d;
  }

  function ask() {
    const node = chain[step];
    attempts = 0;
    stats.asked++;
    const b = bubble("ask", rich(node.ask));
    Speech.setBubble(b);
    Speech.speak(node.ask);
    renderOptions(node);
  }

  function renderOptions(node) {
    inputEl.innerHTML = "";
    node.opts.forEach((o, i) => {
      const b = document.createElement("button");
      b.className = "opt";
      b.innerHTML = rich(o.t);
      b.onclick = () => pick(node, o, b);
      inputEl.appendChild(b);
    });
  }

  function pick(node, opt, btn) {
    attempts++;
    // 回显她的选择
    bubble("me", rich(opt.t));

    if (opt.ok) {
      btn.classList.add("picked-ok");
      if (attempts === 1) stats.firstTry++;
      inputEl.innerHTML = "";
      let speakText = "";
      if (opt.back) {
        const b = bubble("good", rich(opt.back));
        speakText += opt.back + "。";
      }
      if (node.close) {
        bubble("good", "<b>记住这句：</b>" + rich(node.close));
        speakText += "记住这句：" + node.close;
      }
      step++;
      const advance = () => { if (step >= chain.length) finish(); else ask(); };
      // 语音开着且有内容要讲：等这段话真正讲完（+留半秒余量）才进入下一步，
      // 不然下一题一开口，speechSynthesis 会把还没说完的讲解掐断。
      // 语音关着或没内容：保留原来 450ms 的固定停顿，给她留时间读完气泡文字。
      if (speakText && Speech.isEnabled()) {
        Speech.setBubble(boxEl.lastChild);
        Speech.speak(speakText, () => setTimeout(advance, 500));
      } else {
        setTimeout(advance, 450);
      }
    } else {
      btn.classList.add("picked-no");
      btn.disabled = true;
      // 苏格拉底式：不给答案，给一个反问
      const hintText = opt.back || "再想想——刚才那一步，你是怎么得到的？";
      const b = bubble("hint", rich(hintText));
      Speech.setBubble(b);
      const showRescue = () => {
        if (attempts >= 3 && node.rescue) {
          const r = bubble("hint", "<b>给你搭个台阶：</b>" + rich(node.rescue));
          Speech.setBubble(r);
          Speech.speak("给你搭个台阶：" + node.rescue);
        }
      };
      // 同样的道理：等这句引导语讲完再出台阶，别把它打断
      if (Speech.isEnabled()) Speech.speak(hintText, () => setTimeout(showRescue, 400));
      else setTimeout(showRescue, 1200);
    }
  }

  function finish() {
    inputEl.innerHTML = "";
    const b = bubble("good", "这一段想通了。<b>现在去做题，验证一下是真懂还是错觉。</b>");
    Speech.setBubble(b);
    Speech.speak("这一段想通了。现在去做题，验证一下是真懂还是错觉。");
    if (onDone) onDone(stats);
  }

  return { start };
})();

/* ============================================================
   练习引擎
   ============================================================ */
const Quiz = (function () {
  let list = [], idx = 0, boxEl = null, counterEl = null, onDone = null;
  let ctx = { subject: "", point: "" };
  let result = { total: 0, right: 0, wrong: [], answers: [] };

  function start(questions, box, counter, context, doneCb) {
    list = questions || []; idx = 0;
    boxEl = box; counterEl = counter; onDone = doneCb;
    ctx = context || {};
    result = { total: list.length, right: 0, wrong: [], answers: [] };
    boxEl.innerHTML = "";
    if (!list.length) { if (onDone) onDone(result); return; }
    render();
  }

  function render() {
    const q = list[idx];
    if (counterEl) counterEl.textContent = `第 ${idx + 1} / ${list.length} 题`;

    const wrap = document.createElement("div");
    wrap.className = "q";

    let html = `<div class="q-meta">
        <span class="tagi src">${esc(q.src || "真题改编")}</span>
        <span class="tagi pt">${esc(q.pt || ctx.point || "")}</span>
        <span class="tagi lv">${esc(q.lv || "基础")}</span>
      </div>
      <div class="q-stem">${rich(q.stem)}</div>`;

    if (q.type === "fill") {
      html += `<div class="q-fill">
          <input type="text" id="fillIn" placeholder="${esc(q.ph || "在这里写答案")}" autocomplete="off">
          <button class="btn-primary" id="btnSubmit">确定</button>
        </div>`;
    } else {
      html += `<div class="q-opts" id="qOpts"></div>`;
    }
    html += `<div id="fbBox"></div>`;
    wrap.innerHTML = html;
    boxEl.innerHTML = "";
    boxEl.appendChild(wrap);

    if (q.type === "fill") {
      const inp = wrap.querySelector("#fillIn");
      wrap.querySelector("#btnSubmit").onclick = () => judgeFill(q, wrap, inp.value);
      inp.onkeydown = e => { if (e.key === "Enter") judgeFill(q, wrap, inp.value); };
      setTimeout(() => inp.focus(), 60);
    } else {
      const optBox = wrap.querySelector("#qOpts");
      q.options.forEach(txt => {
        const b = document.createElement("button");
        b.className = "opt";
        b.innerHTML = rich(txt);
        b.onclick = () => judgeChoice(q, wrap, txt.trim()[0], b);
        optBox.appendChild(b);
      });
    }
  }

  function judgeChoice(q, wrap, letter, btn) {
    const ok = letter === String(q.answer).trim()[0];
    wrap.querySelectorAll(".opt").forEach(b => {
      b.disabled = true;
      if (b.textContent.trim()[0] === String(q.answer).trim()[0]) b.classList.add("picked-ok");
    });
    if (!ok) btn.classList.add("picked-no");
    feedback(q, wrap, ok, letter);
  }

  function judgeFill(q, wrap, val) {
    const accepted = Array.isArray(q.answer) ? q.answer : [q.answer];
    const ok = accepted.some(a => norm(a) === norm(val));
    wrap.querySelector("#fillIn").disabled = true;
    wrap.querySelector("#btnSubmit").disabled = true;
    feedback(q, wrap, ok, val);
  }

  function feedback(q, wrap, ok, given) {
    result.answers.push({ id: q.id, ok, given });
    if (ok) {
      result.right++;
      // 若这题在错题本里，算作一次成功复现
      DB.promoteWrong(q.id);
    } else {
      result.wrong.push(q.id);
      DB.addWrong(q, ctx.subject, q.pt || ctx.point);
    }

    const ansTxt = Array.isArray(q.answer) ? q.answer[0] : q.answer;
    const fb = wrap.querySelector("#fbBox");
    const explainText = (ok ? "答对了。" : "错了，答案是 " + ansTxt + "。") + (q.explain || "") +
      (q.trap ? "这题的坑：" + q.trap : "");
    fb.innerHTML = `
      <div class="explain ${ok ? "right" : "wrong"}">
        <span class="lab">${ok ? "✓ 对了" : "✗ 错了 —— 答案是 " + esc(ansTxt)}
          <button class="voice-mini" id="btnSpeakExplain" title="朗读解析">🔊</button></span>
        ${rich(q.explain)}
        ${q.trap ? `<span class="trap">⚠️ <b>这题的坑：</b>${rich(q.trap)}</span>` : ""}
        ${!ok ? `<span class="trap">📕 已存进错题本，${PLAN.ebbinghaus[0]} 天后自动找你复现。</span>` : ""}
      </div>
      <div class="q-actions">
        <button class="btn-primary" id="btnNext">${idx + 1 >= list.length ? "做完了，去复盘 →" : "下一题 →"}</button>
        ${!ok ? `<button class="btn-ghost" id="btnWhy">我还是没懂</button>` : ""}
      </div>`;

    // 朗读解析按钮
    const speakBtn = fb.querySelector("#btnSpeakExplain");
    if (speakBtn) speakBtn.onclick = () => {
      if (typeof Speech !== "undefined") Speech.speak(explainText);
    };
    // 答对答错都自动朗读解析——「回答正确也要讲解」，不只是错题才讲
    if (typeof Speech !== "undefined" && Speech.isEnabled()) {
      setTimeout(() => Speech.speak(explainText), 400);
    }

    fb.querySelector("#btnNext").onclick = () => {
      idx++;
      if (idx >= list.length) { if (onDone) onDone(result); }
      else render();
    };
    const why = fb.querySelector("#btnWhy");
    if (why) why.onclick = () => {
      why.disabled = true;
      const d = document.createElement("div");
      d.className = "explain";
      d.innerHTML = `<span class="lab">拆到最小一步</span>${rich(q.deep || q.explain)}
        <span class="trap">如果这一步还是卡，说明卡的不是这道题，是它前面那个知识点。
        把这道题的考点「${esc(q.pt || "")}」记下来，跟老师/家长要5分钟单独讲一遍。</span>`;
      fb.insertBefore(d, fb.querySelector(".q-actions"));
    };
  }

  return { start };
})();
