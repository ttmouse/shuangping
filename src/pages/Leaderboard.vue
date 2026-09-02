<template>
  <div class="leaderboard-page">
    <TopStatusBar />

    <div class="page-content">
      <div class="header">
        <h1>排行榜</h1>
        <p class="subtitle">与双拼练习者们一较高下</p>
      </div>

      <!-- 我的排名卡片 -->
      <div class="my-rank-card" v-if="myStats">
        <div class="rank-avatar">{{ myStats.avatar }}</div>
        <div class="rank-info">
          <div class="rank-name">{{ myStats.name }}</div>
          <div class="rank-stats">
            <span class="rank-stat">
              <span class="stat-icon"><svg viewBox="0 0 16 16" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M3 14V8m5 6V4m5 10V6"/><path d="M1.5 14h13"/></svg></span>
              {{ myStats.accuracy }}%
            </span>
            <span class="rank-stat">
              <span class="stat-icon"><svg viewBox="0 0 16 16" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M8.5 1.5 3 9h4l-1 6L12 7H8l.5-5.5z"/></svg></span>
              {{ myStats.speed }}字/分
            </span>
            <span class="rank-stat">
              <span class="stat-icon"><svg viewBox="0 0 16 16" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M8 2c.6 2.2-1.6 3.2-1.6 5.2a2.6 2.6 0 0 0 5.2 0c0-1.4-.5-2.4-1-3.4C9.8 5 8.8 4 8 2z"/><path d="M6.5 10.5a2.5 2.5 0 0 0 3 0"/></svg></span>
              {{ myStats.streakDays }}天
            </span>
          </div>
        </div>
        <div class="rank-position">
          <div class="rank-number">#{{ myAllTimeRank || '-' }}</div>
          <div class="rank-label">总排名</div>
        </div>
      </div>

      <!-- 标签切换 -->
      <div class="tab-bar">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          class="tab-btn"
          :class="{ active: activeTab === tab.id }"
          @click="switchTab(tab.id)"
        >
          {{ tab.name }}
        </button>
      </div>

      <!-- 排行榜列表 -->
      <div class="leaderboard-list">
        <div class="list-header">
          <span class="col-rank">排名</span>
          <span class="col-user">用户</span>
          <span class="col-score">得分</span>
          <span class="col-stat">{{ activeTab === 'speed' ? '速度' : activeTab === 'accuracy' ? '准确率' : '连续' }}</span>
        </div>

        <div class="list-body">
          <div
            v-for="user in currentRanking"
            :key="user.id"
            class="rank-item"
            :class="{ 'is-me': user.isMe, 'top-3': user.rank <= 3 }"
          >
            <div class="col-rank">
              <span class="rank-badge" :class="`rank-${user.rank}`" v-if="user.rank <= 3">
                <svg viewBox="0 0 16 16" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.4"><circle cx="8" cy="6" r="3.5"/><path d="M5.5 8.5 4.5 14l3.5-1.8L11.5 14l-1-5.5"/></svg>
              </span>
              <span v-else class="rank-number">{{ user.rank }}</span>
            </div>
            <div class="col-user">
              <span class="user-avatar">{{ user.avatar }}</span>
              <span class="user-name">{{ user.name }}</span>
              <span class="me-badge" v-if="user.isMe">我</span>
            </div>
            <div class="col-score">{{ formatNumber(user.score) }}</div>
            <div class="col-stat">
              {{ activeTab === 'speed' ? user.speed + '字/分' : activeTab === 'accuracy' ? user.accuracy + '%' : user.streakDays + '天' }}
            </div>
          </div>
        </div>
      </div>

      <!-- 快速分享我的排名 -->
      <div class="quick-share-section" v-if="myStats">
        <div class="quick-share-card">
          <div class="quick-share-text">
            <span class="share-emoji"><svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M5 11 11 5m0 0H6.5M11 5v4.5"/></svg></span>
            <span>我在双拼练习中排名第 <strong>#{{ myAllTimeRank || '-' }}</strong>，准确率 {{ myStats.accuracy }}%，速度 {{ myStats.speed }} 字/分！</span>
          </div>
          <button class="quick-share-btn" @click="openShareCard">
            <span>分享成绩</span>
          </button>
        </div>
      </div>

      <!-- 挑战区域 -->
      <div class="challenges-section">
        <div class="section-header">
          <h2>我的挑战</h2>
          <button class="create-btn" @click="showCreateChallenge = true">
            + 创建挑战
          </button>
        </div>

        <!-- 活跃挑战 -->
        <div class="challenge-list" v-if="activeChallengeList.length">
          <div
            v-for="challenge in activeChallengeList"
            :key="challenge.id"
            class="challenge-card"
          >
            <div class="challenge-icon">{{ getChallengeIcon(challenge.type) }}</div>
            <div class="challenge-info">
              <div class="challenge-title">{{ getChallengeTitle(challenge) }}</div>
              <div class="challenge-progress">
                <div class="progress-bar">
                  <div class="progress-fill" :style="{ width: getProgressPercent(challenge) + '%' }"></div>
                </div>
                <span class="progress-text">{{ challenge.progress }} / {{ challenge.target }}</span>
              </div>
            </div>
            <div class="challenge-actions">
              <button class="share-challenge-btn" @click="shareChallenge(challenge)" title="分享挑战">
                <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M5 11 11 5m0 0H6.5M11 5v4.5"/></svg>
              </button>
            </div>
          </div>
        </div>

        <div class="empty-state" v-else>
          <div class="empty-icon"><svg viewBox="0 0 16 16" width="32" height="32" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M3 5.5 5 3.5h6l2 2V11a1.5 1.5 0 0 1-1.5 1.5h-7A1.5 1.5 0 0 1 3 11V5.5z"/><path d="M3.2 8h3l1 1.5h1.6l1-1.5h3"/></svg></div>
          <div class="empty-text">暂无进行中的挑战</div>
          <button class="create-btn-large" @click="showCreateChallenge = true">
            创建新挑战
          </button>
        </div>

        <!-- 挑战历史 -->
        <div class="challenge-history" v-if="challengeHistory.length">
          <h3>挑战历史</h3>
          <div class="history-list">
            <div
              v-for="challenge in challengeHistory.slice(0, 5)"
              :key="challenge.id"
              class="history-item"
              :class="challenge.status"
            >
              <span class="history-icon">{{ challenge.status === 'completed' ? '✓' : '✗' }}</span>
              <span class="history-title">{{ getChallengeTitle(challenge) }}</span>
              <span class="history-date">{{ formatDate(challenge.completedAt || challenge.createdAt) }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="footer-space" />
    </div>

    <!-- 创建挑战弹窗 -->
    <div class="modal-overlay" v-if="showCreateChallenge" @click.self="showCreateChallenge = false">
      <div class="modal">
        <div class="modal-header">
          <h3>创建新挑战</h3>
          <button class="close-btn" @click="showCreateChallenge = false">×</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>挑战类型</label>
            <div class="challenge-types">
              <button
                v-for="type in challengeTypes"
                :key="type.id"
                class="type-btn"
                :class="{ active: newChallenge.type === type.id }"
                @click="newChallenge.type = type.id"
              >
                <span class="type-icon">{{ type.icon }}</span>
                <span class="type-name">{{ type.name }}</span>
              </button>
            </div>
          </div>

          <div class="form-group">
            <label>目标值</label>
            <input
              type="number"
              v-model.number="newChallenge.target"
              class="form-input"
              :placeholder="getTargetPlaceholder()"
            />
            <span class="input-hint">{{ getTargetHint() }}</span>
          </div>

          <div class="form-group">
            <label>挑战时长</label>
            <div class="duration-options">
              <button
                v-for="d in [3, 7, 14, 30]"
                :key="d"
                class="duration-btn"
                :class="{ active: newChallenge.duration === d }"
                @click="newChallenge.duration = d"
              >
                {{ d }}天
              </button>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="showCreateChallenge = false">取消</button>
          <button class="btn-primary" @click="createChallenge" :disabled="!isValidChallenge">
            创建挑战
          </button>
        </div>
      </div>
    </div>

    <!-- 分享挑战弹窗 -->
    <div class="modal-overlay" v-if="showShareChallenge" @click.self="showShareChallenge = false">
      <div class="modal share-modal">
        <div class="modal-header">
          <h3>分享挑战</h3>
          <button class="close-btn" @click="showShareChallenge = false">×</button>
        </div>
        <div class="modal-body">
          <div class="share-preview">
            <div class="share-card">
              <div class="share-title">{{ shareChallengeData?.from }} 向你发起挑战</div>
              <div class="share-content">
                <div class="challenge-type">{{ getChallengeTypeName(shareChallengeData?.type) }}</div>
                <div class="challenge-target">目标: {{ shareChallengeData?.target }}</div>
              </div>
              <div class="share-footer">一起来双拼练习吧！</div>
            </div>
          </div>
          <div class="share-link">
            <input type="text" readonly :value="shareLink" ref="shareLinkInput" />
            <button @click="copyShareLink">复制链接</button>
          </div>
          <div class="share-social">
            <span class="share-label">分享到:</span>
            <div class="social-btns">
              <button class="social-btn twitter" @click="shareToTwitter" title="分享到 X">𝕏</button>
              <button class="social-btn weibo" @click="shareToWeibo" title="分享到微博">微</button>
              <button class="social-btn qq" @click="shareToQQ" title="分享到QQ">Q</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 成绩分享卡片弹窗 -->
    <ShareCard v-if="showShareCard" @close="showShareCard = false" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useLeaderboardStore } from '../stores/leaderboard.js'
import { useStatsStore } from '../stores/stats.js'
import TopStatusBar from '../components/TopStatusBar.vue'
import ShareCard from '../components/ShareCard.vue'

const route = useRoute()
const router = useRouter()
const leaderboard = useLeaderboardStore()
const stats = useStatsStore()

// 从 URL 恢复 tab，默认综合排名
const activeTab = ref(route.query.tab && ['score', 'speed', 'accuracy', 'streak'].includes(route.query.tab) ? route.query.tab : 'score')
const showCreateChallenge = ref(false)
const showShareChallenge = ref(false)
const showShareCard = ref(false)
const shareChallengeData = ref(null)
const shareLink = ref('')
const shareLinkInput = ref(null)

const tabs = [
  { id: 'score', name: '综合排名' },
  { id: 'speed', name: '速度榜' },
  { id: 'accuracy', name: '准确率榜' },
  { id: 'streak', name: '连续天数' },
]

const challengeTypes = [
  { id: 'accuracy', name: '准确率挑战', icon: '准' },
  { id: 'speed', name: '速度挑战', icon: '速' },
  { id: 'streak', name: '连续练习', icon: '连' },
  { id: 'chars', name: '练习字数', icon: '字' },
]

const newChallenge = ref({
  type: 'accuracy',
  target: 95,
  duration: 7,
})

const currentRanking = computed(() => {
  switch (activeTab.value) {
    case 'speed':
      return leaderboard.allTimeRanking.slice().sort((a, b) => b.speed - a.speed).map((u, i) => ({ ...u, rank: i + 1 }))
    case 'accuracy':
      return leaderboard.allTimeRanking.slice().sort((a, b) => b.accuracy - a.accuracy).map((u, i) => ({ ...u, rank: i + 1 }))
    case 'streak':
      return leaderboard.allTimeRanking.slice().sort((a, b) => b.streakDays - a.streakDays).map((u, i) => ({ ...u, rank: i + 1 }))
    default:
      return leaderboard.allTimeRanking
  }
})

const myStats = computed(() => leaderboard.myStats)
const myAllTimeRank = computed(() => leaderboard.myAllTimeRank)
const activeChallengeList = computed(() => leaderboard.activeChallengeList)
const challengeHistory = computed(() => leaderboard.challengeHistory)

const isValidChallenge = computed(() => {
  return newChallenge.value.target > 0 && newChallenge.value.target <= getMaxTarget()
})

onMounted(() => {
  // 先加载 stats（getMyCurrentStats 依赖其 state），再初始化排行榜
  stats.load()
  leaderboard.init()
  leaderboard.updateMyStats()
  leaderboard.checkChallenges(stats)
})

// tab 切换时同步到 URL
function switchTab(id) {
  activeTab.value = id
  router.replace({ query: { ...route.query, tab: id } })
}

// 浏览器前进/后退时恢复 tab 状态
watch(() => route.query.tab, (tab) => {
  if (tab && ['score', 'speed', 'accuracy', 'streak'].includes(tab) && tab !== activeTab.value) {
    activeTab.value = tab
  }
})

function getChallengeIcon(type) {
  const icons = { accuracy: '准', speed: '速', streak: '连', chars: '字' }
  return icons[type] || '准'
}

function getChallengeTitle(challenge) {
  const typeNames = { accuracy: '准确率', speed: '速度', streak: '连续天数', chars: '练习字数' }
  const units = { accuracy: '%', speed: '字/分', streak: '天', chars: '字' }
  return `${typeNames[challenge.type]}达到${challenge.target}${units[challenge.type]}`
}

function getChallengeTypeName(type) {
  const names = { accuracy: '准确率挑战', speed: '速度挑战', streak: '连续练习挑战', chars: '练习字数挑战' }
  return names[type] || '挑战'
}

function getProgressPercent(challenge) {
  return Math.min(100, (challenge.progress / challenge.target) * 100)
}

function getTargetPlaceholder() {
  const placeholders = { accuracy: '95', speed: '80', streak: '7', chars: '5000' }
  return placeholders[newChallenge.value.type]
}

function getTargetHint() {
  const hints = {
    accuracy: '建议: 90-100%',
    speed: '建议: 60-150字/分',
    streak: '建议: 7-30天',
    chars: '建议: 1000-10000字',
  }
  return hints[newChallenge.value.type]
}

function getMaxTarget() {
  const max = { accuracy: 100, speed: 300, streak: 365, chars: 1000000 }
  return max[newChallenge.value.type]
}

function createChallenge() {
  if (!isValidChallenge.value) return

  leaderboard.createChallenge(
    newChallenge.value.type,
    newChallenge.value.target,
    newChallenge.value.duration
  )

  showCreateChallenge.value = false
  newChallenge.value = { type: 'accuracy', target: 95, duration: 7 }
}

function shareChallenge(challenge) {
  shareChallengeData.value = {
    type: challenge.type,
    target: challenge.target,
    from: leaderboard.userName,
  }
  shareLink.value = leaderboard.generateChallengeLink(challenge)
  showShareChallenge.value = true
}

function copyShareLink() {
  if (shareLinkInput.value) {
    shareLinkInput.value.select()
    document.execCommand('copy')
    alert('链接已复制！')
  }
}

function shareToTwitter() {
  const text = encodeURIComponent(`${shareChallengeData.value?.from || '我'} 向你发起双拼挑战：${getChallengeTypeName(shareChallengeData.value?.type)}，目标 ${shareChallengeData.value?.target}！一起来练习吧！`)
  const url = `https://twitter.com/intent/tweet?text=${text}`
  window.open(url, '_blank', 'width=600,height=400')
}

function shareToWeibo() {
  const text = encodeURIComponent(`${shareChallengeData.value?.from || '我'} 向你发起双拼挑战：${getChallengeTypeName(shareChallengeData.value?.type)}，目标 ${shareChallengeData.value?.target}！一起来练习吧！`)
  const url = `https://service.weibo.com/share/share.php?title=${text}&url=${encodeURIComponent(window.location.origin)}`
  window.open(url, '_blank', 'width=600,height=400')
}

function shareToQQ() {
  const text = encodeURIComponent(`${shareChallengeData.value?.from || '我'} 向你发起双拼挑战`)
  const desc = encodeURIComponent(`${getChallengeTypeName(shareChallengeData.value?.type)}，目标 ${shareChallengeData.value?.target}！一起来练习双拼吧！`)
  const url = `https://connect.qq.com/widget/shareqq/index.html?title=${text}&summary=${desc}&url=${encodeURIComponent(window.location.origin)}`
  window.open(url, '_blank', 'width=600,height=400')
}

function formatNumber(num) {
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + '万'
  }
  return num.toLocaleString()
}

function formatDate(timestamp) {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  return `${date.getMonth() + 1}/${date.getDate()}`
}

function openShareCard() {
  showShareCard.value = true
}
</script>

<style scoped>
.leaderboard-page {
  min-height: 100vh;
  background: var(--theme-background-color);
}

.page-content {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  padding-top: 72px;
}

.header {
  text-align: center;
  margin-bottom: 24px;
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

/* 我的排名卡片 */
.my-rank-card {
  display: flex;
  align-items: center;
  gap: 16px;
  background: linear-gradient(135deg, #35e2b7, #2aa88a);
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 24px;
  color: #0b1a14;
}

.rank-avatar {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
}

.rank-info {
  flex: 1;
}

.rank-name {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 8px;
}

.rank-stats {
  display: flex;
  gap: 16px;
}

.rank-stat {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  font-weight: 500;
}

.stat-icon {
  font-size: 14px;
}

.rank-position {
  text-align: center;
  padding-left: 16px;
  border-left: 1px solid rgba(0, 0, 0, 0.1);
}

.rank-position .rank-number {
  font-size: 32px;
  font-weight: 700;
  line-height: 1;
}

.rank-position .rank-label {
  font-size: 12px;
  opacity: 0.8;
  margin-top: 4px;
}

/* 标签栏 */
.tab-bar {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  background: var(--theme-background-light-color);
  padding: 4px;
  border-radius: 12px;
  border: 1px solid var(--theme-border-color);
}

.tab-btn {
  flex: 1;
  padding: 10px 16px;
  border: none;
  background: transparent;
  color: var(--theme-text-color);
  font-size: 14px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.tab-btn.active {
  background: #35e2b7;
  color: #0b1a14;
  font-weight: 500;
}

/* 排行榜列表 */
.leaderboard-list {
  background: var(--theme-background-light-color);
  border: 1px solid var(--theme-border-color);
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 24px;
}

.list-header {
  display: grid;
  grid-template-columns: 60px 1fr 80px 80px;
  gap: 12px;
  padding: 12px 16px;
  background: var(--theme-background-color);
  font-size: 12px;
  color: var(--theme-text-color);
  font-weight: 500;
  border-bottom: 1px solid var(--theme-border-color);
}

.list-body {
  max-height: 400px;
  overflow-y: auto;
}

.rank-item {
  display: grid;
  grid-template-columns: 60px 1fr 80px 80px;
  gap: 12px;
  padding: 12px 16px;
  align-items: center;
  border-bottom: 1px solid var(--theme-border-color);
  transition: background 0.2s;
}

.rank-item:last-child {
  border-bottom: none;
}

.rank-item:hover {
  background: var(--theme-background-color);
}

.rank-item.is-me {
  background: rgba(53, 226, 183, 0.1);
}

.rank-item.top-3 {
  font-weight: 500;
}

.col-rank {
  text-align: center;
}

.rank-badge {
  font-size: 20px;
}

.rank-number {
  color: var(--theme-text-color);
  font-size: 14px;
}

.col-user {
  display: flex;
  align-items: center;
  gap: 8px;
}

.user-avatar {
  font-size: 20px;
}

.user-name {
  color: var(--theme-main-text-color);
  font-size: 14px;
}

.me-badge {
  font-size: 10px;
  padding: 2px 6px;
  background: #35e2b7;
  color: #0b1a14;
  border-radius: 4px;
  font-weight: 500;
}

.col-score,
.col-stat {
  text-align: right;
  font-size: 14px;
  color: var(--theme-text-color);
}

/* 挑战区域 */
.challenges-section {
  background: var(--theme-background-light-color);
  border: 1px solid var(--theme-border-color);
  border-radius: 12px;
  padding: 20px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.section-header h2 {
  font-size: 16px;
  font-weight: 600;
  color: var(--theme-main-text-color);
  margin: 0;
}

.create-btn {
  padding: 8px 16px;
  border-radius: 8px;
  border: none;
  background: #35e2b7;
  color: #0b1a14;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.create-btn:hover {
  background: #2aa88a;
}

.challenge-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.challenge-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: var(--theme-background-color);
  border-radius: 12px;
  border: 1px solid var(--theme-border-color);
}

.challenge-icon {
  font-size: 28px;
}

.challenge-info {
  flex: 1;
}

.challenge-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--theme-main-text-color);
  margin-bottom: 8px;
}

.challenge-progress {
  display: flex;
  align-items: center;
  gap: 12px;
}

.progress-bar {
  flex: 1;
  height: 8px;
  background: var(--theme-border-color);
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #35e2b7, #2aa88a);
  border-radius: 4px;
  transition: width 0.3s;
}

.progress-text {
  font-size: 12px;
  color: var(--theme-text-color);
  min-width: 60px;
  text-align: right;
}

.challenge-actions {
  display: flex;
  gap: 8px;
}

.share-challenge-btn {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  border: 1px solid var(--theme-border-color);
  background: var(--theme-background-light-color);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  transition: all 0.2s;
}

.share-challenge-btn:hover {
  background: var(--theme-menu-hover-color);
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.empty-text {
  color: var(--theme-text-color);
  font-size: 14px;
  margin-bottom: 16px;
}

.create-btn-large {
  padding: 12px 24px;
  border-radius: 10px;
  border: none;
  background: #35e2b7;
  color: #0b1a14;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.create-btn-large:hover {
  background: #2aa88a;
}

.challenge-history {
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid var(--theme-border-color);
}

.challenge-history h3 {
  font-size: 14px;
  font-weight: 600;
  color: var(--theme-main-text-color);
  margin-bottom: 12px;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.history-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  background: var(--theme-background-color);
  border-radius: 8px;
  font-size: 13px;
}

.history-item.completed {
  border-left: 3px solid #67c23a;
}

.history-item.abandoned {
  border-left: 3px solid #f56c6c;
}

.history-title {
  flex: 1;
  color: var(--theme-main-text-color);
}

.history-date {
  color: var(--theme-text-color);
  font-size: 12px;
}

/* 弹窗 */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: 20px;
}

.modal {
  background: var(--theme-background-light-color);
  border-radius: 16px;
  width: 100%;
  max-width: 400px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid var(--theme-border-color);
}

.modal-header h3 {
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

.modal-body {
  padding: 20px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: var(--theme-main-text-color);
  margin-bottom: 8px;
}

.challenge-types {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.type-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 16px 12px;
  border: 1px solid var(--theme-border-color);
  border-radius: 10px;
  background: var(--theme-background-color);
  cursor: pointer;
  transition: all 0.2s;
}

.type-btn.active {
  border-color: #35e2b7;
  background: rgba(53, 226, 183, 0.1);
}

.type-icon {
  font-size: 24px;
}

.type-name {
  font-size: 12px;
  color: var(--theme-text-color);
}

.form-input {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid var(--theme-border-color);
  border-radius: 10px;
  background: var(--theme-background-color);
  color: var(--theme-main-text-color);
  font-size: 14px;
  box-sizing: border-box;
}

.input-hint {
  display: block;
  font-size: 12px;
  color: var(--theme-text-color);
  margin-top: 6px;
}

.duration-options {
  display: flex;
  gap: 8px;
}

.duration-btn {
  flex: 1;
  padding: 10px;
  border: 1px solid var(--theme-border-color);
  border-radius: 8px;
  background: var(--theme-background-color);
  color: var(--theme-text-color);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.duration-btn.active {
  border-color: #35e2b7;
  background: rgba(53, 226, 183, 0.1);
  color: #35e2b7;
}

.modal-footer {
  display: flex;
  gap: 12px;
  padding: 16px 20px;
  border-top: 1px solid var(--theme-border-color);
}

.btn-secondary,
.btn-primary {
  flex: 1;
  padding: 12px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-secondary {
  border: 1px solid var(--theme-border-color);
  background: var(--theme-background-color);
  color: var(--theme-text-color);
}

.btn-secondary:hover {
  background: var(--theme-border-color);
}

.btn-primary {
  border: none;
  background: #35e2b7;
  color: #0b1a14;
}

.btn-primary:hover:not(:disabled) {
  background: #2aa88a;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 分享弹窗 */
.share-modal .modal-body {
  padding: 20px;
}

.share-preview {
  margin-bottom: 16px;
}

.share-card {
  background: linear-gradient(135deg, #35e2b7, #2aa88a);
  border-radius: 12px;
  padding: 20px;
  color: #0b1a14;
  text-align: center;
}

.share-title {
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 12px;
}

.share-content {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  padding: 16px;
  margin-bottom: 12px;
}

.challenge-type {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 4px;
}

.challenge-target {
  font-size: 14px;
  opacity: 0.9;
}

.share-footer {
  font-size: 13px;
  opacity: 0.8;
}

.share-link {
  display: flex;
  gap: 8px;
}

.share-link input {
  flex: 1;
  padding: 12px;
  border: 1px solid var(--theme-border-color);
  border-radius: 8px;
  background: var(--theme-background-color);
  color: var(--theme-text-color);
  font-size: 13px;
}

.share-link button {
  padding: 12px 20px;
  border: none;
  border-radius: 8px;
  background: #35e2b7;
  color: #0b1a14;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
}

/* 社交媒体分享按钮 */
.share-social {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--theme-border-color);
}

.share-label {
  font-size: 13px;
  color: var(--theme-text-color);
  white-space: nowrap;
}

.social-btns {
  display: flex;
  gap: 8px;
}

.social-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 1px solid var(--theme-border-color);
  background: var(--theme-background-color);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  transition: all 0.2s;
}

.social-btn:hover {
  transform: scale(1.1);
}

.social-btn.twitter:hover {
  background: #000;
  border-color: #000;
  color: #fff;
}

.social-btn.weibo:hover {
  background: #e6162d;
  border-color: #e6162d;
  color: #fff;
}

.social-btn.qq:hover {
  background: #12b7f5;
  border-color: #12b7f5;
  color: #fff;
}

/* 快速分享区域 */
.quick-share-section {
  margin-bottom: 24px;
}

.quick-share-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 20px;
  background: linear-gradient(135deg, rgba(53, 226, 183, 0.15), rgba(53, 226, 183, 0.05));
  border: 1px solid rgba(53, 226, 183, 0.3);
  border-radius: 12px;
}

.quick-share-text {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;
  color: var(--theme-main-text-color);
}

.share-emoji {
  font-size: 28px;
}

.quick-share-text strong {
  color: #35e2b7;
  font-size: 18px;
}

.quick-share-btn {
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  background: #35e2b7;
  color: #0b1a14;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.quick-share-btn:hover {
  background: #2aa88a;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(53, 226, 183, 0.3);
}

.footer-space {
  height: 40px;
}

@media (max-width: 480px) {
  .my-rank-card {
    flex-direction: column;
    text-align: center;
  }

  .rank-position {
    padding-left: 0;
    padding-top: 16px;
    border-left: none;
    border-top: 1px solid rgba(0, 0, 0, 0.1);
  }

  .rank-stats {
    justify-content: center;
  }

  .list-header {
    display: none;
  }

  .rank-item {
    grid-template-columns: 50px 1fr auto;
    gap: 8px;
  }

  .col-score {
    display: none;
  }

  .challenge-types {
    grid-template-columns: 1fr;
  }

  .quick-share-card {
    flex-direction: column;
    text-align: center;
  }

  .quick-share-text {
    flex-direction: column;
  }

  .quick-share-btn {
    width: 100%;
  }

  .share-social {
    flex-direction: column;
    gap: 12px;
  }

  .social-btns {
    justify-content: center;
  }
}
</style>
