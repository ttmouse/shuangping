<template>
  <div class="app" data-v-01350f3e>
    <TopStatusBar />

    <div class="pageCenter">
      <div class="tipsTextContent" data-v-01350f3e>
        <h1 data-v-01350f3e>双拼在线练习软件</h1>
        <h2 data-v-01350f3e>为快速入门双拼打字而生，提供双拼声母、韵母专项练习法。</h2>
      </div>

      <div class="operate">
        <div class="select">
          <label>文案：</label>
          <div class="dropdown" @click="toggleMenu">
            <span class="dropdownLabel">{{ currentCorpusTitle }}</span>
            <span class="caret">▾</span>
            <div v-if="showMenu" class="ddMenu" @click.stop>
              <div
                v-for="c in corpora"
                :key="c.id"
                class="menuItem"
                :class="{ 
                  custom: c.id.startsWith(CUSTOM_PREFIX) || c.id.startsWith('set-'),
                  separator: c.id.startsWith('separator'),
                  disabled: c.disabled
                }"
                @click="!c.disabled && selectCorpus(c.id)"
              >
                <span class="title">{{ c.title }}</span>
                <span v-if="c.itemCount !== undefined" class="item-count">{{ c.itemCount }} 字</span>
                <button
                  v-if="c.id.startsWith(CUSTOM_PREFIX) || c.id.startsWith('set-')"
                  class="delBtn"
                  title="删除"
                  @click.stop="c.id.startsWith('set-') ? deletePracticeSetFromDropdown(c.id) : deleteDoc(c.id)"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    <line x1="10" y1="11" x2="10" y2="17"></line>
                    <line x1="14" y1="11" x2="14" y2="17"></line>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
        <SchemeSelector />
        <button class="el-button el-button--small" @click="openImport">导入文本</button>
        <button class="el-button el-button--small" @click="openPracticeSetManager">练习集</button>
        <label><input type="checkbox" :checked="writer.showPinyin" @change="e=>writer.setShowPinyin(e.target.checked)"/> 拼音显示</label>
        <label><input type="checkbox" :checked="writer.showShuangpin" @change="e=>writer.setShowShuangpin(e.target.checked)"/> 双拼编码显示</label>
        <label><input type="checkbox" :checked="writer.hideKeyboard" @change="e=>writer.setHideKeyboard(e.target.checked)"/> 隐藏键盘</label>
        <button
          class="el-button el-button--small"
          :class="{ 'is-active': settings.blindMode }"
          @click="toggleBlindMode"
        >
          {{ settings.blindMode ? ' 盲打中' : '盲打模式' }}
        </button>
        <button
          class="el-button el-button--small"
          :class="{ 'is-active': settings.timeChallenge }"
          @click="toggleTimeChallenge"
        >
          {{ settings.timeChallenge ? '⏱ 限时中' : '限时挑战' }}
        </button>
      </div>

      <div class="cardsWrap">
        <div class="cards" :class="{ 'line-leaving': writer.lineHold }">
          <div
            v-for="(it, idx) in cardItems"
            :key="it.id"
            class="card"
            :class="{
              current: idx === currentInLine,
              done: idx < currentInLine
            }"
          >
            <div class="py" v-if="writer.showPinyin">{{ it.pinyin }}</div>
            <div class="hz">{{ it.ch }}</div>
            <div class="keys">
              <span
                v-for="(c,i) in it.seq"
                :key="i"
                class="letter"
                :class="letterClass(idx, i)"
              >{{ codeToLetter(c) }}</span>
            </div>
          </div>
        </div>
      </div>

      <Keyboard v-if="settings.showKeyboard && !writer.hideKeyboard" :handle="onPress" />

      <div class="footerSpace" />
    </div>

    <!-- 导入文本弹窗 -->
    <div v-if="showImport" class="modalMask" @click.self="closeImport">
      <div class="modal">
        <h3>导入自定义中文文本</h3>
        <textarea
          v-model="importText"
          placeholder="粘贴中文文本（仅中文会被用于练习，最多 1000 字）。\n台词/剧本格式会自动忽略行首的「角色名：」，如 莫妮卡：没什么好说的！"
        />
        <div class="modalFooter">
          <div class="tip">中文计数：{{ hanCount }}/1000</div>
          <div class="actions">
            <button class="el-button el-button--small" @click="closeImport">取消</button>
            <button class="el-button el-button--small primary" :disabled="hanCount===0" @click="confirmImport">生成练习</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 练习集管理弹窗 -->
    <div v-if="showPracticeSetManager" class="modalMask" @click.self="closePracticeSetManager">
      <div class="modal practice-set-modal">
        <h3>自定义练习集管理</h3>
        <div class="practice-set-content">
          <!-- 左侧：练习集列表 -->
          <div class="set-list">
            <h4>我的练习集</h4>
            <div class="create-set">
              <input
                v-model="newSetName"
                placeholder="输入练习集名称"
                @keyup.enter="createPracticeSet"
              />
              <button class="el-button el-button--small primary" @click="createPracticeSet">创建</button>
            </div>
            <div class="sets">
              <div
                v-for="set in customPracticeSets"
                :key="set.id"
                class="set-item"
                :class="{ active: selectedSetId === set.id }"
                @click="selectSet(set.id)"
              >
                <span class="set-name">{{ set.name }}</span>
                <span class="set-count">{{ set.items?.length || 0 }} 字</span>
                <button class="del-btn" @click.stop="deletePracticeSet(set.id)">×</button>
              </div>
              <div v-if="customPracticeSets.length === 0" class="empty-tip">
                暂无练习集，创建一个吧！
              </div>
            </div>
          </div>
          <!-- 右侧：练习集详情 -->
          <div class="set-detail">
            <h4>练习内容</h4>
            <div v-if="selectedSet" class="add-char">
              <input
                v-model="newChar"
                placeholder="输入汉字"
                maxlength="1"
              />
              <input
                v-model="newCharPinyin"
                placeholder="拼音（可选）"
              />
              <button class="el-button el-button--small" @click="addCharToSet">添加</button>
            </div>
            <div v-if="selectedSet" class="char-list">
              <div
                v-for="item in selectedSet.items"
                :key="item.char"
                class="char-tag"
              >
                <span class="char">{{ item.char }}</span>
                <span class="pinyin">{{ item.pinyin }}</span>
                <button class="remove-btn" @click="removeCharFromSet(item.char)">×</button>
              </div>
              <div v-if="selectedSet.items?.length === 0" class="empty-tip">
                练习集为空，添加一些字符吧！
              </div>
            </div>
            <div v-if="selectedSet" class="set-actions">
              <button class="el-button el-button--small primary" @click="startPracticeWithSet(selectedSetId)">开始练习</button>
            </div>
            <div v-else class="empty-tip select-tip">
              选择一个练习集进行管理
            </div>
          </div>
        </div>
        <div class="modalFooter">
          <div class="tip">自定义练习集可以帮助你针对性地练习特定汉字</div>
          <div class="actions">
            <button class="el-button el-button--small" @click="closePracticeSetManager">关闭</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 练习完成浮层（仅自定义/内置文案） -->
    <div v-if="writer.completed" class="modalMask" @click.self="restart">
      <div class="modal completion-modal">
        <h3>练习完成</h3>
        <p>已完成当前文案的全部文字练习。</p>
        <div class="completion-stats" v-if="stats">
          <div class="comp-stat">
            <span class="comp-value">{{ stats.overallAccuracy }}%</span>
            <span class="comp-label">准确率</span>
          </div>
          <div class="comp-stat">
            <span class="comp-value">{{ stats.averageSpeed }}</span>
            <span class="comp-label">字/分</span>
          </div>
        </div>
        <div class="modalFooter">
          <button class="el-button el-button--small share" @click="showShareCard = true">
            <span>分享成绩</span>
          </button>
          <div class="actions">
            <button class="el-button el-button--small primary" @click="restart">重新开始</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 限时挑战计时器 -->
    <div v-if="settings.timeChallenge && !writer.completed" class="timer-indicator" :class="{ 'timer-low': timeRemaining <= 10 }">
      <div class="timer-text">{{ Math.floor(timeRemaining / 60) }}:{{ String(timeRemaining % 60).padStart(2, '0') }}</div>
    </div>

    <!-- 限时挑战结果弹窗 -->
    <div v-if="showTimeChallengeResult" class="modalMask" @click.self="closeTimeChallengeResult">
      <div class="modal">
        <h3>⏱ 限时挑战结果</h3>
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
            <span v-for="n in 5" :key="n" class="star" :class="{ filled: n <= Math.ceil((timeChallengeResults.correct / Math.max(timeChallengeResults.total, 1)) * 5) }"></span>
          </div>
          <p class="rating-text">
            {{ timeChallengeResults.correct / Math.max(timeChallengeResults.total, 1) >= 0.9 ? '太棒了！完美挑战！' :
               timeChallengeResults.correct / Math.max(timeChallengeResults.total, 1) >= 0.8 ? '表现不错，继续加油！' :
               timeChallengeResults.correct / Math.max(timeChallengeResults.total, 1) >= 0.6 ? '还可以，多多练习！' : '继续加油，熟能生巧！' }}
          </p>
        </div>
        <div class="modalFooter">
          <button class="el-button el-button--small share" @click="showShareCard = true">
            <span>分享</span>
          </button>
          <div class="actions">
            <button class="el-button el-button--small primary" @click="closeTimeChallengeResult">再来一次</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 成绩分享卡片弹窗 -->
    <ShareCard v-if="showShareCard" @close="showShareCard = false" />

    <!-- 成就通知 -->
    <AchievementNotification :new-achievements="newAchievements" />
  </div>
</template>

<script setup>
import { computed, onMounted, onBeforeUnmount, ref } from 'vue'
import { useSettingsStore } from '../stores/settings.js'
import { useWriterStore, CORPUS_IDS } from '../stores/writer.js'
import { useStatsStore } from '../stores/stats.js'
import { useProgressStore } from '../stores/progress.js'
import Keyboard from '../components/Keyboard.vue'
import TopStatusBar from '../components/TopStatusBar.vue'
import SchemeSelector from '../components/SchemeSelector.vue'
import AchievementNotification from '../components/AchievementNotification.vue'
import ShareCard from '../components/ShareCard.vue'
import { LENGTH_BUCKETS } from '../data/words.js'
import { extractChinese, stripDialogPrefix } from '../utils/text2pinyin.js'
import { playKeySound } from '../utils/sound.js'
import { keyByCode } from '../data/xiaohe.js'

// 自定义文案 ID 前缀
const CUSTOM_PREFIX = 'custom-'

const settings = useSettingsStore()
const writer = useWriterStore()
const stats = useStatsStore()
const progress = useProgressStore()
const buckets = LENGTH_BUCKETS
const corpora = computed(() => writer.corpora)

// 成就通知
const newAchievements = ref([])
const showMenu = ref(false)
const showShareCard = ref(false)

// 限时挑战状态
const timeRemaining = ref(0)
const timeChallengeTimer = ref(null)
const timeChallengeResults = ref(null)
const showTimeChallengeResult = ref(false)
const currentCorpusTitle = computed(() => corpora.value.find(c => c.id === writer.currentCorpusId)?.title || '选择文案')
function toggleMenu() { showMenu.value = !showMenu.value }
function selectCorpus(id) { writer.applyCorpus(id); showMenu.value = false }
function deleteDoc(id) {
  const doc = writer.customDocs.find(d => d.id === id)
  if (doc && confirm(`确定要删除自定义文本"${doc.title}"吗？`)) {
    writer.deleteCustomDoc(id)
  }
}
const cardItems = computed(() => writer.queue.slice(writer.lineStart, writer.lineStart + writer.windowSize))
const currentInLine = computed(() => writer.charIdx - writer.lineStart)
function codeToLetter(c) { return (c || '').replace('Key','') }
function letterClass(cardIndex, letterIndex) {
  const pos = currentInLine.value
  const isDone = cardIndex < pos || (cardIndex === pos && letterIndex < writer.codeIdx)
  return { done: isDone, hidden: !writer.showShuangpin && !isDone }
}

function onPress(code) {
  const res = writer.submit(code)
  // 记录统计
  const currentItem = writer.currentItem
  if (currentItem) {
    stats.recordCharPractice(currentItem.ch, res.correct)
    // 记录易错键（期望键位）
    if (!res.correct) {
      stats.recordErrorKey(currentItem.seq[writer.codeIdx])
    }
  }
  // 记录进度
  progress.recordKeystroke(res.correct)
  // 检查成就
  const unlocked = progress.checkAchievements(stats)
  if (unlocked.length > 0) {
    newAchievements.value = [...newAchievements.value, ...unlocked]
  }
  // 限时挑战统计
  if (settings.timeChallenge && timeChallengeResults.value) {
    if (res.correct) {
      timeChallengeResults.value.correct++
    }
    timeChallengeResults.value.total++
  }
  return res
}

// 导入文本弹窗逻辑
const showImport = ref(false)
const importText = ref('')
const hanCount = computed(() => extractChinese(importText.value).length)
function openImport() {
  importText.value = stripDialogPrefix(writer.lastText || '')
  showImport.value = true
}
function closeImport() { showImport.value = false }
function confirmImport() {
  writer.addCustomDocAndApply(importText.value)
  showImport.value = false
}

// 练习集管理
const showPracticeSetManager = ref(false)
const newSetName = ref('')
const selectedSetId = ref(null)
const newChar = ref('')
const newCharPinyin = ref('')

const customPracticeSets = computed(() => settings.customPracticeSets)
const selectedSet = computed(() => 
  customPracticeSets.value.find(s => s.id === selectedSetId.value)
)

function openPracticeSetManager() {
  showPracticeSetManager.value = true
  selectedSetId.value = settings.activePracticeSetId
}
function closePracticeSetManager() { showPracticeSetManager.value = false }
function createPracticeSet() {
  if (!newSetName.value.trim()) return
  settings.createPracticeSet(newSetName.value.trim())
  newSetName.value = ''
}
function deletePracticeSet(id) {
  if (confirm('确定要删除这个练习集吗？')) {
    settings.deletePracticeSet(id)
    if (selectedSetId.value === id) selectedSetId.value = null
  }
}
function deletePracticeSetFromDropdown(setIdWithPrefix) {
  const setId = setIdWithPrefix.slice(4) // 移除 'set-' 前缀
  const set = customPracticeSets.value.find(s => s.id === setId)
  if (set && confirm(`确定要删除练习集"${set.name}"吗？`)) {
    settings.deletePracticeSet(setId)
    if (selectedSetId.value === setId) selectedSetId.value = null
    // 如果当前正在使用该练习集，切换到默认文案
    if (writer.currentCorpusId === setIdWithPrefix) {
      writer.applyCorpus(CORPUS_IDS.ALL)
    }
  }
}
function selectSet(id) { selectedSetId.value = id }
function addCharToSet() {
  if (!selectedSetId.value || !newChar.value.trim()) return
  const char = newChar.value.trim()[0]
  // 自动获取拼音
  const pinyins = toPinyinArray(char)
  const pinyin = newCharPinyin.value.trim() || pinyins[0] || ''
  settings.addToPracticeSet(selectedSetId.value, { char, pinyin })
  newChar.value = ''
  newCharPinyin.value = ''
}
function removeCharFromSet(char) {
  if (!selectedSetId.value) return
  settings.removeFromPracticeSet(selectedSetId.value, char)
}
function startPracticeWithSet(setId) {
  settings.setActivePracticeSet(setId)
  writer.applyCorpus(`set-${setId}`)
  closePracticeSetManager()
  showMenu.value = false
}

function restart() {
  // 结束当前会话并记录进度
  endPractice()
  writer.restartCurrent()
  stats.startSession('writer')
  progress.startSession()
  // 重新启动限时挑战
  if (settings.timeChallenge) {
    startTimeChallenge()
  }
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
  
  // 检查学习阶段完成（文字练习使用 corpusId）
  const accuracy = progress.sessionStats.accuracy
  if (writer.currentCorpusId && accuracy > 0 && charsTyped > 0) {
    const result = progress.checkStageCompletion(writer.currentCorpusId, accuracy, charsTyped)
    if (result.completed) {
      console.log(`阶段完成: ${result.stage.name}`)
    }
    
    // 记录阶段尝试
    progress.recordStageAttempt(
      writer.currentCorpusId, 
      accuracy, 
      stats.averageSpeed
    )
    
    // 更新技能掌握度
    progress.updateSkillMastery(writer.currentCorpusId, charsTyped, accuracy)
  }
  
  stats.endSession()
  progress.endSession()
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
  if (enabled) {
    startTimeChallenge()
  } else if (timeChallengeTimer.value) {
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
  // 结束当前练习
  endPractice()
  // 重新开始练习
  writer.restartCurrent()
  stats.startSession('writer')
  progress.startSession()
  // 重新启动限时挑战
  if (settings.timeChallenge) {
    startTimeChallenge()
  }
}

function onKeydownRestart(e) {
  if (!writer.completed) return
  if (e.key === 'Enter' || e.code === 'Enter' || e.keyCode === 13) {
    e.preventDefault()
    restart()
  }
}

// 处理键盘输入，即使键盘被隐藏也能工作
function onKeyDown(e) {
  if (writer.hideKeyboard && keyByCode.has(e.code)) {
    const res = writer.submit(e.code) || { correct: false }
    // 记录统计
    const currentItem = writer.currentItem
    if (currentItem) {
      stats.recordCharPractice(currentItem.ch, res.correct)
      // 记录易错键（期望键位）
      if (!res.correct) {
        stats.recordErrorKey(currentItem.seq[writer.codeIdx])
      }
    }
    // 记录进度
    progress.recordKeystroke(res.correct)
    // 检查成就
    const unlocked = progress.checkAchievements(stats)
    if (unlocked.length > 0) {
      newAchievements.value = [...newAchievements.value, ...unlocked]
    }
    // 限时挑战统计
    if (settings.timeChallenge && timeChallengeResults.value) {
      if (res.correct) {
        timeChallengeResults.value.correct++
      }
      timeChallengeResults.value.total++
    }
    if (!res?.ignore) {
      if (settings.sound) {
        playKeySound(res.correct ? 'ok' : 'bad', { volume: settings.soundVolume })
      }
    }
  }
}

onMounted(() => {
  settings.load()
  writer.load()
  stats.load()
  progress.load()
  writer.applyCorpus(writer.currentCorpusId)
  // 开始统计会话
  stats.startSession('writer')
  progress.startSession()
  // 启动限时挑战计时器
  if (settings.timeChallenge) {
    startTimeChallenge()
  }
  window.addEventListener('keydown', onKeydownRestart)
  window.addEventListener('keydown', onKeyDown)
})
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydownRestart)
  window.removeEventListener('keydown', onKeyDown)
  // 结束统计会话并记录进度
  endPractice()
  // 清除限时挑战计时器
  if (timeChallengeTimer.value) {
    clearInterval(timeChallengeTimer.value)
  }
})
</script>

<style scoped>
.pageCenter { min-height: calc(100dvh - 52px); display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 0 12px; }
.operate { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; justify-content: center; padding: 10px 12px; }
.operate .select select { display: none; }
.operate .select .dropdown { position: relative; display: inline-flex; align-items: center; gap: 6px; min-width: 220px; padding: 6px 10px; border-radius: 10px; border: 1px solid var(--theme-border-color); background: var(--theme-background-light-color); color: var(--theme-text-color); cursor: pointer; }
.operate .select .dropdown .ddMenu { position: absolute; top: calc(100% + 6px); left: 0; right: 0; min-width: 0; max-height: 52dvh; overflow: auto; background: var(--theme-background-light-color); border: 1px solid var(--theme-border-color); border-radius: 10px; box-shadow: 0 6px 16px rgba(0,0,0,0.18); padding: 6px; z-index: 20; display: block; }
.operate .select .dropdown .ddMenu .menuItem { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 10px 10px; border-radius: 8px; }
.operate .select .dropdown .ddMenu .menuItem:hover { background: rgba(53,226,183,0.08); }
.operate .select .dropdown .ddMenu .menuItem.custom { padding-right: 6px; }
.operate .select .dropdown .ddMenu .menuItem .delBtn { background: transparent; border: none; color: #d9534f; cursor: pointer; padding: 4px; border-radius: 4px; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
.operate .select .dropdown .ddMenu .menuItem .delBtn:hover { color: #ff4d4f; background: rgba(217,83,79,0.1); }
.operate .select .dropdown .ddMenu .menuItem.separator {
  pointer-events: none;
  padding: 4px 10px;
  color: var(--theme-text-color);
  font-size: 12px;
  opacity: 0.6;
  background: transparent;
}
.operate .select .dropdown .ddMenu .menuItem.disabled {
  pointer-events: none;
  opacity: 0.5;
}
.operate .select .dropdown .ddMenu .menuItem .item-count {
  font-size: 12px;
  color: var(--theme-text-color);
  margin-left: 8px;
}
.cardsWrap { width: 1060px; max-width: 96%; margin: 10px auto 10px; }
.cards { display: flex; gap: 10px; justify-content: center; perspective: 900px; flex-wrap: wrap; }
.card { position: relative; width: 96px; height: 124px; background: var(--theme-background-light-color); border: 1px solid var(--theme-border-color); border-radius: 10px; box-shadow: 0 2px 0 rgba(0,0,0,0.03); display: flex; flex-direction: column; align-items: center; justify-content: space-around; padding: 8px 6px; transform-style: preserve-3d; overflow: hidden; }
.card.current { border-color: var(--theme-menu-hover-color); box-shadow: 0 0 0 2px #35e2b733 inset, 0 0 10px #35e2b733; }
.card { transition: opacity 0.4s ease, transform 0.4s ease; }
.card.done { opacity: 0.35; }
/* 整行打完统一淡出换行，避免逐字位移 */
.cards.line-leaving .card { opacity: 0; transform: translateY(-14px); }
.card .py { font-size: 22px; color: var(--theme-rich-text-color); }
.card .hz { font-size: 28px; font-weight: 700; color: var(--theme-main-text-color); line-height: 1; }
.card .keys { font-size: 22px; color: #54709536; letter-spacing: 1px; }
.card .keys .letter.hidden { opacity: 0; }
.card .keys .letter { margin: 0 0px; }
.card .keys .letter.done { color: var(--theme-menu-text-color); font-weight: 700; }

@media (max-width: 520px) {
  .cardsWrap { max-width: 100%; }
  .cards { gap: 8px; }
  .card { width: 88px; height: 116px; }
  .card .py { font-size: 18px; }
  .card .hz { font-size: 26px; }
  .card .keys { font-size: 18px; }
  .operate { position: sticky; top: 52px; z-index: 10; backdrop-filter: blur(10px); background: color-mix(in srgb, var(--theme-background-light-color) 85%, transparent); border-bottom: 1px solid var(--theme-border-color); }
}

/* 简易弹窗样式 */
.modalMask { position: fixed; inset: 0; background: rgba(0,0,0,0.35); display: flex; align-items: center; justify-content: center; z-index: 40; }
.modal { width: 720px; max-width: 92vw; background: var(--theme-background-light-color); border: 1px solid var(--theme-border-color); border-radius: 10px; box-shadow: 0 6px 16px rgba(0,0,0,0.18); padding: 14px; }
.modal h3 { margin: 4px 0 10px; color: var(--theme-main-text-color); }
.modal textarea { width: 100%; height: 220px; padding: 10px; border-radius: 8px; border: 1px solid var(--theme-border-color); background: var(--theme-background-light-color); color: var(--theme-text-color); resize: vertical; }
.modalFooter { margin-top: 10px; display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.modalFooter .tip { font-size: 12px; color: var(--theme-rich-text-color); }
.modalFooter .actions { display: flex; gap: 8px; }
.el-button.primary { background: var(--theme-menu-hover-color); color: #0b1a14; border-color: var(--theme-menu-hover-color); }

/* 分享按钮 */
.el-button.share {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-color: transparent;
  color: #fff;
}

.el-button.share:hover {
  background: linear-gradient(135deg, #5a6fd6 0%, #6a4190 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

/* 完成弹窗样式 */
.completion-modal h3 {
  text-align: center;
  margin-bottom: 8px;
}

.completion-modal p {
  text-align: center;
  color: var(--theme-text-color);
  margin-bottom: 20px;
}

.completion-stats {
  display: flex;
  justify-content: center;
  gap: 32px;
  margin-bottom: 24px;
  padding: 20px;
  background: var(--theme-background-color);
  border-radius: 12px;
}

.comp-stat {
  text-align: center;
}

.comp-value {
  display: block;
  font-size: 32px;
  font-weight: 700;
  color: #35e2b7;
  margin-bottom: 4px;
}

.comp-label {
  font-size: 12px;
  color: var(--theme-text-color);
}

.completion-modal .modalFooter {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* 盲打和限时按钮激活状态 */
.el-button.is-active {
  background: #409eff;
  border-color: #409eff;
  color: #fff;
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
.stats-summary {
  display: flex;
  gap: 16px;
  margin: 16px 0;
}

.stat-item {
  flex: 1;
  text-align: center;
  padding: 12px;
  background: var(--theme-background-light-color);
  border-radius: 8px;
}

.stat-value {
  display: block;
  font-size: 24px;
  font-weight: 700;
  color: var(--theme-main-text-color);
}

.stat-label {
  display: block;
  font-size: 12px;
  color: var(--theme-text-color);
  margin-top: 4px;
}

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
  font-size: 14px;
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

/* 移动端适配 */
@media (max-width: 600px) {
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
  .stats-summary {
    flex-direction: column;
    gap: 8px;
  }
}

/* 练习集管理弹窗样式 */
.practice-set-modal {
  width: 800px;
  max-width: 95vw;
}

.practice-set-content {
  display: flex;
  gap: 20px;
  min-height: 400px;
}

.set-list {
  flex: 0 0 280px;
  border-right: 1px solid var(--theme-border-color);
  padding-right: 16px;
}

.set-list h4,
.set-detail h4 {
  margin: 0 0 12px;
  font-size: 14px;
  color: var(--theme-text-color);
}

.create-set {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.create-set input {
  flex: 1;
  padding: 8px 10px;
  border-radius: 6px;
  border: 1px solid var(--theme-border-color);
  background: var(--theme-background-color);
  color: var(--theme-text-color);
}

.sets {
  max-height: 320px;
  overflow-y: auto;
}

.set-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s;
  margin-bottom: 4px;
}

.set-item:hover {
  background: rgba(53, 226, 183, 0.08);
}

.set-item.active {
  background: rgba(53, 226, 183, 0.15);
  border: 1px solid var(--theme-menu-hover-color);
}

.set-name {
  flex: 1;
  font-size: 14px;
  color: var(--theme-main-text-color);
}

.set-count {
  font-size: 12px;
  color: var(--theme-text-color);
}

.del-btn {
  background: none;
  border: none;
  color: #d9534f;
  font-size: 18px;
  cursor: pointer;
  padding: 0 4px;
  line-height: 1;
}

.del-btn:hover {
  color: #ff4d4f;
}

.set-detail {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.add-char {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.add-char input {
  padding: 8px 10px;
  border-radius: 6px;
  border: 1px solid var(--theme-border-color);
  background: var(--theme-background-color);
  color: var(--theme-text-color);
}

.add-char input:first-child {
  width: 80px;
  text-align: center;
}

.add-char input:nth-child(2) {
  flex: 1;
}

.char-list {
  flex: 1;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-content: flex-start;
  max-height: 280px;
  overflow-y: auto;
  padding: 8px;
  background: var(--theme-background-color);
  border-radius: 8px;
}

.char-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 10px;
  background: var(--theme-background-light-color);
  border: 1px solid var(--theme-border-color);
  border-radius: 6px;
}

.char-tag .char {
  font-size: 16px;
  font-weight: 600;
  color: var(--theme-main-text-color);
}

.char-tag .pinyin {
  font-size: 12px;
  color: var(--theme-text-color);
}

.char-tag .remove-btn {
  background: none;
  border: none;
  color: #d9534f;
  font-size: 14px;
  cursor: pointer;
  padding: 0 2px;
  margin-left: 4px;
}

.char-tag .remove-btn:hover {
  color: #ff4d4f;
}

.set-actions {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}

.empty-tip {
  text-align: center;
  padding: 40px 20px;
  color: var(--theme-text-color);
  font-size: 14px;
}

.empty-tip.select-tip {
  padding: 80px 20px;
}

@media (max-width: 600px) {
  .practice-set-content {
    flex-direction: column;
  }
  .set-list {
    flex: none;
    border-right: none;
    border-bottom: 1px solid var(--theme-border-color);
    padding-right: 0;
    padding-bottom: 16px;
  }
  .sets {
    max-height: 200px;
  }
  .char-list {
    max-height: 200px;
  }
}
</style>
