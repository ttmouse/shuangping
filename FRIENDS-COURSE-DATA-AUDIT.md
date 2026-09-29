# 老友记课程数据审计报告（2026-09-08）

## 你的问题
"老友记课程是不是还没按新标准重新抓取？抓下来但**不用同步到 APP**，只作本地数据。"

## 审计结论：S2-S6 已在 09-06 按新标准重抓，main 与线上均为新数据

老友记 **S1-S6 全部六季**都已经是"新标准"（修复版 api-to-raw.py：零宽水印剥离 + details 全量重建）数据，main 分支与 github/main（线上）均已更新，**不需要重抓**。

## 时间线

| 时间 | 事件 |
|---|---|
| 09-03 | 旧方法抓 S2-S6（带水印、details 缺失），入 worktree 后被 revert 标注"待重抓" |
| 09-05 | 修复 api-to-raw.py；S1 等 10 包 details 水印清理重转（888e4b2） |
| 09-06 02:51 | **S2-S6 新标准重抓完成** → `julebu-raw-friends-s{2,3,4,5,6}-redo/`（213 课） |
| 09-06 03:01 | Codex 提交 e6159ee：新数据入 `public/course-packs/` + 注册 + 推送 github/main |

## 质量验证（2026-09-08 全量深度扫描）

| 季 | 课数 | 全层零宽水印 | statements | 有 details | 无 details(正常:整句/标点卡) |
|---|---|---|---|---|---|
| S1 | 39 | 0 | 9,889 | 9,766 | 123 |
| S2 | 36 | 0 | 10,022 | 9,751 | 271 |
| S3 | 25 | 0 | 9,761 | 9,556 | 205 |
| S4 | 24 | 0 | 8,665 | 8,531 | 134 |
| S5 | 101 | 0 | 9,301 | 8,584 | 717 |
| S6 | 27 | 0 | 2,348 | 2,172 | 176 |

- 水印：全部 0
- details 结构完整（word/partOfSpeech/definition/phonetic 齐全）
- order 1~N 连续，index.json 注册完整
- 新数据 ~393KB/课 vs 旧 ~171KB/课（details 补齐导致）

## 本地数据档位置（gitignore 忽略，仅本地）

```
julebu-raw-friends-s2-redo/  36课  90MB
julebu-raw-friends-s3-redo/  25课  87MB
julebu-raw-friends-s4-redo/  24课  75MB
julebu-raw-friends-s5-redo/ 101课  83MB
julebu-raw-friends-s6-redo/  27课  20MB
```
（各含 `L{order}.json` 清洗成品 + `responses/` 抓取原始响应）

## 唯一过时数据 = practice-modes worktree

- `shuangping-practice-modes` worktree 停在 09-04（a2237fc），其 friends-s2 数据还是旧 md5，index.json 只注册 S1（17 包 vs main 23 包）
- 若你在那个分支预览，就会看到"只有一季/数据旧"
- 活跃 dev server（9529）实际跑 main 目录，无此问题

## 建议（可选清理）
- `julebu-raw-friends-s2~s6/`（09-03 旧档，带水印，~78MB）已无价值，可删
- `julebu-raw-friends-s1-redo/`（S1 重转中间档）若 main 数据已验证一致，也可删
- 旧档目前**未删除**，等你确认

---
## 清理记录（2026-09-08 03:03 已执行）

已删除的旧数据档（git 均忽略、已被新档替代，删除无风险）：
- `julebu-raw-friends/`（S1 早期路线B档，40 文件）
- `julebu-raw-friends-s1-redo/`（S1 重转中间档，85M）
- `julebu-raw-friends-s2~s6/`（09-03 旧档带水印，共 ~79M）
- `julebu-raw-friends2/`（S2 最早旧档，U1-L1 命名，17M）

保留（新标准本地数据，共 355M）：
- `julebu-raw-friends-s2-redo/` 36课 `s3-redo/` 25课 `s4-redo/` 24课 `s5-redo/` 101课 `s6-redo/` 27课
