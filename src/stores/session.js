import { defineStore } from 'pinia'
import { finalsPool, finalToKeyCodes, ranges } from '../data/xiaohe.js'
import { getNextUniform, getNextWeighted } from '../utils/scheduler.js'

const STORAGE_KEY = 'sp-session'
const ERROR_STATS_KEY = 'sp-error-stats'

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
    selectedKeyCodes: [], // 自选韵母对应的按键 codes，如 ['KeyQ','KeyP']
    lineHold: false,
    hideKeyboard: false, // 是否隐藏键盘
    // 错题强化模式
    weakMode: false,
    weakStreak: {}, // { 'iu': 3 } - 连续正确次数，用于消减权重
  }),
  getters: {
    errorStats(state) {
      try {
        const raw = localStorage.getItem(ERROR_STATS_KEY)
        return raw ? JSON.parse(raw) : {}
      } catch {
        return {}
      }
    },
    totalAttempts(state) {
      const stats = this.errorStats
      return Object.values(stats).reduce((sum, count) => sum + count, 0)
    },
    accuracy(state) {
      if (this.totalAttempts === 0) return 100
      const stats = this.errorStats
      const errors = Object.values(stats).reduce((sum, count) => sum + count, 0)
      return Math.round((1 - errors / this.totalAttempts) * 100)
    },
    weakFinals(state) {
      const stats = this.errorStats
      // 返回错误次数 > 0 的韵母，按错误次数降序
      return Object.entries(stats)
        .filter(([_, count]) => count > 0)
        .sort((a, b) => b[1] - a[1])
        .map(([final]) => final)
    },
    allowedKeyCodes(state) {
      // 自选模式：直接使用已选 codes
      if (state.rangeId === 'custom') {
        return new Set(state.selectedKeyCodes || [])
      }
      // 否则按范围
      const r = ranges.find(r => r.id === state.rangeId) || ranges[0]
      return new Set(r.keyCodes)
    },
    pool(state) {
      const allowed = this.allowedKeyCodes
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
    _loadErrorStats() {
      try {
        const raw = localStorage.getItem(ERROR_STATS_KEY)
        return raw ? JSON.parse(raw) : {}
      } catch {
        return {}
      }
    },
    _saveErrorStats(stats) {
      localStorage.setItem(ERROR_STATS_KEY, JSON.stringify(stats))
    },
    _genOne(last) {
      const pool = this.pool
      if (!pool.length) return ''
      
      // 错题强化模式：加权随机
      if (this.weakMode) {
        return getNextWeighted(pool, last, this._loadErrorStats(), this.weakStreak)
      }
      
      // 普通模式：均匀随机
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
      // 校验范围 id（允许 'custom'）
      if (this.rangeId !== 'custom' && !ranges.some(r => r.id === this.rangeId)) this.rangeId = 'all'
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
      const fallMs = 480
      if (this.pos < this.windowSize - 1) {
        this.lastTarget = this.currentTarget
        this.pos += 1
        this.currentTarget = this.queue[this.pos] || ''
        setTimeout(() => {
          const last = this.queue[this.queue.length - 1] || this.lastTarget || ''
          const n = this._genOne(last)
          this.queue = this.queue.slice(1).concat([n])
          this.pos = Math.max(0, this.pos - 1)
          this.currentTarget = this.queue[this.pos] || ''
          this.save()
        }, fallMs)
      } else {
        this.lastTarget = this.currentTarget
        this.lineHold = true
        this.pos = this.windowSize
        this.currentTarget = ''
        setTimeout(() => {
          const last = this.queue[this.queue.length - 1] || this.lastTarget || ''
          const n = this._genOne(last)
          this.queue = this.queue.slice(1).concat([n])
          this.pos = this.windowSize - 1
          this.currentTarget = this.queue[this.pos] || ''
          this.lineHold = false
          this.save()
        }, fallMs)
      }
      this.save()
    },
    submitKeyCode(code) {
      if (this.lineHold && !this.currentTarget) return { correct: false, ignore: true }
      if (!this.currentTarget) return { correct: false }
      const codes = finalToKeyCodes.get(this.currentTarget) || new Set()
      const ok = codes.has(code)
      
      if (!ok) {
        // 记录错误
        const stats = this._loadErrorStats()
        const target = this.currentTarget
        stats[target] = (stats[target] || 0) + 1
        this._saveErrorStats(stats)
      } else {
        // 正确时更新连续正确次数
        const target = this.currentTarget
        this.weakStreak[target] = (this.weakStreak[target] || 0) + 1
        // 连续正确 3 次，消减错误权重
        if (this.weakStreak[target] >= 3) {
          const stats = this._loadErrorStats()
          if (stats[target] > 0) {
            stats[target] = Math.max(0, stats[target] - 1)
            this._saveErrorStats(stats)
          }
          this.weakStreak[target] = 0
        }
      }
      
      if (ok) this.nextTarget()
      return { correct: ok }
    },
    setRange(id) {
      if (id !== 'custom' && !ranges.some(r => r.id === id)) return
      this.rangeId = id
      // 切换范围后，若已开始则刷新一整批
      if (this.started) {
        if (this.rangeId === 'custom') {
          // 自选模式不立即开始，等待用户勾选后点击开始
          this.reset()
        } else {
          this._fillBatch()
          this.pos = 0
          this.currentTarget = this.queue[0] || ''
        }
      }
      this.save()
    },
    toggleKey(code) {
      if (!code) return
      const idx = this.selectedKeyCodes.indexOf(code)
      if (idx >= 0) this.selectedKeyCodes.splice(idx, 1)
      else this.selectedKeyCodes.push(code)
      this.save()
    },
    clearSelected() {
      this.selectedKeyCodes = []
      this.save()
    },
    setHideKeyboard(value) {
      this.hideKeyboard = value
      this.save()
    },
    toggleWeakMode() {
      this.weakMode = !this.weakMode
      // 切换模式时重置连续正确计数
      this.weakStreak = {}
      this.save()
    },
    clearErrorStats() {
      this._saveErrorStats({})
      this.weakStreak = {}
      this.save()
    },
  },
})
