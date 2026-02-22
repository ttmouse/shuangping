<template>
  <div class="app" data-v-01350f3e>
    <TopStatusBar />

    <div class="pageCenter">
      <div class="tipsTextContent" data-v-01350f3e>
        <h1 data-v-01350f3e>双拼在线练习软件</h1>
        <h2 data-v-01350f3e>为快速入门双拼打字而生，提供双拼声母、韵母专项练习法。</h2>
      </div>

      <div
        class="mask"
        :class="{ active: !started && !selectMode }"
        @click="start"
      >
        <p>键盘按任意键<br/>或点击当前页面开始练习</p>
      </div>

      <div class="operate" :class="{ 'is-sticky': started }">
        <div class="select">
          <label>范围：</label>
          <select :value="session.rangeId" @change="onRange">
            <option v-for="r in rangesDisplay" :key="r.id" :value="r.id">{{ r.name }}</option>
          </select>
        </div>
        <SchemeSelector />
        <label><input type="checkbox" :checked="settings.yunmuShowShuangpin" @change="e=>{ settings.yunmuShowShuangpin = !!e.target.checked; settings.save() }"/> 双拼编码显示</label>
        <label><input type="checkbox" :checked="settings.yunmuAutoSpeak" @change="e=>{ settings.yunmuAutoSpeak = !!e.target.checked; settings.save() }"/> 自动朗读</label>
        <label><input type="checkbox" :checked="session.hideKeyboard" @change="e=>{ session.setHideKeyboard(e.target.checked) }"/> 隐藏键盘</label>
        <button 
          class="el-button el-button--small" 
          :class="{ 'is-weak': session.weakMode }"
          @click="session.toggleWeakMode()"
        >
          {{ session.weakMode ? '✅ 错题强化中' : '错题强化' }}
        </button>
        <button 
          class="el-button el-button--small" 
          :class="{ 'is-active': settings.blindMode }"
          @click="toggleBlindMode"
        >
          {{ settings.blindMode ? '👁️ 盲打中' : '盲打模式' }}
        </button>
        <button 
          class="el-button el-button--small" 
          :class="{ 'is-active': settings.timeChallenge }"
          @click="toggleTimeChallenge"
        >
          {{ settings.timeChallenge ? '⏱️ 限时中' : '限时挑战' }}
        </button>
        <button class="el-button el-button--small" @click="showStats = true">📊 错误统计</button>
        <!-- 自选模式：开始与重新选择的切换 -->
        <template v-if="session.rangeId === 'custom'">
          <button v-if="!session.started" class="el-button el-button--small" @click="start">开始</button>
          <button v-else class="el-button el-button--small" @click="reselect">重新选择</button>
          <button class="el-button el-button--small" @click="onClearSelected" :disabled="!session.selectedKeyCodes.length">清空选择</button>
        </template>
      </div>

      <div class="cardsWrap">
        <div class="cards">
          <div
            v-for="(f, idx) in upcoming"
            :key="idx + '-' + f"
            class="card"
            :class="{
              current: idx === currentIndex,
              doneLatest: idx === currentIndex - 1,
              donePast: idx < currentIndex - 1
            }"
          >
            <div class="hz">{{ f }}</div>
            <div class="keys" v-if="settings.yunmuShowShuangpin">
              <span
                v-for="(l,i) in lettersForFinal(f)"
                :key="i + '-' + l"
                class="letter"
                :class="{ done: idx < currentIndex }"
              >{{ l }}</span>
            </div>
          </div>
        </div>
      </div>

      <Keyboard v-if="!selectMode && !session.hideKeyboard" data-testid="keyboard" :handle="onPress" />
      <Keyboard v-else-if="selectMode" data-testid="keyboard" :selectable="true" :selected-codes="session.selectedKeyCodes" :on-toggle="onToggleKey" />

      <!-- 错误统计弹窗 -->
      <div v-if="showStats" class="stats-overlay" @click.self="showStats = false">
        <div class="stats-modal">
          <div class="stats-header">
            <h3>错误统计</h3>
            <button class="close-btn" @click="showStats = false">&times;</button>
          </div>
          <div class="stats-content">
            <div class="stats-summary">
              <div class="stat-item">
                <span class="stat-value">{{ session.totalAttempts }}</span>
                <span class="stat-label">总练习次数</span>
              </div>
              <div class="stat-item">
                <span class="stat-value">{{ session.accuracy }}%</span>
                <span class="stat-label">正确率</span>
              </div>
            </div>
            <div class="stats-list" v-if="session.weakFinals.length">
              <h4>易错韵母（按错误次数排序）</h4>
              <div class="stat-row" v-for="f in session.weakFinals" :key="f">
                <span class="final">{{ f }}</span>
                <div class="bar-wrap">
                  <div class="bar" :style="{ width: Math.min(100, (session.errorStats[f] / session.weakFinals[0][1]) * 100) + '%' }"></div>
                </div>
                <span class="count">{{ session.errorStats[f] }}次</span>
              </div>
            </div>
            <div class="stats-empty" v-else>
              <p>暂无错误记录，继续加油！</p>
            </div>
            <button class="clear-btn" @click="clearStats" v-if="session.weakFinals.length">清除统计</button>
          </div>
        </div>
      </div>

      <!-- 限时挑战计时器 -->
      <div v-if="settings.timeChallenge && session.started" class="timer-indicator" :class="{ 'timer-low': timeRemaining <= 10 }">
        <div class="timer-text">{{ Math.floor(timeRemaining / 60) }}:{{ String(timeRemaining % 60).padStart(2, '0') }}</div>
      </div>

      <!-- 连击提示 -->
      <div v-if="showCombo" class="combo-indicator" :class="{ 'combo-high': comboCount >= 10 }">
        <div class="combo-text">{{ comboCount }} 连击!</div>
        <div class="combo-stars">✨ ✨ ✨</div>
      </div>

      <!-- 限时挑战结果弹窗 -->
      <div v-if="showTimeChallengeResult" class="stats-overlay" @click.self="closeTimeChallengeResult">
        <div class="stats-modal">
          <div class="stats-header">
            <h3>⏱️ 限时挑战结果</h3>
            <button class="close-btn" @click="closeTimeChallengeResult">&times;</button>
          </div>
          <div class="stats-content">
            <div class="stats-summary">
              <div class="stat-item">
                <span class="stat-value">{{ timeChallengeResults?.correct || 0 }}</span>
                <span class="stat-label">正确数</span>
              </div>
              <div class="stat-item">
                <span class="stat-value">{{ timeChallengeResults?.total || 0 }}</span>
                <span class="stat-label">总次数</span>
              </div>
              <div class="stat-item">
                <span class="stat-value">{{ timeChallengeResults?.total > 0 ? Math.round((timeChallengeResults.correct / timeChallengeResults.total) * 100) : 0 }}%</span>
                <span class="stat-label">正确率</span>
              </div>
            </div>
            <div class="time-challenge-stats">
              <div class="tcs-item">
                <span class="tcs-label">挑战时长</span>
                <span class="tcs-value">{{ settings.timeChallengeDuration }}秒</span>
              </div>
              <div class="tcs-item">
                <span class="tcs-label">平均速度</span>
                <span class="tcs-value">{{ timeChallengeResults?.duration > 0 ? Math.round((timeChallengeResults.total / timeChallengeResults.duration) * 60) : 0 }} 字/分</span>
              </div>
            </div>
            <div class="challenge-rating" v-if="timeChallengeResults">
              <div class="rating-stars">
                <span v-for="n in 5" :key="n" class="star" :class="{ filled: n <= Math.ceil((timeChallengeResults.correct / Math.max(timeChallengeResults.total, 1)) * 5) }">★</span>
              </div>
              <p class="rating-text">
                {{ timeChallengeResults.correct / Math.max(timeChallengeResults.total, 1) >= 0.9 ? '太棒了！完美挑战！' : 
                   timeChallengeResults.correct / Math.max(timeChallengeResults.total, 1) >= 0.8 ? '表现不错，继续加油！' : 
                   timeChallengeResults.correct / Math.max(timeChallengeResults.total, 1) >= 0.6 ? '还可以，多多练习！' : '继续加油，熟能生巧！' }}
              </p>
            </div>
            <button class="clear-btn" @click="closeTimeChallengeResult">再来一次</button>
            <button class="share-btn" @click="showShareCard = true">📤 分享成绩</button>
          </div>
        </div>
      </div>

      <!-- 分享卡片弹窗 -->
      <ShareCard v-if="showShareCard" @close="showShareCard = false" />

      <!-- 成功粒子效果容器 -->
      <div v-if="session.pos > 0" class="particles-container">
        <div
          v-for="n in 6"
          :key="n"
          class="particle"
          :style="{ animationDelay: (n * 0.1) + 's' }"
        >★</div>
      </div>

      <!-- 成就通知 -->
      <AchievementNotification :new-achievements="newAchievements" />

      <div class="footerSpace" />
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onBeforeUnmount, ref, watch } from 'vue'
import Keyboard from '../components/Keyboard.vue'
import TopStatusBar from '../components/TopStatusBar.vue'
import SchemeSelector from '../components/SchemeSelector.vue'
import AchievementNotification from '../components/AchievementNotification.vue'
import ShareCard from '../components/ShareCard.vue'
import { finalToKeyCodes, keyByCode, ranges } from '../data/xiaohe.js'
import { useSettingsStore } from '../stores/settings.js'
import { useSessionStore } from '../stores/session.js'
import { useStatsStore } from '../stores/stats.js'
import { useProgressStore } from '../stores/progress.js'
import { playKeySound } from '../utils/sound.js'

const settings = useSettingsStore()
const session = useSessionStore()
const stats = useStatsStore()
const progress = useProgressStore()

const showStats = ref(false)

// 游戏化动效状态
const comboCount = ref(0)
const showCombo = ref(false)
const comboTimer = ref(null)
const lastCorrect = ref(false)

// 成就通知
const newAchievements = ref([])

// 限时挑战状态
const timeRemaining = ref(0)
const timeChallengeTimer = ref(null)
const timeChallengeResults = ref(null)
const showTimeChallengeResult = ref(false)
const showShareCard = ref(false)

onMounted(() => {
  settings.load()
  session.load()
  stats.load()
  progress.load()
  initAudio() // 初始化音频功能

  if (!session.started) {
    // 等待用户开始
  } else if (!session.currentTarget) {
    session.nextTarget()
  }
  // 启动时任意按键开始
  const handler = (e) => {
    if (!session.started) {
      // 自选模式下不自动启动，等待点击"开始"
      if (session.rangeId === 'custom') return
      e.preventDefault()
      start()
    }
    if (session.started) window.removeEventListener('keydown', handler)
  }
  window.addEventListener('keydown', handler)
})

const target = computed(() => session.currentTarget)
const upcoming = computed(() => session.upcoming)
const currentIndex = computed(() => session.pos)
const started = computed(() => session.started)
const selectMode = computed(() => session.rangeId === 'custom' && !session.started)

// 监听当前目标变化，自动朗读
const currentTarget = ref('')
watch(target, (newVal, oldVal) => {
  // 如果新的当前目标与之前不同，且自动朗读已开启，则朗读
  if (newVal && newVal !== oldVal && settings.yunmuAutoSpeak && started.value) {
    // 延迟一点时间，确保卡片动画完成
    setTimeout(() => {
      playFinalAudio(newVal)
    }, 200)
  }
}, { immediate: true })
const rangesDisplay = [
  ...['row1','row2','row3','all'].map(id => ranges.find(r => r.id === id)).filter(Boolean),
  { id: 'custom', name: '自选韵母' }
]

function codeToLetter(c) { return (c || '').replace('Key','') }
function lettersForFinal(final) {
  const codes = Array.from(finalToKeyCodes.get(final) || [])
  const letters = codes.map(c => keyByCode.get(c)?.label || codeToLetter(c))
  // 去重，保持顺序
  return Array.from(new Set(letters))
}

// 语音功能
let audioEnabled = false
let currentAudio = null

function initAudio() {
  // 检查是否有音频文件
  audioEnabled = true
}

function playFinalAudio(final) {
  if (!audioEnabled) return

  // 停止当前播放的音频
  if (currentAudio) {
    currentAudio.pause()
    currentAudio.currentTime = 0
  }

  try {
    currentAudio = new Audio(`/finals/${final}.mp3`)
    currentAudio.volume = 0.7
    currentAudio.play().catch(err => {
      console.warn(`无法播放音频 ${final}.mp3:`, err)
    })
  } catch (err) {
    console.warn(`创建音频对象失败 ${final}.mp3:`, err)
  }
}


function start() {
  if (session.rangeId === 'custom') {
    if (!session.selectedKeyCodes.length) {
      alert('请先勾选至少一个韵母键')
      return
    }
  }
  stats.startSession('yunmu')
  progress.startSession()
  session.start()
  
  // 记录练习会话开始
  progress.recordPracticeSession(0, 0)
  
  // 启动限时挑战计时器
  if (settings.timeChallenge) {
    startTimeChallenge()
  }
}

// 限时挑战功能
function startTimeChallenge() {
  timeRemaining.value = settings.timeChallengeDuration
  timeChallengeResults.value = {
    correct: 0,
    total: 0,
    startTime: Date.now()
  }
  
  if (timeChallengeTimer.value) {
    clearInterval(timeChallengeTimer.value)
  }
  
  timeChallengeTimer.value = setInterval(() => {
    timeRemaining.value--
    if (timeRemaining.value <= 0) {
      endTimeChallenge()
    }
  }, 1000)
}

function endTimeChallenge() {
  if (timeChallengeTimer.value) {
    clearInterval(timeChallengeTimer.value)
    timeChallengeTimer.value = null
  }
  
  if (timeChallengeResults.value) {
    timeChallengeResults.value.endTime = Date.now()
    timeChallengeResults.value.duration = Math.floor(
      (timeChallengeResults.value.endTime - timeChallengeResults.value.startTime) / 1000
    )
    showTimeChallengeResult.value = true
  }
}

function toggleTimeChallenge() {
  const enabled = settings.toggleTimeChallenge()
  if (!enabled && timeChallengeTimer.value) {
    // 关闭时清除计时器
    clearInterval(timeChallengeTimer.value)
    timeChallengeTimer.value = null
  }
}

function toggleBlindMode() {
  settings.toggleBlindMode()
}

function closeTimeChallengeResult() {
  showTimeChallengeResult.value = false
  timeChallengeResults.value = null
  // 重置练习状态
  stats.endSession()
  progress.endSession()
  session.reset()
}

// 结束练习并记录进度
function endPractice() {
  // 计算会话时长和字符数
  const duration = progress.sessionStats.startTime 
    ? Math.floor((Date.now() - progress.sessionStats.startTime) / 60000) 
    : 0
  const charsTyped = progress.sessionStats.chars
  
  // 记录练习会话
  if (duration > 0 || charsTyped > 0) {
    progress.recordPracticeSession(duration, charsTyped)
  }
  
  // 检查每日目标
  progress.checkDailyGoal(charsTyped, duration)
  
  // 检查学习阶段完成
  const accuracy = progress.sessionStats.accuracy
  if (session.rangeId && accuracy > 0 && charsTyped > 0) {
    const result = progress.checkStageCompletion(session.rangeId, accuracy, charsTyped)
    if (result.completed) {
      // 阶段完成，可以显示提示
      console.log(`阶段完成: ${result.stage.name}`)
    }
    
    // 记录阶段尝试
    progress.recordStageAttempt(
      session.rangeId, 
      accuracy, 
      stats.averageSpeed
    )
  }
  
  // 更新技能掌握度
  if (session.rangeId) {
    progress.updateSkillMastery(session.rangeId, charsTyped, accuracy)
  }
  
  stats.endSession()
  progress.endSession()
}

function onPress(code) {
  if (!session.started) return { correct: false }
  const res = session.submitKeyCode(code)

  // 记录统计
  const target = session.currentTarget || session.lastTarget
  stats.recordFinalPractice(target, res.correct)

  // 记录进度
  progress.recordKeystroke(res.correct)

  // 错题强化模式记录
  if (session.weakMode) {
    progress.recordWeakModePractice()
  }

  // 检查成就
  const unlocked = progress.checkAchievements(stats)
  if (unlocked.length > 0) {
    newAchievements.value = [...newAchievements.value, ...unlocked]
  }

  // 游戏化动效：连击计数
  if (res.correct) {
    if (lastCorrect.value) {
      comboCount.value++
    } else {
      comboCount.value = 1
    }
    lastCorrect.value = true

    // 显示连击提示（3连击以上）
    if (comboCount.value >= 3) {
      showCombo.value = true
      if (comboTimer.value) clearTimeout(comboTimer.value)
      comboTimer.value = setTimeout(() => {
        showCombo.value = false
      }, 1500)
    }
    
    // 限时挑战统计
    if (settings.timeChallenge && timeChallengeResults.value) {
      timeChallengeResults.value.correct++
      timeChallengeResults.value.total++
    }
  } else {
    comboCount.value = 0
    lastCorrect.value = false
    showCombo.value = false
    
    // 限时挑战统计
    if (settings.timeChallenge && timeChallengeResults.value) {
      timeChallengeResults.value.total++
    }
  }

  return res
}

function onRange(e) {
  session.setRange(e.target.value)
  // 切换范围时停止当前音频
  if (currentAudio) {
    currentAudio.pause()
    currentAudio.currentTime = 0
  }
}

function onToggleKey(code) {
  session.toggleKey(code)
}

function onClearSelected() {
  // 清空并进入选择模式
  session.clearSelected()
  if (session.started) session.reset()
  session.setRange('custom')
}

function reselect() {
  // 结束练习并记录进度
  endPractice()
  // 退出练习，回到自选勾选模式
  session.reset()
  // 停止音频
  if (currentAudio) {
    currentAudio.pause()
    currentAudio.currentTime = 0
  }
}

function clearStats() {
  if (confirm('确定要清除所有错误记录吗？')) {
    session.clearErrorStats()
  }
}

// 处理键盘输入，即使键盘被隐藏也能工作
function onKeyDown(e) {
  // 只有当键盘被隐藏时才处理输入，且必须是有效的按键
  if (session.hideKeyboard && keyByCode.has(e.code)) {
    e.preventDefault()
    const res = session.submitKeyCode(e.code) || { correct: false }

    // 记录统计
    const target = session.currentTarget || session.lastTarget
    stats.recordFinalPractice(target, res.correct)

    // 游戏化动效：连击计数
    if (res.correct) {
      if (lastCorrect.value) {
        comboCount.value++
      } else {
        comboCount.value = 1
      }
      lastCorrect.value = true

      // 显示连击提示（3连击以上）
      if (comboCount.value >= 3) {
        showCombo.value = true
        if (comboTimer.value) clearTimeout(comboTimer.value)
        comboTimer.value = setTimeout(() => {
          showCombo.value = false
        }, 1500)
      }
    } else {
      comboCount.value = 0
      lastCorrect.value = false
      showCombo.value = false
    }

    if (settings.sound) {
      playKeySound(res.correct ? 'ok' : 'bad', { volume: settings.soundVolume })
    }
  }
}

onMounted(() => {
  window.addEventListener('keydown', onKeyDown)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeyDown)
  // 清理音频资源
  if (currentAudio) {
    currentAudio.pause()
    currentAudio = null
  }
})
</script>

<style scoped>
.pageCenter { min-height: calc(100vh - 52px); min-height: calc(100dvh - 52px); display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 0 calc(12px + env(safe-area-inset-left)) calc(env(safe-area-inset-bottom)) calc(12px + env(safe-area-inset-right)); }

/* 关键：键盘出现时避免整体被“压扁”导致布局跳 */
@supports (height: 100svh) {
  .pageCenter { min-height: calc(100svh - 52px); }
}

/* 把虚拟键盘当作底部固定区：保证键盘永远贴底、操作区不会把它挤走 */
.pageCenter { position: relative; }
.pageCenter :deep(.keyWrap) { position: sticky; bottom: 0; z-index: 20; padding-bottom: max(8px, env(safe-area-inset-bottom)); flex: 0 0 auto; width: 100%; }

/* 关键：让键盘“占住”底部空间，避免 sticky 只悬浮但不占位导致手指点不到/看起来漂 */
.pageCenter :deep(.keyWrap) { padding-top: 8px; background: var(--theme-background-color); }
.pageCenter :deep(.keyboard) { width: 100%; }

/* 开始前的 mask 不要参与布局，不然会把下面内容整体往下推 */
.mask { position: absolute; inset: 0; display: none; align-items: center; justify-content: center; z-index: 30; padding: 24px; background: transparent; }
.mask.active { display: flex; }

/* 顶部简介在手机上更紧凑，给键盘留空间 */
@media (max-width: 600px) {
  .tipsTextContent h1 { font-size: 22px; line-height: 1.2; margin: 6px 0; }
  .tipsTextContent h2 { font-size: 13px; line-height: 1.35; margin: 0 0 6px; }
  .operate { gap: 8px; padding: 8px 10px; }
  .cardsWrap { margin: 6px auto 8px; }
}
.tipsTextContent { flex: 0 0 auto; }
.mask { flex: 0 0 auto; }
.cardsWrap { flex: 0 0 auto; }

.operate { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; justify-content: center; padding: 10px 12px; }
.operate .select select { padding: 6px 10px; border-radius: 8px; border: 1px solid var(--theme-border-color); background: var(--theme-background-light-color); color: var(--theme-text-color); }

@media (max-width: 520px) {
  .operate.is-sticky { position: sticky; top: 52px; z-index: 10; backdrop-filter: blur(10px); background: color-mix(in srgb, var(--theme-background-light-color) 85%, transparent); border-bottom: 1px solid var(--theme-border-color); }
}
.cardsWrap { width: 1040px; max-width: 96%; margin: 10px auto 10px; }
.cards { display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; perspective: 900px; }
.card { position: relative; width: 96px; height: 124px; background: var(--theme-background-light-color); border: 1px solid var(--theme-border-color); border-radius: 10px; box-shadow: 0 2px 0 rgba(0,0,0,0.03); display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 8px 6px; transform-style: preserve-3d; overflow: hidden; }
.card.current { border-color: var(--theme-menu-hover-color); box-shadow: 0 0 0 2px #35e2b733 inset, 0 0 10px #35e2b733; }
.card.doneLatest {
  transform-origin: bottom center;
  animation: cardSuccess 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}

.card.donePast { opacity: 0; pointer-events: none; }

/* 游戏化成功动效：缩放弹跳 + 光晕 + 粒子效果 */
@keyframes cardSuccess {
  0% {
    transform: scale(1) rotate(0deg);
    opacity: 1;
    filter: brightness(1);
  }
  20% {
    transform: scale(1.15) rotate(-3deg);
    opacity: 1;
    filter: brightness(1.3) drop-shadow(0 0 20px #67c23a);
  }
  40% {
    transform: scale(1.08) rotate(2deg);
    opacity: 0.9;
    filter: brightness(1.2) drop-shadow(0 0 15px #67c23a);
  }
  60% {
    transform: scale(1.12) rotate(-1deg);
    opacity: 0.7;
    filter: brightness(1.15) drop-shadow(0 0 10px #67c23a);
  }
  80% {
    transform: scale(1.05) rotate(0deg);
    opacity: 0.4;
    filter: brightness(1.1);
  }
  100% {
    transform: scale(0.9) translateY(-30px);
    opacity: 0;
    filter: brightness(1);
  }
}

/* 当前卡片待输入时的微妙呼吸效果 */
.card.current {
  border-color: var(--theme-menu-hover-color);
  box-shadow: 0 0 0 2px #35e2b733 inset, 0 0 10px #35e2b733;
  animation: cardBreathe 2s ease-in-out infinite;
}

@keyframes cardBreathe {
  0%, 100% {
    transform: scale(1);
    box-shadow: 0 0 0 2px #35e2b733 inset, 0 0 10px #35e2b733;
  }
  50% {
    transform: scale(1.02);
    box-shadow: 0 0 0 3px #35e2b755 inset, 0 0 15px #35e2b755;
  }
}

/* 连续正确时的连击效果（通过JS动态添加类） */
.card.combo {
  animation: cardCombo 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes cardCombo {
  0% { transform: scale(1); }
  50% { transform: scale(1.2); filter: brightness(1.4) drop-shadow(0 0 30px #ffd700); }
  100% { transform: scale(1); }
}
.card .hz { font-size: 28px; font-weight: 700; color: var(--theme-main-text-color); line-height: 1; }
.card .keys { font-size: 22px; color: #54709536; letter-spacing: 1px; }
.card .keys .letter { margin: 0 0px; }
.card .keys .letter.done { color: var(--theme-menu-text-color); font-weight: 700; }

/* 错题强化按钮 */
.el-button.is-weak { background: #67c23a; border-color: #67c23a; color: #fff; }

/* 统计弹窗 */
.stats-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.stats-modal { background: var(--theme-background-color); border-radius: 12px; width: 400px; max-width: 90vw; max-height: 80vh; overflow: hidden; box-shadow: 0 8px 32px rgba(0,0,0,0.3); }
.stats-header { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; border-bottom: 1px solid var(--theme-border-color); }
.stats-header h3 { margin: 0; font-size: 18px; }
.close-btn { background: none; border: none; font-size: 24px; cursor: pointer; color: var(--theme-text-color); padding: 0; line-height: 1; }
.stats-content { padding: 20px; }
.stats-summary { display: flex; gap: 20px; margin-bottom: 20px; }
.stat-item { flex: 1; text-align: center; padding: 12px; background: var(--theme-background-light-color); border-radius: 8px; }
.stat-value { display: block; font-size: 28px; font-weight: 700; color: var(--theme-main-text-color); }
.stat-label { font-size: 12px; color: var(--theme-text-color); }
.stats-list h4 { margin: 0 0 12px; font-size: 14px; color: var(--theme-text-color); }
.stat-row { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
.stat-row .final { width: 40px; font-weight: 600; }
.bar-wrap { flex: 1; height: 12px; background: var(--theme-background-light-color); border-radius: 6px; overflow: hidden; }
.bar { height: 100%; background: #f56c6c; border-radius: 6px; transition: width 0.3s; }
.stat-row .count { width: 50px; text-align: right; font-size: 13px; color: var(--theme-text-color); }
.stats-empty { text-align: center; padding: 30px; color: var(--theme-text-color); }
.clear-btn { width: 100%; margin-top: 16px; padding: 10px; background: #f56c6c; border: none; border-radius: 6px; color: #fff; cursor: pointer; }
.clear-btn:hover { background: #f78989; }

/* 分享按钮 */
.share-btn {
  width: 100%;
  margin-top: 12px;
  padding: 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 8px;
  color: #fff;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.share-btn:hover {
  background: linear-gradient(135deg, #5a6fd6 0%, #6a4190 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

/* 连击提示 */
.combo-indicator {
  position: fixed;
  top: 80px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 100;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  animation: comboPop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  pointer-events: none;
}

.combo-text {
  font-size: 24px;
  font-weight: 800;
  background: linear-gradient(135deg, #ffd700, #ff8c00);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: 0 2px 10px rgba(255, 215, 0, 0.3);
}

.combo-stars {
  font-size: 20px;
  animation: starsTwinkle 0.8s ease-in-out infinite;
}

.combo-high .combo-text {
  font-size: 32px;
  background: linear-gradient(135deg, #ff6b6b, #ffd700, #ff6b6b);
  background-size: 200% 200%;
  -webkit-background-clip: text;
  animation: gradientShift 1s ease infinite;
}

@keyframes comboPop {
  0% { transform: translateX(-50%) scale(0) translateY(20px); opacity: 0; }
  50% { transform: translateX(-50%) scale(1.2) translateY(-5px); opacity: 1; }
  100% { transform: translateX(-50%) scale(1) translateY(0); opacity: 1; }
}

@keyframes starsTwinkle {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.6; transform: scale(0.9); }
}

@keyframes gradientShift {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

/* 粒子效果 */
.particles-container {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
  z-index: 50;
}

.particle {
  position: absolute;
  font-size: 16px;
  color: #ffd700;
  opacity: 0;
  animation: particleBurst 0.8s ease-out forwards;
}

.particle:nth-child(1) { --angle: 0deg; }
.particle:nth-child(2) { --angle: 60deg; }
.particle:nth-child(3) { --angle: 120deg; }
.particle:nth-child(4) { --angle: 180deg; }
.particle:nth-child(5) { --angle: 240deg; }
.particle:nth-child(6) { --angle: 300deg; }

@keyframes particleBurst {
  0% {
    transform: translate(-50%, -50%) rotate(var(--angle)) translateX(0) scale(0);
    opacity: 1;
  }
  100% {
    transform: translate(-50%, -50%) rotate(var(--angle)) translateX(80px) scale(1);
    opacity: 0;
  }
}

/* 限时挑战计时器 */
.timer-indicator {
  position: fixed;
  top: 80px;
  right: 20px;
  z-index: 100;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  width: 70px;
  height: 70px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
  animation: timerPulse 2s ease-in-out infinite;
}

.timer-indicator.timer-low {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  animation: timerUrgent 0.5s ease-in-out infinite;
}

.timer-text {
  font-size: 20px;
  font-weight: 700;
  color: white;
  font-variant-numeric: tabular-nums;
}

@keyframes timerPulse {
  0%, 100% { transform: scale(1); box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4); }
  50% { transform: scale(1.05); box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6); }
}

@keyframes timerUrgent {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

/* 限时挑战结果样式 */
.time-challenge-stats {
  display: flex;
  gap: 16px;
  margin: 16px 0;
  padding: 12px;
  background: var(--theme-background-light-color);
  border-radius: 8px;
}

.tcs-item {
  flex: 1;
  text-align: center;
}

.tcs-label {
  display: block;
  font-size: 12px;
  color: var(--theme-text-color);
  margin-bottom: 4px;
}

.tcs-value {
  display: block;
  font-size: 16px;
  font-weight: 600;
  color: var(--theme-main-text-color);
}

.challenge-rating {
  text-align: center;
  margin: 20px 0;
}

.rating-stars {
  font-size: 32px;
  margin-bottom: 8px;
}

.rating-stars .star {
  color: #ddd;
  transition: color 0.3s;
}

.rating-stars .star.filled {
  color: #ffd700;
  text-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
}

.rating-text {
  font-size: 14px;
  color: var(--theme-text-color);
  margin: 0;
}

/* 盲打和限时按钮激活状态 */
.el-button.is-active {
  background: #409eff;
  border-color: #409eff;
  color: #fff;
}

/* 移动端适配 */
@media (max-width: 600px) {
  .combo-indicator {
    top: 70px;
  }
  .combo-text {
    font-size: 20px;
  }
  .combo-high .combo-text {
    font-size: 26px;
  }
  .timer-indicator {
    width: 55px;
    height: 55px;
    top: 70px;
    right: 10px;
  }
  .timer-text {
    font-size: 16px;
  }
  .time-challenge-stats {
    flex-direction: column;
    gap: 8px;
  }
}
</style>
