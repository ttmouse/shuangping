# 项目记忆：shuangping 双拼练习工具

**日期**: 2026-02-12
**项目路径**: /Users/douba/Projects/XM/project/shuangping

---

## 项目概述

**名称**: 双拼练习工具 (shuangping)
**类型**: 工具类 Web 应用
**技术栈**: Vue 3 + Vite + Pinia + pinyin-pro
**定位**: 专业的双拼输入法练习平台

---

## 功能特性

### 核心功能
- 韵母练习模式 (YunmuPractice)
- 文字练习模式 (Writer)
- 多种双拼方案支持（8种：自然码、小鹤、搜狗、微软、拼音加、极点、国笔、ABC）
- 语音朗读反馈
- 自定义文本导入

### 技术特点
- 键盘可视化交互
- 实时按键反馈（音效 + 视觉）
- 进度持久化（localStorage）
- 主题切换（亮色/暗色）

---

## 代码结构

```
src/
├── components/          # 组件
│   ├── Keyboard.vue     # 键盘组件（核心交互）
│   ├── SchemeSelector.vue
│   └── SoundSelector.vue
├── pages/
│   ├── Projects.vue     # 项目主页
│   ├── YunmuPractice.vue
│   └── Writer.vue
├── stores/             # Pinia 状态管理
│   ├── settings.js     # 设置存储
│   ├── session.js
│   └── writer.js       # 练习状态管理
├── utils/
│   ├── shuangpin.js    # 双拼核心逻辑
│   ├── text2pinyin.js
│   ├── sound.js
│   └── scheduler.js
├── data/
│   ├── xiaohe.js      # 小鹤双拼键位映射
│   ├── schemes/       # 8种双拼方案
│   └── words.js
└── router/
    └── index.js
```

---

## 2026-02-12 优化记录

### 代码优化
- 添加 `CORPUS_IDS` 常量，替换散落的魔法字符串
- 导出常量供其他模块使用（`stores/writer.js`）
- 添加 `DEFAULT_SCHEME` 常量（`stores/settings.js`）

### 验证结果
- ✅ `npm run build` 构建成功
- ✅ 无 lint 错误

---

## 依赖版本

| 依赖 | 版本 |
|------|------|
| vue | ^3.5.0 |
| vue-router | ^4.3.0 |
| pinia | ^2.1.7 |
| pinyin-pro | ^3.24.0 |
| vite | ^5.4.0 |

---

## 待完成功能（来自 RECOVERY_PLAN.md）

- [ ] 多种双拼方案支持（已有数据，需完善 UI）
- [ ] 练习统计系统
- [ ] 用户进度保存
- [ ] 高级练习模式
- [ ] 社交分享功能

---

## 链接

- 源码: `project/shuangping/`
- 演示: https://shuangping.vercel.app
- 文档: `src/RECOVERY_PLAN.md`

---

**标签**: project, shuangping, vue, tool
**重要性**: 0.6
