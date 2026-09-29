/**
 * 有道词典代理 - Cloudflare Workers
 *
 * 功能：将 /api/youdao/* 请求转发到 https://dict.youdao.com/*
 *       并添加 CORS 头，允许前端跨域调用
 *
 * 部署步骤：
 * 1. 注册 Cloudflare 账号：https://dash.cloudflare.com/sign-up
 * 2. 进入 Workers & Pages → Create application → Create Worker
 * 3. 给 Worker 起个名字（如 youdao-proxy），点击 Deploy
 * 4. 点击 Edit code，把本文件内容粘贴进去，点击 Deploy
 * 5. 部署后获取 Worker URL，如 https://youdao-proxy.yourname.workers.dev
 * 6. 把 Worker URL 告诉我，我修改前端代码使用这个代理
 *
 * 免费额度：每天 100,000 次请求，足够个人使用
 *
 * 防滥用（2026-09-29）：
 * - 方法只放行 GET/OPTIONS
 * - 路径只放行实际使用的 /result /jsonapi_s /suggest /dictvoice
 * - 来源校验：Origin 在白名单内才放行（dev 来源 localhost 放行）
 * - 简单限流：单 IP 每 60s 最多 60 次查询
 */

// ===== 需要按实际部署域名维护的白名单（生产：GitHub Pages，2026-09-29 PM 提供） =====
const ALLOWED_ORIGINS = [
  'https://ttmouse.github.io',
]
const ALLOWED_DEV_HOSTNAMES = ['localhost', '127.0.0.1']

const ALLOWED_PATHS = ['/result', '/jsonapi_s', '/suggest', '/dictvoice']
const RATE_LIMIT = 60 // 次
const RATE_WINDOW_MS = 60_000 // ms
// 简单内存限流：每请求 IP 计数（单实例 Worker 级别，多实例下近似）
const rateBuckets = new Map() // ip -> { count, windowStart }

function corsHeaders(origin) {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': '*',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  }
}

function checkRateLimit(ip) {
  const now = Date.now()
  let bucket = rateBuckets.get(ip)
  if (!bucket || now - bucket.windowStart > RATE_WINDOW_MS) {
    bucket = { count: 0, windowStart: now }
    rateBuckets.set(ip, bucket)
    if (rateBuckets.size > 10000) rateBuckets.clear()
  }
  bucket.count += 1
  return bucket.count <= RATE_LIMIT
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url)

    // 处理 OPTIONS 预检请求
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders(request.headers.get('Origin') ?? '*'),
      })
    }

    // 防滥用检查（404/403 都不暴露细节）
    if (request.method !== 'GET') {
      return new Response('Method Not Allowed', { status: 405 })
    }

    // 只处理 /api/youdao/* 路径
    if (!url.pathname.startsWith('/api/youdao/')) {
      return new Response('Not Found. Use /api/youdao/* to proxy dict.youdao.com', {
        status: 404,
      })
    }

    // 路径白名单：只转发实际用到的有道接口
    const targetPath = url.pathname.replace('/api/youdao', '')
    if (!ALLOWED_PATHS.some((p) => targetPath === p || targetPath.startsWith(p + '?') || targetPath.startsWith('/dictvoice'))) {
      return new Response('Path Not Allowed', { status: 403 })
    }

    // 来源校验：Origin 必须在白名单内（dev 的 localhost 也放行）
    const origin = request.headers.get('Origin') ?? ''
    const originHost = origin ? new URL(origin).hostname : ''
    if (!origin) {
      return new Response('Origin Not Allowed', { status: 403 })
    }
    if (
      !ALLOWED_ORIGINS.includes(origin) &&
      !ALLOWED_DEV_HOSTNAMES.includes(originHost)
    ) {
      return new Response('Origin Not Allowed', { status: 403 })
    }

    // 简单限流
    const ip = request.headers.get('CF-Connecting-IP') ?? 'unknown'
    if (!checkRateLimit(ip)) {
      return new Response('Too Many Requests', {
        status: 429,
        headers: corsHeaders(origin),
      })
    }

    // 构建目标 URL：去掉 /api/youdao 前缀，转发到 dict.youdao.com
    const targetUrl = 'https://dict.youdao.com' + targetPath + url.search

    try {
      // 转发请求，模拟完整的浏览器请求头（绕过有道的代理检测）
      // Cookie 改由环境变量/Secret 注入，不再写死在代码里（2026-09-29）
      const cookieValue = (typeof env.YOUDAO_COOKIE === "string" && env.YOUDAO_COOKIE) ? env.YOUDAO_COOKIE : "i18n_redirected=zh"
      const response = await fetch(targetUrl, {
        method: request.method,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Accept:
            'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
          'Accept-Language': 'zh-CN,zh;q=0.9,zh-TW;q=0.8,en;q=0.7',
          'Accept-Encoding': 'gzip, deflate',
          Referer: 'https://dict.youdao.com/',
          'Cache-Control': 'no-cache',
          Pragma: 'no-cache',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'same-origin',
          'Sec-Fetch-User': '?1',
          'Upgrade-Insecure-Requests': '1',
          'sec-ch-ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
          'sec-ch-ua-mobile': '?0',
          'sec-ch-ua-platform': '"macOS"',
          Cookie: cookieValue,
        },
        // 不转发客户端的 cookie（避免携带用户的有道登录态）
        credentials: 'omit',
        redirect: 'follow',
      })

      // 复制响应，添加 CORS 头
      const newResponse = new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
      })

      // 覆盖/添加 CORS 头（回显白名单内的 Origin）
      newResponse.headers.set('Access-Control-Allow-Origin', origin)
      newResponse.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS')
      newResponse.headers.set('Access-Control-Allow-Headers', '*')
      newResponse.headers.set('Vary', 'Origin')

      // 移除可能导致问题的头
      newResponse.headers.delete('content-security-policy')
      newResponse.headers.delete('x-frame-options')

      return newResponse
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 502,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders(origin),
        },
      })
    }
  },
}
