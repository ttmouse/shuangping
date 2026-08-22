<template>
  <div class="app">
    <TopStatusBar />

    <div class="pageCenter">
      <div class="tipsTextContent">
        <h1>常规打字练习</h1>
        <h2>中文全屏 · 英文单词 · 键盘数字 · 字母键位 · 拼音音节 · 卡片，专项提升打字速度与键盘熟悉度。</h2>
      </div>

      <div class="modeTabs">
        <button
          v-for="m in MODES"
          :key="m.id"
          class="modeTab"
          :class="{ active: mode === m.id }"
          @click="switchMode(m.id)"
          data-nav
        >
          {{ m.label }}
        </button>
      </div>

      <!-- 未开始且无配置区的模式：轻提示（不拦截输入，直接打字即开始） -->
      <div v-if="!started && !(mode === 'letters' || mode === 'cards')" class="startHint">
        <p>直接开始打字练习</p>
      </div>

      <!-- 练习主体（卡片/字母模式未开始时也显示，便于切换类型/难度） -->
      <div v-if="started || mode === 'cards' || mode === 'letters'" class="practiceArea">
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

        <!-- 英文单词（参考 localhost:3002 的整句流式练习） -->
        <template v-if="mode === 'english'">
          <div class="enStage">
            <div class="enSentence">
              <div
                v-for="(w, wi) in enSentence"
                :key="wi"
                class="word-box"
                :class="{ active: wi === wordIdx, completed: wi < wordIdx }"
              >
                <template v-for="(l, li) in w" :key="li">
                  <span
                    class="letter"
                    :class="letterClass(wi, li)"
                  >{{ l }}</span>
                </template>
              </div>
            </div>
            <div class="enProgress">
              第 {{ sentenceIdx + 1 }} / {{ enQueue.length }} 句
              <span v-if="wordIdx < enSentence.length">· 第 {{ wordIdx + 1 }} / {{ enSentence.length }} 词</span>
              <span v-else>· 本句完成</span>
              <span class="enHint">（空格/回车 进入下一词）</span>
            </div>
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

        <!-- 字母键位 -->
        <template v-if="mode === 'letters'">
          <div class="letterStage">
            <div class="letterLevels">
              <button
                v-for="l in LETTER_LEVELS"
                :key="l.id"
                class="levelBtn"
                :class="{ active: letterLevel === l.id }"
                @click="setLetterLevel(l.id)"
                data-nav
              >{{ l.name }}</button>
            </div>
            <template v-if="started">
              <div class="letterGroup">
                <template v-for="(d, i) in currentLetterGroup" :key="i">
                  <span class="letterDigit" :class="{ typed: i < letterCharIdx, current: i === letterCharIdx }">{{ d }}</span>
                </template>
              </div>
              <div class="numProgress">第 {{ letterGroupIdx + 1 }} / {{ letterQueue.length }} 组字母</div>
            </template>
            <div class="numHint">{{ started ? '按键盘输入字母，盲打熟悉手指位置' : '选择难度后，按任意键开始' }}</div>
          </div>
        </template>

        <!-- 拼音音节 -->
        <template v-if="mode === 'syllables'">
          <div class="sylStage">
            <div class="sylChar" v-if="currentSyllable?.char">{{ currentSyllable.char }}</div>
            <div class="sylGroup">
              <template v-for="(l, i) in (currentSyllable?.letters || [])" :key="i">
                <span class="sylLetter" :class="{ typed: i < sylCharIdx, current: i === sylCharIdx }">{{ l }}</span>
              </template>
            </div>
            <div class="numProgress">第 {{ sylIdx + 1 }} / {{ sylQueue.length }} 个音节</div>
            <div class="numHint">逐字母输入拼音音节，音节结束自动推进</div>
          </div>
        </template>

        <!-- Anki 卡片 -->
        <template v-if="mode === 'cards'">
          <div class="cardStage">
            <div class="letterLevels">
              <button
                v-for="t in CARD_TYPES"
                :key="t.id"
                class="levelBtn"
                :class="{ active: cardType === t.id }"
                @click="setCardType(t.id)"
                data-nav
              >{{ t.name }}</button>
            </div>

            <!-- 自定义词表输入面板 -->
            <div v-if="cardType === 'custom' && !started" class="customPanel">
              <textarea
                v-model="customCardsInput"
                placeholder="每行一个词，支持：&#10;中文词（自动转拼音）：时间 中国 学习&#10;直接拼音/字母：shijian zhongguo&#10;短语也可，如：qing wen"
              />
              <div class="customOpts">
                <label class="repeatLabel">每词重复
                  <input type="number" v-model.number="customRepeat" min="1" max="20" /> 遍
                </label>
                <button
                  class="btn primary"
                  :disabled="!customCardsInput.trim()"
                  @click="start"
                  data-nav
                >开始练习</button>
              </div>
              <div class="numHint">每个词会按设定次数反复出现，打错的词会再次插入队尾重练</div>
            </div>

            <!-- 卡片主体（仅练习中显示，避免未开始时空卡片残留） -->
            <template v-if="started">
              <div class="ankiCard" :class="{ redo: currentCard?.redo }">
                <div class="ankiDisplay">{{ currentCard?.display }}</div>
                <div class="ankiSyl" v-if="currentCard">
                  <span
                    v-for="(s, si) in currentCard.syllables"
                    :key="si"
                    class="ankiSylItem"
                    :class="{ done: si < cardSylIdx, current: si === cardSylIdx }"
                  >
                    <template v-for="(l, li) in s" :key="li">
                      <span
                        class="sylLetter"
                        :class="{
                          typed: si < cardSylIdx || (si === cardSylIdx && li < cardCharIdx),
                          current: si === cardSylIdx && li === cardCharIdx
                        }"
                      >{{ l }}</span>
                    </template>
                  </span>
                </div>
                <div class="ankiProgress">第 {{ cardIdx + 1 }} / {{ cardQueue.length }} 张卡</div>
              </div>
              <div class="numHint">
                {{ cardType === 'word' ? '打出词语的拼音，音节自动切换' : cardType === 'sentence' ? '逐字打出整句拼音，错卡自动重练' : '刻意练习：反复打熟你指定的词' }}
              </div>
            </template>
            <div class="numHint" v-if="!started && cardType !== 'custom'">选择类型后，按任意键开始</div>
          </div>
        </template>
      </div>

      <!-- 键盘（受控展示模式：按压/闪光由页面驱动，输入由页面统一处理） -->
      <Keyboard
        v-if="started"
        :pressed-codes="keyPressed"
        :flash-codes="flashState"
        :show-hints="false"
      />

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
            <button ref="restartBtnRef" class="btn primary" @click="restart">
              再来一次 <span class="shortcut">(空格)</span>
            </button>
            <button class="btn" @click="switchMode(nextMode)">
              换个模式 <span class="shortcut">(M)</span>
            </button>
          </div>
          <p class="modalHint">ESC 返回开始 · M 切换模式</p>
        </div>
      </div>

      <div class="footerSpace" />
    </div>

    <!-- 底部固定统计栏 -->
    <div v-if="started && !completed" class="sessionStats">
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

    <AchievementNotification :new-achievements="newAchievements" />
  </div>
</template>

<script setup>
import { computed, onMounted, onBeforeUnmount, ref, reactive, watch, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import TopStatusBar from '../components/TopStatusBar.vue'
import AchievementNotification from '../components/AchievementNotification.vue'
import Keyboard from '../components/Keyboard.vue'
import { WORDS } from '../data/words.js'
import { EN_WORDS } from '../data/englishWords.js'
import { extractChinese, toPinyinArray } from '../utils/text2pinyin.js'
import { keyByCode, keyRows } from '../data/xiaohe.js'
import { SYLLABLES } from '../data/syllables.js'
import { useSettingsStore } from '../stores/settings.js'
import { useStatsStore } from '../stores/stats.js'
import { useProgressStore } from '../stores/progress.js'
import { playKeySound } from '../utils/sound.js'

const MODES = [
  { id: 'chinese', label: '🀄 中文全屏' },
  { id: 'english', label: '🔤 英文单词' },
  { id: 'numbers', label: '🔢 键盘数字' },
  { id: 'letters', label: '⌨️ 字母键位' },
  { id: 'syllables', label: '🔤 拼音音节' },
  { id: 'cards', label: '📇 卡片' },
]

// 卡片练习的内容类型
const CARD_TYPES = [
  { id: 'word', name: '词语' },
  { id: 'sentence', name: '短句' },
  { id: 'custom', name: '✍️ 自定义' },
]

// 字母键位练习的难度分区（对应 keyRows：0=上排 Q..P，1=中排 A..L，2=下排 Z..M）
const LETTER_LEVELS = [
  { id: 'home', name: '中排', rows: [1] },
  { id: 'top', name: '上排', rows: [0] },
  { id: 'bottom', name: '下排', rows: [2] },
  { id: 'full', name: '全键盘', rows: [0, 1, 2] },
  { id: 'error', name: '易错键', rows: [] },
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
const route = useRoute()

const mode = ref('chinese')
const started = ref(false)
const completed = ref(false)

// 会话统计
const totalCount = ref(0)
const correctCount = ref(0)
const completedUnits = ref(0) // 完成的目标单元数（字/词/字符），速度口径
const sessionStart = ref(0)

// 中文状态
const cnQueue = ref([]) // [{ ch, pinyin, seq:[codes] }]
const charIdx = ref(0)
const codeIdx = ref(0)
const cnText = ref('')

// 英文状态（参考 localhost:3002：整句单词流练习）
const enQueue = ref([]) // [{ words: ['the','quick',...] }, ...] 句子数组
const sentenceIdx = ref(0)
const wordIdx = ref(0)
const letterIdx = ref(0)
const currentInput = ref('') // 当前词已输入内容（含错误字符，用于覆盖修正显示）
const wordCompleted = ref(false)

// 数字状态
const numQueue = ref([]) // [group] group: "4829"
const groupIdx = ref(0)
const digitIdx = ref(0)

// 字母键位状态
const letterQueue = ref([]) // ['afdjg', ...] 每组一串字母
const letterGroupIdx = ref(0)
const letterCharIdx = ref(0)
const letterLevel = ref('home') // 当前难度

// 拼音音节状态
const sylQueue = ref([]) // [{ letters, char }]
const sylIdx = ref(0)
const sylCharIdx = ref(0)

// 卡片状态（Anki 风格：单卡展示，错卡重练）
const cardQueue = ref([]) // [{ display, syllables: ['zhong','guo'], redo }]
const cardIdx = ref(0)
const cardSylIdx = ref(0) // 卡内当前音节
const cardCharIdx = ref(0) // 音节内当前字母
const cardType = ref('word') // 'word' | 'sentence' | 'custom'
const currentCardHadError = ref(false) // 当前卡是否出过错（用于错卡重练）

// 自定义词表（刻意练习：固定词反复打）——内容持久化到 localStorage
const CUSTOM_CACHE_KEY = 'sp-custom-cards'
function loadCustomCache() {
  try {
    const raw = localStorage.getItem(CUSTOM_CACHE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch { return {} }
}
const customCache = loadCustomCache()
const customCardsInput = ref(customCache.text || '')
const customRepeat = ref(Number(customCache.repeat) || 3) // 每词重复遍数
function saveCustomCache() {
  try {
    localStorage.setItem(CUSTOM_CACHE_KEY, JSON.stringify({ text: customCardsInput.value, repeat: customRepeat.value }))
  } catch {}
}
watch([customCardsInput, customRepeat], saveCustomCache)
const isCustomPanel = computed(() => mode.value === 'cards' && cardType.value === 'custom' && !started.value)

// 各模式的错题重练标记：当前单元（字/词/数字/字母/音节）是否出过错
const cnHadError = ref(false)
const enHadError = ref(false)
const numHadError = ref(false)
const letterHadError = ref(false)
const sylHadError = ref(false)

// 外部键盘状态（受控展示模式）：按压 Set + 闪光 Map，由页面 keydown/keyup 与提交结果驱动
const keyPressed = reactive(new Set())
const flashState = reactive(new Map())
const flashTimers = new Map()

function flashKey(code, kind) {
  flashState.set(code, kind)
  if (flashTimers.has(code)) clearTimeout(flashTimers.get(code))
  flashTimers.set(code, setTimeout(() => {
    if (flashState.get(code) === kind) flashState.delete(code)
    flashTimers.delete(code)
  }, kind === 'ok' ? 220 : 280))
}

const newAchievements = ref([])

// 完成浮层「再来一次」按钮引用（自动聚焦以支持键盘操作）
const restartBtnRef = ref(null)

// 完成时自动聚焦主按钮，方便直接空格/回车再来一次
watch(completed, async (v) => {
  if (v) {
    await nextTick()
    restartBtnRef.value?.focus()
  }
})

const currentItem = computed(() => cnQueue.value[charIdx.value])
const sentence = computed(() => cnQueue.value)
const enSentence = computed(() => enQueue.value[sentenceIdx.value]?.words || [])
const currentWord = computed(() => enSentence.value[wordIdx.value] || '')
const currentGroup = computed(() => numQueue.value[groupIdx.value] || '')
const currentLetterGroup = computed(() => letterQueue.value[letterGroupIdx.value] || '')
const currentSyllable = computed(() => sylQueue.value[sylIdx.value] || null)
const currentCard = computed(() => cardQueue.value[cardIdx.value] || null)

const accuracy = computed(() => {
  if (totalCount.value === 0) return 100
  return Math.round((correctCount.value / totalCount.value) * 100)
})
const speed = computed(() => {
  // 先访问 completedUnits 确保依赖被收集（避免首次求值早退导致缓存永不失效）
  const units = completedUnits.value
  if (!sessionStart.value) return 0
  const mins = (Date.now() - sessionStart.value) / 60000
  if (mins <= 0) return 0
  // 速度 = 完成单元数（字/词/字符）÷ 分钟，而非按键数
  return Math.round(units / mins)
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
  // 参考 localhost:3002：把单词随机组成若干句（每句 4~7 词），整句流式练习
  const words = shuffle(EN_WORDS)
  const sentences = []
  let i = 0
  while (i < words.length && sentences.length < 6) {
    const n = 4 + Math.floor(Math.random() * 4) // 4~7
    const slice = words.slice(i, i + n)
    if (slice.length < 3) break
    sentences.push({ words: slice })
    i += n
  }
  return sentences
}

// 单词内字母状态（参考 localhost:3002：correct/current/incorrect）
function letterClass(wi, li) {
  if (wi < wordIdx.value) return 'correct' // 已完成词
  if (wi > wordIdx.value) return '' // 未到词
  // 当前词
  if (li < letterIdx.value) return 'correct'
  if (li === letterIdx.value) {
    // 当前位置有错误输入时显示 incorrect
    if (currentInput.value.length > letterIdx.value) return 'incorrect'
    return 'current'
  }
  return ''
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

function buildLetterQueue() {
  let level = LETTER_LEVELS.find(l => l.id === letterLevel.value) || LETTER_LEVELS[0]
  let pool
  if (letterLevel.value === 'error') {
    // 易错键专项：从统计页写入的易错键列表取字母池；无数据时回退全键盘
    try { pool = JSON.parse(localStorage.getItem('sp-error-keys') || '[]') } catch { pool = [] }
    if (!pool.length) {
      pool = 'abcdefghijklmnopqrstuvwxyz'.split('')
      level = LETTER_LEVELS.find(l => l.id === 'full') || LETTER_LEVELS[0]
    }
  } else {
    pool = level.rows.flatMap(ri => keyRows[ri]).map(code => code.replace('Key', '').toLowerCase())
  }
  const groups = []
  for (let g = 0; g < 12; g++) {
    let s = ''
    let prev = ''
    for (let i = 0; i < 5; i++) {
      let ch = pool[Math.floor(Math.random() * pool.length)]
      let guard = 0
      while (ch === prev && guard++ < 10) ch = pool[Math.floor(Math.random() * pool.length)]
      s += ch
      prev = ch
    }
    groups.push(s)
  }
  return groups
}

function buildSyllableQueue() {
  // 从常用音节池 + words.js 提取音节，随机取 20 个
  const pool = [...SYLLABLES]
  const seen = new Set(pool.map(s => s.letters))
  for (const w of WORDS) {
    const pys = w.pinyin.trim().split(/\s+/)
    for (let i = 0; i < pys.length; i++) {
      const py = pys[i].replace(/[^a-z]/g, '')
      if (py && !seen.has(py)) {
        seen.add(py)
        pool.push({ letters: py, char: Array.from(w.text)[i] || '' })
      }
    }
  }
  return shuffle(pool).slice(0, 20)
}

function cleanSyllable(py) {
  return (py || '').replace(/[^a-z]/g, '')
}

function buildCardQueue() {
  if (cardType.value === 'custom') {
    return buildCustomCardQueue()
  }
  if (cardType.value === 'sentence') {
    // 随机生成 10 句：每张卡一句（内置句 + 随机词补足，避免固定几句打完就结束）
    const sentences = []
    for (let i = 0; i < 10; i++) {
      let text = CN_SENTENCES[Math.floor(Math.random() * CN_SENTENCES.length)]
      const target = 15 + Math.floor(Math.random() * 10) // 补足到 15~24 字
      while (extractChinese(text).length < target) {
        const w = WORDS[Math.floor(Math.random() * WORDS.length)]
        text += w.text
      }
      sentences.push(text)
    }
    return sentences.map(text => ({
      display: text,
      syllables: toPinyinArray(extractChinese(text)).map(cleanSyllable).filter(Boolean),
    })).filter(c => c.syllables.length > 0)
  }
  // 词语卡：随机 10 个词，词内音节拆开
  return shuffle(WORDS).slice(0, 10).map(w => ({
    display: w.text,
    syllables: w.pinyin.trim().split(/\s+/).map(cleanSyllable).filter(Boolean),
  })).filter(c => c.syllables.length > 0)
}

// 自定义词表：每行一个词（中文自动转全拼；非中文按拼音/字母串处理），每词重复 N 遍
function buildCustomCardQueue() {
  const lines = customCardsInput.value.split(/[\n,，;；]+/).map(s => s.trim()).filter(Boolean)
  if (!lines.length) return []
  const cards = lines.map(line => {
    if (/[\u4e00-\u9fa5]/.test(line)) {
      const pys = toPinyinArray(extractChinese(line)).map(cleanSyllable).filter(Boolean)
      return { display: line, syllables: pys }
    }
    const parts = line.toLowerCase().split(/\s+/).filter(Boolean)
    return { display: line, syllables: parts }
  }).filter(c => c.syllables.length > 0)
  const n = Math.max(1, Math.min(20, Number(customRepeat.value) || 3))
  const queue = []
  for (const card of cards) {
    for (let i = 0; i < n; i++) queue.push({ ...card })
  }
  return queue
}

function setCardType(id) {
  // 切到自定义：结束当前会话，回到词表面板
  if (id === 'custom' && started.value) {
    endSession()
    started.value = false
    completed.value = false
  }
  cardType.value = id
}

// 卡片完成：出错过的卡重新插回队尾重练（Anki 式错卡重练）
function nextCard() {
  if (currentCardHadError.value && currentCard.value) {
    cardQueue.value.push({ ...currentCard.value, redo: true })
  }
  cardIdx.value++
  cardSylIdx.value = 0
  cardCharIdx.value = 0
  currentCardHadError.value = false
  if (cardIdx.value >= cardQueue.value.length) {
    finish()
  }
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
    sentenceIdx.value = 0
    wordIdx.value = 0
    letterIdx.value = 0
    currentInput.value = ''
    wordCompleted.value = false
  } else if (mode.value === 'numbers') {
    numQueue.value = buildNumberQueue()
    groupIdx.value = 0
    digitIdx.value = 0
  } else if (mode.value === 'letters') {
    letterQueue.value = buildLetterQueue()
    letterGroupIdx.value = 0
    letterCharIdx.value = 0
  } else if (mode.value === 'syllables') {
    sylQueue.value = buildSyllableQueue()
    sylIdx.value = 0
    sylCharIdx.value = 0
  } else if (mode.value === 'cards') {
    cardQueue.value = buildCardQueue()
    cardIdx.value = 0
    cardSylIdx.value = 0
    cardCharIdx.value = 0
    currentCardHadError.value = false
  }
  totalCount.value = 0
  correctCount.value = 0
  completedUnits.value = 0
  cnHadError.value = enHadError.value = numHadError.value = letterHadError.value = sylHadError.value = false
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

// 退出当前会话并聚焦到模式 tab（Esc = 回到模式选择）
function backToModeSelect() {
  endSession()
  started.value = false
  completed.value = false
  nextTick(() => {
    const tab = document.querySelector('.modeTab.active') || document.querySelector('.modeTab')
    ;(tab || document.querySelector('.modeBtn[data-nav]'))?.focus()
  })
}

function setLetterLevel(id) {
  // 练习中切换难度：结束当前会话回到未开始，再开始即用新难度
  if (id === letterLevel.value && !started.value) return
  if (started.value) {
    endSession()
    started.value = false
    completed.value = false
  }
  letterLevel.value = id
}

function note(correct, expected = '', actual = '') {
  totalCount.value++
  if (correct) correctCount.value++
  // 记录到 stats store（统计页数据源）；此前 practice 模式从未写入，会话统计恒为 0
  stats.recordKeystroke(expected, actual, correct, 'practice')
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
      if (!correct) cnHadError.value = true
      if (correct) {
        codeIdx.value++
        if (codeIdx.value >= item.seq.length) {
          charIdx.value++
          completedUnits.value++ // 完成一个字
          if (cnHadError.value) {
            // 错字重练：插回队尾再打一遍
            cnQueue.value.push({ ...item, redo: true })
            cnHadError.value = false
          }
          codeIdx.value = 0
          if (charIdx.value >= cnQueue.value.length) {
            finish()
          }
        }
      }
    }
  } else if (mode.value === 'english') {
    // 参考 localhost:3002：逐字母输入；词完成后按空格/回车推进
    const word = currentWord.value
    if (!word) return { correct: false }
    if (letterIdx.value < word.length && code.startsWith('Key')) {
      expected = 'Key' + word[letterIdx.value].toUpperCase()
      correct = expected === code
      if (!correct) enHadError.value = true
      if (correct) {
        // 覆盖修正：错误后继续输入正确字符时，丢弃中间错误字符（与参考一致）
        if (currentInput.value.length > letterIdx.value) {
          currentInput.value = currentInput.value.slice(0, letterIdx.value) + word[letterIdx.value]
        } else {
          currentInput.value += word[letterIdx.value]
        }
        letterIdx.value++
        if (letterIdx.value >= word.length) {
          wordCompleted.value = true // 词已完成，等待空格推进
        }
      } else {
        // 错误输入：位置不前进，仅填充错误字符用于显示
        const wrongChar = code.replace('Key', '').toLowerCase()
        if (currentInput.value.length <= letterIdx.value) {
          currentInput.value += wrongChar
        } else {
          currentInput.value = currentInput.value.slice(0, letterIdx.value) + wrongChar
        }
      }
    }
  } else if (mode.value === 'numbers') {
    const group = currentGroup.value
    if (digitIdx.value < group.length && /^Digit|^Numpad/.test(code)) {
      expected = 'Digit' + group[digitIdx.value]
      correct = expected === code
      if (!correct) numHadError.value = true
      if (correct) {
        digitIdx.value++
        completedUnits.value++ // 完成一个数字
        if (digitIdx.value >= group.length) {
          if (numHadError.value) {
            // 错组重练：整组插回队尾
            numQueue.value.push(group)
            numHadError.value = false
          }
          groupIdx.value++
          digitIdx.value = 0
          if (groupIdx.value >= numQueue.value.length) {
            finish()
          }
        }
      }
    }
  } else if (mode.value === 'letters') {
    const group = currentLetterGroup.value
    if (letterCharIdx.value < group.length && code.startsWith('Key')) {
      expected = 'Key' + group[letterCharIdx.value].toUpperCase()
      correct = expected === code
      if (!correct) letterHadError.value = true
      if (correct) {
        letterCharIdx.value++
        completedUnits.value++ // 完成一个字母
        if (letterCharIdx.value >= group.length) {
          if (letterHadError.value) {
            // 错组重练：整组插回队尾
            letterQueue.value.push(group)
            letterHadError.value = false
          }
          letterGroupIdx.value++
          letterCharIdx.value = 0
          if (letterGroupIdx.value >= letterQueue.value.length) {
            finish()
          }
        }
      }
    }
  } else if (mode.value === 'syllables') {
    const syl = currentSyllable.value
    if (syl && sylCharIdx.value < syl.letters.length && code.startsWith('Key')) {
      expected = 'Key' + syl.letters[sylCharIdx.value].toUpperCase()
      correct = expected === code
      if (!correct) sylHadError.value = true
      if (correct) {
        sylCharIdx.value++
        if (sylCharIdx.value >= syl.letters.length) {
          sylIdx.value++
          completedUnits.value++ // 完成一个音节
          if (sylHadError.value) {
            // 错音节重练：插回队尾再打一遍
            sylQueue.value.push({ ...syl, redo: true })
            sylHadError.value = false
          }
          sylCharIdx.value = 0
          if (sylIdx.value >= sylQueue.value.length) {
            finish()
          }
        }
      }
    }
  } else if (mode.value === 'cards') {
    const card = currentCard.value
    if (card && cardSylIdx.value < card.syllables.length) {
      const syl = card.syllables[cardSylIdx.value]
      if (cardCharIdx.value < syl.length && code.startsWith('Key')) {
        expected = 'Key' + syl[cardCharIdx.value].toUpperCase()
        correct = expected === code
        if (!correct) currentCardHadError.value = true // 记录错误，用于错卡重练
        if (correct) {
          cardCharIdx.value++
          if (cardCharIdx.value >= syl.length) {
            cardSylIdx.value++
            completedUnits.value++ // 完成一个音节
            cardCharIdx.value = 0
            if (cardSylIdx.value >= card.syllables.length) {
              nextCard()
            }
          }
        }
      }
    }
  }

  note(correct, expected, code)
  if (settings.sound) {
    playKeySound(correct ? 'ok' : 'bad', { volume: settings.soundVolume })
  }
  return { correct }
}

// 统一输入入口：提交 + 驱动键盘闪光（物理键盘与鼠标点击共用）
function handleInput(code) {
  const res = submitCode(code)
  flashKey(code, res.correct ? 'ok' : 'bad')
  return res
}

function finish() {
  completed.value = true
  endSession()
}

function endSession() {
  if (!sessionStart.value) return
  const duration = Math.round((Date.now() - sessionStart.value) / 60000)
  const chars = completedUnits.value
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
  // 按压高亮：任何字母键按下即显示（纯视觉，与输入逻辑无关）
  if (keyByCode.has(e.code)) keyPressed.add(e.code)

  // 完成浮层：支持键盘操作（参考 localhost:3002 的完成浮层快捷键）
  if (completed.value) {
    if (e.code === 'Space' || e.code === 'Enter') {
      e.preventDefault()
      restart()
    } else if (e.key.toLowerCase() === 'm') {
      e.preventDefault()
      switchMode(nextMode.value)
    } else if (e.code === 'Escape') {
      e.preventDefault()
      // 回到模式选择
      backToModeSelect()
    }
    return
  }

  if (!started.value) {
    // 自定义词表面板：不开始练习，让输入框正常接收键盘
    if (isCustomPanel.value) return
    // 方向键：键盘导航专用，不开始练习
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) return
    // 未开始按 Esc：把焦点带回模式 tab（若已在 tab 则回顶部导航）
    if (e.key === 'Escape') {
      e.preventDefault()
      const tab = document.querySelector('.modeTab.active') || document.querySelector('.modeTab')
      if (document.activeElement !== tab && tab) tab.focus()
      else document.querySelector('.modeBtn[data-nav]')?.focus()
      return
    }
    // 键盘导航：焦点在导航按钮上时，Enter/Space 激活按钮而非开始练习
    if ((e.key === 'Enter' || e.key === ' ') && document.activeElement?.hasAttribute?.('data-nav')) return
    e.preventDefault()
    start()
    return
  }

  // 练习中 Esc 退出：回到模式选择（焦点落到当前模式 tab）
  if (e.key === 'Escape') {
    e.preventDefault()
    backToModeSelect()
    return
  }
  // 英文模式：空格/回车推进下一词，退格回退（参考 localhost:3002）
  if (mode.value === 'english') {
    if (e.code === 'Space' || e.code === 'Enter') {
      e.preventDefault()
      const word = currentWord.value
      if (!word) return
      if (letterIdx.value >= word.length) {
        // 词已完成，推进到下一词
        wordIdx.value++
        completedUnits.value++ // 完成一个词
        if (enHadError.value) {
          // 错词重练：插回本句队尾再打一遍
          enQueue.value[sentenceIdx.value].words.push(word)
          enHadError.value = false
        }
        letterIdx.value = 0
        currentInput.value = ''
        wordCompleted.value = false
        if (wordIdx.value >= enSentence.value.length) {
          // 本句完成，进入下一句
          sentenceIdx.value++
          wordIdx.value = 0
          if (sentenceIdx.value >= enQueue.value.length) {
            finish()
          }
        }
      } else {
        // 词未完成时空格 → 错误音效
        if (settings.sound) playKeySound('bad', { volume: settings.soundVolume })
      }
      return
    }
    if (e.code === 'Backspace') {
      e.preventDefault()
      if (currentInput.value.length > 0) {
        currentInput.value = currentInput.value.slice(0, -1)
        // 若回退到正确位置之前，同步回退 letterIdx
        if (currentInput.value.length < letterIdx.value) {
          letterIdx.value = currentInput.value.length
          wordCompleted.value = false
        }
      }
      return
    }
    const code = e.code
    if (!code.startsWith('Key')) return
    e.preventDefault()
    handleInput(code)
    return
  }
  const code = e.code
  const handled =
    (mode.value === 'chinese' && keyByCode.has(code)) ||
    (mode.value === 'numbers' && (/^Digit|^Numpad/.test(code))) ||
    ((mode.value === 'letters' || mode.value === 'syllables' || mode.value === 'cards') && code.startsWith('Key'))
  if (!handled) return
  e.preventDefault()
  handleInput(code)
}

// 键盘导航：未开始时方向键在可导航元素间移动焦点（顶部导航 + 模式/难度/类型按钮），Enter/Space 由浏览器默认激活
function onNavKeydown(e) {
  if (started.value || completed.value) return
  if (e.repeat) return
  const tag = document.activeElement?.tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA') return
  if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) return
  const navs = [...document.querySelectorAll('[data-nav]')].filter(el => !el.disabled)
  if (!navs.length) return
  const idx = navs.indexOf(document.activeElement)
  const dir = (e.key === 'ArrowLeft' || e.key === 'ArrowUp') ? -1 : 1
  if (idx === -1) navs[0].focus()
  else navs[(idx + dir + navs.length) % navs.length].focus()
  e.preventDefault()
}

function onKeyUp(e) {
  if (keyByCode.has(e.code)) keyPressed.delete(e.code)
}

onMounted(() => {
  settings.load()
  stats.load()
  progress.load()
  window.addEventListener('keydown', onKeyDown)
  window.addEventListener('keydown', onNavKeydown)
  window.addEventListener('keyup', onKeyUp)
  // 易错键专项练习入口（统计页跳转：/practice-modes?error=1）
  if (route.query.error === '1') {
    mode.value = 'letters'
    letterLevel.value = 'error'
    start()
  }
})
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeyDown)
  window.removeEventListener('keydown', onNavKeydown)
  window.removeEventListener('keyup', onKeyUp)
  for (const t of flashTimers.values()) clearTimeout(t)
  flashTimers.clear()
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

.modeTabs { display: flex; gap: 10px; flex-wrap: wrap; justify-content: center; margin: 4px 0 16px; position: relative; z-index: 40; }
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
.startHint { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; padding: 24px; pointer-events: none; }
.startHint p { text-align: center; color: var(--theme-text-color); font-size: 18px; line-height: 1.7; opacity: 0.75; }

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

/* 英文单词（参考 localhost:3002 整句流式练习） */
.enStage { display: flex; flex-direction: column; align-items: center; gap: 18px; width: 100%; }
.enSentence {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  gap: 14px 10px;
  max-width: 100%;
  padding: 20px 16px;
}
.word-box {
  display: inline-flex;
  gap: 2px;
  padding: 6px 10px;
  border-radius: 8px;
  font-size: 40px;
  font-weight: 600;
  line-height: 1.3;
  background: var(--theme-background-light-color);
  border: 2px solid transparent;
  transition: border-color .15s ease, opacity .2s ease, background .15s ease;
}
.word-box.active {
  border-color: var(--theme-menu-hover-color);
  box-shadow: 0 0 0 2px #35e2b733 inset;
}
.word-box.completed {
  opacity: 0.4;
  background: transparent;
}
.word-box .letter { color: var(--theme-text-color); opacity: 0.35; transition: color .12s ease, opacity .12s ease; }
.word-box .letter.correct { color: var(--theme-main-text-color); opacity: 1; }
.word-box .letter.current {
  color: var(--theme-menu-hover-color);
  opacity: 1;
  border-bottom: 3px solid var(--theme-menu-hover-color);
}
.word-box .letter.incorrect { color: #f56c6c; opacity: 1; }
.enProgress { font-size: 14px; color: var(--theme-text-color); }
.enHint { font-size: 13px; color: var(--theme-rich-text-color); margin-left: 8px; }

/* 键盘数字 */
.numStage { display: flex; flex-direction: column; align-items: center; gap: 14px; }
.numGroup { display: flex; gap: 8px; font-size: 56px; font-weight: 700; font-variant-numeric: tabular-nums; }
.numDigit { opacity: 0.35; color: var(--theme-text-color); }
.numDigit.typed { opacity: 0.75; }
.numDigit.current { opacity: 1; color: var(--theme-main-text-color); transform: scale(1.1); border-bottom: 3px solid var(--theme-menu-hover-color); }
.numHint { font-size: 13px; color: var(--theme-rich-text-color); }

/* 字母键位 */
.letterStage { display: flex; flex-direction: column; align-items: center; gap: 14px; position: relative; z-index: 40; }
.letterLevels { display: flex; gap: 8px; flex-wrap: wrap; justify-content: center; }
.levelBtn {
  padding: 6px 14px;
  border-radius: 8px;
  border: 1px solid var(--theme-border-color);
  background: var(--theme-background-light-color);
  color: var(--theme-menu-text-color);
  cursor: pointer;
  font-size: 13px;
}
.levelBtn.active {
  border-color: var(--theme-menu-hover-color);
  box-shadow: 0 0 0 2px #35e2b733 inset;
  color: var(--theme-main-text-color);
}
.letterGroup { display: flex; gap: 8px; font-size: 56px; font-weight: 700; }
.letterDigit { opacity: 0.35; color: var(--theme-text-color); }
.letterDigit.typed { opacity: 0.75; }
.letterDigit.current { opacity: 1; color: var(--theme-main-text-color); transform: scale(1.1); border-bottom: 3px solid var(--theme-menu-hover-color); }

/* 拼音音节 */
.sylStage { display: flex; flex-direction: column; align-items: center; gap: 14px; }
.sylChar { font-size: 64px; font-weight: 700; color: var(--theme-main-text-color); line-height: 1; }
.sylGroup { display: flex; gap: 6px; font-size: 44px; font-weight: 700; }
.sylLetter { opacity: 0.35; color: var(--theme-text-color); }
.sylLetter.typed { opacity: 0.75; }
.sylLetter.current { opacity: 1; color: var(--theme-menu-hover-color); border-bottom: 3px solid var(--theme-menu-hover-color); }

/* Anki 卡片 */
.cardStage { display: flex; flex-direction: column; align-items: center; gap: 14px; position: relative; z-index: 40; }
.ankiCard {
  width: 560px;
  max-width: 94vw;
  min-height: 240px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 28px 24px;
  background: var(--theme-background-light-color);
  border: 1px solid var(--theme-border-color);
  border-radius: 16px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  position: relative;
}
.ankiCard.redo::after {
  content: '🔄 重练';
  position: absolute;
  top: 10px;
  right: 14px;
  font-size: 12px;
  color: var(--theme-rich-text-color);
}
.ankiDisplay { font-size: 52px; font-weight: 700; color: var(--theme-main-text-color); line-height: 1.3; text-align: center; letter-spacing: 2px; }
.ankiSyl { display: flex; flex-wrap: wrap; justify-content: center; gap: 8px 14px; font-size: 30px; font-weight: 600; }
.ankiSylItem { display: inline-flex; gap: 1px; opacity: 0.45; }
.ankiSylItem.done { opacity: 0.8; }
.ankiSylItem.current { opacity: 1; }
.ankiProgress { font-size: 14px; color: var(--theme-text-color); }

/* 自定义词表面板 */
.customPanel {
  width: 560px;
  max-width: 94vw;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 20px;
  background: var(--theme-background-light-color);
  border: 1px solid var(--theme-border-color);
  border-radius: 16px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}
.customPanel textarea {
  width: 100%;
  height: 160px;
  padding: 12px;
  border-radius: 8px;
  border: 1px solid var(--theme-border-color);
  background: var(--theme-background-color);
  color: var(--theme-text-color);
  font-size: 15px;
  resize: vertical;
  outline: none;
}
.customPanel textarea:focus {
  border-color: var(--theme-menu-hover-color);
}
.customOpts {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}
.repeatLabel {
  font-size: 14px;
  color: var(--theme-text-color);
  display: flex;
  align-items: center;
  gap: 8px;
}
.repeatLabel input {
  width: 56px;
  padding: 6px 8px;
  border-radius: 6px;
  border: 1px solid var(--theme-border-color);
  background: var(--theme-background-color);
  color: var(--theme-text-color);
  text-align: center;
}
.customOpts .btn {
  flex: 0 0 auto;
  padding: 8px 22px;
}
.customOpts .btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 会话状态栏（固定在页面底部） */
.sessionStats {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 40;
  display: flex;
  gap: 14px;
  flex-wrap: wrap;
  justify-content: center;
  padding: 10px 12px calc(10px + env(safe-area-inset-bottom));
  background: color-mix(in srgb, var(--theme-background-light-color) 92%, transparent);
  border-top: 1px solid var(--theme-border-color);
  backdrop-filter: blur(8px);
}
.stat {
  min-width: 96px;
  text-align: center;
  padding: 8px 14px;
  background: var(--theme-background-color);
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
.resultActions .btn .shortcut { font-size: 12px; opacity: 0.75; margin-left: 2px; }
.resultActions .btn:focus-visible {
  outline: 2px solid var(--theme-menu-hover-color);
  outline-offset: 2px;
}
.modalHint { margin: 14px 0 0; font-size: 12px; color: var(--theme-rich-text-color); }
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

.footerSpace { height: 96px; }

@media (max-width: 600px) {
  .cnSentence { font-size: 24px; }
  .enWord { font-size: 36px; }
  .numGroup { font-size: 40px; }
  .letterGroup { font-size: 40px; }
  .sylGroup { font-size: 34px; }
  .sylChar { font-size: 48px; }
  .ankiDisplay { font-size: 36px; }
  .ankiSyl { font-size: 22px; }
  .ankiCard { min-height: 190px; padding: 20px 14px; }
}
</style>
