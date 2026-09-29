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
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url)

    // 处理 OPTIONS 预检请求
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': '*',
          'Access-Control-Max-Age': '86400',
        },
      })
    }

    // 只处理 /api/youdao/* 路径
    if (!url.pathname.startsWith('/api/youdao/')) {
      return new Response('Not Found. Use /api/youdao/* to proxy dict.youdao.com', {
        status: 404,
        headers: { 'Access-Control-Allow-Origin': '*' },
      })
    }

    // 构建目标 URL：去掉 /api/youdao 前缀，转发到 dict.youdao.com
    const targetPath = url.pathname.replace('/api/youdao', '')
    const targetUrl = 'https://dict.youdao.com' + targetPath + url.search

    try {
      // 转发请求，模拟完整的浏览器请求头（绕过有道的代理检测）
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
          Cookie:
            'OUTFOX_SEARCH_USER_ID_NCOO=1209711592.2933877; OUTFOX_SEARCH_USER_ID=465541934@125.121.96.80; i18n_redirected=zh',
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

      // 覆盖/添加 CORS 头
      newResponse.headers.set('Access-Control-Allow-Origin', '*')
      newResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
      newResponse.headers.set('Access-Control-Allow-Headers', '*')

      // 移除可能导致问题的头
      newResponse.headers.delete('content-security-policy')
      newResponse.headers.delete('x-frame-options')

      return newResponse
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 502,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      })
    }
  },
}
