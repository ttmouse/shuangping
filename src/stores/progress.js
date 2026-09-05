import { defineStore } from 'pinia'
import { useStatsStore } from './stats.js'

const STORAGE_KEY = 'sp-progress'
const STORAGE_VERSION = '1.0'

// 存储数据迁移工具
const migrateData = (data) => {
  if (!data) return null
  
  // 版本检测和迁移
  const version = data._version || '0.0'
  
  if (version === '0.0') {
    // 从旧版本迁移：添加缺失的字段
    data._version = STORAGE_VERSION
    data.lastPracticeDate = data.lastPracticeDate || null
    data.totalPracticeSessions = data.totalPracticeSessions || 0
    data.learningTimeTotal = data.learningTimeTotal || 0
    data.skillMastery = data.skillMastery || {}
  }

  // 每日目标时长从 15 分钟调整为 30 分钟
  if (data.dailyGoals && data.dailyGoals.timeTarget === 15) {
    data.dailyGoals.timeTarget = 30
  }

  return data
}

// 成就定义
const ACHIEVEMENTS = [
  // 基础里程碑成就
  {
    id: 'first-practice',
    name: '初次练习',
    description: '完成第一次双拼练习',
    icon: '🌱',
    category: 'milestone',
    rarity: 'common',
    condition: (stats) => stats.totalCharsTyped >= 1
  },
  {
    id: 'hundred-chars',
    name: '百字里程碑',
    description: '累计练习100个字符',
    icon: '📝',
    category: 'milestone',
    rarity: 'common',
    condition: (stats) => stats.totalCharsTyped >= 100
  },
  {
    id: 'five-hundred-chars',
    name: '五百字符',
    description: '累计练习500个字符',
    icon: '📄',
    category: 'milestone',
    rarity: 'common',
    condition: (stats) => stats.totalCharsTyped >= 500
  },
  {
    id: 'thousand-chars',
    name: '千字达人',
    description: '累计练习1000个字符',
    icon: '📚',
    category: 'milestone',
    rarity: 'uncommon',
    condition: (stats) => stats.totalCharsTyped >= 1000
  },
  {
    id: 'five-thousand',
    name: '五千字符',
    description: '累计练习5000个字符',
    icon: '📖',
    category: 'milestone',
    rarity: 'uncommon',
    condition: (stats) => stats.totalCharsTyped >= 5000
  },
  {
    id: 'ten-thousand',
    name: '万字大师',
    description: '累计练习10000个字符',
    icon: '🏆',
    category: 'milestone',
    rarity: 'rare',
    condition: (stats) => stats.totalCharsTyped >= 10000
  },
  {
    id: 'fifty-thousand',
    name: '五万传奇',
    description: '累计练习50000个字符',
    icon: '👑',
    category: 'milestone',
    rarity: 'epic',
    condition: (stats) => stats.totalCharsTyped >= 50000
  },
  
  // 准确率成就
  {
    id: 'accuracy-80',
    name: '入门精准',
    description: '单次练习准确率达到80%',
    icon: '🎯',
    category: 'accuracy',
    rarity: 'common',
    condition: (stats, session) => session.accuracy >= 80 && session.chars >= 20
  },
  {
    id: 'accuracy-90',
    name: '精准打击',
    description: '单次练习准确率达到90%',
    icon: '🎪',
    category: 'accuracy',
    rarity: 'uncommon',
    condition: (stats, session) => session.accuracy >= 90 && session.chars >= 30
  },
  {
    id: 'accuracy-95',
    name: '完美主义',
    description: '单次练习准确率达到95%',
    icon: '💎',
    category: 'accuracy',
    rarity: 'rare',
    condition: (stats, session) => session.accuracy >= 95 && session.chars >= 50
  },
  {
    id: 'accuracy-100',
    name: '百发百中',
    description: '单次练习100%准确率（至少30字符）',
    icon: '💯',
    category: 'accuracy',
    rarity: 'epic',
    condition: (stats, session) => session.accuracy === 100 && session.chars >= 30
  },
  
  // 速度成就
  {
    id: 'speed-30',
    name: '初出茅庐',
    description: '打字速度达到30字/分',
    icon: '🐢',
    category: 'speed',
    rarity: 'common',
    condition: (stats) => stats.averageSpeed >= 30
  },
  {
    id: 'speed-60',
    name: '快枪手',
    description: '打字速度达到60字/分',
    icon: '⚡',
    category: 'speed',
    rarity: 'uncommon',
    condition: (stats) => stats.averageSpeed >= 60
  },
  {
    id: 'speed-100',
    name: '闪电侠',
    description: '打字速度达到100字/分',
    icon: '🚀',
    category: 'speed',
    rarity: 'rare',
    condition: (stats) => stats.averageSpeed >= 100
  },
  {
    id: 'speed-150',
    name: '光速打字',
    description: '打字速度达到150字/分',
    icon: '🌟',
    category: 'speed',
    rarity: 'epic',
    condition: (stats) => stats.averageSpeed >= 150
  },
  
  // 连续练习成就
  {
    id: 'streak-3',
    name: '三日连击',
    description: '连续练习3天',
    icon: '🔥',
    category: 'streak',
    rarity: 'common',
    condition: (stats) => stats.streakDays >= 3
  },
  {
    id: 'streak-7',
    name: '一周坚持',
    description: '连续练习7天',
    icon: '🔥🔥',
    category: 'streak',
    rarity: 'uncommon',
    condition: (stats) => stats.streakDays >= 7
  },
  {
    id: 'streak-14',
    name: '双周达人',
    description: '连续练习14天',
    icon: '🔥🔥🔥',
    category: 'streak',
    rarity: 'rare',
    condition: (stats) => stats.streakDays >= 14
  },
  {
    id: 'streak-30',
    name: '月度冠军',
    description: '连续练习30天',
    icon: '👑',
    category: 'streak',
    rarity: 'epic',
    condition: (stats) => stats.streakDays >= 30
  },
  {
    id: 'streak-100',
    name: '百日筑基',
    description: '连续练习100天',
    icon: '🏅',
    category: 'streak',
    rarity: 'legendary',
    condition: (stats) => stats.streakDays >= 100
  },
  
  // 连击成就
  {
    id: 'combo-5',
    name: '五连击',
    description: '连续正确输入5次',
    icon: '✨',
    category: 'combo',
    rarity: 'common',
    condition: (stats, session) => session.maxCombo >= 5
  },
  {
    id: 'combo-10',
    name: '十连击',
    description: '连续正确输入10次',
    icon: '💫',
    category: 'combo',
    rarity: 'common',
    condition: (stats, session) => session.maxCombo >= 10
  },
  {
    id: 'combo-25',
    name: '二十五连击',
    description: '连续正确输入25次',
    icon: '🌠',
    category: 'combo',
    rarity: 'uncommon',
    condition: (stats, session) => session.maxCombo >= 25
  },
  {
    id: 'combo-50',
    name: '五十连击',
    description: '连续正确输入50次',
    icon: '🌟',
    category: 'combo',
    rarity: 'rare',
    condition: (stats, session) => session.maxCombo >= 50
  },
  {
    id: 'combo-100',
    name: '百连击',
    description: '连续正确输入100次',
    icon: '🎆',
    category: 'combo',
    rarity: 'epic',
    condition: (stats, session) => session.maxCombo >= 100
  },
  
  // 特殊成就
  {
    id: 'weak-mode-master',
    name: '错题克星',
    description: '在错题强化模式下练习100次',
    icon: '🛡️',
    category: 'special',
    rarity: 'uncommon',
    condition: (stats) => stats.weakModePractices >= 100
  },
  {
    id: 'early-bird',
    name: '早起鸟儿',
    description: '在早上6-8点完成练习',
    icon: '🐦',
    category: 'special',
    rarity: 'common',
    condition: (stats, session, meta) => {
      const hour = new Date(meta?.timestamp || Date.now()).getHours()
      return hour >= 6 && hour < 8
    }
  },
  {
    id: 'night-owl',
    name: '夜猫子',
    description: '在晚上10点后完成练习',
    icon: '🦉',
    category: 'special',
    rarity: 'common',
    condition: (stats, session, meta) => {
      const hour = new Date(meta?.timestamp || Date.now()).getHours()
      return hour >= 22 || hour < 2
    }
  },
  {
    id: 'weekend-warrior',
    name: '周末战士',
    description: '在周末完成练习',
    icon: '🎮',
    category: 'special',
    rarity: 'common',
    condition: (stats, session, meta) => {
      const day = new Date(meta?.timestamp || Date.now()).getDay()
      return day === 0 || day === 6
    }
  },
  {
    id: 'daily-goal-master',
    name: '目标达成者',
    description: '完成每日练习目标',
    icon: '📅',
    category: 'special',
    rarity: 'common',
    condition: (stats) => stats.dailyGoalsCompleted >= 1
  },
  {
    id: 'daily-goal-streak',
    name: '目标坚持者',
    description: '连续7天完成每日目标',
    icon: '📆',
    category: 'special',
    rarity: 'uncommon',
    condition: (stats) => stats.dailyGoalStreak >= 7
  },
]

export const useProgressStore = defineStore('progress', {
  state: () => ({
    // 存储版本
    _version: STORAGE_VERSION,
    // 已解锁的成就
    unlockedAchievements: [],
    // 成就解锁时间记录
    achievementUnlockTimes: {},
    // 错题强化模式练习次数
    weakModePractices: 0,
    // 当前连击数
    currentCombo: 0,
    // 最大连击数
    maxCombo: 0,
    // 会话统计（用于成就检测）
    sessionStats: {
      chars: 0,
      correct: 0,
      accuracy: 0,
      startTime: null
    },
    // 新增：学习追踪数据
    lastPracticeDate: null,        // 上次练习日期
    totalPracticeSessions: 0,      // 总练习次数
    learningTimeTotal: 0,          // 总学习时长（分钟）
    skillMastery: {},              // 技能掌握度 { skillId: { level, progress, lastPracticed } }
    dailyGoals: {                  // 每日目标（四达标：时长 + 正确率 + 错词清零 + 练习次数）
      timeTarget: 30,            // 练习时长目标（分钟）
      accuracyTarget: 95,        // 正确率目标（%）
      sessionTarget: 10,         // 练习次数目标（完成的练习会话数）
      mistakeClear: true,        // 是否要求错词清零
      completedDates: []
    },
    // 今日错词清单：{ '2026-08-25': ['词1', ...] }
    // 打错时记录、练对时移除；手动清空错题本不影响此清单（防作弊），
    // 目标「错词清零」只看这里，必须靠练对消除
    dailyWrongWords: {}
  }),

  getters: {
    // 获取所有成就定义
    allAchievements: () => ACHIEVEMENTS,

    // 获取已解锁成就列表
    unlockedList(state) {
      return ACHIEVEMENTS.filter(a => state.unlockedAchievements.includes(a.id))
    },

    // 获取未解锁成就列表
    lockedList(state) {
      return ACHIEVEMENTS.filter(a => !state.unlockedAchievements.includes(a.id))
    },

    // 获取最近解锁的成就
    recentAchievements(state) {
      return state.unlockedAchievements
        .map(id => ({
          ...ACHIEVEMENTS.find(a => a.id === id),
          unlockedAt: state.achievementUnlockTimes[id]
        }))
        .sort((a, b) => (b.unlockedAt || 0) - (a.unlockedAt || 0))
        .slice(0, 5)
    },

    // 获取连续练习天数
    // 原实现只用 lastPracticeDate（单个最近日期）回溯，昨天/前天的练习历史被覆盖后无法推断，
    // 只要今天练过就恒为 1。改为委托 stats store，基于完整的每日练习历史 dailyStats 计算。
    streakDays() {
      const stats = useStatsStore()
      return stats.streakDays
    },

    // 今日目标完成度（实时进度，供练习页目标条 / 完成弹窗 / 进度页使用）
    // 三达标：练习时长 ≥ timeTarget 分钟、正确率 ≥ accuracyTarget%、错词（卡片+英文）清零
    todayGoal(state) {
      const stats = useStatsStore()
      const today = getTodayKey()
      const ds = stats.dailyStats[today] || { chars: 0, correct: 0, time: 0 }
      const timeDone = Math.round((ds.time || 0) / 60) // 分钟（向下取整到分钟）
      const accuracy = ds.chars > 0 ? Math.round((ds.correct / ds.chars) * 100) : 100
      // 错词数：今日错词清单（打错进、练对出；手动清空不影响）
      const mistakes = (state.dailyWrongWords[today] || []).length
      const timeTarget = state.dailyGoals.timeTarget || 30
      const accuracyTarget = state.dailyGoals.accuracyTarget || 95
      const sessionTarget = state.dailyGoals.sessionTarget || 10
      const needMistakeClear = state.dailyGoals.mistakeClear !== false
      // 今日练习次数：与统计页历史记录同一数据源（sp-history 当天 session 条数），
      // 保证顶部/进度页/历史三处一致（dailyStats.sessions 可能被历史 bug 污染）
      let sessionDone = 0
      try {
        const h = JSON.parse(localStorage.getItem('sp-history') || '[]')
        sessionDone = h.filter(x => x.type === 'session' && toLocalDay(x.date) === today).length
      } catch {}
      return {
        timeTarget,
        accuracyTarget,
        sessionTarget,
        timeDone,
        accuracy,
        mistakes,
        sessionDone,
        timeDoneFlag: timeDone >= timeTarget,
        accuracyDone: accuracy >= accuracyTarget,
        sessionDoneFlag: sessionDone >= sessionTarget,
        mistakesDone: !needMistakeClear || mistakes === 0,
        allDone: timeDone >= timeTarget && accuracy >= accuracyTarget && sessionDone >= sessionTarget && (!needMistakeClear || mistakes === 0),
        timePercent: Math.min(100, Math.round((timeDone / timeTarget) * 100)),
        completedToday: state.dailyGoals.completedDates.includes(today),
      }
    },

    // 获取今日目标完成度（兼容旧调用）
    dailyGoalProgress(state) {
      const g = this.todayGoal
      return {
        charsTarget: 0,
        timeTarget: g.timeTarget,
        isCompletedToday: g.completedToday,
      }
    },

    // 新增：获取技能掌握度
    getSkillMastery: (state) => (skillId) => {
      return state.skillMastery[skillId] || { level: 0, progress: 0, lastPracticed: null }
    }
  },

  actions: {
    load() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (raw) {
          let data = JSON.parse(raw)
          // 执行数据迁移
          data = migrateData(data)
          if (data) {
            Object.assign(this.$state, data)
          }
        }
      } catch (e) {
        console.warn('Failed to load progress:', e)
      }
    },

    save() {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.$state))
      } catch (e) {
        console.warn('Failed to save progress:', e)
      }
    },

    // 新增：记录练习会话
    recordPracticeSession(durationMinutes, charsTyped) {
      this.totalPracticeSessions++
      this.learningTimeTotal += durationMinutes
      this.lastPracticeDate = getTodayKey()
      this.save()
    },

    // 新增：更新技能掌握度
    updateSkillMastery(skillId, practiceCount, accuracy) {
      if (!this.skillMastery[skillId]) {
        this.skillMastery[skillId] = { level: 0, progress: 0, lastPracticed: null }
      }
      const mastery = this.skillMastery[skillId]
      mastery.progress += practiceCount * (accuracy / 100)
      mastery.lastPracticed = Date.now()
      
      // 等级计算：每100进度升一级
      const newLevel = Math.floor(mastery.progress / 100)
      if (newLevel > mastery.level) {
        mastery.level = newLevel
      }
      this.save()
    },

    // 新增：检查并完成每日目标
    checkDailyGoal(charsTyped, timeSpent) {
      const today = getTodayKey()
      const goal = this.todayGoal
      if (goal.allDone) {
        if (!this.dailyGoals.completedDates.includes(today)) {
          this.dailyGoals.completedDates.push(today)
          this.save()
          return true // 目标完成
        }
      }
      return false
    },

    // 记录今日错词（打错时调用；手动清空错题本不调用，防止作弊）
    recordDailyWrongWord(word) {
      if (!word) return
      const today = getTodayKey()
      const list = this.dailyWrongWords[today] || []
      if (!list.includes(word)) {
        list.push(word)
        this.dailyWrongWords[today] = list
        this.save()
      }
    },
    // 今日错词练对后移除（打对自动调用）
    clearDailyWrongWord(word) {
      if (!word) return
      const today = getTodayKey()
      const list = (this.dailyWrongWords[today] || []).filter(w => w !== word)
      this.dailyWrongWords[today] = list
      this.save()
    },

    // 开始会话
    startSession() {
      this.sessionStats = {
        chars: 0,
        correct: 0,
        accuracy: 0,
        startTime: Date.now()
      }
      this.currentCombo = 0
    },

    // 结束会话
    endSession() {
      this.sessionStats = {
        chars: 0,
        correct: 0,
        accuracy: 0,
        startTime: null
      }
      this.currentCombo = 0
      this.save()
    },

    // 记录按键
    recordKeystroke(correct) {
      this.sessionStats.chars++
      if (correct) {
        this.sessionStats.correct++
        this.currentCombo++
        this.maxCombo = Math.max(this.maxCombo, this.currentCombo)
      } else {
        this.currentCombo = 0
      }
      this.sessionStats.accuracy = this.sessionStats.chars > 0
        ? Math.round((this.sessionStats.correct / this.sessionStats.chars) * 100)
        : 0
    },

    // 记录错题强化模式练习
    recordWeakModePractice() {
      this.weakModePractices++
      this.save()
    },

    // 检查并解锁成就
    checkAchievements(statsStore) {
      const newlyUnlocked = []
      const meta = { timestamp: Date.now() }

      for (const achievement of ACHIEVEMENTS) {
        if (this.unlockedAchievements.includes(achievement.id)) continue

        const stats = {
          totalCharsTyped: statsStore.totalCharsTyped,
          averageSpeed: statsStore.averageSpeed,
          streakDays: this.streakDays,
          weakModePractices: this.weakModePractices,
          dailyGoalsCompleted: this.dailyGoals.completedDates.length,
          dailyGoalStreak: this.calculateDailyGoalStreak(),
          stats: statsStore.$state
        }

        const session = {
          chars: this.sessionStats.chars,
          correct: this.sessionStats.correct,
          accuracy: this.sessionStats.accuracy,
          maxCombo: this.maxCombo
        }

        try {
          if (achievement.condition(stats, session, meta)) {
            this.unlockedAchievements.push(achievement.id)
            this.achievementUnlockTimes[achievement.id] = Date.now()
            newlyUnlocked.push(achievement)
          }
        } catch (e) {
          console.warn(`Achievement check failed for ${achievement.id}:`, e)
        }
      }

      if (newlyUnlocked.length > 0) {
        this.save()
      }

      return newlyUnlocked
    },

    // 计算每日目标连续完成天数
    calculateDailyGoalStreak() {
      if (!this.dailyGoals.completedDates.length) return 0
      
      const sorted = [...this.dailyGoals.completedDates].sort()
      let streak = 1
      
      for (let i = sorted.length - 1; i > 0; i--) {
        const current = new Date(sorted[i])
        const prev = new Date(sorted[i - 1])
        const diffDays = Math.floor((current - prev) / (1000 * 60 * 60 * 24))
        
        if (diffDays === 1) {
          streak++
        } else {
          break
        }
      }
      
      return streak
    },

    // 重置进度
    resetProgress() {
      if (typeof confirm !== 'undefined' && !confirm('确定要重置所有学习进度和成就吗？此操作不可恢复。')) return

      this.unlockedAchievements = []
      this.achievementUnlockTimes = {}
      this.weakModePractices = 0
      this.currentCombo = 0
      this.maxCombo = 0
      this.lastPracticeDate = null
      this.totalPracticeSessions = 0
      this.learningTimeTotal = 0
      this.skillMastery = {}
      this.dailyGoals.completedDates = []
      this.save()
    },

    // 新增：导出完整进度数据
    exportFullData() {
      return {
        exportDate: new Date().toISOString(),
        version: STORAGE_VERSION,
        progress: {
          unlockedAchievements: this.unlockedAchievements,
          weakModePractices: this.weakModePractices,
          maxCombo: this.maxCombo,
          totalPracticeSessions: this.totalPracticeSessions,
          learningTimeTotal: this.learningTimeTotal,
          streakDays: this.streakDays
        },
        skillMastery: this.skillMastery,
        dailyGoals: this.dailyGoals,
        achievementDetails: this.unlockedList.map(a => ({
          id: a.id,
          name: a.name,
          unlockedAt: this.achievementUnlockTimes[a.id]
        }))
      }
    },

    // 新增：导入进度数据
    importData(data) {
      try {
        if (data.unlockedAchievements) this.unlockedAchievements = data.unlockedAchievements
        if (data.achievementUnlockTimes) this.achievementUnlockTimes = data.achievementUnlockTimes
        if (data.weakModePractices) this.weakModePractices = data.weakModePractices
        if (data.maxCombo) this.maxCombo = data.maxCombo
        if (data.totalPracticeSessions) this.totalPracticeSessions = data.totalPracticeSessions
        if (data.learningTimeTotal) this.learningTimeTotal = data.learningTimeTotal
        if (data.skillMastery) this.skillMastery = data.skillMastery
        if (data.dailyGoals) this.dailyGoals = { ...this.dailyGoals, ...data.dailyGoals }
        this.save()
        return true
      } catch (e) {
        console.error('Failed to import progress data:', e)
        return false
      }
    },

  }
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

// 历史记录存的是 UTC ISO 时间，转成本地日期（YYYY-MM-DD）再判断当天
function toLocalDay(iso) {
  if (!iso) return ''
  return formatDateKey(new Date(iso))
}
