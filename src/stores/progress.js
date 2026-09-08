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

  // ===== 扩充：荣誉系统字段默认值（任何版本缺失时补全） =====
  data.xp = data.xp || 0
  data.maxSessionSpeed = data.maxSessionSpeed || 0
  data.firstPracticeDate = data.firstPracticeDate || null
  data.wrongWordsCleared = data.wrongWordsCleared || 0
  data.clearStreakDays = data.clearStreakDays || 0
  data.lastClearDate = data.lastClearDate || null
  // ===== 扩充2：自定义称号 / 收藏 / 任务 =====
  data.customTitle = data.customTitle || ''
  data.pinnedAchievements = data.pinnedAchievements || []
  data.taskState = data.taskState || { date: '', daily: {}, weekStart: '', weekly: {} }

  // 每日目标时长从 15 分钟调整为 30 分钟
  if (data.dailyGoals && data.dailyGoals.timeTarget === 15) {
    data.dailyGoals.timeTarget = 30
  }

  return data
}

// 等级经验阈值（累计 XP）：Lv.N 所需经验
const LEVEL_XP = [0, 100, 250, 450, 700, 1000, 1350, 1750, 2200, 2700, 3250, 3850, 4500, 5200, 5950, 6750]
const MAX_LEVEL = LEVEL_XP.length

function levelFromXp(xp) {
  for (let i = MAX_LEVEL - 1; i >= 0; i--) {
    if (xp >= LEVEL_XP[i]) return i + 1
  }
  return 1
}

// 每日任务定义（进度来自今日目标：时长 / 次数 / 错词清零）
const DAILY_TASKS = [
  { id: 'daily-time', name: '专注一刻', desc: '今日练习满 15 分钟', target: 15, unit: '分钟', xp: 20 },
  { id: 'daily-sessions', name: '勤学不辍', desc: '今日完成 5 次练习', target: 5, unit: '次', xp: 15 },
  { id: 'daily-clear', name: '错词清零', desc: '今日错词全部清零', target: 1, unit: '天', xp: 15 }
]

// 每周任务定义（进度来自本周统计：时长 / 完成目标天数 / 解锁成就数）
const WEEKLY_TASKS = [
  { id: 'week-time', name: '周练三百', desc: '本周累计练习 300 分钟', target: 300, unit: '分钟', xp: 80 },
  { id: 'week-goals', name: '五日全勤', desc: '本周完成 5 次每日目标', target: 5, unit: '天', xp: 80 },
  { id: 'week-achieve', name: '探索新境', desc: '本周解锁 2 个新成就', target: 2, unit: '个', xp: 60 }
]

// 成就绑定称号预设：解锁对应成就即可选用
const TITLE_PRESETS = [
  { id: 'early-bird', name: '晨练者', achievementId: 'early-bird' },
  { id: 'night-owl', name: '夜猫子', achievementId: 'night-owl' },
  { id: 'weekend-warrior', name: '周末战士', achievementId: 'weekend-warrior' },
  { id: 'wrong-killer', name: '错题克星', achievementId: 'weak-mode-master' },
  { id: 'combo-king', name: '连击狂魔', achievementId: 'combo-100' },
  { id: 'speedster', name: '极速飞人', achievementId: 'speed-100' },
  { id: 'sharpshooter', name: '精准射手', achievementId: 'accuracy-100' },
  { id: 'persistent', name: '全勤标兵', achievementId: 'daily-goal-streak' },
  { id: 'veteran', name: '资深练习生', achievementId: 'sessions-100' },
  { id: 'night-walker', name: '深夜行者', achievementId: 'deep-night' }
]

// 本周一日期（YYYY-MM-DD）
function mondayKey(date) {
  const d = new Date(date)
  const day = d.getDay() || 7
  d.setDate(d.getDate() - day + 1)
  return formatDateKey(d)
}

// 历史单日最高字符数
function maxDailyChars(dailyStats) {
  let max = 0
  for (const key in dailyStats) {
    const c = dailyStats[key]?.chars || 0
    if (c > max) max = c
  }
  return max
}

// 掌握度达到 level 门槛的技能数
function masteredCount(mastery) {
  if (!mastery) return 0
  return Object.keys(mastery).filter(k => (mastery[k]?.level || 0) >= 3).length
}

// 某分类全部成就是否已解锁（系列成就判定）
function categoryUnlocked(category, unlocked) {
  const ids = ACHIEVEMENTS.filter(a => a.category === category && !a.series).map(a => a.id)
  return ids.every(id => (unlocked || []).includes(id))
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

  // ===== 扩充：时长 / 次数 / 高阶里程碑 =====
  {
    id: 'time-10h',
    name: '渐入佳境',
    description: '累计练习达到10小时',
    icon: '⏳',
    category: 'milestone',
    rarity: 'rare',
    condition: (stats) => (stats.learningTimeTotal || 0) >= 600
  },
  {
    id: 'time-50h',
    name: '滴水穿石',
    description: '累计练习达到50小时',
    icon: '⏰',
    category: 'milestone',
    rarity: 'epic',
    condition: (stats) => (stats.learningTimeTotal || 0) >= 3000
  },
  {
    id: 'time-100h',
    name: '千锤百炼',
    description: '累计练习达到100小时',
    icon: '🗿',
    category: 'milestone',
    rarity: 'legendary',
    condition: (stats) => (stats.learningTimeTotal || 0) >= 6000
  },
  {
    id: 'sessions-100',
    name: '百炼成钢',
    description: '累计完成100次练习',
    icon: '🏋️',
    category: 'milestone',
    rarity: 'uncommon',
    condition: (stats) => (stats.totalPracticeSessions || 0) >= 100
  },
  {
    id: 'sessions-500',
    name: '炉火纯青',
    description: '累计完成500次练习',
    icon: '🎓',
    category: 'milestone',
    rarity: 'rare',
    condition: (stats) => (stats.totalPracticeSessions || 0) >= 500
  },
  {
    id: 'char-100k',
    name: '十万字符',
    description: '累计练习100000个字符',
    icon: '🗃️',
    category: 'milestone',
    rarity: 'legendary',
    condition: (stats) => stats.totalCharsTyped >= 100000
  },
  {
    id: 'char-200k',
    name: '二十万字',
    description: '累计练习200000个字符',
    icon: '📦',
    category: 'milestone',
    rarity: 'legendary',
    condition: (stats) => stats.totalCharsTyped >= 200000
  },
  {
    id: 'day-1000',
    name: '日码千字',
    description: '单日输入超过1000个字符',
    icon: '📈',
    category: 'milestone',
    rarity: 'rare',
    condition: (stats) => (stats.dayMaxChars || 0) >= 1000
  },

  // ===== 扩充：错题治理 / 时段 / 质量组合 / 掌握度 =====
  {
    id: 'clear-wrong-today',
    name: '今日无错',
    description: '当日错词全部清零',
    icon: '🧽',
    category: 'special',
    rarity: 'common',
    condition: (stats) => stats.totalCharsTyped > 0 && (stats.todayWrongCount || 0) === 0
  },
  {
    id: 'clear-wrong-7',
    name: '一尘不染',
    description: '连续7天错词清零',
    icon: '🕊️',
    category: 'special',
    rarity: 'uncommon',
    condition: (stats) => (stats.clearStreakDays || 0) >= 7
  },
  {
    id: 'clear-wrong-500',
    name: '错题终结者',
    description: '累计清零500个错词',
    icon: '🗑️',
    category: 'special',
    rarity: 'rare',
    condition: (stats) => (stats.wrongWordsCleared || 0) >= 500
  },
  {
    id: 'all-slots',
    name: '全天候战士',
    description: '在清晨、上午、下午、夜晚四个时段都练过',
    icon: '🛰️',
    category: 'special',
    rarity: 'rare',
    condition: (stats) => {
      const t = stats.timeSlots || {}
      return ['morning', 'afternoon', 'evening', 'night'].every(k => (t[k]?.sessions || 0) > 0)
    }
  },
  {
    id: 'steady-fast',
    name: '稳准狠',
    description: '单次练习准确率90%且速度达到60字/分',
    icon: '🎯',
    category: 'accuracy',
    rarity: 'rare',
    condition: (stats, session) => session.accuracy >= 90 && session.speed >= 60 && session.chars >= 30 && session.elapsedMin >= 1
  },
  {
    id: 'human-machine',
    name: '人机合一',
    description: '单次练习准确率95%且速度达到100字/分',
    icon: '🤖',
    category: 'accuracy',
    rarity: 'epic',
    condition: (stats, session) => session.accuracy >= 95 && session.speed >= 100 && session.chars >= 50 && session.elapsedMin >= 1
  },
  {
    id: 'session-speed-200',
    name: '极速传说',
    description: '单次练习速度达到200字/分',
    icon: '🌠',
    category: 'speed',
    rarity: 'legendary',
    condition: (stats, session) => session.speed >= 200 && session.chars >= 100 && session.elapsedMin >= 1
  },
  {
    id: 'master-all',
    name: '码表精通',
    description: '任意3个技能掌握度达到3级',
    icon: '🧠',
    category: 'special',
    rarity: 'epic',
    condition: (stats) => masteredCount(stats.mastery) >= 3
  },

  // ===== 扩充：成长（等级 / 段位） =====
  {
    id: 'level-3',
    name: '小有所成',
    description: '等级达到3级',
    icon: '🌱',
    category: 'growth',
    rarity: 'uncommon',
    condition: (stats) => (stats.level || 0) >= 3
  },
  {
    id: 'level-6',
    name: '码字能手',
    description: '等级达到6级',
    icon: '💪',
    category: 'growth',
    rarity: 'uncommon',
    condition: (stats) => (stats.level || 0) >= 6
  },
  {
    id: 'level-9',
    name: '双拼达人',
    description: '等级达到9级',
    icon: '🌟',
    category: 'growth',
    rarity: 'rare',
    condition: (stats) => (stats.level || 0) >= 9
  },
  {
    id: 'level-12',
    name: '双拼大师',
    description: '等级达到12级',
    icon: '🏆',
    category: 'growth',
    rarity: 'epic',
    condition: (stats) => (stats.level || 0) >= 12
  },
  {
    id: 'level-15',
    name: '键圣传说',
    description: '等级达到15级',
    icon: '👑',
    category: 'growth',
    rarity: 'legendary',
    condition: (stats) => (stats.level || 0) >= 15
  },
  {
    id: 'rank-bronze',
    name: '青铜起步',
    description: '段位分达到40分（青铜）',
    icon: '🥉',
    category: 'growth',
    rarity: 'common',
    condition: (stats) => (stats.rankScore || 0) >= 40
  },
  {
    id: 'rank-silver',
    name: '白银骑士',
    description: '段位分达到60分（白银）',
    icon: '🥈',
    category: 'growth',
    rarity: 'uncommon',
    condition: (stats) => (stats.rankScore || 0) >= 60
  },
  {
    id: 'rank-gold',
    name: '黄金战士',
    description: '段位分达到80分（黄金）',
    icon: '🥇',
    category: 'growth',
    rarity: 'rare',
    condition: (stats) => (stats.rankScore || 0) >= 80
  },
  {
    id: 'rank-platinum',
    name: '铂金精英',
    description: '段位分达到95分（铂金）',
    icon: '💠',
    category: 'growth',
    rarity: 'rare',
    condition: (stats) => (stats.rankScore || 0) >= 95
  },
  {
    id: 'rank-diamond',
    name: '钻石王者',
    description: '段位分达到110分（钻石）',
    icon: '💎',
    category: 'growth',
    rarity: 'epic',
    condition: (stats) => (stats.rankScore || 0) >= 110
  },
  {
    id: 'rank-king',
    name: '键位王者',
    description: '段位分达到125分（王者）',
    icon: '♛',
    category: 'growth',
    rarity: 'legendary',
    condition: (stats) => (stats.rankScore || 0) >= 125
  },

  // ===== 扩充：连续 =====
  {
    id: 'streak-365',
    name: '周年坚守',
    description: '连续练习365天',
    icon: '🗓️',
    category: 'streak',
    rarity: 'legendary',
    condition: (stats) => stats.streakDays >= 365
  },

  // ===== 扩充：隐藏成就 =====
  {
    id: 'deep-night',
    name: '深夜行者',
    description: '在凌晨2-5点完成练习',
    icon: '🌙',
    category: 'special',
    rarity: 'epic',
    hidden: true,
    condition: (stats, session, meta) => {
      const hour = new Date(meta?.timestamp || Date.now()).getHours()
      return hour >= 2 && hour < 5
    }
  },
  {
    id: 'anniversary-first',
    name: '首练周年',
    description: '在首次练习的周年日当天练习',
    icon: '🎂',
    category: 'special',
    rarity: 'epic',
    hidden: true,
    condition: (stats, session, meta) => {
      const first = stats.firstPracticeDate
      if (!first) return false
      const now = new Date(meta?.timestamp || Date.now())
      const f = new Date(first)
      return now.getFullYear() > f.getFullYear() &&
        now.getMonth() === f.getMonth() &&
        now.getDate() === f.getDate()
    }
  },
  {
    id: 'speed-record',
    name: '自我超越',
    description: '单次练习速度打破个人最高纪录（≥80字/分）',
    icon: '🚀',
    category: 'special',
    rarity: 'rare',
    hidden: true,
    condition: (stats, session) => session.speed >= 80 && session.speed > (stats.maxSessionSpeed || 0) && session.chars >= 30 && session.elapsedMin >= 1
  },

  // ===== 扩充：系列成就（集齐一类全部后解锁，必须放在最后） =====
  {
    id: 'series-milestone',
    name: '里程碑全收集',
    description: '集齐全部里程碑成就',
    icon: '🏛️',
    category: 'growth',
    rarity: 'legendary',
    series: true,
    condition: (stats) => categoryUnlocked('milestone', stats.unlocked)
  },
  {
    id: 'series-accuracy',
    name: '精准满贯',
    description: '集齐全部准确率成就',
    icon: '🎯',
    category: 'growth',
    rarity: 'epic',
    series: true,
    condition: (stats) => categoryUnlocked('accuracy', stats.unlocked)
  },
  {
    id: 'series-speed',
    name: '极速满贯',
    description: '集齐全部速度成就',
    icon: '⚡',
    category: 'growth',
    rarity: 'epic',
    series: true,
    condition: (stats) => categoryUnlocked('speed', stats.unlocked)
  },
  {
    id: 'series-streak',
    name: '坚毅满贯',
    description: '集齐全部连续练习成就',
    icon: '🔥',
    category: 'growth',
    rarity: 'legendary',
    series: true,
    condition: (stats) => categoryUnlocked('streak', stats.unlocked)
  },
  {
    id: 'series-combo',
    name: '连击满贯',
    description: '集齐全部连击成就',
    icon: '💫',
    category: 'growth',
    rarity: 'epic',
    series: true,
    condition: (stats) => categoryUnlocked('combo', stats.unlocked)
  },
  {
    id: 'series-special',
    name: '奇遇满贯',
    description: '集齐全部特殊成就',
    icon: '🎁',
    category: 'growth',
    rarity: 'rare',
    series: true,
    condition: (stats) => categoryUnlocked('special', stats.unlocked)
  },
]

// 成就进度定义（锁定卡片展示"还差多少"）
// current 返回当前值；时间段类成就（早起/夜猫子/周末/每日目标达成）无累计型进度，不展示进度条
const ACHIEVEMENT_PROGRESS = {
  'first-practice': { current: s => s.totalCharsTyped, target: 1, unit: '字符' },
  'hundred-chars': { current: s => s.totalCharsTyped, target: 100, unit: '字符', tiers: [200, 500] },
  'five-hundred-chars': { current: s => s.totalCharsTyped, target: 500, unit: '字符', tiers: [1000, 2000] },
  'thousand-chars': { current: s => s.totalCharsTyped, target: 1000, unit: '字符', tiers: [2000, 5000] },
  'five-thousand': { current: s => s.totalCharsTyped, target: 5000, unit: '字符', tiers: [8000, 15000] },
  'ten-thousand': { current: s => s.totalCharsTyped, target: 10000, unit: '字符', tiers: [20000, 50000] },
  'fifty-thousand': { current: s => s.totalCharsTyped, target: 50000, unit: '字符', tiers: [100000, 200000] },
  'accuracy-80': { current: s => s.accuracy, target: 80, unit: '%' },
  'accuracy-90': { current: s => s.accuracy, target: 90, unit: '%' },
  'accuracy-95': { current: s => s.accuracy, target: 95, unit: '%' },
  'accuracy-100': { current: s => s.accuracy, target: 100, unit: '%' },
  'speed-30': { current: s => s.averageSpeed, target: 30, unit: '字/分' },
  'speed-60': { current: s => s.averageSpeed, target: 60, unit: '字/分' },
  'speed-100': { current: s => s.averageSpeed, target: 100, unit: '字/分' },
  'speed-150': { current: s => s.averageSpeed, target: 150, unit: '字/分' },
  'streak-3': { current: s => s.streakDays, target: 3, unit: '天' },
  'streak-7': { current: s => s.streakDays, target: 7, unit: '天' },
  'streak-14': { current: s => s.streakDays, target: 14, unit: '天' },
  'streak-30': { current: s => s.streakDays, target: 30, unit: '天' },
  'streak-100': { current: s => s.streakDays, target: 100, unit: '天' },
  'combo-5': { current: (s, sess) => sess.maxCombo, target: 5, unit: '连击' },
  'combo-10': { current: (s, sess) => sess.maxCombo, target: 10, unit: '连击' },
  'combo-25': { current: (s, sess) => sess.maxCombo, target: 25, unit: '连击' },
  'combo-50': { current: (s, sess) => sess.maxCombo, target: 50, unit: '连击' },
  'combo-100': { current: (s, sess) => sess.maxCombo, target: 100, unit: '连击' },
  'weak-mode-master': { current: s => s.weakModePractices, target: 100, unit: '次' },
  'daily-goal-streak': { current: s => s.dailyGoalStreak, target: 7, unit: '天' },
  // ===== 扩充：时长 / 次数 / 峰值 / 高阶里程碑 =====
  'time-10h': { current: s => s.learningTimeTotal, target: 600, unit: '分钟', tiers: [1500, 3000] },
  'time-50h': { current: s => s.learningTimeTotal, target: 3000, unit: '分钟', tiers: [4500, 6000] },
  'time-100h': { current: s => s.learningTimeTotal, target: 6000, unit: '分钟', tiers: [9000, 12000] },
  'sessions-100': { current: s => s.totalPracticeSessions, target: 100, unit: '次', tiers: [200, 400] },
  'sessions-500': { current: s => s.totalPracticeSessions, target: 500, unit: '次', tiers: [750, 1000] },
  'char-100k': { current: s => s.totalCharsTyped, target: 100000, unit: '字符', tiers: [150000, 200000] },
  'char-200k': { current: s => s.totalCharsTyped, target: 200000, unit: '字符' },
  'day-1000': { current: s => s.dayMaxChars, target: 1000, unit: '字符', tiers: [2000, 5000] },
  // ===== 扩充：错题治理 / 掌握度 =====
  'clear-wrong-7': { current: s => s.clearStreakDays, target: 7, unit: '天' },
  'clear-wrong-500': { current: s => s.wrongWordsCleared, target: 500, unit: '词' },
  'master-all': { current: s => masteredCount(s.mastery), target: 3, unit: '技能' },
  // ===== 扩充：成长（等级 / 段位） =====
  'level-3': { current: s => s.level, target: 3, unit: '级' },
  'level-6': { current: s => s.level, target: 6, unit: '级' },
  'level-9': { current: s => s.level, target: 9, unit: '级' },
  'level-12': { current: s => s.level, target: 12, unit: '级' },
  'level-15': { current: s => s.level, target: 15, unit: '级' },
  'rank-bronze': { current: s => s.rankScore, target: 40, unit: '分' },
  'rank-silver': { current: s => s.rankScore, target: 60, unit: '分' },
  'rank-gold': { current: s => s.rankScore, target: 80, unit: '分' },
  'rank-platinum': { current: s => s.rankScore, target: 95, unit: '分' },
  'rank-diamond': { current: s => s.rankScore, target: 110, unit: '分' },
  'rank-king': { current: s => s.rankScore, target: 125, unit: '分' },
  // ===== 扩充：连续 =====
  'streak-365': { current: s => s.streakDays, target: 365, unit: '天', tiers: [400, 500] },
}

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
    dailyWrongWords: {},
    // ===== 扩充：荣誉系统（经验 / 成长 / 错题治理） =====
    xp: 0,                     // 累计经验值（每次练习会话发放）
    maxSessionSpeed: 0,        // 单次会话最高速度（字/分）
    firstPracticeDate: null,   // 首次练习日期（YYYY-MM-DD）
    wrongWordsCleared: 0,      // 累计清零错词数（练对移除时累计）
    clearStreakDays: 0,        // 连续错词清零天数
    lastClearDate: null,       // 最近一次错词清零日期
    // ===== 扩充2：自定义称号 / 荣誉墙收藏 / 任务系统 =====
    customTitle: '',           // 用户自定义称号（空 = 未设置）
    pinnedAchievements: [],    // 置顶收藏的成就 id
    taskState: {               // 任务领取状态（按日期/周自动重置）
      date: '',
      daily: {},
      weekStart: '',
      weekly: {}
    },
  }),

  getters: {
    // 获取所有成就定义
    allAchievements: () => ACHIEVEMENTS,

    // 获取已解锁成就列表
    unlockedList(state) {
      return ACHIEVEMENTS.filter(a => state.unlockedAchievements.includes(a.id))
    },

    // 各成就当前进度（锁定卡片进度条用）：{ id: { pct, current, target, unit } }
    achievementProgress(state) {
      const statsStore = useStatsStore()
      const result = {}
      const stats = {
        totalCharsTyped: statsStore.totalCharsTyped,
        averageSpeed: statsStore.averageSpeed,
        streakDays: statsStore.streakDays,
        weakModePractices: state.weakModePractices,
        dailyGoalsCompleted: state.dailyGoals.completedDates.length,
        dailyGoalStreak: this.calculateDailyGoalStreak(),
        // 累计正确率（无练习时为 0，避免空数据时显示 100% 误导）
        accuracy: statsStore.totalCharsTyped > 0
          ? Math.round(statsStore.totalCorrectChars / statsStore.totalCharsTyped * 100)
          : 0,
        // ===== 扩充：荣誉系统字段 =====
        learningTimeTotal: state.learningTimeTotal,
        totalPracticeSessions: state.totalPracticeSessions,
        wrongWordsCleared: state.wrongWordsCleared,
        clearStreakDays: state.clearStreakDays,
        dayMaxChars: maxDailyChars(statsStore.dailyStats),
        mastery: state.skillMastery,
        level: this.levelInfo.level,
        rankScore: this.rankInfo.score,
      }
      const session = { maxCombo: state.maxCombo }
      for (const a of ACHIEVEMENTS) {
        const p = ACHIEVEMENT_PROGRESS[a.id]
        if (!p) continue
        const current = p.current(stats, session)
        const pct = p.target > 0 ? Math.max(0, Math.min(100, Math.round(current / p.target * 100))) : 0
        result[a.id] = { pct, current, target: p.target, unit: p.unit, tiers: p.tiers }
      }
      return result
    },

    // 获取未解锁成就列表
    lockedList(state) {
      return ACHIEVEMENTS.filter(a => !state.unlockedAchievements.includes(a.id))
    },

    // ===== 扩充：等级 / 自定义称号 =====
    levelInfo(state) {
      const xp = state.xp || 0
      const level = levelFromXp(xp)
      const idx = Math.min(level - 1, MAX_LEVEL - 1)
      const cur = LEVEL_XP[idx]
      const next = idx + 1 < MAX_LEVEL ? LEVEL_XP[idx + 1] : null
      return {
        level,
        // 称号由用户自定义（空 = 未设置），不再自动取名
        title: state.customTitle || '',
        xp,
        cur,
        next,
        pct: next ? Math.min(100, Math.round((xp - cur) / (next - cur) * 100)) : 100
      }
    },

    // ===== 扩充：段位（速度 × 准确率综合分） =====
    rankInfo() {
      const statsStore = useStatsStore()
      const speed = statsStore.averageSpeed || 0
      const acc = statsStore.totalCharsTyped > 0
        ? Math.round(statsStore.totalCorrectChars / statsStore.totalCharsTyped * 100)
        : 0
      const score = Math.round(speed * acc / 100)
      const RANKS = [
        { name: '青铜', min: 0, next: 40 },
        { name: '白银', min: 40, next: 60 },
        { name: '黄金', min: 60, next: 80 },
        { name: '铂金', min: 80, next: 95 },
        { name: '钻石', min: 95, next: 110 },
        { name: '星耀', min: 110, next: 125 },
        { name: '王者', min: 125, next: null }
      ]
      let current = RANKS[0]
      for (const r of RANKS) {
        if (score >= r.min) current = r
        else break
      }
      const prevMin = current.min
      const pct = current.next
        ? Math.min(100, Math.max(0, Math.round((score - prevMin) / (current.next - prevMin) * 100)))
        : 100
      return { rank: current.name, score, next: current.next, pct }
    },

    // ===== 扩充：各分类收集进度 =====
    categoryProgress(state) {
      const cats = [...new Set(ACHIEVEMENTS.map(a => a.category))]
      return cats.map(cat => {
        const list = ACHIEVEMENTS.filter(a => a.category === cat)
        const unlocked = list.filter(a => state.unlockedAchievements.includes(a.id)).length
        return {
          category: cat,
          unlocked,
          total: list.length,
          pct: Math.round(unlocked / list.length * 100)
        }
      })
    },

    // ===== 扩充2：每日任务视图（按日期自动重置领取状态） =====
    dailyTaskView(state) {
      const today = getTodayKey()
      const isNewDay = state.taskState.date !== today
      const claimedMap = state.taskState.daily || {}
      const g = this.todayGoal
      return DAILY_TASKS.map(t => {
        let current = 0
        if (t.id === 'daily-time') current = g.timeDone
        else if (t.id === 'daily-sessions') current = g.sessionDone
        else if (t.id === 'daily-clear') current = g.mistakesDone ? 1 : 0
        const done = current >= t.target
        const claimed = isNewDay ? false : !!claimedMap[t.id]
        return { ...t, current: Math.min(current, t.target), done, claimed }
      })
    },

    // ===== 扩充2：本周任务视图（按周一自动重置领取状态） =====
    weeklyTaskView(state) {
      const today = getTodayKey()
      const weekStart = mondayKey(new Date())
      const isNewWeek = state.taskState.weekStart !== weekStart
      const claimedMap = state.taskState.weekly || {}
      const statsStore = useStatsStore()
      // 本周累计练习时长（分钟）
      let weekTime = 0
      for (const k in (statsStore.dailyStats || {})) {
        if (k >= weekStart && k <= today) weekTime += (statsStore.dailyStats[k].time || 0)
      }
      const values = {
        'week-time': Math.round(weekTime / 60),
        'week-goals': (state.dailyGoals.completedDates || []).filter(k => k >= weekStart).length,
        'week-achieve': Object.values(state.achievementUnlockTimes || {}).filter(ts => {
          const k = formatDateKey(new Date(ts))
          return k >= weekStart
        }).length
      }
      return WEEKLY_TASKS.map(t => {
        const current = values[t.id] || 0
        const done = current >= t.target
        const claimed = isNewWeek ? false : !!claimedMap[t.id]
        return { ...t, current: Math.min(current, t.target), done, claimed }
      })
    },

    // ===== 扩充2：称号预设（解锁对应成就后可选用） =====
    titlePresets(state) {
      return TITLE_PRESETS.map(p => ({
        ...p,
        unlocked: state.unlockedAchievements.includes(p.achievementId)
      }))
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
      // 首次练习日期
      if (!this.firstPracticeDate) this.firstPracticeDate = getTodayKey()
      // 单次会话最高速度（字/分）
      const speed = durationMinutes > 0 ? Math.round(charsTyped / durationMinutes) : 0
      if (speed > this.maxSessionSpeed) this.maxSessionSpeed = speed
      // 经验值：基础10 + 每10字符1点 + 准确率奖励
      const accuracy = this.sessionStats.accuracy || 0
      let gain = 10 + Math.floor(charsTyped / 10)
      if (accuracy >= 95) gain += 5
      else if (accuracy >= 90) gain += 3
      this.xp += gain
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
        // 今日重新出现错词后，本日的「清零」状态失效
        if (this.lastClearDate === today) {
          this.lastClearDate = null
          this.clearStreakDays = Math.max(0, this.clearStreakDays - 1)
        }
        this.save()
      }
    },
    // 今日错词练对后移除（打对自动调用）
    clearDailyWrongWord(word) {
      if (!word) return
      const today = getTodayKey()
      const list = (this.dailyWrongWords[today] || []).filter(w => w !== word)
      this.dailyWrongWords[today] = list
      this.wrongWordsCleared++
      // 今日错词全部清零时，累计连续清零天数
      if (list.length === 0 && word) {
        const yesterday = formatDateKey(new Date(Date.now() - 86400000))
        if (this.lastClearDate === today) {
          // 今日已统计过，不重复计数
        } else if (this.lastClearDate === yesterday) {
          this.clearStreakDays++
        } else {
          this.clearStreakDays = 1
        }
        this.lastClearDate = today
      }
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

    // ===== 扩充2：自定义称号 =====
    setCustomTitle(title) {
      this.customTitle = (title || '').trim().slice(0, 12)
      this.save()
    },

    // ===== 扩充2：置顶收藏成就 =====
    togglePin(achievementId) {
      const idx = this.pinnedAchievements.indexOf(achievementId)
      if (idx > -1) this.pinnedAchievements.splice(idx, 1)
      else this.pinnedAchievements.push(achievementId)
      this.save()
    },

    // ===== 扩充2：领取任务奖励（满足且未领取时发放 XP） =====
    claimTask(type, taskId) {
      const view = type === 'daily' ? this.dailyTaskView : this.weeklyTaskView
      const task = view.find(t => t.id === taskId)
      if (!task || !task.done || task.claimed) return false
      const today = getTodayKey()
      if (type === 'daily') {
        if (this.taskState.date !== today) {
          this.taskState.date = today
          this.taskState.daily = {}
        }
        this.taskState.daily[taskId] = true
      } else {
        const ws = mondayKey(new Date())
        if (this.taskState.weekStart !== ws) {
          this.taskState.weekStart = ws
          this.taskState.weekly = {}
        }
        this.taskState.weekly[taskId] = true
      }
      this.xp += task.xp
      this.save()
      return true
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
          // ===== 扩充：荣誉系统字段 =====
          learningTimeTotal: this.learningTimeTotal,
          totalPracticeSessions: this.totalPracticeSessions,
          wrongWordsCleared: this.wrongWordsCleared,
          clearStreakDays: this.clearStreakDays,
          maxSessionSpeed: this.maxSessionSpeed,
          firstPracticeDate: this.firstPracticeDate,
          dayMaxChars: maxDailyChars(statsStore.dailyStats),
          timeSlots: statsStore.timeSlotStats,
          mastery: this.skillMastery,
          level: this.levelInfo.level,
          rankScore: this.rankInfo.score,
          todayWrongCount: (this.dailyWrongWords[getTodayKey()] || []).length,
          unlocked: [...this.unlockedAchievements],
          stats: statsStore.$state
        }

        const elapsedMin = this.sessionStats.startTime ? (Date.now() - this.sessionStats.startTime) / 60000 : 0
        const session = {
          chars: this.sessionStats.chars,
          correct: this.sessionStats.correct,
          accuracy: this.sessionStats.accuracy,
          maxCombo: this.maxCombo,
          elapsedMin: Math.round(elapsedMin * 10) / 10,
          speed: elapsedMin > 0 ? Math.round(this.sessionStats.chars / elapsedMin) : 0
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
      // ===== 扩充：荣誉系统字段 =====
      this.xp = 0
      this.maxSessionSpeed = 0
      this.firstPracticeDate = null
      this.wrongWordsCleared = 0
      this.clearStreakDays = 0
      this.lastClearDate = null
      this.customTitle = ''
      this.pinnedAchievements = []
      this.taskState = { date: '', daily: {}, weekStart: '', weekly: {} }
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
          streakDays: this.streakDays,
          // ===== 扩充：荣誉系统字段 =====
          xp: this.xp,
          maxSessionSpeed: this.maxSessionSpeed,
          firstPracticeDate: this.firstPracticeDate,
          wrongWordsCleared: this.wrongWordsCleared,
          clearStreakDays: this.clearStreakDays,
          lastClearDate: this.lastClearDate,
          // ===== 扩充2：自定义称号 / 收藏 / 任务 =====
          customTitle: this.customTitle,
          pinnedAchievements: this.pinnedAchievements,
          taskState: this.taskState
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
        // 兼容两种格式：导出文件（progress 内嵌）与旧版顶层字段
        const src = data.progress || data
        if (src.unlockedAchievements) this.unlockedAchievements = src.unlockedAchievements
        if (src.achievementUnlockTimes) this.achievementUnlockTimes = src.achievementUnlockTimes
        if (src.weakModePractices) this.weakModePractices = src.weakModePractices
        if (src.maxCombo) this.maxCombo = src.maxCombo
        if (src.totalPracticeSessions) this.totalPracticeSessions = src.totalPracticeSessions
        if (src.learningTimeTotal) this.learningTimeTotal = src.learningTimeTotal
        if (data.skillMastery) this.skillMastery = data.skillMastery
        if (data.dailyGoals) this.dailyGoals = { ...this.dailyGoals, ...data.dailyGoals }
        // ===== 扩充：荣誉系统字段 =====
        if (src.xp !== undefined) this.xp = src.xp
        if (src.maxSessionSpeed !== undefined) this.maxSessionSpeed = src.maxSessionSpeed
        if (src.firstPracticeDate !== undefined) this.firstPracticeDate = src.firstPracticeDate
        if (src.wrongWordsCleared !== undefined) this.wrongWordsCleared = src.wrongWordsCleared
        if (src.clearStreakDays !== undefined) this.clearStreakDays = src.clearStreakDays
        if (src.lastClearDate !== undefined) this.lastClearDate = src.lastClearDate
        // ===== 扩充2：自定义称号 / 收藏 / 任务 =====
        if (src.customTitle !== undefined) this.customTitle = src.customTitle
        if (src.pinnedAchievements !== undefined) this.pinnedAchievements = src.pinnedAchievements
        if (src.taskState !== undefined) this.taskState = { ...this.taskState, ...src.taskState }
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
