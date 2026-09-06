<template>
  <div class="cr-root" :class="{ 'is-focus-mode': singleFocus, 'reading-light': theme==='light' }">
    <!-- 顶栏 -->
    <div class="cr-topbar">
      <div class="cr-tb-left">
        <button class="cr-backlist" title="回到当前课包的课程列表" @click="goBack" data-nav>
          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
          课程列表
        </button>
        <span v-if="title" class="cr-title">{{ title }}</span>
        <span v-if="sentenceCount" class="cr-count">{{ curIdx + 1 }} / {{ sentenceCount }} 句</span>
        <!-- 课程切换：前后课（句数之后，位于最右避免误触） -->
        <span v-if="courseList.length > 1" class="cr-course-nav">
          <button class="cr-iconbtn" title="上一课" :disabled="courseIdx <= 0" @click="goCourse(-1)" data-nav>
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </button>
          <span class="cr-course-pos">{{ courseIdx + 1 }}/{{ courseList.length }}</span>
          <button class="cr-iconbtn" title="下一课" :disabled="courseIdx < 0 || courseIdx >= courseList.length - 1" @click="goCourse(1)" data-nav>
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
          </button>
        </span>
      </div>
      <div class="cr-tb-right">
        <span class="cr-sentnav">
          <button class="cr-iconbtn" title="上一句" :disabled="curIdx===0" @click="step(-1)" data-nav>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </button>
          <button class="cr-readall" :class="{ playing: playingAll }" @click="toggleReadAll" data-nav>
            <svg v-if="playingAll" viewBox="0 0 24 24" width="13" height="13" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>
            <svg v-else viewBox="0 0 24 24" width="13" height="13" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
            {{ playingAll ? '停止朗读' : '朗读全文' }}
          </button>
          <button class="cr-iconbtn" title="下一句" :disabled="curIdx>=sentenceCount-1" @click="step(1)" data-nav>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
          </button>
        </span>
        <span class="cr-sep">|</span>

        <!-- 朗读设置：口音 -->
        <span class="cr-wrap">
          <button class="cr-chip" :class="{ open: voiceOpen }" @click.stop="voiceOpen = !voiceOpen" data-nav>
            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H2v6h4l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M18.5 5.5a9 9 0 0 1 0 13"/></svg>
            {{ accent === 'us' ? '美音' : '英音' }}
          </button>
          <div v-if="voiceOpen" class="cr-popup" @click.stop>
            <button v-for="v in [['uk','英音'],['us','美音']]" :key="v[0]" class="cr-popitem" :class="{ on: accent===v[0] }" @click="accent=v[0];voiceOpen=false">{{ v[1] }}</button>
          </div>
        </span>

        <!-- 显示 -->
        <span class="cr-wrap">
          <button class="cr-chip" :class="{ open: displayOpen }" @click.stop="displayOpen = !displayOpen" data-nav>显示</button>
          <div v-if="displayOpen" class="cr-popup cr-display-pop" @click.stop>
            <button v-for="d in displayDefs" :key="d.key" class="cr-popitem cr-display-item" :data-on="display[d.key] ? 'true' : 'false'" @click="display[d.key] = !display[d.key]">
              <span class="cr-check" :class="{ on: display[d.key] }">
                <svg v-if="display[d.key]" viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m4 12 5 5L20 7"/></svg>
              </span>
              <span>{{ d.label }}</span>
            </button>
          </div>
        </span>

        <!-- 单句聚焦 -->
        <button class="cr-chip" :class="{ on: singleFocus }" @click="singleFocus = !singleFocus" data-nav title="单句聚焦：放大当前句，其余淡出">单句聚焦</button>

        <!-- 阅读设置 -->
        <span class="cr-wrap">
          <button class="cr-chip" :class="{ open: readOpen }" @click.stop="readOpen = !readOpen" data-nav>阅读设置</button>
          <div v-if="readOpen" class="cr-popup cr-read-pop" @click.stop>
            <div class="cr-readrow"><span class="cr-readlabel">字号</span>
              <button class="cr-minibtn" @click="adjustSize(-2)">A−</button>
              <span class="cr-readval">{{ fontSize }}px</span>
              <button class="cr-minibtn" @click="adjustSize(2)">A+</button>
            </div>
            <div class="cr-readrow"><span class="cr-readlabel">行高</span>
              <button class="cr-minibtn" @click="lineHeight = Math.max(1.2, +(lineHeight - 0.1).toFixed(1))">−</button>
              <span class="cr-readval">{{ lineHeight.toFixed(1) }}</span>
              <button class="cr-minibtn" @click="lineHeight = Math.min(2.4, +(lineHeight + 0.1).toFixed(1))">+</button>
            </div>
            <div class="cr-readrow"><span class="cr-readlabel">字体</span>
              <button class="cr-minibtn" :class="{ on: !serif }" @click="serif=false">黑体</button>
              <button class="cr-minibtn" :class="{ on: serif }" @click="serif=true">衬线</button>
            </div>
            <div class="cr-readrow"><span class="cr-readlabel">主题</span>
              <button class="cr-minibtn" :class="{ on: theme==='auto' }" @click="theme='auto'">跟随</button>
              <button class="cr-minibtn" :class="{ on: theme==='light' }" @click="theme='light'">纸感</button>
              <button class="cr-minibtn" :class="{ on: theme==='dark' }" @click="theme='dark'">深色</button>
            </div>
            <button class="cr-readreset" @click="resetReadSettings">恢复默认</button>
          </div>
        </span>

        <span class="cr-sep">|</span>
        <button class="cr-practicebtn" @click="startPractice" data-nav>
          <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
          开始练习
        </button>
      </div>
    </div>

    <!-- 正文文章流 -->
    <div class="cr-scroll" ref="scrollEl" @scroll.passive="onScroll">
      <div v-if="loading" class="cr-state">加载课程…</div>
      <div v-else-if="error" class="cr-state cr-error">{{ error }}</div>
      <div v-else class="cr-article"
        :class="{ 'show-phonetic': display.phonetic, 'show-pos': display.pos, 'show-def': display.def, 'show-cn': display.zh, 'show-structure': display.structure }"
        :style="{ fontSize: fontSize + 'px' }">
        <div
          v-for="(s, si) in sentences"
          :key="s.id || si"
          class="cr-sentence"
          :class="{ 'is-current': si === curIdx, 'is-focus-muted': singleFocus && si !== curIdx }"
          :ref="el => sentEls[si] = el"
          @click="clickSentence(si)"
        >
          <span class="cr-indicator" :class="{ 'is-visible': si === curIdx }"></span>
          <div class="cr-body">
            <!-- 英文行 -->
            <div v-if="display.en" class="cr-en" :style="{ rowGap: (lineHeight - 1.2).toFixed(2) + 'em' }">
              <template v-for="(tok, ti) in tokenizeSentence(s)">
                <span
                  v-if="tok.type === 'word'"
                  :key="'w'+ti"
                  class="cr-word"
                >
                  <span v-if="display.phonetic" class="cr-ph-row"><span class="cr-ph">{{ tok.phonetic }}</span></span>
                  <span class="cr-surface">
                    <span class="cr-main">
                      <span class="cr-text is-clickable" data-nav :title="tok.word" @click.stop="openWordCard($event, tok)">{{ tok.text }}</span>
                    </span>
                  </span>
                  <span class="cr-below">
                    <span v-if="display.def && tok.def" class="cr-def-row"><span class="cr-def">{{ tok.def }}</span></span>
                    <span v-if="display.pos && tok.posCn" class="cr-pos-wrap"><span class="cr-pos" :style="{ color: posColor(tok.pos) }">{{ tok.posCn }}</span></span>
                  </span>
                </span>
                <span v-else :key="'p'+ti" class="cr-plain" :class="{ punct: tok.type === 'punct' }">{{ tok.text }}</span>
              </template>
            </div>
            <!-- 中文行 -->
            <p v-if="display.zh && s.chinese" class="cr-cn">{{ s.chinese }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 词卡浮层 -->
    <div v-if="wordCard" class="cr-wordcard" :style="{ left: wordCard.x + 'px', top: wordCard.y + 'px' }" @click.stop>
      <div class="cr-wc-head">
        <span class="cr-wc-word">{{ wordCard.tok.text }}</span>
        <button class="cr-wc-btn" title="美式发音" @click="playWord('us')">美</button>
        <button class="cr-wc-btn" title="英式发音" @click="playWord('uk')">英</button>
      </div>
      <div class="cr-wc-phs">
        <span v-if="wordCard.tok.phoneticUs" class="cr-wc-ph"><b>美</b>{{ wordCard.tok.phoneticUs }}</span>
        <span v-if="wordCard.tok.phonetic" class="cr-wc-ph"><b>英</b>{{ wordCard.tok.phonetic }}</span>
      </div>
      <div class="cr-wc-defs">
        <div class="cr-wc-def"><i v-if="wordCard.tok.posCn">{{ wordCard.tok.posCn }}</i> {{ wordCard.tok.def || '' }}</div>
      </div>
      <div class="cr-wc-actions">
        <button
          class="cr-wc-add"
          :class="{ on: inVocabBook(wordCard.tok) }"
          title="收藏到生词本，长期保留"
          @click="toggleVocabWord(wordCard.tok)"
        >
          <svg v-if="inVocabBook(wordCard.tok)" viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="m4 12.5 5 5L20 6.5"/></svg>
          <svg v-else viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14"/><path d="M5 12h14"/></svg>
          {{ inVocabBook(wordCard.tok) ? '已在生词本' : '加入生词本' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, reactive, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { fetchCourseData, fetchCoursePack, buildCourseDict } from '../utils/coursePacks.js'
import { speakSentence, speakWord, stopAllSpeech } from '../utils/tts.js'

// ---------- 词性中文 / 颜色（与练习页一致） ----------
const POS_CN = { PRON:'代词', AUX:'助动词', PART:'小品词', DET:'限定词', NOUN:'名词', VERB:'动词', ADJ:'形容词', ADV:'副词', ADP:'介词', CCONJ:'连词', SCONJ:'连词', INTJ:'感叹词', PROPN:'专有名词', PROPN_PERSON:'人名', NUM:'数词', X:'其他', PUNCT:'标点', '':'', null:'', undefined:'' }
// 词性 → 颜色（与练习页 POS_COLORS 一致，tailwind-500 系）
const POS_COLORS = {
  PRON: '#ef4444', AUX: '#22c55e', PART: '#6b7280', DET: '#14b8a6',
  NOUN: '#3b82f6', VERB: '#f97316', ADJ: '#ec4899', ADV: '#8b5cf6',
  ADP: '#a855f7', CCONJ: '#eab308', SCONJ: '#eab308', INTJ: '#f43f5e',
  PROPN: '#0ea5e9', PROPN_PERSON: '#0ea5e9', NUM: '#84cc16',
  X: '#9ca3af', PUNCT: '#9ca3af',
}
const posColor = pos => POS_COLORS[pos] || '#9ca3af'

const route = useRoute()
const router = useRouter()
// pack/course 跟随 URL 实时取（支持同页面直接切换前后课程）

const loading = ref(true)
const error = ref('')
const title = ref('')
const sentences = ref([])
const sentEls = []
const scrollEl = ref(null)
const curIdx = ref(0)
// 课包课程清单与当前课位置（左上角前后课切换）
const courseList = ref([])
const courseIdx = ref(-1)

// 显示开关选项（默认同官网 reading：原文 + 中文 + 释义）
const displayDefs = [
  { key: 'en', label: '英文原文' }, { key: 'zh', label: '中文' }, { key: 'phonetic', label: '音标' },
  { key: 'pos', label: '词性' }, { key: 'def', label: '单词释义' }, { key: 'structure', label: '句子成分' },
]

const singleFocus = ref(false)
const playingAll = ref(false)
let playAllIndex = -1
let playAllTimer = null

// 阅读设置（localStorage 持久化）
const lsKey = 'sp-reading-settings'
const saved = JSON.parse(localStorage.getItem(lsKey) || '{}')
const fontSize = ref(saved.fontSize ?? 24)
const lineHeight = ref(saved.lineHeight ?? 1.7)
const serif = ref(saved.serif ?? true)
const theme = ref(saved.theme ?? 'auto')
const accent = ref(saved.accent ?? 'uk')
// 显示字段开关：与阅读设置同存（默认同官网 reading：原文 + 中文 + 释义）
const display = reactive({ en: true, zh: true, phonetic: false, pos: false, def: true, structure: false, ...(saved.display || {}) })
const voiceOpen = ref(false)
const displayOpen = ref(false)
const readOpen = ref(false)
function persistReadSettings() {
  localStorage.setItem(lsKey, JSON.stringify({
    fontSize: fontSize.value, lineHeight: lineHeight.value, serif: serif.value, theme: theme.value, accent: accent.value,
    display: { ...display },
  }))
}
watch([fontSize, lineHeight, serif, theme, accent], persistReadSettings)
watch(display, persistReadSettings, { deep: true })
function adjustSize(d) { fontSize.value = Math.min(40, Math.max(16, fontSize.value + d)) }
function resetReadSettings() {
  fontSize.value = 24; lineHeight.value = 1.7; serif.value = true; theme.value = 'auto'
  // 恢复默认时同步还原显示字段（英文 + 中文 + 释义）
  display.en = true; display.zh = true; display.phonetic = false
  display.pos = false; display.def = true; display.structure = false
}

const sentenceCount = computed(() => sentences.value.length)
const serifFont = computed(() => serif.value ? 'Georgia, \"Times New Roman\", \"Songti SC\", serif' : 'inherit')

// 课包级词典（statements.details + 全部句子 wordDetails 汇总），句子自带词条缺词典字段时兜底
const courseDict = ref({})
// 词典查找：整词优先，连字符复合词拆部分兜底（如 "hard-working" 数据拆成 hard/working 两条）
function lookupCourseDict(lower) {
  const dict = courseDict.value || {}
  let de = dict[lower]
  if (de) return de
  if (lower.includes('-')) {
    for (const part of lower.split('-')) {
      de = dict[part]
      if (de) return de
    }
  }
  return null
}

// ---------- 句子 token 化 ----------
function tokenizeSentence(s) {
  const wds = (s.wordDetails || []).slice()
  const tokens = []
  // 归一化：连字符两侧带空格时（如课程数据 "hard - working"）合并为 "hard-working"，
  // 与练习模式 parseEnSentence 保持一致；仅两侧都是字母/数字时合并，避免误伤破折号
  const en = String(s.english || s.content || '').replace(/([A-Za-z0-9])\s*-\s*([A-Za-z0-9])/g, '$1-$2')
  const parts = en.split(/(\s+)/).filter(Boolean)
  for (const part of parts) {
    if (/^\s+$/.test(part)) continue
    const text = part
    const m = /[A-Za-z0-9'][A-Za-z0-9'\-]*/.exec(text)
    if (!m || m[0].length !== text.length) {
      // 纯标点/符号
      tokens.push({ type: 'punct', text, word: '' })
      continue
    }
    // 找 wordDetails（按词序，忽略大小写，含词形首字母大写）
    const lower = text.toLowerCase()
    let wi = wds.findIndex(d => String(d.word || '').toLowerCase() === lower)
    if (wi < 0) wi = wds.findIndex(d => String(d.word || '').toLowerCase().replace(/'/g, '') === lower.replace(/'/g, ''))
    // 连字符复合词：整词匹配不到时按 "-" 拆部分匹配句内词条（hard-working → hard / working）
    if (wi < 0 && lower.includes('-')) {
      wi = -1
      for (const part2 of lower.split('-')) {
        wi = wds.findIndex(d => String(d.word || '').toLowerCase() === part2 || String(d.word || '').toLowerCase().replace(/'/g, '') === part2.replace(/'/g, ''))
        if (wi >= 0) break
      }
    }
    let d = wi >= 0 ? wds.splice(wi, 1)[0] : null
    let tok = null
    if (d) {
      const phUk = (d.phonetic && d.phonetic.uk) || ''
      const phUs = (d.phonetic && d.phonetic.us) || ''
      tok = {
        type: 'word', text, word: d.word || text,
        pos: d.pos || d.partOfSpeech || '', posCn: POS_CN[(d.pos || d.partOfSpeech)] || '',
        def: d.definition || '', phonetic: phUk, phoneticUs: phUs,
      }
    }
    // 句内词条缺失或词条本身缺词典字段 → 课包级词典兜底（单词课 wordDetails 常为空，
    // 兜底后点词也能弹词卡；与练习页 buildCourseDict 同源）
    if (!tok || (!tok.def && !tok.posCn && !tok.phonetic && !tok.phoneticUs)) {
      const de = lookupCourseDict(lower)
      if (de) {
        const ph = de.phonetic
        const phUk = ph && typeof ph === 'object' ? (ph.uk || '') : (ph || '')
        const phUs = ph && typeof ph === 'object' ? (ph.us || '') : ''
        const pos = de.pos || de.partOfSpeech || ''
        tok = tok || { type: 'word', text, word: text, pos: '', posCn: '', def: '', phonetic: '', phoneticUs: '' }
        if (!tok.def) tok.def = de.definition ?? de.cn ?? ''
        if (!tok.posCn) { tok.pos = pos; tok.posCn = POS_CN[pos] || '' }
        if (!tok.phonetic && !tok.phoneticUs) { tok.phonetic = phUk; tok.phoneticUs = phUs }
      }
    }
    if (!tok) {
      tok = { type: 'word', text, word: text, pos: '', posCn: '', def: '', phonetic: '', phoneticUs: '' }
    }
    tokens.push(tok)
  }
  // 标点吸附：数据里词与标点以空格分隔（如 "Hi , Peter !"）。把纯标点 token
  // 并入相邻单词文本，避免逗号/问号前后悬空，以及标点被折行甩到行首。
  const STICKABLE = /^[,.;:!?…，。！？；：、]+$/
  const out = []
  for (const tok of tokens) {
    const t = String(tok.text || '')
    if (tok.type === 'punct' && STICKABLE.test(t)) {
      const prev = out[out.length - 1]
      if (prev && prev.type === 'word') { prev.text += t; continue }
      // 行首标点（开引号/括号等，PEP 数据少见）：挂到后续首个单词的文本头
      const ti = tokens.indexOf(tok)
      const ni = tokens.findIndex((x, xi) => xi > ti && x.type === 'word')
      if (ni >= 0) { tokens[ni].text = t + tokens[ni].text; continue }
    }
    out.push(tok)
  }
  // 单词句兜底：全句仅一个词且词典仍无数据时，用本句中译当词义（单词课每句即一个词，"team"→"团队"）
  if (out.length === 1 && out[0].type === 'word' && !out[0].def && !out[0].posCn && !out[0].phonetic && !out[0].phoneticUs) {
    const cn = String(s.chinese || '').trim()
    if (cn) out[0].def = cn
  }
  return out
}

// ---------- 加载 ----------
let loadSeq = 0
async function load() {
  const pk = String(route.query.pack || '')
  const cf = String(route.query.course || '')
  const seq = ++loadSeq // 快速切课时丢弃过期响应
  loading.value = true
  error.value = ''
  try {
    // 并行拉课程数据 + 课包课程清单（用于前后课切换）
    const [data, packMeta] = await Promise.all([
      fetchCourseData(pk, cf),
      fetchCoursePack(pk).catch(() => null),
    ])
    if (seq !== loadSeq) return
    // 记最近打开/切到的课（与练习页同 key），课程列表据此高亮"上次"
    try { localStorage.setItem('sp-last-course', JSON.stringify({ pack: pk, course: cf, ts: Date.now() })) } catch { /* ignore */ }
    // 触碰课程进度（同练习页 key 'sp-course-progress'）：记 lastPracticed，保留 completed
    try {
      const prog = JSON.parse(localStorage.getItem('sp-course-progress') || '{}')
      const slot = prog[pk] || (prog[pk] = {})
      const rec = slot[cf] || (slot[cf] = {})
      rec.lastPracticed = Date.now()
      localStorage.setItem('sp-course-progress', JSON.stringify(prog))
    } catch { /* ignore */ }
    title.value = data.course?.title || cf
    // 课包级词典（statements.details + 全课 wordDetails 汇总），供点词词卡兜底
    try { courseDict.value = buildCourseDict(data) } catch { courseDict.value = {} }
    const list = [...(data.sentences || [])].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
    sentences.value = list
    curIdx.value = 0
    // 定位当前课在课包中的位置
    const courses = packMeta?.courses || []
    courseList.value = courses
    courseIdx.value = courses.findIndex(c => (c.file || c.id) === cf)
  } catch (e) {
    error.value = '课程加载失败：' + (e.message || e)
  } finally {
    loading.value = false
  }
}
// 切换前后课程（同 pack、mode=reading，URL mode 仍在末尾）
function goCourse(dir) {
  const pk = String(route.query.pack || '')
  const target = courseList.value[courseIdx.value + dir]
  if (!pk || !target) return
  stopReadAll()
  router.push({ path: '/practice-modes', query: { pack: pk, course: target.file || target.id, mode: 'reading' } })
}
watch(() => [route.query.pack, route.query.course], () => {
  if (route.query.mode === 'reading') load()
})

// ---------- 导航 ----------
// 「课程列表」：显式回到当前课包的课程列表（浏览态），不依赖 history.back
// 只带 pack、不带 course，避免触发课程自动开始练习
function goBack() {
  stopAllSpeech()
  const pk = String(route.query.pack || '')
  const q = pk ? { pack: pk, mode: 'stories' } : { mode: 'stories' }
  router.push({ path: '/practice-modes', query: q })
}
function startPractice() {
  stopAllSpeech()
  // mode 放 URL 末尾（同官网课程 URL 约定），进入同课的句子练习
  router.push({ path: '/practice-modes', query: { pack: route.query.pack, course: route.query.course, mode: 'stories' } })
}
function goToSentence(i) {
  if (i < 0 || i >= sentences.value.length) return
  curIdx.value = i
  scrollToSentence(i, 'center')
}
function clickSentence(si) {
  // 点击句子：定位为当前句并朗读整句（若正在朗读全文则先打断，只播这一句）
  if (playingAll.value) stopReadAll()
  else stopAllSpeech()
  goToSentence(si)
  const s = sentences.value[si]
  if (!s) return
  const text = String(s.english || s.content || '').trim()
  if (text) speakSentence(text, accent.value, 1, null)
}
function step(d) {
  const next = Math.min(sentences.value.length - 1, Math.max(0, curIdx.value + d))
  if (next !== curIdx.value) {
    curIdx.value = next
    scrollToSentence(next, 'center')
  }
}
function scrollToSentence(i, block = 'center') {
  const el = sentEls[i]
  if (el) { try { el.scrollIntoView({ behavior: 'smooth', block }) } catch { el.scrollIntoView() } }
}
function onScroll() {
  // 朗读全文时由回调驱动；手动滚动仅用于自动吸附（不做强制跟随）
}

// 朗读全文：逐句连播 + 高亮跟随
function toggleReadAll() {
  if (playingAll.value) { stopReadAll(); return }
  playingAll.value = true
  playAllIndex = curIdx.value
  playSentenceAt(playAllIndex)
}
function stopReadAll() {
  playingAll.value = false
  stopAllSpeech()
  if (playAllTimer) { clearTimeout(playAllTimer); playAllTimer = null }
}
function playSentenceAt(i) {
  if (!playingAll.value || i >= sentences.value.length) { playingAll.value = false; return }
  const s = sentences.value[i]
  curIdx.value = i
  scrollToSentence(i, 'center')
  const text = String(s.english || s.content || '').trim()
  if (!text) { playAllIndex++; playSentenceAt(playAllIndex); return }
  speakSentence(text, accent.value, 1, () => {
    if (!playingAll.value) return
    // 有道的 onended 触发时机不稳，给下句留一点间隔
    playAllTimer = setTimeout(() => { playAllIndex++; playSentenceAt(playAllIndex) }, 350)
  })
}

// 点词 → 查词卡
const wordCard = ref(null)
function openWordCard(e, tok) {
  // 点击即读：默认按当前选择的口音朗读该单词
  stopAllSpeech()
  speakWord(tok.word || tok.text, accent.value)
  if (!tok.def && !tok.posCn && !tok.phonetic) return // 无词典词：只朗读不弹卡
  const r = e.currentTarget.getBoundingClientRect()
  const CW = 340 // 卡片外宽（300 + 边框/内边距），窄屏 260 时 css 另有覆盖
  const CH = 270 // 预估卡片高度（含生词本按钮行），用于视口内摆放
  let x = r.left
  let y = r.bottom + 8
  if (x + CW > window.innerWidth - 8) x = Math.max(8, window.innerWidth - CW - 8)
  if (y + CH > window.innerHeight - 8) {
    y = r.top - CH - 8 // 优先放到单词上方
    if (y < 8) y = Math.max(8, window.innerHeight - CH - 8) // 上下都放不下 → 钳制在视口内
  }
  wordCard.value = { x: Math.round(x), y: Math.round(y), tok }
}
function closeWordCard() { wordCard.value = null }
function closeAllFloaters() {
  wordCard.value = null
  voiceOpen.value = false
  displayOpen.value = false
  readOpen.value = false
}
function playWord(which) {
  if (!wordCard.value) return
  speakWord(wordCard.value.tok.word, which)
}

// ---------- 生词本：与练习页同 key/同结构，阅读中收藏的词在生词本里复习 ----------
// 条目 = { def, pos, posCn, phUk, phUs, ts }；key 为小写词形
const EN_VOCAB_KEY = 'sp-vocab-book'
function loadEnVocab() {
  try { return JSON.parse(localStorage.getItem(EN_VOCAB_KEY) || '{}') } catch { return {} }
}
const vocabBook = reactive(loadEnVocab())
function saveEnVocab() {
  try { localStorage.setItem(EN_VOCAB_KEY, JSON.stringify(vocabBook)) } catch {}
}
function inVocabBook(tok) {
  const key = String(tok?.word || '').trim().toLowerCase()
  return !!vocabBook[key]
}
function toggleVocabWord(tok) {
  const key = String(tok?.word || '').trim().toLowerCase()
  if (!key || !/[A-Za-z0-9]/.test(key)) return // 纯标点/符号单元不收藏
  if (vocabBook[key]) {
    delete vocabBook[key]
  } else {
    vocabBook[key] = { def: tok.def || '', pos: tok.pos || '', posCn: tok.posCn || '', phUk: tok.phonetic || '', phUs: tok.phoneticUs || '', ts: Date.now() }
  }
  saveEnVocab()
}

// ---------- 键盘 ----------
function onKey(e) {
  if (e.key === 'Escape') { closeAllFloaters(); return }
  if (wordCard.value) return
  if (displayOpen.value || voiceOpen.value || readOpen.value) return
  if (e.key === 'ArrowLeft') { step(-1); e.preventDefault() }
  else if (e.key === 'ArrowRight') { step(1); e.preventDefault() }
  else if (e.key === ' ' || e.key === 'Enter') { if (singleFocus.value || true) { /* 空格不抢（与阅读习惯一致），回车读当前句 */ if (e.key === 'Enter') { e.preventDefault(); toggleReadAll() } } }
}
function onDocClick() {
  // 点击词卡/菜单之外的任意处：收起全部浮层（内部 @click.stop 已拦截冒泡）
  closeAllFloaters()
}
window.addEventListener('keydown', onKey)
window.addEventListener('click', onDocClick)
onMounted(() => { load(); if (!route.query.pack || !route.query.course) { error.value = '缺少 pack/course 参数'; loading.value = false } })
onBeforeUnmount(() => { window.removeEventListener('keydown', onKey); window.removeEventListener('click', onDocClick); stopReadAll() })
</script>

<style scoped>
/* 布局骨架：全屏纵向 */
.cr-root { position: fixed; inset: 0; display: flex; flex-direction: column; background: var(--theme-background-color); color: var(--theme-text-color); z-index: 60; }
.cr-root.reading-light { background: #fff; }
.cr-topbar { flex: none; display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 8px 16px; border-bottom: 1px solid var(--theme-border-color); background: var(--theme-background-light-color); flex-wrap: wrap; z-index: 5; }
.cr-tb-left { display: flex; align-items: center; gap: 8px; min-width: 0; }
.cr-backlist { display: inline-flex; align-items: center; gap: 5px; height: 28px; padding: 0 8px; border-radius: 8px; border: none; background: transparent; color: var(--theme-text-secondary); font-size: 12.5px; cursor: pointer; white-space: nowrap; flex: none; }
.cr-backlist:hover { color: var(--theme-main-text-color); background: color-mix(in srgb, var(--theme-main-text-color) 7%, transparent); }
.cr-course-nav { display: inline-flex; align-items: center; gap: 2px; margin: 0 2px; flex: none; }
.cr-course-pos { font-size: 11.5px; color: var(--theme-text-secondary); white-space: nowrap; font-variant-numeric: tabular-nums; }
.cr-tb-right { display: flex; align-items: center; gap: 4px; flex-wrap: wrap; position: relative; }
.cr-title { flex: none; font-size: 14px; font-weight: 600; white-space: nowrap; }
.cr-count { font-size: 12px; color: var(--theme-text-secondary); white-space: nowrap; }
.cr-sentnav { display: inline-flex; align-items: center; gap: 2px; margin: 0 4px; }
.cr-sep { color: var(--theme-border-color); margin: 0 4px; }

.cr-iconbtn { display: inline-flex; align-items: center; justify-content: center; width: 28px; height: 28px; border-radius: 8px; border: none; background: transparent; color: var(--theme-text-color); cursor: pointer; }
.cr-iconbtn:hover { background: rgba(128,128,128,.15); }
.cr-iconbtn:disabled { opacity: .35; cursor: default; }

.cr-chip { display: inline-flex; align-items: center; gap: 5px; height: 28px; padding: 0 10px; border-radius: 8px; border: 1px solid var(--theme-border-color); background: transparent; color: var(--theme-text-color); font-size: 12.5px; cursor: pointer; white-space: nowrap; }
.cr-chip:hover, .cr-chip.open, .cr-chip.on { border-color: var(--theme-main-text-color); color: var(--theme-main-text-color); }
.cr-chip.on { background: color-mix(in srgb, var(--theme-main-text-color) 12%, transparent); }

.cr-readall { display: inline-flex; align-items: center; gap: 5px; height: 28px; padding: 0 12px; border-radius: 8px; border: 1px solid var(--theme-main-text-color); background: transparent; color: var(--theme-main-text-color); font-size: 12.5px; cursor: pointer; white-space: nowrap; }
.cr-readall.playing { background: var(--theme-main-text-color); color: var(--theme-box-textContent-color); }

.cr-practicebtn { display: inline-flex; align-items: center; gap: 5px; height: 28px; padding: 0 14px; border-radius: 8px; border: none; background: var(--theme-main-text-color); color: var(--theme-box-textContent-color); font-size: 12.5px; font-weight: 600; cursor: pointer; white-space: nowrap; }

.cr-scroll { flex: 1; overflow-y: auto; overflow-x: hidden; }
.cr-state { padding: 80px 20px; text-align: center; color: var(--theme-text-secondary); }
.cr-error { color: var(--theme-error); }

/* 文章流 */
.cr-article { max-width: 860px; margin: 0 auto; padding: 28px 24px 140px; }
.cr-sentence { display: flex; flex-direction: row; align-items: flex-start; gap: 14px; position: relative; padding: 14px 18px; margin: 2px -18px; border-radius: 16px; cursor: pointer; transition: opacity .25s ease, background .25s ease; }
.cr-sentence.is-current { background: color-mix(in srgb, var(--theme-main-text-color) 6%, transparent); }
.cr-sentence.is-focus-muted { opacity: .28; }
.cr-indicator { flex: none; width: 4px; border-radius: 999px; background: var(--theme-main-text-color); align-self: stretch; margin: 2px 0; opacity: 0; transition: opacity .25s ease; }
.cr-sentence.is-current .cr-indicator { opacity: 1; }
.cr-body { min-width: 0; flex: 1; }
/* 英文行：flex 布局，词卡纵向零 margin —— 与中文行的距离只由 .cr-cn 的
   margin-top 决定，词卡之间不再产生任何底部空隙 */
.cr-en { display: flex; flex-wrap: wrap; align-items: flex-start; column-gap: .3em; font-size: 1em; }
.cr-cn { margin: .2em 0 0; font-size: .72em; color: var(--theme-text-secondary); }

/* 逐词 */
.cr-word { display: inline-flex; flex-direction: column; align-items: flex-start; font-family: v-bind(serifFont); }
.cr-ph-row { font-size: .55em; color: var(--theme-text-secondary); height: 1.3em; line-height: 1.3em; }
.cr-ph { font-family: var(--font-mono, ui-monospace, monospace); }
.cr-surface { display: block; }
.cr-main { display: block; }
.cr-text { padding: .06em .32em .06em 0; border-radius: 6px; cursor: pointer; }
/* 悬停：无背景，仅词色变化（默认词色即正文色） */
.cr-text:hover { background: transparent; color: var(--theme-main-text-color); }
/* 释义/词性：正常参与布局（不溢出、不预留空白）。选项关闭时 .cr-below
   为空、高度为 0，词卡高度自动回到词本体，句子高度随之收缩 */
.cr-below { display: flex; flex-direction: column; align-items: center; font-size: .55em; line-height: 1.25; }
.cr-def-row { color: var(--theme-main-text-color); opacity: .85; margin-top: .1em; }
.cr-def { }
.cr-pos-wrap { margin-top: .1em; }
/* 词性：仿官网 —— 无背景文字，底部细横线跟随词性颜色 */
.cr-pos { font-size: .92em; border-bottom: 1px solid color-mix(in srgb, currentColor 55%, transparent); line-height: 1.3; }
.cr-plain { white-space: pre; }
.cr-plain.punct { margin: 0 .05em; }
.cr-sentence.show-phonetic .cr-word, .cr-article.show-phonetic .cr-word { }
/* 标点符号间隔自然 */

/* 下拉菜单 */
.cr-wrap { position: relative; display: inline-flex; }
.cr-popup { position: absolute; top: calc(100% + 6px); right: 0; z-index: 80; min-width: 170px; background: var(--theme-background-light-color); border: 1px solid var(--theme-border-color); border-radius: 12px; box-shadow: 0 8px 24px rgba(0,0,0,.14); padding: 6px; display: flex; flex-direction: column; gap: 2px; }
.cr-popitem { display: flex; align-items: center; gap: 8px; padding: 7px 10px; border: none; background: transparent; color: var(--theme-text-color); font-size: 13px; border-radius: 8px; cursor: pointer; text-align: left; width: 100%; }
.cr-popitem:hover { background: rgba(128,128,128,.12); }
.cr-popitem.on { color: var(--theme-main-text-color); }
.cr-display-item .cr-check { display: inline-flex; width: 15px; height: 15px; border-radius: 4px; border: 1.5px solid var(--theme-border-color); align-items: center; justify-content: center; color: #fff; flex: none; }
.cr-display-item .cr-check.on { background: var(--theme-main-text-color); border-color: var(--theme-main-text-color); }
.cr-read-pop { min-width: 250px; }
.cr-readrow { display: flex; align-items: center; gap: 6px; padding: 5px 2px; }
.cr-readlabel { width: 34px; font-size: 12.5px; color: var(--theme-text-secondary); }
.cr-readval { min-width: 38px; text-align: center; font-size: 12.5px; }
.cr-minibtn { padding: 3px 8px; font-size: 12px; border-radius: 6px; border: 1px solid var(--theme-border-color); background: transparent; color: var(--theme-text-color); cursor: pointer; }
.cr-minibtn.on { border-color: var(--theme-main-text-color); color: var(--theme-main-text-color); }
.cr-readreset { margin-top: 6px; padding: 6px; font-size: 12px; border-radius: 8px; border: 1px solid var(--theme-border-color); background: transparent; color: var(--theme-text-secondary); cursor: pointer; width: 100%; }

/* 词卡 */
.cr-wordcard { position: fixed; z-index: 200; width: 300px; background: var(--theme-background-light-color); border: 1px solid var(--theme-border-color); border-radius: 14px; box-shadow: 0 12px 32px rgba(0,0,0,.18); padding: 14px 16px; }
.cr-wc-head { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.cr-wc-word { font-size: 22px; font-weight: 700; }
.cr-wc-phs { display: flex; gap: 10px; margin-top: 2px; flex-wrap: wrap; }
.cr-wc-ph { font-size: 14px; color: var(--theme-text-secondary); }
.cr-wc-ph b { font-weight: 600; color: var(--theme-main-text-color); margin-right: 3px; font-style: normal; }
.cr-wc-btn { padding: 2px 9px; font-size: 12px; border-radius: 6px; border: 1px solid var(--theme-border-color); background: transparent; color: var(--theme-text-color); cursor: pointer; }
.cr-wc-btn:hover { border-color: var(--theme-main-text-color); color: var(--theme-main-text-color); }
.cr-wc-defs { margin-top: 10px; }
.cr-wc-def { font-size: 14px; line-height: 1.6; }
.cr-wc-def i { font-style: normal; color: var(--theme-main-text-color); margin-right: 4px; }
.cr-wc-actions { margin-top: 12px; padding-top: 10px; border-top: 1px solid var(--theme-border-color); }
.cr-wc-add { display: flex; align-items: center; justify-content: center; gap: 6px; width: 100%; padding: 8px 10px; font-size: 13px; font-weight: 600; border-radius: 9px; border: 1px solid var(--theme-border-color); background: transparent; color: var(--theme-text-color); cursor: pointer; transition: border-color .15s ease, color .15s ease, background .15s ease; }
.cr-wc-add:hover { border-color: var(--theme-main-text-color); color: var(--theme-main-text-color); }
.cr-wc-add.on { border-color: var(--theme-main-text-color); background: color-mix(in srgb, var(--theme-main-text-color) 12%, transparent); color: var(--theme-main-text-color); }

@media (max-width: 720px) {
  /* 窄屏：标题允许折行完整展示，不截断 */
  .cr-title { white-space: normal; line-height: 1.35; }
  .cr-article { padding: 16px 10px 120px; }
  .cr-wordcard { width: 260px; }
}
</style>
