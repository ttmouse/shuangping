<template>
  <div class="progress-page">
    <TopStatusBar />

    <div class="page-content">
      <div class="header">
        <h1>学习进度</h1>
        <p class="subtitle">追踪你的双拼学习之旅</p>
      </div>

      <!-- 总体进度 -->
      <div class="overall-progress">
        <div class="progress-ring">
          <svg viewBox="0 0 120 120">
            <circle class="progress-bg" cx="60" cy="60" r="54"/>
            <circle
              class="progress-fill"
              cx="60"
              cy="60"
              r="54"
              :style="{ strokeDashoffset: 339.292 - (339.292 * progress.overallProgress / 100) }"
            />
          </svg>
          <div class="progress-text">
            <span class="progress-percent">{{ progress.overallProgress }}</span>
            <span class="progress-label">%</span>
          </div>
        </div>
        <div class="progress-info">
          <div class="info-item">
            <span class="info-value">{{ progress.completedStages.length }}</span>
            <span class="info-label">已完成阶段</span>
          </div>
          <div class="info-item">
            <span class="info-value">{{ progress.unlockedAchievements.length }}</span>
            <span class="info-label">已解锁成就</span>
          </div>
          <div class="info-item">
            <span class="info-value">{{ progress.maxCombo }}</span>
            <span class="info-label">最高连击</span>
          </div>
        </div>
      </div>

      <!-- 学习统计概览 -->
      <div class="stats-overview">
        <h2>学习统计</h2>
        <div class="stats-grid">
          <div class="stat-card">
            <span class="stat-icon"><svg viewBox="0 0 16 16" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M8 2c.6 2.2-1.6 3.2-1.6 5.2a2.6 2.6 0 0 0 5.2 0c0-1.4-.5-2.4-1-3.4C9.8 5 8.8 4 8 2z"/><path d="M6.5 10.5a2.5 2.5 0 0 0 3 0"/></svg></span>
            <span class="stat-value">{{ streakDays }}</span>
            <span class="stat-label">连续练习天数</span>
          </div>
          <div class="stat-card">
            <span class="stat-icon"><svg viewBox="0 0 16 16" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M2 4.5h12v7H2z"/><path d="M2 7h12M10.5 7V9"/></svg></span>
            <span class="stat-value">{{ progress.totalPracticeSessions }}</span>
            <span class="stat-label">总练习次数</span>
          </div>
          <div class="stat-card">
            <span class="stat-icon"><svg viewBox="0 0 16 16" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="8" cy="8" r="5.5"/><path d="M8 5v3l2 1.5"/></svg></span>
            <span class="stat-value">{{ Math.round(progress.learningTimeTotal) }}</span>
            <span class="stat-label">学习时长(分钟)</span>
          </div>
          <div class="stat-card">
            <span class="stat-icon"><svg viewBox="0 0 16 16" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M2 4.5h12v7H2z"/><path d="M2 7h12M5 4.5 8 7l3-2.5"/></svg></span>
            <span class="stat-value">{{ progress.dailyGoals.completedDates.length }}</span>
            <span class="stat-label">完成目标天数</span>
          </div>
        </div>
      </div>

      <!-- 今日目标：实时进度指引 -->
      <div class="goal-card">
        <h2>今日目标 <small class="goal-status" :class="{ done: goal.allDone }">{{ goal.allDone ? '已达成' : '进行中' }}</small></h2>
        <div class="goal-grid">
          <div class="goal-line" :class="{ done: goal.timeDoneFlag }">
            <span class="goal-name"><svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="8" cy="8" r="5.5"/><path d="M8 5v3l2 1.5"/></svg> 练习时长</span>
            <span class="goal-bar"><span class="goal-fill" :style="{ width: goal.timePercent + '%' }"></span></span>
            <span class="goal-num">{{ goal.timeDone }} / {{ goal.timeTarget }} 分钟</span>
          </div>
          <div class="goal-line" :class="{ done: goal.accuracyDone }">
            <span class="goal-name"><svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="8" cy="8" r="5.5"/><circle cx="8" cy="8" r="1.8"/></svg> 正确率</span>
            <span class="goal-num">{{ goal.accuracy }}% <small>（目标 ≥{{ goal.accuracyTarget }}%）</small></span>
          </div>
          <div class="goal-line" :class="{ done: goal.sessionDoneFlag }">
            <span class="goal-name"><svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M13.5 8a5.5 5.5 0 1 1-1.6-3.9M13.5 2.5V6H10"/></svg> 练习次数</span>
            <span class="goal-num">{{ goal.sessionDone }} / {{ goal.sessionTarget }} 次</span>
          </div>
          <div class="goal-line" :class="{ done: goal.mistakesDone }">
            <span class="goal-name"><svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M6 11 4 9l-2 3h12"/><path d="M5 9h6"/></svg> 错词清零</span>
            <span class="goal-num">{{ goal.mistakesDone ? '已清完' : '还有 ' + goal.mistakes + ' 个错词待练' }}</span>
          </div>
        </div>
      </div>

      <!-- 学习路径 -->
      <div class="learning-path">
        <h2>学习路径</h2>
        <div class="path-list">
          <div
            v-for="path in progress.learningPath"
            :key="path.id"
            class="path-card"
            :class="{ 'completed': isPathCompleted(path.id) }"
          >
            <div class="path-header">
              <div class="path-icon">{{ getPathIcon(path.id) }}</div>
              <div class="path-title">
                <h3>{{ path.name }}</h3>
                <p>{{ path.description }}</p>
              </div>
              <div class="path-badge" v-if="isPathCompleted(path.id)">
                <span class="badge-icon">✓</span>
              </div>
            </div>
            <div class="stages">
              <div
                v-for="(stage, index) in path.stages"
                :key="stage.id"
                class="stage-item"
                :class="{
                  'completed': isStageCompleted(stage.id),
                  'current': isCurrentStage(stage.id),
                  'locked': isStageLocked(path.id, index)
                }"
              >
                <div class="stage-connector" v-if="index > 0"/>
                <div class="stage-dot">
                  <span v-if="isStageCompleted(stage.id)">✓</span>
                  <span v-else-if="isCurrentStage(stage.id)">●</span>
                  <span v-else>○</span>
                </div>
                <div class="stage-info">
                  <span class="stage-name">{{ stage.name }}</span>
                  <span class="stage-requirement" v-if="!isStageCompleted(stage.id)">
                    目标: {{ stage.minAccuracy }}% 准确率, {{ stage.minChars }} 字符
                  </span>
                </div>
              </div>
            </div>
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
              @click="currentFilter = filter.key"
            >
              {{ filter.label }}
            </button>
          </div>
        </div>
        <div class="achievements-grid">
          <div
            v-for="achievement in filteredAchievements"
            :key="achievement.id"
            class="achievement-card"
            :class="{ 
              'unlocked': isAchievementUnlocked(achievement.id), 
              'rare': isRare(achievement.id),
              'epic': isEpic(achievement.id),
              'legendary': isLegendary(achievement.id)
            }"
          >
            <div class="achievement-rarity" :class="achievement.rarity || 'common'"></div>
            <div class="achievement-icon">{{ achievement.icon }}</div>
            <div class="achievement-name">{{ achievement.name }}</div>
            <div class="achievement-desc">{{ achievement.description }}</div>
            <div class="achievement-status" v-if="isAchievementUnlocked(achievement.id)">
              <span class="unlocked-date">{{ formatUnlockDate(achievement.id) }}</span>
            </div>
            <div class="achievement-lock" v-else>
              <span class="lock-icon"><svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3.5" y="7" width="9" height="6" rx="1.5"/><path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2"/></svg></span>
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
          <span class="btn-icon"><svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M8 11V3m0 0L5 6m3-3 3 3"/><path d="M2.5 12v1h11v-1"/></svg></span>
          导出进度
        </button>
        <button class="action-btn import" @click="triggerImport">
          <span class="btn-icon"><svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M8 3v8m0 0 3-3m-3 3L5 8"/><path d="M2.5 12v1h11v-1"/></svg></span>
          导入进度
        </button>
        <button class="action-btn reset" @click="resetProgress">
          <span class="btn-icon"><svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M13.5 8a5.5 5.5 0 1 1-1.6-3.9M13.5 2.5V6H10"/></svg></span>
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
import { ref, computed, onMounted } from 'vue'
import { useProgressStore } from '../stores/progress.js'
import { useStatsStore } from '../stores/stats.js'
import TopStatusBar from '../components/TopStatusBar.vue'

const progress = useProgressStore()
const goal = computed(() => progress.todayGoal)
const stats = useStatsStore()
const importInput = ref(null)
const currentFilter = ref('all')

const RARE_ACHIEVEMENTS = ['ten-thousand', 'streak-30', 'combo-50', 'accuracy-95']
const EPIC_ACHIEVEMENTS = ['fifty-thousand', 'accuracy-100', 'speed-150', 'streak-100', 'combo-100', 'advanced-complete']
const LEGENDARY_ACHIEVEMENTS = ['all-complete']

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

const PATH_ICONS = {
  basics: '基',
  intermediate: '中',
  advanced: '高'
}

function getPathIcon(pathId) {
  return PATH_ICONS[pathId] || '基'
}

function isPathCompleted(pathId) {
  return progress.completedPaths.includes(pathId)
}

function isStageCompleted(stageId) {
  return progress.completedStages.includes(stageId)
}

function isCurrentStage(stageId) {
  return progress.currentStage?.id === stageId
}

function isStageLocked(pathId, stageIndex) {
  const path = progress.learningPath.find(p => p.id === pathId)
  if (!path || stageIndex === 0) return false
  // 前一阶段未完成则锁定
  return !progress.completedStages.includes(path.stages[stageIndex - 1].id)
}

function isAchievementUnlocked(achievementId) {
  return progress.unlockedAchievements.includes(achievementId)
}

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
  color: var(--theme-main-text-color);
  margin-bottom: 8px;
}

.subtitle {
  color: var(--theme-text-color);
  font-size: 14px;
}

/* 总体进度 */
.overall-progress {
  display: flex;
  align-items: center;
  gap: 40px;
  background: var(--theme-background-light-color);
  border: 1px solid var(--theme-border-color);
  border-radius: 16px;
  padding: 32px;
  margin-bottom: 32px;
}

.progress-ring {
  position: relative;
  width: 140px;
  height: 140px;
  flex-shrink: 0;
}

.progress-ring svg {
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}

.progress-bg {
  fill: none;
  stroke: var(--theme-border-color);
  stroke-width: 8;
}

.progress-fill {
  fill: none;
  stroke: #35e2b7;
  stroke-width: 8;
  stroke-linecap: round;
  stroke-dasharray: 339.292;
  transition: stroke-dashoffset 0.8s ease;
}

.progress-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
}

.progress-percent {
  font-size: 42px;
  font-weight: 800;
  color: var(--theme-main-text-color);
  line-height: 1;
}

.progress-label {
  font-size: 18px;
  color: var(--theme-text-color);
}

.progress-info {
  flex: 1;
  display: flex;
  justify-content: space-around;
}

.info-item {
  text-align: center;
}

.info-value {
  display: block;
  font-size: 32px;
  font-weight: 700;
  color: var(--theme-main-text-color);
  margin-bottom: 4px;
}

.info-label {
  font-size: 12px;
  color: var(--theme-text-color);
}

/* 学习路径 */
.learning-path {
  margin-bottom: 32px;
}

.learning-path h2 {
  font-size: 20px;
  font-weight: 600;
  color: var(--theme-main-text-color);
  margin-bottom: 20px;
}

.path-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.path-card {
  background: var(--theme-background-light-color);
  border: 1px solid var(--theme-border-color);
  border-radius: 12px;
  padding: 24px;
  transition: all 0.3s;
}

.path-card.completed {
  border-color: #35e2b7;
  background: linear-gradient(135deg, var(--theme-background-light-color) 0%, rgba(53, 226, 183, 0.05) 100%);
}

.path-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
}

.path-icon {
  font-size: 32px;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--theme-background-color);
  border-radius: 12px;
}

.path-title {
  flex: 1;
}

.path-title h3 {
  font-size: 18px;
  font-weight: 600;
  color: var(--theme-main-text-color);
  margin-bottom: 4px;
}

.path-title p {
  font-size: 13px;
  color: var(--theme-text-color);
}

.path-badge {
  width: 32px;
  height: 32px;
  background: #35e2b7;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.badge-icon {
  color: #fff;
  font-weight: 700;
  font-size: 16px;
}

/* 阶段列表 */
.stages {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-left: 8px;
}

.stage-item {
  display: flex;
  align-items: center;
  gap: 12px;
  position: relative;
}

.stage-connector {
  position: absolute;
  left: 11px;
  top: -12px;
  width: 2px;
  height: 12px;
  background: var(--theme-border-color);
}

.stage-item.completed .stage-connector {
  background: #35e2b7;
}

.stage-dot {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  color: var(--theme-text-color);
  background: var(--theme-background-color);
  border: 2px solid var(--theme-border-color);
  border-radius: 50%;
  z-index: 1;
}

.stage-item.completed .stage-dot {
  background: #35e2b7;
  border-color: #35e2b7;
  color: #fff;
}

.stage-item.current .stage-dot {
  border-color: #35e2b7;
  color: #35e2b7;
  animation: pulse 2s infinite;
}

.stage-item.locked .stage-dot {
  opacity: 0.5;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

.stage-info {
  display: flex;
  flex-direction: column;
}

.stage-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--theme-main-text-color);
}

.stage-item.locked .stage-name {
  opacity: 0.5;
}

.stage-requirement {
  font-size: 11px;
  color: var(--theme-text-color);
  margin-top: 2px;
}

/* 成就系统 */
.achievements-section {
  margin-bottom: 32px;
}

.achievements-section h2 {
  font-size: 20px;
  font-weight: 600;
  color: var(--theme-main-text-color);
  margin-bottom: 20px;
}

.achievements-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 16px;
}

.achievement-card {
  background: var(--theme-background-light-color);
  border: 1px solid var(--theme-border-color);
  border-radius: 12px;
  padding: 20px 16px;
  text-align: center;
  position: relative;
  transition: all 0.2s;
  opacity: 0.6;
}

.achievement-card.unlocked {
  opacity: 1;
  border-color: #35e2b7;
}

.achievement-card.rare.unlocked {
  border-color: #ffd700;
  background: linear-gradient(135deg, var(--theme-background-light-color) 0%, rgba(255, 215, 0, 0.05) 100%);
}

.achievement-icon {
  font-size: 40px;
  margin-bottom: 12px;
  filter: grayscale(100%);
  opacity: 0.5;
  transition: all 0.3s;
}

.achievement-card.unlocked .achievement-icon {
  filter: grayscale(0%);
  opacity: 1;
  animation: iconPop 0.5s ease;
}

@keyframes iconPop {
  0% { transform: scale(0); }
  70% { transform: scale(1.2); }
  100% { transform: scale(1); }
}

.achievement-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--theme-main-text-color);
  margin-bottom: 4px;
}

.achievement-desc {
  font-size: 11px;
  color: var(--theme-text-color);
  line-height: 1.4;
}

.achievement-status {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--theme-border-color);
}

.unlocked-date {
  font-size: 11px;
  color: #35e2b7;
}

.achievement-lock {
  position: absolute;
  top: 8px;
  right: 8px;
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
  color: var(--theme-main-text-color);
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
  color: var(--theme-main-text-color);
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
  background: var(--theme-menu-hover-color);
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
  color: var(--theme-main-text-color);
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
  transition: all 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
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
  color: var(--theme-menu-text-color);
  padding: 2px 10px;
  border-radius: 20px;
  border: 1px solid var(--theme-border-color);
}
.goal-status.done {
  color: #2c8f6a;
  border-color: #3db389;
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
  background: var(--theme-menu-hover-color);
  border-radius: 5px;
  transition: width .3s ease;
}
.goal-num {
  flex: 0 0 auto;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}
.goal-line.done .goal-name, .goal-line.done .goal-num {
  color: #3db389;
}
.goal-line.done .goal-fill {
  background: #3db389;
}

.stat-icon {
  font-size: 28px;
  margin-bottom: 8px;
  display: block;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: var(--theme-main-text-color);
  display: block;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 12px;
  color: var(--theme-text-color);
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
  color: var(--theme-main-text-color);
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
  background: var(--theme-menu-hover-color);
}

.filter-btn.active {
  background: #35e2b7;
  color: #0b1a14;
  border-color: #35e2b7;
}

/* 成就稀有度 */
.achievement-rarity {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  border-radius: 12px 12px 0 0;
}

.achievement-rarity.common {
  background: linear-gradient(90deg, #9e9e9e, #bdbdbd);
}

.achievement-rarity.uncommon {
  background: linear-gradient(90deg, #4caf50, #81c784);
}

.achievement-rarity.rare {
  background: linear-gradient(90deg, #2196f3, #64b5f6);
}

.achievement-rarity.epic {
  background: linear-gradient(90deg, #9c27b0, #ce93d8);
}

.achievement-rarity.legendary {
  background: linear-gradient(90deg, #ff9800, #ffd54f, #ff9800);
  background-size: 200% 100%;
  animation: legendaryGlow 2s linear infinite;
}

@keyframes legendaryGlow {
  0% { background-position: 0% 50%; }
  100% { background-position: 200% 50%; }
}

.achievement-card.epic.unlocked {
  border-color: #9c27b0;
  box-shadow: 0 0 20px rgba(156, 39, 176, 0.2);
}

.achievement-card.legendary.unlocked {
  border-color: #ff9800;
  box-shadow: 0 0 30px rgba(255, 152, 0, 0.3);
  animation: legendaryPulse 3s ease-in-out infinite;
}

@keyframes legendaryPulse {
  0%, 100% { box-shadow: 0 0 30px rgba(255, 152, 0, 0.3); }
  50% { box-shadow: 0 0 50px rgba(255, 152, 0, 0.5); }
}

/* 操作按钮样式 */
.action-btn.export:hover {
  background: #4caf50;
  color: white;
}

.action-btn.import:hover {
  background: #2196f3;
  color: white;
}

/* 响应式 */
@media (max-width: 768px) {
  .overall-progress {
    flex-direction: column;
    gap: 24px;
    text-align: center;
  }

  .progress-info {
    width: 100%;
  }

  .achievements-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .path-header {
    flex-wrap: wrap;
  }
}

@media (max-width: 480px) {
  .achievements-grid {
    grid-template-columns: 1fr;
  }

  .info-value {
    font-size: 24px;
  }

  .progress-percent {
    font-size: 36px;
  }
}
</style>
