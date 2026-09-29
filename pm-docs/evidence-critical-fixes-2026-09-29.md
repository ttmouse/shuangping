# worker 防滥用自测证据（2026-09-30 · 工程师）

> 对应 `cloudflare-worker-youdao-proxy.js`（shuangping 修复 commit 12e3fb1）。
> 方法：node ES module 直接 import 该文件，mock `globalThis.fetch` 后逐分支调用 `export default.fetch`。

## 分支场景（12 + 3）

| # | 场景 | 预期 | 实测 |
|---|---|---|---|
| 1 | POST 请求 | 405 | PASS |
| 2 | 非 /api/youdao 路径 | 404 | PASS |
| 3 | 禁止路径 /api/youdao/admin | 403 | PASS |
| 4 | 非白名单 Origin（evil.com） | 403 | PASS |
| 5 | 无 Origin | 403 | PASS |
| 6 | 白名单 Origin（github.io）+ 正常 GET | 200 + ACAO 回显 | PASS |
| 7 | localhost dev Origin | 200 + ACAO 回显 | PASS |
| 8 | jsonapi_s 白名单路径 | 200 | PASS |
| 9 | dictvoice 白名单路径 | 200 | PASS |
| 10 | OPTIONS 预检 | 204 | PASS |
| 11 | env.YOUDAO_COOKIE 为 undefined | 200（兜底 UA/Cookie） | PASS |
| 12 | 限流：同 IP 连发 61 次 | 第 61 次 429 | PASS |
| 13 | 路径穿越 /api/youdao/result/../admin | 403 | PASS |
| 14 | 前缀混淆 /api/youdao/resultsx | 403 | PASS |
| 15 | 前缀混淆 /api/youdao/jsonapi_sX | 403 | PASS |

## 复测（白名单切换 github.io 后，2026-09-29）

- 生产 Origin `https://ttmouse.github.io` → 200，ACAO=该 origin
- 旧 vercel 占位 `https://ttmouse.vercel.app` → 403（已从白名单移除）
- result / jsonapi_s / dictvoice 三实际使用路径 → 200

## Cookie 残留检查

`grep -c "OUTFOX_SEARCH_USER_ID\|125.121" cloudflare-worker-youdao-proxy.js` = 0

## 边界说明

- 限流为单实例内存级 Map，多实例部署下为每实例限额
- 部署后需人工在线上验证一次完整释义查询（见 pm-docs/fix-critical-2026-09-29.md）
