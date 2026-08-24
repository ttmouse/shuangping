import { defineStore } from 'pinia'

const STORAGE_KEY = 'sp-mistakes'

// 错题本：记录打错的词和错误次数，可当作卡片练习来源
export const useMistakesStore = defineStore('mistakes', {
  state: () => ({
    // { '词': { count, lastWrong } }
    items: {},
  }),

  getters: {
    // 错词列表，按错误次数降序（次数相同按最近出错时间降序）
    list(state) {
      return Object.entries(state.items)
        .map(([text, v]) => ({ text, count: v.count || 1, lastWrong: v.lastWrong || 0 }))
        .sort((a, b) => b.count - a.count || b.lastWrong - a.lastWrong)
    },
    // 总错词数
    totalCount(state) {
      return Object.values(state.items).reduce((sum, v) => sum + (v.count || 0), 0)
    },
  },

  actions: {
    load() {
      try {
        this.items = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
      } catch {
        this.items = {}
      }
    },
    save() {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.items))
      } catch {}
    },
    // 记录一次错词（次数 +1）
    recordWrong(text) {
      if (!text) return
      const it = this.items[text] || { count: 0, lastWrong: 0 }
      it.count++
      it.lastWrong = Date.now()
      this.items[text] = it
      this.save()
    },
    // 清空错题本
    clear() {
      this.items = {}
      this.save()
    },
  },
})
