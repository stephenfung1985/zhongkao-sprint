/* ============================================================
   生成文稿.js — 每日播客文稿生成器（Node.js，不需要联网）

   做什么：
     读平台自己的数据（data/*.js + 学习数据/学习记录.json），
     生成「今天这一期」的播客文稿，输出两个文件：
       播客/文稿/2026-09-14.json   ← 给合成音频.py 用（分段+音色+停顿）
       播客/文稿/2026-09-14.md     ← 给人看的，可以直接读

   为什么直接加载平台的 data/*.js：
     排课逻辑（哪天学哪科、第几轮、哪一课）只写在 js/plan.js 里。
     播客如果自己再写一份，早晚会和平台对不上。
     这里用 vm 沙箱把平台的文件原样跑一遍，拿到同一个 Plan 对象，
     所以「播客说今晚学什么」和「平台今晚真的排什么」永远是同一个答案。

   用法：
     node 生成文稿.js            → 生成今天的
     node 生成文稿.js 2026-09-20 → 生成指定日期的（补录/预览用）
   ============================================================ */

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.resolve(__dirname, "..");
const OUT_DIR = path.join(__dirname, "文稿");

/* ---- 两位主播 ----
   F = 晓晓（女声，温暖）：主讲，负责讲知识、讲错题
   M = 云希（男声，阳光）：搭档，负责提问、当「不懂的那个人」、控场
   双主播不是为了好听，是因为一个人念 15 分钟稿子，第 5 分钟就走神了。 */
const F = "F", M = "M";

/* ---- 时长标定 ----
   SPEED 是实测出来的，不是估的：把 2026-09-14 那期合成完，
   用「正文字数 ÷（实际总长 − 留白）」量出来 4.56 字/秒。
   这个数含 edge-tts 每段自带的一点点起停留白，所以比纯语速慢。
   TARGET_MIN 是加餐环节的目标线，最终成品一般落在 15 到 16 分钟。
   要节目更短或更长，改 TARGET_MIN 这一个数就行。 */
const SPEED = 4.56;
const TARGET_MIN = 14.0;

/* ============================================================
   一、把平台的数据文件加载进来
   ============================================================ */
function loadPlatform() {
  const sandbox = { window: {}, console };
  sandbox.globalThis = sandbox;
  vm.createContext(sandbox);

  const dataFiles = [
    "data/plan-config.js",
    "data/family-messages.js",
    "data/english-daily.js",
    "data/vocab-week.js",
    "data/lessons-math.js",
    "data/lessons-english.js",
    "data/lessons-physics.js",
    "data/lessons-chemistry.js",
    "data/lessons-chinese.js",
    "data/lessons-politics.js",
    "data/lessons-history.js",
    "data/lessons-review.js"
  ];
  for (const f of dataFiles) {
    const p = path.join(ROOT, f);
    if (!fs.existsSync(p)) continue;
    vm.runInContext(fs.readFileSync(p, "utf8"), sandbox, { filename: f });
  }

  // plan.js 里直接用裸的 PLAN，所以把 window.PLAN 提到全局再跑
  vm.runInContext("var PLAN = window.PLAN;", sandbox);
  vm.runInContext(fs.readFileSync(path.join(ROOT, "js/plan.js"), "utf8"), sandbox, { filename: "plan.js" });

  return {
    PLAN: sandbox.window.PLAN,
    LESSONS: sandbox.window.LESSONS || {},
    ENGLISH_DAILY: sandbox.window.ENGLISH_DAILY || [],
    VOCAB_WEEK: sandbox.window.VOCAB_WEEK || null,
    FAMILY: sandbox.window.FAMILY_MESSAGES || sandbox.window.WISHES || null,
    Plan: vm.runInContext("Plan", sandbox)
  };
}

function loadRecord() {
  const p = path.join(ROOT, "学习数据", "学习记录.json");
  if (!fs.existsSync(p)) return { checkins: {}, wrongs: {}, exams: {}, settings: {} };
  try {
    const d = JSON.parse(fs.readFileSync(p, "utf8"));
    return {
      checkins: d.checkins || {},
      wrongs: d.wrongs || {},
      exams: d.exams || {},
      settings: d.settings || {}
    };
  } catch (e) {
    console.error("学习记录.json 读不出来，本期按「没有记录」处理：", e.message);
    return { checkins: {}, wrongs: {}, exams: {}, settings: {} };
  }
}

/* ============================================================
   二、把文字变成「能念出来的话」

   这是整个播客最容易被低估的一步。平台上的文字是给眼睛看的：
   有 **加粗**、有 ______ 填空线、有 -3²、有 CO₂、有换行符。
   这些直接丢给语音合成，念出来是一团噪音。
   ============================================================ */

const CHEM = {
  "CO2": "二氧化碳", "CO₂": "二氧化碳", "H2O": "水", "H₂O": "水",
  "O2": "氧气", "O₂": "氧气", "H2": "氢气", "H₂": "氢气",
  "N2": "氮气", "CH4": "甲烷", "CaCO3": "碳酸钙", "CaCl2": "氯化钙",
  "Ca(OH)2": "氢氧化钙", "NaOH": "氢氧化钠", "NaCl": "氯化钠",
  "HCl": "盐酸", "H2SO4": "硫酸", "Na2CO3": "碳酸钠", "NaHCO3": "碳酸氢钠",
  "CuSO4": "硫酸铜", "Fe2O3": "氧化铁", "Fe3O4": "四氧化三铁",
  "KMnO4": "高锰酸钾", "KClO3": "氯酸钾", "MnO2": "二氧化锰",
  "SO2": "二氧化硫", "P2O5": "五氧化二磷", "Al2O3": "氧化铝"
};

/* 顺序有讲究：复合单位必须排在单个单位前面，
   否则 10N/kg 会先被 kg 规则吃掉，变成「10N/千克」这种半截货。 */
const SYM = [
  /* 1) 记号、排版符号 */
  [/\*\*/g, ""], [/[`#>]/g, ""], [/\|/g, "，"],
  [/______+/g, "什么"], [/_{2,}/g, "什么"], [/—{2,}/g, "，"],
  [/✓|√(?=\s|$)/g, "正确的是，"], [/✗|✘|×(?=\s)/g, "错误示范，"],
  [/【|】|〖|〗/g, "，"], [/《|》/g, ""], [/「|」|『|』/g, ""],

  /* 2) 圈号 */
  [/①/g, "第一，"], [/②/g, "第二，"], [/③/g, "第三，"], [/④/g, "第四，"], [/⑤/g, "第五，"],
  [/⑥/g, "第六，"], [/⑦/g, "第七，"], [/⑧/g, "第八，"], [/⑨/g, "第九，"], [/⑩/g, "第十，"],

  /* 3) 复合单位（必须在单个单位之前） */
  [/(\d)\s*N\/kg/g, "$1牛每千克"], [/(\d)\s*m\/s²?/g, "$1米每秒"],
  [/(\d)\s*km\/h/g, "$1千米每小时"], [/(\d)\s*g\/cm³?/g, "$1克每立方厘米"],
  [/(\d)\s*kg\/m³?/g, "$1千克每立方米"], [/(\d)\s*J\/\(kg·℃\)/g, "$1焦每千克摄氏度"],

  /* 4) 单个单位：只在数字后面才转，避免把英文里的 N、g 也改掉 */
  [/(\d)\s*cm²/g, "$1平方厘米"], [/(\d)\s*cm³/g, "$1立方厘米"],
  [/(\d)\s*m²|㎡/g, "$1平方米"], [/(\d)\s*m³/g, "$1立方米"],
  [/(\d)\s*kg/g, "$1千克"], [/(\d)\s*mL/g, "$1毫升"], [/(\d)\s*cm/g, "$1厘米"],
  [/(\d)\s*mm/g, "$1毫米"], [/(\d)\s*km/g, "$1千米"],
  [/(\d)\s*N(?![a-zA-Z])/g, "$1牛"], [/(\d)\s*Ω/g, "$1欧姆"],
  [/(\d)\s*V(?![a-zA-Z])/g, "$1伏"], [/(\d)\s*A(?![a-zA-Z.])/g, "$1安"],
  [/(\d)\s*W(?![a-zA-Z])/g, "$1瓦"], [/(\d)\s*J(?![a-zA-Z])/g, "$1焦"],
  [/(\d)\s*Pa/g, "$1帕"], [/(\d)\s*℃/g, "$1摄氏度"],
  [/(\d)\s*g(?![a-zA-Z\/])/g, "$1克"], [/(\d)\s*L(?![a-zA-Z])/g, "$1升"],

  /* 5) 数学符号 */
  [/→/g, "，"], [/⇒/g, "，所以，"],
  [/≥/g, "大于等于"], [/≤/g, "小于等于"], [/≠/g, "不等于"], [/≈/g, "约等于"],
  [/×|·/g, "乘以"], [/÷/g, "除以"], [/±/g, "正负"], [/∵/g, "因为"], [/∴/g, "所以"],
  [/√/g, "根号"], [/π/g, "派"], [/∠/g, "角"], [/⊥/g, "垂直于"], [/∥/g, "平行于"],
  [/△/g, "三角形"], [/⊙/g, "圆"], [/°/g, "度"], [/‰/g, "千分之"],

  /* 6) 常见公式：字母公式念字母很难听，直接换成中文 */
  [/G\s*=\s*mg/g, "重力等于质量乘以g"], [/ρ\s*=\s*m\/V/g, "密度等于质量除以体积"],
  [/ρ/g, "密度"], [/Ω/g, "欧姆"],

  /* 7) 收尾 */
  [/[\[\]{}]/g, " "], [/\s*\n+\s*/g, "。"], [/\t/g, " "]
];

function speakable(s) {
  if (s === null || s === undefined) return "";
  let t = String(s);

  // 化学式先换，否则下面的上标/数字处理会把它拆碎
  for (const [k, v] of Object.entries(CHEM)) {
    t = t.split(k).join(v);
  }
  // 上标：-3² → 负3的平方
  t = t.replace(/²/g, "的平方").replace(/³/g, "的立方");
  for (const [re, rep] of SYM) t = t.replace(re, rep);

  // 百分数：53% 念「百分之53」，不是「53百分号」
  t = t.replace(/(\d+(?:\.\d+)?)\s*%/g, "百分之$1");
  t = t.replace(/%/g, "百分号");

  // 算式里的负号：句首或运算符后的 - 念「负」，中间的念「减」
  t = t.replace(/(^|[（(，。：、=+\-*/ ])-(\d)/g, "$1负$2");
  t = t.replace(/(\d)\s*-\s*(\d)/g, "$1减$2");
  t = t.replace(/(\d)\s*\+\s*(\d)/g, "$1加$2");
  t = t.replace(/=/g, "等于");

  // 收拾标点：连续的逗号句号会让语音顿得很奇怪
  t = t.replace(/[，。]{2,}/g, m => m[m.length - 1]);
  t = t.replace(/，。/g, "。").replace(/。，/g, "。");
  t = t.replace(/ {2,}/g, " ").trim();
  return t;
}

/** 选择题选项念成「A、…… B、…… 」
    题库里的选项文本本身常带「A.」前缀，不去掉会念成「A、A点五牛」 */
function speakOptions(opts) {
  if (!Array.isArray(opts) || !opts.length) return "";
  const letters = "ABCD";
  return opts.map((o, i) => {
    let txt = typeof o === "string" ? o : (o.t || o.text || "");
    txt = String(txt).replace(/^\s*[A-Da-d]\s*[.、．)）:：]\s*/, "");
    return `${letters[i]}、${speakable(txt)}`;
  }).join("。 ");
}

function speakAnswer(q) {
  if (Array.isArray(q.answer)) return speakable(q.answer[0]);
  return speakable(q.answer);
}

/* ============================================================
   三、工具
   ============================================================ */
function fmtDate(d) {
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") +
         "-" + String(d.getDate()).padStart(2, "0");
}
function parseDate(s) { return new Date(s + "T00:00:00"); }
function shiftDate(s, n) {
  const d = parseDate(s); d.setDate(d.getDate() + n); return fmtDate(d);
}
/** 用日期当种子的稳定伪随机：同一天永远抽到同一批，重跑不会变 */
function seedPick(arr, seed, n) {
  if (!arr.length) return [];
  const out = [];
  const used = new Set();
  let h = seed;
  for (let i = 0; i < n * 4 && out.length < Math.min(n, arr.length); i++) {
    h = (h * 1103515245 + 12345) & 0x7fffffff;
    const k = h % arr.length;
    if (!used.has(k)) { used.add(k); out.push(arr[k]); }
  }
  return out;
}
function seedNum(dateStr) {
  return dateStr.split("-").join("") | 0;
}

/* ============================================================
   四、生成文稿
   ============================================================ */
function build(dateStr) {
  const P = loadPlatform();
  const rec = loadRecord();
  const TIPS = require("./技巧库.js");

  const today = dateStr;
  const yest = shiftDate(today, -1);
  const seed = seedNum(today);

  const task = P.Plan.taskForString(today);        // 今晚平台排的课
  const yTask = P.Plan.taskForString(yest);        // 昨天排的课
  const yCheck = rec.checkins[yest] || null;       // 昨天实际打卡
  const weekdayName = "日一二三四五六"[parseDate(today).getDay()];

  const seg = [];
  const push = (v, t, gap = 0.45) => {
    const txt = speakable(t);
    if (txt) seg.push({ v, t: txt, gap });
  };
  /** 留白：念完题目让她在心里答，这是整档节目最有价值的几秒 */
  const think = (sec = 5) => seg.push({ v: "GAP", t: "", gap: sec });

  /* ---------- 0. 片头 ---------- */
  push(F, `小鱼晚好，这里是中考三十分钟电台，我是晓晓。`, 0.3);
  push(M, `我是云希。今天是${Number(today.slice(5, 7))}月${Number(today.slice(8))}日，星期${weekdayName}，冲刺计划第${task.dayNo}天。`, 0.4);
  push(F, `这一期十五分钟，正好配一顿饭。不用记笔记，也不用回答，听见了就行。我们问你问题的时候会留几秒钟，你在心里想一下，想不出来也没关系，后面就公布。`, 0.7);

  /* ---------- 1. 战报 ---------- */
  push(M, `先报一下今天的位置。`, 0.3);
  if (task.daysLeft > 0) {
    push(F, `距离二零二七年六月二十号中考，还有${task.daysLeft}天。现在是第${task.phase.id}阶段，${task.phase.name}。`, 0.5);
  } else if (task.daysLeft === 0) {
    push(F, `中考就是明天。今天不学新东西，早点睡。`, 0.6);
  } else {
    push(F, `中考已经在进行中了。这一期不讲新知识，只陪你吃个饭。`, 0.6);
  }

  // 本阶段的重点，按天轮播一条。这些是开局就定好的，越往后越该反复听。
  const focusList = task.phase.focus || [];
  if (focusList.length) {
    const fc = focusList[(task.dayNo - 1) % focusList.length];
    push(M, `这个阶段的目标是：${speakable(task.phase.goal).slice(0, 60)}。`, 0.4);
    push(F, `今天要提醒的这一条重点是：${speakable(fc)}`, 0.7);
  }

  const streak = countStreak(rec.checkins, today);
  const doneDays = Object.keys(rec.checkins).length;
  if (streak >= 2) {
    push(M, `打卡记录：已经连续${streak}天没断了，总共完成${doneDays}天。`, 0.4);
    push(F, `连续这件事比强度重要。今天也把它连上。`, 0.6);
  } else if (doneDays > 0) {
    push(M, `打卡记录：总共完成${doneDays}天，不过连续记录断了。`, 0.4);
    push(F, `断了就断了，不用自责，今天重新起一条就行。断一天不要紧，别断两天。`, 0.6);
  } else {
    push(F, `今天是第一天，从现在开始记连续天数。`, 0.6);
  }

  /* ---------- 2. 昨日回放 ---------- */
  push(M, `第一个环节，昨天那一课，回放一下。`, 0.5);

  if (yCheck) {
    const rate = yCheck.total ? Math.round(yCheck.right / yCheck.total * 100) : 0;
    const mins = yCheck.seconds ? Math.round(yCheck.seconds / 60) : null;
    push(F, `昨天学的是${yCheck.subjectName || ""}，${yCheck.lessonTitle || "当天的课"}。${yCheck.total ? `一共${yCheck.total}道题，对了${yCheck.right}道，正确率${rate}%。` : ""}${mins ? `用了大概${mins}分钟。` : ""}`, 0.5);

    // 昨天那一课的「核心一句话」——从课程库里取
    const yLesson = findLesson(P.LESSONS, yCheck.subject, yCheck.lessonId) ||
                    (yTask && yTask.lesson);
    if (yLesson && yLesson.key) {
      push(M, `这一课的核心，其实就一句话。`, 0.35);
      push(F, yLesson.key, 0.8);
    }
    // 费曼手册：课程库里最结实的一段，分【一句话】【展开】【自查】【易错】
    if (yLesson && yLesson.feynman) {
      const fey = parseFeynman(yLesson.feynman);
      if (fey.展开) {
        push(M, `再把它摊开一点。`, 0.3);
        push(F, fey.展开, 0.7);
      }
      if (fey.易错) {
        push(M, `这一课最容易栽的地方是哪儿？`, 0.3);
        push(F, fey.易错, 0.7);
      }
      if (fey.自查) {
        push(M, `自己查一下：${speakable(fey.自查)}`, 0.3);
        think(5);
        push(F, `能在心里答上来，昨天这一课就算过了。答不上来也不用急，它会自己回来找你的，平台排了。`, 0.7);
      }
    }
    if (yCheck.feynman) {
      push(M, `昨天你自己写的费曼复盘是这么说的。`, 0.35);
      push(F, `「${yCheck.feynman}」`, 0.6);
      push(M, `能用自己的话说出来，就说明是真的过脑子了。`, 0.6);
    }
    if (rate >= 90) {
      push(F, `${rate}百分号，这个正确率已经很硬了。`, 0.5);
    } else if (rate > 0 && rate < 60) {
      push(F, `正确率不到六成，说明这一课还没真正吃下去。不用慌，错的那几道下面就讲，讲完今晚再遇到就不会再错了。`, 0.6);
    }
  } else {
    push(F, `昨天没有打卡记录，可能是忙别的去了，也可能是忘了。这不影响今天。`, 0.5);
    push(M, `那我们直接把错题本翻出来，挑几道最该收拾的讲。`, 0.6);
  }

  /* ---------- 3. 错题重审 ---------- */
  const wrongList = Object.values(rec.wrongs || {});
  const yWrongIds = (yCheck && Array.isArray(yCheck.wrong)) ? yCheck.wrong : [];
  let reviewQs = yWrongIds.map(id => rec.wrongs[id]).filter(Boolean);

  if (reviewQs.length) {
    push(M, `第二个环节，昨天做错的题，一道一道过。`, 0.5);
  } else {
    push(M, `第二个环节，错题回炉。昨天没有新的错题，那就从错题本里挑最该收拾的。`, 0.5);
    reviewQs = wrongList
      .filter(w => !w.mastered)
      .sort((a, b) => (b.wrongCount || 0) - (a.wrongCount || 0))
      .slice(0, 6);
    reviewQs = seedPick(reviewQs, seed, 4);
  }
  reviewQs = reviewQs.slice(0, 5);

  reviewQs.forEach((q, i) => {
    speakQuestion(push, think, q, i + 1, reviewQs.length);
  });

  if (!reviewQs.length) {
    push(F, `错题本现在是空的，这说明前面那些题你都拿下了。空着的错题本是好事，但也别太得意，明天做题的时候它随时会满回来。`, 0.6);
  }

  /* ---------- 4. 今日到期（艾宾浩斯） ---------- */
  const dueQs = wrongList
    .filter(w => !w.mastered && w.nextDue && w.nextDue <= shiftDate(today, 1))
    .filter(w => !reviewQs.some(r => r.qid === w.qid))
    .sort((a, b) => (a.nextDue || "").localeCompare(b.nextDue || ""))
    .slice(0, 4);

  if (dueQs.length) {
    push(M, `第三个环节，到期回炉。下面这${dueQs.length}道，是之前错过的，按遗忘曲线算，今天正好该回来见一面。`, 0.5);
    push(F, `这几道念完你只要有印象就算过关，想不起来也正常，那说明这一道该再排一次。`, 0.5);
    dueQs.forEach((q, i) => speakQuestion(push, think, q, i + 1, dueQs.length, true));
  }

  /* ---------- 5. 英语两分钟 ---------- */
  const edIdx = (task.dayNo - 1) % Math.max(1, P.ENGLISH_DAILY.length);
  const ed = P.ENGLISH_DAILY[edIdx];
  if (ed) {
    push(M, `第四个环节，英语两分钟。`, 0.35);
    push(F, `英语是全卷最大的一个坑，一百二十分现在只拿六十五分半。但英语也是最吃见面次数的一科，所以我们每天都见一面，不求多。今天这一组是，${speakable(ed.topic)}。`, 0.6);
    const cards = (ed.cards || []).slice(0, 4);
    cards.forEach(c => {
      push(M, `${c.front}。`, 1.2);
      push(F, `${speakable(c.back)}。${c.eg ? "例句，" + speakable(c.eg.replace(/\*\*/g, "")) : ""}`, 0.7);
    });
    const chk = (ed.check || [])[0];
    if (chk) {
      push(M, `考你一个。${speakable(chk.stem)}`, 0.4);
      think(5);
      push(F, `答案是，${speakable(Array.isArray(chk.answer) ? chk.answer[0] : chk.answer)}。${chk.note ? speakable(chk.note) : ""}`, 0.7);
    }
  }

  /* ---------- 5b. 单词抽查（听力版）----------
     背单词那一栏是用手做的，这里做的是「用耳朵过一遍」。
     给中文，留白，再给英文 —— 正好补上打字练不到的那一环。 */
  const vwords = collectVocab(P.VOCAB_WEEK);
  if (vwords.length) {
    const picked = seedPick(vwords, seed + 7, 3);
    push(M, `顺手抽三个本周的词，我说中文，你在心里拼一下。`, 0.5);
    picked.forEach((w, i) => {
      push(M, `第${i + 1}个，${speakable(w.cn)}。`, 0.3);
      think(4);
      push(F, `${w.en}。${w.tip ? speakable(w.tip) : (w.eg ? "例句，" + speakable(String(w.eg).replace(/\*\*/g, "")) : "")}`, 0.6);
    });
    push(M, `拼错了不扣分，它只是会更快回来找你。`, 0.6);
  }

  /* ---------- 5b2. 错题堆在哪一科 ----------
     README 里写得很清楚：正确率会因为题目难度波动，
     但错题堆积的方向不会骗人。所以这是每期都值得播一次的数。 */
  const heap = wrongHeap(wrongList, P.PLAN);
  if (heap) {
    push(M, `再报一个数，错题现在堆在哪一科。`, 0.4);
    push(F, heap, 0.8);
  }

  /* ---------- 5c. 科目战报（七科轮换）----------
     每天讲一科的现状和眼下最该做的事。七天转一圈，
     不至于天天念分数念烦，但每一科一周都会被点一次名。 */
  const bulletin = subjectBulletin(P.PLAN, task.dayNo);
  if (bulletin) {
    push(M, `插一条科目战报。今天点名的是${bulletin.name}。`, 0.4);
    push(F, bulletin.body, 0.8);
  }

  /* ---------- 6. 应试技巧 ---------- */
  const tip = TIPS[(task.dayNo - 1) % TIPS.length];
  push(M, `第五个环节，今天的应试技巧。`, 0.35);
  push(F, `今天这条是${tip.tag}的。${tip.title}。`, 0.5);
  push(F, tip.body, 0.8);
  push(M, `这一条不需要做题，记住了下次考试直接能用。`, 0.6);

  /* ---------- 7. 今晚预告 ---------- */
  push(M, `最后一个环节，今晚的预告。`, 0.4);
  if (task.special && task.special.blocking) {
    push(F, speakable(task.special.text), 0.7);
  } else if (task.lesson) {
    const modeNote = { learn: "第一轮，讲透，慢一点没关系", drill: "第二轮，强化，直接上题", flash: "第三轮，闪测，五分钟解决战斗" }[task.mode] || "";
    push(F, `今晚是${task.subjectName}，${speakable(task.lesson.title)}。这是${modeNote}。`, 0.5);
    if (task.lesson.goal) push(F, speakable(task.lesson.goal), 0.6);

    // 今晚这一课的结论，先剧透一句。听过一遍再去学，接受起来快很多。
    const tFey = parseFeynman(task.lesson.feynman);
    if (tFey.一句话) {
      push(M, `今晚这一课最后会落到哪儿？我先剧透一句。`, 0.35);
      push(F, tFey.一句话, 0.8);
      push(M, `现在听着可能有点抽象，等你做完题回头再想这句，就是另一个感觉了。`, 0.6);
    }

    if (task.lesson.recall) {
      push(M, `先把今晚要解决的问题放在这儿，你可以边吃边想。`, 0.35);
      push(F, speakable(task.lesson.recall), 1.0);
      push(M, `想不出来最好，说明今晚这三十分钟有东西可学。`, 0.6);
    }

    // 苏格拉底第一问：今晚平台真的会这么问她。先在饭桌上过一遍。
    const s0 = (task.lesson.socratic || [])[0];
    if (s0 && s0.ask) {
      push(M, `今晚平台的第一个问题，我先替它问一遍。`, 0.35);
      push(F, speakable(s0.ask), 0.3);
      if (Array.isArray(s0.opts) && s0.opts.length) {
        push(F, speakOptions(s0.opts.map(o => o.t)), 0.3);
      }
      push(M, `想一下。`, 0.2);
      think(6);
      const ok = (s0.opts || []).find(o => o.ok);
      if (ok) {
        push(F, `答案是${speakable(ok.t)}。${ok.back ? speakable(ok.back) : ""}`, 0.7);
        push(M, `这一问只是开胃菜，后面还有两三轮，一层比一层深。`, 0.6);
      }
    }

    // 今晚的第一道练习题，先听一遍题面
    const q0 = (task.lesson.quiz || [])[0];
    if (q0 && q0.stem) {
      push(M, `今晚第一道练习题长这样。`, 0.3);
      push(F, speakable(q0.stem), 0.3);
      if (q0.options) push(F, speakOptions(q0.options), 0.3);
      think(5);
      push(F, `答案${speakAnswer(q0)}。${q0.trap ? "这道题的坑是：" + speakable(q0.trap) : ""}`, 0.7);
    }
    if (task.special && !task.special.blocking) {
      push(M, `另外提醒一句。`, 0.3);
      push(F, speakable(task.special.text), 0.7);
    }
  }

  /* ---------- 7a. 加餐：把这期补到 15 分钟 ----------
     错题少的日子正文会短两三分钟。与其让节目忽长忽短，
     不如用同样有用的东西补齐：多一条技巧、多几个单词、多一道错题。
     补的顺序是按价值排的，不是按凑字数排的。 */
  const estMin = () => (seg.reduce((s, x) => s + x.t.length, 0) / SPEED +
                        seg.reduce((s, x) => s + (x.gap || 0), 0)) / 60;
  let extraTip = 1, extraRound = 0;
  const usedQids = new Set([...reviewQs, ...dueQs].map(q => q.qid));
  while (estMin() < TARGET_MIN && extraRound < 6) {
    extraRound++;
    if (extraRound === 1) {
      const t2 = TIPS[(task.dayNo - 1 + extraTip++) % TIPS.length];
      push(M, `时间还够，再送一条。这条是${t2.tag}的：${t2.title}。`, 0.4);
      push(F, t2.body, 0.8);
      continue;
    }
    if (extraRound === 2 && vwords.length) {
      const more = seedPick(vwords, seed + 99, 4);
      push(M, `再补四个词，还是我说中文，你在心里拼。`, 0.45);
      more.forEach(w => {
        push(M, `${speakable(w.cn)}。`, 0.25);
        think(3);
        push(F, `${w.en}。${w.tip ? speakable(w.tip) : ""}`, 0.5);
      });
      continue;
    }
    const more = wrongList.filter(w => !w.mastered && !usedQids.has(w.qid));
    const q = seedPick(more, seed + extraRound * 13, 1)[0];
    if (q) {
      usedQids.add(q.qid);
      push(M, `再翻一道错题本里的。`, 0.35);
      speakQuestion(push, think, q, extraRound - 2, 1, true);
      continue;
    }
    const t2 = TIPS[(task.dayNo - 1 + extraTip++) % TIPS.length];
    push(M, `再来一条：${t2.title}。`, 0.4);
    push(F, t2.body, 0.8);
  }

  /* ---------- 7b. 这周还剩什么 ---------- */
  const dow = parseDate(today).getDay();
  const restOfWeek = [];
  for (let i = 1; i <= 6 - ((dow + 6) % 7); i++) {
    const t2 = P.Plan.taskForString(shiftDate(today, i));
    restOfWeek.push(`星期${"日一二三四五六"[parseDate(shiftDate(today, i)).getDay()]}${t2.subjectName}`);
    if (restOfWeek.length >= 3) break;
  }
  if (restOfWeek.length) {
    push(M, `顺带说一下这周后面的安排：${restOfWeek.join("，")}。`, 0.4);
    push(F, `心里有个数就行，不用现在准备。每天只攻一个考点，是这个计划最重要的一条规矩——讲多了记不住，练多了打击信心。`, 0.7);
  }

  /* ---------- 8. 收尾 ---------- */
  const wish = pickWish(P.FAMILY, seed);
  if (wish) {
    push(M, `节目最后，照例有一句家里人的话。今天这句是${wish.from}说的。`, 0.45);
    push(F, `「${speakable(wish.text)}」`, 0.9);
  }
  if (task.daysLeft > 0) {
    push(F, `今天就到这儿。吃完饭休息十分钟，再打开平台做那三十分钟。`, 0.4);
    push(M, `距离中考还有${task.daysLeft}天。明天同一时间，我们接着聊。`, 0.4);
  } else {
    push(F, `今天就到这儿。别对答案，别复盘，洗个澡早点睡。`, 0.4);
    push(M, `明天同一时间，我们还在。`, 0.4);
  }
  push(F, `我是晓晓。`, 0.25);
  push(M, `我是云希。小鱼，晚安。`, 0.6);

  /* ---------- 打包 ---------- */
  const chars = seg.reduce((s, x) => s + x.t.length, 0);
  const gapSec = seg.reduce((s, x) => s + (x.gap || 0), 0);
  // 实测值：把 2026-09-14 那期合出来量的，含 edge-tts 每段自带的轻微留白
  const estSec = chars / SPEED + gapSec;

  return {
    date: today,
    dayNo: task.dayNo,
    daysLeft: task.daysLeft,
    weekday: "星期" + weekdayName,
    phase: task.phase.name,
    title: (task.special && task.special.blocking)
      ? `第${task.dayNo}期 · ${task.special.kind === "exam" ? "中考进行中" : "考完了"}`
      : `第${task.dayNo}期 · ${task.subjectName}${task.lesson ? " · " + task.lesson.title : ""}`,
    subjectName: task.subjectName,
    lessonTitle: task.lesson ? task.lesson.title : "",
    tip: tip.title,
    counts: {
      昨日错题: yWrongIds.length,
      本期讲题: reviewQs.length + dueQs.length,
      到期回炉: dueQs.length,
      错题本总数: wrongList.filter(w => !w.mastered).length
    },
    chars, gapSec: Math.round(gapSec),
    estMinutes: +(estSec / 60).toFixed(1),
    segments: seg
  };
}

/* ---- 把一道题念成「题干 → 留白 → 答案 → 陷阱」 ---- */
function speakQuestion(push, think, q, i, total, brief = false) {
  const F = "F", M = "M";
  push(M, `第${i}道，${speakable(q.point || q.subject || "")}。`, 0.3);
  push(F, speakable(q.stem), 0.35);
  if (q.type === "choice" && q.options) {
    push(F, speakOptions(q.options), 0.35);
  }
  push(M, `想一下。`, 0.2);
  think(brief ? 4 : 6);
  push(F, `答案是，${speakAnswer(q)}。`, 0.5);
  if (!brief && q.explain) push(F, speakable(q.explain), 0.5);
  if (q.trap) {
    push(M, `这道题的坑在哪儿？`, 0.25);
    push(F, speakable(q.trap), 0.7);
  }
  if (q.wrongCount >= 2) {
    push(M, `提醒一下，这道题你已经错${q.wrongCount}次了，它是个惯犯。`, 0.6);
  }
}

/* ---- 费曼手册字段：【一句话】…【展开】…【自查】…【易错】… ---- */
function parseFeynman(raw) {
  const out = {};
  if (!raw) return out;
  const parts = String(raw).split(/【([^】]+)】/).slice(1);
  for (let i = 0; i + 1 < parts.length; i += 2) {
    out[parts[i].trim()] = speakable(parts[i + 1]);
  }
  return out;
}

/* ---- 把一周 96 词摊平成一个数组 ---- */
function collectVocab(VW) {
  if (!VW || !Array.isArray(VW.days)) return [];
  const out = [];
  for (const d of VW.days) {
    for (const w of (d.words || [])) {
      if (w && w.w && w.cn) out.push({ en: w.w, cn: w.cn, eg: w.eg, tip: w.tip });
    }
  }
  return out;
}

/* ---- 科目战报：七科轮换，每天点一科的名 ----
   分数来自 plan-config.js 的 scoreTable，所以改了那张表，播客跟着变。 */
const BULLETIN_ORDER = ["英语", "数学", "道法", "物理", "语文", "历史", "化学"];
const BULLETIN_ADVICE = {
  "英语": "英语是全卷最大的一个坑，也是唯一一科在往下走的。好消息是，它同时也是最容易搬回来的一科：一百二十分里，单选、词汇、基础完形加起来大概六十分，全是规则题，背会了就是分。眼下最该做的不是刷阅读，是把主谓一致、时态标志词、宾语从句语序这几个高频点焊死，再加上每天五分钟的词汇见面。",
  "数学": "数学是这几科里进步最明显的一科，期中到期末涨了十六分，说明你学得进去。现在的打法很清楚：只攻前十八题那五十四分，选择加填空，把它稳在五十分以上。压轴题暂时不碰，不是放弃，是排序——前面那些分还没拿满，后面的分就不该花时间。",
  "道法": "道法一百分开卷，现在拿五十六分。开卷考只拿一半，问题基本不在会不会，在于不会翻书、不会按格式答。这是全卷提分最快的地方，比死磕数学压轴划算得多。练两件事就够：教材目录背熟到看关键词就知道在第几单元，还有主观题的三段式，是什么、为什么、怎么做。",
  "物理": "物理从四十分涨到五十八分，进步不小，但真正的难关还没来——九年级的电学，欧姆定律和电功率，是初中物理最容易分层的一块。所以现在一边补力学的地基，一边提前铺电学。物理丢分有一半不是不会，是单位没换、状态没判断，这两个习惯练出来就是分。",
  "语文": "语文是几科里最稳的一科，一百二十分拿九十一分。稳的科目不用大动，但有三十分左右是纯记忆分：古诗文默写、名著常识、文言实词。这部分不需要任何思考能力，只需要见面次数，是全卷最不该丢的分。每天扫一眼自己写错过的字，比多做一篇阅读管用。",
  "历史": "历史一百分开卷，现在拿六十五分。和道法一样，开卷丢分多半是方法问题。历史的专属打法是先定时间轴再翻书——几个关键年份钉死了，任何材料题都能先框定范围。还有一条：凡是问影响、评价、作用的，一定要正反两面各写一条，只写一面最多拿一半分。",
  "化学": "化学是九年级的全新科目，零历史欠账，所以它是最有机会变成优势科的一科。别人也是从零开始，你不落后。化学的分很实在：方程式配平、质量守恒、溶液计算、酸碱盐，全是规则明确的东西，练到位就是稳定分。从第一天跟住，到明年这时候它可能是你最拿得出手的一科。"
};
function subjectBulletin(PLAN, dayNo) {
  const name = BULLETIN_ORDER[(dayNo - 1) % BULLETIN_ORDER.length];
  const row = (PLAN.scoreTable || []).find(r => r.subj === name);
  const advice = BULLETIN_ADVICE[name];
  if (!advice) return null;
  let head = "";
  if (row && row.base != null) {
    const gap = row.full - row.base;
    head = `${name}满分${row.full}分，八年级期末拿了${row.base}分，也就是说现在这一科手里还有${Math.round(gap)}分没拿到。`;
  } else if (row) {
    head = `${name}满分${row.full}分，${row.note}。`;
  }
  return { name, body: speakable(head + advice) };
}

/* ---- 错题堆在哪一科 ---- */
function wrongHeap(wrongList, PLAN) {
  const live = wrongList.filter(w => !w.mastered);
  if (live.length < 3) return null;
  const byS = {};
  for (const w of live) byS[w.subject] = (byS[w.subject] || 0) + 1;
  const rows = Object.entries(byS).sort((a, b) => b[1] - a[1]);
  const nameOf = s => ((PLAN.subjectMeta || {})[s] || {}).name || s;
  const top = rows[0];
  const list = rows.slice(0, 4).map(([s, n]) => `${nameOf(s)}${n}道`).join("，");
  return speakable(
    `错题本上还没攻克的一共${live.length}道，分布是：${list}。` +
    `堆得最高的是${nameOf(top[0])}，${top[1]}道。` +
    `正确率会因为题目难度上下晃，但错题堆积的方向不会骗人——哪一科堆得最高，下一步就该往哪一科多压一点。`
  );
}

function findLesson(LESSONS, subject, lessonId) {
  if (!subject || !lessonId) return null;
  const pool = LESSONS[subject] || [];
  return pool.find(l => l.id === lessonId) || null;
}

function countStreak(checkins, today) {
  let n = 0;
  let d = shiftDate(today, -1); // 今天还没学，从昨天开始数
  for (let i = 0; i < 400; i++) {
    if (checkins[d]) { n++; d = shiftDate(d, -1); } else break;
  }
  return n;
}

function pickWish(FAMILY, seed) {
  if (!FAMILY) return null;
  let all = [];
  if (Array.isArray(FAMILY)) all = FAMILY;
  else if (typeof FAMILY === "object") {
    for (const v of Object.values(FAMILY)) if (Array.isArray(v)) all = all.concat(v);
  }
  all = all.filter(x => x && x.text);
  if (!all.length) return null;
  return all[seed % all.length];
}

/* ============================================================
   五、输出
   ============================================================ */
function toMarkdown(ep) {
  const L = [];
  L.push(`# 中考三十分钟电台 · ${ep.title}`);
  L.push("");
  L.push(`- 日期：${ep.date}（${ep.weekday}） · 第 ${ep.dayNo} 天 · 距中考 ${ep.daysLeft} 天`);
  L.push(`- 阶段：${ep.phase}`);
  L.push(`- 今晚：${ep.subjectName}${ep.lessonTitle ? " · " + ep.lessonTitle : ""}`);
  L.push(`- 今日技巧：${ep.tip}`);
  L.push(`- 本期讲题 ${ep.counts.本期讲题} 道（其中到期回炉 ${ep.counts.到期回炉} 道） · 错题本未攻克 ${ep.counts.错题本总数} 道`);
  L.push(`- 预计时长：约 ${ep.estMinutes} 分钟（正文 ${ep.chars} 字 + 留白 ${ep.gapSec} 秒）`);
  L.push("");
  L.push("---");
  L.push("");
  for (const s of ep.segments) {
    if (s.v === "GAP") { L.push(`> ⏸ 留白 ${s.gap} 秒（想一想）`); L.push(""); continue; }
    L.push(`**${s.v === "F" ? "晓晓" : "云希"}：** ${s.t}`);
    L.push("");
  }
  return L.join("\n");
}

/** 扫一遍文稿目录，生成节目单，供 播客.html 读取
    只收今天及以前的：`node 生成文稿.js 2027-04-15` 这种提前预览出来的文稿
    是给大人看的，不该出现在她的节目列表里。 */
function writeIndex() {
  const todayStr = fmtDate(new Date());
  const files = fs.readdirSync(OUT_DIR)
    .filter(f => /^\d{4}-\d{2}-\d{2}\.json$/.test(f))
    .filter(f => f.slice(0, 10) <= todayStr);
  const list = [];
  for (const f of files) {
    try {
      const d = JSON.parse(fs.readFileSync(path.join(OUT_DIR, f), "utf8"));
      const mp3Rel = path.join(__dirname, "音频", d.date + ".mp3");
      list.push({
        date: d.date, dayNo: d.dayNo, title: d.title, weekday: d.weekday,
        subjectName: d.subjectName, lessonTitle: d.lessonTitle, tip: d.tip,
        daysLeft: d.daysLeft, phase: d.phase, counts: d.counts,
        estMinutes: d.estMinutes,
        actualSeconds: d.actualSeconds || null,
        hasAudio: fs.existsSync(mp3Rel)
      });
    } catch (e) { /* 坏掉的单期不该拖垮整张节目单 */ }
  }
  list.sort((a, b) => b.date.localeCompare(a.date));
  fs.writeFileSync(path.join(__dirname, "节目单.json"),
    JSON.stringify({ updatedAt: new Date().toISOString(), episodes: list }, null, 2), "utf8");
}

function main() {
  const arg = process.argv[2];
  const dateStr = arg && /^\d{4}-\d{2}-\d{2}$/.test(arg) ? arg : fmtDate(new Date());

  fs.mkdirSync(OUT_DIR, { recursive: true });
  const ep = build(dateStr);

  const jsonPath = path.join(OUT_DIR, dateStr + ".json");
  const mdPath = path.join(OUT_DIR, dateStr + ".md");
  fs.writeFileSync(jsonPath, JSON.stringify(ep, null, 2), "utf8");
  fs.writeFileSync(mdPath, toMarkdown(ep), "utf8");

  writeIndex();

  console.log(`[文稿] ${dateStr} 第${ep.dayNo}期`);
  console.log(`       ${ep.title}`);
  console.log(`       ${ep.segments.length} 段 / ${ep.chars} 字 / 预计 ${ep.estMinutes} 分钟`);
  console.log(`       → ${path.relative(ROOT, jsonPath)}`);
  console.log(`       → ${path.relative(ROOT, mdPath)}`);
}

if (require.main === module) main();
module.exports = { build, speakable };
