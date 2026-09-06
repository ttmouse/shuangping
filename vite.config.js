import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  base: process.env.VITE_BASE_URL ?? (process.env.VERCEL ? '/' : '/shuangping/'),
  server: {
    port: 9529,
    host: true,
    proxy: {
      // 有道词典页面代理：解决跨域 CORS，用于获取完整词典数据（释义/例句/音标）
      '/api/youdao': {
        target: 'https://dict.youdao.com',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api\/youdao/, ''),
      },
    },
  },
})

