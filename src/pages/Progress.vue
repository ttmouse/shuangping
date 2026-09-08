<template>
  <div class="progress-page">
    <TopStatusBar />

    <div class="page-content">
      <div class="header">
        <h1>学习进度</h1>
        <p class="subtitle">追踪你的双拼学习之旅</p>
      </div>

      <!-- 成就补发提示：老数据已满足条件的成就自动解锁 -->
      <div v-if="backfillNotice" class="backfill-notice">{{ backfillNotice }}</div>

      <!-- 荣誉总览：等级 / 自定义称号 / 段位 / 收集率 -->
      <div class="honor-panel">
        <div class="honor-main">
          <div class="honor-item">
            <div class="honor-badge level-badge">Lv.{{ honor.level }}</div>
            <div class="honor-meta">
              <div class="honor-title-line">
                <span class="honor-title" :class="{ 'title-empty': !honor.title }">{{ honor.title || '设置你的称号' }}</span>
                <button class="title-edit-btn" title="编辑称号" @click="openTitleEditor"><Pencil :size="12" /></button>
              </div>
              <div class="honor-bar"><div class="honor-fill" :style="{ width: honor.pct + '%' }"></div></div>
              <div class="honor-sub">{{ honor.xp }} XP<template v-if="honor.next"> · 距 Lv.{{ honor.level + 1 }} 还差 {{ honor.next - honor.xp }}</template></div>
            </div>
          </div>
          <div class="honor-item">
            <div class="honor-badge rank-badge">{{ rank.rank }}</div>
            <div class="honor-meta">
              <div class="honor-title">段位 · {{ rank.rank }}</div>
              <div class="honor-bar"><div class="honor-fill rank-fill" :style="{ width: rank.pct + '%' }"></div></div>
              <div class="honor-sub">段位分 {{ rank.score }}<template v-if="rank.next"> · 距{{ nextRankName(rank.next) }}还差 {{ rank.next - rank.score }}</template></div>
            </div>
          </div>
        </div>
        <div class="honor-collect">
          <div class="collect-ring" :style="{ background: collectRingStyle }">
            <span class="collect-num">{{ progress.unlockedAchievements.length }}</span>
          </div>
          <div class="collect-meta">
            <div class="collect-title">成就收集</div>
            <div class="collect-sub">共 {{ progress.allAchievements.length }} 张</div>
          </div>
        </div>
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

      <!-- 能力雷达：六维能力可视化 -->
      <div class="radar-card">
        <h2>能力雷达</h2>
        <svg viewBox="0 0 280 252" class="radar-svg" role="img" aria-label="六维能力雷达图">
          <polygon v-for="(g, gi) in radarGrid" :key="'g' + gi" :points="g" class="radar-grid" />
          <line v-for="ax in radarAxes" :key="'a' + ax.key" :x1="ax.x1" :y1="ax.y1" :x2="ax.x2" :y2="ax.y2" class="radar-axis" />
          <polygon :points="radarPolygon" class="radar-area" />
          <circle v-for="p in radarPoints" :key="'d' + p.name" :cx="p.x" :cy="p.y" r="4" class="radar-dot" />
          <text v-for="ax in radarAxes" :key="'t' + ax.key" :x="ax.tx" :y="ax.ty" class="radar-label" text-anchor="middle" dominant-baseline="middle">{{ ax.name }}</text>
          <text v-for="p in radarPoints" :key="'v' + p.name" :x="p.x" :y="p.y - 9" class="radar-value" text-anchor="middle">{{ p.value }}</text>
        </svg>
        <p class="radar-hint">速度上限 150 字/分 · 连击 150 · 连续 100 天 · 时长 100 小时 · 掌握 3 个技能达 3 级</p>
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

      <!-- 每日 / 每周任务：完成后领取经验值 -->
      <div class="tasks-card">
        <h2>每日任务 <small class="task-hint">完成后领取经验值</small></h2>
        <div v-for="t in progress.dailyTaskView" :key="t.id" class="task-row">
          <div class="task-info">
            <span class="task-name">{{ t.name }}</span>
            <span class="task-desc">{{ t.desc }}</span>
          </div>
          <div class="task-bar"><div class="task-fill" :style="{ width: (t.current / t.target * 100) + '%' }"></div></div>
          <span class="task-num">{{ t.current }}/{{ t.target }}{{ t.unit }}</span>
          <button class="task-claim" :class="{ ready: t.done && !t.claimed, claimed: t.claimed }" :disabled="!t.done || t.claimed" @click="claimTask('daily', t)">{{ t.claimed ? '已领取' : t.done ? '领取 +' + t.xp + 'XP' : '进行中' }}</button>
        </div>
        <h2 class="task-week-title">本周任务</h2>
        <div v-for="t in progress.weeklyTaskView" :key="t.id" class="task-row">
          <div class="task-info">
            <span class="task-name">{{ t.name }}</span>
            <span class="task-desc">{{ t.desc }}</span>
          </div>
          <div class="task-bar"><div class="task-fill" :style="{ width: (t.current / t.target * 100) + '%' }"></div></div>
          <span class="task-num">{{ t.current }}/{{ t.target }}{{ t.unit }}</span>
          <button class="task-claim" :class="{ ready: t.done && !t.claimed, claimed: t.claimed }" :disabled="!t.done || t.claimed" @click="claimTask('weekly', t)">{{ t.claimed ? '已领取' : t.done ? '领取 +' + t.xp + 'XP' : '进行中' }}</button>
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
            <span class="filter-sep"></span>
            <button
              v-for="cat in categoryFilters"
              :key="cat.key"
              class="filter-btn"
              :class="{ active: categoryFilter === cat.key }"
              @click="categoryFilter = cat.key"
            >
              {{ cat.label }}
            </button>
            <span class="filter-sep"></span>
            <select v-model="rarityFilter" class="rarity-select" aria-label="按稀有度筛选">
              <option value="all">全部品质</option>
              <option value="common">常见</option>
              <option value="uncommon">稀有</option>
              <option value="rare">珍稀</option>
              <option value="epic">史诗</option>
              <option value="legendary">传说</option>
            </select>
          </div>
        </div>
        <!-- 分类收集进度 -->
        <div class="category-progress">
          <div v-for="cat in categoryProgress" :key="cat.category" class="cat-chip" :title="CATEGORY_LABELS[cat.category] || cat.category">
            <div class="cat-ring" :style="{ background: catRingStyle(cat) }">
              <span class="cat-pct">{{ cat.pct }}%</span>
            </div>
            <span class="cat-label">{{ CATEGORY_LABELS[cat.category] || cat.category }}</span>
            <span class="cat-count">{{ cat.unlocked }}/{{ cat.total }}</span>
          </div>
        </div>
        <!-- 成就墙：平铺展示（收藏的排最前并带 📌 角标；筛选交给顶部状态/分类/品质） -->
        <div class="achievements-grid">
          <div
            v-for="achievement in filteredAchievements"
            :key="achievement.id"
            class="card-hit"
            @mousemove="handleCardTilt"
            @mouseleave="handleCardLeave"
            @click="openDetail(achievement)"
          >
            <div
              class="achievement-card"
              :class="[achievement.rarity, { unlocked: isAchievementUnlocked(achievement.id) }]"
            >
              <div class="card-layer layer-1"></div>
              <div class="card-layer layer-2"></div>
              <span v-if="isPinned(achievement.id)" class="pin-mark">📌</span>
              <div class="achievement-icon" :class="{ multi: isMultiIcon(achievement.icon) && !isHiddenCard(achievement) }">{{ cardIcon(achievement) }}</div>
              <div class="achievement-name">{{ cardName(achievement) }}</div>
              <div class="achievement-desc">{{ cardDesc(achievement) }}</div>
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
              <span v-if="isAchievementUnlocked(achievement.id) && achievementTier(achievement.id) > 0" class="tier-badge">{{ tierIcon(achievement.id) }}</span>
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

      <!-- 称号编辑器弹层 -->
      <div v-if="showTitleEditor" class="title-overlay" @click.self="showTitleEditor = false">
        <div class="title-editor">
          <h3>设置称号</h3>
          <p class="title-editor-hint">称号会展示在你的荣誉面板上，可随时修改</p>
          <div class="title-input-row">
            <input v-model="titleDraft" maxlength="12" placeholder="输入你的称号（最多 12 字）" @keyup.enter="saveTitle" />
            <button class="title-save-btn" @click="saveTitle">保存</button>
          </div>
          <div class="title-presets" v-if="progress.titlePresets.length">
            <div class="title-presets-label">成就称号 · 解锁后可用</div>
            <div class="title-preset-grid">
              <button
                v-for="p in progress.titlePresets"
                :key="p.id"
                class="title-preset-btn"
                :class="{ locked: !p.unlocked, current: isCurrentTitle(p.name) }"
                :disabled="!p.unlocked"
                @click="titleDraft = p.name"
              >{{ p.name }}<span v-if="!p.unlocked" class="title-preset-lock">🔒</span></button>
            </div>
          </div>
        </div>
      </div>

      <!-- 成就详情弹窗 -->
      <div v-if="detailAchievement" class="detail-overlay" @click.self="detailAchievement = null">
        <div class="detail-modal" :class="detailAchievement.rarity">
          <button class="detail-close" @click="detailAchievement = null" aria-label="关闭">✕</button>
          <div class="detail-icon">{{ detailIcon }}</div>
          <div class="detail-name">{{ detailName }}</div>
          <div class="detail-rarity">{{ RARITY_LABELS[detailAchievement.rarity] }}<template v-if="detailAchievement.category"> · {{ CATEGORY_LABELS[detailAchievement.category] }}</template></div>
          <div class="detail-desc">{{ detailDesc }}</div>
          <div v-if="detailProgress" class="detail-progress">
            <div class="detail-progress-track"><div class="detail-progress-fill" :style="{ width: detailProgress.pct + '%' }"></div></div>
            <div class="detail-progress-text">{{ detailProgress.current }}/{{ detailProgress.target }}{{ detailProgress.unit }}</div>
          </div>
          <div v-if="detailUnlocked" class="detail-unlocked-at">解锁于 {{ formatFullDate(detailAchievement.id) }}</div>
          <div class="detail-actions">
            <button class="detail-action" @click="togglePinDetail">{{ isPinned(detailAchievement.id) ? '取消置顶' : '⭐ 置顶收藏' }}</button>
            <button v-if="presetOf(detailAchievement)" class="detail-action" @click="usePresetTitle">{{ isCurrentTitle(presetOf(detailAchievement).name) ? '✓ 使用中' : '🏷️ 设为称号' }}</button>
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
import { Flame, Repeat, Clock, CalendarCheck, Target, CheckCircle2, Download, Upload, RotateCcw, Lock, Trophy, Zap, Pencil } from 'lucide-vue-next'
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

// 稀有度以成就定义（achievement.rarity）为准，不再硬编码列表
// （修复：streak-100 定义为 legendary 却被旧硬编码列表归为 epic 的问题）

const CATEGORY_LABELS = {
  milestone: '里程碑',
  accuracy: '准确率',
  speed: '速度',
  streak: '连续',
  combo: '连击',
  special: '特殊',
  growth: '成长'
}

const achievementFilters = [
  { key: 'all', label: '全部' },
  { key: 'unlocked', label: '已解锁' },
  { key: 'locked', label: '未解锁' }
]

const categoryFilters = [
  { key: 'all', label: '全部分类' },
  ...Object.entries(CATEGORY_LABELS).map(([key, label]) => ({ key, label }))
]

const categoryFilter = ref('all')
const rarityFilter = ref('all')

// ===== 扩充2：详情 / 称号 / 任务 / 补发 =====
const RARITY_LABELS = { common: '常见', uncommon: '稀有', rare: '珍稀', epic: '史诗', legendary: '传说' }
const backfillNotice = ref('')
const detailAchievement = ref(null)
const showTitleEditor = ref(false)
const titleDraft = ref('')

// 收藏判断与详情打开
function isPinned(id) {
  return progress.pinnedAchievements.includes(id)
}
function openDetail(achievement) {
  detailAchievement.value = achievement
}
function togglePinDetail() {
  if (!detailAchievement.value) return
  progress.togglePin(detailAchievement.value.id)
}

// 详情弹窗派生数据
const detailIcon = computed(() => detailAchievement.value ? cardIcon(detailAchievement.value) : '')
const detailName = computed(() => detailAchievement.value ? cardName(detailAchievement.value) : '')
const detailDesc = computed(() => detailAchievement.value ? cardDesc(detailAchievement.value) : '')
const detailProgress = computed(() => {
  if (!detailAchievement.value || isAchievementUnlocked(detailAchievement.value.id)) return null
  return progressMap.value[detailAchievement.value.id] || null
})
const detailUnlocked = computed(() => detailAchievement.value && isAchievementUnlocked(detailAchievement.value.id))
function formatFullDate(achievementId) {
  const ts = progress.achievementUnlockTimes[achievementId]
  if (!ts) return ''
  const d = new Date(ts)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// 自定义称号：编辑 / 保存 / 成就称号预设
function openTitleEditor() {
  titleDraft.value = progress.customTitle || ''
  showTitleEditor.value = true
}
function saveTitle() {
  progress.setCustomTitle(titleDraft.value)
  showTitleEditor.value = false
}
function presetOf(achievement) {
  return progress.titlePresets.find(p => p.achievementId === achievement.id) || null
}
function isCurrentTitle(name) {
  return progress.customTitle === name
}
function usePresetTitle() {
  const p = presetOf(detailAchievement.value)
  if (!p) return
  progress.setCustomTitle(p.name)
  detailAchievement.value = null
}

// 任务领取
function claimTask(type, task) {
  progress.claimTask(type, task.id)
}

// 能力雷达：六维（速度/准确/连击/连续/时长/掌握）归一化 0-100
const RADAR_DEFS = [
  { key: 'speed', name: '速度' },
  { key: 'accuracy', name: '准确' },
  { key: 'combo', name: '连击' },
  { key: 'streak', name: '连续' },
  { key: 'time', name: '时长' },
  { key: 'mastery', name: '掌握' }
]
const RADAR_CX = 140
const RADAR_CY = 126
const RADAR_R = 86
function radarPoint(value, idx) {
  const angle = (-90 + idx * 60) * Math.PI / 180
  const r = RADAR_R * (value / 100)
  return { x: RADAR_CX + r * Math.cos(angle), y: RADAR_CY + r * Math.sin(angle) }
}
const radarValues = computed(() => {
  const totalChars = stats.totalCharsTyped || 0
  const acc = totalChars > 0 ? Math.round(stats.totalCorrectChars / totalChars * 100) : 0
  const mastered = Object.values(progress.skillMastery || {}).filter(m => (m?.level || 0) >= 3).length
  return {
    speed: Math.min(100, Math.round((stats.averageSpeed || 0) / 150 * 100)),
    accuracy: acc,
    combo: Math.min(100, Math.round((progress.maxCombo || 0) / 150 * 100)),
    streak: Math.min(100, Math.round((streakDays.value || 0) / 100 * 100)),
    time: Math.min(100, Math.round((progress.learningTimeTotal || 0) / 6000 * 100)),
    mastery: Math.min(100, Math.round(mastered / 3 * 100))
  }
})
const radarGrid = computed(() =>
  [0.25, 0.5, 0.75, 1].map(frac =>
    RADAR_DEFS.map((_, i) => {
      const p = radarPoint(frac * 100, i)
      return `${p.x.toFixed(1)},${p.y.toFixed(1)}`
    }).join(' ')
  )
)
const radarAxes = computed(() =>
  RADAR_DEFS.map((d, i) => {
    const angle = (-90 + i * 60) * Math.PI / 180
    const end = { x: RADAR_CX + RADAR_R * Math.cos(angle), y: RADAR_CY + RADAR_R * Math.sin(angle) }
    const labelR = RADAR_R + 20
    return {
      key: d.key,
      name: d.name,
      x1: RADAR_CX,
      y1: RADAR_CY,
      x2: end.x.toFixed(1),
      y2: end.y.toFixed(1),
      tx: (RADAR_CX + labelR * Math.cos(angle)).toFixed(1),
      ty: (RADAR_CY + labelR * Math.sin(angle)).toFixed(1)
    }
  })
)
const radarPolygon = computed(() =>
  RADAR_DEFS.map((d, i) => {
    const p = radarPoint(radarValues.value[d.key], i)
    return `${p.x.toFixed(1)},${p.y.toFixed(1)}`
  }).join(' ')
)
const radarPoints = computed(() =>
  RADAR_DEFS.map((d, i) => {
    const v = radarValues.value[d.key]
    const p = radarPoint(v, i)
    return { name: d.name, value: v, x: p.x.toFixed(1), y: p.y.toFixed(1) }
  })
)

// 稀有度权重：同解锁状态下，高稀有度排前
const RARITY_WEIGHT = { legendary: 5, epic: 4, rare: 3, uncommon: 2, common: 1 }

const filteredAchievements = computed(() => {
  let list = progress.allAchievements

  if (currentFilter.value === 'unlocked') {
    list = list.filter(a => progress.unlockedAchievements.includes(a.id))
  } else if (currentFilter.value === 'locked') {
    list = list.filter(a => !progress.unlockedAchievements.includes(a.id))
  }
  if (categoryFilter.value !== 'all') {
    list = list.filter(a => a.category === categoryFilter.value)
  }
  if (rarityFilter.value !== 'all') {
    list = list.filter(a => a.rarity === rarityFilter.value)
  }

  // 收藏的排最前，其次已解锁在前，同状态按稀有度从高到低
  return [...list].sort((a, b) => {
    const aPinned = progress.pinnedAchievements.includes(a.id)
    const bPinned = progress.pinnedAchievements.includes(b.id)
    if (aPinned && !bPinned) return -1
    if (!aPinned && bPinned) return 1
    const aUnlocked = progress.unlockedAchievements.includes(a.id)
    const bUnlocked = progress.unlockedAchievements.includes(b.id)
    if (aUnlocked && !bUnlocked) return -1
    if (!aUnlocked && bUnlocked) return 1
    return (RARITY_WEIGHT[b.rarity] || 0) - (RARITY_WEIGHT[a.rarity] || 0)
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

// 隐藏成就：未解锁时显示为神秘卡片
function isHiddenCard(achievement) {
  return !!achievement.hidden && !isAchievementUnlocked(achievement.id)
}
function cardIcon(achievement) {
  return isHiddenCard(achievement) ? '🎴' : achievement.icon
}
function cardName(achievement) {
  return isHiddenCard(achievement) ? '神秘成就' : achievement.name
}
function cardDesc(achievement) {
  return isHiddenCard(achievement) ? '达成条件未知，等待被发现' : achievement.description
}

// 卡牌三档升级：定义里带 tiers（银/金阈值）的累计型成就，超出阈值自动升级徽章
function achievementTier(achievementId) {
  const p = progressMap.value[achievementId]
  if (!p || !p.tiers) return 0
  let tier = 0
  if (p.current >= p.tiers[0]) tier = 1
  if (p.current >= p.tiers[1]) tier = 2
  return tier
}
function tierIcon(achievementId) {
  return ['', '🥈', '🥇'][achievementTier(achievementId)]
}

// 荣誉总览：等级 / 段位 / 分类收集
const honor = computed(() => progress.levelInfo)
const rank = computed(() => progress.rankInfo)
const categoryProgress = computed(() => progress.categoryProgress)
const collectPct = computed(() => {
  const total = progress.allAchievements.length
  return total ? Math.round(progress.unlockedAchievements.length / total * 100) : 0
})
const collectRingStyle = computed(() =>
  `conic-gradient(#b59872 ${collectPct.value}%, var(--theme-border-color) ${collectPct.value}%)`
)
function catRingStyle(cat) {
  return `conic-gradient(#8aa8a2 ${cat.pct}%, var(--theme-border-color) ${cat.pct}%)`
}
function nextRankName(score) {
  const map = { 40: '白银', 60: '黄金', 80: '铂金', 95: '钻石', 110: '星耀', 125: '王者' }
  return map[score] || ''
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
  // 成就补发：全量检查一次，老数据已满足条件的成就自动解锁（会话类成就除外，须当刻达成）
  const newlyUnlocked = progress.checkAchievements(stats)
  if (newlyUnlocked.length) {
    backfillNotice.value = `🎉 检测到 ${newlyUnlocked.length} 个成就已满足条件，已自动解锁`
    setTimeout(() => { backfillNotice.value = '' }, 8000)
  }
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

/* 荣誉总览面板 */
.honor-panel {
  display: flex;
  align-items: stretch;
  gap: 16px;
  margin-bottom: 32px;
  flex-wrap: wrap;
}

.honor-main {
  flex: 1 1 380px;
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.honor-item {
  flex: 1 1 220px;
  display: flex;
  align-items: center;
  gap: 14px;
  background: var(--theme-background-light-color);
  border: 1px solid var(--theme-border-color);
  border-radius: 16px;
  padding: 18px;
  min-width: 0;
}

.honor-badge {
  flex: 0 0 auto;
  width: 58px;
  height: 58px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  color: #fff;
  font-size: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
}

.level-badge {
  background: linear-gradient(135deg, #8aa8a2, #5c7a74);
}

.rank-badge {
  background: linear-gradient(135deg, #b59872, #8a6f45);
}

.honor-meta {
  flex: 1 1 auto;
  min-width: 0;
}

.honor-title {
  font-size: 15px;
  font-weight: 700;
  color: var(--theme-text-color);
  margin-bottom: 6px;
}

.honor-bar {
  height: 8px;
  border-radius: 4px;
  background: var(--theme-border-color);
  overflow: hidden;
}

.honor-fill {
  display: block;
  height: 100%;
  background: #8aa8a2;
  border-radius: 4px;
  transition: width .3s ease;
}

.rank-fill {
  background: linear-gradient(90deg, #b59872, #8a6f45);
}

.honor-sub {
  margin-top: 6px;
  font-size: 11px;
  color: var(--theme-text-color);
  opacity: 0.6;
  font-variant-numeric: tabular-nums;
}

.honor-collect {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  gap: 14px;
  background: var(--theme-background-light-color);
  border: 1px solid var(--theme-border-color);
  border-radius: 16px;
  padding: 18px 22px;
}

.collect-ring {
  width: 58px;
  height: 58px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.collect-num {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: var(--theme-background-light-color);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  font-weight: 700;
  color: var(--theme-text-color);
}

.collect-title {
  font-size: 14px;
  font-weight: 700;
  color: var(--theme-text-color);
}

.collect-sub {
  font-size: 11px;
  color: var(--theme-text-color);
  opacity: 0.6;
  margin-top: 2px;
}

/* 分类收集进度 */
.category-progress {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 20px;
}

.cat-chip {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--theme-background-light-color);
  border: 1px solid var(--theme-border-color);
  border-radius: 12px;
  padding: 8px 12px;
}

.cat-ring {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
}

.cat-pct {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: var(--theme-background-light-color);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 9px;
  font-weight: 700;
  color: var(--theme-text-color);
}

.cat-label {
  font-size: 12px;
  color: var(--theme-text-color);
}

.cat-count {
  font-size: 11px;
  color: var(--theme-text-color);
  opacity: 0.6;
  font-variant-numeric: tabular-nums;
}

/* 筛选分隔与品质下拉 */
.filter-sep {
  width: 1px;
  align-self: stretch;
  background: var(--theme-border-color);
  margin: 2px 2px;
}

.rarity-select {
  padding: 6px 10px;
  border: 1px solid var(--theme-border-color);
  background: var(--theme-background-light-color);
  color: var(--theme-text-color);
  border-radius: 20px;
  font-size: 13px;
  cursor: pointer;
  outline: none;
}

/* 卡牌三档升级徽章 */
.tier-badge {
  position: absolute;
  top: 12px;
  left: 12px;
  font-size: 18px;
  z-index: 3;
  filter: drop-shadow(0 1px 3px rgba(0, 0, 0, 0.25));
}

/* 隐藏成就（未解锁）灰暗神秘 */
.achievement-card .achievement-name {
  letter-spacing: 0.3px;
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
/* ===== 扩充2：荣誉墙 / 称号 / 任务 / 雷达 / 弹窗 ===== */
/* 补发提示条 */
.backfill-notice {
  margin-bottom: 16px;
  padding: 10px 16px;
  border-radius: 12px;
  background: linear-gradient(135deg, rgba(139, 200, 234, 0.18), rgba(139, 200, 234, 0.32));
  border: 1px solid rgba(139, 200, 234, 0.6);
  color: var(--theme-text-color);
  font-size: 14px;
  text-align: center;
}

/* 荣誉面板称号编辑 */
.honor-title-line {
  display: flex;
  align-items: center;
  gap: 6px;
}
.honor-title.title-empty {
  color: var(--theme-text-color);
  opacity: 0.6;
  cursor: pointer;
}
.title-edit-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  padding: 0;
  border: none;
  border-radius: 50%;
  background: var(--theme-background-light-color);
  color: var(--theme-text-color);
  cursor: pointer;
  opacity: 0.65;
  transition: opacity .2s;
}
.title-edit-btn:hover {
  opacity: 1;
}

/* 能力雷达 */
.radar-card {
  margin-top: 24px;
  background: var(--theme-background-light-color);
  border: 1px solid var(--theme-border-color);
  border-radius: 16px;
  padding: 20px;
}
.radar-card h2 {
  margin: 0 0 8px;
  font-size: 18px;
}
.radar-svg {
  display: block;
  width: 100%;
  max-width: 340px;
  margin: 0 auto;
}
.radar-grid {
  fill: none;
  stroke: var(--theme-border-color);
  stroke-width: 1;
}
.radar-axis {
  stroke: var(--theme-border-color);
  stroke-width: 1;
}
.radar-area {
  fill: rgba(138, 168, 162, 0.28);
  stroke: #8aa8a2;
  stroke-width: 2;
  stroke-linejoin: round;
}
.radar-dot {
  fill: #8aa8a2;
}
.radar-label {
  font-size: 12px;
  fill: var(--theme-text-color);
}
.radar-value {
  font-size: 10px;
  fill: #5c7a74;
  font-variant-numeric: tabular-nums;
}
.radar-hint {
  margin: 8px 0 0;
  text-align: center;
  font-size: 12px;
  color: var(--theme-text-color);
  opacity: 0.7;
}

/* 每日 / 每周任务 */
.tasks-card {
  margin-top: 24px;
  background: var(--theme-background-light-color);
  border: 1px solid var(--theme-border-color);
  border-radius: 16px;
  padding: 20px;
}
.tasks-card h2 {
  margin: 0 0 14px;
  font-size: 18px;
  display: flex;
  align-items: center;
  gap: 10px;
}
.task-hint {
  font-size: 12px;
  font-weight: 400;
  color: var(--theme-text-color);
  opacity: 0.7;
}
.task-week-title {
  margin-top: 18px !important;
  padding-top: 14px;
  border-top: 1px dashed var(--theme-border-color);
}
.task-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
  font-size: 13px;
  color: var(--theme-text-color);
}
.task-info {
  flex: 0 0 auto;
  width: 150px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.task-name {
  font-weight: 600;
}
.task-desc {
  font-size: 11px;
  opacity: 0.65;
}
.task-bar {
  flex: 1;
  height: 10px;
  border-radius: 5px;
  background: var(--theme-border-color);
  overflow: hidden;
  min-width: 60px;
}
.task-fill {
  display: block;
  height: 100%;
  background: #8aa8a2;
  border-radius: 5px;
  transition: width .3s ease;
}
.task-num {
  flex: 0 0 auto;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
.task-claim {
  flex: 0 0 auto;
  padding: 5px 12px;
  border: 1px solid var(--theme-border-color);
  border-radius: 20px;
  background: var(--theme-background-color);
  color: var(--theme-text-color);
  font-size: 12px;
  cursor: pointer;
  transition: all .2s;
}
.task-claim:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}
.task-claim.ready {
  background: #8aa8a2;
  border-color: #8aa8a2;
  color: #fff;
  font-weight: 600;
}
.task-claim.claimed {
  background: transparent;
  border-color: var(--theme-border-color);
  color: #5c7a74;
  opacity: 0.85;
}

/* 荣誉墙分区：已去掉稀有度分区标题，仅保留收藏角标 */
.pin-mark {
  position: absolute;
  top: 8px;
  right: 10px;
  font-size: 13px;
  z-index: 2;
}

/* 称号编辑器弹层 */
.title-overlay,
.detail-overlay {
  position: fixed;
  inset: 0;
  z-index: 200;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}
.title-editor {
  width: 100%;
  max-width: 420px;
  background: var(--theme-background-color);
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 18px 48px rgba(0, 0, 0, 0.18);
}
.title-editor h3 {
  margin: 0 0 4px;
  font-size: 18px;
}
.title-editor-hint {
  margin: 0 0 16px;
  font-size: 12px;
  color: var(--theme-text-color);
  opacity: 0.7;
}
.title-input-row {
  display: flex;
  gap: 10px;
}
.title-input-row input {
  flex: 1;
  padding: 10px 14px;
  border: 1px solid var(--theme-border-color);
  border-radius: 10px;
  background: var(--theme-background-light-color);
  color: var(--theme-text-color);
  font-size: 14px;
  outline: none;
}
.title-input-row input:focus {
  border-color: #8aa8a2;
}
.title-save-btn {
  padding: 10px 18px;
  border: none;
  border-radius: 10px;
  background: #8aa8a2;
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}
.title-presets {
  margin-top: 18px;
  padding-top: 14px;
  border-top: 1px dashed var(--theme-border-color);
}
.title-presets-label {
  font-size: 12px;
  color: var(--theme-text-color);
  opacity: 0.7;
  margin-bottom: 10px;
}
.title-preset-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.title-preset-btn {
  padding: 6px 14px;
  border: 1px solid var(--theme-border-color);
  border-radius: 20px;
  background: var(--theme-background-light-color);
  color: var(--theme-text-color);
  font-size: 13px;
  cursor: pointer;
  transition: all .2s;
}
.title-preset-btn:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}
.title-preset-btn.locked {
  border-style: dashed;
}
.title-preset-btn.current {
  border-color: #8aa8a2;
  background: rgba(138, 168, 162, 0.15);
  color: #5c7a74;
  font-weight: 600;
}
.title-preset-lock {
  margin-left: 4px;
  font-size: 11px;
}

/* 成就详情弹窗 */
.detail-modal {
  position: relative;
  width: 100%;
  max-width: 380px;
  background: var(--theme-background-color);
  border-radius: 18px;
  padding: 28px 24px 22px;
  text-align: center;
  box-shadow: 0 18px 48px rgba(0, 0, 0, 0.18);
  border-top: 4px solid var(--theme-border-color);
}
.detail-modal.legendary {
  border-top-color: #b59872;
}
.detail-modal.epic {
  border-top-color: #9d7bb0;
}
.detail-modal.rare {
  border-top-color: #4f8cc9;
}
.detail-modal.uncommon {
  border-top-color: #7fae6a;
}
.detail-modal.common {
  border-top-color: #a8adb4;
}
.detail-close {
  position: absolute;
  top: 12px;
  right: 14px;
  border: none;
  background: none;
  color: var(--theme-text-color);
  font-size: 16px;
  cursor: pointer;
  opacity: 0.6;
  padding: 4px;
}
.detail-close:hover {
  opacity: 1;
}
.detail-icon {
  font-size: 44px;
  line-height: 1.2;
  margin-bottom: 8px;
}
.detail-name {
  font-size: 20px;
  font-weight: 700;
  color: var(--theme-text-color);
}
.detail-rarity {
  font-size: 12px;
  color: var(--theme-text-color);
  opacity: 0.7;
  margin: 4px 0 10px;
}
.detail-desc {
  font-size: 14px;
  color: var(--theme-text-color);
  line-height: 1.6;
  margin-bottom: 14px;
}
.detail-progress {
  margin-bottom: 10px;
}
.detail-progress-track {
  height: 10px;
  border-radius: 5px;
  background: var(--theme-border-color);
  overflow: hidden;
}
.detail-progress-fill {
  height: 100%;
  background: #8aa8a2;
  border-radius: 5px;
}
.detail-progress-text {
  font-size: 12px;
  color: var(--theme-text-color);
  opacity: 0.8;
  margin-top: 4px;
  font-variant-numeric: tabular-nums;
}
.detail-unlocked-at {
  font-size: 12px;
  color: #5c7a74;
  margin-bottom: 12px;
}
.detail-actions {
  display: flex;
  justify-content: center;
  gap: 10px;
  flex-wrap: wrap;
}
.detail-action {
  padding: 8px 16px;
  border: 1px solid var(--theme-border-color);
  border-radius: 20px;
  background: var(--theme-background-light-color);
  color: var(--theme-text-color);
  font-size: 13px;
  cursor: pointer;
  transition: all .2s;
}
.detail-action:hover {
  border-color: #8aa8a2;
  color: #5c7a74;
}

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
