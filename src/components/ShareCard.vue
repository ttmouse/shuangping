<template>
  <div class="share-card-overlay" @click.self="close">
    <div class="share-card-modal">
      <div class="share-card-header">
        <h3>分享我的成绩</h3>
        <button class="close-btn" @click="close">×</button>
      </div>

      <!-- 预览卡片 -->
      <div class="share-preview" ref="cardPreview">
        <div class="share-card" :class="cardTheme">
          <div class="card-header">
            <div class="card-avatar">{{ userAvatar }}</div>
            <div class="card-user">
              <div class="username">{{ userName }}</div>
              <div class="date">{{ formatDate }}</div>
            </div>
          </div>

          <div class="card-stats">
            <div class="stat-row">
              <div class="stat-item large">
                <div class="stat-value">{{ displayStats.accuracy }}%</div>
                <div class="stat-label">准确率</div>
              </div>
              <div class="stat-item large">
                <div class="stat-value">{{ displayStats.speed }}</div>
                <div class="stat-label">字/分</div>
              </div>
            </div>
            <div class="stat-row">
              <div class="stat-item">
                <div class="stat-value">{{ displayStats.chars }}</div>
                <div class="stat-label">字符</div>
              </div>
              <div class="stat-item">
                <div class="stat-value">{{ displayStreak }}</div>
                <div class="stat-label">连续天数</div>
              </div>
              <div class="stat-item">
                <div class="stat-value">{{ displayStats.totalChars }}</div>
                <div class="stat-label">累计字符</div>
              </div>
            </div>
          </div>

          <div class="card-achievements" v-if="recentAchievements.length">
            <div class="achievement-title">最近成就</div>
            <div class="achievement-list">
              <span v-for="ach in recentAchievements.slice(0, 3)" :key="ach.id" class="achievement-tag">
                {{ ach.icon }} {{ ach.name }}
              </span>
            </div>
          </div>

          <div class="card-footer">
            <div class="card-brand">
              <span class="brand-icon"><svg viewBox="0 0 16 16" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="1.5" y="4" width="13" height="8" rx="1.5"/><path d="M4 6.5h.01M6.5 6.5h.01M9 6.5h.01M4 9.5h.01M6.5 9.5h.01M9 9.5h.01"/></svg></span>
              <span class="brand-text">双拼练习</span>
            </div>
            <div class="card-qrcode" v-if="showQRCode">
              <canvas ref="qrcodeCanvas" width="60" height="60"></canvas>
            </div>
          </div>
        </div>
      </div>

      <!-- 主题选择 -->
      <div class="theme-selector">
        <span class="selector-label">卡片主题:</span>
        <div class="theme-options">
          <button
            v-for="theme in themes"
            :key="theme.id"
            class="theme-btn"
            :class="{ active: cardTheme === theme.id }"
            :style="{ background: theme.preview }"
            @click="cardTheme = theme.id"
            :title="theme.name"
          />
        </div>
      </div>

      <!-- 分享成功提示 -->
      <div v-if="shareSuccess" class="share-success">
        <span class="success-icon">✓</span>
        <span>分享成功！</span>
      </div>

      <!-- 分享选项 -->
      <div class="share-options">
        <button class="share-btn primary" @click="downloadCard">
          <span class="btn-icon"><svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M8 11V3m0 0L5 6m3-3 3 3"/><path d="M2.5 12v1h11v-1"/></svg></span>
          保存图片
        </button>
        <button class="share-btn" @click="copyToClipboard">
          <span class="btn-icon"><svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="5" y="5" width="8" height="8" rx="1.5"/><path d="M11 5V3.5A1.5 1.5 0 0 0 9.5 2h-6A1.5 1.5 0 0 0 2 3.5v6A1.5 1.5 0 0 0 3.5 11H5"/></svg></span>
          复制文本
        </button>
      </div>

      <!-- 社交媒体分享 -->
      <div class="social-share-section">
        <div class="section-divider">
          <span>分享到</span>
        </div>
        <div class="social-buttons">
          <button class="social-btn twitter" @click="shareToTwitter" title="分享到 X">
            <span class="social-icon">𝕏</span>
            <span class="social-name">X</span>
          </button>
          <button class="social-btn weibo" @click="shareToWeibo" title="分享到微博">
            <span class="social-name">微博</span>
          </button>
          <button class="social-btn qq" @click="shareToQQ" title="分享到QQ">
            <span class="social-name">QQ</span>
          </button>
          <button class="social-btn native" @click="shareNative" v-if="canShareNative" title="系统分享">
            <span class="social-name">更多</span>
          </button>
        </div>
      </div>

      <!-- 文本分享预览 -->
      <div class="text-share-preview" v-if="showTextPreview">
        <textarea ref="textPreview" readonly rows="4">{{ shareText }}</textarea>
        <button class="copy-btn" @click="copyText">复制</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useStatsStore } from '../stores/stats.js'
import { useProgressStore } from '../stores/progress.js'

const props = defineProps({
  stats: {
    type: Object,
    default: null
  },
  sessionStats: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['close'])

const stats = useStatsStore()
const progress = useProgressStore()

const cardPreview = ref(null)
const qrcodeCanvas = ref(null)
const cardTheme = ref('gradient')
const showTextPreview = ref(false)
const shareSuccess = ref(false)

const themes = [
  { id: 'gradient', name: '渐变绿', preview: 'linear-gradient(135deg, #35e2b7, #2aa88a)' },
  { id: 'dark', name: '深邃黑', preview: 'linear-gradient(135deg, #1a1a2e, #16213e)' },
  { id: 'purple', name: '梦幻紫', preview: 'linear-gradient(135deg, #667eea, #764ba2)' },
  { id: 'orange', name: '活力橙', preview: 'linear-gradient(135deg, #f093fb, #f5576c)' },
  { id: 'blue', name: '天空蓝', preview: 'linear-gradient(135deg, #4facfe, #00f2fe)' },
]

const userName = computed(() => {
  return localStorage.getItem('sp-username') || '双拼练习者'
})

const userAvatar = computed(() => {
  return localStorage.getItem('sp-avatar') || '双'
})

const displayStats = computed(() => {
  if (props.sessionStats) {
    return {
      accuracy: props.sessionStats.accuracy || stats.overallAccuracy,
      speed: props.sessionStats.speed || stats.averageSpeed,
      chars: props.sessionStats.chars || 0,
      totalChars: stats.totalCharsTyped
    }
  }
  return {
    accuracy: stats.overallAccuracy,
    speed: stats.averageSpeed,
    chars: stats.todayStats.chars || 0,
    totalChars: stats.totalCharsTyped
  }
})

const displayStreak = computed(() => {
  return stats.streakDays
})

const recentAchievements = computed(() => {
  return progress.recentAchievements || []
})

const formatDate = computed(() => {
  const now = new Date()
  return `${now.getMonth() + 1}月${now.getDate()}日`
})

const shareText = computed(() => {
  const s = displayStats.value
  let text = `我的双拼练习成绩\n`
  text += `准确率: ${s.accuracy}% | 速度: ${s.speed}字/分\n`
  text += `今日练习: ${s.chars}字符 | 连续${displayStreak.value}天\n`
  text += `累计练习: ${s.totalChars}字符\n`
  if (recentAchievements.value.length) {
    text += `最近成就: ${recentAchievements.value.slice(0, 3).map(a => a.name).join(', ')}\n`
  }
  text += `一起来练习双拼吧！`
  return text
})

const canShareNative = computed(() => {
  return typeof navigator !== 'undefined' && navigator.share && navigator.canShare
})

const canShareToWeibo = computed(() => true)
const canShareToQQ = computed(() => true)

const showQRCode = computed(() => true)

onMounted(() => {
  stats.load()
  progress.load()
  nextTick(() => {
    drawQRCode()
  })
})

function close() {
  emit('close')
}

function drawQRCode() {
  const canvas = qrcodeCanvas.value
  if (!canvas) return

  const ctx = canvas.getContext('2d')
  const size = 60
  const cells = 25
  const cellSize = size / cells

  // Clear canvas
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, size, size)

  // Draw simplified QR pattern
  ctx.fillStyle = '#000000'

  // Draw position detection patterns (corners)
  const drawPositionPattern = (x, y) => {
    // Outer square
    ctx.fillRect(x * cellSize, y * cellSize, 7 * cellSize, 7 * cellSize)
    // Inner white square
    ctx.fillStyle = '#ffffff'
    ctx.fillRect((x + 1) * cellSize, (y + 1) * cellSize, 5 * cellSize, 5 * cellSize)
    // Inner black square
    ctx.fillStyle = '#000000'
    ctx.fillRect((x + 2) * cellSize, (y + 2) * cellSize, 3 * cellSize, 3 * cellSize)
  }

  drawPositionPattern(2, 2)
  drawPositionPattern(16, 2)
  drawPositionPattern(2, 16)

  // Draw random data pattern
  for (let i = 0; i < cells; i++) {
    for (let j = 0; j < cells; j++) {
      // Skip position patterns
      if ((i < 9 && j < 9) || (i > 15 && j < 9) || (i < 9 && j > 15)) continue

      if (Math.random() > 0.5) {
        ctx.fillRect(i * cellSize, j * cellSize, cellSize, cellSize)
      }
    }
  }
}

async function downloadCard() {
  const card = cardPreview.value?.querySelector('.share-card')
  if (!card) return

  try {
    // Use html2canvas-like approach with canvas API
    const canvas = await renderCardToCanvas(card)
    const link = document.createElement('a')
    link.download = `shuangping-share-${Date.now()}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  } catch (err) {
    console.error('Failed to generate image:', err)
    alert('生成图片失败，请尝试复制文本分享')
  }
}

async function renderCardToCanvas(element) {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  const rect = element.getBoundingClientRect()
  const scale = 2

  canvas.width = rect.width * scale
  canvas.height = rect.height * scale
  ctx.scale(scale, scale)

  // Get computed styles
  const styles = window.getComputedStyle(element)
  const bg = styles.background

  // Draw background
  if (bg.includes('gradient')) {
    const gradient = ctx.createLinearGradient(0, 0, rect.width, rect.height)
    if (cardTheme.value === 'gradient') {
      gradient.addColorStop(0, '#35e2b7')
      gradient.addColorStop(1, '#2aa88a')
    } else if (cardTheme.value === 'dark') {
      gradient.addColorStop(0, '#1a1a2e')
      gradient.addColorStop(1, '#16213e')
    } else if (cardTheme.value === 'purple') {
      gradient.addColorStop(0, '#667eea')
      gradient.addColorStop(1, '#764ba2')
    } else if (cardTheme.value === 'orange') {
      gradient.addColorStop(0, '#f093fb')
      gradient.addColorStop(1, '#f5576c')
    } else if (cardTheme.value === 'blue') {
      gradient.addColorStop(0, '#4facfe')
      gradient.addColorStop(1, '#00f2fe')
    }
    ctx.fillStyle = gradient
  } else {
    ctx.fillStyle = styles.backgroundColor
  }
  ctx.fillRect(0, 0, rect.width, rect.height)

  // Draw border radius clip
  ctx.beginPath()
  ctx.roundRect(0, 0, rect.width, rect.height, 16)
  ctx.clip()

  // Re-draw background after clip
  if (bg.includes('gradient')) {
    const gradient = ctx.createLinearGradient(0, 0, rect.width, rect.height)
    if (cardTheme.value === 'gradient') {
      gradient.addColorStop(0, '#35e2b7')
      gradient.addColorStop(1, '#2aa88a')
    } else if (cardTheme.value === 'dark') {
      gradient.addColorStop(0, '#1a1a2e')
      gradient.addColorStop(1, '#16213e')
    } else if (cardTheme.value === 'purple') {
      gradient.addColorStop(0, '#667eea')
      gradient.addColorStop(1, '#764ba2')
    } else if (cardTheme.value === 'orange') {
      gradient.addColorStop(0, '#f093fb')
      gradient.addColorStop(1, '#f5576c')
    } else if (cardTheme.value === 'blue') {
      gradient.addColorStop(0, '#4facfe')
      gradient.addColorStop(1, '#00f2fe')
    }
    ctx.fillStyle = gradient
  }
  ctx.fillRect(0, 0, rect.width, rect.height)

  // Draw content (simplified text rendering)
  const isDark = cardTheme.value === 'dark'
  ctx.fillStyle = isDark ? '#ffffff' : '#1a1a1a'
  ctx.font = 'bold 16px sans-serif'
  ctx.fillText(userName.value, 60, 30)

  ctx.fillStyle = isDark ? '#aaaaaa' : '#666666'
  ctx.font = '12px sans-serif'
  ctx.fillText(formatDate.value, 60, 48)

  // Draw avatar
  ctx.font = '24px sans-serif'
  ctx.fillText(userAvatar.value, 20, 42)

  // Draw stats
  ctx.fillStyle = isDark ? '#ffffff' : '#1a1a1a'
  ctx.font = 'bold 32px sans-serif'
  ctx.fillText(`${displayStats.value.accuracy}%`, 30, 100)
  ctx.font = '12px sans-serif'
  ctx.fillText('准确率', 30, 118)

  ctx.font = 'bold 32px sans-serif'
  ctx.fillText(`${displayStats.value.speed}`, 150, 100)
  ctx.font = '12px sans-serif'
  ctx.fillText('字/分', 150, 118)

  // Draw footer
  ctx.fillStyle = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'
  ctx.fillRect(0, rect.height - 50, rect.width, 50)

  ctx.fillStyle = isDark ? '#ffffff' : '#1a1a1a'
  ctx.font = '14px sans-serif'
  ctx.fillText('双拼练习', 20, rect.height - 20)

  return canvas
}

function copyToClipboard() {
  showTextPreview.value = true
  nextTick(() => {
    const textarea = document.querySelector('.text-share-preview textarea')
    if (textarea) {
      textarea.select()
      document.execCommand('copy')
      alert('分享文本已复制到剪贴板！')
    }
  })
}

function copyText() {
  const textarea = document.querySelector('.text-share-preview textarea')
  if (textarea) {
    textarea.select()
    document.execCommand('copy')
    alert('已复制！')
  }
}

async function shareToTwitter() {
  const text = encodeURIComponent(shareText.value)
  const url = `https://twitter.com/intent/tweet?text=${text}`
  window.open(url, '_blank', 'width=600,height=400')
}

async function shareToWeibo() {
  const text = encodeURIComponent(shareText.value)
  const url = `https://service.weibo.com/share/share.php?title=${text}&url=${encodeURIComponent(window.location.origin)}`
  window.open(url, '_blank', 'width=600,height=400')
}

async function shareToQQ() {
  const text = encodeURIComponent(shareText.value)
  const url = `https://connect.qq.com/widget/shareqq/index.html?title=${text}&url=${encodeURIComponent(window.location.origin)}`
  window.open(url, '_blank', 'width=600,height=400')
}

async function shareNative() {
  if (!canShareNative.value) return
  
  try {
    const shareData = {
      title: '我的双拼练习成绩',
      text: shareText.value,
      url: window.location.origin
    }
    
    if (navigator.canShare && navigator.canShare(shareData)) {
      await navigator.share(shareData)
      shareSuccess.value = true
      setTimeout(() => shareSuccess.value = false, 2000)
    }
  } catch (err) {
    if (err.name !== 'AbortError') {
      console.error('Share failed:', err)
    }
  }
}
</script>

<style scoped>
.share-card-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: 20px;
}

.share-card-modal {
  background: var(--theme-background-light-color);
  border-radius: 16px;
  width: 100%;
  max-width: 400px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.share-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid var(--theme-border-color);
}

.share-card-header h3 {
  margin: 0;
  font-size: 18px;
  color: var(--theme-main-text-color);
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  color: var(--theme-text-color);
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  transition: background 0.2s;
}

.close-btn:hover {
  background: var(--theme-border-color);
}

.share-preview {
  padding: 20px;
  display: flex;
  justify-content: center;
}

.share-card {
  width: 100%;
  max-width: 320px;
  border-radius: 16px;
  padding: 20px;
  color: #1a1a1a;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
}

.share-card.gradient {
  background: linear-gradient(135deg, #35e2b7, #2aa88a);
}

.share-card.dark {
  background: linear-gradient(135deg, #1a1a2e, #16213e);
  color: #ffffff;
}

.share-card.purple {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: #ffffff;
}

.share-card.orange {
  background: linear-gradient(135deg, #f093fb, #f5576c);
  color: #ffffff;
}

.share-card.blue {
  background: linear-gradient(135deg, #4facfe, #00f2fe);
  color: #1a1a1a;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}

.card-avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}

.card-user {
  flex: 1;
}

.username {
  font-weight: 600;
  font-size: 16px;
  margin-bottom: 2px;
}

.date {
  font-size: 12px;
  opacity: 0.8;
}

.card-stats {
  margin-bottom: 16px;
}

.stat-row {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
}

.stat-row:last-child {
  margin-bottom: 0;
}

.stat-item {
  flex: 1;
  text-align: center;
  padding: 12px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  backdrop-filter: blur(10px);
}

.stat-item.large {
  padding: 16px;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 4px;
}

.stat-item.large .stat-value {
  font-size: 32px;
}

.stat-label {
  font-size: 12px;
  opacity: 0.9;
}

.card-achievements {
  margin-bottom: 16px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 12px;
}

.achievement-title {
  font-size: 12px;
  opacity: 0.8;
  margin-bottom: 8px;
}

.achievement-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.achievement-tag {
  font-size: 11px;
  padding: 4px 10px;
  background: rgba(255, 255, 255, 0.25);
  border-radius: 20px;
  white-space: nowrap;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.2);
}

.card-brand {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 500;
}

.brand-icon {
  font-size: 16px;
}

.card-qrcode canvas {
  border-radius: 4px;
}

.theme-selector {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 20px 16px;
}

.selector-label {
  font-size: 13px;
  color: var(--theme-text-color);
  white-space: nowrap;
}

.theme-options {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.theme-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 2px solid transparent;
  cursor: pointer;
  transition: transform 0.2s, border-color 0.2s;
}

.theme-btn:hover {
  transform: scale(1.1);
}

.theme-btn.active {
  border-color: var(--theme-menu-hover-color);
  box-shadow: 0 0 0 2px var(--theme-background-light-color), 0 0 0 4px var(--theme-menu-hover-color);
}

.share-options {
  display: flex;
  gap: 10px;
  padding: 0 20px 16px;
  flex-wrap: wrap;
}

.share-btn {
  flex: 1;
  min-width: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 12px 16px;
  border-radius: 10px;
  border: 1px solid var(--theme-border-color);
  background: var(--theme-background-color);
  color: var(--theme-text-color);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.share-btn:hover {
  background: var(--theme-menu-hover-color);
  color: #0b1a14;
}

.share-btn.primary {
  background: #35e2b7;
  border-color: #35e2b7;
  color: #0b1a14;
  font-weight: 500;
}

.share-btn.primary:hover {
  background: #2aa88a;
  border-color: #2aa88a;
}

.btn-icon {
  font-size: 16px;
}

.text-share-preview {
  padding: 0 20px 20px;
  display: flex;
  gap: 10px;
}

.text-share-preview textarea {
  flex: 1;
  padding: 12px;
  border: 1px solid var(--theme-border-color);
  border-radius: 8px;
  background: var(--theme-background-color);
  color: var(--theme-text-color);
  font-size: 13px;
  resize: none;
  font-family: inherit;
}

.copy-btn {
  padding: 12px 20px;
  border-radius: 8px;
  border: none;
  background: #35e2b7;
  color: #0b1a14;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.copy-btn:hover {
  background: #2aa88a;
}

/* 分享成功提示 */
.share-success {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 20px;
  margin: 0 20px 16px;
  background: rgba(53, 226, 183, 0.15);
  border: 1px solid #35e2b7;
  border-radius: 10px;
  color: #35e2b7;
  font-size: 14px;
  animation: fadeIn 0.3s ease;
}

.success-icon {
  width: 20px;
  height: 20px;
  background: #35e2b7;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #0b1a14;
  font-size: 12px;
  font-weight: 700;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* 社交媒体分享区域 */
.social-share-section {
  padding: 0 20px 20px;
}

.section-divider {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  color: var(--theme-text-color);
  font-size: 13px;
}

.section-divider::before,
.section-divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--theme-border-color);
}

.social-buttons {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.social-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 12px 20px;
  border: 1px solid var(--theme-border-color);
  border-radius: 12px;
  background: var(--theme-background-color);
  cursor: pointer;
  transition: all 0.2s;
  min-width: 70px;
}

.social-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.social-btn.twitter:hover {
  background: rgba(0, 0, 0, 0.8);
  border-color: #000;
  color: #fff;
}

.social-btn.weibo:hover {
  background: rgba(230, 22, 45, 0.1);
  border-color: #e6162d;
  color: #e6162d;
}

.social-btn.qq:hover {
  background: rgba(18, 183, 245, 0.1);
  border-color: #12b7f5;
  color: #12b7f5;
}

.social-btn.native:hover {
  background: rgba(53, 226, 183, 0.1);
  border-color: #35e2b7;
  color: #35e2b7;
}

.social-icon {
  font-size: 24px;
}

.social-name {
  font-size: 12px;
  font-weight: 500;
}

@media (max-width: 480px) {
  .share-card-modal {
    max-height: 95vh;
  }

  .share-card {
    padding: 16px;
  }

  .stat-value {
    font-size: 20px;
  }

  .stat-item.large .stat-value {
    font-size: 28px;
  }

  .share-options {
    flex-direction: column;
  }

  .share-btn {
    width: 100%;
  }

  .social-buttons {
    flex-wrap: wrap;
  }

  .social-btn {
    flex: 1;
    min-width: 60px;
    padding: 10px 12px;
  }
}
</style>
