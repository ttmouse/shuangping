<template>
  <div class="stats-page">
    <TopStatusBar />

    <div class="page-content">
      <div class="header">
        <h1>练习统计</h1>
        <p class="subtitle">追踪你的双拼练习进度与表现</p>
      </div>

      <!-- 概览卡片 -->
      <div class="overview-cards">
        <div class="stat-card">
          <div class="stat-icon">📊</div>
          <div class="stat-value">{{ stats.overallAccuracy }}%</div>
          <div class="stat-label">总体准确率</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">⚡</div>
          <div class="stat-value">{{ stats.averageSpeed }}</div>
          <div class="stat-label">平均速度 (字/分)</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">🔥</div>
          <div class="stat-value">{{ stats.streakDays }}</div>
          <div class="stat-label">连续练习天数</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">⏱️</div>
          <div class="stat-value">{{ formatTime(stats.totalPracticeTime) }}</div>
          <div class="stat-label">总练习时长</div>
        </div>
      </div>

      <!-- 今日统计 -->
      <div class="today-section">
        <h2>今日练习</h2>
        <div class="today-grid">
          <div class="today-item">
            <span class="today-value">{{ todayStats.chars }}</span>
            <span class="today-label">字符</span>
          </div>
          <div class="today-item">
            <span class="today-value">{{ todayStats.sessions || 0 }}</span>
            <span class="today-label">场次</span>
          </div>
          <div class="today-item">
            <span class="today-value">{{ formatDuration(todayStats.time) }}</span>
            <span class="today-label">时长</span>
          </div>
          <div class="today-item">
            <span class="today-value" :class="{ 'good': todayAccuracy >= 90, 'warning': todayAccuracy < 80 }">
              {{ todayAccuracy }}%
            </span>
            <span class="today-label">准确率</span>
          </div>
        </div>
      </div>

      <!-- 图表区域 -->
      <div class="charts-section">
        <div class="chart-card">
          <h3>近7天练习量</h3>
          <div class="chart-container">
            <canvas ref="volumeChart" width="600" height="200"></canvas>
          </div>
        </div>

        <div class="chart-row">
          <div class="chart-card half">
            <h3>速度趋势</h3>
            <div class="chart-container small">
              <canvas ref="speedChart" width="280" height="150"></canvas>
            </div>
          </div>
          <div class="chart-card half">
            <h3>准确率趋势</h3>
            <div class="chart-container small">
              <canvas ref="accuracyChart" width="280" height="150"></canvas>
            </div>
          </div>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="actions-section">
        <h3>数据管理</h3>
        <div class="action-buttons">
          <button class="action-btn export-json" @click="exportJSON">
            <span class="btn-icon">📥</span>
            导出 JSON
          </button>
          <button class="action-btn export-csv" @click="exportCSV">
            <span class="btn-icon">📄</span>
            导出 CSV
          </button>
          <button class="action-btn clear-data" @click="clearStats">
            <span class="btn-icon">🗑️</span>
            清除数据
          </button>
        </div>
      </div>

      <!-- 练习历史 -->
      <div class="history-section" v-if="recentHistory.length">
        <h3>最近练习记录</h3>
        <div class="history-list">
          <div v-for="item in recentHistory" :key="item.id" class="history-item">
            <div class="history-info">
              <span class="history-date">{{ formatDate(item.date) }}</span>
              <span class="history-type">{{ getTypeLabel(item.type) }}</span>
            </div>
            <div class="history-stats">
              <span v-if="item.chars !== undefined" class="history-chars">{{ item.chars }} 字</span>
              <span v-if="item.speed" class="history-speed">{{ item.speed }} 字/分</span>
              <span v-if="item.duration" class="history-duration">{{ formatDuration(item.duration) }}</span>
              <span v-if="item.correct !== undefined" class="history-accuracy" :class="{ 'good': item.correct/item.chars >= 0.9 }">
                {{ item.chars > 0 ? Math.round(item.correct/item.chars*100) : 100 }}%
              </span>
            </div>
          </div>
        </div>
      </div>

      <div class="footer-space" />
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, nextTick } from 'vue'
import { useStatsStore } from '../stores/stats.js'
import TopStatusBar from '../components/TopStatusBar.vue'

const stats = useStatsStore()
const volumeChart = ref(null)
const speedChart = ref(null)
const accuracyChart = ref(null)

const todayStats = computed(() => stats.todayStats)
const todayAccuracy = computed(() => {
  const t = todayStats.value
  return t.chars > 0 ? Math.round((t.correct / t.chars) * 100) : 100
})

const recentHistory = computed(() => {
  return stats.history
    .filter(h => h.type === 'session')
    .slice(-10)
    .reverse()
})

onMounted(() => {
  stats.load()
  nextTick(() => {
    drawVolumeChart()
    drawSpeedChart()
    drawAccuracyChart()
  })
})

// 绘制练习量柱状图
function drawVolumeChart() {
  const canvas = volumeChart.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  const dpr = window.devicePixelRatio || 1
  const rect = canvas.getBoundingClientRect()

  canvas.width = rect.width * dpr
  canvas.height = rect.height * dpr
  ctx.scale(dpr, dpr)

  const data = stats.last7DaysData
  if (!data.length) return

  const padding = { top: 20, right: 20, bottom: 30, left: 40 }
  const width = rect.width - padding.left - padding.right
  const height = rect.height - padding.top - padding.bottom

  // 清空画布
  ctx.clearRect(0, 0, rect.width, rect.height)

  // 找出最大值
  const maxChars = Math.max(...data.map(d => d.chars), 1)

  // 绘制网格线
  ctx.strokeStyle = 'var(--theme-border-color)'
  ctx.lineWidth = 1
  for (let i = 0; i <= 4; i++) {
    const y = padding.top + (height / 4) * i
    ctx.beginPath()
    ctx.moveTo(padding.left, y)
    ctx.lineTo(padding.left + width, y)
    ctx.stroke()
  }

  // 绘制柱状图
  const barWidth = width / data.length * 0.6
  const barGap = width / data.length * 0.4

  data.forEach((d, i) => {
    const x = padding.left + (width / data.length) * i + barGap / 2
    const barHeight = (d.chars / maxChars) * height
    const y = padding.top + height - barHeight

    // 渐变填充
    const gradient = ctx.createLinearGradient(0, y, 0, y + barHeight)
    gradient.addColorStop(0, '#35e2b7')
    gradient.addColorStop(1, '#2aa88a')

    ctx.fillStyle = gradient
    ctx.fillRect(x, y, barWidth, barHeight)

    // 数值标签
    if (d.chars > 0) {
      ctx.fillStyle = 'var(--theme-main-text-color)'
      ctx.font = '12px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(d.chars, x + barWidth / 2, y - 5)
    }

    // 日期标签
    ctx.fillStyle = 'var(--theme-text-color)'
    ctx.font = '11px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(d.date, x + barWidth / 2, padding.top + height + 15)
  })

  // Y轴标签
  ctx.fillStyle = 'var(--theme-text-color)'
  ctx.font = '10px sans-serif'
  ctx.textAlign = 'right'
  for (let i = 0; i <= 4; i++) {
    const value = Math.round(maxChars * (1 - i / 4))
    const y = padding.top + (height / 4) * i + 3
    ctx.fillText(value, padding.left - 5, y)
  }
}

// 绘制速度趋势折线图
function drawSpeedChart() {
  const canvas = speedChart.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  const dpr = window.devicePixelRatio || 1
  const rect = canvas.getBoundingClientRect()

  canvas.width = rect.width * dpr
  canvas.height = rect.height * dpr
  ctx.scale(dpr, dpr)

  const data = stats.speedTrend
  if (data.length < 2) {
    drawNoData(ctx, rect.width, rect.height)
    return
  }

  drawLineChart(ctx, data, rect.width, rect.height, 'speed', '#67c23a')
}

// 绘制准确率趋势折线图
function drawAccuracyChart() {
  const canvas = accuracyChart.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  const dpr = window.devicePixelRatio || 1
  const rect = canvas.getBoundingClientRect()

  canvas.width = rect.width * dpr
  canvas.height = rect.height * dpr
  ctx.scale(dpr, dpr)

  const data = stats.accuracyTrend
  if (data.length < 2) {
    drawNoData(ctx, rect.width, rect.height)
    return
  }

  drawLineChart(ctx, data, rect.width, rect.height, 'accuracy', '#35e2b7')
}

function drawLineChart(ctx, data, width, height, key, color) {
  const padding = { top: 20, right: 20, bottom: 30, left: 40 }
  const chartWidth = width - padding.left - padding.right
  const chartHeight = height - padding.top - padding.bottom

  ctx.clearRect(0, 0, width, height)

  const values = data.map(d => d[key])
  const maxVal = Math.max(...values, key === 'accuracy' ? 100 : 50)
  const minVal = 0

  // 网格线
  ctx.strokeStyle = 'var(--theme-border-color)'
  ctx.lineWidth = 1
  for (let i = 0; i <= 4; i++) {
    const y = padding.top + (chartHeight / 4) * i
    ctx.beginPath()
    ctx.moveTo(padding.left, y)
    ctx.lineTo(padding.left + chartWidth, y)
    ctx.stroke()
  }

  // 折线
  ctx.strokeStyle = color
  ctx.lineWidth = 2
  ctx.beginPath()
  data.forEach((d, i) => {
    const x = padding.left + (chartWidth / (data.length - 1)) * i
    const y = padding.top + chartHeight - ((d[key] - minVal) / (maxVal - minVal)) * chartHeight
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  })
  ctx.stroke()

  // 数据点
  ctx.fillStyle = color
  data.forEach((d, i) => {
    const x = padding.left + (chartWidth / (data.length - 1)) * i
    const y = padding.top + chartHeight - ((d[key] - minVal) / (maxVal - minVal)) * chartHeight
    ctx.beginPath()
    ctx.arc(x, y, 3, 0, Math.PI * 2)
    ctx.fill()
  })

  // Y轴标签
  ctx.fillStyle = 'var(--theme-text-color)'
  ctx.font = '10px sans-serif'
  ctx.textAlign = 'right'
  for (let i = 0; i <= 4; i++) {
    const value = Math.round(maxVal * (1 - i / 4))
    const y = padding.top + (chartHeight / 4) * i + 3
    ctx.fillText(value, padding.left - 5, y)
  }

  // X轴标签（只显示部分）
  ctx.fillStyle = 'var(--theme-text-color)'
  ctx.font = '10px sans-serif'
  ctx.textAlign = 'center'
  const step = Math.ceil(data.length / 5)
  data.forEach((d, i) => {
    if (i % step === 0) {
      const x = padding.left + (chartWidth / (data.length - 1)) * i
      ctx.fillText(d.date, x, padding.top + chartHeight + 15)
    }
  })
}

function drawNoData(ctx, width, height) {
  ctx.fillStyle = 'var(--theme-text-color)'
  ctx.font = '14px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('数据不足', width / 2, height / 2)
}

// 格式化函数
function formatTime(seconds) {
  const hours = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  if (hours > 0) return `${hours}h ${mins}m`
  return `${mins}m`
}

function formatDuration(seconds) {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  if (mins > 0) return `${mins}:${secs.toString().padStart(2, '0')}`
  return `${secs}s`
}

function formatDate(isoString) {
  const date = new Date(isoString)
  return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`
}

function getTypeLabel(type) {
  const labels = {
    session: '练习',
    char: '单字',
    final: '韵母',
  }
  return labels[type] || type
}

// 导出功能
function exportJSON() {
  const data = stats.exportData()
  const filename = `shuangping-stats-${new Date().toISOString().slice(0, 10)}.json`
  stats.downloadFile(data, filename, 'application/json')
}

function exportCSV() {
  const csv = stats.exportCSV()
  const filename = `shuangping-stats-${new Date().toISOString().slice(0, 10)}.csv`
  stats.downloadFile(csv, filename, 'text/csv')
}

function clearStats() {
  stats.clearAllStats()
}
</script>

<style scoped>
.stats-page {
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

/* 概览卡片 */
.overview-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  background: var(--theme-background-light-color);
  border: 1px solid var(--theme-border-color);
  border-radius: 12px;
  padding: 20px;
  text-align: center;
  transition: transform 0.2s, box-shadow 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.stat-icon {
  font-size: 28px;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 32px;
  font-weight: 700;
  color: var(--theme-main-text-color);
  margin-bottom: 4px;
}

.stat-label {
  font-size: 12px;
  color: var(--theme-text-color);
}

/* 今日统计 */
.today-section {
  background: var(--theme-background-light-color);
  border: 1px solid var(--theme-border-color);
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 24px;
}

.today-section h2 {
  font-size: 16px;
  font-weight: 600;
  color: var(--theme-main-text-color);
  margin-bottom: 16px;
}

.today-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.today-item {
  text-align: center;
  padding: 12px;
  background: var(--theme-background-color);
  border-radius: 8px;
}

.today-value {
  display: block;
  font-size: 24px;
  font-weight: 700;
  color: var(--theme-main-text-color);
  margin-bottom: 4px;
}

.today-value.good {
  color: #67c23a;
}

.today-value.warning {
  color: #f56c6c;
}

.today-label {
  font-size: 12px;
  color: var(--theme-text-color);
}

/* 图表区域 */
.charts-section {
  margin-bottom: 24px;
}

.chart-card {
  background: var(--theme-background-light-color);
  border: 1px solid var(--theme-border-color);
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 16px;
}

.chart-card h3 {
  font-size: 14px;
  font-weight: 600;
  color: var(--theme-main-text-color);
  margin-bottom: 16px;
}

.chart-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.chart-card.half {
  margin-bottom: 0;
}

.chart-container {
  width: 100%;
  height: 200px;
}

.chart-container.small {
  height: 150px;
}

.chart-container canvas {
  width: 100%;
  height: 100%;
}

/* 操作按钮 */
.actions-section {
  background: var(--theme-background-light-color);
  border: 1px solid var(--theme-border-color);
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 24px;
}

.actions-section h3 {
  font-size: 14px;
  font-weight: 600;
  color: var(--theme-main-text-color);
  margin-bottom: 16px;
}

.action-buttons {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border-radius: 8px;
  border: 1px solid var(--theme-border-color);
  background: var(--theme-background-color);
  color: var(--theme-text-color);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn:hover {
  background: var(--theme-menu-hover-color);
  color: #0b1a14;
}

.action-btn.clear-data:hover {
  background: #f56c6c;
  color: white;
}

.btn-icon {
  font-size: 16px;
}

/* 历史记录 */
.history-section {
  background: var(--theme-background-light-color);
  border: 1px solid var(--theme-border-color);
  border-radius: 12px;
  padding: 20px;
}

.history-section h3 {
  font-size: 14px;
  font-weight: 600;
  color: var(--theme-main-text-color);
  margin-bottom: 16px;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.history-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: var(--theme-background-color);
  border-radius: 8px;
}

.history-info {
  display: flex;
  gap: 12px;
  align-items: center;
}

.history-date {
  font-size: 13px;
  color: var(--theme-text-color);
}

.history-type {
  font-size: 11px;
  padding: 2px 8px;
  background: var(--theme-background-light-color);
  border-radius: 4px;
  color: var(--theme-rich-text-color);
}

.history-stats {
  display: flex;
  gap: 16px;
  align-items: center;
}

.history-stats span {
  font-size: 13px;
  color: var(--theme-text-color);
}

.history-accuracy {
  font-weight: 600;
}

.history-accuracy.good {
  color: #67c23a;
}

.footer-space {
  height: 40px;
}

/* 响应式 */
@media (max-width: 768px) {
  .overview-cards {
    grid-template-columns: repeat(2, 1fr);
  }

  .today-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .chart-row {
    grid-template-columns: 1fr;
  }

  .history-item {
    flex-direction: column;
    gap: 8px;
    align-items: flex-start;
  }
}

@media (max-width: 480px) {
  .overview-cards {
    grid-template-columns: 1fr;
  }

  .today-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .action-buttons {
    flex-direction: column;
  }

  .action-btn {
    width: 100%;
    justify-content: center;
  }
}
</style>
