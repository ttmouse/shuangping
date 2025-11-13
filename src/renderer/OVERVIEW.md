# 架构概述 (Architecture Overview)

## 项目结构

本项目是一个基于 Vue 3 的单页应用，用于双拼输入法练习。

```
src/
├── components/          # 可复用组件
│   ├── Keyboard.vue        # 虚拟键盘组件
│   ├── SoundSelector.vue   # 音效选择器
│   ├── TopStatusBar.vue    # 顶部状态栏
│   └── PerfMonitor.vue     # 性能监控工具
├── pages/               # 页面组件
│   ├── Projects.vue        # 项目展示页面
│   ├── Writer.vue          # 打字练习页面
│   └── YunmuPractice.vue  # 韵母练习页面
├── stores/              # Pinia 状态管理
│   ├── session.js         # 练习会话状态
│   ├── settings.js        # 应用设置
│   └── writer.js         # 打字练习状态
├── utils/               # 工具函数
│   ├── performance.js     # 性能监控工具
│   ├── keyboardManager.js # 键盘事件管理
│   ├── sound.js          # 音频处理
│   ├── shuangpin.js      # 双拼核心逻辑
│   ├── scheduler.js      # 任务调度
│   ├── pronounce.js      # 拼音处理
│   └── text2pinyin.js   # 文本转拼音
├── data/                # 数据文件
│   ├── schemes/          # 各类双拼方案定义
│   ├── scheme.js         # 双拼方案管理
│   ├── words.js          # 词汇数据
│   └── xiaohe.js        # 小鹤双拼键盘映射
└── router/              # 路由配置
    └── index.js          # 路由定义
```

## 核心架构

### 1. 组件架构

项目采用组件化设计，主要分为三层：

- **页面层** (Pages): 负责不同功能页面的整体布局和业务逻辑
- **组件层** (Components): 提供可复用的 UI 组件
- **工具层** (Utils): 提供业务逻辑和工具函数

### 2. 状态管理

使用 Pinia 进行集中式状态管理，三个主要的 store：

- **writer.js**: 管理打字练习状态，包括文本队列、输入进度等
- **session.js**: 管理韵母练习会话，包括目标队列、当前进度等
- **settings.js**: 管理应用全局设置，如音效、主题等

### 3. 路由系统

使用 Vue Router 实现页面导航：
- `/` - 项目展示页 (Projects.vue)
- `/yunmu-practice` - 韵母练习 (YunmuPractice.vue)
- `/writer` - 打字练习 (Writer.vue)

### 4. 双拼方案系统

支持多种双拼方案，每个方案定义在 `src/data/schemes/` 目录下：
- 小鹤双拼 (xiaohe.js)
- 自然双拼 (ziran.js)
- 搜狗双拼 (sogou.js)
- 微软双拼 (microsoft.js)
- ABC 双拼 (abc.js)
- 佳佳双拼 (jiajia.js)
- 紫光双拼 (ziguang.js)
- 国际双拼 (guoji.js)

### 5. 音频系统

音频系统基于 Web Audio API，提供练习过程中的音频反馈：
- 正确音效: `/sounds/ting.mp3`
- 错误音效: `/sounds/cuowu.mp3`
- 韵母发音: `/finals/*.mp3`

## 关键技术

### 1. 响应式数据管理

使用 Vue 3 的 Composition API 和响应式系统管理组件状态：
- 使用 `ref` 和 `computed` 管理组件内部状态
- 使用 Pinia 管理跨组件共享状态
- 优化响应式数据，减少不必要的响应式开销

### 2. 性能优化

- **代码分割**: 使用 Vite 的动态导入分离代码
- **懒加载**: 音频文件按需加载
- **虚拟化**: 大列表虚拟化渲染
- **事件委托**: 集中管理键盘事件

### 3. 键盘事件处理

使用 KeyboardManager 类集中处理键盘事件：
- 避免多个组件重复监听同一事件
- 提供统一的事件处理接口
- 跟踪按键状态

## 数据流

1. 用户输入 → KeyboardManager → 组件事件处理
2. 组件更新状态 → Pinia Store → 响应式更新
3. 状态变化 → 音频反馈 → Web Audio API
4. 练习进度 → 本地存储 → 下次访问恢复

## 扩展点

项目设计考虑了以下扩展点：

1. **新双拼方案**: 在 `src/data/schemes/` 下添加新文件
2. **新练习模式**: 在 `src/pages/` 下添加新组件
3. **新音效**: 在 `public/sounds/` 下添加音频文件
4. **新主题**: 修改 CSS 变量或添加新主题文件