# 优化审查记录

> 本文档由 ZCode 定时优化审查任务自动维护：定期扫描近期改动，聚焦最近修改的文件输出有代码依据的优化点。已有条目不重复记录，修复后请在对应条目标注「已修复（日期）」。

最近更新：2026-09-29 03:09

本轮范围：已跟踪改动 src/pages/PracticeModes.vue（+10/-2，修复 offsetLeft 相对定位祖先取值并加滚动边界 clamp，本身正确）；重点审查了新增的 Cloudflare Worker 代理与仓库卫生。

## 2026-09-29 03:09

- [高] cloudflare-worker-youdao-proxy.js:27,49-75 — 公网开放代理：CORS 全开、无任何鉴权/限流，任何网站可直接消耗每天 10 万次 CF 免费配额，并借你的固定指纹打有道
  证据：`'Access-Control-Allow-Origin': '*'`（第 27、85 行），fetch 前没有任何 Origin/Token 校验，任意 `/api/youdao/*` 路径与方法都被转发到 `https://dict.youdao.com`。
  为什么改：worker URL（`youdao-proxy.ttmouseg.workers.dev`）已硬编码在前端 src/utils/enTranslation.js:270 和 coursePackBuilder.js:139，随构建产物公开；被第三方滥用后配额耗尽或被有道封禁，直接影响你自己的生产功能。
  怎么改：在 worker 里加来源白名单（校验 `Origin` 属于你的部署域名，或要求 `?key=<env secret>`）；方法只放行 GET；路径只放行实际用到的 `/result`、`/suggest`、`/dictvoice` 白名单。

- [高] cloudflare-worker-youdao-proxy.js:69-70 — 硬编码 Cookie 含真实 IP 等个人标识，且所有用户共享同一有道身份
  证据：`Cookie: 'OUTFOX_SEARCH_USER_ID_NCOO=1209711592.2933877; OUTFOX_SEARCH_USER_ID=465541934@125.121.96.80; i18n_redirected=zh'`，其中 `125.121.96.80` 是出口 IP；注释第 48 行自述目的是「绕过有道的代理检测」。
  为什么改：该文件若入库或粘贴到公开 Workers，IP 即泄露；更重要的是所有请求固定同一 UA+Cookie 指纹，查询量一大极易被有道风控整体封禁，届时代理全挂。
  怎么改：删掉硬编码 Cookie（匿名请求 dict.youdao.com 的 /result 页通常即可用）；确需登录态就改为 `env.YOUDAO_COOKIE` 从 Worker Secret 注入，UA 每次从少量池中随机选。

- [中] cloudflare-worker-youdao-proxy.js:49-75,95 — 转发 POST 却丢弃请求体，错误分支把内部 error.message 原样回给公网
  证据：fetch 选项里 `method: request.method` 透传，但没有 `body` 字段（POST 一律变空 body）；catch 分支 `JSON.stringify({ error: error.message })` 直接返回。
  为什么改：method 与 body 不一致是隐性坑（将来若有 POST 接口会静默丢数据）；`error.message` 来自 CF 内部 fetch，可能暴露上游网络细节。
  怎么改：既然前端只用 GET，直接 `if (request.method !== 'GET') return new Response('Method Not Allowed', { status: 405 })`；错误响应改为固定文案。

- [中] src/utils/enTranslation.js:270 + src/utils/coursePackBuilder.js:139 — 代理地址与「dev 走 vite 代理 / prod 走 CF Worker」逻辑在两个文件重复实现
  证据：两个文件各自定义 `const CF_WORKER_PROXY = 'https://youdao-proxy.ttmouseg.workers.dev'`，各自用 `window.location.hostname === 'localhost'` 判断环境后拼 `/api/youdao` 前缀；enTranslation.js:301-302 还有连续两行完全相同的注释。
  为什么改：换 Worker 域名或加路径白名单时要改两处，漏一处就是线上静默失败。
  怎么改：抽一个 `src/utils/youdaoProxy.js` 导出 `CF_WORKER_PROXY` 和 `getYoudaoBase()`，两处引用之。

- [中] 仓库根目录 — 未跟踪杂物堆积：`scripts/__pycache__/` 两个 .pyc（.gitignore 无 `__pycache__` 规则）、4 个大号 playground HTML 共约 370KB、若干工具状态目录
  证据：`git status` 显示未跟踪 `scripts/__pycache__/add-course-stats.cpython-314.pyc` 等；根目录 `core-sentence-style-playground.html`(178KB)、`en-sentence-playground.html`(73KB)、`playground-sentences.html`(44KB)、`visualization-playground.html`(77KB，权限 `-rw-------`)，以及 `.codex/`、`.dsh/`、`.julebu-tools/`、`.canvas-meta.json`、`.design-state.json`。
  为什么改：.gitignore 目前只忽略 node_modules/dist 等，下次 `git add .` 这些缓存和临时页会全部入库；playground 里 local-packs-test.html 直接 `import './src/utils/coursePacks.js'` 依赖项目源码，放根目录也干扰结构。
  怎么改：.gitignore 追加 `__pycache__/`、`.codex/`、`.dsh/`、`.julebu-tools/`、`.canvas-meta.json`、`.design-state.json`；playground HTML 移入 `playground/` 或 `docs/` 子目录（改相对导入路径），确认无保留价值的直接删除。

- [低] cloudflare-worker-youdao-proxy.js:1-16（未入库）— Worker 源码未纳入版本管理，部署靠「把本文件粘贴进 CF dashboard」，线上版本会与本地漂移
  证据：文件头注释第 11 行「点击 Edit code，把本文件内容粘贴进去，点击 Deploy」，且 `git status` 显示 untracked。
  为什么改：线上 worker 出问题时无法对照源码排查，也无法回滚；鉴权改造落地后漂移风险更大。
  怎么改：把该文件提交入库（建议放 `workers/youdao-proxy/`），用 wrangler 管理，secret 走 `wrangler secret put`。

- [低] src/pages/PracticeModes.vue:190 — 第一行 word-col 上 `redo: enRedoSet.has(wi)` 是恒为 false 的死绑定
  证据：第 187 行 `v-if="!enRedoSet.has(wi)"` 已把重练词排除在第一行之外，同元素 class 里的 `redo: enRedoSet.has(wi)` 永远不成立。
  为什么改：误导读者以为第一行也会出现 redo 样式；本轮改动恰好动了这块，顺手清理成本最低。
  怎么改：class 改为 `{ active: wi === wordIdx, completed: wi < wordIdx || enDoneByInput(wi) }`。
