import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  base: process.env.VITE_BASE_URL ?? (process.env.VERCEL ? '/' : '/shuangping/'),
  server: {
    port: 9529,
    host: true,
  },
})

