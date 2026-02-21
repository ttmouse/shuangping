import { defineStore } from 'pinia'

const STORAGE_KEY = 'sp-settings'

// 默认双拼方案
export const DEFAULT_SCHEME = 'xiaohe'

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
    // 高级练习模式设置
    blindMode: false, // 盲打模式 - 隐藏键盘提示
    timeChallenge: false, // 限时挑战模式
    timeChallengeDuration: 60, // 限时挑战时长（秒）
    customPracticeSet: [], // 自定义练习集
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
    // 盲打模式
    toggleBlindMode() {
      this.blindMode = !this.blindMode
      this.save()
      return this.blindMode
    },
    setBlindMode(value) {
      this.blindMode = !!value
      this.save()
    },
    // 限时挑战
    toggleTimeChallenge() {
      this.timeChallenge = !this.timeChallenge
      this.save()
      return this.timeChallenge
    },
    setTimeChallenge(value) {
      this.timeChallenge = !!value
      this.save()
    },
    setTimeChallengeDuration(seconds) {
      this.timeChallengeDuration = Math.max(10, Math.min(600, seconds))
      this.save()
    },
    // 自定义练习集
    addToCustomPracticeSet(item) {
      if (!this.customPracticeSet.includes(item)) {
        this.customPracticeSet.push(item)
        this.save()
      }
    },
    removeFromCustomPracticeSet(item) {
      const idx = this.customPracticeSet.indexOf(item)
      if (idx >= 0) {
        this.customPracticeSet.splice(idx, 1)
        this.save()
      }
    },
    clearCustomPracticeSet() {
      this.customPracticeSet = []
      this.save()
    },
  },
})
