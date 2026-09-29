# 复用 Anki 记忆代码到生词本：可行性分析

> 结论先行：**算法思想可以直接复用，Anki 的代码本身不能复用（AGPL-3.0）；正确路径是自研 ~200 行 SM-2 调度器，或引入 MIT 协议的 `ts-fsrs` 直接上 FSRS。**
>
> 本文只做分析与建议，未改动任何源码。附带核查了仓库现有的 `docs/english-memory-srs-proposal.md`（下称「原方案」）——它的架构判断基本正确，但有一个关键点需要修正：**它建议参考 Anki 实现，而 Anki 的许可是 AGPL-3.0，与本项目的闭源/分发形态冲突。**

---

## 0. 一句话诊断

生词本现在的数据模型是 **「一条收藏记录」**，不是 **「一张记忆卡」**。它缺少跨天的时间维度，因此 **无论借鉴哪个算法，先要补的是数据结构，而不是调度公式**。

---

## 1. 现状核查（基于源码，非假设）

### 1.1 生词本的真实实现

| 项 | 事实 | 位置 |
| --- | --- | --- |
| 存储键 | `sp-vocab-book`（localStorage） | `src/pages/PracticeModes.vue:2053` |
| 条目结构 | `{ def, pos, posCn, phUk, phUs, ts, source, count }` | `src/pages/PracticeModes.vue:2082-2091` |
| 阅读页同键写入 | 同 key、字段略有差异（无 `count`/`source`） | `src/pages/CourseReading.vue:509-529` |
| 练习队列构建 | `Array(repeat).fill(w)` —— 同词一行**连续重复 N 遍** | `src/pages/PracticeModes.vue:3204-3223` |
| 结果回写 | 仅 `vb.count++`（无论对错都 +1） | `src/pages/PracticeModes.vue:4315-4320` |
| 掌握度分档 | `mastered / normal / slow / error`，**被最近一次尝试覆盖** | `src/pages/PracticeModes.vue:4292-4313` |
| 加权抽词 | `{ error:5, slow:5, normal:2, mastered:1 }` | `src/pages/PracticeModes.vue:1152` |
| 手动词移除 | `masterVocabWord()` 直接 `delete` | `src/pages/PracticeModes.vue:2109-2113` |

### 1.2 三个致命缺口

1. **没有时间维度。** 条目里唯一的 `ts` 是**收藏时间**，不是**复习时间**。没有 `due`、没有 `interval`、没有 `reps`、没有 `lapses`。生词本永远无法回答「哪些词今天该复习」。

2. **`count` 是无意义信号。** `count` 只是「练过几次」，且**对错都 +1**（`:4315-4320`），不区分成功/失败。它无法驱动任何调度——SM-2 需要的是每次作答的**评分（grade）**，而不是累计次数。

3. **连续重复制造「流利错觉」。** `Array(repeat).fill(w)` 让同一个词在一行里连打 5 遍。这是**集中练习（cramming）**，短期正确率很高、长期保持最差；学习者是在「刚看过答案几秒后」回忆，而不是从长期记忆提取。这一点原方案第 8 节也指出了，判断正确。

### 1.3 已有的可复用遥测（这是好消息）

`PracticeModes.vue:4278-4291` 已经**实时算出**了驱动 SRS 所需的最关键信号：

- `enHadError` —— 本次是否出错（→ Again）
- `avg = elapsed / enWordKeystrokes` —— 每字母耗时
- `isDictation` —— 当前是抄写还是默写通道
- 两套阈值：抄写 `enMasteryMs=500 / enSlowMs=1300`，默写 `enMasteryMsDict=1000 / enSlowMsDict=2500`

**这意味着自动评级不需要新增任何 UI 或用户操作**——把现有判定从「覆盖式打标签」改成「产出 grade 并写入卡库」即可。这是本次改造最大的杠杆点。

---

## 2. Anki 源码到底长什么样（已实际核查）

### 2.1 结构

Anki 的记忆逻辑在 `rslib/src/scheduler/`（Rust），核心分四块：

```
rslib/src/scheduler/
├── states/          状态机与间隔计算
│   ├── review.rs        ← 核心：ease factor、间隔推进、leech 判定
│   ├── learning.rs      ← 学习步（1min→10min→毕业 1 天）
│   ├── relearning.rs    ← 遗忘后重学（23KB，最大的一个）
│   ├── steps.rs         ← 学习步配置
│   ├── fuzz.rs          ← 间隔随机化，防止同批卡扎堆到期
│   └── load_balancer.rs ← 负载均衡（16KB）
├── answering/       作答流程与 revlog（复习日志）
└── fsrs/            memory_state.rs / params.rs（32KB）/ simulator.rs
```

### 2.2 核心算法其实很短

`review.rs` 里真正的数学只有这几行（已核对原文）：

```rust
pub const INITIAL_EASE_FACTOR: f32 = 2.5;
pub const MINIMUM_EASE_FACTOR: f32 = 1.3;
pub const EASE_FACTOR_AGAIN_DELTA: f32 = -0.2;
pub const EASE_FACTOR_HARD_DELTA: f32 = -0.15;
pub const EASE_FACTOR_EASY_DELTA: f32 = 0.15;

// good 间隔：
let good_interval = constrain_passing_interval(
    ctx,
    (current_interval + days_late / 2.0) * self.ease_factor,  // ← 就是 prev × EF
    good_minimum,
    true,
);
```

也就是说，**SM-2 的实质逻辑约 50 行**。Anki 那 13KB 的 `review.rs`、23KB 的 `relearning.rs`，体积来自：fuzz 随机化、早复习惩罚修正、min/max 间隔钳制、leeched 标记、FSRS 分支、以及大量单元测试——**这些是桌面端多年打磨的工程细节，不是记忆科学的必要部分**。

### 2.3 许可：这是决定性的

| 项目 | 许可 | 能否用于本项目 |
| --- | --- | --- |
| **ankitects/anki** | **AGPL-3.0**（`LICENSE` 首行明示） | ❌ **不能** |
| open-spaced-repetition/ts-fsrs | **MIT** | ✅ 可以 |

Anki 是 AGPL-3.0。AGPL 的传染性极强：**只要把 AGPL 代码并入本项目并对外提供网络服务，整个项目就须以 AGPL-3.0 开源**。对本项目（在线练习工具、有 `vercel.json` 部署配置、计划长期运营）而言，这是不可接受的。

**所以「复用 Anki 的记忆代码」这条路，在许可层面直接堵死。** 但必须强调：**算法本身不受版权保护**——SM-2 是 1987 年 SuperMemo 发表的公开公式，FSRS 有 MIT 的独立实现。**你完全可以实现同样的算法，只是不能抄 Anki 的代码。**

---

## 3. 可行性结论：分层判定

| 层次 | 能否复用 | 说明 |
| --- | --- | --- |
| **算法思想**（SM-2 / FSRS / 学习步 / leech） | ✅ **完全可用** | 公开学术成果，不受版权保护 |
| **Anki 的 Rust 代码** | ❌ **不可用** | AGPL-3.0，传染性强 |
| **ts-fsrs（MIT）** | ✅ **推荐** | 现成 FSRS，纯 TS、ESM/UMD 齐全，零依赖风险 |
| **Anki 的 UX 模式**（今日到期队列、4 键评分、forecast 图） | ✅ **可借鉴** | 产品范式，非代码 |
| **`.apkg` 导入导出** | ⚠️ 需评估 | 涉及 Anki 数据格式，建议 P3 再议 |

---

## 4. 对仓库「原方案」的两处修正

现有 `docs/english-memory-srs-proposal.md` 分析质量很高（现状盘点、认知科学依据、分阶段路线都扎实），但有两处需要修正：

**修正一：许可风险未识别。** 原方案第 9 节把 Anki 与 FSRS 并列作为「参考开源实现」，未区分 AGPL 与 MIT。建议明确：**只参考 Anki 的算法语义与交互范式，不复制其代码**；实现上优先 `ts-fsrs`（MIT）或自研。

**修正二：技术栈假设偏乐观。** 原方案第 6 节提出新增 `src/utils/srs.js` + `src/stores/review.js`，这是对的；但它假设可以「SM-2 先行、无缝切 FSRS」。实际上两者数据模型不同（FSRS 需要 `stability`/`difficulty`/`gradeHist`），所以**第一版就必须把 `gradeHist` 复习日志写全**，否则后期无法回放训练 FSRS 参数。原方案第 3.2 节末尾其实提到了这点，建议提到 P0 强制执行。

---

## 5. 推荐落地路径

### 5.1 数据模型（P0，必须先做）

新增 `sp-srs-cards`，**纯增量、不动现有 key**：

```js
{
  [lemma]: {
    state: 'new' | 'learning' | 'review' | 'relearning',
    reps: 0, lapses: 0,
    ef: 2.5,              // SM-2 缓易因子，下限 1.3
    interval: 0,          // 天数（学习阶段用秒）
    due: 0,               // 到期时间戳 ← 现在完全缺失的关键字段
    lastReviewed: 0,
    gradeHist: [],        // { t, grade, mode, avgMs, err, hint } 保留最近 ~20 条
    leech: false,
  }
}
```

**关键：`sp-vocab-book` 继续保留为「收藏即入库」的入口**，`sp-srs-cards` 由它初始化。现有 `count`/`ts` 字段语义不变，避免破坏 `PracticeModes.vue` 与 `CourseReading.vue` 两处读取。

### 5.2 自动评级（零额外操作）

直接把 `PracticeModes.vue:4292-4313` 的判定改为产出 grade：

| 现有条件 | 现状动作 | 改为 grade |
| --- | --- | --- |
| `enHadError` | `= 'error'` | `Again(0)` |
| `avg > sMs`（太慢） | `= 'slow'` | `Hard(1)` |
| `avg <= mMs`（快） | `= 'mastered'` | `Easy(3)` |
| 其余 | `delete` | `Good(2)` |

在 `:4314` 处追加一行 `srs.review(wordKey, grade, { mode, avg, err: hadError })`。**这是最小 diff 的接入点**——原方案第 6 节给出的挂载点判断准确。

### 5.3 队列构建改造

把 `Array(repeat).fill(w)`（`:3214`）替换为**到期优先 + 会话内交错**：

```js
// 伪码：到期卡优先，新卡按每日配额，交错排列
const due   = cards.filter(c => c.due <= Date.now())
const fresh = cards.filter(c => c.state === 'new').slice(0, newLimit)
return interleave(shuffle([...due, ...fresh]))
```

### 5.4 分阶段

| 阶段 | 内容 | 成本 |
| --- | --- | --- |
| **P0** | `src/utils/srs.js`（SM-2-lite，~200 行）+ `src/stores/review.js`；自动评级接入；`sp-vocab-book` → `sp-srs-cards` 一次性迁移 | **小，1~2 天** |
| **P1** | 今日到期队列入口 + 到期计数；连续重复改交错；`Progress.vue` 加 forecast 柱状图 | 中 |
| **P2** | leech 治理、通道晋级（抄写→默写→听写）、保持率仪表盘 | 中 |
| **P3** | 引入 `ts-fsrs`（MIT）替换 SM-2；用 `gradeHist` 跑个性化参数优化 | 中 |

**建议 P0 直接自研 SM-2 而不用 Anki 代码**：约 200 行、可审计、无许可风险、完全贴合本项目已采集的信号。等 `gradeHist` 攒够数据再上 `ts-fsrs`。

---

## 6. 风险清单

| 风险 | 等级 | 缓解 |
| --- | --- | --- |
| **AGPL 传染** | 🔴 高 | 不复制 Anki 代码；只用公开算法或 MIT 实现 |
| `count` 语义被误用为复习信号 | 🟠 中 | 新增独立 `gradeHist`，不复用 `count` |
| 两处写入 `sp-vocab-book` 字段不一致（阅读页无 `count`） | 🟠 中 | 迁移时做字段归一化 |
| 迁移破坏现有生词本 | 🟠 中 | `sp-srs-cards` 纯增量，`sp-vocab-book` 不动；提供回滚 |
| 自研调度器有 bug 导致间隔异常 | 🟡 低 | 写单测对齐 SM-2 语义（可对照 Anki 公开测试用例的**期望值**，不抄代码） |
| 无 tsconfig（纯 JS 项目） | 🟡 低 | `ts-fsrs` 有 UMD/ESM 产物，JS 可直接 import；或 P3 时再加 |

---

## 7. 最终回答

**能复用吗？** —— **算法逻辑可以，代码不行。**

- ❌ **不能**直接复用 Anki 的 Rust 代码：AGPL-3.0 会让整个项目被迫开源。
- ✅ **可以且应该**复用它的**算法语义**（SM-2 的 EF 公式、学习步、leech 阈值）与**产品范式**（今日到期队列、4 键评分、forecast）。
- ✅ **更优选择**：P0 自研 ~200 行 SM-2，P3 换用 MIT 的 `ts-fsrs`。
- 🎯 **真正的工作量不在调度算法，而在数据模型**——把「收藏记录」升级为「记忆卡」（补 `due`/`interval`/`reps`/`lapses`/`gradeHist`），并把已有的 `enHadError`/`avg` 遥测从「覆盖式打标签」改为「产出 grade」。

**可行性判定：高度可行，且性价比很高。** 现有遥测已经齐备，改动集中在 `PracticeModes.vue` 两处（评级块 + 队列构建），新增两个文件，符合项目「最小 diff」原则。

---

## 8. 出处

- Anki 仓库与许可：[github.com/ankitects/anki](https://github.com/ankitects/anki) ；[LICENSE（AGPL-3.0）](https://github.com/ankitects/anki/blob/main/LICENSE)
- Anki 调度器源码：[rslib/src/scheduler/states/review.rs](https://github.com/ankitects/anki/blob/main/rslib/src/scheduler/states/review.rs) ；[learning.rs](https://github.com/ankitects/anki/blob/main/rslib/src/scheduler/states/learning.rs)
- ts-fsrs（MIT，推荐实现）：[github.com/open-spaced-repetition/ts-fsrs](https://github.com/open-spaced-repetition/ts-fsrs)
- FSRS 算法说明：[awesome-fsrs / The Algorithm](https://github.com/open-spaced-repetition/awesome-fsrs/wiki/The-Algorithm)
- 仓库内既有方案：`docs/english-memory-srs-proposal.md`
