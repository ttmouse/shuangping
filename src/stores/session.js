import { defineStore } from 'pinia'
import { finalsPool, finalToKeyCodes, ranges } from '../data/xiaohe.js'
import { getNextUniform } from '../utils/scheduler.js'

const STORAGE_KEY = 'sp-session'

export const useSessionStore = defineStore('session', {
  state: () => ({
    started: false,
    currentTarget: '',
    lastTarget: '',
    // 队列与窗口大小（整批模式）
    queue: [], // 当前批次的 10 个目标，如 ['iu','an', ...]
    windowSize: 10,
    pos: 0, // 当前批次内的位置（0..windowSize-1）
    rangeId: 'all',
    scheduler: 'uniform',
  }),
  getters: {
    pool(state) {
      const range = ranges.find(r => r.id === state.rangeId) || ranges[0]
      const allowed = new Set(range.keyCodes)
      // Build pool filtered by range
      const pool = finalsPool.filter(f => {
        const codes = finalToKeyCodes.get(f)
        if (!codes) return false
        for (const c of codes) if (allowed.has(c)) return true
        return false
      })
      return pool
    },
    upcoming(state) {
      if (!this.queue?.length) return []
      return this.queue.slice(0, state.windowSize)
    },
  },
  actions: {
    _genOne(last) {
      const pool = this.pool
      if (!pool.length) return ''
      return getNextUniform(pool, last)
    },
    _fillBatch() {
      const list = []
      let last = this.lastTarget || this.currentTarget || ''
      for (let i = 0; i < this.windowSize; i++) {
        const n = this._genOne(last)
        list.push(n)
        last = n
      }
      this.queue = list
    },
    load() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (raw) Object.assign(this.$state, JSON.parse(raw))
      } catch {}
      // 迁移兼容：若已开始但无队列，补齐一批；同时校正指针
      if (this.started && (!Array.isArray(this.queue) || this.queue.length === 0)) {
        this._fillBatch()
        this.pos = 0
        this.currentTarget = this.queue[0] || ''
      }
      if (this.pos < 0) this.pos = 0
      if (this.pos >= this.queue.length) this.pos = 0
    },
    save() {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.$state))
    },
    start() {
      this.started = true
      // 初始化一整批 10 个
      this._fillBatch()
      this.pos = 0
      this.currentTarget = this.queue[0] || ''
      this.save()
    },
    reset() {
      this.started = false
      this.currentTarget = ''
      this.lastTarget = ''
      this.queue = []
      this.pos = 0
      this.save()
    },
    nextTarget() {
      if (!this.queue || this.queue.length === 0) {
        this._fillBatch()
        this.pos = 0
        this.currentTarget = this.queue[0] || ''
        this.save()
        return
      }
      // 批次内前进；最后一个完成后刷新下一批
      if (this.pos < this.windowSize - 1) {
        this.lastTarget = this.currentTarget
        this.pos += 1
        this.currentTarget = this.queue[this.pos] || ''
      } else {
        this.lastTarget = this.currentTarget
        this._fillBatch()
        this.pos = 0
        this.currentTarget = this.queue[0] || ''
      }
      this.save()
    },
    submitKeyCode(code) {
      if (!this.currentTarget) return { correct: false }
      const codes = finalToKeyCodes.get(this.currentTarget) || new Set()
      const ok = codes.has(code)
      if (ok) this.nextTarget()
      return { correct: ok }
    },
  },
})
