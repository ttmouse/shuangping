import { defineStore } from 'pinia'

const STORAGE_KEY = 'sp-stats'
const HISTORY_KEY = 'sp-history'

export const useStatsStore = defineStore('stats', {
  state: () => ({
    // 总体统计
    totalPracticeTime: 0, // 总练习时长（秒）
    totalCharsTyped: 0,   // 总打字字符数
    totalCorrectChars: 0, // 总正确字符数
    totalErrors: 0,       // 总错误次数
    // 每日统计 { '2024-01-15': { chars, correct, errors, time, sessions } }
    dailyStats: {},
    // 练习历史记录（最近100条）
    history: [],
    // 当前会话
    sessionStartTime: null,
    sessionChars: 0,
    sessionCorrect: 0,
    sessionErrors: 0,
  }),

  getters: {
    // 平均速度（字符/分钟）
    averageSpeed() {
      if (this.totalPracticeTime === 0) return 0
      return Math.round((this.totalCharsTyped / this.totalPracticeTime) * 60)
    },

    // 总体准确率
    overallAccuracy() {
      if (this.totalCharsTyped === 0) return 100
      return Math.round((this.totalCorrectChars / this.totalCharsTyped) * 100)
    },

    // 今日统计
    todayStats() {
      const today = getTodayKey()
      return this.dailyStats[today] || { chars: 0, correct: 0, errors: 0, time: 0, sessions: 0 }
    },

    // 连续练习天数
    streakDays() {
      let streak = 0
      const today = new Date()
      for (let i = 0; i < 365; i++) {
        const date = new Date(today)
        date.setDate(date.getDate() - i)
        const key = formatDateKey(date)
        if (this.dailyStats[key] && this.dailyStats[key].chars > 0) {
          streak++
        } else if (i > 0) {
          break
        }
      }
      return streak
    },

    // 最近7天数据（用于图表）
    last7DaysData() {
      const data = []
      const today = new Date()
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today)
        date.setDate(date.getDate() - i)
        const key = formatDateKey(date)
        const dayData = this.dailyStats[key] || { chars: 0, correct: 0, errors: 0, time: 0 }
        data.push({
          date: key.slice(5), // MM-DD
          fullDate: key,
          chars: dayData.chars || 0,
          accuracy: dayData.chars > 0 ? Math.round((dayData.correct / dayData.chars) * 100) : 100,
          speed: dayData.time > 0 ? Math.round((dayData.chars / dayData.time) * 60) : 0,
        })
      }
      return data
    },

    // 速度趋势数据（最近30天）
    speedTrend() {
      const data = []
      const today = new Date()
      for (let i = 29; i >= 0; i--) {
        const date = new Date(today)
        date.setDate(date.getDate() - i)
        const key = formatDateKey(date)
        const dayData = this.dailyStats[key]
        if (dayData && dayData.time > 0) {
          data.push({
            date: key.slice(5),
            speed: Math.round((dayData.chars / dayData.time) * 60),
          })
        }
      }
      return data
    },

    // 准确率趋势数据（最近30天）
    accuracyTrend() {
      const data = []
      const today = new Date()
      for (let i = 29; i >= 0; i--) {
        const date = new Date(today)
        date.setDate(date.getDate() - i)
        const key = formatDateKey(date)
        const dayData = this.dailyStats[key]
        if (dayData && dayData.chars > 0) {
          data.push({
            date: key.slice(5),
            accuracy: Math.round((dayData.correct / dayData.chars) * 100),
          })
        }
      }
      return data
    },

    // 易错键统计（用于热力图）
    errorHeatmap() {
      const errors = {}
      this.history.forEach(h => {
        if (h.type === 'char' && !h.correct) {
          const key = h.expected || 'unknown'
          errors[key] = (errors[key] || 0) + 1
        }
      })
      return Object.entries(errors)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 20)
    },
  },

  actions: {
    load() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (raw) {
          const data = JSON.parse(raw)
          Object.assign(this.$state, data)
        }
      } catch {}
      try {
        const rawHistory = localStorage.getItem(HISTORY_KEY)
        if (rawHistory) {
          this.history = JSON.parse(rawHistory)
        }
      } catch {}
    },

    save() {
      const { history, ...stats } = this.$state
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stats))
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(-100)))
    },

    // 开始练习会话
    startSession() {
      this.sessionStartTime = Date.now()
      this.sessionChars = 0
      this.sessionCorrect = 0
      this.sessionErrors = 0
    },

    // 结束练习会话
    endSession() {
      if (!this.sessionStartTime) return

      const duration = Math.floor((Date.now() - this.sessionStartTime) / 1000)
      const today = getTodayKey()

      // 更新每日统计
      if (!this.dailyStats[today]) {
        this.dailyStats[today] = { chars: 0, correct: 0, errors: 0, time: 0, sessions: 0 }
      }
      this.dailyStats[today].chars += this.sessionChars
      this.dailyStats[today].correct += this.sessionCorrect
      this.dailyStats[today].errors += this.sessionErrors
      this.dailyStats[today].time += duration
      this.dailyStats[today].sessions += 1

      // 更新总体统计
      this.totalPracticeTime += duration
      this.totalCharsTyped += this.sessionChars
      this.totalCorrectChars += this.sessionCorrect
      this.totalErrors += this.sessionErrors

      // 添加到历史记录
      this.history.push({
        id: Date.now(),
        date: new Date().toISOString(),
        type: 'session',
        chars: this.sessionChars,
        correct: this.sessionCorrect,
        errors: this.sessionErrors,
        duration,
        speed: duration > 0 ? Math.round((this.sessionChars / duration) * 60) : 0,
      })

      // 清理旧历史
      if (this.history.length > 100) {
        this.history = this.history.slice(-100)
      }

      this.sessionStartTime = null
      this.save()
    },

    // 记录单次按键
    recordKeystroke(expected, actual, correct, type = 'char') {
      this.sessionChars++
      if (correct) {
        this.sessionCorrect++
      } else {
        this.sessionErrors++
      }

      // 记录到历史
      this.history.push({
        id: Date.now(),
        date: new Date().toISOString(),
        type,
        expected,
        actual,
        correct,
      })

      // 限制历史长度
      if (this.history.length > 100) {
        this.history = this.history.slice(-100)
      }
    },

    // 记录韵母练习
    recordFinalPractice(final, correct) {
      this.recordKeystroke(final, null, correct, 'final')
    },

    // 记录文字练习
    recordCharPractice(char, correct) {
      this.recordKeystroke(char, null, correct, 'char')
    },

    // 清除所有统计数据
    clearAllStats() {
      if (!confirm('确定要清除所有练习统计数据吗？此操作不可恢复。')) return

      this.totalPracticeTime = 0
      this.totalCharsTyped = 0
      this.totalCorrectChars = 0
      this.totalErrors = 0
      this.dailyStats = {}
      this.history = []
      this.sessionStartTime = null
      this.sessionChars = 0
      this.sessionCorrect = 0
      this.sessionErrors = 0
      this.save()
    },

    // 导出数据为 JSON
    exportData() {
      const data = {
        exportDate: new Date().toISOString(),
        stats: {
          totalPracticeTime: this.totalPracticeTime,
          totalCharsTyped: this.totalCharsTyped,
          totalCorrectChars: this.totalCorrectChars,
          totalErrors: this.totalErrors,
          averageSpeed: this.averageSpeed,
          overallAccuracy: this.overallAccuracy,
          streakDays: this.streakDays,
        },
        dailyStats: this.dailyStats,
        history: this.history,
      }
      return JSON.stringify(data, null, 2)
    },

    // 导出为 CSV
    exportCSV() {
      const headers = ['日期', '练习字符数', '正确数', '错误数', '准确率(%)', '速度(字/分)', '练习时长(秒)']
      const rows = Object.entries(this.dailyStats).map(([date, data]) => [
        date,
        data.chars,
        data.correct,
        data.errors,
        data.chars > 0 ? Math.round((data.correct / data.chars) * 100) : 100,
        data.time > 0 ? Math.round((data.chars / data.time) * 60) : 0,
        data.time,
      ])
      rows.sort((a, b) => a[0].localeCompare(b[0]))

      const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
      return csv
    },

    // 下载文件
    downloadFile(content, filename, type) {
      const blob = new Blob([content], { type })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    },
  },
})

// 辅助函数
function getTodayKey() {
  return formatDateKey(new Date())
}

function formatDateKey(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
