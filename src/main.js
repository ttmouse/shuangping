import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router/index.js'
import App from './App.vue'
import './assets/styles.css'
import { setSoundURLs, loadCustomSounds } from './utils/sound.js'

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.mount('#app')

// Configure custom error sound
setSoundURLs({ bad: '/sounds/cuowu.mp3' })
// Preload possible custom sounds listed in /sounds/index.json and bad sound
loadCustomSounds().catch(() => {})
