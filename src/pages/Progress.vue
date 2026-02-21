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
        <h2>成就系统</h2>
        <div class="achievements-grid">
          <div
            v-for="achievement in progress.allAchievements"
            :key="achievement.id"
            class="achievement-card"
            :class="{ 'unlocked': isAchievementUnlocked(achievement.id), 'rare': isRare(achievement.id) }"
          >
            <div class="achievement-icon">{{ achievement.icon }}</div>
            <div class="achievement-name">{{ achievement.name }}</div>
            <div class="achievement-desc">{{ achievement.description }}</div>
            <div class="achievement-status" v-if="isAchievementUnlocked(achievement.id)">
              <span class="unlocked-date">{{ formatUnlockDate(achievement.id) }}</span>
            </div>
            <div class="achievement-lock" v-else>
              <span class="lock-icon">🔒</span>
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
        <button class="action-btn reset" @click="resetProgress">
          <span class="btn-icon">🔄</span>
          重置进度
        </button>
      </div>

      <div class="footer-space"/>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useProgressStore } from '../stores/progress.js'
import TopStatusBar from '../components/TopStatusBar.vue'

const progress = useProgressStore()
const RARE_ACHIEVEMENTS = ['ten-thousand', 'streak-30', 'combo-50', 'accuracy-95']

const PATH_ICONS = {
  basics: '🌱',
  intermediate: '📈',
  advanced: '🏆'
}

function getPathIcon(pathId) {
  return PATH_ICONS[pathId] || '📚'
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

onMounted(() => {
  progress.load()
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
