import { defineStore } from 'pinia'

const STORAGE_KEY = 'sp-leaderboard'
const USER_ID_KEY = 'sp-user-id'
const USER_NAME_KEY = 'sp-username'

// 生成唯一用户ID
function generateUserId() {
  return 'user_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now()
}

// 获取或创建用户ID
function getUserId() {
  let userId = localStorage.getItem(USER_ID_KEY)
  if (!userId) {
    userId = generateUserId()
    localStorage.setItem(USER_ID_KEY, userId)
  }
  return userId
}

// 模拟其他用户数据
const MOCK_USERS = [
  { id: 'mock_1', name: '打字小能手', avatar: '⚡' },
  { id: 'mock_2', name: '双拼达人', avatar: '🎯' },
  { id: 'mock_3', name: '键盘侠', avatar: '⌨️' },
  { id: 'mock_4', name: '速度之王', avatar: '🚀' },
  { id: 'mock_5', name: '准确率100', avatar: '💯' },
  { id: 'mock_6', name: '练习狂魔', avatar: '🔥' },
  { id: 'mock_7', name: '新手小白', avatar: '🌱' },
  { id: 'mock_8', name: '进步神速', avatar: '📈' },
]

// 生成模拟排行榜数据
function generateMockLeaderboard() {
  const now = Date.now()
  const oneDay = 24 * 60 * 60 * 1000

  return MOCK_USERS.map((user, index) => ({
    ...user,
    accuracy: Math.floor(85 + Math.random() * 14), // 85-99%
    speed: Math.floor(40 + Math.random() * 80), // 40-120 字/分
    totalChars: Math.floor(1000 + Math.random() * 50000),
    streakDays: Math.floor(Math.random() * 30),
    lastPractice: now - Math.floor(Math.random() * 7 * oneDay),
    score: Math.floor(1000 + Math.random() * 9000),
  })).sort((a, b) => b.score - a.score)
}

export const useLeaderboardStore = defineStore('leaderboard', {
  state: () => ({
    // 当前用户数据
    userId: '',
    userName: '',
    userAvatar: '🎯',

    // 排行榜数据
    dailyRanking: [],
    weeklyRanking: [],
    allTimeRanking: [],

    // 挑战相关
    activeChallenges: [],
    challengeHistory: [],

    // 加载状态
    isLoading: false,
    lastUpdate: null,
  }),

  getters: {
    // 获取当前用户排名
    myDailyRank() {
      const index = this.dailyRanking.findIndex(u => u.id === this.userId)
      return index >= 0 ? index + 1 : null
    },

    myWeeklyRank() {
      const index = this.weeklyRanking.findIndex(u => u.id === this.userId)
      return index >= 0 ? index + 1 : null
    },

    myAllTimeRank() {
      const index = this.allTimeRanking.findIndex(u => u.id === this.userId)
      return index >= 0 ? index + 1 : null
    },

    // 获取当前用户数据
    myStats() {
      return this.allTimeRanking.find(u => u.id === this.userId) || null
    },

    // 获取前N名
    topDaily() {
      return this.dailyRanking.slice(0, 10)
    },

    topWeekly() {
      return this.weeklyRanking.slice(0, 10)
    },

    topAllTime() {
      return this.allTimeRanking.slice(0, 10)
    },

    // 获取附近排名（当前用户前后各2名）
    nearbyDaily() {
      return this.getNearbyRanks(this.dailyRanking, this.myDailyRank)
    },

    nearbyWeekly() {
      return this.getNearbyRanks(this.weeklyRanking, this.myWeeklyRank)
    },

    // 活跃挑战
    pendingChallenges() {
      return this.activeChallenges.filter(c => c.status === 'pending')
    },

    activeChallengeList() {
      return this.activeChallenges.filter(c => c.status === 'active')
    },
  },

  actions: {
    // 初始化
    init() {
      this.userId = getUserId()
      this.userName = localStorage.getItem(USER_NAME_KEY) || '双拼练习者'
      this.load()
      this.generateRankings()
    },

    load() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (raw) {
          const data = JSON.parse(raw)
          this.activeChallenges = data.activeChallenges || []
          this.challengeHistory = data.challengeHistory || []
          this.lastUpdate = data.lastUpdate || null
        }
      } catch {}
    },

    save() {
      const data = {
        activeChallenges: this.activeChallenges,
        challengeHistory: this.challengeHistory,
        lastUpdate: Date.now(),
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    },

    // 设置用户名
    setUserName(name) {
      this.userName = name
      localStorage.setItem(USER_NAME_KEY, name)
    },

    setUserAvatar(avatar) {
      this.userAvatar = avatar
      localStorage.setItem('sp-avatar', avatar)
    },

    // 生成排行榜数据
    generateRankings() {
      this.isLoading = true

      // 生成模拟数据
      const mockData = generateMockLeaderboard()

      // 添加当前用户到排行榜
      const myStats = this.getMyCurrentStats()

      this.dailyRanking = [...mockData, myStats]
        .sort((a, b) => b.score - a.score)
        .map((u, i) => ({ ...u, rank: i + 1 }))

      this.weeklyRanking = [...mockData, myStats]
        .sort((a, b) => b.totalChars - a.totalChars)
        .map((u, i) => ({ ...u, rank: i + 1 }))

      this.allTimeRanking = [...mockData, myStats]
        .sort((a, b) => b.speed - a.speed)
        .map((u, i) => ({ ...u, rank: i + 1 }))

      this.isLoading = false
      this.lastUpdate = Date.now()
    },

    // 获取当前用户统计
    getMyCurrentStats() {
      // 从 stats store 获取数据
      const statsRaw = localStorage.getItem('sp-stats')
      let stats = { totalCharsTyped: 0, averageSpeed: 0, overallAccuracy: 0, streakDays: 0 }

      try {
        if (statsRaw) {
          const parsed = JSON.parse(statsRaw)
          stats = { ...stats, ...parsed }
        }
      } catch {}

      // 计算综合得分
      const score = Math.floor(
        stats.totalCharsTyped * 0.1 +
        stats.averageSpeed * 50 +
        stats.overallAccuracy * 10 +
        stats.streakDays * 100
      )

      return {
        id: this.userId,
        name: this.userName,
        avatar: this.userAvatar,
        accuracy: stats.overallAccuracy || 0,
        speed: stats.averageSpeed || 0,
        totalChars: stats.totalCharsTyped || 0,
        streakDays: stats.streakDays || 0,
        lastPractice: Date.now(),
        score: score,
        isMe: true,
      }
    },

    // 更新用户数据到排行榜
    updateMyStats() {
      const myStats = this.getMyCurrentStats()

      // 更新各榜单
      const updateRanking = (ranking) => {
        const index = ranking.findIndex(u => u.id === this.userId)
        if (index >= 0) {
          ranking[index] = { ...ranking[index], ...myStats }
        } else {
          ranking.push(myStats)
        }
        // 重新排序
        ranking.sort((a, b) => b.score - a.score)
        return ranking.map((u, i) => ({ ...u, rank: i + 1 }))
      }

      this.dailyRanking = updateRanking([...this.dailyRanking.filter(u => u.id !== this.userId)])
      this.weeklyRanking = updateRanking([...this.weeklyRanking.filter(u => u.id !== this.userId)])
      this.allTimeRanking = updateRanking([...this.allTimeRanking.filter(u => u.id !== this.userId)])
    },

    // 获取附近排名
    getNearbyRanks(ranking, myRank) {
      if (!myRank) return ranking.slice(0, 5)

      const start = Math.max(0, myRank - 3)
      const end = Math.min(ranking.length, myRank + 2)
      return ranking.slice(start, end)
    },

    // 创建挑战
    createChallenge(type, target, duration = 7) {
      const challenge = {
        id: 'challenge_' + Date.now(),
        type, // 'accuracy', 'speed', 'streak', 'chars'
        target,
        duration, // 天数
        createdAt: Date.now(),
        status: 'active',
        progress: 0,
        completed: false,
      }

      this.activeChallenges.push(challenge)
      this.save()
      return challenge
    },

    // 更新挑战进度
    updateChallengeProgress(challengeId, progress) {
      const challenge = this.activeChallenges.find(c => c.id === challengeId)
      if (!challenge) return

      challenge.progress = progress

      if (progress >= challenge.target) {
        challenge.completed = true
        challenge.status = 'completed'
        challenge.completedAt = Date.now()

        // 移到历史记录
        this.challengeHistory.push({ ...challenge })
        this.activeChallenges = this.activeChallenges.filter(c => c.id !== challengeId)
      }

      this.save()
    },

    // 检查并更新挑战
    checkChallenges(statsStore) {
      const challengesToCheck = this.activeChallenges.filter(c => c.status === 'active')

      challengesToCheck.forEach(challenge => {
        let progress = 0

        switch (challenge.type) {
          case 'accuracy':
            progress = statsStore.overallAccuracy
            break
          case 'speed':
            progress = statsStore.averageSpeed
            break
          case 'streak':
            progress = statsStore.streakDays
            break
          case 'chars':
            progress = statsStore.totalCharsTyped
            break
        }

        this.updateChallengeProgress(challenge.id, progress)
      })
    },

    // 放弃挑战
    abandonChallenge(challengeId) {
      const challenge = this.activeChallenges.find(c => c.id === challengeId)
      if (challenge) {
        challenge.status = 'abandoned'
        this.challengeHistory.push({ ...challenge })
        this.activeChallenges = this.activeChallenges.filter(c => c.id !== challengeId)
        this.save()
      }
    },

    // 生成分享挑战链接
    generateChallengeLink(challenge) {
      const data = btoa(JSON.stringify({
        type: challenge.type,
        target: challenge.target,
        from: this.userName,
      }))
      return `${window.location.origin}/?challenge=${data}`
    },

    // 解析挑战链接
    parseChallengeLink(link) {
      try {
        const url = new URL(link)
        const challengeData = url.searchParams.get('challenge')
        if (challengeData) {
          return JSON.parse(atob(challengeData))
        }
      } catch {}
      return null
    },

    // 接受挑战
    acceptChallenge(challengeData) {
      return this.createChallenge(challengeData.type, challengeData.target)
    },
  },
})
