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
    showKeyboard: true, // 显示底部虚拟键盘（设置菜单可关；外接实体键盘时可隐藏）
    yunmuShowShuangpin: true,
    yunmuAutoSpeak: false, // 自动朗读功能
    // Double pinyin scheme
    currentScheme: 'xiaohe', // 当前双拼方案ID
    // 高级练习模式设置
    blindMode: false, // 盲打模式 - 隐藏键盘提示
    cardHideLetters: true, // 卡片·默写模式：隐藏拼音字母提示，只显示横线位置
    enMasteryMs: 500, // 英文提示模式（显示字母抄写）掌握阈值 ms/字母：抄写无回忆成本，须真正快才算掌握
    enSlowMs: 1300, // 英文提示模式慢词阈值：平均每字母超过 → 视为掌握不好（与错词同权重）
    enPracticeMs: 300, // 慢词刻意练习阈值 ms/字母：超过则收录，刻意练习练到该值以内过关
    enMasteryMsDict: 1000, // 英文默写模式（隐藏字母回忆拼写）掌握阈值 ms/字母：回忆含思考时间，阈值放宽
    enSlowMsDict: 2500, // 英文默写模式慢词阈值：平均每字母超过（想不起来）→ 视为掌握不好
    enDictCurrentHint: false, // 默写模式·当前字母显示：默认关闭（字母不显示，仅下划线高亮提示位置）；打开后当前字母也显示
    enSpeakWords: true, // 英文单词发音：单词出现/打错时朗读（有道词典 TTS 接口）
    enSpeakSentence: true, // 英文整句朗读：进入新句子时整句作一次请求先试有道原声（与单词同音色），失败回退系统语音连读；多词句生效
    enNoWordPreSpeak: false, // 整句后免单词预读：读完整句后，单词输入前不再逐个朗读；打错纠音朗读仍保留
    enTTSAccent: 'uk', // 英文发音口音：'uk'=英音（有道 type=2）| 'us'=美音（type=1）
    enAllDictation: false, // 全默写模式：所有英文单词默认隐藏字母（凭记忆打），不受掌握度影响
    enGrade: 'all', // 英文词库年级：'all' | 'g4' | 'g5' | 'g6'
    enShowWordCn: true, // 英文·单词上方中文翻译是否显示（默认开）
    enShowWordTime: false, // 英文·单词下方平均用时(ms)是否显示（默认关）
    enRedoPractice: false, // 英文·错题重练：打错的单词是否重新入队重练（默认关：打错即过，无错题模式；开：错词进第二行重练）
    cardContent: 'all', // 卡片模式内容源（含年级）：'all' | 'g4' | 'g5' | 'g6' | 'sentence' | 'mistake' | 'custom'
    timeChallenge: false, // 限时挑战模式
    timeChallengeDuration: 60, // 限时挑战时长（秒）
    // 自定义练习集
    customPracticeSets: [], // 自定义练习集列表 [{ id, name, items: [{ char, pinyin }] }]
    activePracticeSetId: null, // 当前激活的练习集
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
    toggleSound() {
      this.sound = !this.sound
      this.save()
      return this.sound
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
    // 默写模式·当前字母提示
    toggleEnDictCurrentHint() {
      this.enDictCurrentHint = !this.enDictCurrentHint
      this.save()
      return this.enDictCurrentHint
    },
    // 显示/隐藏底部虚拟键盘（全局）
    toggleShowKeyboard() {
      this.showKeyboard = !this.showKeyboard
      this.save()
      return this.showKeyboard
    },
    // 整句后免单词预读：单词输入前不再朗读（打错纠音保留）
    toggleEnNoWordPreSpeak() {
      this.enNoWordPreSpeak = !this.enNoWordPreSpeak
      this.save()
      return this.enNoWordPreSpeak
    },
    // 英文整句朗读：进入新句子时先朗读整句
    toggleEnSpeakSentence() {
      this.enSpeakSentence = !this.enSpeakSentence
      this.save()
      return this.enSpeakSentence
    },
    // 英文单词发音
    toggleEnSpeakWords() {
      this.enSpeakWords = !this.enSpeakWords
      this.save()
      return this.enSpeakWords
    },
    // 英文发音口音（'uk'=英音 | 'us'=美音）
    setEnTTSAccent(accent) {
      this.enTTSAccent = accent === 'us' ? 'us' : 'uk'
      this.save()
    },
    // 慢词刻意练习阈值（ms/字母）
    setEnPracticeMs(value) {
      const v = Number(value)
      if (Number.isFinite(v) && v >= 100 && v <= 5000) {
        this.enPracticeMs = Math.round(v)
        this.save()
      }
    },
    // 全默写模式：所有英文单词隐藏字母
    toggleEnAllDictation() {
      this.enAllDictation = !this.enAllDictation
      this.save()
      return this.enAllDictation
    },
    // 英文·单词上方中文翻译是否显示
    toggleEnShowWordCn() {
      this.enShowWordCn = !this.enShowWordCn
      this.save()
      return this.enShowWordCn
    },
    // 英文·单词下方平均用时(ms)是否显示
    toggleEnShowWordTime() {
      this.enShowWordTime = !this.enShowWordTime
      this.save()
      return this.enShowWordTime
    },
    // 英文·错词是否用第二行展示
    toggleEnRedoPractice() {
      this.enRedoPractice = !this.enRedoPractice
      this.save()
      return this.enRedoPractice
    },
    // 卡片默写模式：隐藏/显示拼音字母提示
    toggleCardHideLetters() {
      this.cardHideLetters = !this.cardHideLetters
      this.save()
      return this.cardHideLetters
    },
    // 英文提示模式掌握阈值（ms/字母）
    setEnMasteryMs(value) {
      const v = Number(value)
      if (Number.isFinite(v) && v >= 100 && v <= 3000) {
        this.enMasteryMs = Math.round(v)
        this.save()
      }
    },
    // 英文提示模式慢词阈值（ms/字母）
    setEnSlowMs(value) {
      const v = Number(value)
      if (Number.isFinite(v) && v >= 200 && v <= 5000) {
        this.enSlowMs = Math.round(v)
        this.save()
      }
    },
    // 英文默写模式掌握阈值（ms/字母，回忆含思考时间，阈值放宽）
    setEnMasteryMsDict(value) {
      const v = Number(value)
      if (Number.isFinite(v) && v >= 100 && v <= 3000) {
        this.enMasteryMsDict = Math.round(v)
        this.save()
      }
    },
    // 英文默写模式慢词阈值（ms/字母，想不起来）
    setEnSlowMsDict(value) {
      const v = Number(value)
      if (Number.isFinite(v) && v >= 200 && v <= 5000) {
        this.enSlowMsDict = Math.round(v)
        this.save()
      }
    },
    // 英文词库年级
    setEnGrade(id) {
      if (['all', 'g4', 'g5', 'g6'].includes(id)) {
        this.enGrade = id
        this.save()
      }
    },
    // 卡片模式内容源（含年级）
    setCardContent(id) {
      this.cardContent = id || 'all'
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
    // 自定义练习集管理
    createPracticeSet(name) {
      const id = 'set-' + Date.now()
      this.customPracticeSets.push({
        id,
        name: name || '未命名练习集',
        items: [],
        createdAt: Date.now()
      })
      this.save()
      return id
    },
    deletePracticeSet(id) {
      const idx = this.customPracticeSets.findIndex(s => s.id === id)
      if (idx >= 0) {
        this.customPracticeSets.splice(idx, 1)
        if (this.activePracticeSetId === id) {
          this.activePracticeSetId = null
        }
        this.save()
      }
    },
    renamePracticeSet(id, newName) {
      const set = this.customPracticeSets.find(s => s.id === id)
      if (set) {
        set.name = newName || set.name
        this.save()
      }
    },
    addToPracticeSet(setId, item) {
      const set = this.customPracticeSets.find(s => s.id === setId)
      if (set && item) {
        // 检查是否已存在相同字符
        const exists = set.items.some(i => i.char === item.char)
        if (!exists) {
          set.items.push({
            char: item.char,
            pinyin: item.pinyin,
            addedAt: Date.now()
          })
          this.save()
        }
      }
    },
    removeFromPracticeSet(setId, char) {
      const set = this.customPracticeSets.find(s => s.id === setId)
      if (set) {
        set.items = set.items.filter(i => i.char !== char)
        this.save()
      }
    },
    setActivePracticeSet(id) {
      this.activePracticeSetId = id
      this.save()
    },
    clearActivePracticeSet() {
      this.activePracticeSetId = null
      this.save()
    },
    // 获取当前激活的练习集
    getActivePracticeSet() {
      if (!this.activePracticeSetId) return null
      return this.customPracticeSets.find(s => s.id === this.activePracticeSetId) || null
    },
  },
})
