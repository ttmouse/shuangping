# 项目检查清单 (Project Checklist)

## 核心功能

### 页面组件
- [ ] [Projects.vue](../pages/Projects.vue) - 项目展示页面
  - [ ] 项目卡片展示
  - [ ] 响应式布局
  - [ ] 导航链接

- [ ] [Writer.vue](../pages/Writer.vue) - 打字练习页面
  - [ ] 文本显示和输入
  - [ ] 进度跟踪
  - [ ] 键盘交互
  - [ ] 自定义文本导入

- [ ] [YunmuPractice.vue](../pages/YunmuPractice.vue) - 韵母练习页面
  - [ ] 韵母选择和显示
  - [ ] 练习进度跟踪
  - [ ] 键盘交互
  - [ ] 范围选择

### 可复用组件
- [ ] [Keyboard.vue](../components/Keyboard.vue) - 虚拟键盘
  - [ ] 键盘布局
  - [ ] 按键交互
  - [ ] 视觉反馈
  - [ ] 隐藏功能

- [ ] [TopStatusBar.vue](../components/TopStatusBar.vue) - 顶部状态栏
  - [ ] 导航菜单
  - [ ] 主题切换
  - [ ] 链接管理

- [ ] [SoundSelector.vue](../components/SoundSelector.vue) - 音效选择器
  - [ ] 音效选项
  - [ ] 预览功能
  - [ ] 设置保存

- [ ] [PerfMonitor.vue](../components/PerfMonitor.vue) - 性能监控
  - [ ] 性能指标显示
  - [ ] 实时更新
  - [ ] 重置功能

## 状态管理

### Pinia Stores
- [ ] [writer.js](../stores/writer.js) - 打字练习状态
  - [ ] 文本队列管理
  - [ ] 输入进度跟踪
  - [ ] 自定义文本处理
  - [ ] 状态持久化

- [ ] [session.js](../stores/session.js) - 韵母练习状态
  - [ ] 目标队列管理
  - [ ] 练习进度跟踪
  - [ ] 键盘隐藏状态
  - [ ] 状态持久化

- [ ] [settings.js](../stores/settings.js) - 应用设置
  - [ ] 主题管理
  - [ ] 音效设置
  - [ ] 其他用户偏好
  - [ ] 设置持久化

## 核心逻辑

### 双拼方案
- [ ] [scheme.js](../data/scheme.js) - 方案管理器
  - [ ] 方案注册系统
  - [ ] 当前方案管理
  - [ ] 方案切换逻辑

- [ ] [schemes/](../data/schemes/) - 双拼方案定义
  - [ ] [xiaohe.js](../data/schemes/xiaohe.js) - 小鹤双拼
  - [ ] [ziran.js](../data/schemes/ziran.js) - 自然双拼
  - [ ] [sogou.js](../data/schemes/sogou.js) - 搜狗双拼
  - [ ] [microsoft.js](../data/schemes/microsoft.js) - 微软双拼
  - [ ] [abc.js](../data/schemes/abc.js) - ABC双拼
  - [ ] [jiajia.js](../data/schemes/jiajia.js) - 佳佳双拼
  - [ ] [ziguang.js](../data/schemes/ziguang.js) - 紫光双拼
  - [ ] [guoji.js](../data/schemes/guoji.js) - 国际双拼

### 核心工具
- [ ] [shuangpin.js](../utils/shuangpin.js) - 双拼逻辑
  - [ ] 声母处理
  - [ ] 韵母处理
  - [ ] 编码转换
  - [ ] 方案适配

- [ ] [sound.js](../utils/sound.js) - 音频处理
  - [ ] 音频加载
  - [ ] 音频播放
  - [ ] 音频缓存
  - [ ] 懒加载实现

- [ ] [text2pinyin.js](../utils/text2pinyin.js) - 文本转拼音
  - [ ] 中文提取
  - [ ] 拼音转换
  - [ ] 格式标准化

- [ ] [pronounce.js](../utils/pronounce.js) - 拼音处理
  - [ ] 拼音验证
  - [ ] 音调处理
  - [ ] 特殊字符处理

### 工具系统
- [ ] [performance.js](../utils/performance.js) - 性能监控
  - [ ] 指标收集
  - [ ] 性能分析
  - [ ] 报告生成

- [ ] [keyboardManager.js](../utils/keyboardManager.js) - 键盘事件管理
  - [ ] 事件监听
  - [ ] 事件分发
  - [ ] 状态跟踪

## 数据文件

- [ ] [words.js](../data/words.js) - 词汇数据
  - [ ] 词汇定义
  - [ ] 分类组织
  - [ ] 长度分桶

- [ ] [xiaohe.js](../data/xiaohe.js) - 键盘映射
  - [ ] 键位定义
  - [ ] 字符映射
  - [ ] 辅助信息

## 路由系统

- [ ] [index.js](../router/index.js) - 路由配置
  - [ ] 路由定义
  - [ ] 懒加载
  - [ ] 导航守卫

## 样式和主题

- [ ] [styles.css](../assets/styles.css) - 全局样式
  - [ ] 主题变量
  - [ ] 基础样式
  - [ ] 响应式规则
  - [ ] 暗色主题

## 构建和部署

- [ ] [vite.config.js](../../vite.config.js) - Vite配置
  - [ ] 构建优化
  - [ ] 代码分割
  - [ ] 插件配置
  - [ ] 开发服务器

- [ ] [package.json](../../package.json) - 项目配置
  - [ ] 依赖管理
  - [ ] 脚本定义
  - [ ] 项目信息

## 文档

- [ ] [README.md](../../README.md) - 项目说明
  - [ ] 项目介绍
  - [ ] 使用说明
  - [ ] 安装指南
  - [ ] 贡献指南

- [ ] [CODEBUDDY.md](../../CODEBUDDY.md) - 开发者指南
  - [ ] 开发命令
  - [ ] 项目架构
  - [ ] 开发规范
  - [ ] 最佳实践

## 测试

- [ ] 单元测试
  - [ ] 组件测试
  - [ ] 工具函数测试
  - [ ] Store 测试

- [ ] 集成测试
  - [ ] 页面流程测试
  - [ ] 用户交互测试
  - [ ] 路由测试

- [ ] 性能测试
  - [ ] 加载性能
  - [ ] 运行时性能
  - [ ] 内存使用