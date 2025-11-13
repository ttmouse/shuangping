import { defineStore } from 'pinia'

const STORAGE_KEY = 'sp-settings'

export const useSettingsStore = defineStore('settings', {
  state: () => ({
    theme: 'light',
    lastMode: 'yunmu',
    sound: true,
    soundVolume: 0.18,
    soundUseCustom: true,
    soundOkFile: '',
    soundList: [],
    // UI preferences
    yunmuShowShuangpin: true,
    yunmuAutoSpeak: false, // 自动朗读功能
    // Double pinyin scheme
    currentScheme: 'xiaohe', // 当前双拼方案ID
  }),
  actions: {
    load() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (raw) Object.assign(this.$state, JSON.parse(raw))
      } catch {}
      this.applyTheme()
    },
    save() {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.$state))
    },
    toggleTheme() {
      this.theme = this.theme === 'light' ? 'dark' : 'light'
      this.applyTheme()
      this.save()
    },
    applyTheme() {
      const html = document.documentElement
      if (this.theme === 'dark') html.classList.add('dark')
      else html.classList.remove('dark')
    },
    async loadSoundList() {
      const names = new Set()
      try {
        const res = await fetch('/sounds/index.json', { cache: 'no-cache' })
        if (res.ok) {
          const arr = await res.json()
          if (Array.isArray(arr)) arr.forEach(n => typeof n === 'string' && names.add(n))
        }
      } catch {}
      if (names.size === 0) {
        const candidates = ['ting.mp3','correct.mp3','coin.mp3','reward.mp3','success.mp3','ok.mp3']
        await Promise.all(candidates.map(async n => {
          try {
            const r = await fetch(`/sounds/${n}`, { method: 'GET', cache: 'no-cache' })
            if (r.ok) names.add(n)
          } catch {}
        }))
      }
      this.soundList = Array.from(names)
      return this.soundList
    },
    setOkSoundFile(name) {
      this.soundOkFile = name || ''
      this.save()
    },
    setCurrentScheme(schemeId) {
      this.currentScheme = schemeId || 'xiaohe'
      this.save()
    },
  },
})
