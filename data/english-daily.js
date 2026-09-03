/* ============================================================
   english-daily.js — 每日 5 分钟英语微剂量
   英语是全卷最大失分项（120分只拿65.5，且在下滑）。
   词汇/固定搭配靠「见面次数」，不靠单次时长 —— 所以拆成每天5分钟。
   共 36 组，290 天会循环约 8 轮，天然形成间隔重复。
   ============================================================ */
window.ENGLISH_DAILY = [

{ id:"ed01", topic:"高频动词短语 · look 家族",
  cards:[
    {front:"look after", back:"照顾（= take care of）", eg:"She looks **after** her little brother every day."},
    {front:"look for", back:"寻找（强调过程，不一定找到）", eg:"I'm looking **for** my keys."},
    {front:"look forward to", back:"盼望（**to 是介词，后面加 doing**）", eg:"I look forward **to seeing** you."},
    {front:"look up", back:"查（字典/资料）", eg:"Look **up** the new word in the dictionary."}
  ],
  check:[
    {stem:"照顾老人：__ __ the old people（填两个词）", answer:["look after"], note:"look after = take care of，中考近三年反复考。"},
    {stem:"I'm looking forward to ____ (see) you again.", answer:["seeing"], note:"look forward **to** 里的 to 是介词不是不定式，后面必须加 -ing。这是中考最爱挖的坑。"},
    {stem:"查生词：____ ____ the new words（填两个词）", answer:["look up"], note:"look up 查阅；代词要放中间：look it up。"}
  ]},

{ id:"ed02", topic:"高频动词短语 · take 家族",
  cards:[
    {front:"take care of", back:"照顾（= look after）", eg:"Who **takes care of** the baby?"},
    {front:"take off", back:"①脱下 ②（飞机）起飞", eg:"The plane **took off** at 8."},
    {front:"take part in", back:"参加（活动）", eg:"He **took part in** the sports meeting."},
    {front:"take turns", back:"轮流（**take turns to do / doing**）", eg:"We **take turns to** clean the room."}
  ],
  check:[
    {stem:"参加运动会：____ ____ ____ the sports meeting（三个词）", answer:["take part in"], note:"take part in = join in，参加活动；join 后面直接跟组织（join the club）。"},
    {stem:"飞机起飞了：The plane ____ ____ .（过去式，两个词）", answer:["took off"], note:"take 的过去式是 took，不是 taked。"},
    {stem:"脱下你的外套：____ ____ your coat.", answer:["take off"], note:"take off 脱下 ↔ put on 穿上。"}
  ]},

{ id:"ed03", topic:"不规则动词过去式（最高频12个）",
  cards:[
    {front:"go / do / see", back:"went / did / saw", eg:"过去式全变形，没有规律，只能背。"},
    {front:"eat / take / give", back:"ate / took / gave", eg:""},
    {front:"buy / bring / think", back:"bought / brought / thought", eg:"三个都是 -ought 结尾，一起记。"},
    {front:"write / speak / break", back:"wrote / spoke / broke", eg:"三个都是 o 音，一起记。"}
  ],
  check:[
    {stem:"He ____ (buy) a new phone last week.", answer:["bought"], note:"buy → bought。和 bring→brought、think→thought 一组记。"},
    {stem:"She ____ (write) a letter yesterday.", answer:["wrote"], note:"write → wrote → written。"},
    {stem:"They ____ (take) a lot of photos.", answer:["took"], note:"take → took → taken。"}
  ]},

{ id:"ed04", topic:"介词 in / on / at 时间用法",
  cards:[
    {front:"in", back:"大时间：年、月、季节、上下午", eg:"**in** 2027 / **in** May / **in** the morning"},
    {front:"on", back:"具体某天：星期、日期、特定某天的早上", eg:"**on** Monday / **on** May 1st / **on** a cold morning"},
    {front:"at", back:"点钟、瞬间", eg:"**at** 8 o'clock / **at** night / **at** noon"},
    {front:"口诀", back:"年月季用 in，日期星期用 on，几点钟用 at；**at night** 是特例", eg:""}
  ],
  check:[
    {stem:"____ the morning of May 1st（填介词）", answer:["on"], note:"本来 in the morning，但一旦有了具体日期修饰，就变 on。中考高频陷阱。"},
    {stem:"My birthday is ____ June.（填介词）", answer:["in"], note:"只有月份没有日期 → in。"},
    {stem:"I get up ____ six o'clock.（填介词）", answer:["at"], note:"点钟用 at。"}
  ]},

{ id:"ed05", topic:"一般现在时 · 第三人称单数",
  cards:[
    {front:"规则", back:"主语是 he/she/it 或单数名词 → 动词加 s/es", eg:"He **works** hard."},
    {front:"变 es 的情况", back:"以 s, x, ch, sh, o 结尾 → 加 es", eg:"go→goes, watch→watches, do→does"},
    {front:"辅音+y", back:"变 y 为 i 再加 es", eg:"study→studies, fly→flies"},
    {front:"否定/疑问", back:"用 doesn't / Does，**后面动词还原**", eg:"He **doesn't like** it.（不是 doesn't likes）"}
  ],
  check:[
    {stem:"She ____ (study) English every day.", answer:["studies"], note:"辅音字母+y → 变 y 为 i 加 es。"},
    {stem:"He doesn't ____ (like) fish.", answer:["like"], note:"doesn't 后面动词必须还原！这是送分题里最常丢的一分。"},
    {stem:"My father ____ (go) to work by bus.", answer:["goes"], note:"o 结尾加 es。"}
  ]},

{ id:"ed06", topic:"现在完成时 · have/has done",
  cards:[
    {front:"结构", back:"have / has + 过去分词（done）", eg:"I **have finished** my homework."},
    {front:"标志词", back:"already, yet, ever, never, just, before, since, for", eg:"He has **never** been there."},
    {front:"have been to", back:"去过（人回来了）", eg:"I **have been to** Beijing.（去过，已回）"},
    {front:"have gone to", back:"去了（人还没回）", eg:"He **has gone to** Beijing.（去了，人不在）"}
  ],
  check:[
    {stem:"I have ____ (finish) my homework already.", answer:["finished"], note:"have + 过去分词。"},
    {stem:"他去过上海（人已回来）：He has ____ ____ to Shanghai.", answer:["been"], note:"注意只填一个词：been。been to = 去过并回来；gone to = 去了没回。"},
    {stem:"She has lived here ____ 2020.（since 还是 for）", answer:["since"], note:"since + 时间点，for + 时间段。2020 是时间点 → since。"}
  ]},

{ id:"ed07", topic:"被动语态 · be + done",
  cards:[
    {front:"结构", back:"be + 过去分词（by 某人）", eg:"The window **was broken** by Tom."},
    {front:"一般现在被动", back:"am/is/are + done", eg:"English **is spoken** here."},
    {front:"一般过去被动", back:"was/were + done", eg:"The house **was built** in 1990."},
    {front:"情态动词被动", back:"can/must/should + **be** + done", eg:"It **must be finished** today."}
  ],
  check:[
    {stem:"The classroom ____ (clean) every day.（被动）", answer:["is cleaned"], note:"教室是被打扫的 → is + cleaned。每天 → 一般现在时。"},
    {stem:"这本书是2020年出版的：The book ____ ____ in 2020.", answer:["was published","was printed"], note:"过去被动 = was/were + 过去分词。"},
    {stem:"作业必须今天完成：The homework must ____ ____ today.", answer:["be finished","be done"], note:"情态动词后面必须用 be，不能用 is/was。"}
  ]},

{ id:"ed08", topic:"形容词副词比较级 · 最高级",
  cards:[
    {front:"比较级", back:"两者比：形容词 + er / more + 形容词 + **than**", eg:"He is **taller than** me."},
    {front:"最高级", back:"三者以上：**the** + est / most", eg:"She is **the tallest** in her class."},
    {front:"不规则", back:"good/well→better→best；bad→worse→worst；many/much→more→most", eg:""},
    {front:"程度修饰", back:"much / a lot / even / far + 比较级（**不能用 very**）", eg:"**much** better（不能说 very better）"}
  ],
  check:[
    {stem:"This book is ____ (interesting) than that one.", answer:["more interesting"], note:"多音节词用 more，不加 er。"},
    {stem:"Tom is the ____ (good) student in our class.", answer:["best"], note:"good 的最高级是 best，不规则，必须背。"},
    {stem:"He runs much ____ (fast) than me.", answer:["faster"], note:"much 后面必须接比较级；very 不能修饰比较级。"}
  ]},

{ id:"ed09", topic:"there be 句型 · 主谓一致",
  cards:[
    {front:"就近原则", back:"there be 后面**离得最近的那个名词**决定 is/are", eg:"There **is** a book and two pens.（看 a book）"},
    {front:"There be 与 have", back:"there be = 存在；have = 拥有，不能混用", eg:"✗ Our class has 50 students. ✓ There **are** 50 students in our class."},
    {front:"过去式", back:"There was / There were", eg:"There **were** many people here."},
    {front:"将来", back:"There will be / There is going to be", eg:"There **will be** a meeting."}
  ],
  check:[
    {stem:"There ____ a pen and two books on the desk.（is/are）", answer:["is"], note:"就近原则：离 there be 最近的是 a pen（单数）→ is。中考几乎年年考。"},
    {stem:"There ____ some milk in the glass.（is/are）", answer:["is"], note:"milk 不可数 → is。"},
    {stem:"我们班有50个学生：There ____ 50 students in our class.", answer:["are"], note:"students 复数 → are。别写成 has。"}
  ]},

{ id:"ed10", topic:"情态动词 · 高频5个",
  cards:[
    {front:"can / could", back:"能够；could 更委婉", eg:"**Could** you help me?"},
    {front:"may / might", back:"可以（许可）；可能（推测）", eg:"It **may** rain.（可能下雨）"},
    {front:"must / have to", back:"must 主观必须；have to 客观不得不", eg:"I **have to** go.（不得不）"},
    {front:"mustn't vs needn't", back:"mustn't = **禁止**；needn't = 不必", eg:"You **mustn't** smoke.（禁止）"}
  ],
  check:[
    {stem:"你不必着急：You ____ hurry.（needn't / mustn't）", answer:["needn't"], note:"needn't = 不必；mustn't = 禁止。意思完全相反，中考必考。"},
    {stem:"情态动词后面动词用什么形式？（原形/加s/加ing）", answer:["原形","动词原形"], note:"can/may/must 后面永远接动词原形。"},
    {stem:"这里禁止停车：You ____ park here.", answer:["mustn't","must not"], note:"禁止 = mustn't。"}
  ]},

{ id:"ed11", topic:"宾语从句三要素",
  cards:[
    {front:"① 连接词", back:"陈述句用 that；一般疑问用 if/whether；特殊疑问用原疑问词", eg:"I know **that** he is right."},
    {front:"② 语序", back:"**必须用陈述语序**（主语在前动词在后）", eg:"✗ I don't know where **is he**. ✓ where **he is**."},
    {front:"③ 时态", back:"主句过去时 → 从句也要变过去时", eg:"He said he **was** busy."},
    {front:"例外", back:"从句是**客观真理**时，永远用一般现在时", eg:"The teacher said the earth **is** round."}
  ],
  check:[
    {stem:"改错：I don't know where is he. 正确的是 I don't know where ____ ____ .", answer:["he is"], note:"宾语从句必须陈述语序！这是中考最高频的送分陷阱。"},
    {stem:"He asked me ____ I could help him.（填 if 或 that）", answer:["if","whether"], note:"「是否」用 if/whether。"},
    {stem:"He said he ____ (be) a teacher.", answer:["was"], note:"主句 said 是过去时 → 从句时态往过去推。"}
  ]},

{ id:"ed12", topic:"动词不定式 to do 与动名词 doing",
  cards:[
    {front:"只接 doing", back:"enjoy, finish, mind, practice, keep, suggest, avoid, miss", eg:"I enjoy **reading**."},
    {front:"只接 to do", back:"want, hope, decide, plan, agree, learn, would like", eg:"I want **to go**."},
    {front:"两个都行", back:"like, love, start, begin, continue", eg:"I like **swimming** / **to swim**."},
    {front:"意思不同", back:"stop **to do**（停下来去做）/ stop **doing**（停止做）", eg:"He stopped **smoking**.（戒烟了）"}
  ],
  check:[
    {stem:"I enjoy ____ (read) books.", answer:["reading"], note:"enjoy 后面永远接 doing。"},
    {stem:"He stopped ____ (talk) when the teacher came in.（停止说话）", answer:["talking"], note:"stop doing = 停止正在做的事；stop to do = 停下来去做另一件事。"},
    {stem:"She decided ____ (go) to Beijing.", answer:["to go"], note:"decide 后面接 to do。"}
  ]},

{ id:"ed13", topic:"易混词组 · in / on / at 地点",
  cards:[
    {front:"in", back:"在……里面（大地点）", eg:"**in** China / **in** the room"},
    {front:"on", back:"在……上面（接触表面）", eg:"**on** the desk / **on** the wall"},
    {front:"at", back:"在……点（小地点）", eg:"**at** the bus stop / **at** home"},
    {front:"in the tree vs on the tree", back:"**in** the tree = 外来物在树上（鸟）；**on** the tree = 树本身长的（果子）", eg:""}
  ],
  check:[
    {stem:"There are some apples ____ the tree.（树上长的苹果）", answer:["on"], note:"树本身长出来的用 on；外来的（鸟、人）用 in。"},
    {stem:"A bird is singing ____ the tree.", answer:["in"], note:"鸟是外来的 → in the tree。"},
    {stem:"He is waiting ____ the bus stop.", answer:["at"], note:"小地点、一个点 → at。"}
  ]},

{ id:"ed14", topic:"感叹句 What / How",
  cards:[
    {front:"What 引导", back:"What + a/an + 形容词 + **名词** + 主谓！", eg:"**What a** beautiful girl she is!"},
    {front:"How 引导", back:"How + **形容词/副词** + 主谓！", eg:"**How** beautiful the girl is!"},
    {front:"判断口诀", back:"看感叹词后面：有**名词**用 What，只有**形容词**用 How", eg:""},
    {front:"不可数/复数", back:"What + 形容词 + 不可数/复数（**不加 a**）", eg:"**What** good news it is!"}
  ],
  check:[
    {stem:"____ a nice day it is!（填 What 或 How）", answer:["What"], note:"后面有名词 day → 用 What。"},
    {stem:"____ nice the weather is!（填 What 或 How）", answer:["How"], note:"nice 后面直接是 the weather is，nice 是形容词单独出现 → How。"},
    {stem:"____ good news it is!（news 不可数）", answer:["What"], note:"有名词 news → What；不可数不加 a。"}
  ]},

{ id:"ed15", topic:"高频固定搭配 be + 介词",
  cards:[
    {front:"be good at", back:"擅长（后加 doing）", eg:"She is good **at singing**."},
    {front:"be interested in", back:"对……感兴趣（后加 doing）", eg:"I'm interested **in reading**."},
    {front:"be afraid of", back:"害怕", eg:"He is afraid **of** dogs."},
    {front:"be proud of / be full of", back:"为……骄傲 / 充满", eg:"We are proud **of** you."}
  ],
  check:[
    {stem:"她擅长唱歌：She is good ____ ____ .（at + 动名词）", answer:["at singing"], note:"介词后面接动词必须用 -ing 形式。"},
    {stem:"I'm interested ____ English.", answer:["in"], note:"be interested in 是固定搭配。"},
    {stem:"我们为你骄傲：We are proud ____ you.", answer:["of"], note:"be proud of。"}
  ]},

{ id:"ed16", topic:"过去进行时 · 与一般过去时对比",
  cards:[
    {front:"结构", back:"was / were + doing", eg:"I **was reading** at 8 last night."},
    {front:"标志", back:"at + 过去某点 / when / while", eg:"**At this time yesterday**, I was..."},
    {front:"when vs while", back:"when 后接**短暂**动作；while 后接**持续**动作", eg:"I was reading **when** he came in."},
    {front:"经典句型", back:"was doing ... when ... did（正在做…这时…）", eg:"She **was cooking when** the phone rang."}
  ],
  check:[
    {stem:"I ____ ____ (read) when he came in.（我正在读书时他进来了）", answer:["was reading"], note:"正在进行的长动作用过去进行时，短暂动作用一般过去时。"},
    {stem:"____ I was doing homework, my mother came back.（填 When 或 While）", answer:["While"], name:"", note:"While 后面接持续性动作（doing homework）。"},
    {stem:"They ____ (play) football at 4 yesterday.", answer:["were playing"], note:"at 4 yesterday 是过去某个点 → 过去进行时。"}
  ]},

{ id:"ed17", topic:"名词单复数与不可数名词",
  cards:[
    {front:"常见不可数", back:"water, milk, bread, news, information, advice, homework, money", eg:"**News** is 用单数动词"},
    {front:"特殊复数", back:"child→children, man→men, foot→feet, tooth→teeth, mouse→mice", eg:""},
    {front:"单复数同形", back:"sheep, deer, fish, Chinese, Japanese", eg:"two **sheep**"},
    {front:"量词表达", back:"a piece of news / a glass of water / two pieces of paper", eg:""}
  ],
  check:[
    {stem:"一条新闻：a ____ ____ news", answer:["piece of"], note:"news 不可数，用 a piece of。"},
    {stem:"There are two ____ (child) in the room.", answer:["children"], note:"child 的复数是 children，不规则。"},
    {stem:"The news ____ (be) very exciting.（is/are）", answer:["is"], note:"news 虽然有 s，但是不可数名词，用单数。"}
  ]},

{ id:"ed18", topic:"连词 · 逻辑关系词",
  cards:[
    {front:"although / but", back:"**不能同时出现**！中文「虽然…但是…」在英语只能留一个", eg:"✗ Although..., but... ✓ Although he is young, he is brave."},
    {front:"because / so", back:"同样**不能同时出现**", eg:"✓ He was late **because** he got up late."},
    {front:"not only...but also", back:"不但…而且…（**就近原则**定动词）", eg:"Not only he but also I **am** right."},
    {front:"either...or / neither...nor", back:"或者…或者 / 既不…也不（也是就近原则）", eg:"**Neither** you **nor** he **is** right."}
  ],
  check:[
    {stem:"改错：Although he is poor, but he is happy. 应删掉哪个词？", answer:["but"], note:"英语里 although 和 but 只能留一个。这是中文思维直译造成的最高频错误。"},
    {stem:"Either you or he ____ (be) right.", answer:["is"], note:"either...or 就近原则：离动词最近的是 he → is。"},
    {stem:"他因为生病没来：He didn't come ____ he was ill.", answer:["because"], note:"because 引导原因，前面不能再加 so。"}
  ]},

{ id:"ed19", topic:"代词 · 人称与物主",
  cards:[
    {front:"主格 / 宾格", back:"I-me, he-him, she-her, we-us, they-them", eg:"动词/介词后面用**宾格**"},
    {front:"形容词性物主", back:"my, your, his, her, our, their（**后面必须跟名词**）", eg:"**my** book"},
    {front:"名词性物主", back:"mine, yours, his, hers, ours, theirs（**后面不跟名词**）", eg:"The book is **mine**."},
    {front:"反身代词", back:"myself, yourself, himself, themselves", eg:"by **myself** = 独自"}
  ],
  check:[
    {stem:"This book is ____ (I).（这本书是我的）", answer:["mine"], note:"后面没有名词 → 用名词性物主代词 mine，不是 my。"},
    {stem:"Please give the pen to ____ (he).", answer:["him"], note:"介词 to 后面用宾格 him。"},
    {stem:"她自己做的：She did it by ____ .", answer:["herself"], note:"by oneself = 独自，she → herself。"}
  ]},

{ id:"ed20", topic:"高频动词短语 · get / give / put",
  cards:[
    {front:"get on / get off", back:"上车 / 下车（大交通工具）", eg:"**Get on** the bus."},
    {front:"get on well with", back:"与……相处融洽", eg:"He **gets on well with** his classmates."},
    {front:"give up", back:"放弃（后加 doing）", eg:"Don't **give up**! / give up **smoking**"},
    {front:"put off / put on", back:"推迟 / 穿上", eg:"The meeting was **put off**."}
  ],
  check:[
    {stem:"别放弃：Don't ____ ____ !", answer:["give up"], note:"give up + doing：give up smoking 戒烟。"},
    {stem:"她和同学相处很好：She ____ ____ well ____ her classmates.（三个词）", answer:["gets on with"], note:"get on well with sb 固定搭配。"},
    {stem:"运动会推迟了：The sports meeting was ____ ____ .", answer:["put off"], note:"put off = 推迟 = delay。"}
  ]},

{ id:"ed21", topic:"数词 · 序数词与年龄日期",
  cards:[
    {front:"基数→序数", back:"one→first, two→second, three→third, five→fifth, nine→ninth, twelve→twelfth", eg:"不规则的这6个必须背"},
    {front:"整十", back:"twenty→twentieth（y 变 ie 加 th）", eg:"thirty→thirtieth"},
    {front:"年龄表达", back:"a 15-year-old girl（**year 不加 s**）/ She is 15 years old.", eg:""},
    {front:"分数", back:"分子基数、分母序数；分子>1 分母加 s", eg:"two **thirds** = 2/3"}
  ],
  check:[
    {stem:"一个15岁的女孩：a 15-____-old girl", answer:["year"], note:"作定语时 year 不加 s，中间有连字符。"},
    {stem:"第九：____（写英文）", answer:["ninth"], note:"nine 去 e 加 th = ninth，不规则。"},
    {stem:"三分之二：two ____", answer:["thirds"], note:"分子是2（大于1）→ 分母 third 加 s。"}
  ]},

{ id:"ed22", topic:"定语从句 who / which / that",
  cards:[
    {front:"who", back:"先行词是**人**", eg:"The boy **who** is running is my brother."},
    {front:"which", back:"先行词是**物**", eg:"The book **which** I bought is good."},
    {front:"that", back:"人和物都可以", eg:"通用，不确定时用 that 更安全"},
    {front:"只能用 that", back:"先行词有 all/every/no/only/最高级/序数词 时", eg:"This is the **best** film **that** I've seen."}
  ],
  check:[
    {stem:"The girl ____ is singing is Lucy.（who/which）", answer:["who","that"], note:"先行词 girl 是人 → who（用 that 也对）。"},
    {stem:"This is the best book ____ I have read.", answer:["that"], note:"先行词被最高级修饰 → 只能用 that。"},
    {stem:"I like the pen ____ you gave me.（which/who）", answer:["which","that"], note:"pen 是物 → which/that。"}
  ]},

{ id:"ed23", topic:"一般将来时 4 种表达",
  cards:[
    {front:"will + 动词原形", back:"单纯将来 / 临时决定", eg:"I **will** call you."},
    {front:"be going to + 原形", back:"打算、有迹象", eg:"It's **going to** rain.（乌云密布）"},
    {front:"be doing", back:"进行时表将来（go/come/leave/arrive）", eg:"I **am leaving** tomorrow."},
    {front:"时间状语从句", back:"主句将来时，**从句用现在时代替将来**", eg:"I will call you when he **comes**.（不是 will come）"}
  ],
  check:[
    {stem:"I will tell him when he ____ (come) back.", answer:["comes"], note:"「主将从现」：when 引导的时间状语从句里，用现在时表将来。中考必考。"},
    {stem:"看那乌云，要下雨了：Look at the clouds. It's ____ ____ rain.", answer:["going to"], note:"有迹象的将来用 be going to。"},
    {stem:"If it ____ (rain) tomorrow, we won't go.", answer:["rains"], note:"if 条件句同样「主将从现」。"}
  ]},

{ id:"ed24", topic:"how 系列疑问词",
  cards:[
    {front:"how long / how far", back:"多久（时间）/ 多远（距离）", eg:"**How long** have you been here?"},
    {front:"how often / how soon", back:"多久一次（频率）/ 多久以后（将来）", eg:"**How soon** will he come? — In an hour."},
    {front:"how many / how much", back:"多少（可数）/ 多少（不可数、价钱）", eg:"**How much** water?"},
    {front:"口诀", back:"often 问频率答 twice a week；soon 问将来答 in + 时间", eg:""}
  ],
  check:[
    {stem:"____ ____ do you go to the library? — Twice a week.（两个词）", answer:["how often"], note:"答语是频率 twice a week → 问 how often。"},
    {stem:"____ ____ will he arrive? — In two hours.", answer:["how soon"], note:"答语是 in + 时间段 → how soon。"},
    {stem:"____ ____ money do you have?", answer:["how much"], note:"money 不可数 → how much。"}
  ]},

{ id:"ed25", topic:"高频形容词 & 易混词",
  cards:[
    {front:"interesting vs interested", back:"-ing 修饰**物**；-ed 修饰**人**", eg:"The book is **interesting**. I am **interested**."},
    {front:"too / either / also", back:"too 肯定句末；either 否定句末；also 句中", eg:"I don't like it, **either**."},
    {front:"other / another / the other", back:"其他的 / 又一个（三者以上）/ 两者中的另一个", eg:"one ... **the other** ...（共两个）"},
    {front:"few / a few / little / a little", back:"few 几乎没有(可数)；a few 有几个；little 几乎没有(不可数)；a little 有一点", eg:"加 a 是肯定，不加 a 是否定"}
  ],
  check:[
    {stem:"I'm ____ (interest) in the ____ (interest) story.（两空）", answer:["interested interesting","interested in the interesting"], note:"人用 -ed，物用 -ing。可以只填两个词：interested / interesting。"},
    {stem:"我也不喜欢：I don't like it, ____ .", answer:["either"], note:"否定句句末用 either，不是 too。"},
    {stem:"他几乎没有钱：He has ____ money.（little / a little）", answer:["little"], note:"不加 a 是否定意义：几乎没有。"}
  ]},

{ id:"ed26", topic:"祈使句与建议表达",
  cards:[
    {front:"祈使句", back:"动词原形开头；否定用 Don't", eg:"**Don't** be late!"},
    {front:"Why not / Why don't you", back:"Why not + **原形** / Why don't you + **原形**", eg:"**Why not go** there?"},
    {front:"What/How about", back:"后面加 **doing**", eg:"**How about going** there?"},
    {front:"had better", back:"最好（后加**原形**）；否定 had better not", eg:"You'd **better go** now."}
  ],
  check:[
    {stem:"Why not ____ (go) with us?", answer:["go"], note:"Why not 后面直接接动词原形。"},
    {stem:"How about ____ (go) shopping?", answer:["going"], note:"about 是介词 → 后面加 doing。这一对最容易混。"},
    {stem:"你最好现在去：You'd better ____ (go) now.", answer:["go"], note:"had better + 动词原形。"}
  ]},

{ id:"ed27", topic:"高频动词短语 · make / turn",
  cards:[
    {front:"make sb do", back:"使某人做（**不加 to**）", eg:"He **made** me **laugh**."},
    {front:"be made of / from", back:"of 看得出原材料 / from 看不出", eg:"Paper is made **from** wood."},
    {front:"turn on / off / up / down", back:"开 / 关 / 调大 / 调小", eg:"**Turn off** the light."},
    {front:"turn into / turn out", back:"变成 / 结果是", eg:"Water **turns into** ice."}
  ],
  check:[
    {stem:"他让我笑了：He made me ____ (laugh).", answer:["laugh"], note:"make sb do，中间不加 to。但被动时要加：was made **to** laugh。"},
    {stem:"纸是木头做的（看不出原料）：Paper is made ____ wood.", answer:["from"], note:"看不出原材料用 from，看得出用 of。"},
    {stem:"请关灯：Please ____ ____ the light.", answer:["turn off"], note:"turn off 关；代词放中间：turn it off。"}
  ]},

{ id:"ed28", topic:"时态综合 · 一般过去 vs 现在完成",
  cards:[
    {front:"一般过去时", back:"有**明确过去时间**：yesterday, last week, in 2020, ago", eg:"I **saw** him yesterday."},
    {front:"现在完成时", back:"**不能**和明确过去时间连用", eg:"✗ I have seen him yesterday."},
    {front:"判断口诀", back:"看到 yesterday/last/ago → 一定用过去时", eg:""},
    {front:"since / for", back:"since + 时间**点**；for + 时间**段** → 都用完成时", eg:"for three years / since 2020"}
  ],
  check:[
    {stem:"I ____ (see) him last Sunday.", answer:["saw"], note:"last Sunday 是明确过去时间 → 一般过去时，不能用完成时。"},
    {stem:"He has worked here ____ five years.（since/for）", answer:["for"], note:"five years 是时间段 → for。"},
    {stem:"我从没去过北京：I have ____ been to Beijing.", answer:["never"], note:"never + 现在完成时。"}
  ]},

{ id:"ed29", topic:"书面表达高分句型（作文直接用）",
  cards:[
    {front:"开头", back:"With the development of ... 随着……的发展", eg:"**With the development of** the Internet, ..."},
    {front:"举例", back:"For example, ... / Take ... for example", eg:""},
    {front:"观点", back:"In my opinion, ... / As far as I know, ...", eg:"**In my opinion**, we should ..."},
    {front:"结尾", back:"In a word, ... / All in all, ... 总之", eg:"**All in all**, it's important to ..."}
  ],
  check:[
    {stem:"在我看来：____ ____ ____ , we should protect the environment.（三个词）", answer:["in my opinion"], note:"作文万能句，写作文先背这4句，直接提3-5分。"},
    {stem:"总之：____ ____ ____ , health is the most important.（三个词，用 all 开头）", answer:["all in all"], note:"结尾句：All in all / In a word。"},
    {stem:"随着……的发展：____ the development of", answer:["with"], note:"With the development of...，开头万能句。"}
  ]},

{ id:"ed30", topic:"完形填空高频词（近三年反复出现）",
  cards:[
    {front:"instead / instead of", back:"代替（instead 单独放句末；instead of + 名词/doing）", eg:"He went **instead of** me."},
    {front:"in order to / so that", back:"为了（to + 原形 / so that + 从句）", eg:"**In order to** pass, he studied hard."},
    {front:"as soon as", back:"一……就……（主将从现）", eg:"I'll call you **as soon as** I arrive."},
    {front:"not...until", back:"直到……才", eg:"He didn't leave **until** she came."}
  ],
  check:[
    {stem:"他去了而不是我：He went ____ ____ me.（两个词）", answer:["instead of"], note:"instead of + 名词/代词/doing。"},
    {stem:"我一到就给你打电话：I'll call you as soon as I ____ (arrive).", answer:["arrive"], note:"as soon as 引导时间状语从句 → 主将从现，用现在时。"},
    {stem:"直到她来他才走：He didn't leave ____ she came.", answer:["until"], note:"not...until 直到……才，中考高频。"}
  ]},

{ id:"ed31", topic:"阅读理解高频学科词",
  cards:[
    {front:"环境类", back:"environment 环境, pollution 污染, protect 保护, recycle 回收, energy 能源", eg:""},
    {front:"科技类", back:"technology 技术, invent 发明, develop 发展, Internet 互联网, robot 机器人", eg:""},
    {front:"健康类", back:"healthy 健康的, exercise 锻炼, illness 疾病, medicine 药, sleep 睡眠", eg:""},
    {front:"文化类", back:"tradition 传统, culture 文化, festival 节日, custom 习俗, celebrate 庆祝", eg:""}
  ],
  check:[
    {stem:"保护环境：____ the ____ （两个词）", answer:["protect environment","protect the environment"], note:"环境类是中考阅读和作文最高频话题。"},
    {stem:"传统文化：traditional ____", answer:["culture"], note:"culture 名词，cultural 形容词。"},
    {stem:"回收利用：____ （一个词，re- 开头）", answer:["recycle"], note:"recycle = re + cycle，重复循环。"}
  ]},

{ id:"ed32", topic:"听力机考高频场景词（5月起重点）",
  cards:[
    {front:"问路", back:"go straight 直走, turn left/right 左/右转, on the corner 在拐角, next to 挨着", eg:""},
    {front:"看病", back:"have a fever 发烧, have a cough 咳嗽, take medicine 吃药, see a doctor 看医生", eg:""},
    {front:"购物", back:"How much is it? 多少钱, It's too expensive 太贵了, try it on 试穿, size 尺码", eg:""},
    {front:"约时间", back:"be free 有空, make it 定在, What time...? 几点, Sounds good 听起来不错", eg:""}
  ],
  check:[
    {stem:"一直往前走：go ____", answer:["straight"], note:"听力问路必考词，出声念3遍。"},
    {stem:"我发烧了：I have a ____ .", answer:["fever"], note:"看病场景高频。"},
    {stem:"太贵了：It's too ____ .", answer:["expensive"], note:"购物场景高频。"}
  ]},

{ id:"ed33", topic:"介词短语 · 高频固定搭配",
  cards:[
    {front:"at last / at least", back:"最后 / 至少", eg:"**At last** he succeeded."},
    {front:"in fact / in time / on time", back:"事实上 / 及时 / 准时", eg:"**on time** 准点；**in time** 来得及"},
    {front:"by the way / in the way", back:"顺便说 / 挡路", eg:"**By the way**, where is Tom?"},
    {front:"at the same time / all the time", back:"同时 / 一直", eg:""}
  ],
  check:[
    {stem:"准时到达：arrive ____ ____ （on 还是 in）", answer:["on time"], note:"on time 准点（不早不晚）；in time 及时（来得及）。中考爱考区别。"},
    {stem:"至少：____ ____ （两个词）", answer:["at least"], note:"at least 至少 ↔ at most 至多。"},
    {stem:"顺便问一下：____ ____ ____ , where do you live?", answer:["by the way"], note:"口语和听力高频。"}
  ]},

{ id:"ed34", topic:"动词辨析 · 中文一样英文不同",
  cards:[
    {front:"spend / take / cost / pay", back:"人 spend 时间/钱 on；It takes 人 时间 to do；物 cost 人 钱；人 pay 钱 for 物", eg:"主语不同是关键"},
    {front:"borrow / lend", back:"borrow **from**（借入）；lend **to**（借出）", eg:"I borrowed a book **from** him."},
    {front:"say / speak / tell / talk", back:"say + 内容；speak + 语言；tell sb sth；talk **to/with** sb", eg:""},
    {front:"reach / arrive / get", back:"reach + 地点；arrive **in/at**；get **to**", eg:"reach 后面直接跟地点，不加介词"}
  ],
  check:[
    {stem:"我花了2小时做作业：It ____ me two hours to do my homework.", answer:["took","takes"], note:"It takes sb + 时间 + to do sth。主语是 it，不是人。"},
    {stem:"我从他那儿借了本书：I borrowed a book ____ him.", answer:["from"], note:"borrow from 借入；lend to 借出。方向别搞反。"},
    {stem:"他会说英语：He can ____ English.（say/speak）", answer:["speak"], note:"speak + 语言，这是固定的。"}
  ]},

{ id:"ed35", topic:"句子成分 · 主谓一致易错点",
  cards:[
    {front:"and 连接", back:"两个主语用 and 连接 → **复数**", eg:"Tom and Jack **are** here."},
    {front:"with / as well as", back:"这些不改变主语数 → **看前面那个**", eg:"Tom **with** his friends **is** here."},
    {front:"each / every / either", back:"这些修饰的主语 → **单数**", eg:"**Each** of us **has** a book."},
    {front:"the number of / a number of", back:"the number of + 复数 → **单数动词**；a number of → 复数动词", eg:"**The number** of students **is** 50."}
  ],
  check:[
    {stem:"Tom with his parents ____ (be) going there.", answer:["is"], note:"with 不改变主语，主语还是 Tom（单数）→ is。中考高频陷阱。"},
    {stem:"Each of us ____ (have) a dictionary.", answer:["has"], note:"each of + 复数，动词用单数。"},
    {stem:"The number of students ____ (be) 50.", answer:["is"], note:"the number of = 数量，是单数概念。"}
  ]},

{ id:"ed36", topic:"考前抢分清单 · 最容易丢的10分",
  cards:[
    {front:"① 三单", back:"he/she/it 后面动词别忘加 s", eg:""},
    {front:"② 时态一致", back:"看到 yesterday 全句都要过去时", eg:""},
    {front:"③ 宾语从句语序", back:"陈述语序，永远", eg:""},
    {front:"④ 介词后加 ing", back:"look forward to doing / be good at doing", eg:""}
  ],
  check:[
    {stem:"He ____ (go) to school by bike every day.", answer:["goes"], note:"每天 → 一般现在时；he → 加 es。这一分丢了最可惜。"},
    {stem:"I don't know what ____ ____ .（他的名字是什么，用 his name is）", answer:["his name is"], note:"宾语从句陈述语序，不是 is his name。"},
    {stem:"He is good at ____ (play) football.", answer:["playing"], note:"at 是介词 → 后加 doing。"}
  ]}

];
