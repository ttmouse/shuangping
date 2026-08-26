import { defineStore } from 'pinia'

const STORAGE_KEY = 'sp-stats'
const HISTORY_KEY = 'sp-history'
const DETAILED_HISTORY_KEY = 'sp-detailed-history'

// 存储版本，用于数据迁移
const STORAGE_VERSION = '2.0'

export const useStatsStore = defineStore('stats', {
  state: () => ({
    // 存储版本
    _version: STORAGE_VERSION,
    // 总体统计
    totalPracticeTime: 0, // 总练习时长（秒）
    totalCharsTyped: 0,   // 总打字字符数
    totalCorrectChars: 0, // 总正确字符数
    totalErrors: 0,       // 总错误次数
    // 每日统计 { '2024-01-15': { chars, correct, errors, time, sessions, speedSum, speedCount } }
    dailyStats: {},
    // 练习历史记录（最近100条会话记录）
    history: [],
    // 详细练习记录（用于趋势分析，最近500条）
    detailedHistory: [],
    // 按键错误热力图数据 { 'key': count }
    errorHeatmapData: {},
    // 时段统计 { 'morning': { chars, correct, time }, 'afternoon': {}, 'evening': {}, 'night': {} }
    timeSlotStats: {
      morning: { chars: 0, correct: 0, time: 0, sessions: 0 },   // 6-12点
      afternoon: { chars: 0, correct: 0, time: 0, sessions: 0 }, // 12-18点
      evening: { chars: 0, correct: 0, time: 0, sessions: 0 },   // 18-22点
      night: { chars: 0, correct: 0, time: 0, sessions: 0 },     // 22-6点
    },
    // 练习类型统计 { 'yunmu': {}, 'writer': {} }
    practiceTypeStats: {
      yunmu: { chars: 0, correct: 0, time: 0, sessions: 0 },
      writer: { chars: 0, correct: 0, time: 0, sessions: 0 },
    },
    // 当前会话
    sessionStartTime: null,
    sessionChars: 0,
    sessionCorrect: 0,
    sessionErrors: 0,
    currentPracticeType: 'writer', // 'yunmu' 或 'writer'
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
        const dayData = this.dailyStats[key] || { chars: 0, correct: 0, errors: 0, time: 0, avgSpeed: 0 }
        const avgSpeed = dayData.speedCount > 0 
          ? Math.round(dayData.speedSum / dayData.speedCount)
          : (dayData.time > 0 ? Math.round((dayData.chars / dayData.time) * 60) : 0)
        data.push({
          date: key.slice(5), // MM-DD
          fullDate: key,
          chars: dayData.chars || 0,
          accuracy: dayData.chars > 0 ? Math.round((dayData.correct / dayData.chars) * 100) : 100,
          speed: avgSpeed,
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
          const avgSpeed = dayData.speedCount > 0
            ? Math.round(dayData.speedSum / dayData.speedCount)
            : Math.round((dayData.chars / dayData.time) * 60)
          data.push({
            date: key.slice(5),
            speed: avgSpeed,
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
      const sorted = Object.entries(this.errorHeatmapData)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 20)
      return sorted
    },

    // 时段分析
    timeSlotAnalysis() {
      const result = {}
      for (const [slot, data] of Object.entries(this.timeSlotStats)) {
        const accuracy = data.chars > 0 ? Math.round((data.correct / data.chars) * 100) : 0
        const avgSpeed = data.time > 0 ? Math.round((data.chars / data.time) * 60) : 0
        result[slot] = { ...data, accuracy, avgSpeed }
      }
      return result
    },

    // 练习类型对比
    practiceTypeComparison() {
      const result = {}
      for (const [type, data] of Object.entries(this.practiceTypeStats)) {
        const accuracy = data.chars > 0 ? Math.round((data.correct / data.chars) * 100) : 0
        const avgSpeed = data.time > 0 ? Math.round((data.chars / data.time) * 60) : 0
        result[type] = { ...data, accuracy, avgSpeed }
      }
      return result
    },

    // 获取周统计
    weeklyStats() {
      const data = []
      const today = new Date()
      for (let i = 27; i >= 0; i -= 7) {
        const weekEnd = new Date(today)
        weekEnd.setDate(weekEnd.getDate() - i)
        const weekStart = new Date(weekEnd)
        weekStart.setDate(weekStart.getDate() - 6)
        
        let weekChars = 0
        let weekCorrect = 0
        let weekTime = 0
        let weekSessions = 0
        
        for (let j = 0; j < 7; j++) {
          const date = new Date(weekStart)
          date.setDate(date.getDate() + j)
          const key = formatDateKey(date)
          const dayData = this.dailyStats[key]
          if (dayData) {
            weekChars += dayData.chars || 0
            weekCorrect += dayData.correct || 0
            weekTime += dayData.time || 0
            weekSessions += dayData.sessions || 0
          }
        }
        
        data.push({
          weekStart: formatDateKey(weekStart),
          weekEnd: formatDateKey(weekEnd),
          chars: weekChars,
          accuracy: weekChars > 0 ? Math.round((weekCorrect / weekChars) * 100) : 0,
          speed: weekTime > 0 ? Math.round((weekChars / weekTime) * 60) : 0,
          sessions: weekSessions,
        })
      }
      return data
    },

    // 最佳表现日
    bestDay() {
      let best = null
      let bestScore = 0
      for (const [date, data] of Object.entries(this.dailyStats)) {
        const speed = data.time > 0 ? Math.round((data.chars / data.time) * 60) : 0
        const accuracy = data.chars > 0 ? Math.round((data.correct / data.data?.chars || 1) * 100) : 0
        const score = speed * accuracy
        if (score > bestScore) {
          bestScore = score
          best = { date, ...data, speed, accuracy }
        }
      }
      return best
    },

    // 获取最近N天的详细记录
    recentDetailedHistory: (state) => (count = 50) => {
      return state.detailedHistory.slice(-count).reverse()
    },

    // 获取特定日期范围的统计
    dateRangeStats: (state) => (startDate, endDate) => {
      const result = { chars: 0, correct: 0, errors: 0, time: 0, sessions: 0 }
      const start = new Date(startDate)
      const end = new Date(endDate)
      
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const key = formatDateKey(d)
        const dayData = state.dailyStats[key]
        if (dayData) {
          result.chars += dayData.chars || 0
          result.correct += dayData.correct || 0
          result.errors += dayData.errors || 0
          result.time += dayData.time || 0
          result.sessions += dayData.sessions || 0
        }
      }
      
      result.accuracy = result.chars > 0 ? Math.round((result.correct / result.chars) * 100) : 0
      result.speed = result.time > 0 ? Math.round((result.chars / result.time) * 60) : 0
      return result
    },
  },

  actions: {
    load() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (raw) {
          const data = JSON.parse(raw)
          // 版本检查和数据迁移
          if (!data._version) {
            this.migrateFromV1(data)
          }
          Object.assign(this.$state, data)
        }
      } catch (e) {
        console.warn('Failed to load stats:', e)
      }
      try {
        const rawHistory = localStorage.getItem(HISTORY_KEY)
        if (rawHistory) {
          this.history = JSON.parse(rawHistory)
          // 清理历史遗留的按键级记录（旧版本把每键记录混入 history，只保留会话记录）
          if (this.history.some(h => h.type !== 'session')) {
            this.history = this.history.filter(h => h.type === 'session')
            // 写回干净数据（防止每次加载都重复清理脏数据）
            localStorage.setItem(HISTORY_KEY, JSON.stringify(this.history.slice(-100)))
          }
        }
      } catch {}
      try {
        const rawDetailed = localStorage.getItem(DETAILED_HISTORY_KEY)
        if (rawDetailed) {
          this.detailedHistory = JSON.parse(rawDetailed)
        }
      } catch {}
    },

    save() {
      const { history, detailedHistory, ...stats } = this.$state
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stats))
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(-100)))
      localStorage.setItem(DETAILED_HISTORY_KEY, JSON.stringify(detailedHistory.slice(-500)))
    },

    // 从V1迁移数据
    migrateFromV1(data) {
      data._version = STORAGE_VERSION
      data.detailedHistory = []
      data.errorHeatmapData = {}
      data.timeSlotStats = {
        morning: { chars: 0, correct: 0, time: 0, sessions: 0 },
        afternoon: { chars: 0, correct: 0, time: 0, sessions: 0 },
        evening: { chars: 0, correct: 0, time: 0, sessions: 0 },
        night: { chars: 0, correct: 0, time: 0, sessions: 0 },
      }
      data.practiceTypeStats = {
        yunmu: { chars: 0, correct: 0, time: 0, sessions: 0 },
        writer: { chars: 0, correct: 0, time: 0, sessions: 0 },
      }
    },

    // 开始练习会话
    startSession(practiceType = 'writer') {
      this.sessionStartTime = Date.now()
      this.sessionChars = 0
      this.sessionCorrect = 0
      this.sessionErrors = 0
      this.currentPracticeType = practiceType
    },

    // 结束练习会话
    endSession() {
      if (!this.sessionStartTime) return

      const duration = Math.floor((Date.now() - this.sessionStartTime) / 1000)
      // 空会话（没输入任何字符，如误触开始立即退出）不记录
      if (this.sessionChars === 0) {
        this.sessionStartTime = null
        return
      }
      const today = getTodayKey()
      const sessionSpeed = duration > 0 ? Math.round((this.sessionChars / duration) * 60) : 0

      // 更新每日统计
      if (!this.dailyStats[today]) {
        this.dailyStats[today] = { chars: 0, correct: 0, errors: 0, time: 0, sessions: 0, speedSum: 0, speedCount: 0 }
      }
      this.dailyStats[today].chars += this.sessionChars
      this.dailyStats[today].correct += this.sessionCorrect
      this.dailyStats[today].errors += this.sessionErrors
      this.dailyStats[today].time += duration
      this.dailyStats[today].sessions += 1
      this.dailyStats[today].speedSum = (this.dailyStats[today].speedSum || 0) + sessionSpeed
      this.dailyStats[today].speedCount = (this.dailyStats[today].speedCount || 0) + 1

      // 更新总体统计
      this.totalPracticeTime += duration
      this.totalCharsTyped += this.sessionChars
      this.totalCorrectChars += this.sessionCorrect
      this.totalErrors += this.sessionErrors

      // 更新时段统计
      this.updateTimeSlotStats(duration)

      // 更新练习类型统计
      if (this.practiceTypeStats[this.currentPracticeType]) {
        const typeStats = this.practiceTypeStats[this.currentPracticeType]
        typeStats.chars += this.sessionChars
        typeStats.correct += this.sessionCorrect
        typeStats.time += duration
        typeStats.sessions += 1
      }

      // 添加到历史记录
      const sessionRecord = {
        id: Date.now(),
        date: new Date().toISOString(),
        type: 'session',
        practiceType: this.currentPracticeType,
        chars: this.sessionChars,
        correct: this.sessionCorrect,
        errors: this.sessionErrors,
        duration,
        speed: sessionSpeed,
      }
      this.history.push(sessionRecord)

      // 添加到详细历史
      this.detailedHistory.push({
        ...sessionRecord,
        timestamp: Date.now(),
      })

      // 清理旧历史：优先保留当天的会话记录（保证「历史当天次数」与目标/统计一致），
      // 当天不足 100 条时再挤出最早的非当天记录（日期按本地时间判断）
      if (this.history.length > 100) {
        const todayStr = formatDateKey(new Date()) // YYYY-MM-DD（本地）
        const sessions = this.history.filter(h => h.type === 'session')
        const todaySessions = sessions.filter(s => formatDateKey(new Date(s.date)) === todayStr)
        const others = this.history.filter(h => !(h.type === 'session' && formatDateKey(new Date(h.date)) === todayStr))
        this.history = [...todaySessions, ...others].slice(-100)
      }
      if (this.detailedHistory.length > 500) {
        this.detailedHistory = this.detailedHistory.slice(-500)
      }

      this.sessionStartTime = null
      this.save()
    },

    // 更新时段统计
    updateTimeSlotStats(duration) {
      const hour = new Date().getHours()
      let slot = 'night'
      if (hour >= 6 && hour < 12) slot = 'morning'
      else if (hour >= 12 && hour < 18) slot = 'afternoon'
      else if (hour >= 18 && hour < 22) slot = 'evening'

      if (this.timeSlotStats[slot]) {
        this.timeSlotStats[slot].chars += this.sessionChars
        this.timeSlotStats[slot].correct += this.sessionCorrect
        this.timeSlotStats[slot].time += duration
        this.timeSlotStats[slot].sessions += 1
      }
    },

    // 记录单次按键
    recordKeystroke(expected, actual, correct, type = 'char') {
      this.sessionChars++
      if (correct) {
        this.sessionCorrect++
      } else {
        this.sessionErrors++
        // 记录错误热力图
        if (expected) {
          this.errorHeatmapData[expected] = (this.errorHeatmapData[expected] || 0) + 1
        }
      }
      // 按键级明细不再写入 history：
      // 该数组保留会话记录（type='session'，统计页/导出只用它），
      // 按键记录（每键一条）会瞬间挤爆 100 条上限，把会话记录顶掉
    },

    // 记录韵母练习
    recordFinalPractice(final, correct) {
      this.recordKeystroke(final, null, correct, 'final')
    },

    // 记录文字练习
    recordCharPractice(char, correct) {
      this.recordKeystroke(char, null, correct, 'char')
    },

    // 记录易错键（统一按键位代码记录，如 'KeyJ'；显示时去掉前缀）
    recordErrorKey(keyCode) {
      if (!keyCode) return
      this.errorHeatmapData[keyCode] = (this.errorHeatmapData[keyCode] || 0) + 1
    },

    // 清除所有统计数据
    clearAllStats() {
      if (typeof confirm !== 'undefined' && !confirm('确定要清除所有练习统计数据吗？此操作不可恢复。')) return

      this.totalPracticeTime = 0
      this.totalCharsTyped = 0
      this.totalCorrectChars = 0
      this.totalErrors = 0
      this.dailyStats = {}
      this.history = []
      this.detailedHistory = []
      this.errorHeatmapData = {}
      this.timeSlotStats = {
        morning: { chars: 0, correct: 0, time: 0, sessions: 0 },
        afternoon: { chars: 0, correct: 0, time: 0, sessions: 0 },
        evening: { chars: 0, correct: 0, time: 0, sessions: 0 },
        night: { chars: 0, correct: 0, time: 0, sessions: 0 },
      }
      this.practiceTypeStats = {
        yunmu: { chars: 0, correct: 0, time: 0, sessions: 0 },
        writer: { chars: 0, correct: 0, time: 0, sessions: 0 },
      }
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
        version: STORAGE_VERSION,
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
        timeSlotStats: this.timeSlotStats,
        practiceTypeStats: this.practiceTypeStats,
        errorHeatmap: this.errorHeatmapData,
        history: this.history,
        detailedHistory: this.detailedHistory,
      }
      return JSON.stringify(data, null, 2)
    },

    // 导出为 CSV
    exportCSV() {
      const headers = ['日期', '练习字符数', '正确数', '错误数', '准确率(%)', '速度(字/分)', '练习时长(秒)', '场次']
      const rows = Object.entries(this.dailyStats).map(([date, data]) => [
        date,
        data.chars,
        data.correct,
        data.errors,
        data.chars > 0 ? Math.round((data.correct / data.chars) * 100) : 100,
        data.time > 0 ? Math.round((data.chars / data.time) * 60) : 0,
        data.time,
        data.sessions || 0,
      ])
      rows.sort((a, b) => a[0].localeCompare(b[0]))

      const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
      return csv
    },

    // 导出详细历史为 CSV
    exportDetailedCSV() {
      const headers = ['时间', '类型', '练习模式', '字符数', '正确数', '错误数', '准确率(%)', '速度(字/分)', '时长(秒)']
      const rows = this.history
        .filter(h => h.type === 'session')
        .map(h => [
          h.date,
          h.type,
          h.practiceType || 'writer',
          h.chars,
          h.correct,
          h.errors,
          h.chars > 0 ? Math.round((h.correct / h.chars) * 100) : 100,
          h.speed,
          h.duration,
        ])
      rows.sort((a, b) => a[0].localeCompare(b[0]))

      return [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
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

    // 获取指定日期范围的详细记录
    getHistoryByDateRange(startDate, endDate) {
      const start = new Date(startDate).getTime()
      const end = new Date(endDate).getTime()
      return this.detailedHistory.filter(h => {
        const t = new Date(h.date).getTime()
        return t >= start && t <= end
      })
    },

    // 获取最近N天的统计摘要
    getRecentSummary(days = 7) {
      const end = new Date()
      const start = new Date()
      start.setDate(start.getDate() - days + 1)
      return this.dateRangeStats(formatDateKey(start), formatDateKey(end))
    },

    // 计算进步趋势（与上周对比）
    getWeeklyProgress() {
      const today = new Date()
      const thisWeekStart = new Date(today)
      thisWeekStart.setDate(thisWeekStart.getDate() - 6)
      const lastWeekStart = new Date(thisWeekStart)
      lastWeekStart.setDate(lastWeekStart.getDate() - 7)
      const lastWeekEnd = new Date(thisWeekStart)
      lastWeekEnd.setDate(lastWeekEnd.getDate() - 1)

      const thisWeek = this.dateRangeStats(formatDateKey(thisWeekStart), formatDateKey(today))
      const lastWeek = this.dateRangeStats(formatDateKey(lastWeekStart), formatDateKey(lastWeekEnd))

      return {
        thisWeek,
        lastWeek,
        speedChange: lastWeek.speed > 0 ? Math.round(((thisWeek.speed - lastWeek.speed) / lastWeek.speed) * 100) : 0,
        accuracyChange: lastWeek.accuracy > 0 ? Math.round(((thisWeek.accuracy - lastWeek.accuracy) / lastWeek.accuracy) * 100) : 0,
        charsChange: lastWeek.chars > 0 ? Math.round(((thisWeek.chars - lastWeek.chars) / lastWeek.chars) * 100) : 0,
      }
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
