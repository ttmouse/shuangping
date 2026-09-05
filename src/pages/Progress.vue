<template>
  <div class="progress-page">
    <TopStatusBar />

    <div class="page-content">
      <div class="header">
        <h1>学习进度</h1>
        <p class="subtitle">追踪你的双拼学习之旅</p>
      </div>

      <!-- 学习统计概览 -->
      <div class="stats-overview">
        <h2>学习统计</h2>
        <div class="stats-grid">
          <div class="card-hit" @mousemove="handleCardTilt" @mouseleave="handleCardLeave">
            <div class="stat-card">
              <div class="card-layer layer-1"></div>
              <div class="card-layer layer-2"></div>
              <span class="stat-icon"><Trophy :size="28" /></span>
              <span class="stat-value">{{ progress.unlockedAchievements.length }}</span>
              <span class="stat-label">已解锁成就</span>
              <div class="stat-progress"><div class="stat-progress-fill" :style="{ width: statProgress.achievements + '%' }"></div></div>
            </div>
          </div>
          <div class="card-hit" @mousemove="handleCardTilt" @mouseleave="handleCardLeave">
            <div class="stat-card">
              <div class="card-layer layer-1"></div>
              <div class="card-layer layer-2"></div>
              <span class="stat-icon"><Zap :size="28" /></span>
              <span class="stat-value">{{ progress.maxCombo }}</span>
              <span class="stat-label">最高连击</span>
              <div class="stat-progress"><div class="stat-progress-fill" :style="{ width: statProgress.maxCombo + '%' }"></div></div>
            </div>
          </div>
          <div class="card-hit" @mousemove="handleCardTilt" @mouseleave="handleCardLeave">
            <div class="stat-card">
              <div class="card-layer layer-1"></div>
              <div class="card-layer layer-2"></div>
              <span class="stat-icon"><Flame :size="28" /></span>
              <span class="stat-value">{{ streakDays }}</span>
              <span class="stat-label">连续练习天数</span>
              <div class="stat-progress"><div class="stat-progress-fill" :style="{ width: statProgress.streakDays + '%' }"></div></div>
            </div>
          </div>
          <div class="card-hit" @mousemove="handleCardTilt" @mouseleave="handleCardLeave">
            <div class="stat-card">
              <div class="card-layer layer-1"></div>
              <div class="card-layer layer-2"></div>
              <span class="stat-icon"><Repeat :size="28" /></span>
              <span class="stat-value">{{ progress.totalPracticeSessions }}</span>
              <span class="stat-label">总练习次数</span>
              <div class="stat-progress"><div class="stat-progress-fill" :style="{ width: statProgress.totalSessions + '%' }"></div></div>
            </div>
          </div>
          <div class="card-hit" @mousemove="handleCardTilt" @mouseleave="handleCardLeave">
            <div class="stat-card">
              <div class="card-layer layer-1"></div>
              <div class="card-layer layer-2"></div>
              <span class="stat-icon"><Clock :size="28" /></span>
              <span class="stat-value">{{ Math.round(progress.learningTimeTotal) }}</span>
              <span class="stat-label">学习时长(分钟)</span>
              <div class="stat-progress"><div class="stat-progress-fill" :style="{ width: statProgress.learningTime + '%' }"></div></div>
            </div>
          </div>
          <div class="card-hit" @mousemove="handleCardTilt" @mouseleave="handleCardLeave">
            <div class="stat-card">
              <div class="card-layer layer-1"></div>
              <div class="card-layer layer-2"></div>
              <span class="stat-icon"><CalendarCheck :size="28" /></span>
              <span class="stat-value">{{ progress.dailyGoals.completedDates.length }}</span>
              <span class="stat-label">完成目标天数</span>
              <div class="stat-progress"><div class="stat-progress-fill" :style="{ width: statProgress.goalDays + '%' }"></div></div>
            </div>
          </div>
        </div>
      </div>

      <!-- 今日目标：实时进度指引 -->
      <div class="goal-card">
        <h2>今日目标 <small class="goal-status" :class="{ done: goal.allDone }">{{ goal.allDone ? '已达成' : '进行中' }}</small></h2>
        <div class="goal-grid">
          <div class="goal-line" :class="{ done: goal.timeDoneFlag }">
            <span class="goal-name"><Clock :size="16" /> 练习时长</span>
            <span class="goal-bar"><span class="goal-fill" :style="{ width: goal.timePercent + '%' }"></span></span>
            <span class="goal-num">{{ goal.timeDone }} / {{ goal.timeTarget }} 分钟</span>
          </div>
          <div class="goal-line" :class="{ done: goal.accuracyDone }">
            <span class="goal-name"><Target :size="16" /> 正确率</span>
            <span class="goal-num">{{ goal.accuracy }}% <small>（目标 ≥{{ goal.accuracyTarget }}%）</small></span>
          </div>
          <div class="goal-line" :class="{ done: goal.sessionDoneFlag }">
            <span class="goal-name"><Repeat :size="16" /> 练习次数</span>
            <span class="goal-num">{{ goal.sessionDone }} / {{ goal.sessionTarget }} 次</span>
          </div>
          <div class="goal-line" :class="{ done: goal.mistakesDone }">
            <span class="goal-name"><CheckCircle2 :size="16" /> 错词清零</span>
            <span class="goal-num">{{ goal.mistakesDone ? '已清完' : '还有 ' + goal.mistakes + ' 个错词待练' }}</span>
          </div>
        </div>
      </div>

      <!-- 成就展示 -->
      <div class="achievements-section">
        <div class="achievements-header">
          <h2>成就系统</h2>
          <div class="achievements-filter">
            <button 
              v-for="filter in achievementFilters" 
              :key="filter.key"
              class="filter-btn"
              :class="{ active: currentFilter === filter.key }"
              @click="switchFilter(filter.key)"
            >
              {{ filter.label }}
            </button>
          </div>
        </div>
        <div class="achievements-grid">
          <div
            v-for="achievement in filteredAchievements"
            :key="achievement.id"
            class="card-hit"
            @mousemove="handleCardTilt"
            @mouseleave="handleCardLeave"
          >
            <div
              class="achievement-card"
              :class="{ 
                'unlocked': isAchievementUnlocked(achievement.id), 
                'rare': isRare(achievement.id),
                'epic': isEpic(achievement.id),
                'legendary': isLegendary(achievement.id)
              }"
            >
              <div class="card-layer layer-1"></div>
              <div class="card-layer layer-2"></div>
              <div class="achievement-icon" :class="{ multi: isMultiIcon(achievement.icon) }">{{ achievement.icon }}</div>
              <div class="achievement-name">{{ achievement.name }}</div>
              <div class="achievement-desc">{{ achievement.description }}</div>
              <div class="achievement-progress" v-if="!isAchievementUnlocked(achievement.id) && progressMap[achievement.id]">
                <div class="achievement-progress-track">
                  <div class="achievement-progress-fill" :style="{ width: progressMap[achievement.id].pct + '%' }"></div>
                </div>
                <div class="achievement-progress-text">{{ progressMap[achievement.id].current }}/{{ progressMap[achievement.id].target }}{{ progressMap[achievement.id].unit }}</div>
              </div>
              <div class="achievement-status" v-if="isAchievementUnlocked(achievement.id)">
                <span class="unlocked-stamp"><span class="stamp-check">✓</span>{{ formatUnlockDate(achievement.id) }}</span>
              </div>
              <div class="achievement-lock" v-else>
                <span class="lock-icon"><Lock :size="16" /></span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 最近成就 -->
      <div class="recent-achievements" v-if="progress.recentAchievements.length">
        <h3>最近解锁</h3>
        <div class="recent-list">
          <div
            v-for="achievement in progress.recentAchievements"
            :key="achievement.id"
            class="recent-item"
          >
            <span class="recent-icon">{{ achievement.icon }}</span>
            <span class="recent-name">{{ achievement.name }}</span>
            <span class="recent-date">{{ formatDate(achievement.unlockedAt) }}</span>
          </div>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="actions-section">
        <button class="action-btn export" @click="exportProgress">
          <span class="btn-icon"><Download :size="16" /></span>
          导出进度
        </button>
        <button class="action-btn import" @click="triggerImport">
          <span class="btn-icon"><Upload :size="16" /></span>
          导入进度
        </button>
        <button class="action-btn reset" @click="resetProgress">
          <span class="btn-icon"><RotateCcw :size="16" /></span>
          重置进度
        </button>
      </div>
      
      <input 
        ref="importInput" 
        type="file" 
        accept=".json" 
        style="display: none" 
        @change="handleImport"
      />

      <div class="footer-space"/>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, inject } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Flame, Repeat, Clock, CalendarCheck, Target, CheckCircle2, Download, Upload, RotateCcw, Lock, Trophy, Zap } from 'lucide-vue-next'
import { useProgressStore } from '../stores/progress.js'
import { useStatsStore } from '../stores/stats.js'
import TopStatusBar from '../components/TopStatusBar.vue'

const route = useRoute()
const router = useRouter()
const progress = useProgressStore()
const goal = computed(() => progress.todayGoal)
const stats = useStatsStore()
const importInput = ref(null)

// 进度页不是练习场景，关闭全局暂停浮层
const pauseActive = inject('pauseActive', null)
if (pauseActive) pauseActive.value = false
// 从 URL 恢复成就筛选，默认「全部」
const currentFilter = ref(route.query.filter || 'all')

const RARE_ACHIEVEMENTS = ['ten-thousand', 'streak-30', 'combo-50', 'accuracy-95']
const EPIC_ACHIEVEMENTS = ['fifty-thousand', 'accuracy-100', 'speed-150', 'streak-100', 'combo-100']
const LEGENDARY_ACHIEVEMENTS = []

const achievementFilters = [
  { key: 'all', label: '全部' },
  { key: 'unlocked', label: '已解锁' },
  { key: 'locked', label: '未解锁' },
  { key: 'milestone', label: '里程碑' },
  { key: 'special', label: '特殊' }
]

const filteredAchievements = computed(() => {
  let list = progress.allAchievements
  
  switch (currentFilter.value) {
    case 'unlocked':
      list = list.filter(a => progress.unlockedAchievements.includes(a.id))
      break
    case 'locked':
      list = list.filter(a => !progress.unlockedAchievements.includes(a.id))
      break
    case 'milestone':
      list = list.filter(a => a.category === 'milestone')
      break
    case 'special':
      list = list.filter(a => a.category === 'special')
      break
  }
  
  // 已解锁的排在前面
  return list.sort((a, b) => {
    const aUnlocked = progress.unlockedAchievements.includes(a.id)
    const bUnlocked = progress.unlockedAchievements.includes(b.id)
    if (aUnlocked && !bUnlocked) return -1
    if (!aUnlocked && bUnlocked) return 1
    return 0
  })
})

const streakDays = computed(() => progress.streakDays)

// 统计卡片进度条：各指标对应的目标值与完成百分比
const STAT_TARGETS = {
  achievements: null,           // 已解锁成就：目标为成就总数（动态）
  maxCombo: 100,                // 最高连击：100
  streakDays: 30,               // 连续练习天数：30天
  totalSessions: 100,           // 总练习次数：100次
  learningTime: 600,            // 学习时长：600分钟（10小时）
  goalDays: 30,                 // 完成目标天数：30天
}

const statProgress = computed(() => {
  const total = progress.allAchievements.length || 1
  return {
    achievements: Math.min(100, Math.round(progress.unlockedAchievements.length / total * 100)),
    maxCombo: Math.min(100, Math.round(progress.maxCombo / STAT_TARGETS.maxCombo * 100)),
    streakDays: Math.min(100, Math.round(streakDays.value / STAT_TARGETS.streakDays * 100)),
    totalSessions: Math.min(100, Math.round(progress.totalPracticeSessions / STAT_TARGETS.totalSessions * 100)),
    learningTime: Math.min(100, Math.round(progress.learningTimeTotal / STAT_TARGETS.learningTime * 100)),
    goalDays: Math.min(100, Math.round(progress.dailyGoals.completedDates.length / STAT_TARGETS.goalDays * 100)),
  }
})

// 3D 卡片倾斜效果：斥力模式 —— 光标靠近的一侧向后仰
// 事件绑定在不变换的 .card-hit 命中区上，内层卡片只做视觉变换，彻底避免边缘抖动
function handleCardTilt(e) {
  const hit = e.currentTarget
  const el = hit.querySelector('.achievement-card, .stat-card')
  if (!el) return
  // 用命中区的稳定矩形计算鼠标位置（不受卡片 3D 变换影响）
  const rect = hit.getBoundingClientRect()
  const px = (e.clientX - rect.left) / rect.width
  const py = (e.clientY - rect.top) / rect.height
  // 角落平滑：将 [0,1] 映射到 [0.15, 0.85]
  const sx = px * 0.7 + 0.15
  const sy = py * 0.7 + 0.15
  const maxDeg = 28
  const rotateX = (0.5 - sy) * maxDeg * 2
  const rotateY = (sx - 0.5) * maxDeg * 2
  el.style.setProperty('--tilt-x', rotateX.toFixed(2) + 'deg')
  el.style.setProperty('--tilt-y', rotateY.toFixed(2) + 'deg')
  el.style.setProperty('--glare-x', (px * 100).toFixed(1) + '%')
  el.style.setProperty('--glare-y', (py * 100).toFixed(1) + '%')
  // 动态阴影
  const shadowX = (-rotateY * 0.5).toFixed(1)
  const shadowY = (rotateX * 0.5 + 6).toFixed(1)
  el.style.setProperty('--shadow-x', shadowX + 'px')
  el.style.setProperty('--shadow-y', shadowY + 'px')
  // 跟手模式
  el.style.transitionDuration = '0.08s'
}

function handleCardLeave(e) {
  const hit = e.currentTarget
  const el = hit.querySelector('.achievement-card, .stat-card')
  if (!el) return
  el.style.setProperty('--tilt-x', '0deg')
  el.style.setProperty('--tilt-y', '0deg')
  el.style.setProperty('--shadow-x', '0px')
  el.style.setProperty('--shadow-y', '6px')
  // 复位模式：平滑回到原位
  el.style.transitionDuration = '0.4s'
}

function isAchievementUnlocked(achievementId) {
  return progress.unlockedAchievements.includes(achievementId)
}

// 多个相同 emoji（如 🔥🔥）改为横向一排并缩小，避免大图标下纵向堆叠撑破卡片
function isMultiIcon(icon) {
  const chars = [...icon]
  return chars.length > 1 && chars.every(c => c === chars[0])
}

// 锁定成就进度条映射：{ id: { pct, current, target, unit } }
const progressMap = computed(() => progress.achievementProgress)

function isRare(achievementId) {
  return RARE_ACHIEVEMENTS.includes(achievementId)
}

function isEpic(achievementId) {
  return EPIC_ACHIEVEMENTS.includes(achievementId)
}

function isLegendary(achievementId) {
  return LEGENDARY_ACHIEVEMENTS.includes(achievementId)
}

function formatUnlockDate(achievementId) {
  const timestamp = progress.achievementUnlockTimes[achievementId]
  if (!timestamp) return ''
  return formatDate(timestamp)
}

function formatDate(timestamp) {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  return `${date.getMonth() + 1}/${date.getDate()}`
}

function resetProgress() {
  progress.resetProgress()
}

function exportProgress() {
  const data = progress.exportFullData()
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `shuangping-progress-${new Date().toISOString().split('T')[0]}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function triggerImport() {
  importInput.value?.click()
}

function handleImport(event) {
  const file = event.target.files[0]
  if (!file) return
  
  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result)
      if (progress.importData(data)) {
        alert('进度导入成功！')
      } else {
        alert('进度导入失败，请检查文件格式。')
      }
    } catch (err) {
      alert('无法解析文件，请确保是有效的JSON格式。')
    }
  }
  reader.readAsText(file)
  event.target.value = ''
}

onMounted(() => {
  progress.load()
  // 连续练习天数由 stats.dailyStats 计算，需先加载
  stats.load()
})

onUnmounted(() => {
  if (pauseActive) pauseActive.value = true
})

// 成就筛选切换时同步到 URL
function switchFilter(key) {
  currentFilter.value = key
  router.replace({ query: { ...route.query, filter: key } })
}

// 浏览器前进/后退时恢复筛选状态
watch(() => route.query.filter, (filter) => {
  if (filter && filter !== currentFilter.value) {
    currentFilter.value = filter
  }
})
</script>

<style scoped>
.progress-page {
  min-height: 100vh;
  background: var(--theme-background-color);
}

.page-content {
  max-width: 960px;
  margin: 0 auto;
  padding: 20px;
  padding-top: 72px;
}

.header {
  text-align: center;
  margin-bottom: 32px;
}

.header h1 {
  font-size: 28px;
  font-weight: 700;
  color: var(--theme-text-color);
  margin-bottom: 8px;
}

.subtitle {
  color: var(--theme-text-color);
  font-size: 14px;
}

/* 成就系统 */
.achievements-section {
  margin-top: 32px;
  margin-bottom: 32px;
}

.achievements-section h2 {
  font-size: 20px;
  font-weight: 600;
  color: var(--theme-text-color);
  margin-bottom: 20px;
}

.achievements-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
  gap: 20px;
}

/* 命中区：不做任何 3D 变换，保证鼠标事件区域稳定，避免边缘抖动 */
.card-hit {
  position: relative;
}

.achievement-card {
  background: var(--theme-background-light-color);
  border: 3px solid var(--theme-border-color);
  border-radius: 16px;
  padding: 28px 20px 20px;
  text-align: center;
  position: relative;
  width: 100%;
  transition: transform 0.3s ease-out, box-shadow 0.3s ease-out, border-color 0.2s ease, opacity 0.2s ease;
  opacity: 0.55;
  box-shadow: var(--shadow-x, 0px) var(--shadow-y, 6px) 16px rgba(0, 0, 0, 0.08);
  height: 260px;
  display: flex;
  flex-direction: column;
  will-change: transform;
  transform-style: preserve-3d;
  transform: perspective(900px) rotateX(var(--tilt-x, 0deg)) rotateY(var(--tilt-y, 0deg)) scale(var(--card-scale, 1));
  overflow: hidden;
}

/* 装饰背景层：微妙的径向渐变，随鼠标做视差位移 */
.card-layer {
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
  transition: transform 0.25s ease-out;
  z-index: 0;
}
.card-layer.layer-1 {
  width: 180px;
  height: 180px;
  background: radial-gradient(circle, rgba(138, 168, 162, 0.1), transparent 70%);
  top: -40px;
  right: -40px;
}
.card-layer.layer-2 {
  width: 140px;
  height: 140px;
  background: radial-gradient(circle, rgba(138, 168, 162, 0.06), transparent 70%);
  bottom: -30px;
  left: -30px;
}

/* 柔和高光：跟随鼠标的微妙光泽 */
.achievement-card::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: radial-gradient(circle at var(--glare-x, 50%) var(--glare-y, 50%), rgba(255, 255, 255, 0.1), transparent 60%);
  opacity: 0;
  transition: opacity 0.3s ease;
  pointer-events: none;
  z-index: 1;
}

.achievement-card:hover::after {
  opacity: 1;
}

.achievement-card:hover {
  --card-scale: 1.02;
  box-shadow: var(--shadow-x, 0px) var(--shadow-y, 8px) 24px rgba(0, 0, 0, 0.1);
}

.achievement-card.unlocked {
  opacity: 1;
  border-color: #8aa8a2;
  box-shadow: var(--shadow-x, 0px) var(--shadow-y, 6px) 16px rgba(0, 0, 0, 0.08), 0 0 12px rgba(138, 168, 162, 0.12);
}

.achievement-card.unlocked:hover {
  box-shadow: var(--shadow-x, 0px) var(--shadow-y, 8px) 24px rgba(0, 0, 0, 0.1), 0 0 16px rgba(138, 168, 162, 0.18);
}

.achievement-card.rare.unlocked {
  border-color: #b0a278;
  background: linear-gradient(135deg, var(--theme-background-light-color) 0%, rgba(176, 162, 120, 0.06) 100%);
  box-shadow: var(--shadow-x, 0px) var(--shadow-y, 6px) 16px rgba(0, 0, 0, 0.08), 0 0 12px rgba(176, 162, 120, 0.12);
}

.achievement-card.rare.unlocked:hover {
  box-shadow: var(--shadow-x, 0px) var(--shadow-y, 8px) 24px rgba(0, 0, 0, 0.1), 0 0 16px rgba(176, 162, 120, 0.18);
}

.achievement-icon {
  font-size: 94px;
  line-height: 1.1;
  margin-bottom: 12px;
  filter: grayscale(100%);
  opacity: 0.5;
  transition: all 0.3s;
  position: relative;
  z-index: 2;
}

/* 多个相同 emoji（如 🔥🔥🔥）：横向一排并缩小，避免纵向堆叠 */
.achievement-icon.multi {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  font-size: 46px;
}

.achievement-card.unlocked .achievement-icon {
  filter: grayscale(0%);
  opacity: 1;
  animation: iconPop 0.5s ease;
}

@keyframes iconPop {
  0% { transform: translateZ(18px) scale(0); }
  70% { transform: translateZ(18px) scale(1.15); }
  100% { transform: translateZ(18px) scale(1); }
}

.achievement-name {
  font-size: 17px;
  font-weight: 700;
  line-height: 1.3;
  color: var(--theme-text-color);
  margin-bottom: 6px;
  position: relative;
  z-index: 2;
}

.achievement-desc {
  font-size: 12px;
  color: var(--theme-text-color);
  line-height: 1.5;
  flex: 1;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  position: relative;
  z-index: 2;
}

/* 锁定成就进度条：显示距离解锁还差多少 */
.achievement-progress {
  margin-top: auto;
  padding-top: 8px;
  position: relative;
  z-index: 2;
}

.achievement-progress-track {
  height: 4px;
  border-radius: 2px;
  background: var(--theme-border-color);
  overflow: hidden;
}

.achievement-progress-fill {
  height: 100%;
  background: #8aa8a2;
  border-radius: 2px;
  transition: width 0.4s ease;
}

.achievement-progress-text {
  margin-top: 4px;
  font-size: 10px;
  color: var(--theme-text-color);
  opacity: 0.55;
  font-variant-numeric: tabular-nums;
}

.achievement-status {
  position: absolute;
  top: 14px;
  right: 12px;
  z-index: 3;
}

/* 解锁日期：盖章/钢印效果，叠加覆盖在卡片内容上 */
.unlocked-stamp {
  display: inline-block;
  padding: 4px 14px 3px;
  border: 1.5px solid #b0564d;
  border-radius: 6px;
  color: #b0564d;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 2px;
  transform: rotate(-12deg);
  opacity: 0.85;
  box-shadow: inset 0 0 0 1px rgba(176, 86, 77, 0.3), 0 1px 3px rgba(0, 0, 0, 0.08);
}

.stamp-check {
  margin-right: 4px;
  font-weight: 900;
}

.achievement-lock {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 3;
}

.lock-icon {
  font-size: 14px;
  opacity: 0.5;
}

/* 最近成就 */
.recent-achievements {
  background: var(--theme-background-light-color);
  border: 1px solid var(--theme-border-color);
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 24px;
}

.recent-achievements h3 {
  font-size: 14px;
  font-weight: 600;
  color: var(--theme-text-color);
  margin-bottom: 16px;
}

.recent-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.recent-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  background: var(--theme-background-color);
  border-radius: 8px;
}

.recent-icon {
  font-size: 24px;
}

.recent-name {
  flex: 1;
  font-size: 14px;
  color: var(--theme-text-color);
}

.recent-date {
  font-size: 12px;
  color: var(--theme-text-color);
}

/* 操作按钮 */
.actions-section {
  display: flex;
  justify-content: center;
  gap: 12px;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  border-radius: 8px;
  border: 1px solid var(--theme-border-color);
  background: var(--theme-background-light-color);
  color: var(--theme-text-color);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn:hover {
  background: #8aa8a2;
  color: #0b1a14;
}

.action-btn.reset:hover {
  background: #f56c6c;
  color: white;
}

.btn-icon {
  font-size: 16px;
}

.footer-space {
  height: 40px;
}

/* 学习统计概览 */
.stats-overview {
  margin-bottom: 32px;
}

.stats-overview h2 {
  font-size: 20px;
  font-weight: 600;
  color: var(--theme-text-color);
  margin-bottom: 20px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 16px;
}

.stat-card {
  background: var(--theme-background-light-color);
  border: 1px solid var(--theme-border-color);
  border-radius: 12px;
  padding: 20px;
  text-align: center;
  width: 100%;
  transition: transform 0.3s ease-out, box-shadow 0.3s ease-out, border-color 0.2s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  will-change: transform;
  transform-style: preserve-3d;
  transform: perspective(900px) rotateX(var(--tilt-x, 0deg)) rotateY(var(--tilt-y, 0deg)) scale(var(--card-scale, 1));
  position: relative;
  overflow: hidden;
  box-shadow: var(--shadow-x, 0px) var(--shadow-y, 4px) 12px rgba(0, 0, 0, 0.06);
}

.stat-card::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: radial-gradient(circle at var(--glare-x, 50%) var(--glare-y, 50%), rgba(255, 255, 255, 0.08), transparent 60%);
  opacity: 0;
  transition: opacity 0.3s ease;
  pointer-events: none;
  z-index: 1;
}

.stat-card:hover::after {
  opacity: 1;
}

.stat-card:hover {
  --card-scale: 1.02;
  box-shadow: var(--shadow-x, 0px) var(--shadow-y, 6px) 18px rgba(0, 0, 0, 0.08);
}

/* 今日目标卡片：实时进度指引 */
.goal-card {
  margin-top: 24px;
  background: var(--theme-background-light-color);
  border: 1px solid var(--theme-border-color);
  border-radius: 16px;
  padding: 20px;
}
.goal-card h2 {
  margin: 0 0 16px;
  font-size: 18px;
  display: flex;
  align-items: center;
  gap: 10px;
}
.goal-status {
  font-size: 12px;
  font-weight: 400;
  color: var(--theme-text-color);
  padding: 2px 10px;
  border-radius: 20px;
  border: 1px solid var(--theme-border-color);
}
.goal-status.done {
  color: #5c7a74;
  border-color: #8aa8a2;
}
.goal-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.goal-line {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;
  color: var(--theme-text-color);
}
.goal-name {
  width: 90px;
  flex: 0 0 auto;
  font-weight: 600;
}
.goal-bar {
  flex: 1;
  height: 10px;
  border-radius: 5px;
  background: var(--theme-border-color);
  overflow: hidden;
}
.goal-fill {
  display: block;
  height: 100%;
  background: #8aa8a2;
  border-radius: 5px;
  transition: width .3s ease;
}
.goal-num {
  flex: 0 0 auto;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}
.goal-line.done .goal-name, .goal-line.done .goal-num {
  color: #5c7a74;
}
.goal-line.done .goal-fill {
  background: #8aa8a2;
}

.stat-icon {
  font-size: 28px;
  margin-bottom: 8px;
  display: block;
  opacity: 0.75;
  position: relative;
  z-index: 2;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: var(--theme-text-color);
  display: block;
  margin-bottom: 4px;
  position: relative;
  z-index: 2;
}

.stat-label {
  font-size: 12px;
  color: var(--theme-text-color);
  position: relative;
  z-index: 2;
}

.stat-progress {
  width: 100%;
  height: 4px;
  background: var(--theme-border-color);
  border-radius: 2px;
  margin-top: 12px;
  overflow: hidden;
  position: relative;
  z-index: 2;
}

.stat-progress-fill {
  height: 100%;
  background: #8aa8a2;
  border-radius: 2px;
  transition: width 0.3s ease;
}

/* 成就筛选 */
.achievements-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 12px;
}

.achievements-header h2 {
  font-size: 20px;
  font-weight: 600;
  color: var(--theme-text-color);
  margin: 0;
}

.achievements-filter {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.filter-btn {
  padding: 6px 14px;
  border: 1px solid var(--theme-border-color);
  background: var(--theme-background-light-color);
  color: var(--theme-text-color);
  border-radius: 20px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.filter-btn:hover {
  border-color: #8aa8a2;
  color: #5c7a74;
}

.filter-btn.active {
  background: rgba(138, 168, 162, 0.15);
  color: #5c7a74;
  border-color: #8aa8a2;
  font-weight: 600;
}

/* 成就稀有度 */
.achievement-card.epic.unlocked {
  border-color: #887c9e;
  box-shadow: var(--shadow-x, 0px) var(--shadow-y, 6px) 16px rgba(0, 0, 0, 0.08), 0 0 12px rgba(136, 124, 158, 0.12);
}

.achievement-card.epic.unlocked:hover {
  box-shadow: var(--shadow-x, 0px) var(--shadow-y, 8px) 24px rgba(0, 0, 0, 0.1), 0 0 16px rgba(136, 124, 158, 0.18);
}

.achievement-card.legendary.unlocked {
  border-color: #b59872;
  box-shadow: var(--shadow-x, 0px) var(--shadow-y, 6px) 16px rgba(0, 0, 0, 0.08), 0 0 12px rgba(181, 152, 114, 0.12);
  animation: legendaryPulse 3s ease-in-out infinite;
}

.achievement-card.legendary.unlocked:hover {
  box-shadow: var(--shadow-x, 0px) var(--shadow-y, 8px) 24px rgba(0, 0, 0, 0.1), 0 0 16px rgba(181, 152, 114, 0.18);
}

@keyframes legendaryPulse {
  0%, 100% { box-shadow: var(--shadow-x, 0px) var(--shadow-y, 6px) 16px rgba(0, 0, 0, 0.08), 0 0 12px rgba(181, 152, 114, 0.12); }
  50% { box-shadow: var(--shadow-x, 0px) var(--shadow-y, 8px) 20px rgba(0, 0, 0, 0.09), 0 0 20px rgba(181, 152, 114, 0.2); }
}

/* 操作按钮样式 */
.action-btn.export:hover {
  background: #6a9e7a;
  color: white;
}

.action-btn.import:hover {
  background: #6a8ab0;
  color: white;
}

/* 响应式 */
@media (max-width: 768px) {
  .achievements-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 480px) {
  .achievements-grid {
    grid-template-columns: 1fr;
  }
}
</style>
