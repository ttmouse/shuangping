import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router/index.js'
import App from './App.vue'
import './assets/styles.css'
import { useSettingsStore } from './stores/settings.js'
import { setSoundURLs, loadCustomSounds } from './utils/sound.js'

const app = createApp(App)
const pinia = createPinia()
app.use(pinia)
app.use(router)
// 挂载前同步加载设置：避免组件 onMounted 竞态（如 TopStatusBar 先保存默认值覆盖 localStorage）
const settings = useSettingsStore(pinia)
settings.load()
app.mount('#app')

// Configure custom error sound
setSoundURLs({ bad: '/sounds/cuowu.mp3' })
// Preload possible custom sounds listed in /sounds/index.json and bad sound
loadCustomSounds().catch(() => {})
