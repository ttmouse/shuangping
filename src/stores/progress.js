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
    data.stageAttempts = data.stageAttempts || {}
    data.skillMastery = data.skillMastery || {}
  }
  
  return data
}

// 学习路径定义
const LEARNING_PATH = [
  {
    id: 'basics',
    name: '基础入门',
    description: '掌握双拼基础按键',
    stages: [
      { id: 'row1', name: '第一排韵母', rangeId: 'row1', minAccuracy: 80, minChars: 100 },
      { id: 'row2', name: '第二排韵母', rangeId: 'row2', minAccuracy: 80, minChars: 100 },
      { id: 'row3', name: '第三排韵母', rangeId: 'row3', minAccuracy: 80, minChars: 100 },
    ]
  },
  {
    id: 'intermediate',
    name: '进阶练习',
    description: '提升速度与准确率',
    stages: [
      { id: 'all-keys', name: '全部韵母', rangeId: 'all', minAccuracy: 85, minChars: 200 },
      { id: 'nasal', name: '前后鼻音', rangeId: 'nasal', minAccuracy: 85, minChars: 150 },
    ]
  },
  {
    id: 'advanced',
    name: '高级挑战',
    description: '文字输入实战',
    stages: [
      { id: 'short-text', name: '短文练习', corpusId: 'builtin-all', minAccuracy: 90, minChars: 100 },
      { id: 'long-text', name: '长文练习', corpusId: 'builtin-row1', minAccuracy: 90, minChars: 200 },
    ]
  }
]

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
  
  // 学习路径成就
  {
    id: 'basics-complete',
    name: '基础毕业',
    description: '完成基础入门阶段',
    icon: '🎓',
    category: 'progress',
    rarity: 'uncommon',
    condition: (stats) => stats.completedPaths?.includes('basics')
  },
  {
    id: 'intermediate-complete',
    name: '进阶高手',
    description: '完成进阶练习阶段',
    icon: '🥈',
    category: 'progress',
    rarity: 'rare',
    condition: (stats) => stats.completedPaths?.includes('intermediate')
  },
  {
    id: 'advanced-complete',
    name: '双拼大师',
    description: '完成高级挑战阶段',
    icon: '🥇',
    category: 'progress',
    rarity: 'epic',
    condition: (stats) => stats.completedPaths?.includes('advanced')
  },
  {
    id: 'all-complete',
    name: '全阶段通关',
    description: '完成所有学习阶段',
    icon: '🏆',
    category: 'progress',
    rarity: 'legendary',
    condition: (stats) => stats.overallProgress >= 100
  }
]

export const useProgressStore = defineStore('progress', {
  state: () => ({
    // 存储版本
    _version: STORAGE_VERSION,
    // 学习路径进度
    pathProgress: {},
    // 已完成的学习阶段
    completedStages: [],
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
    stageAttempts: {},             // 各阶段尝试次数 { stageId: { attempts, bestAccuracy, bestSpeed } }
    skillMastery: {},              // 技能掌握度 { skillId: { level, progress, lastPracticed } }
    dailyGoals: {                  // 每日目标
      charsTarget: 500,
      timeTarget: 30,
      completedDates: []
    }
  }),

  getters: {
    // 获取学习路径
    learningPath: () => LEARNING_PATH,

    // 获取所有成就定义
    allAchievements: () => ACHIEVEMENTS,

    // 获取当前阶段
    currentStage(state) {
      for (const path of LEARNING_PATH) {
        for (const stage of path.stages) {
          if (!state.completedStages.includes(stage.id)) {
            return { ...stage, pathName: path.name, pathId: path.id }
          }
        }
      }
      return null
    },

    // 获取已完成的路径
    completedPaths(state) {
      return LEARNING_PATH.filter(path =>
        path.stages.every(stage => state.completedStages.includes(stage.id))
      ).map(p => p.id)
    },

    // 获取进度百分比
    overallProgress(state) {
      const totalStages = LEARNING_PATH.reduce((sum, p) => sum + p.stages.length, 0)
      return Math.round((state.completedStages.length / totalStages) * 100)
    },

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

    // 新增：获取今日目标完成度
    dailyGoalProgress(state) {
      return {
        charsTarget: state.dailyGoals.charsTarget,
        timeTarget: state.dailyGoals.timeTarget,
        isCompletedToday: state.dailyGoals.completedDates.includes(getTodayKey())
      }
    },

    // 新增：获取阶段统计
    getStageStats: (state) => (stageId) => {
      return state.stageAttempts[stageId] || { attempts: 0, bestAccuracy: 0, bestSpeed: 0 }
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

    // 新增：记录阶段尝试
    recordStageAttempt(stageId, accuracy, speed) {
      if (!this.stageAttempts[stageId]) {
        this.stageAttempts[stageId] = { attempts: 0, bestAccuracy: 0, bestSpeed: 0 }
      }
      const attempt = this.stageAttempts[stageId]
      attempt.attempts++
      attempt.bestAccuracy = Math.max(attempt.bestAccuracy, accuracy)
      attempt.bestSpeed = Math.max(attempt.bestSpeed, speed)
      attempt.lastAttempted = Date.now()
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
      if (charsTyped >= this.dailyGoals.charsTarget && 
          timeSpent >= this.dailyGoals.timeTarget) {
        if (!this.dailyGoals.completedDates.includes(today)) {
          this.dailyGoals.completedDates.push(today)
          this.save()
          return true // 目标完成
        }
      }
      return false
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
          completedPaths: this.completedPaths,
          overallProgress: this.overallProgress,
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

    // 检查学习阶段完成
    checkStageCompletion(rangeId, accuracy, chars) {
      for (const path of LEARNING_PATH) {
        for (const stage of path.stages) {
          if (this.completedStages.includes(stage.id)) continue

          const matchesRange = stage.rangeId === rangeId
          const matchesCorpus = stage.corpusId && rangeId?.startsWith('builtin-')

          if ((matchesRange || matchesCorpus) && accuracy >= stage.minAccuracy && chars >= stage.minChars) {
            this.completedStages.push(stage.id)
            this.save()
            return { completed: true, stage, path }
          }
        }
      }
      return { completed: false }
    },

    // 获取特定路径的进度
    getPathProgress(pathId) {
      const path = LEARNING_PATH.find(p => p.id === pathId)
      if (!path) return { completed: 0, total: 0, percentage: 0 }

      const completed = path.stages.filter(s => this.completedStages.includes(s.id)).length
      return {
        completed,
        total: path.stages.length,
        percentage: Math.round((completed / path.stages.length) * 100)
      }
    },

    // 重置进度
    resetProgress() {
      if (typeof confirm !== 'undefined' && !confirm('确定要重置所有学习进度和成就吗？此操作不可恢复。')) return

      this.pathProgress = {}
      this.completedStages = []
      this.unlockedAchievements = []
      this.achievementUnlockTimes = {}
      this.weakModePractices = 0
      this.currentCombo = 0
      this.maxCombo = 0
      this.lastPracticeDate = null
      this.totalPracticeSessions = 0
      this.learningTimeTotal = 0
      this.stageAttempts = {}
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
          completedStages: this.completedStages,
          unlockedAchievements: this.unlockedAchievements,
          overallProgress: this.overallProgress,
          weakModePractices: this.weakModePractices,
          maxCombo: this.maxCombo,
          totalPracticeSessions: this.totalPracticeSessions,
          learningTimeTotal: this.learningTimeTotal,
          streakDays: this.streakDays
        },
        stageAttempts: this.stageAttempts,
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
        if (data.completedStages) this.completedStages = data.completedStages
        if (data.unlockedAchievements) this.unlockedAchievements = data.unlockedAchievements
        if (data.achievementUnlockTimes) this.achievementUnlockTimes = data.achievementUnlockTimes
        if (data.weakModePractices) this.weakModePractices = data.weakModePractices
        if (data.maxCombo) this.maxCombo = data.maxCombo
        if (data.totalPracticeSessions) this.totalPracticeSessions = data.totalPracticeSessions
        if (data.learningTimeTotal) this.learningTimeTotal = data.learningTimeTotal
        if (data.stageAttempts) this.stageAttempts = data.stageAttempts
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
