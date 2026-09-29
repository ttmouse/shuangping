# 高危修复指南 · shuangping（2026-09-29 · 工程师）

## 部署流程（worker 侧）

1. **Worker 部署**：把 `cloudflare-worker-youdao-proxy.js` 的内容粘进 Cloudflare Dashboard → Workers → youdao-proxy → Edit code → Deploy（跟以往一致）。
2. **设置 Cookie Secret**：Cloudflare Dashboard → Workers → youdao-proxy → Settings → Variables → 添加 Secret：
   - Name: `YOUDAO_COOKIE`
   - Value: 你的完整 Cookie 字符串（含 `OUTFOX_SEARCH_USER_ID_NCOO=...; OUTFOX_SEARCH_USER_ID=...; i18n_redirected=zh`）
   - 也可以用命令行：`wrangler secret put YOUDAO_COOKIE`（需 wrangler 已安装并登录）
3. **白名单维护**：代码里 `ALLOWED_ORIGINS` 生产域名为 `https://ttmouse.github.io`（GitHub Pages，2026-09-29 PM 确认）。本地开发 `localhost` / `127.0.0.1` 已默认放行。
4. **前端无需改**：前端 `enTranslation.js` / `coursePackBuilder.js` 用 `hostname === 'localhost'` 判 dev，线上（ttmouse.github.io）走 CF worker 分支，与 worker 新白名单一致；worker 的 `Access-Control-Allow-Origin` 回显 `https://ttmouse.github.io`，前端 fetch 已实测兼容。（worker mock 复测：生产 Origin 200、旧 vercel 占位 403、result/jsonapi_s/dictvoice 三路径 200）

## 部署验证

部署后在生产站点（非 localhost）打开一个词的完整释义页（有道详情查询功能）：
- ❌ 如报「Origin Not Allowed」→ `ALLOWED_ORIGINS` 需补你的实际域名。
- ✅ 能正常查到释义/音标/例句 → 白名单生效。

本地 `npm run dev`（localhost:9529）照旧走 Vite 代理，不经 worker，无影响。

## 已排除的风险（自测通过）

本次改动在 worker 增加了：
- **方法白名单**：仅 GET（OPTIONS 预检放行），POST 等一律 405
- **路径白名单**：仅 `/api/youdao/{result,jsonapi_s,suggest,dictvoice}`，其他路径 403；路径穿越（`/api/youdao/result/../admin`）、前缀混淆（`/resultsx`、`/jsonapi_sX`）等变体已自测拒绝
- **Origin 白名单**：从白名单外或无 Origin 的请求 403
- **简单限流**：单 IP 每 60s 最多 60 次（超过 429）
- **Cookie 移出代码**：不再硬编码含真实 IP 的 `OUTFOX_SEARCH_USER_ID*` 字符串，改由 `env.YOUDAO_COOKIE` Secret 注入；代码里已 0 残留该字样（`grep -c` = 0）

自测覆盖 12 个分支场景 + 3 个路径边界（全套 node mock 测试，逐条 PASS）。

## 遗留风险

1. **历史提交里 Cookie 还在**：`b5c1c62` / `agent/agent/ttm-4` 等本地提交里硬编码过 Cookie（含真实 IP）。已确认这些提交未推送 GitHub 公开仓库（github/main、feat/practice-modes、origin/main 均无此文件），**不需要重写历史**。但 Cookie 本身（特别是 `OUTFOX_SEARCH_USER_ID = 465541934@125.121.96.80` 中的出口 IP）建议尽快换新（重新登录有道刷新 Cookie 值）。
2. **限流是内存级**：Cloudflare Worker 多实例下各 bucket 独立，是"每实例限 60"而非"全局限 60"。作为防滥用足够，但非强保证。
3. **Vercel 侧如果一日内频繁请求**：仍然走 worker 限流，超过 60 次/分钟会被限流返回 429。前端调用为用户主动行为，正常使用不会触发。
