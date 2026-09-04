import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  base: '/shuangping/',
  server: {
    port: 9529,
    host: true,
  },
})

