<template>
  <div class="app">
    <TopStatusBar />

    <div class="pageCenter">
      <div class="tipsTextContent">
        <h1>常规打字练习</h1>
        <h2>中文全屏 · 英文单词 · 键盘数字，专项提升打字速度与键盘熟悉度。</h2>
      </div>

      <div class="modeTabs">
        <button
          v-for="m in MODES"
          :key="m.id"
          class="modeTab"
          :class="{ active: mode === m.id }"
          @click="switchMode(m.id)"
        >
          {{ m.label }}
        </button>
      </div>

      <!-- 开始前遮罩 -->
      <div class="mask" :class="{ active: !started }" @click="start">
        <p>按任意键<br />或点击当前页面开始练习</p>
      </div>

      <!-- 练习主体 -->
      <div v-if="started" class="practiceArea">
        <!-- 中文全屏 -->
        <template v-if="mode === 'chinese'">
          <div class="cnStage">
            <div class="cnSentence">
              <template v-for="(item, idx) in sentence" :key="idx">
                <span
                  class="cnChar"
                  :class="{
                    done: idx < charIdx,
                    current: idx === charIdx,
                    upcoming: idx > charIdx && idx - charIdx <= 8
                  }"
                >{{ item.ch }}</span>
              </template>
            </div>
            <div class="cnHint" v-if="currentItem">
              <span class="py">{{ currentItem.pinyin }}</span>
              <span class="seq">{{ currentItem.seq.map(c => c.replace('Key','')).join(' ') }}</span>
            </div>
          </div>
        </template>

        <!-- 英文单词 -->
        <template v-if="mode === 'english'">
          <div class="enStage">
            <div class="enWord">
              <template v-for="(l, i) in currentWord" :key="i">
                <span class="enLetter" :class="{ typed: i < letterIdx, current: i === letterIdx }">{{ l }}</span>
              </template>
            </div>
            <div class="enProgress">第 {{ wordIdx + 1 }} / {{ enQueue.length }} 个单词</div>
          </div>
        </template>

        <!-- 键盘数字 -->
        <template v-if="mode === 'numbers'">
          <div class="numStage">
            <div class="numGroup">
              <template v-for="(d, i) in currentGroup" :key="i">
                <span class="numDigit" :class="{ typed: i < digitIdx, current: i === digitIdx }">{{ d }}</span>
              </template>
            </div>
            <div class="numProgress">第 {{ groupIdx + 1 }} / {{ numQueue.length }} 组数字</div>
            <div class="numHint">用键盘数字行输入，熟悉手指位置</div>
          </div>
        </template>

        <!-- 状态栏 -->
        <div class="sessionStats">
          <div class="stat">
            <span class="statValue">{{ accuracy }}%</span>
            <span class="statLabel">正确率</span>
          </div>
          <div class="stat">
            <span class="statValue">{{ speed }}</span>
            <span class="statLabel">字/分</span>
          </div>
          <div class="stat">
            <span class="statValue">{{ correctCount }}<small>/{{ totalCount }}</small></span>
            <span class="statLabel">正确/总按键</span>
          </div>
        </div>
      </div>

      <!-- 完成弹窗 -->
      <div v-if="completed" class="overlay" @click.self="restart">
        <div class="resultModal">
          <h3>🎉 练习完成</h3>
          <div class="resultStats">
            <div class="rStat">
              <span class="rValue">{{ accuracy }}%</span>
              <span class="rLabel">正确率</span>
            </div>
            <div class="rStat">
              <span class="rValue">{{ speed }}</span>
              <span class="rLabel">字/分</span>
            </div>
          </div>
          <div class="resultActions">
            <button class="btn primary" @click="restart">再来一次</button>
            <button class="btn" @click="switchMode(nextMode)">换个模式</button>
          </div>
        </div>
      </div>

      <div class="footerSpace" />
    </div>

    <AchievementNotification :new-achievements="newAchievements" />
  </div>
</template>

<script setup>
import { computed, onMounted, onBeforeUnmount, ref } from 'vue'
import TopStatusBar from '../components/TopStatusBar.vue'
import AchievementNotification from '../components/AchievementNotification.vue'
import { WORDS } from '../data/words.js'
import { EN_WORDS, EN_WORDS_PER_SESSION } from '../data/englishWords.js'
import { extractChinese, toPinyinArray } from '../utils/text2pinyin.js'
import { keyByCode } from '../data/xiaohe.js'
import { useSettingsStore } from '../stores/settings.js'
import { useStatsStore } from '../stores/stats.js'
import { useProgressStore } from '../stores/progress.js'
import { playKeySound } from '../utils/sound.js'

const MODES = [
  { id: 'chinese', label: '🀄 中文全屏' },
  { id: 'english', label: '🔤 英文单词' },
  { id: 'numbers', label: '🔢 键盘数字' },
]

// 中文全屏练习的内置语料（可读性优先）
const CN_SENTENCES = [
  '中文输入拼音练习，提升速度与准确，保持节奏与专注。',
  '秋风微凉，二人软语，月与云伴，乌衣巷口我也有缘。',
  '大江东去，风拂更长，岸边少年，快意江湖，两个伙伴望海。',
  '走在小路上，草色翠绿，追风而行，滨海鸟鸣，绵延不断。',
]

const settings = useSettingsStore()
const stats = useStatsStore()
const progress = useProgressStore()

const mode = ref('chinese')
const started = ref(false)
const completed = ref(false)

// 会话统计
const totalCount = ref(0)
const correctCount = ref(0)
const sessionStart = ref(0)

// 中文状态
const cnQueue = ref([]) // [{ ch, pinyin, seq:[codes] }]
const charIdx = ref(0)
const codeIdx = ref(0)
const cnText = ref('')

// 英文状态
const enQueue = ref([]) // [word]
const wordIdx = ref(0)
const letterIdx = ref(0)

// 数字状态
const numQueue = ref([]) // [group] group: "4829"
const groupIdx = ref(0)
const digitIdx = ref(0)

const newAchievements = ref([])

const currentItem = computed(() => cnQueue.value[charIdx.value])
const sentence = computed(() => cnQueue.value)
const currentWord = computed(() => enQueue.value[wordIdx.value] || '')
const currentGroup = computed(() => numQueue.value[groupIdx.value] || '')

const accuracy = computed(() => {
  if (totalCount.value === 0) return 100
  return Math.round((correctCount.value / totalCount.value) * 100)
})
const speed = computed(() => {
  if (!sessionStart.value) return 0
  const mins = (Date.now() - sessionStart.value) / 60000
  if (mins <= 0) return 0
  return Math.round(totalCount.value / mins)
})

const nextMode = computed(() => {
  const idx = MODES.findIndex(m => m.id === mode.value)
  return MODES[(idx + 1) % MODES.length].id
})

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function pinyinToKeyCodes(py) {
  // 全拼模式：每个拼音字母对应一个键（如 zhong -> z h o n g）
  return Array.from((py || '').toLowerCase())
    .filter(ch => /^[a-z]$/.test(ch))
    .map(ch => 'Key' + ch.toUpperCase())
}

function buildChineseQueue() {
  // 从内置语料 + 随机词库拼出至少 18 个可练习字符（跳过无拼音字符）
  let text = CN_SENTENCES[Math.floor(Math.random() * CN_SENTENCES.length)]
  while (extractChinese(text).length < 18) {
    const w = WORDS[Math.floor(Math.random() * WORDS.length)]
    text += w.text
  }
  cnText.value = text
  const chars = extractChinese(text)
  const pys = toPinyinArray(chars)
  const queue = []
  for (let i = 0; i < chars.length; i++) {
    const seq = pinyinToKeyCodes(pys[i] || '')
    if (seq.length) queue.push({ ch: chars[i], pinyin: pys[i] || '', seq })
  }
  return queue
}

function buildEnglishQueue() {
  return shuffle(EN_WORDS).slice(0, EN_WORDS_PER_SESSION)
}

function buildNumberQueue() {
  const groups = []
  for (let g = 0; g < 12; g++) {
    let s = ''
    const len = 3 + Math.floor(Math.random() * 3) // 3~5 位
    for (let i = 0; i < len; i++) s += String(Math.floor(Math.random() * 10))
    groups.push(s)
  }
  return groups
}

function start() {
  if (started.value) return
  // 初始化当前模式的队列
  if (mode.value === 'chinese') {
    cnQueue.value = buildChineseQueue()
    charIdx.value = 0
    codeIdx.value = 0
  } else if (mode.value === 'english') {
    enQueue.value = buildEnglishQueue()
    wordIdx.value = 0
    letterIdx.value = 0
  } else {
    numQueue.value = buildNumberQueue()
    groupIdx.value = 0
    digitIdx.value = 0
  }
  totalCount.value = 0
  correctCount.value = 0
  completed.value = false
  sessionStart.value = Date.now()
  started.value = true
  stats.startSession('practice')
  progress.startSession()
}

function switchMode(id) {
  if (id === mode.value && started.value) return
  mode.value = id
  started.value = false
  completed.value = false
  endSession()
}

function note(correct) {
  totalCount.value++
  if (correct) correctCount.value++
  progress.recordKeystroke(correct)
  const unlocked = progress.checkAchievements(stats)
  if (unlocked.length > 0) {
    newAchievements.value = [...newAchievements.value, ...unlocked]
  }
}

function submitCode(code) {
  // 统一入口：code 为 KeyboardEvent.code（如 KeyA / Digit5）
  if (!started.value || completed.value) return { correct: false }

  let correct = false
  let expected = ''

  if (mode.value === 'chinese') {
    const item = currentItem.value
    if (item && codeIdx.value < item.seq.length) {
      expected = item.seq[codeIdx.value]
      correct = expected === code
      if (correct) {
        codeIdx.value++
        if (codeIdx.value >= item.seq.length) {
          charIdx.value++
          codeIdx.value = 0
          if (charIdx.value >= cnQueue.value.length) {
            finish()
          }
        }
      }
    }
  } else if (mode.value === 'english') {
    const word = currentWord.value
    if (letterIdx.value < word.length && code.startsWith('Key')) {
      expected = 'Key' + word[letterIdx.value].toUpperCase()
      correct = expected === code
      if (correct) {
        letterIdx.value++
        if (letterIdx.value >= word.length) {
          wordIdx.value++
          letterIdx.value = 0
          if (wordIdx.value >= enQueue.value.length) {
            finish()
          }
        }
      }
    }
  } else {
    // numbers
    const group = currentGroup.value
    if (digitIdx.value < group.length && /^Digit|^Numpad/.test(code)) {
      expected = 'Digit' + group[digitIdx.value]
      correct = expected === code
      if (correct) {
        digitIdx.value++
        if (digitIdx.value >= group.length) {
          groupIdx.value++
          digitIdx.value = 0
          if (groupIdx.value >= numQueue.value.length) {
            finish()
          }
        }
      }
    }
  }

  note(correct)
  if (settings.sound) {
    playKeySound(correct ? 'ok' : 'bad', { volume: settings.soundVolume })
  }
  return { correct }
}

function finish() {
  completed.value = true
  endSession()
}

function endSession() {
  if (!sessionStart.value) return
  const duration = Math.round((Date.now() - sessionStart.value) / 60000)
  const chars = totalCount.value
  if (duration > 0 || chars > 0) {
    progress.recordPracticeSession(duration, chars)
  }
  progress.checkDailyGoal(chars, duration)
  progress.endSession()
  stats.endSession()
  sessionStart.value = 0
}

function restart() {
  endSession()
  started.value = false
  start()
}

// 物理键盘输入
function onKeyDown(e) {
  if (e.repeat) return
  if (!started.value) {
    e.preventDefault()
    start()
    return
  }
  const code = e.code
  const handled =
    (mode.value === 'chinese' && keyByCode.has(code)) ||
    (mode.value === 'english' && code.startsWith('Key')) ||
    (mode.value === 'numbers' && (/^Digit|^Numpad/.test(code)))
  if (!handled) return
  e.preventDefault()
  submitCode(code)
}

onMounted(() => {
  settings.load()
  stats.load()
  progress.load()
  window.addEventListener('keydown', onKeyDown)
})
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeyDown)
  endSession()
})
</script>

<style scoped>
.pageCenter {
  min-height: calc(100vh - 52px);
  min-height: calc(100dvh - 52px);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px calc(12px + env(safe-area-inset-left)) calc(env(safe-area-inset-bottom)) calc(12px + env(safe-area-inset-right));
  position: relative;
}

.modeTabs { display: flex; gap: 10px; flex-wrap: wrap; justify-content: center; margin: 4px 0 16px; }
.modeTab {
  padding: 8px 16px;
  border-radius: 10px;
  border: 1px solid var(--theme-border-color);
  background: var(--theme-background-light-color);
  color: var(--theme-menu-text-color);
  cursor: pointer;
  font-size: 15px;
}
.modeTab.active {
  border-color: var(--theme-menu-hover-color);
  box-shadow: 0 0 0 2px #35e2b733 inset;
  color: var(--theme-main-text-color);
}

.mask { position: absolute; inset: 0; display: none; align-items: center; justify-content: center; z-index: 30; padding: 24px; background: transparent; }
.mask.active { display: flex; }
.mask p { text-align: center; color: var(--theme-text-color); font-size: 18px; line-height: 1.7; }

.practiceArea { flex: 1; width: 100%; max-width: 1060px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 18px; }

/* 中文全屏 */
.cnStage { width: 100%; display: flex; flex-direction: column; align-items: center; gap: 18px; }
.cnSentence {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 2px 6px;
  font-size: 34px;
  line-height: 1.6;
  max-width: 100%;
}
.cnChar { opacity: 0.3; color: var(--theme-text-color); transition: opacity .2s, transform .2s; }
.cnChar.done { opacity: 0.55; }
.cnChar.upcoming { opacity: 0.75; }
.cnChar.current {
  opacity: 1;
  color: var(--theme-main-text-color);
  font-weight: 700;
  transform: scale(1.12);
  border-bottom: 3px solid var(--theme-menu-hover-color);
}
.cnHint { display: flex; flex-direction: column; align-items: center; gap: 4px; min-height: 52px; }
.cnHint .py { font-size: 20px; color: var(--theme-highlight-text-color); }
.cnHint .seq { font-size: 26px; font-weight: 700; color: var(--theme-menu-text-color); letter-spacing: 2px; }

/* 英文单词 */
.enStage { display: flex; flex-direction: column; align-items: center; gap: 14px; }
.enWord { display: flex; gap: 6px; font-size: 52px; font-weight: 700; flex-wrap: wrap; justify-content: center; }
.enLetter { opacity: 0.35; color: var(--theme-text-color); }
.enLetter.typed { opacity: 0.75; }
.enLetter.current { opacity: 1; color: var(--theme-main-text-color); border-bottom: 3px solid var(--theme-menu-hover-color); }
.enProgress, .numProgress { font-size: 14px; color: var(--theme-text-color); }

/* 键盘数字 */
.numStage { display: flex; flex-direction: column; align-items: center; gap: 14px; }
.numGroup { display: flex; gap: 8px; font-size: 56px; font-weight: 700; font-variant-numeric: tabular-nums; }
.numDigit { opacity: 0.35; color: var(--theme-text-color); }
.numDigit.typed { opacity: 0.75; }
.numDigit.current { opacity: 1; color: var(--theme-main-text-color); transform: scale(1.1); border-bottom: 3px solid var(--theme-menu-hover-color); }
.numHint { font-size: 13px; color: var(--theme-rich-text-color); }

/* 会话状态栏 */
.sessionStats { display: flex; gap: 14px; flex-wrap: wrap; justify-content: center; }
.stat {
  min-width: 96px;
  text-align: center;
  padding: 10px 14px;
  background: var(--theme-background-light-color);
  border: 1px solid var(--theme-border-color);
  border-radius: 10px;
}
.statValue { display: block; font-size: 22px; font-weight: 700; color: var(--theme-main-text-color); font-variant-numeric: tabular-nums; }
.statValue small { font-size: 13px; color: var(--theme-text-color); }
.statLabel { font-size: 12px; color: var(--theme-text-color); }

/* 完成弹窗 */
.overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 24px; }
.resultModal {
  background: var(--theme-background-color);
  border-radius: 12px;
  width: 360px;
  max-width: 90vw;
  padding: 24px;
  text-align: center;
}
.resultModal h3 { margin: 0 0 16px; font-size: 20px; }
.resultStats { display: flex; gap: 12px; margin-bottom: 20px; }
.rStat { flex: 1; padding: 12px; background: var(--theme-background-light-color); border-radius: 8px; }
.rValue { display: block; font-size: 26px; font-weight: 700; color: var(--theme-main-text-color); }
.rLabel { font-size: 12px; color: var(--theme-text-color); }
.resultActions { display: flex; gap: 10px; }
.btn {
  flex: 1;
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid var(--theme-border-color);
  background: var(--theme-background-light-color);
  color: var(--theme-menu-text-color);
  cursor: pointer;
  font-size: 14px;
}
.btn.primary { background: var(--theme-menu-text-color); border-color: var(--theme-menu-text-color); color: #fff; font-weight: 600; }

.footerSpace { height: 24px; }

@media (max-width: 600px) {
  .cnSentence { font-size: 24px; }
  .enWord { font-size: 36px; }
  .numGroup { font-size: 40px; }
}
</style>
