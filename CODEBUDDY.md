# CODEBUDDY.md This file provides guidance to CodeBuddy Code when working with code in this repository.

## 项目概述

这是一个基于 Vue 3 的双拼输入法在线练习工具，帮助用户快速掌握双拼输入技巧。项目提供了多种双拼方案支持，包括小鹤双拼、自然双拼、搜狗双拼等，并提供声母和韵母的专项练习功能。

## 开发命令

- `npm run dev` - 启动开发服务器，运行在 http://localhost:9527
- `npm run build` - 构建生产版本到 dist 目录
- `npm run preview` - 预览构建后的应用

## 项目架构

### 核心技术栈
- Vue 3 + Composition API
- Vite 作为构建工具
- Vue Router 用于页面路由
- Pinia 用于状态管理
- Web Audio API 用于音频处理

### 目录结构

```
src/
├── components/        # 可复用组件
│   ├── Keyboard.vue       # 键盘组件
│   ├── SoundSelector.vue  # 音频选择组件
│   └── TopStatusBar.vue   # 顶部状态栏
├── pages/            # 页面组件
│   ├── Projects.vue      # 项目展示页面（首页）
│   ├── Writer.vue        # 打字练习页面
│   └── YunmuPractice.vue # 韵母专项练习页面
├── router/           # 路由配置
├── stores/           # Pinia 状态管理
│   ├── session.js        # 练习会话状态
│   ├── settings.js       # 应用设置
│   └── writer.js         # 打字练习状态
├── utils/            # 工具函数
│   ├── pronounce.js      # 拼音处理
│   ├── scheduler.js      # 任务调度
│   ├── shuangpin.js      # 双拼核心逻辑
│   ├── sound.js          # 音频处理
│   └── text2pinyin.js    # 文本转拼音
├── data/             # 数据文件
│   ├── scheme.js         # 双拼方案管理
│   ├── words.js          # 词汇数据
│   ├── xiaohe.js         # 小鹤双拼键盘映射
│   └── schemes/          # 各类双拼方案定义
```

### 状态管理架构

项目使用 Pinia 管理三个主要状态：
1. **session.js** - 管理练习会话数据，包括用户进度、练习统计等
2. **settings.js** - 管理应用设置，如双拼方案选择、显示选项等
3. **writer.js** - 管理打字练习的核心逻辑，包括文本队列、输入状态等

### 双拼方案系统

双拼方案系统是项目的核心，通过以下方式组织：
- 每种双拼方案在 `data/schemes/` 下有独立定义文件
- `scheme.js` 负责方案注册和切换
- `shuangpin.js` 提供双拼编码转换的核心算法
- `xiaohe.js` 定义键盘映射和声韵母关系

### 音频系统

项目使用 Web Audio API 提供音频反馈：
- `utils/sound.js` 处理音频上下文和播放
- `public/sounds/` 存储提示音和错误音效
- `public/finals/` 存储韵母发音音频文件

### 主要功能模块

1. **项目展示页** (`Projects.vue`) - 展示所有可用项目
2. **韵母专项练习** (`YunmuPractice.vue`) - 提供韵母针对性练习
3. **综合打字练习** (`Writer.vue`) - 提供完整的文本打字练习，支持自定义文本

### 自定义双拼方案

要添加新的双拼方案，需要：
1. 在 `data/schemes/` 下创建新文件，定义键盘映射
2. 在 `data/scheme.js` 中注册新方案
3. 确保方案符合项目定义的数据结构

### 构建和部署

项目使用 Vite 构建，并配置了 Vercel 部署：
- `vercel.json` 配置了所有路由重定向到 index.html
- 构建产物位于 `dist/` 目录

## 开发注意事项

- 项目使用 ES 模块，确保所有导入/导出语法正确
- 音频文件路径使用绝对路径引用 `/sounds/` 和 `/finals/`
- 状态修改请通过 Pinia 的 actions 进行，确保状态变更可追踪
- 新增双拼方案时请确保键盘映射和编码规则完整准确