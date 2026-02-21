import { defineStore } from 'pinia'

const STORAGE_KEY = 'sp-progress'

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
  {
    id: 'first-practice',
    name: '初次练习',
    description: '完成第一次双拼练习',
    icon: '🌱',
    condition: (stats) => stats.totalCharsTyped >= 1
  },
  {
    id: 'hundred-chars',
    name: '百字里程碑',
    description: '累计练习100个字符',
    icon: '📝',
    condition: (stats) => stats.totalCharsTyped >= 100
  },
  {
    id: 'thousand-chars',
    name: '千字达人',
    description: '累计练习1000个字符',
    icon: '📚',
    condition: (stats) => stats.totalCharsTyped >= 1000
  },
  {
    id: 'ten-thousand',
    name: '万字大师',
    description: '累计练习10000个字符',
    icon: '🏆',
    condition: (stats) => stats.totalCharsTyped >= 10000
  },
  {
    id: 'accuracy-90',
    name: '精准打击',
    description: '单次练习准确率达到90%',
    icon: '🎯',
    condition: (stats, session) => session.accuracy >= 90 && session.chars >= 20
  },
  {
    id: 'accuracy-95',
    name: '完美主义',
    description: '单次练习准确率达到95%',
    icon: '💎',
    condition: (stats, session) => session.accuracy >= 95 && session.chars >= 50
  },
  {
    id: 'speed-60',
    name: '快枪手',
    description: '打字速度达到60字/分',
    icon: '⚡',
    condition: (stats) => stats.averageSpeed >= 60
  },
  {
    id: 'speed-100',
    name: '闪电侠',
    description: '打字速度达到100字/分',
    icon: '🚀',
    condition: (stats) => stats.averageSpeed >= 100
  },
  {
    id: 'streak-3',
    name: '三日连击',
    description: '连续练习3天',
    icon: '🔥',
    condition: (stats) => stats.streakDays >= 3
  },
  {
    id: 'streak-7',
    name: '一周坚持',
    description: '连续练习7天',
    icon: '🔥🔥',
    condition: (stats) => stats.streakDays >= 7
  },
  {
    id: 'streak-30',
    name: '月度冠军',
    description: '连续练习30天',
    icon: '👑',
    condition: (stats) => stats.stats?.streakDays >= 30
  },
  {
    id: 'weak-mode-master',
    name: '错题克星',
    description: '在错题强化模式下练习100次',
    icon: '🛡️',
    condition: (stats) => stats.weakModePractices >= 100
  },
  {
    id: 'early-bird',
    name: '早起鸟儿',
    description: '在早上6-8点完成练习',
    icon: '🐦',
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
    condition: (stats, session, meta) => {
      const hour = new Date(meta?.timestamp || Date.now()).getHours()
      return hour >= 22 || hour < 2
    }
  },
  {
    id: 'combo-10',
    name: '十连击',
    description: '连续正确输入10次',
    icon: '💫',
    condition: (stats, session) => session.maxCombo >= 10
  },
  {
    id: 'combo-50',
    name: '五十连击',
    description: '连续正确输入50次',
    icon: '🌟',
    condition: (stats, session) => session.maxCombo >= 50
  }
]

export const useProgressStore = defineStore('progress', {
  state: () => ({
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
    }
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
    },

    save() {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.$state))
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
          streakDays: statsStore.streakDays,
          weakModePractices: this.weakModePractices,
          stats: statsStore.$state
        }

        const session = {
          chars: this.sessionStats.chars,
          correct: this.sessionStats.correct,
          accuracy: this.sessionStats.accuracy,
          maxCombo: this.maxCombo
        }

        if (achievement.condition(stats, session, meta)) {
          this.unlockedAchievements.push(achievement.id)
          this.achievementUnlockTimes[achievement.id] = Date.now()
          newlyUnlocked.push(achievement)
        }
      }

      if (newlyUnlocked.length > 0) {
        this.save()
      }

      return newlyUnlocked
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
      if (!confirm('确定要重置所有学习进度和成就吗？此操作不可恢复。')) return

      this.pathProgress = {}
      this.completedStages = []
      this.unlockedAchievements = []
      this.achievementUnlockTimes = {}
      this.weakModePractices = 0
      this.currentCombo = 0
      this.maxCombo = 0
      this.save()
    },

    // 导出进度数据
    exportData() {
      return {
        exportDate: new Date().toISOString(),
        progress: {
          completedStages: this.completedStages,
          unlockedAchievements: this.unlockedAchievements,
          overallProgress: this.overallProgress,
          weakModePractices: this.weakModePractices,
          maxCombo: this.maxCombo
        },
        achievementDetails: this.unlockedList.map(a => ({
          id: a.id,
          name: a.name,
          unlockedAt: this.achievementUnlockTimes[a.id]
        }))
      }
    }
  }
})
