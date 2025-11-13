# 贡献指南

感谢您对双拼练习工具项目的关注！我们欢迎各种形式的贡献，包括但不限于：

- 提交 Bug 报告
- 提出功能建议
- 提交代码改进
- 完善文档
- 分享使用体验

## 开始贡献

### 环境准备

1. Fork 项目到您的 GitHub 账户
2. 克隆您的 Fork 到本地

```bash
git clone https://github.com/your-username/shuangping.git
cd shuangping
```

3. 安装依赖

```bash
npm install
```

4. 启动开发服务器

```bash
npm run dev
```

### 开发流程

1. 创建功能分支

```bash
git checkout -b feature/your-feature-name
```

2. 进行开发和测试
3. 提交更改

```bash
git add .
git commit -m "feat: 添加新功能描述"
```

4. 推送到您的 Fork

```bash
git push origin feature/your-feature-name
```

5. 创建 Pull Request

## 提交规范

我们使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

- `feat:` 新功能
- `fix:` Bug 修复
- `docs:` 文档更新
- `style:` 代码格式调整（不影响功能）
- `refactor:` 代码重构
- `perf:` 性能优化
- `test:` 测试相关
- `chore:` 构建工具、依赖更新等

### 示例

```
feat: 添加微软双拼方案支持
fix: 修复音频加载失败问题
docs: 更新 README 安装说明
perf: 优化键盘渲染性能
```

## 代码规范

### Vue 组件

- 使用 Vue 3 Composition API
- 组件名使用 PascalCase
- 使用 `<script setup>` 语法
- 遵循单一职责原则

### CSS

- 使用 SCSS 预处理器
- 使用 BEM 命名规范
- 移动端优先的响应式设计
- 使用 CSS 变量定义主题

### JavaScript

- 使用 ES6+ 语法
- 使用语义化变量和函数名
- 添加必要的注释
- 避免使用全局变量

## 提交前检查

在提交 PR 前，请确保：

1. 代码通过 ESLint 检查
2. 所有测试通过
3. 功能正常工作
4. 文档已更新
5. 兼容主流浏览器

## 报告 Bug

使用 GitHub Issues 报告 Bug 时，请包含：

1. Bug 描述
2. 复现步骤
3. 预期行为
4. 实际行为
5. 环境信息（浏览器、操作系统等）
6. 相关截图（如果适用）

## 功能建议

提出新功能建议时，请包含：

1. 功能描述
2. 使用场景
3. 实现建议（如果有）
4. 类似产品参考（如果有）

## 添加新的双拼方案

1. 在 `src/data/schemes/` 目录下创建新文件
2. 定义键位映射和编码规则
3. 在 `src/data/scheme.js` 中注册新方案
4. 添加测试用例
5. 更新文档

## 发布流程

项目的版本发布遵循 [Semantic Versioning](https://semver.org/)：

- 主版本号：不兼容的 API 修改
- 次版本号：向下兼容的功能性新增
- 修订号：向下兼容的问题修正

## 社区准则

1. 尊重所有参与者
2. 保持友好和专业
3. 关注问题本身而非个人
4. 接受不同观点和技术方案

## 获取帮助

如果您有任何问题，可以通过以下方式获取帮助：

- 查看 [项目文档](./docs/)
- 搜索现有的 [Issues](https://github.com/your-username/shuangping/issues)
- 在 Discord 社区提问
- 发送邮件至 project@example.com

## 致谢

感谢所有为项目做出贡献的开发者！

您的贡献将被记录在项目的 [贡献者列表](./CONTRIBUTORS.md) 中。