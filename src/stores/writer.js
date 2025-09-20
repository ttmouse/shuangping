import { defineStore } from 'pinia'
import { WORDS, LENGTH_BUCKETS } from '../data/words.js'
import { pinyinToKeySequence, splitSyllable, syllableToKeyCodes } from '../utils/shuangpin.js'
import { extractChinese, toPinyinArray } from '../utils/text2pinyin.js'

const STORAGE_KEY = 'sp-writer'

export const useWriterStore = defineStore('writer', {
  state: () => ({
    bucketId: '1',
    showPinyin: true,
    showShuangpin: true,
    hideKeyboard: false,
    useCustom: false, // 是否处于自定义文本模式
    lastText: '', // 最近一次导入的原文（仅中文，最多1000字）
    // 文案管理
    currentCorpusId: 'builtin-all',
    customDocs: [], // [{ id, title, text }]
    // 流模式（按单字）
    queue: [], // [{ ch, pinyin, seq:[codes] }]
    charIdx: 0, // 当前字符索引
    codeIdx: 0, // 当前字符内按键索引
    windowSize: 10,
    completed: false,
  }),
  getters: {
    bucket(state) { return LENGTH_BUCKETS.find(b => b.id === state.bucketId) || LENGTH_BUCKETS[0] },
    filtered() {
      if (this.bucketId === '1') return WORDS
      const b = this.bucket
      return WORDS.filter(w => w.text.length >= b.min && w.text.length <= b.max)
    },
    lineStart(state) { return Math.floor(state.charIdx / state.windowSize) * state.windowSize },
    currentItem(state) { return this.queue[state.charIdx] || null },
    currentPinyin() { return this.currentItem?.pinyin || '' },
    currentShuangpin() {
      const item = this.currentItem
      if (!item) return ''
      return (item.seq || []).map(c => c.replace('Key','')).join(' ')
    },
    visibleText(state) {
      if (!this.queue.length) return ''
      const slice = this.queue.slice(this.lineStart, this.lineStart + state.windowSize)
      return slice.map(i => i.ch).join('')
    },
    corpora() {
      return [
        { id: 'builtin-row1', title: '第一排按键（韵母）' },
        { id: 'builtin-row2', title: '第二排按键（韵母）' },
        { id: 'builtin-row3', title: '第三排按键（韵母）' },
        { id: 'builtin-all', title: '全部按键（韵母）' },
        { id: 'builtin-nasal', title: '前后鼻音专项' },
        ...this.customDocs.map(d => ({ id: d.id, title: d.title }))
      ]
    },
  },
  actions: {
    load() {
      try { const raw = localStorage.getItem(STORAGE_KEY); if (raw) Object.assign(this.$state, JSON.parse(raw)) } catch {}
      if (!LENGTH_BUCKETS.some(b => b.id === this.bucketId)) this.bucketId = '1'
      // 启动时若有当前文案，应用之
      if (!this.currentCorpusId) this.currentCorpusId = 'builtin-all'
    },
    save() { localStorage.setItem(STORAGE_KEY, JSON.stringify(this.$state)) },
    _itemsFromCharsAndPinyins(chars, pinyins) {
      const items = []
      const len = Math.min(chars.length, pinyins.length)
      for (let i = 0; i < len; i++) {
        const ch = chars[i]
        const py = (pinyins[i] || '').trim()
        if (!py) continue
        const seq = syllableToKeyCodes(py)
        if (!seq.length) continue
        items.push({ ch, pinyin: py, seq })
      }
      return items
    },
    _wordToItems(word) {
      // 将词拆为单字，按空格切分拼音并对齐
      const chars = Array.from(word.text)
      const pys = word.pinyin.trim().split(/\s+/)
      if (pys.length !== chars.length) return []
      const items = []
      for (let i=0;i<chars.length;i++) {
        const ch = chars[i]
        const py = pys[i]
        const seq = syllableToKeyCodes(py)
        if (!seq.length) continue
        items.push({ ch, pinyin: py, seq })
      }
      return items
    },
    importText(rawText = '') {
      // 1) 提取中文字符并截断到 1000
      const chars = extractChinese(rawText).slice(0, 1000)
      // 2) 转拼音（逐字、无声调）
      const pinyins = toPinyinArray(chars)
      // 3) 生成条目
      const items = this._itemsFromCharsAndPinyins(chars, pinyins)
      // 4) 重建队列与指针
      this.useCustom = true
      this.queue = items
      this.charIdx = 0
      this.codeIdx = 0
      this.completed = false
      // 5) 记录最近文本并保存
      this.lastText = chars.join('')
      this.save()
    },
    _builtinText(id) {
      if (id === 'builtin-row1') return '秋风微凉，二人软语，月与云伴，乌衣巷口我也有缘。'
      if (id === 'builtin-row2') return '大江东去，风拂更长，岸边少年，快意江湖，两个伙伴望海。'
      if (id === 'builtin-row3') return '走在小路上，草色翠绿，追风而行，滨海鸟鸣，绵延不断。'
      if (id === 'builtin-nasal') {
        // 前后鼻音专项（-n / -ng 对照 + ong）
        return [
          // an vs ang
          '班帮，安昂，男囊，山商，但荡，看扛，饭放，蓝郎。',
          // en vs eng
          '根耕，人仍，门蒙，分风，本崩，真征，陈成，很衡。',
          // in vs ing
          '金京，新星，林零，民名，品评，亲清，因英，近竞。',
          // ian vs iang
          '连凉，简讲，限巷，先香，见江，钱强。',
          // uan vs uang
          '关光，专装，川窗，宽狂，欢慌，栓双。',
          // ong
          '中东同红龙公，松送懂，容空。'
        ].join('')
      }
      // builtin-all
      return '中文输入双拼练习，提升速度与准确，保持节奏与专注。'
    },
    applyCorpus(id) {
      this.currentCorpusId = id
      let text = ''
      if (id.startsWith('builtin-')) text = this._builtinText(id)
      else {
        const doc = this.customDocs.find(d => d.id === id)
        text = doc?.text || ''
      }
      if (text) this.importText(text)
      this.save()
    },
    addCustomDoc(rawText) {
      const chars = extractChinese(rawText).slice(0, 1000)
      const text = chars.join('')
      if (!text) return null
      const title = text.slice(0, 10)
      const id = 'custom-' + Date.now()
      this.customDocs.push({ id, title, text })
      this.save()
      return id
    },
    addCustomDocAndApply(rawText) {
      const id = this.addCustomDoc(rawText)
      if (id) this.applyCorpus(id)
    },
    deleteCustomDoc(id) {
      const idx = this.customDocs.findIndex(d => d.id === id)
      if (idx >= 0) {
        this.customDocs.splice(idx, 1)
        if (this.currentCorpusId === id) {
          this.currentCorpusId = 'builtin-all'
          this.applyCorpus('builtin-all')
        }
        this.save()
      }
    },
    restartCurrent() {
      if (this.currentCorpusId) this.applyCorpus(this.currentCorpusId)
    },
    _appendFromRandomWords(minAdd = 10) {
      const list = this.filtered
      if (!list.length) return
      let added = 0
      while (added < minAdd) {
        const w = list[Math.floor(Math.random() * list.length)]
        const items = this._wordToItems(w)
        this.queue.push(...items)
        added += items.length
      }
    },
    resetQueue() {
      this.useCustom = false
      this.queue = []
      this.charIdx = 0
      this.codeIdx = 0
      this.completed = false
      this._appendFromRandomWords(this.windowSize)
      this.save()
    },
    pickRandom() {
      // 在流模式下，相当于刷新窗口：重建队列
      this.resetQueue()
    },
    submit(code) {
      const item = this.currentItem
      if (!item) return { correct: false }
      const expect = item.seq[this.codeIdx]
      const ok = expect === code
      if (ok) {
        this.codeIdx++
        if (this.codeIdx >= item.seq.length) {
          // 完成一个字
          this.charIdx++
          this.codeIdx = 0
          // 若已完成全部字符（自定义/内置文案）
          if (this.useCustom && this.charIdx >= this.queue.length) {
            this.completed = true
            this.save()
            return { correct: ok }
          }
          // 若到达行末，切换到下一行
          if (this.charIdx % this.windowSize === 0) {
            // 裁剪已完成的行，保持内存稳定
            this.queue = this.queue.slice(this.charIdx)
            this.charIdx = 0
            // 裁剪后若无剩余，自定义模式下视为完成
            if (this.useCustom && this.queue.length === 0) {
              this.completed = true
              this.save()
              return { correct: ok }
            }
          }
          // 维持行的长度：若剩余不足，追加（自定义模式不追加）
          if (!this.useCustom && this.queue.length < this.windowSize) this._appendFromRandomWords(this.windowSize - this.queue.length)
          this.save()
        } else this.save()
      }
      return { correct: ok }
    },
    setBucket(id) { this.bucketId = id; this.save(); this.pickRandom() },
    setShowPinyin(v) { this.showPinyin = !!v; this.save() },
    setShowShuangpin(v) { this.showShuangpin = !!v; this.save() },
    setHideKeyboard(v) { this.hideKeyboard = !!v; this.save() },
  }
})
