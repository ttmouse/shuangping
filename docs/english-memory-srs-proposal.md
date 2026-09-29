# 英文练习：记忆强化与刻意练习升级方案（SRS 蓝图）

> 目标：在现有「英文单词流 / 短文课包 / 错题本 / 慢词练习 / 生词本」之上，补一层
> **长期记忆模型（间隔重复 SRS）**
>
>  与一台 
>
> **刻意练习引擎**
>
> ，让「练错的、耗时长的」词
> 自动变成一条「在遗忘边缘被主动召回 → 针对性微练 → 间隔逐步拉长 → 真正进入长期记忆」的强化闭环。
> 参考开源实现：Anki（SM-2）、FSRS（open-spaced-repetition）。
> 本文只做方案设计，不改源码；所有挂载点均引用仓库现有文件与存储键，便于后续最小 diff 落地。



***

## 0. 一句话诊断

**现在的英文练习只有「单次会话内的记忆」，没有「跨天的长期记忆模型」：强化全部是集中、即时、被最近一次表现覆盖的，它优化的是「当下的流利」，而不是「长期的保持」。**



* 会话内已经做得不错：错词加权、慢词收录、错题重练、本次错词刻意练、抄写 / 默写 / 听写多通道、即时音效与 TTS 纠音。

* 缺的是**时间维度**：没有到期、没有间隔、没有遗忘曲线、没有跨课程的「今日复习队列」；一个词周一打得快就被永久标记 `mastered`，到周五忘了也不会再出现。



***

## 1. 现状盘点（基于源码）

### 1.1 已有的练习模式与通道（`src/pages/PracticeModes.vue`）



| 能力         | 现状                                                            | 关键位置 / 存储键                                                                   |
| ---------- | ------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| 单词流 / 短文课包 | 课包（Friends、family-8000、高考 3500、PEP 4–9 年级等）逐句逐词输入             | `LocalCoursePacks/`、`julebu-raw-*`                                           |
| 召回通道       | 看答案（抄写 / 识别）⇄ 全默写（回忆拼写）⇄ 听写（听音拼写）⇄ 中译英；`智能`按掌握度切换             | `settings.enDisplayMode`、`enDictationMode`                                   |
| 掌握度分档      | `mastered / normal / slow / error` 四档                         | 键 `sp-en-mastery`，判定约 `PracticeModes.vue:4268-4306`                          |
| 加权抽词       | 权重 `error:5 / slow:5 / normal:2 / mastered:1`                 | `EN_TIER_WEIGHT`，扩词约 `:3240-3255`                                            |
| 慢词刻意练      | 超过 ms / 字母阈值即收录；专项里**同一词一行连续重复 N 遍**，达标 N 次移除                 | 键 `sp-en-slowwords`，`recordSlowWord()` 约 `:2148`                             |
| 错题重练       | 打错的词当场重新入队（`enRedoPractice`）；完成弹窗「刻意练习这 N 个错词」                | `startMistakePractice()` 约 `:2180`                                           |
| 错题本 / 生词本  | 持久错词池（error+slow）；手动收藏词，记录练习次数                                | 键 `sp-en-mastery`、`sp-vocab-book`                                            |
| 逐词遥测（会话内）  | 是否出错、整词耗时、击键数、ms / 字母、是否首答、typo、是否用提示、整句评级 perfect/great/none | `enWordStartTime / enWordKeystrokes / enHadError / sentTypos / sentUsedHint` |
| 词卡内容       | 英美音标、词性、中文释义、整句语境、TTS（有道原声 + 系统语音回退）、词根 / 音节着色                | `wordDetails`、`src/utils/tts.js`、`enColorMode`                               |
| 课程进度 / 续练  | 每课完成标志、上次练习时间、续练句位置                                           | 键 `sp-course-progress`、`sp-course-resume`                                    |
| 游戏化        | XP、等级、段位、成就、连击、每日目标                                           | `src/stores/progress.js`                                                     |

### 1.2 阈值（`src/stores/settings.js`）



* 抄写模式：掌握 `enMasteryMs=500` ms / 字母，慢词 `enSlowMs=1300`。

* 默写模式：掌握 `enMasteryMsDict=1000`，慢词 `enSlowMsDict=2500`（回忆含思考时间，阈值放宽）。

* 慢词刻意练过关线 `enPracticeMs=300` ms / 字母。

### 1.3 关键缺口（按对记忆的影响排序）



1. **没有时间维度 / 遗忘曲线。** `enMastery[word]` 是一个被「最近一次尝试」覆盖的静态标签：没有时间戳历史、没有间隔、没有到期日。周一快 = 永久 `mastered`（权重 1，几乎不再出现），周五遗忘也不会被召回。没有跨所有课包的「今日待复习」。

2. **集中重复（cramming）被当成了巩固。** 慢词练习 `Array(repeat).fill(w)`（同一词一行连打 5 遍）、错题当场重入队，都是**无间隔的集中练习**。认知科学里集中练习只带来短期流利、长期保持最差；而**间隔 + 交错（spacing/interleaving）在延迟测试上的保持率约为集中练习的两倍**。连续重复还制造「流利错觉」（你是在看到答案几秒后回忆，并非从长期记忆提取）。

3. **评级信号单一且噪声大。** 仅用「最近一次的速度 + 是否出错」定档：一次手滑 / 分心 / 词长差异就会让档位在 mastered/error 间横跳；没有历史累积、没有置信度、没有显式自评。

4. **没有错误归因，刻意练习打不到点上。** 只知道「错了 / 慢了」，不持久化**错在第几个字母、哪个字母过渡卡顿、是拼写还是听音、是否易混词**（their/there、-tion/-sion、quiet/quite）。刻意练习要求把薄弱子技能隔离出来反复精练，现在做不到。

5. **提取被单一语境绑定。** 一个词几乎只在它出现的那一句课文里练，提取线索被这一句锁死；无法证明换个语境也认识。缺少多语境复现、挖空（cloze）。

6. **没有能力进阶阶梯 / 阶段门控。** 识别→拼写→听音拼写→中译英→新句产出，这些通道都在，但没有按记忆阶段自动晋级；「掌握」的词不会被升级到更难的提取方式。

7. **没有 leech（钉子词）治理。** Anki 会把反复失败的卡标为 leech 并提示换策略（拆解 / 助记）；这里顽固错词只会永远挂权重 5，不升级、不换编码方式。

8. **精加工（elaboration）偏薄。** 有词根 / 音节着色的「形」，但没有前缀 / 词根 / 后缀的「义」、没有词源 / 助记 / 图像、没有最小对立对比、没有纯听解码。

9. **复习按课包割裂。** 没有全局牌组；同一个词在 PEP、family-8000、Friends 里重复出现却不合并为一张卡，进度分散。

10. **看不见保持率。** 游戏化衡量的是「努力量」（字数 / 分钟、连击、天数），没有保持率 %、到期预测、遗忘曲线、mature/leech 分布 —— 学习者看不到哪些知识正在衰减。



***

## 2. 总体架构：两个嵌套闭环



```
┌──────────────────────────── 外层闭环：跨天 · 间隔重复（SRS）────────────────────────────┐

│  今日到期队列（跨所有课包交错） → 在遗忘边缘提取 → 据表现更新 稳定性/间隔/到期 → 预测明日到期 │

│            ▲                                                                    │

│            │  会话结束：把新学/出错词写入卡库，排定下次复习时间                          │

└────────────┼────────────────────────────────────────────────────────────────────┘

&#x20;            │

┌────────────┴──────────────────── 内层闭环：会话内 · 刻意练习 ───────────────────────────┐

│  出题（间隔+交错，而非连续重复） → 即时反馈 → 错误归因 → 生成针对性微练 → 刚好超出当前能力    │

└───────────────────────────────────────────────────────────────────────────────────┘
```



* **内层（一次练习里）= 刻意练习（Ericsson）**：明确的小任务、即时反馈、全神贯注、针对具体弱点、在「能力边缘」重复并修正、建立心理表征。

* **外层（跨天）= 间隔重复（Ebbinghaus / Anki / FSRS）**：在「即将遗忘但还能想起」的时点再次提取，每成功一次，记忆稳定性 S 增大、下次间隔指数级拉长。

* **关键桥梁 = 自动评级**：用你**已经在采集**的客观信号（出错 / 速度 / 提示 / 首答 / 通道），映射成 Anki 式 4 档评分，默认不增加任何按钮；高难度卡（听写 / 中译英）再提供 Again/Hard/Good/Easy 显式自评。

学习科学依据：



* 间隔 > 集中、交错 > 分组、提取测试 > 重复阅读，是认知心理学最稳健的结论之一（Bjork Learning & Forgetting Lab）。

* Roediger & Karpicke（2006）：一周后「测试组」记得约 60%，「重复阅读组」约 40%；Karpicke & Roediger（2008）外语词汇用间隔提取，一周后约保持 80%；Rohrer & Taylor（2007）数学间隔组一周后 76% vs 集中组 49%。

* Bjork「合意困难（desirable difficulties）」：间隔、交错、测试、变化条件、生成（自己产出而非照抄）短期更难、长期更牢。



***

## 3. 记忆调度算法（SRS）

### 3.1 先上 SM-2 / Leitner-lite（P0，约百行、可审计）

每张卡维护：



```
{

&#x20; state: 'new' | 'learning' | 'review' | 'relearning',

&#x20; reps: 0,            // 连续通过次数

&#x20; lapses: 0,          // 遗忘次数

&#x20; ef: 2.5,            // ease factor，下限 1.3

&#x20; interval: 0,        // 当前间隔（学习阶段用分钟，复习阶段用天）

&#x20; due: 0,             // 下次到期时间戳

&#x20; lastReviewed: 0,

}
```

规则（Anki SM-2 语义）：



* 新卡学习步：会话内 1 分钟 → 10 分钟，通过后「毕业」到 1 天。

* 复习间隔：第 1 次 1 天 → 第 2 次 6 天 → 之后 `interval = round(prevInterval * ef)`。

* 评分调整 EF：`ef += (0.1 - (5-q)*(0.08+(5-q)*0.02))`，下限 1.3；Again 重置间隔回学习步并 `lapses+1`。

* Anki 对学习阶段的早期失败不重罚（学习步内失败只回到第一步，不立刻拉到好几天后），这点要保留，避免新词一错就被淹没。

### 3.2 再升级到 FSRS（P3，现代 Anki 默认，开源）



* 三变量记忆模型（DSR）：难度 D（1–10）、稳定性 S（保持率从 100% 衰减到 90% 所经历的天数）、可提取性 R。

* 遗忘曲线：`R(t) = 0.9^(t/S)`；当 R 跌到目标保持率（默认 0.9）时安排下次复习，即「在遗忘边缘复习」。

* 每次复习按评分与当前 R 更新 S、D；可用**用户自己的复习日志**做最大似然优化，得到个人化参数；自带 leech 检测。

* 开源参考：`open-spaced-repetition/fsrs-rs`、`fsrs4anki`、`awesome-fsrs/wiki/The-Algorithm`。

* **数据结构要为 FSRS 预留**：把每次复习记成一条 `{t, grade, mode, avgMs, err, hint}`，SM-2 阶段先攒日志，之后无缝切到 FSRS。

### 3.3 自动评级映射（本方案的创新点：零额外操作）

用现有遥测把每次作答映射到 0–3 档，阈值直接复用现有两套（抄写 / 默写）：



| 评级           | 判定条件（严格模式下）                                                   |
| ------------ | ------------------------------------------------------------- |
| **Again(0)** | 出现错误（`enHadError`）；或按过「看词 / 显示答案」（`sentUsedHint`）；或听写下未回忆而看答案 |
| **Hard(1)**  | 无错但 `avg ms/字母 > slow 阈值`；或多次自我纠正 /typo；或某字母长时间停顿             |
| **Good(2)**  | 无错、首答、avg 落在「掌握阈值～慢阈值」之间                                      |
| **Easy(3)**  | 无错、首答、`avg ≤ 掌握阈值`且有余量，且**最近连续 2 次都快**（防止一次侥幸秒过就毕业）           |



* 通道随记忆强度晋级：`new/learning` 用抄写（识别）→ `review` 用默写（回忆拼写）→ 成熟卡用听写（纯听→拼写，无文本）与中译英（L1→L2）。提取越难，记忆痕迹越强，按阶段门控。

* 高难度卡（听写 / 中译英）在完成态可给 4 键显式自评，作为客观信号的校正。



***

## 4. 刻意练习引擎升级（内层闭环）



1. **把「连续重复」改成「会话内间隔 + 交错」。** 用扩张间隔取代 `Array(repeat).fill(w)`：错词在其后第 **1、3、6 个其他词**之后再次插入（session 内 spacing），并与别的词交错（interleaving），而不是一行连打 5 遍。重复次数保留，但拉开间距。

2. **错误归因 → 自动生成微练（micro-drill）。** 在现有击键计数基础上，补记**逐字母时间戳与错误字母**，据此：

* 错误集中在后缀（-tion/-ed/-ing/ 双写）→ 该拼写模式的横向微练（多个同模式词）；

* 卡在某个字母过渡（bigram）→ 键位 / 手指 bigram 微练；

* 听音错但看打快 → 召回 / 听力弱，加排纯听拼写；

* 易混词（their/there、accept/except、weather/whether）→ 最小对立对对比练（两词同时出现，强制区分）。

1. **合意困难旋钮（自适应难度）。** ms / 字母 目标随用户提速而收紧，并按词长归一化；稳定后自动隐藏更多提示（抄写→默写），避免长期停留在「看着打」的舒适区。

2. **即时且具体的反馈。** 错 / 慢之后，除现有音效与 TTS 纠音外，闪现该词的**构词拆解（前缀 | 词根 | 后缀 + 含义）+ 音标 + 最小对立**，一键把该模式加入微练牌组。

3. **建立心理表征（精加工编码）：**

* 构词法：把现有「词根着色」升级为带义拆解（re-+view、inter-+nation+-al、un-+happy+-ness）；

* 难词加词源 / 关键词助记，具体名词可选配图；

* 多语境：为每个词建「词→句子」倒排索引（课包句子已有数千句），让学过的词在 2–3 个不同句子 / 挖空中复现，打破单句线索绑定；

* 增加**挖空卡（cloze）**，测词义 / 语法、摩擦更小，与整词拼写互补。

1. **Leech 钉子词治理。** 单卡 lapses 达阈值（如 5 次）标记 leech，移出常规轮转，强制换编码：构词拆解 / 关键词助记 / 最小对立 / 纯听，而不是用同一种失败方式反复提取。



***

## 5. 外层 SRS 的产品形态



1. **全局「今日复习」牌组（到期队列）**：首页 / 模式页一个数字「今日待复习 N 词・约 M 分钟」，跨**所有课包**抽取到期卡并交错；每日新词配额与复习分开，**复习优先于新词**（Anki 原则）。

2. **按词元（lemma）合并卡片**：PEP /family-8000 / Friends 里的同一个词合并为一张卡、历史合并，多个例句作为不同语境挂在卡上。

3. **预测与保持率可视化（放到&#x20;**`src/pages/Progress.vue`**）**：未来 7 天到期量柱状（Anki 式 forecast）、每词保持率 R%、保持率热力图、new/learning/review/relearn/leech 数量。

4. **以保持率为核心的每日目标**：在现有「字数 / 连击」目标外，增加「清空到期复习 + 保持率 ≥ 目标」，衡量**持久知识**而非努力量。

5. **遗忘边缘提醒（可选，PWA / 通知）**：到期量越阈时轻提醒；连击与「完成复习」绑定而非字数。

6. **可导出 / 可同步**：SRS 独立为可序列化模块（`src/utils/srs.js` + `src/stores/review.js`，键 `sp-srs-cards`），后续可云同步，甚至支持 Anki `.apkg` 导入导出（对重度用户是护城河与桥梁）。



***

## 6. 数据模型（纯增量、不破坏现有逻辑）

新增存储键 `sp-srs-cards`：



```
{

&#x20; \[lemma]: {

&#x20;   state, reps, lapses, ef, interval, due, lastReviewed,

&#x20;   stabilityS, difficultyD,          // FSRS 预留，P3 启用

&#x20;   gradeHist: \[ /\* 环形缓冲，最近约 20 条 {t, grade, mode, avgMs, err, hint}，喂 FSRS + leech \*/ ],

&#x20;   worstLetters: { 'tion': 3, 'ed': 2 }, // 错误归因：模式/字母 → 次数

&#x20;   contexts: \[ 'sentenceId1', 'sentenceId2' ], // 多语境复现

&#x20;   leech: false,

&#x20; }

}
```



* **保留&#x20;**`sp-en-mastery`**&#x20;作为派生显示值**：卡片档位由 `state + R + 最近 grade` 推导，避免改动现有 UI；

* **一次性迁移**：现有 `error/slow` → `learning`（短到期），`mastered` → `review`（给一个起始间隔），`sp-en-slowwords` 并入对应卡的薄弱记录。

### 落地挂载点（最小 diff）



| 现有位置                                         | 改动                                                           |
| -------------------------------------------- | ------------------------------------------------------------ |
| 掌握度判定块 `PracticeModes.vue:4268-4306`         | 评级后追加一行 `srs.review(lemma, grade, {mode, avgMs, err, hint})` |
| 抽词 / 扩词 `:3240-3255`、慢词成句 `:3218-3224`       | 到期优先 + 会话内 1/3/6 间隔交错，替代纯档位加权与连续重复                           |
| 完成弹窗「刻意练习」`:744 / :796`                      | 会话结束时把本次错词 / 慢词写入卡库并排期；展示「今日已清 / 明日到期」                       |
| 模式选择页 `PracticeModes.vue` 顶部                 | 新增「今日复习」入口与到期计数                                              |
| `src/pages/Progress.vue`                     | 到期预测、保持率、热力图、leech 分布                                        |
| 新增 `src/utils/srs.js`、`src/stores/review.js` | SM-2 调度 + 卡库持久化（FSRS 可后续替换调度函数）                              |



***

## 7. 分阶段路线图（优先级 / 成本）



* **P0｜最高性价比、低成本：把跨天间隔闭环跑起来（SM-2-lite）**

1. `srs.js`（SM-2 + 会话内学习步）+ `review.js` store；现有信号自动评级；存 gradeHist；迁移 enMastery/slowwords。

2. 首页「今日复习」全局到期队列 + 到期计数，复习优先于新词；未来 7 天到期预测条。

3. 慢词 / 错词的连续重复 → 会话内 1/3/6 间隔交错复现。

* **P1｜刻意练习精准化**

  4\. 持久化逐字母耗时 / 错误；微练生成器（后缀 /bigram/ 易混 / 最小对立）。

  5\. leech 检测与换策略；通道晋级阶梯（抄写→默写→听写→中译英）按阶段门控；连续一致才毕业。

* **P2｜精加工与多语境**

  6\. 构词法带义拆解、词源 / 关键词助记 / 配图；词→句倒排索引支持多语境与挖空卡；跨课包按 lemma 合卡。

  7\. 保持率仪表盘（R%、热力图、mature/leech）；以保持率为核心的每日目标；可选提醒 / PWA。

* **P3｜个性化与护城河**

  8\. 用个人复习日志跑 FSRS 优化器替换 SM-2；自适应阈值；Anki apkg 导入导出；跨端同步；跟读 / 发音评分作为新提取通道。



***

## 8. 需要明确「停掉 / 改掉」的三个做法



1. 不再把「同一词连打 5 遍」当作记住了 —— 那是短期流利的填鸭；请把重复**间隔开、交错开**。

2. 不再让「最近一次尝试」覆盖掌握度 —— 要累积历史，并让记忆随真实时间衰减、到期再召回。

3. 不再主要用「字数 / 分钟、连击」衡量进步 —— 把**到期清空率与保持率**作为长期掌握的首要指标。



***

## 9. 参考与出处



* Anki 间隔重复算法说明（SM-2、学习步、lapse）：[https://faqs.ankiweb.net/what-spaced-repetition-algorithm.html](https://faqs.ankiweb.net/what-spaced-repetition-algorithm.html)

* SM-2 公式（EF 初始 2.5、下限 1.3，间隔 1d→6d→prev×EF）：[https://www.supermemo.com/en/blog/application-of-a-computer-to-improve-the-results-obtained-in-working-with-the-supermemo-method](https://www.supermemo.com/en/blog/application-of-a-computer-to-improve-the-results-obtained-in-working-with-the-supermemo-method) （SM-2 原始论文）；说明性整理 [https://www.repetrax.com/blog/sm2-algorithm-explained](https://www.repetrax.com/blog/sm2-algorithm-explained)

* FSRS 算法（DSR 模型、R=0.9^(t/S)、优化机制）：[https://github.com/open-spaced-repetition/awesome-fsrs/wiki/The-Algorithm](https://github.com/open-spaced-repetition/awesome-fsrs/wiki/The-Algorithm) ；[https://github.com/open-spaced-repetition/free-spaced-repetition-scheduler/blob/main/README\_CN.md](https://github.com/open-spaced-repetition/free-spaced-repetition-scheduler/blob/main/README_CN.md) ；Rust 实现 [https://docs.rs/fsrs/](https://docs.rs/fsrs/)

* 间隔 / 交错 / 测试效应与合意困难（Bjork Lab）：[https://bjorklab.psych.ucla.edu/research/](https://bjorklab.psych.ucla.edu/research/) ；[https://www.psychologicalscience.org/observer/desirable-difficulties](https://www.psychologicalscience.org/observer/desirable-difficulties)

* 提取练习（测试效应）证据综述（Roediger & Karpicke 2006；Karpicke & Roediger 2008；Rohrer & Taylor 2007 等数值转引）：[https://www.structural-learning.com/post/robert-bjork-teachers-guide-desirable](https://www.structural-learning.com/post/robert-bjork-teachers-guide-desirable) ；[https://beaststudy.com/blog/spaced-repetition-study-technique/](https://beaststudy.com/blog/spaced-repetition-study-technique/)