/* ============================================================
   lessons-english.js — 英语课程库（12 课）
   定位：八下期末 65.5/120（54.6%），且期中→期末**下滑9.5分**，
        是全卷唯一在退步的科目，也是最大失分项（丢54.5分）。
   策略：周二整块 22 分钟攻语法（本文件）+ 每天 5 分钟微剂量攻词汇。
        目标不是拿高分，是先把单选、词形变化这些**规则明确**的分拿住。
   ============================================================ */
window.LESSONS = window.LESSONS || {};
window.LESSONS.english = [

/* ---------------------------------------------------------- */
{
  id:"e01", point:"一般现在时·第三人称单数", title:"he/she/it 后面那个 s，年年丢分",
  goal:"三单是英语最基础也最高频的失分点，天津卷单选、完形、写作全都在考。这一课把它变成条件反射。",
  key:"主语是 he/she/it 或单数名词时，动词加 s/es；但 doesn't / does 后面的动词必须还原。",
  recall:"He ____ (go) to school. 空里填什么？He doesn't ____ (go) 呢？为什么不一样？",
  feynman:"用一句话说清：什么时候动词要加 s，什么时候加了反而是错的？",
  socratic:[
    { ask:"先建立感觉。`He ____ (like) music.` 应该填什么？",
      opts:[
        {t:"like", ok:false, back:"主语是 He。英语里 he/she/it 是「特殊待遇」的主语，一般现在时里它们后面的动词要变个样。变成什么样？"},
        {t:"likes", ok:true, back:"对。he/she/it → 动词加 s。"}
      ],
      close:"**主语是第三人称单数（he/she/it/单个人或物）时，一般现在时的动词加 s/es**。"
    },
    { ask:"那 `He doesn't ____ (like) music.` 呢？",
      opts:[
        {t:"likes", ok:false, back:"注意前面已经有 doesn't 了。does 这个词本身就是 do 的三单形式——「s」已经被 does 拿走了。同一个句子里，这个 s 会不会出现两次？"},
        {t:"like", ok:true, back:"对。doesn't 已经承担了三单的标记，后面的动词必须还原成原形。"}
      ],
      close:"**一个句子里三单标记只出现一次**。有了 does/doesn't，后面动词就还原。这条规则一半的人记不住。",
      rescue:"口诀：**「does 抢了 s」**。does 一出现，动词就交出它的 s。"
    },
    { ask:"变形规则。`study` 的三单是什么？",
      opts:[
        {t:"studies", ok:true, back:"对。辅音字母 + y 结尾 → 变 y 为 i 再加 es。"},
        {t:"studys", ok:false, back:"y 前面是 d，是辅音字母。这种情况 y 要先变成 i，然后加 es。对比一下 play——y 前面是 a，是元音，就直接加 s（plays）。"}
      ],
      close:"三单变形四条：\n① 一般 → 加 s\n② s/x/ch/sh/o 结尾 → 加 **es**（goes, watches, does）\n③ **辅音**+y → 变 y 为 i 加 es（studies, flies）\n④ **元音**+y → 直接加 s（plays, buys）"
    },
    { ask:"最后，判断这句对不对：`Tom and Jack goes to school together.`",
      opts:[
        {t:"对", ok:false, back:"数一数主语有几个人？Tom 和 Jack 是两个人，是单数还是复数？"},
        {t:"错，应该用 go", ok:true, back:"对。and 连接两个主语 → 复数 → 动词不加 s。"}
      ],
      close:"**三单的前提是「单数」**。and 连接的两个人是复数，不加 s。但 with / as well as 连接的不算，只看前面那个。"
    }
  ],
  quiz:[
    { id:"e01q1", src:"2024天津·真题改编", pt:"三单", lv:"基础", type:"choice", flash:true,
      stem:"My sister ____ English very well, but she ____ speak Chinese.",
      options:["A. speak; doesn't","B. speaks; doesn't","C. speaks; don't","D. speak; don't"],
      answer:"B",
      explain:"主语 My sister 是第三人称单数：\n第一空 → 动词加 s → **speaks**\n第二空 → 否定要用 **doesn't**（三单专用）\n（注意 doesn't 后面的 speak 已经是原形，题目里已经给好了）",
      trap:"C 选项 don't 是给 I/you/we/they 用的。**三单的否定永远是 doesn't**。"
    },
    { id:"e01q2", src:"2023天津·同源", pt:"三单变形", lv:"基础", type:"fill",
      stem:"用所给词的正确形式填空：My father ____ (watch) TV every evening.",
      answer:["watches"],
      explain:"My father 是三单 → 动词加 s/es\nwatch 以 **ch** 结尾 → 加 **es** → **watches**",
      trap:"以 s、x、ch、sh、o 结尾的动词加的是 **es** 不是 s。这五个结尾串成一句话记：「小妹（s、x）吃吸（ch、sh）藕（o）」。"
    },
    { id:"e01q3", src:"2025天津·真题改编", pt:"三单否定", lv:"基础", type:"choice", flash:true,
      stem:"— Does your brother like playing basketball?\n— No, he ____ .",
      options:["A. isn't","B. doesn't","C. don't","D. didn't"],
      answer:"B",
      explain:"问句用 **Does** 提问 → 答句就用 **doesn't** 回答。\n问什么 helping verb（助动词），就答什么。",
      trap:"简答句的规则：**问句用什么助动词，答句就用什么**。\nDo → do/don't；Does → does/doesn't；Did → did/didn't；Is → is/isn't。\n照着抄就行，不要自己想。"
    },
    { id:"e01q4", src:"高频考点", pt:"主谓一致", lv:"基础", type:"choice",
      stem:"Tom, together with his parents, ____ going to Beijing next week.",
      options:["A. are","B. is","C. were","D. be"],
      answer:"B",
      explain:"together with / with / as well as / along with 这些词组**不改变主语**。\n真正的主语还是 **Tom**（单数）→ 用 **is**\n（如果是 Tom **and** his parents，那才是复数，用 are）",
      trap:"看到逗号中间夹一堆东西，先把它整段划掉，只看逗号外面的主语是谁。\n这是天津卷高频陷阱：**and 变复数，with 不变**。"
    },
    { id:"e01q5", src:"2024天津·同源", pt:"时态判断", lv:"基础", type:"choice",
      stem:"Look! The children ____ football on the playground.",
      options:["A. play","B. plays","C. are playing","D. played"],
      answer:"C",
      explain:"**Look!** 是现在进行时的标志词——它在提示「此刻正在发生」。\nThe children 是复数 → **are** + playing → **are playing**",
      trap:"看到 Look! / Listen! / Now / at the moment，一律用**现在进行时**（be + doing）。\n这些标志词是白送的提示，专门给你定时态用的。",
      deep:"时态标志词速查表（背下来能救很多分）：\n**一般现在时**：always, usually, often, every day, sometimes\n**现在进行时**：Look!, Listen!, now, at the moment\n**一般过去时**：yesterday, last..., ...ago, in 2020\n**现在完成时**：already, yet, ever, never, just, since, for\n**一般将来时**：tomorrow, next..., in the future\n做单选先扫一眼有没有标志词，有的话时态就定了一半。"
    }
  ]
},

/* ---------------------------------------------------------- */
{
  id:"e02", point:"一般过去时", title:"看到 yesterday，全句都要往回走",
  goal:"一般过去时是完形填空和阅读的主时态。这一课解决：什么时候用过去时，不规则动词怎么办。",
  key:"看到 yesterday / last / ago / in+过去年份，一律用过去时；did / didn't 后面动词还原。",
  recall:"He ____ (go) to Beijing last week. 填什么？He didn't ____ (go) 呢？",
  feynman:"说清楚：为什么 didn't 后面的动词不用过去式？",
  socratic:[
    { ask:"`I ____ (see) him yesterday.` 填什么？",
      opts:[
        {t:"saw", ok:true, back:"对。yesterday 明确指向过去，动词要用过去式。see 的过去式是 saw（不规则）。"},
        {t:"seed", ok:false, back:"see 是不规则动词，不能加 ed。它的过去式要单独背——see, saw, seen。"},
        {t:"see", ok:false, back:"yesterday 告诉你这件事发生在昨天。动词要跟着变成过去式。"}
      ],
      close:"**一般过去时标志词：yesterday、last week/year、... ago、in 2020、just now**。看到就往过去变。"
    },
    { ask:"那 `I didn't ____ (see) him yesterday.` 呢？",
      opts:[
        {t:"saw", ok:false, back:"看看 didn't 这个词——它本身就是 did not，而 did 已经是 do 的过去式了。「过去」这个信息已经被 did 承担了。后面的动词还需要再表示一次过去吗？"},
        {t:"see", ok:true, back:"对。did 已经背了「过去」这个包袱，后面的动词就还原成原形。"}
      ],
      close:"和三单是同一个道理：**助动词一旦变形，实义动词就还原**。did/didn't 后面永远接原形。",
      rescue:"统一口诀：**「助动词扛旗，主动词躺平」**。does 扛了 s，did 扛了过去，后面的动词都用原形。"
    },
    { ask:"疑问句。`____ you go to school yesterday?` 开头填什么？",
      opts:[
        {t:"Did", ok:true, back:"对。实义动词 go 的一般疑问句，要借助 did 提到句首。"},
        {t:"Were", ok:false, back:"were 是 be 动词。这句话里已经有实义动词 go 了，一个句子不能同时用 be 动词和实义动词做谓语。"},
        {t:"Do", ok:false, back:"yesterday 指向过去，助动词也要用过去式形式。do 的过去式是什么？"}
      ],
      close:"**有实义动词 → 用 do/does/did 提问；只有 be 动词 → 用 is/are/was/were 提问**。两套系统，不能混。"
    },
    { ask:"最后。`He ____ a teacher two years ago.` 填什么？",
      opts:[
        {t:"was", ok:true, back:"对。这句话没有实义动词，只需要一个「是」，用 be 动词的过去式 was。"},
        {t:"did", ok:false, back:"did 是助动词，不能单独做谓语。这句话缺的是「是」这个意思，应该用哪个词？"},
        {t:"were", ok:false, back:"主语 He 是单数，be 动词的过去式单数形式是什么？"}
      ],
      close:"be 动词过去式只有两个：**was（I/he/she/it）和 were（you/we/they）**。"
    }
  ],
  quiz:[
    { id:"e02q1", src:"2024天津·真题改编", pt:"一般过去时", lv:"基础", type:"choice", flash:true,
      stem:"I ____ my homework last night, so I ____ watch TV.",
      options:["A. do; don't","B. did; didn't","C. did; don't","D. do; didn't"],
      answer:"B",
      explain:"**last night** 是过去时间标志 → 全句都用过去时\n第一空：do 的过去式 = **did**\n第二空：过去时的否定 = **didn't**",
      trap:"一个句子里时态要统一。看到一处是过去时，同一句里其他动词通常也是过去时。"
    },
    { id:"e02q2", src:"2023天津·同源", pt:"不规则动词", lv:"基础", type:"fill",
      stem:"用所给词的正确形式填空：She ____ (buy) a new dress last Sunday.",
      answer:["bought"],
      explain:"last Sunday → 一般过去时\nbuy 是不规则动词：buy → **bought** → bought",
      trap:"buy 不能加 ed。和它一组的还有 bring→brought、think→thought、teach→taught，都是 -ought/-aught 结尾，一起背效率高。"
    },
    { id:"e02q3", src:"2025天津·真题改编", pt:"过去时否定", lv:"基础", type:"choice", flash:true,
      stem:"He didn't ____ his homework yesterday.",
      options:["A. finished","B. finish","C. finishes","D. finishing"],
      answer:"B",
      explain:"didn't = did not，did 已经是过去式了。\n**助动词变了，实义动词还原** → **finish**（原形）",
      trap:"A 选项 finished 是「双重过去」，错。这是中考单选的经典送分陷阱，每年都考。"
    },
    { id:"e02q4", src:"高频考点", pt:"过去时 vs 现在完成时", lv:"中档", type:"choice",
      stem:"— Where is Tom?\n— He ____ to the library. He ____ there two hours ago.",
      options:["A. has gone; went","B. went; has gone","C. has been; went","D. goes; goes"],
      answer:"A",
      explain:"第一空：问「他人在哪」，答「他去图书馆了（**人还没回来**）」→ **has gone to**\n第二空：有 **two hours ago** 这个明确过去时间 → 必须用一般过去时 → **went**",
      trap:"两个关键区分：\n① **has gone to**（去了，人不在）vs **has been to**（去过，人已回）\n② 有明确过去时间（ago/yesterday/last）→ **绝不能用现在完成时**"
    },
    { id:"e02q5", src:"2024天津·同源", pt:"过去进行时", lv:"中档", type:"choice",
      stem:"I ____ my homework when my mother ____ home.",
      options:["A. did; came","B. was doing; came","C. did; was coming","D. was doing; was coming"],
      answer:"B",
      explain:"经典句型：**「正在做某事，这时另一件事发生了」**\n持续的长动作（做作业）→ **过去进行时 was doing**\n突然发生的短动作（妈妈回来）→ **一般过去时 came**",
      trap:"when 后面接**短暂**动作（用过去式），while 后面接**持续**动作（用进行时）。",
      deep:"这个句型有两种写法，意思一样：\n① I **was doing** my homework **when** my mother **came** home.\n② **While** I **was doing** my homework, my mother **came** home.\n规律：**进行时的那个动作，前面配 while；短暂的那个动作，前面配 when**。"
    }
  ]
},

/* ---------------------------------------------------------- */
{
  id:"e03", point:"现在完成时", title:"have done：过去发生，现在还有影响",
  goal:"现在完成时是中考语法的重点难点，也是单选必考项。这一课解决：什么时候用它，since/for 怎么选。",
  key:"have/has + 过去分词；since 接时间点，for 接时间段；有明确过去时间时不能用完成时。",
  recall:"since 和 for 后面分别接什么？have been to 和 have gone to 有什么区别？",
  feynman:"用一句话说清：现在完成时和一般过去时最大的区别是什么？",
  socratic:[
    { ask:"对比两句：`I lost my key.` 和 `I have lost my key.` 你觉得哪句在暗示「钥匙现在还没找到」？",
      opts:[
        {t:"第二句", ok:true, back:"对。现在完成时强调的是「这件事对**现在**造成的影响」——钥匙丢了，现在还是没有。"},
        {t:"第一句", ok:false, back:"第一句只是陈述「我丢过钥匙」这个过去的事实，可能后来找到了，句子没说。而第二句多了一层「现在」的含义。"}
      ],
      close:"**一般过去时**只说过去发生了；**现在完成时**说过去发生了、**而且现在还有影响**。这是两者最本质的区别。"
    },
    { ask:"标志词。`I have lived here ____ 2020.` 填 since 还是 for？",
      opts:[
        {t:"since", ok:true, back:"对。2020 是一个**时间点**（某一年），用 since。"},
        {t:"for", ok:false, back:"for 后面要接一段时长，比如 three years、two months。2020 是一个点还是一段？"}
      ],
      close:"**since + 时间点**（2020, last year, I was born）\n**for + 时间段**（three years, a long time, two hours）"
    },
    { ask:"判断对错：`I have seen him yesterday.`",
      opts:[
        {t:"错", ok:true, back:"对。yesterday 是一个明确的过去时间点，它和现在完成时天生冲突。"},
        {t:"对", ok:false, back:"想想现在完成时的含义——它强调「对现在的影响」，所以不能被钉死在某个具体的过去时刻。yesterday 就是在把它钉死。"}
      ],
      close:"**现在完成时不能和明确的过去时间连用**（yesterday, last week, ago, in 2020）。看到这些词，一律改用一般过去时。",
      rescue:"检查口诀：写完 have done 的句子，回头扫一眼有没有 yesterday/last/ago。有 → 立刻改成过去式。"
    },
    { ask:"最后一对。`He has ____ to Beijing.`（他去过北京，现在人在这儿）填 been 还是 gone？",
      opts:[
        {t:"been", ok:true, back:"对。been to = 去过并且**回来了**。人现在在你面前。"},
        {t:"gone", ok:false, back:"gone to 的意思是「去了那儿，人还在路上或还在那儿」。但题目说他现在在这儿，矛盾了。"}
      ],
      close:"**have been to = 去过（人回来了）**\n**have gone to = 去了（人不在这儿）**\n判断方法：说话时这个人在不在现场。"
    }
  ],
  quiz:[
    { id:"e03q1", src:"2024天津·真题改编", pt:"since/for", lv:"基础", type:"choice", flash:true,
      stem:"My family ____ in Tianjin ____ ten years.",
      options:["A. lived; since","B. have lived; for","C. have lived; since","D. live; for"],
      answer:"B",
      explain:"「住了十年，现在还住着」→ **现在完成时 have lived**\nten years 是**时间段** → 用 **for**",
      trap:"since 和 for 是天津卷高频考点。判断只看后面那个词：\n有具体的年份/事件 → since\n有数字+时间单位（three years / two hours）→ for"
    },
    { id:"e03q2", src:"2023天津·同源", pt:"been/gone", lv:"基础", type:"choice", flash:true,
      stem:"— Where is your father?\n— He ____ to Shanghai on business.",
      options:["A. has been","B. has gone","C. went","D. goes"],
      answer:"B",
      explain:"问「你爸爸在哪」→ 说明他**不在现场**\n人不在 → **has gone to**",
      trap:"如果答句是「他去过上海」（人在现场），就用 has been to。\n判断唯一标准：**说话的时候这个人在不在**。"
    },
    { id:"e03q3", src:"2025天津·真题改编", pt:"现在完成时", lv:"基础", type:"choice",
      stem:"I ____ this film before, so I don't want to see it again.",
      options:["A. see","B. saw","C. have seen","D. will see"],
      answer:"C",
      explain:"**before** 是现在完成时的标志词\n而且句子的后半段「所以我现在不想再看」正好体现了「过去的事影响现在」\n→ **have seen**",
      trap:"完成时标志词清单：already, yet, ever, never, just, before, since, for, so far, in the past few years。"
    },
    { id:"e03q4", src:"高频考点", pt:"完成时与延续性动词", lv:"中档", type:"choice",
      stem:"He ____ the book for two weeks. He needs to return it today.",
      options:["A. has borrowed","B. has kept","C. borrowed","D. has lent"],
      answer:"B",
      explain:"**for two weeks 是一段时间**，前面的动词必须是**能持续**的。\nborrow（借入）是一个**瞬间**动作，借完就结束了，不能延续两周。\nkeep（保存、留着）可以持续 → **has kept**",
      trap:"这是中考的经典难点：**瞬间动词不能和「for + 时间段」连用**。\n常见转换：\nborrow → keep\nbuy → have\nbegin/start → be on\ndie → be dead\njoin → be in / be a member of\ncome/go/arrive → be (in/at)"
    },
    { id:"e03q5", src:"2024天津·同源", pt:"完成时 vs 过去时", lv:"中档", type:"choice",
      stem:"— ____ you ever ____ to the Great Wall?\n— Yes, I ____ there last summer.",
      options:["A. Have; been; went","B. Did; go; have been","C. Have; gone; went","D. Did; went; have gone"],
      answer:"A",
      explain:"第一句有 **ever**（曾经）→ 现在完成时 → **Have you ever been**\n（问「去过吗」用 been，不用 gone）\n第二句有 **last summer**（明确过去时间）→ 一般过去时 → **went**",
      trap:"这题把本课三个考点全考了：\n① ever → 完成时\n② 问「去过吗」用 been to\n③ last summer → 必须改回过去时",
      deep:"完成时和过去时的选择，只看**有没有明确的过去时间点**：\n有（yesterday/last/ago/in 2020）→ **一般过去时**，没得商量\n没有，但有 ever/never/already/yet/just/before/since/for → **现在完成时**\n两者都没有 → 看句意，强调对现在的影响就用完成时。"
    }
  ]
},

/* ---------------------------------------------------------- */
{
  id:"e04", point:"一般将来时·主将从现", title:"从句里的将来，要用现在时假装",
  goal:"「主将从现」是天津卷单选年年出现的固定考点，规则死板、好拿分。这一课把它彻底焊死。",
  key:"if / when / as soon as / until / before / after 引导的时间或条件状语从句里，用一般现在时表示将来。",
  recall:"I will call you when he ____ (come) back. 空里填什么？为什么不填 will come？",
  feynman:"说清楚：什么叫「主将从现」？哪些词后面要用这条规则？",
  socratic:[
    { ask:"先看一般将来时的两种说法。`It ____ rain tomorrow.` 可以填什么？",
      opts:[
        {t:"will 或 is going to", ok:true, back:"对。两个都行，will 偏「单纯的将来」，be going to 偏「有迹象/有打算」。"},
        {t:"只能填 will", ok:false, back:"还有一种表达打算和迹象的说法，由 be 动词 + going to 组成。"}
      ],
      close:"一般将来时两种主要说法：**will + 动词原形** 和 **be going to + 动词原形**。"
    },
    { ask:"现在关键。`I will call you when he ____ (come) back.` 填什么？",
      opts:[
        {t:"will come", ok:false, back:"直觉上确实应该是将来。但英语有一条特殊规定：在 when 引导的**时间状语从句**里，不能用 will，要用现在时来表示将来的意思。所以应该填什么？"},
        {t:"comes", ok:true, back:"对。这就是「主将从现」——主句用将来时，从句用现在时。注意 he 是三单，所以是 comes 不是 come。"}
      ],
      close:"**主将从现**：主句将来时（will），从句用一般现在时代替将来时。这是英语的固定规定，不讲道理，背下来就行。",
      rescue:"操作方法：看到 if/when 引导的从句，先在心里说「这里不能出现 will」，然后按一般现在时的规则处理（别忘了三单加 s）。"
    },
    { ask:"哪些词后面适用这条规则？`If it ____ (rain) tomorrow, we won't go.`",
      opts:[
        {t:"rains", ok:true, back:"对。if 引导条件状语从句，同样适用主将从现。"},
        {t:"will rain", ok:false, back:"if 和 when 一样，都属于「条件/时间状语从句」，里面不能用 will。"}
      ],
      close:"适用词清单：**if、when、as soon as、until、before、after、while、unless**。看到这些，从句里就不许出现 will。"
    },
    { ask:"陷阱题。`I don't know if he ____ (come) tomorrow.` 这里填 comes 还是 will come？",
      opts:[
        {t:"comes", ok:false, back:"注意看：这个 if 是「如果」还是「是否」？I don't know if... = 「我不知道他**是否**会来」。这个 if 引导的不是条件状语从句，而是 know 的**宾语**。"},
        {t:"will come", ok:true, back:"对！这里的 if 是「是否」，引导宾语从句，不是条件状语从句，所以主将从现不适用。"}
      ],
      close:"**关键区分**：\nif = 「如果」→ 条件状语从句 → 用现在时\nif = 「是否」→ 宾语从句 → **该用将来时就用将来时**\n判断方法：能不能把 if 换成 whether。能换 → 是「是否」。"
    }
  ],
  quiz:[
    { id:"e04q1", src:"2024天津·真题改编", pt:"主将从现", lv:"基础", type:"choice", flash:true,
      stem:"I will tell him the news as soon as he ____ back.",
      options:["A. will come","B. comes","C. came","D. is coming"],
      answer:"B",
      explain:"as soon as 引导**时间状语从句** → 主将从现\n主句 will tell（将来），从句用**一般现在时** → he 是三单 → **comes**",
      trap:"两个坑一起踩：① 忘了主将从现，填 will come ② 记住了规则但忘了三单，填 come。**两个都要对才得分**。"
    },
    { id:"e04q2", src:"2023天津·同源", pt:"条件状语从句", lv:"基础", type:"choice", flash:true,
      stem:"If it ____ tomorrow, we ____ stay at home.",
      options:["A. will rain; will","B. rains; will","C. rains; /","D. will rain; /"],
      answer:"B",
      explain:"if 从句 → 用**一般现在时** → it 是三单 → **rains**\n主句 → 用**将来时** → **will** stay",
      trap:"记住这个句子的形状：**If + 现在时, 主句 + will**。\n很多人两边都写 will，或者两边都写现在时，都是错的。**一边一个**。"
    },
    { id:"e04q3", src:"2025天津·真题改编", pt:"将来时", lv:"基础", type:"fill",
      stem:"用所给词的正确形式填空：Look at those black clouds. It ____ ____ ____ (rain).（提示：填三个词）",
      answer:["is going to rain"],
      explain:"「看那些乌云」= **有迹象**表明马上要下雨\n有迹象的将来 → 用 **be going to** → **is going to rain**",
      trap:"will 和 be going to 的区别：\n**will** = 单纯预测 / 临时决定（I'll answer the phone.）\n**be going to** = 有迹象 / 早有打算（Look at the clouds...）\n看到「有证据表明」的语境，选 be going to。"
    },
    { id:"e04q4", src:"高频考点", pt:"if 的两种用法", lv:"中档", type:"choice",
      stem:"— Do you know if he ____ to the party tomorrow?\n— I think he will come if he ____ free.",
      options:["A. will come; is","B. comes; is","C. will come; will be","D. comes; will be"],
      answer:"A",
      explain:"第一个 if = **「是否」**（Do you know if... = 你知不知道他**是否**会来）→ 宾语从句 → 该用将来时就用 → **will come**\n第二个 if = **「如果」**→ 条件状语从句 → 主将从现 → **is**",
      trap:"同一道题里出现两个 if，考的就是这个区分。\n**能换成 whether 的 = 「是否」= 宾语从句 = 可以用 will**\n**换不了的 = 「如果」= 条件从句 = 不能用 will**"
    },
    { id:"e04q5", src:"2024天津·同源", pt:"主将从现", lv:"中档", type:"choice",
      stem:"Don't leave until the rain ____ .",
      options:["A. will stop","B. stops","C. stopped","D. is stopping"],
      answer:"B",
      explain:"until 引导**时间状语从句** → 主将从现\n主句是祈使句（相当于将来的动作），从句用一般现在时 → the rain 是三单 → **stops**",
      trap:"主句是**祈使句**（Don't leave）时，也算「将来」，从句同样适用主将从现。",
      deep:"「主将从现」的完整触发清单，背下来这一条就能拿稳：\n**when, if, as soon as, until, before, after, while, unless, once**\n只要这些词引导的是**时间或条件状语从句**（不是宾语从句），里面就绝对不能出现 will。\n检查动作：写完从句，回头看有没有 will。有 → 删掉，动词按一般现在时处理（记得三单加 s）。"
    }
  ]
},

/* ---------------------------------------------------------- */
{
  id:"e05", point:"被动语态", title:"be + done：主语不是干活的那个",
  goal:"被动语态是天津卷单选和短文填空的高频考点。这一课解决：什么时候用被动，各时态的被动怎么变。",
  key:"be + 过去分词；主语是「被动作的」就用被动；情态动词后面必须用 be，不能用 is/was。",
  recall:"「教室每天被打扫」怎么说？「作业必须今天完成」怎么说？",
  feynman:"说清楚：你怎么判断一句话该用主动还是被动？",
  socratic:[
    { ask:"对比：`Tom cleans the room.` 和 `The room is cleaned by Tom.` 意思一样吗？",
      opts:[
        {t:"意思一样，只是角度不同", ok:true, back:"对。第一句从 Tom 的角度说（他打扫），第二句从房间的角度说（它被打扫）。事实相同，视角不同。"},
        {t:"意思不一样", ok:false, back:"两句描述的是同一件事：Tom 打扫了房间。区别只是把谁放在主语位置上。"}
      ],
      close:"**主语是「干活的」→ 主动；主语是「被弄的」→ 被动**。判断只需一步：主语是施动者还是受动者。"
    },
    { ask:"被动语态的基本结构是什么？",
      opts:[
        {t:"be + 过去分词", ok:true, back:"对。be 负责表示时态和人称，过去分词负责表示「被」的含义。"},
        {t:"be + 动词原形", ok:false, back:"原形表达不出「被」的意思。表示「被做」要用动词的第三种形式——过去分词。"}
      ],
      close:"**被动语态 = be + 过去分词（done）**。be 随时态和主语变化，过去分词永远不变。"
    },
    { ask:"时态变化。「这本书是2020年出版的」怎么说？`The book ____ published in 2020.`",
      opts:[
        {t:"was", ok:true, back:"对。in 2020 是过去时间，book 是单数 → was。"},
        {t:"is", ok:false, back:"in 2020 说明是过去的事。be 动词要用过去式，单数用哪个？"},
        {t:"were", ok:false, back:"主语 The book 是单数，过去式的单数形式是 was。"}
      ],
      close:"**被动语态的时态全靠 be 来体现**：\n一般现在被动：am/is/are + done\n一般过去被动：was/were + done\n将来被动：will **be** + done",
      rescue:"两步法：① 先想主动句是什么时态 ② 把 be 变成那个时态，动词改成过去分词。"
    },
    { ask:"最后一个高频陷阱。「作业必须今天完成」`The homework must ____ finished today.` 填什么？",
      opts:[
        {t:"be", ok:true, back:"对。情态动词（must/can/should）后面永远接**动词原形**，be 就是 is/was 的原形。"},
        {t:"is", ok:false, back:"must 是情态动词，它后面只能接动词原形。is 不是原形，is 的原形是什么？"},
        {t:"was", ok:false, back:"同样，was 也不是原形。情态动词后面接的必须是原形。"}
      ],
      close:"**情态动词 + be + done**：must be done / can be seen / should be finished。\n这里的 be 是原形，绝不能写成 is/am/are/was/were。"
    }
  ],
  quiz:[
    { id:"e05q1", src:"2024天津·真题改编", pt:"被动语态", lv:"基础", type:"choice", flash:true,
      stem:"The classroom ____ every day by the students.",
      options:["A. cleans","B. is cleaned","C. cleaned","D. is cleaning"],
      answer:"B",
      explain:"教室是**被**打扫的（by the students 也提示了施动者）→ 被动语态\nevery day → 一般现在时\nThe classroom 是单数 → **is cleaned**",
      trap:"看到句子里有 **by + 人**，几乎一定是被动语态。这是最明显的提示词。"
    },
    { id:"e05q2", src:"2023天津·同源", pt:"情态动词被动", lv:"基础", type:"choice", flash:true,
      stem:"This kind of book ____ in the library.",
      options:["A. can find","B. can be found","C. can found","D. is can found"],
      answer:"B",
      explain:"书是**被**找到的 → 被动\n情态动词 can 后面接**原形 be** → **can be found**",
      trap:"C 选项 can found 少了 be，是最常见的错。\n**情态动词被动的固定形状：情态动词 + be + 过去分词**，三个部分一个都不能少。"
    },
    { id:"e05q3", src:"2025天津·真题改编", pt:"被动语态", lv:"基础", type:"fill",
      stem:"用所给词的正确形式填空：The Great Wall ____ ____ (build) hundreds of years ago.（填两个词）",
      answer:["was built"],
      explain:"长城是**被**建造的 → 被动\nhundreds of years ago → 一般过去时\nThe Great Wall 单数 → **was built**",
      trap:"build 的过去分词是 **built**（不规则），不是 builded。"
    },
    { id:"e05q4", src:"高频考点", pt:"主动 vs 被动", lv:"中档", type:"choice",
      stem:"— What happened to your bike?\n— It ____ yesterday.",
      options:["A. stole","B. was stolen","C. is stolen","D. steals"],
      answer:"B",
      explain:"自行车不会自己去偷东西，它是**被偷**的 → 被动\nyesterday → 一般过去时 → **was stolen**\n（steal → stole → **stolen**）",
      trap:"判断口诀：**主语能不能自己做这个动作？**\n能 → 主动；不能（是被别人做的）→ 被动。\n自行车不能自己偷，教室不能自己打扫，书不能自己出版——全是被动。"
    },
    { id:"e05q5", src:"2024天津·同源", pt:"被动语态特殊情况", lv:"中档", type:"choice",
      stem:"The old man ____ to cross the road by a young boy.",
      options:["A. helped","B. was helped","C. help","D. is helping"],
      answer:"B",
      explain:"by a young boy 提示被动 → 老人是**被**帮助的 → **was helped**\n（注意：主动是 help sb **to** do，被动时那个 to 要保留）",
      trap:"这题还藏着一个知识点：\n主动 make/let/see/hear sb **do**（不带 to）\n被动 be made/seen/heard **to** do（**to 要还原**）\n中考爱考这个「被动时 to 回来了」的现象。",
      deep:"被动语态解题三步：\n① **找主语**，问自己「它是干这事的，还是被这么干的」\n② 定**时态**（看时间标志词）\n③ 套公式 **be(该时态) + 过去分词**\n附加提示词：句子里有 **by + 某人**、主语是无生命的东西，基本都是被动。"
    }
  ]
},

/* ---------------------------------------------------------- */
{
  id:"e06", point:"宾语从句", title:"三要素：连接词、语序、时态",
  goal:"宾语从句是天津卷单选和书面表达的必考项，规则清晰、最容易拿分。这一课把三要素固定成检查清单。",
  key:"陈述句用 that，一般疑问用 if/whether，特殊疑问用原疑问词；从句必须用陈述语序；主句过去时则从句时态往回推。",
  recall:"I don't know where ____ ____ .（他在哪里）应该怎么填？为什么不能写 is he？",
  feynman:"说清楚：宾语从句最容易错的是哪一点？你用什么办法检查？",
  socratic:[
    { ask:"把两句合成一句：`I don't know.` + `Where is he?` 应该怎么写？",
      opts:[
        {t:"I don't know where is he.", ok:false, back:"这里有个隐形规则。当疑问句变成从句（一个句子的一部分）后，它就不再是「问句」了，而是一个陈述内容。既然不是问句，还需要保持疑问的倒装语序吗？"},
        {t:"I don't know where he is.", ok:true, back:"对。变成从句后，语序要还原成正常的「主语 + 动词」。"}
      ],
      close:"**宾语从句必须用陈述语序**：疑问词 + 主语 + 动词。这是中考最高频的送分点，也是丢分点。"
    },
    { ask:"连接词。`I don't know.` + `Is he a teacher?` 合起来怎么写？",
      opts:[
        {t:"I don't know if he is a teacher.", ok:true, back:"对。原句是一般疑问句（能用 yes/no 回答），用 if 或 whether 连接，意思是「是否」。"},
        {t:"I don't know that he is a teacher.", ok:false, back:"that 表示「肯定的事实」，但原句是在问「是不是」，还没确定。表示「是否」应该用哪个词？"},
        {t:"I don't know is he a teacher.", ok:false, back:"两个句子不能直接拼，中间必须有连接词。而且语序也要改。"}
      ],
      close:"**连接词三选一**：\n原句是陈述句 → **that**（可省略）\n原句是一般疑问句（yes/no 能答）→ **if / whether**\n原句是特殊疑问句 → **保留原来的疑问词**（what/where/when/who/how...）",
      rescue:"判断方法：先把原来那个句子还原成独立问句，看它是哪一种，再选连接词。"
    },
    { ask:"时态。`He said.` + `I am busy.` 合起来是？",
      opts:[
        {t:"He said that I was busy.", ok:true, back:"对。主句 said 是过去时，从句的时态要跟着往过去推一步。"},
        {t:"He said that I am busy.", ok:false, back:"主句用了 said（过去时），从句的时态需要保持一致。am 的过去式是什么？"}
      ],
      close:"**时态呼应**：主句是过去时 → 从句也要变过去时（is→was, will→would, can→could, do→did）。\n主句是现在时 → 从句时态**不受影响**，该怎样怎样。"
    },
    { ask:"例外。`The teacher said.` + `The earth moves around the sun.` 合起来从句用什么时态？",
      opts:[
        {t:"moves（保持现在时）", ok:true, back:"对。地球绕太阳转是永远成立的客观真理，不管什么时候说都是这样，所以时态不变。"},
        {t:"moved（变过去时）", ok:false, back:"如果改成 moved，意思就变成「地球以前绕太阳转（现在不转了）」，这显然不对。客观真理有什么特殊之处？"}
      ],
      close:"**客观真理永远用一般现在时**，不受主句时态影响。这是时态呼应的唯一例外。"
    }
  ],
  quiz:[
    { id:"e06q1", src:"2024天津·真题改编", pt:"宾语从句语序", lv:"基础", type:"choice", flash:true,
      stem:"Could you tell me ____ ?",
      options:["A. where is the post office","B. where the post office is","C. where was the post office","D. the post office where is"],
      answer:"B",
      explain:"宾语从句必须用**陈述语序**：疑问词 + **主语** + **动词**\nwhere + the post office（主语）+ is（动词）→ **where the post office is**",
      trap:"这是天津卷的常客。检查方法：\n把从句单独拎出来读，如果它读起来像个问句（动词跑到主语前面了），就是错的。\n「the post office is」听起来像陈述句 ✓\n「is the post office」听起来像问句 ✗"
    },
    { id:"e06q2", src:"2023天津·同源", pt:"宾语从句连接词", lv:"基础", type:"choice", flash:true,
      stem:"I want to know ____ he will come to my party.",
      options:["A. that","B. if","C. what","D. which"],
      answer:"B",
      explain:"「我想知道他**是否**会来我的聚会」\n原句是一般疑问句（Will he come? 能用 yes/no 回答）→ 用 **if / whether**",
      trap:"if 在这里是「是否」不是「如果」。\n判断：能不能换成 whether？能 → 就是「是否」。"
    },
    { id:"e06q3", src:"2025天津·真题改编", pt:"宾语从句时态", lv:"基础", type:"choice",
      stem:"He told me that he ____ to Beijing the next day.",
      options:["A. will go","B. would go","C. goes","D. went"],
      answer:"B",
      explain:"主句 told 是**过去时** → 从句时态往过去推\nwill 的过去式是 **would** → **would go**\n（the next day 也提示这是从过去看的将来）",
      trap:"时态往回推的对照表：\nam/is → was；are → were\ndo/does → did\nwill → **would**\ncan → could\nmay → might\nhave/has → had"
    },
    { id:"e06q4", src:"高频考点", pt:"宾语从句综合", lv:"中档", type:"choice",
      stem:"— Do you know ____ ?\n— Sorry, I don't know. You can ask the teacher.",
      options:[
        "A. when will the meeting begin",
        "B. when the meeting will begin",
        "C. when did the meeting begin",
        "D. when the meeting began"
      ],
      answer:"B",
      explain:"① 语序：必须陈述语序 → 排除 A、C\n② 时态：主句 Do you know 是现在时，从句不受影响；答句说「可以去问老师」说明会议**还没开始** → 用将来时 → **will begin**",
      trap:"两步筛选法，效率最高：\n**第一步先看语序**，把所有倒装的选项直接划掉（通常能干掉一半）\n**第二步再看时态**"
    },
    { id:"e06q5", src:"2024天津·同源", pt:"宾语从句", lv:"中档", type:"choice",
      stem:"The teacher told us that light ____ much faster than sound.",
      options:["A. traveled","B. travels","C. will travel","D. had traveled"],
      answer:"B",
      explain:"主句 told 是过去时，按规则从句该变过去时。\n**但是**——「光比声音传播得快」是**客观真理**，永远成立。\n客观真理**不受主句时态影响**，永远用一般现在时 → **travels**（light 是三单）",
      trap:"客观真理的常见例子：地球绕太阳转、水100度沸腾、光比声音快、太阳从东方升起。\n看到这类内容，时态呼应规则**失效**，一律用一般现在时。",
      deep:"宾语从句三步检查清单（写作文和做单选都用这个）：\n**① 连接词对不对？**\n　陈述→that｜一般疑问→if/whether｜特殊疑问→原疑问词\n**② 语序对不对？**\n　必须是「连接词 + 主语 + 动词」，动词绝不能跑到主语前面\n**③ 时态对不对？**\n　主句过去时→从句往回推；主句现在时→不变；客观真理→永远现在时\n三步走一遍，这类题基本不会错。"
    }
  ]
},

/* ---------------------------------------------------------- */
{
  id:"e07", point:"非谓语动词", title:"to do 还是 doing，看前面那个词",
  goal:"to do / doing 的选择是单选和短文填空的高频考点。这一课用「分类清单」代替死记硬背。",
  key:"介词后面一律加 doing；enjoy/finish/mind/practice 类动词后加 doing；want/hope/decide 类后加 to do。",
  recall:"I'm looking forward to ____ (see) you. 填什么？为什么不是 see？",
  feynman:"说清楚：怎么判断一个动词后面该接 to do 还是 doing？",
  socratic:[
    { ask:"先记一条最好用的规则。`He is good at ____ (sing).` 填什么？",
      opts:[
        {t:"singing", ok:true, back:"对。at 是介词，介词后面接动词必须变成 -ing 形式。"},
        {t:"to sing", ok:false, back:"注意 at 是什么词性？它是介词。介词后面能不能直接跟动词不定式？"}
      ],
      close:"**铁律一：介词后面一律加 doing**。at, in, of, about, for, without, by —— 后面跟动词都要变 -ing。"
    },
    { ask:"陷阱来了。`I'm looking forward to ____ (see) you.` 填什么？",
      opts:[
        {t:"see", ok:false, back:"这个 to 看起来像不定式的 to，但它其实是 look forward **to** 这个固定搭配里的**介词**。既然是介词，后面该加什么？"},
        {t:"seeing", ok:true, back:"对！look forward to 里的 to 是介词，不是不定式符号。这是中考最爱考的一个坑。"}
      ],
      close:"**「to 是介词」的固定搭配**（后面必须加 doing）：\nlook forward **to** doing（盼望）\npay attention **to** doing（注意）\nbe used **to** doing（习惯于）\nprefer... **to** doing（更喜欢）",
      rescue:"判断方法：如果 to 后面能接一个**名词**（look forward to the holiday ✓），那它就是介词，接动词时要加 -ing。"
    },
    { ask:"动词分类。`I enjoy ____ (read).` 填什么？",
      opts:[
        {t:"reading", ok:true, back:"对。enjoy 属于「只能接 doing」的那一类。"},
        {t:"to read", ok:false, back:"enjoy 是个特殊动词，它后面只能接 -ing 形式。这类动词需要单独记一个清单。"}
      ],
      close:"**只接 doing 的常用动词**（背这句话）：\n「**建议(suggest)避免(avoid)想(mind)完成(finish)，练习(practice)喜欢(enjoy)继续(keep)错过(miss)**」"
    },
    { ask:"意思不同的一对。`He stopped ____ (smoke).`（他戒烟了）填什么？",
      opts:[
        {t:"smoking", ok:true, back:"对。stop doing = 停止正在做的那件事。他停止了「抽烟」这个行为，就是戒烟。"},
        {t:"to smoke", ok:false, back:"stop **to** do 的意思是「停下手头的事，去做另一件事」——那就变成「他停下来去抽根烟」了，意思正好相反。"}
      ],
      close:"**意思不同的三对**：\nstop **doing** 停止做 ↔ stop **to do** 停下来去做\nforget **doing** 忘了做过 ↔ forget **to do** 忘了要做\nremember **doing** 记得做过 ↔ remember **to do** 记得要做\n规律：**doing 指向过去/正在，to do 指向将来**。"
    }
  ],
  quiz:[
    { id:"e07q1", src:"2024天津·真题改编", pt:"介词后加doing", lv:"基础", type:"choice", flash:true,
      stem:"Thank you for ____ me with my English.",
      options:["A. help","B. helping","C. to help","D. helped"],
      answer:"B",
      explain:"**for 是介词** → 后面接动词必须用 -ing 形式 → **helping**",
      trap:"Thank you for doing / Thanks for doing 是固定搭配，作文里高频使用。看到 for 就想 -ing。"
    },
    { id:"e07q2", src:"2023天津·同源", pt:"look forward to", lv:"基础", type:"choice", flash:true,
      stem:"We are looking forward to ____ you again soon.",
      options:["A. see","B. seeing","C. saw","D. be seen"],
      answer:"B",
      explain:"look forward **to** 里的 to 是**介词**（不是不定式符号）\n介词后面接动词 → -ing → **seeing**",
      trap:"这是中考英语最经典的陷阱之一，天津卷高频。\n验证法：look forward to **the party**（后面能接名词）→ 说明 to 是介词 → 接动词就要 -ing。"
    },
    { id:"e07q3", src:"2025天津·真题改编", pt:"动词后接形式", lv:"基础", type:"fill",
      stem:"用所给词的正确形式填空：She enjoys ____ (listen) to music after school.",
      answer:["listening"],
      explain:"enjoy 属于「只接 doing」的动词 → **listening**",
      trap:"只接 doing 的动词清单：enjoy, finish, mind, practice, keep, suggest, avoid, miss, give up, be busy。背这一句：「**建议避免想完成，练习喜欢继续错过**」。"
    },
    { id:"e07q4", src:"高频考点", pt:"stop doing/to do", lv:"中档", type:"choice",
      stem:"The students stopped ____ when the teacher came in.（老师进来时学生们停止了说话）",
      options:["A. to talk","B. talking","C. talk","D. talked"],
      answer:"B",
      explain:"括号里的中文说的是「**停止了说话**」= 停止正在做的那件事 → **stop doing** → **talking**\n（如果是 stop to talk，意思会变成「停下手头的事去说话」）",
      trap:"这一对靠中文意思判断：\n「停止做某事」→ stop **doing**\n「停下来去做某事」→ stop **to do**\n读中文提示时圈出「停止」还是「停下来去」。"
    },
    { id:"e07q5", src:"2024天津·同源", pt:"非谓语综合", lv:"中档", type:"choice",
      stem:"— Why not ____ a walk after supper?\n— Good idea. How about ____ to the park?",
      options:["A. take; go","B. to take; going","C. take; going","D. taking; to go"],
      answer:"C",
      explain:"第一空：**Why not + 动词原形** → **take**\n第二空：**How about + doing**（about 是介词）→ **going**",
      trap:"这两个提建议的句型长得像，接的形式却相反，中考最爱放在同一题里考：\n**Why not + 原形** / **Why don't you + 原形**\n**How about + doing** / **What about + doing**",
      deep:"非谓语判断三步：\n**① 前面是介词吗？**（in/on/at/for/about/of/to的介词用法）→ 是 → **doing**\n**② 前面是特定动词吗？**\n　只接 doing：enjoy finish mind practice keep suggest avoid miss\n　只接 to do：want hope decide plan agree learn would like\n**③ 是「意思不同」的那三对吗？**（stop/forget/remember）→ 看中文\n三步都不符合的，多半两个都行（like/love/begin/start）。"
    }
  ]
},

/* ---------------------------------------------------------- */
{
  id:"e08", point:"形容词副词比较等级", title:"比较级、最高级、同级比较",
  goal:"比较等级是单选固定考点，规则明确。这一课解决：怎么变、什么时候用 more、修饰词怎么配。",
  key:"两者比用比较级 + than；三者以上用 the + 最高级；much/even/a lot 修饰比较级，不能用 very。",
  recall:"This book is ____ (interesting) than that one. 填什么？为什么不是 interestinger？",
  feynman:"说清楚：什么时候加 er，什么时候用 more？",
  socratic:[
    { ask:"`Tom is ____ (tall) than Jack.` 填什么？",
      opts:[
        {t:"taller", ok:true, back:"对。有 than，说明是两者比较，用比较级。tall 是单音节词，直接加 er。"},
        {t:"tallest", ok:false, back:"注意句子里有 than。than 是「比」的意思，说明只有两个人在比。两者比用哪一级？"}
      ],
      close:"**看到 than，一定用比较级**。这是最可靠的信号。"
    },
    { ask:"`This book is ____ (interesting) than that one.` 填什么？",
      opts:[
        {t:"interestinger", ok:false, back:"interesting 有几个音节？in-ter-est-ing，四个音节。这么长的词直接加 er 会很难念，英语对长词有另一套办法。"},
        {t:"more interesting", ok:true, back:"对。三个音节及以上的词，前面加 more，不加 er。"}
      ],
      close:"**变化规则**：\n**短词（1-2音节）加 er/est**：tall→taller→tallest\n**长词（3音节以上）加 more/most**：interesting→more interesting→most interesting",
      rescue:"简单判断：这个词读起来长不长？超过两个音节（大致是超过 6-7 个字母且不是简单词）就用 more。"
    },
    { ask:"修饰词。`He is ____ taller than me.`（他比我高得多）填什么？",
      opts:[
        {t:"much", ok:true, back:"对。much/even/a lot/far 都可以修饰比较级，表示「……得多」。"},
        {t:"very", ok:false, back:"very 是用来修饰**原级**的（very tall）。它修饰不了比较级。表示「……得多」要用哪个词？"}
      ],
      close:"**能修饰比较级的**：much, even, a lot, far, a little, still\n**不能用 very**。very 只修饰原级。"
    },
    { ask:"最高级的范围。`He is the tallest ____ our class.` 填 in 还是 of？",
      opts:[
        {t:"in", ok:true, back:"对。class 是一个范围/团体，用 in。"},
        {t:"of", ok:false, back:"of 后面通常接同类事物的复数（of the three boys）。class 是一个整体范围，用哪个介词？"}
      ],
      close:"**最高级的范围**：\n**in + 单数**（地点、团体）：in our class, in the world\n**of + 复数**（同类比较对象）：of the three, of all the students"
    }
  ],
  quiz:[
    { id:"e08q1", src:"2024天津·真题改编", pt:"比较级", lv:"基础", type:"choice", flash:true,
      stem:"Lucy is ____ than her sister, but she is not the ____ in her class.",
      options:["A. taller; taller","B. tallest; tallest","C. taller; tallest","D. tallest; taller"],
      answer:"C",
      explain:"第一空有 **than** → 比较级 → **taller**\n第二空有 **the** 和 **in her class**（范围）→ 最高级 → **tallest**",
      trap:"最简单的判断信号：\n**看到 than → 比较级**\n**看到 the + in/of 范围 → 最高级**\n这两个信号几乎不会骗人。"
    },
    { id:"e08q2", src:"2023天津·同源", pt:"不规则变化", lv:"基础", type:"choice", flash:true,
      stem:"Which subject do you like ____ , English or math?",
      options:["A. well","B. better","C. best","D. good"],
      answer:"B",
      explain:"「English or math」说明只有**两个**在比 → 用比较级\nwell 的比较级是 **better**（不规则）",
      trap:"必背的不规则变化（中考必考）：\ngood / well → **better** → **best**\nbad / badly → **worse** → **worst**\nmany / much → **more** → **most**\nlittle → **less** → **least**\nfar → farther/further → farthest/furthest"
    },
    { id:"e08q3", src:"2025天津·真题改编", pt:"比较级修饰", lv:"基础", type:"choice",
      stem:"This room is ____ bigger than that one.",
      options:["A. very","B. much","C. so","D. too"],
      answer:"B",
      explain:"bigger 是比较级，能修饰它的是 **much / even / a lot / far / a little**\nvery、so、too 只能修饰**原级**（very big / so big / too big）",
      trap:"「非常大」= very big（原级）\n「大得多」= much bigger（比较级）\n中文都有「很」的意思，但英语区分严格。"
    },
    { id:"e08q4", src:"高频考点", pt:"同级比较", lv:"基础", type:"choice",
      stem:"Tom runs ____ as Jack.（Tom 跑得和 Jack 一样快）",
      options:["A. as fast","B. as faster","C. so fast","D. as fastest"],
      answer:"A",
      explain:"「和……一样……」用 **as + 原级 + as** 结构\nas **fast** as → 中间必须用**原级**，不能用比较级或最高级",
      trap:"同级比较的两个句型：\n肯定：**as + 原级 + as**（和……一样）\n否定：**not as/so + 原级 + as**（不如……）\n中间永远是**原级**，这是最容易错的地方。"
    },
    { id:"e08q5", src:"2024天津·同源", pt:"比较级特殊句型", lv:"中档", type:"choice",
      stem:"The weather is getting ____ .（天气越来越暖和了）",
      options:["A. warm and warm","B. warmer and warmer","C. more and more warm","D. warmest and warmest"],
      answer:"B",
      explain:"「越来越……」的固定句型：**比较级 + and + 比较级**\nwarm 是短词 → warmer → **warmer and warmer**",
      trap:"如果是长词，句型变成 **more and more + 原级**：\nmore and more beautiful（越来越漂亮）\n短词用 A and A（比较级重复），长词用 more and more + 原级。",
      deep:"比较级三个高频固定句型：\n① **比较级 + and + 比较级** = 越来越……\n　（短词：taller and taller｜长词：more and more beautiful）\n② **the + 比较级, the + 比较级** = 越……就越……\n　The harder you work, the more you will get.\n③ **one of the + 最高级 + 复数名词** = 最……之一\n　one of the **tallest boys**（注意名词必须是复数）"
    }
  ]
},

/* ---------------------------------------------------------- */
{
  id:"e09", point:"定语从句", title:"who 管人，which 管物，that 都能管",
  goal:"定语从句是天津卷单选的固定考点。这一课解决：关系词怎么选，什么时候只能用 that。",
  key:"先行词是人用 who，是物用 which，that 通用；先行词有最高级/序数词/all/only 时只能用 that。",
  recall:"The boy ____ is running is my brother. 填什么？为什么？",
  feynman:"说清楚：怎么找到定语从句修饰的是哪个词？",
  socratic:[
    { ask:"看这句：`The boy who is running is my brother.` 从句 `who is running` 在修饰哪个词？",
      opts:[
        {t:"The boy", ok:true, back:"对。这个从句是在告诉你「哪一个男孩」——正在跑的那个。被修饰的词叫**先行词**。"},
        {t:"my brother", ok:false, back:"从句紧跟在哪个词后面？定语从句一般紧挨着它修饰的那个词。"}
      ],
      close:"**先行词 = 定语从句紧跟着的那个名词**。找先行词就看从句前面挨着的是谁。"
    },
    { ask:"那关系词怎么选？先行词是 boy（人），该用哪个？",
      opts:[
        {t:"who 或 that", ok:true, back:"对。人用 who，that 也可以（that 人物通吃）。"},
        {t:"which", ok:false, back:"which 是用来指物的。boy 是人还是物？"}
      ],
      close:"**关系词选择**：\n先行词是**人** → who / that\n先行词是**物** → which / that\n不确定时用 **that** 最安全（除了少数特殊情况）。"
    },
    { ask:"特殊情况。`This is the best film ____ I have ever seen.` 填 which 还是 that？",
      opts:[
        {t:"which", ok:false, back:"注意 film 前面有个 **best**——这是最高级。当先行词被最高级修饰时，英语有个硬性规定，只能用某一个关系词。"},
        {t:"that", ok:true, back:"对。先行词被最高级修饰时，只能用 that。"}
      ],
      close:"**只能用 that 的情况**（背这一串）：\n先行词有 **最高级、序数词（the first）、all、every、no、only、very** 修饰时\n或先行词是 **everything / anything / nothing / something**",
      rescue:"记忆句：「**最（最高级）先（序数词）都（all）没（no）只（only）**」，看到这些词，关系词一律选 that。"
    },
    { ask:"最后。判断这句对不对：`The book which I bought it is interesting.`",
      opts:[
        {t:"错，it 多余", ok:true, back:"对。which 已经代替了 the book 在从句中做宾语，不能再出现一个 it。"},
        {t:"对", ok:false, back:"数一数从句 `I bought it` 里，bought 的宾语是谁？which 本身就是代表 the book 做宾语的。现在有两个宾语了。"}
      ],
      close:"**关系词已经替代了先行词在从句中的成分，不能重复**。写 `which I bought` 就够了，不能再加 it。"
    }
  ],
  quiz:[
    { id:"e09q1", src:"2024天津·真题改编", pt:"关系词选择", lv:"基础", type:"choice", flash:true,
      stem:"The girl ____ is wearing a red skirt is my cousin.",
      options:["A. which","B. who","C. what","D. whose"],
      answer:"B",
      explain:"先行词是 **The girl**（人）→ 关系词用 **who**（或 that）\nwhich 指物，排除；what **不能**引导定语从句；whose 表示「谁的」，这里不需要。",
      trap:"**what 永远不能引导定语从句**。看到选项里有 what，在定语从句题里直接划掉。"
    },
    { id:"e09q2", src:"2023天津·同源", pt:"只用that的情况", lv:"基础", type:"choice", flash:true,
      stem:"This is the most interesting book ____ I have ever read.",
      options:["A. which","B. who","C. that","D. what"],
      answer:"C",
      explain:"先行词 book 被**最高级 most interesting** 修饰\n→ 关系词**只能用 that**",
      trap:"记住触发词：**最高级、序数词、all、every、no、only、very**。\n看到这些修饰先行词，关系词一律选 that，别犹豫。"
    },
    { id:"e09q3", src:"2025天津·真题改编", pt:"定语从句", lv:"基础", type:"choice",
      stem:"I like the pen ____ you gave me yesterday.",
      options:["A. who","B. which","C. whose","D. what"],
      answer:"B",
      explain:"先行词是 **the pen**（物）→ 用 **which**（或 that）",
      trap:"这里 which 在从句中做 gave 的**宾语**（gave me **it**），做宾语时关系词可以省略：\nI like the pen you gave me. ✓（省略了 which）\n但做**主语**时不能省略。"
    },
    { id:"e09q4", src:"高频考点", pt:"定语从句主谓一致", lv:"中档", type:"choice",
      stem:"The students ____ are from Tianjin ____ good at English.",
      options:["A. who; is","B. which; are","C. who; are","D. that; is"],
      answer:"C",
      explain:"第一空：先行词 The students 是人 → **who**（that 也行，但选项 D 的第二空错了）\n第二空：句子的主语是 **The students**（复数）→ 主句动词用 **are**",
      trap:"从句 `who are from Tianjin` 是插进来修饰主语的，把它整段划掉再看主句：\nThe students ____ good at English → 主语是复数 → are。\n**遇到长句先划掉从句**，主句结构立刻清晰。"
    },
    { id:"e09q5", src:"2024天津·同源", pt:"定语从句", lv:"中档", type:"choice",
      stem:"Everything ____ he said at the meeting is right.",
      options:["A. which","B. that","C. what","D. who"],
      answer:"B",
      explain:"先行词是 **Everything** —— 属于「只能用 that」的清单\n（everything / anything / nothing / something / all 作先行词时，只用 that）",
      trap:"注意区分：\n**Everything that he said** 是定语从句（Everything 是先行词）\n**What he said** 是宾语从句（what 本身包含了先行词，前面没有名词）\n有先行词 → that；没先行词 → what。",
      deep:"定语从句解题三步：\n**① 找先行词**——从句前面紧挨着的那个名词\n**② 判断人还是物**——人 who / 物 which / 都行 that\n**③ 检查特殊情况**——先行词有最高级、序数词、all、only、every、no，或是 everything 这类词 → **只能用 that**\n附加提醒：what 从来不引导定语从句，见到就排除。"
    }
  ]
},

/* ---------------------------------------------------------- */
{
  id:"e10", point:"情态动词与句型转换", title:"can/must/should，还有那些反义的坑",
  goal:"情态动词是单选高频点，规则少但陷阱密集。这一课重点解决 mustn't 和 needn't 这类容易搞反的词。",
  key:"情态动词后一律接动词原形；mustn't = 禁止，needn't = 不必，两者意思相反。",
  recall:"「你不必去」和「你禁止去」分别怎么说？",
  feynman:"说清楚：must 提问的否定回答为什么不能用 mustn't？",
  socratic:[
    { ask:"基础规则。`He can ____ (swim).` 填什么？",
      opts:[
        {t:"swim", ok:true, back:"对。情态动词后面永远接动词原形，不加 s、不加 ing、不加 to。"},
        {t:"swims", ok:false, back:"虽然主语是 He，但前面已经有 can 了。情态动词后面的动词有什么固定形式要求？"}
      ],
      close:"**情态动词（can, may, must, should, will, would）后面永远接动词原形**。不受主语影响，不加 s。"
    },
    { ask:"关键辨析。「你不必来」用哪个？`You ____ come.`",
      opts:[
        {t:"needn't", ok:true, back:"对。needn't = 不必、没必要，语气很轻。"},
        {t:"mustn't", ok:false, back:"mustn't 的意思是「禁止、绝对不许」，语气非常重。「不必」和「禁止」是一回事吗？"}
      ],
      close:"**mustn't = 禁止（绝对不许）**\n**needn't = 不必（可以不做，做了也行）**\n中文都有「不」，英文语气天差地别。"
    },
    { ask:"陷阱。`— Must I finish it today?` 如果回答是「不必」，该怎么说？",
      opts:[
        {t:"No, you needn't.", ok:true, back:"对。虽然问句用的是 must，但答「不必」时要换成 needn't 或 don't have to。"},
        {t:"No, you mustn't.", ok:false, back:"如果这么答，意思就变成「不，你绝对不许完成它」——这显然不是「不必」的意思。"}
      ],
      close:"**Must 提问的否定回答用 needn't / don't have to**，不能用 mustn't（那是「禁止」）。这是中考的固定考点。",
      rescue:"记忆钩子：**must 问，need 答**。肯定答 Yes, you must；否定答 No, you needn't。"
    },
    { ask:"最后。`You ____ be tired after the long trip.`（你长途旅行后一定很累）填什么？",
      opts:[
        {t:"must", ok:true, back:"对。must 除了「必须」，还可以表示「一定是、肯定」的推测。"},
        {t:"can", ok:false, back:"can 表示「能够」或「可能」，语气不够肯定。题目里的「一定」需要一个更确定的词。"}
      ],
      close:"**must 的两个含义**：\n① 必须（You must go now.）\n② **一定是、肯定**（表推测，He must be at home.）\n推测的否定用 **can't**（不可能），不用 mustn't。"
    }
  ],
  quiz:[
    { id:"e10q1", src:"2024天津·真题改编", pt:"情态动词辨析", lv:"基础", type:"choice", flash:true,
      stem:"You ____ smoke here. It's a no-smoking area.",
      options:["A. needn't","B. mustn't","C. don't have to","D. may not have to"],
      answer:"B",
      explain:"「这是无烟区」→ 说明是**禁止**吸烟，不是「可以不吸」\n禁止 → **mustn't**",
      trap:"A 和 C 都是「不必」的意思，语气太轻，和「无烟区」的语境不符。\n**看后半句的语境**判断是「禁止」还是「不必」。"
    },
    { id:"e10q2", src:"2023天津·同源", pt:"must的答语", lv:"基础", type:"choice", flash:true,
      stem:"— Must I hand in my homework now?\n— No, you ____ . You can hand it in tomorrow.",
      options:["A. mustn't","B. needn't","C. can't","D. shouldn't"],
      answer:"B",
      explain:"答句后面说「你可以明天交」→ 说明是「**不必**现在交」，不是禁止\n→ **needn't**（也可以说 don't have to）",
      trap:"**Must 问句的否定回答，永远不用 mustn't**。\n用 needn't 或 don't have to。这条规则每年都考。"
    },
    { id:"e10q3", src:"2025天津·真题改编", pt:"情态动词", lv:"基础", type:"choice",
      stem:"— Could you please help me?\n— ____ .",
      options:["A. Yes, I could","B. No, I couldn't","C. Sure, I'd love to","D. Yes, please"],
      answer:"C",
      explain:"Could you please...? 是**委婉的请求**，不是在问过去的能力。\n答语不用 could，要用表示乐意的说法：Sure / Of course / Certainly / **I'd love to**",
      trap:"这是一个「语用」考点，不是语法考点。\nCould you...? 里的 could 表示客气，答语不能机械地用 could 对应。"
    },
    { id:"e10q4", src:"高频考点", pt:"情态动词推测", lv:"中档", type:"choice",
      stem:"The light in his room is off. He ____ be at home.",
      options:["A. must","B. can't","C. mustn't","D. needn't"],
      answer:"B",
      explain:"「他房间的灯关着」→ 推测「他**不可能**在家」\n表示「不可能」的推测，用 **can't**",
      trap:"**推测的肯定用 must（一定是），否定用 can't（不可能）**。\n绝不能用 mustn't 表示「不可能」——mustn't 只表示「禁止」。"
    },
    { id:"e10q5", src:"2024天津·同源", pt:"情态动词综合", lv:"中档", type:"choice",
      stem:"You ____ be careful when you cross the road. And you ____ look at your phone.",
      options:["A. should; mustn't","B. shouldn't; must","C. needn't; should","D. can; needn't"],
      answer:"A",
      explain:"第一空：「过马路时**应该**小心」→ 建议 → **should**\n第二空：「**绝不能**看手机」→ 禁止（这是安全问题）→ **mustn't**",
      trap:"按语气强弱选词：\n**can/may** = 可以（许可，最轻）\n**should** = 应该（建议）\n**have to** = 不得不（客观强制）\n**must** = 必须（主观强烈）\n**mustn't** = 禁止（最强的否定）",
      deep:"情态动词速查表（考前扫一遍）：\n| 想表达 | 用哪个 |\n|---|---|\n| 能够 | can / could |\n| 可以（许可）| may / can |\n| 应该（建议）| should / ought to |\n| 必须（主观）| must |\n| 不得不（客观）| have to |\n| **不必** | needn't / don't have to |\n| **禁止** | mustn't |\n| 一定是（推测）| must be |\n| 不可能（推测）| can't be |\n最容易错的两组：needn't ↔ mustn't（不必 vs 禁止）；must be ↔ can't be（推测的正反）。"
    }
  ]
},

/* ---------------------------------------------------------- */
{
  id:"e11", point:"阅读理解解题策略", title:"读不懂也能做对：定位法",
  goal:"阅读理解占天津卷英语的大头。基础薄弱时不要求全文读懂，这一课教「不全懂也能拿分」的定位法。",
  key:"先读题目再读文章；细节题回原文找关键词定位；主旨题看首段末段和每段首句。",
  recall:"做阅读理解时，你是先读文章还是先读题目？为什么？",
  feynman:"说清楚：遇到看不懂的单词，你有哪几种办法猜出意思？",
  socratic:[
    { ask:"做阅读理解，你觉得应该先读文章还是先读题目？",
      opts:[
        {t:"先读题目", ok:true, back:"对。带着问题读，你的眼睛会主动去找答案，效率高得多，也不会因为读不懂某段就慌。"},
        {t:"先读文章", ok:false, back:"想一想：如果先通读全文，读完你能记住多少细节？而且遇到生词多的段落容易卡住、失去信心。有没有更省力的顺序？"}
      ],
      close:"**先读题目，再带着问题读文章**。这样每读一段都有明确目标，不会白读。"
    },
    { ask:"细节题（问某个具体信息）怎么做最快？",
      opts:[
        {t:"回原文找关键词定位", ok:true, back:"对。题目里的人名、地名、数字、专有名词，在原文里几乎会原样出现，找到它，答案就在附近一两句里。"},
        {t:"凭印象选", ok:false, back:"印象很容易骗人，尤其是选项里会放几个「文章里确实提到过、但不是问题答案」的干扰项。有没有更可靠的办法？"}
      ],
      close:"**细节题 = 定位题**。从题干里挑一个最独特的词（人名、数字、大写词），回原文扫描找到它，答案就在那一句或前后一句。"
    },
    { ask:"主旨大意题（问文章讲什么）看哪里？",
      opts:[
        {t:"首段、末段和每段第一句", ok:true, back:"对。英语文章是「总—分—总」结构，观点几乎都在这些位置。"},
        {t:"通读全文再总结", ok:false, back:"时间不够的时候这样很吃亏。英语议论文和说明文有固定结构，重要信息集中出现在哪些位置？"}
      ],
      close:"**主旨题只看三个位置**：第一段、最后一段、每段的第一句。这些位置串起来就是文章骨架。"
    },
    { ask:"遇到不认识的单词怎么办？",
      opts:[
        {t:"跳过，看上下文猜大概意思", ok:true, back:"对。中考阅读一定会有生词，这是故意设计的。整篇有 5-10 个生词完全不影响做对题。"},
        {t:"停下来纠结", ok:false, back:"一个词卡住三分钟，后面的题就没时间了。而且很多生词根本和题目无关。想想有没有更划算的做法？"}
      ],
      close:"**猜词三招**：\n① 看后面有没有解释（破折号、that is、or 后面常跟解释）\n② 看构词法（un- 否定，-less 无，-ful 有，re- 再）\n③ 看上下文的情感色彩（周围是好话还是坏话）"
    }
  ],
  quiz:[
    { id:"e11q1", src:"解题策略", pt:"阅读方法", lv:"基础", type:"choice", flash:true,
      stem:"阅读理解中，如果一道题问「According to Paragraph 3, ...」，最有效的做法是（　）",
      options:[
        "A. 通读全文找答案",
        "B. 直接跳到第三段，在该段内找答案",
        "C. 看最后一段的总结",
        "D. 凭第一遍阅读的印象选"
      ],
      answer:"B",
      explain:"题干已经明确告诉你答案在**第三段**（According to Paragraph 3）。\n直接定位到那一段精读，其他段落完全不用看。\n这类题是中考阅读里最容易拿的分。",
      trap:"看到题干里出现 Paragraph 数字、行号、引号里的短语，这些都是**定位信号**，直接跳过去找，不要浪费时间通读。"
    },
    { id:"e11q2", src:"构词法", pt:"猜词", lv:"基础", type:"choice", flash:true,
      stem:"根据构词法判断，`useless` 的意思最可能是（　）",
      options:["A. 有用的","B. 无用的","C. 使用","D. 用户"],
      answer:"B",
      explain:"use（用）+ **-less**（表示「没有、无」的后缀）= **无用的**\n同类：hopeless（无望的）、careless（粗心的）、homeless（无家可归的）",
      trap:"高频后缀清单（能猜出大量生词）：\n**-less** 无（useless 无用）\n**-ful** 充满（helpful 有帮助的）\n**-er/-or** 人（teacher 老师）\n**-tion/-ment** 名词（education 教育）\n**-ly** 副词（quickly 快速地）\n**un-/in-/im-/dis-** 否定（unhappy 不快乐）"
    },
    { id:"e11q3", src:"解题策略", pt:"主旨题", lv:"基础", type:"choice",
      stem:"做「What is the main idea of the passage?」这类题时，最该重点看的是（　）",
      options:[
        "A. 文章中间的例子和数据",
        "B. 第一段、最后一段和各段首句",
        "C. 生词最多的那一段",
        "D. 最长的那一段"
      ],
      answer:"B",
      explain:"英语说明文和议论文是**总—分—总**结构：\n第一段提出话题/观点，中间段落举例论证，最后一段总结。\n把首段、末段、各段首句连起来读，就是文章的骨架。",
      trap:"主旨题的错误选项通常是「文章里确实提到、但只是一个细节」的内容。\n判断标准：这个选项能不能**概括全文**？只覆盖一段的，一律排除。"
    },
    { id:"e11q4", src:"解题策略", pt:"推理题", lv:"中档", type:"choice",
      stem:"阅读题中，下列哪种选项最可能是错误答案（　）",
      options:[
        "A. 用原文的同义词改写过的选项",
        "B. 含有 always / never / all / only 等绝对化词语的选项",
        "C. 表述比较温和的选项",
        "D. 概括了全文的选项"
      ],
      answer:"B",
      explain:"含 **always / never / all / none / only / must** 这类**绝对化**词语的选项，绝大多数是错的。\n原文通常表述温和（some, may, often, usually），出题人把它改成绝对化就变成了陷阱。",
      trap:"这是一条实用的排除技巧，但**不是100%的规律**——偶尔正确答案也会含绝对词。\n用法：把它当作「优先怀疑对象」，先看别的选项，实在选不出来再考虑它。"
    },
    { id:"e11q5", src:"解题策略", pt:"时间分配", lv:"基础", type:"choice",
      stem:"考试时遇到一篇阅读，第一遍读完有 8 个生词，完全看不懂大意。最好的做法是（　）",
      options: [
        "A. 反复读直到看懂为止",
        "B. 直接空着不做",
        "C. 先做能定位的细节题，主旨题最后猜",
        "D. 随便全选 C"
      ],
      answer:"C",
      explain:"看不懂大意 ≠ 一道题都做不了。\n**细节题**只需要在原文找到关键词，不需要理解全文——这部分分照样能拿。\n主旨题实在做不了，最后凭首末段猜一个，也有 25% 以上的概率。",
      trap:"基础薄弱时最大的陷阱是「看不懂就全放弃」。\n中考阅读里，**细节定位题通常占一半以上**，这些题不需要读懂全文。",
      deep:"阅读理解的实战流程（按这个顺序做，能多拿 5-8 分）：\n**① 先看题目**（30秒），圈出每题的定位词\n**② 扫读文章**，遇到定位词就停下来精读那两三句，把对应的题做掉\n**③ 细节题全部做完后**，再回头处理主旨题和推理题\n**④ 生词一律跳过**，除非它就在定位句里（这时用构词法猜）\n记住：**读不懂 ≠ 做不对**。中考阅读考的是找信息的能力，不是全文翻译能力。"
    }
  ]
},

/* ---------------------------------------------------------- */
{
  id:"e12", point:"书面表达", title:"作文模板：套上去就有分",
  goal:"书面表达是英语最容易靠模板提分的部分。基础薄弱时不追求文采，只求「结构完整、句子不错」。",
  key:"三段式：开头点题 + 中间三点 + 结尾总结；宁可用简单句写对，不用复杂句写错。",
  recall:"写作文时，是用你会的简单句，还是冒险用复杂句？为什么？",
  feynman:"说清楚：一篇中考英语作文，你会按什么结构来写？",
  socratic:[
    { ask:"写作文时，你有一个想表达的意思，但不确定复杂句型对不对。你怎么办？",
      opts:[
        {t:"改用自己有把握的简单句表达", ok:true, back:"对。中考作文评分主要看**内容完整 + 语言准确**，不是看句子多花哨。写错的复杂句反而扣分。"},
        {t:"冒险用复杂句，显得水平高", ok:false, back:"想一想：阅卷老师看到一个语法错误的长句，和一个完全正确的短句，哪个扣分？中考作文的评分标准更看重什么？"}
      ],
      close:"**宁可用简单句写对，不用复杂句写错**。基础薄弱阶段，准确率比复杂度值钱得多。"
    },
    { ask:"一篇中考英语作文（通常 80-100 词），最稳妥的结构是？",
      opts:[
        {t:"开头1-2句点题 + 中间3句展开 + 结尾1句总结", ok:true, back:"对。这个结构清晰、好写、阅卷老师一眼能看到要点。"},
        {t:"想到哪写到哪", ok:false, back:"没有结构的作文，阅卷老师找不到要点，很难给高分。而且你自己写的时候也容易漏掉题目要求的内容。"}
      ],
      close:"**三段式结构**：\n① 开头（1-2句）：点明话题\n② 主体（3-4句）：分点展开，用 First / Second / Besides 连接\n③ 结尾（1句）：总结或表达愿望"
    },
    { ask:"写之前最重要的一步是什么？",
      opts:[
        {t:"把题目要求的所有要点圈出来，逐条对应", ok:true, back:"对。中考作文题会明确列出「需要包含的内容」，漏掉一条就直接扣分，这是最冤枉的失分。"},
        {t:"想一个漂亮的开头句", ok:false, back:"开头再漂亮，如果漏掉了题目要求写的某一点，还是会被扣分。有什么比开头更该先确认？"}
      ],
      close:"**动笔前先圈要点**：把题目要求的每一条列在草稿纸上，写完一条打个勾。这一步能保住至少 3-5 分。",
      rescue:"实操：在草稿纸上写「①②③」，把题目的要求对应写上，然后每写完一段就回头打勾。"
    },
    { ask:"最后。作文写完还剩 2 分钟，你该干什么？",
      opts:[
        {t:"检查三单、时态、大小写、标点", ok:true, back:"对。这几项是「一眼就能看出来」的低级错误，改一个就多一点分，性价比最高。"},
        {t:"再加两个华丽的句子", ok:false, back:"新加的句子可能带来新错误，而且时间紧容易写错。有没有更稳的用法？"}
      ],
      close:"**考前最后 2 分钟只检查 4 件事**：\n① 三单的 s 有没有漏\n② 时态是不是统一\n③ 句首大写、句末句号\n④ 有没有漏掉题目要求的某一点"
    }
  ],
  quiz:[
    { id:"e12q1", src:"写作模板", pt:"作文结构", lv:"基础", type:"fill",
      stem:"作文开头万能句：「随着……的发展」用英语怎么说？（填 4 个词，with 开头）",
      answer:["with the development of"],
      explain:"**With the development of** ... 是中考作文最常用的开头句之一。\n例：With the development of the Internet, our life has changed a lot.",
      trap:"背 4-5 个万能句，几乎任何话题都能套上去开头。这是纯记忆分。"
    },
    { id:"e12q2", src:"写作模板", pt:"作文结尾", lv:"基础", type:"fill",
      stem:"作文结尾万能句：「总之」用英语怎么说？（填 3 个词，用 all 开头）",
      answer:["all in all"],
      explain:"**All in all**, ... = 总之\n同义表达：In a word / In short / To sum up",
      trap:"结尾句一定要写，它是「结构完整」的标志。一句话的事，别省。"
    },
    { id:"e12q3", src:"写作策略", pt:"作文得分点", lv:"基础", type:"choice", flash:true,
      stem:"中考英语作文中，最容易且最冤枉的失分是（　）",
      options:[
        "A. 用词不够高级",
        "B. 漏掉了题目要求写的某一个要点",
        "C. 句子太短",
        "D. 没有用复杂句型"
      ],
      answer:"B",
      explain:"中考作文题会明确列出「内容要点」，评分时**逐条对应给分**。\n漏掉一条，那部分分数直接没有，和你写得多好无关。",
      trap:"动笔前花 30 秒把要点圈出来编号，写完逐条打勾。这 30 秒能保住 3-5 分，是全卷性价比最高的 30 秒。"
    },
    { id:"e12q4", src:"写作策略", pt:"连接词", lv:"基础", type:"choice",
      stem:"作文中分点叙述时，最合适的连接词组合是（　）",
      options:[
        "A. One, Two, Three",
        "B. First, Second, Besides / Finally",
        "C. 1, 2, 3",
        "D. 不用连接词，直接写"
      ],
      answer:"B",
      explain:"英语作文用 **First / Firstly, Second / Besides, Finally / In addition** 来分点，\n阅卷老师一眼就能看到你的三个要点，结构分稳拿。",
      trap:"连接词是「结构清晰」的显性标志。写作文时**每个要点前面都加一个连接词**，成本极低，效果明显。"
    },
    { id:"e12q5", src:"写作策略", pt:"作文检查", lv:"基础", type:"choice",
      stem:"作文写完后检查，下列哪一项最应该优先检查（　）",
      options:[
        "A. 有没有用到高级词汇",
        "B. 三单的 s、时态是否统一、句首是否大写",
        "C. 字数是不是刚好",
        "D. 卷面是不是好看"
      ],
      answer:"B",
      explain:"三单漏 s、时态混乱、句首不大写，都是**一眼可见的低级错误**，阅卷时最影响印象分。\n而且这些错误改起来只要几秒钟，性价比最高。",
      trap:"字数不用数得很准，差几个词不影响；卷面整洁重要但已经写完改不了。\n**优先改那些「改一处就少扣一处」的语法错误**。",
      deep:"中考英语作文万能框架（背下来，任何题目都能套）：\n\n**开头（1-2句）**\n With the development of ..., ... has become more and more important.\n 或 Recently, we have had a discussion about ...\n\n**主体（3-4句）**\n First, ... （第一个要点）\n Second, ... （第二个要点）\n Besides, ... （第三个要点）\n\n**结尾（1-2句）**\n In my opinion, ... （表达看法）\n All in all, ... （总结）\n\n用法：把题目给的要点填进 First/Second/Besides 后面，开头结尾照抄。\n**这个框架本身就值好几分的结构分**，而且完全不需要临场发挥。"
    }
  ]
}

];
