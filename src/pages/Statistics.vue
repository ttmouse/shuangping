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
          <div class="stat-icon"><svg viewBox="0 0 16 16" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="8" cy="8" r="5.5"/><circle cx="8" cy="8" r="1.8"/></svg></div>
          <div class="stat-value">{{ stats.overallAccuracy }}%</div>
          <div class="stat-label">总体准确率</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon"><svg viewBox="0 0 16 16" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M8.5 1.5 3 9h4l-1 6L12 7H8l.5-5.5z"/></svg></div>
          <div class="stat-value">{{ stats.averageSpeed }}</div>
          <div class="stat-label">平均速度 (字/分)</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon"><svg viewBox="0 0 16 16" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M8 2c.6 2.2-1.6 3.2-1.6 5.2a2.6 2.6 0 0 0 5.2 0c0-1.4-.5-2.4-1-3.4C9.8 5 8.8 4 8 2z"/><path d="M6.5 10.5a2.5 2.5 0 0 0 3 0"/></svg></div>
          <div class="stat-value">{{ stats.streakDays }}</div>
          <div class="stat-label">连续练习天数</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon"><svg viewBox="0 0 16 16" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="8" cy="8" r="5.5"/><path d="M8 5v3l2 1.5"/></svg></div>
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
            <span class="today-value">{{ todaySessions }}</span>
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

      <!-- 周对比分析 -->
      <div class="weekly-progress-section" v-if="weeklyProgress">
        <h2>本周对比上周</h2>
        <div class="progress-grid">
          <div class="progress-item">
            <span class="progress-label">速度变化</span>
            <span class="progress-value" :class="{ 'up': weeklyProgress.speedChange > 0, 'down': weeklyProgress.speedChange < 0 }">
              {{ weeklyProgress.speedChange > 0 ? '+' : '' }}{{ weeklyProgress.speedChange }}%
            </span>
          </div>
          <div class="progress-item">
            <span class="progress-label">准确率变化</span>
            <span class="progress-value" :class="{ 'up': weeklyProgress.accuracyChange > 0, 'down': weeklyProgress.accuracyChange < 0 }">
              {{ weeklyProgress.accuracyChange > 0 ? '+' : '' }}{{ weeklyProgress.accuracyChange }}%
            </span>
          </div>
          <div class="progress-item">
            <span class="progress-label">练习量变化</span>
            <span class="progress-value" :class="{ 'up': weeklyProgress.charsChange > 0, 'down': weeklyProgress.charsChange < 0 }">
              {{ weeklyProgress.charsChange > 0 ? '+' : '' }}{{ weeklyProgress.charsChange }}%
            </span>
          </div>
        </div>
      </div>

      <!-- 时段分析 -->
      <div class="time-slot-section">
        <h2>时段分析</h2>
        <div class="time-slot-grid">
          <div v-for="(data, slot) in timeSlotAnalysis" :key="slot" class="time-slot-item" :class="{ 'active': data.sessions > 0 }">
            <span class="slot-name">{{ slotNames[slot] }}</span>
            <span class="slot-sessions">{{ data.sessions }} 场</span>
            <span class="slot-accuracy" v-if="data.sessions > 0">{{ data.accuracy }}%</span>
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

      <!-- 易错键热力图 -->
      <div class="heatmap-section" v-if="errorHeatmap.length > 0">
        <h2>易错键分析</h2>
        <div class="heatmap-list">
          <div v-for="[key, count] in errorHeatmap.slice(0, 10)" :key="key" class="heatmap-item">
            <span class="heatmap-key">{{ displayKey(key) }}</span>
            <div class="heatmap-bar-wrap">
              <div class="heatmap-bar" :style="{ width: (count / errorHeatmap[0][1] * 100) + '%' }"></div>
            </div>
            <span class="heatmap-count">{{ count }}次</span>
          </div>
        </div>
        <div class="heatmap-actions">
          <button class="action-btn practice-btn" @click="startErrorKeysPractice">
            <span class="btn-icon">⌨</span>
            易错键专项练习
          </button>
          <p class="heatmap-tip">将前 10 个易错键生成专项练习，在打字练习的字母键位模式下反复练</p>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="actions-section">
        <h3>数据管理</h3>
        <div class="action-buttons">
          <button class="action-btn share-btn" @click="showShareCard = true">
            <span class="btn-icon"><svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M5 11 11 5m0 0H6.5M11 5v4.5"/></svg></span>
            分享成绩
          </button>
          <button class="action-btn export-json" @click="exportJSON">
            <span class="btn-icon"><svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M8 11V3m0 0L5 6m3-3 3 3"/><path d="M2.5 12v1h11v-1"/></svg></span>
            导出 JSON
          </button>
          <button class="action-btn export-csv" @click="exportCSV">
            <span class="btn-icon"><svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M8 11V3m0 0L5 6m3-3 3 3"/><path d="M2.5 12v1h11v-1"/></svg></span>
            导出 CSV
          </button>
          <button class="action-btn export-detailed" @click="exportDetailedCSV">
            <span class="btn-icon"><svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M8 11V3m0 0L5 6m3-3 3 3"/><path d="M2.5 12v1h11v-1"/></svg></span>
            导出详细
          </button>
          <button class="action-btn clear-data" @click="clearStats">
            <span class="btn-icon"><svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M2.5 4.5h11M6.5 6.5v5m3-5v5M4 4.5 4.5 13h7l.5-8.5M6.8 2.5h2.4l.8 2H6z"/></svg></span>
            清除数据
          </button>
        </div>
      </div>

      <!-- 分享卡片弹窗 -->
      <ShareCard v-if="showShareCard" @close="showShareCard = false" />

      <!-- 练习历史（按天分组，每天显示次数与明细，和顶部/进度页当天次数对齐） -->
      <div class="history-section" v-if="historyByDay.length">
        <h3>最近练习记录</h3>
        <div class="history-day" v-for="(day, di) in historyByDay" :key="di">
          <div class="history-day-head">
            <span class="history-day-date">{{ formatDay(day.date) }}</span>
            <span class="history-day-count" :class="{ today: day.isToday }">共 {{ day.items.length }} 次{{ day.isToday ? '（今日）' : '' }}</span>
          </div>
          <div class="history-list">
            <div v-for="item in day.items" :key="item.id" class="history-item">
              <div class="history-info">
                <span class="history-date">{{ formatClock(item.date) }}</span>
                <span class="history-practice-type" :class="item.practiceType">{{ getPracticeTypeLabel(item.practiceType) }}</span>
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
      </div>

      <div class="footer-space" />
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, nextTick } from 'vue'
import { useStatsStore } from '../stores/stats.js'
import TopStatusBar from '../components/TopStatusBar.vue'
import ShareCard from '../components/ShareCard.vue'

const stats = useStatsStore()
const volumeChart = ref(null)
const speedChart = ref(null)
const accuracyChart = ref(null)
const showShareCard = ref(false)

const todayStats = computed(() => stats.todayStats)
const todayAccuracy = computed(() => {
  const t = todayStats.value
  return t.chars > 0 ? Math.round((t.correct / t.chars) * 100) : 100
})

const weeklyProgress = computed(() => stats.getWeeklyProgress())
const timeSlotAnalysis = computed(() => stats.timeSlotAnalysis)
const errorHeatmap = computed(() => stats.errorHeatmap)

// 易错键显示归一：'KeyJ' → 'J'（历史数据可能混有汉字/韵母，原样显示）
function displayKey(k) {
  return String(k || '').replace(/^Key/, '')
}

// 一键生成易错键专项练习：前 10 个易错键存入 localStorage，跳转打字练习字母模式
function startErrorKeysPractice() {
  const keys = errorHeatmap.value.slice(0, 10).map(([k]) => k.replace(/^Key/, '').toLowerCase())
  if (!keys.length) return
  try { localStorage.setItem('sp-error-keys', JSON.stringify(keys)) } catch {}
  location.href = '/practice-modes?error=1'
}

const recentHistory = computed(() => {
  return stats.history
    .filter(h => h.type === 'session')
    .slice(-20)
    .reverse()
})

// 历史按天分组（最新在前，最多最近 7 天）：每天显示次数，与顶部/进度页当天次数对齐
// 历史日期为 UTC ISO，统一转本地日期比较
function toLocalDay(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0')
}
const historyByDay = computed(() => {
  const todayStr = toLocalDay(new Date().toISOString())
  const sessions = stats.history.filter(h => h.type === 'session').reverse()
  const groups = []
  for (const s of sessions) {
    const day = toLocalDay(s.date)
    if (!day) continue
    let g = groups[groups.length - 1]
    if (!g || g.date !== day) {
      g = { date: day, isToday: day === todayStr, items: [] }
      groups.push(g)
    }
    g.items.push(s)
  }
  return groups.slice(0, 7)
})
// 今日场次：与顶部目标/历史记录同一数据源（历史当天 session 条数）
const todaySessions = computed(() => {
  const todayStr = toLocalDay(new Date().toISOString())
  return stats.history.filter(h => h.type === 'session' && toLocalDay(h.date) === todayStr).length
})

const slotNames = {
  morning: '早晨 (6-12点)',
  afternoon: '下午 (12-18点)',
  evening: '晚上 (18-22点)',
  night: '深夜 (22-6点)',
}

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

// 按天分组日期头：'YYYY-MM-DD' → '8/25'
function formatDay(dateStr) {
  const [, m, d] = (dateStr || '').split('-')
  return `${Number(m)}/${Number(d)}`
}
// 记录内只显示时分（注意：formatTime(秒) 已被时长显示占用，此处用 formatClock）
function formatClock(isoString) {
  const date = new Date(isoString)
  return `${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`
}

function getTypeLabel(type) {
  const labels = {
    session: '练习',
    char: '单字',
    final: '韵母',
  }
  return labels[type] || type
}

function getPracticeTypeLabel(type) {
  const labels = {
    yunmu: '韵母',
    writer: '打字',
    practice: '练习',
    chinese: '中文全屏',
    english: '英文单词',
    numbers: '键盘数字',
    letters: '字母键位',
    syllables: '拼音音节',
    cards: '卡片',
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

function exportDetailedCSV() {
  const csv = stats.exportDetailedCSV()
  const filename = `shuangping-detailed-${new Date().toISOString().slice(0, 10)}.csv`
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

.action-btn.share-btn {
  background: linear-gradient(135deg, #35e2b7, #2aa88a);
  border-color: transparent;
  color: #0b1a14;
  font-weight: 500;
}

.action-btn.share-btn:hover {
  background: linear-gradient(135deg, #2aa88a, #35e2b7);
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

/* 按天分组 */
.history-day { margin-bottom: 18px; }
.history-day:last-child { margin-bottom: 0; }
.history-day-head {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}
.history-day-date { font-size: 13px; font-weight: 700; color: var(--theme-main-text-color); }
.history-day-count {
  font-size: 12px;
  color: var(--theme-menu-text-color);
  padding: 2px 10px;
  border-radius: 12px;
  background: var(--theme-background-color);
  border: 1px solid var(--theme-border-color);
}
.history-day-count.today { color: #3db389; border-color: #3db389; }

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

/* 周进度分析 */
.weekly-progress-section {
  background: var(--theme-background-light-color);
  border: 1px solid var(--theme-border-color);
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 24px;
}

.weekly-progress-section h2 {
  font-size: 16px;
  font-weight: 600;
  color: var(--theme-main-text-color);
  margin-bottom: 16px;
}

.progress-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.progress-item {
  text-align: center;
  padding: 16px;
  background: var(--theme-background-color);
  border-radius: 8px;
}

.progress-label {
  display: block;
  font-size: 12px;
  color: var(--theme-text-color);
  margin-bottom: 8px;
}

.progress-value {
  display: block;
  font-size: 24px;
  font-weight: 700;
}

.progress-value.up {
  color: #67c23a;
}

.progress-value.down {
  color: #f56c6c;
}

/* 时段分析 */
.time-slot-section {
  background: var(--theme-background-light-color);
  border: 1px solid var(--theme-border-color);
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 24px;
}

.time-slot-section h2 {
  font-size: 16px;
  font-weight: 600;
  color: var(--theme-main-text-color);
  margin-bottom: 16px;
}

.time-slot-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.time-slot-item {
  text-align: center;
  padding: 16px 12px;
  background: var(--theme-background-color);
  border-radius: 8px;
  opacity: 0.6;
}

.time-slot-item.active {
  opacity: 1;
  border: 1px solid var(--theme-menu-hover-color);
}

.slot-name {
  display: block;
  font-size: 12px;
  color: var(--theme-text-color);
  margin-bottom: 8px;
}

.slot-sessions {
  display: block;
  font-size: 18px;
  font-weight: 600;
  color: var(--theme-main-text-color);
  margin-bottom: 4px;
}

.slot-accuracy {
  display: block;
  font-size: 14px;
  color: #67c23a;
}

/* 热力图 */
.heatmap-section {
  background: var(--theme-background-light-color);
  border: 1px solid var(--theme-border-color);
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 24px;
}

.heatmap-section h2 {
  font-size: 16px;
  font-weight: 600;
  color: var(--theme-main-text-color);
  margin-bottom: 16px;
}

.heatmap-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.heatmap-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.heatmap-key {
  width: 50px;
  font-size: 16px;
  font-weight: 600;
  color: var(--theme-main-text-color);
  text-align: center;
}

.heatmap-bar-wrap {
  flex: 1;
  height: 16px;
  background: var(--theme-background-color);
  border-radius: 8px;
  overflow: hidden;
}

.heatmap-bar {
  height: 100%;
  background: linear-gradient(90deg, #f56c6c, #ff9f7f);
  border-radius: 8px;
  transition: width 0.3s;
}

.heatmap-count {
  width: 60px;
  text-align: right;
  font-size: 13px;
  color: var(--theme-text-color);
}

/* 导出详细按钮 */
.action-btn.export-detailed {
  background: #e6f7ff;
  border-color: #91d5ff;
  color: #1890ff;
}

.action-btn.export-detailed:hover {
  background: #bae7ff;
}

/* 练习类型标签 */
.history-practice-type {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 4px;
  background: var(--theme-background-light-color);
  color: var(--theme-rich-text-color);
}

.history-practice-type.yunmu {
  background: #e6f7ff;
  color: #1890ff;
}

.history-practice-type.writer {
  background: #f6ffed;
  color: #52c41a;
}

/* 响应式 */
@media (max-width: 768px) {
  .overview-cards {
    grid-template-columns: repeat(2, 1fr);
  }

  .today-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .progress-grid {
    grid-template-columns: 1fr;
  }

  .time-slot-grid {
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
