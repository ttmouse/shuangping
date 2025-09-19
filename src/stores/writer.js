import { defineStore } from 'pinia'
import { WORDS, LENGTH_BUCKETS } from '../data/words.js'
import { pinyinToKeySequence, splitSyllable, syllableToKeyCodes } from '../utils/shuangpin.js'

const STORAGE_KEY = 'sp-writer'

export const useWriterStore = defineStore('writer', {
  state: () => ({
    bucketId: '1',
    showPinyin: true,
    showShuangpin: true,
    hideKeyboard: false,
    // 流模式（按单字）
    queue: [], // [{ ch, pinyin, seq:[codes] }]
    charIdx: 0, // 当前字符索引
    codeIdx: 0, // 当前字符内按键索引
    windowSize: 10,
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
  },
  actions: {
    load() {
      try { const raw = localStorage.getItem(STORAGE_KEY); if (raw) Object.assign(this.$state, JSON.parse(raw)) } catch {}
      if (!LENGTH_BUCKETS.some(b => b.id === this.bucketId)) this.bucketId = '1'
    },
    save() { localStorage.setItem(STORAGE_KEY, JSON.stringify(this.$state)) },
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
      this.queue = []
      this.charIdx = 0
      this.codeIdx = 0
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
          // 若到达行末，切换到下一行
          if (this.charIdx % this.windowSize === 0) {
            // 裁剪已完成的行，保持内存稳定
            this.queue = this.queue.slice(this.charIdx)
            this.charIdx = 0
          }
          // 维持行的长度：若剩余不足，追加
          if (this.queue.length < this.windowSize) this._appendFromRandomWords(this.windowSize - this.queue.length)
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
