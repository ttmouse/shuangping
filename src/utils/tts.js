// 英文单词发音：有道词典 TTS 接口（参考 localhost:3002 的 audio-player.js）
// https://dict.youdao.com/dictvoice?type=2&audio=WORD （type=2 英音，type=1 美音）
// 注意：有道音频为「预生成」，仅词典收录的词/短语有音频；完整句子大多返回
// 500 null audio（策略参考 GPT插件/dazi/js/audio-player.js 的降级方案）：
//   speakSentence = 整个句子作为一次请求先试有道原声 → 失败自动回退浏览器内置
//   语音（SpeechSynthesis）整句连贯朗读，失败句缓存 5 分钟内不重复请求。
const TTS_ENDPOINT = 'https://dict.youdao.com/dictvoice'

let lastAudio = null

// ---- 打断机制：任何新朗读（单词/整句）使进行中的朗读全部失效 ----
let speechToken = null
function stopAllSpeech() {
  speechToken = null // 使进行中的整句朗读（含 pending 的有道请求）失效
  if (lastAudio && lastAudio.currentTime > 0 && !lastAudio.ended) {
    try { lastAudio.pause(); lastAudio.currentTime = 0 } catch {}
  }
  if (typeof speechSynthesis !== 'undefined') {
    try { speechSynthesis.cancel() } catch {}
  }
}
function isStale(token) {
  return !token || token.cancelled || speechToken !== token
}

// 整句失败缓存：有道无此句（5 分钟内）直接走系统语音，避免反复请求
const sentenceFailCache = new Map() // key: sentenceText -> failedAt
const SENT_FAIL_TTL = 5 * 60 * 1000
const MAX_YOUDAO_LEN = 100 // 超过此长度有道必失败，直接走语音合成

// 浏览器内置语音（SpeechSynthesis）：整句连贯朗读；口音用 voice（en-GB/en-US）匹配
let cachedVoices = []
function refreshVoices() {
  try { cachedVoices = speechSynthesis.getVoices() } catch { cachedVoices = [] }
}
if (typeof speechSynthesis !== 'undefined') {
  refreshVoices()
  speechSynthesis.addEventListener?.('voiceschanged', refreshVoices)
}
function speakNative(text, accent, token) {
  if (typeof speechSynthesis === 'undefined' || isStale(token)) return
  try {
    const u = new SpeechSynthesisUtterance(text)
    const lang = accent === 'us' ? 'en-US' : 'en-GB'
    const voice =
      cachedVoices.find(v => v.lang === lang) ||
      cachedVoices.find(v => v.lang.startsWith('en')) ||
      null
    if (voice) u.voice = voice
    u.lang = voice ? voice.lang : lang
    u.rate = 0.95
    u.pitch = 1
    u.volume = 0.8
    speechSynthesis.cancel() // 防止与其它语音合成叠加
    speechSynthesis.speak(u)
  } catch {}
}

// 整句朗读：整个句子作为一次请求发给有道（同接口同音色）；
// 命中（词典预生成音频）→ 直接播放整句；失败（500 null audio / 超时）
// → 回退系统语音整句连读。textOrWords 支持单词数组或字符串。
export function speakSentence(textOrWords, accent = 'uk') {
  const text = Array.isArray(textOrWords)
    ? textOrWords.filter(Boolean).join(' ')
    : String(textOrWords || '').trim()
  if (!text) return
  stopAllSpeech()
  const token = { cancelled: false }
  speechToken = token

  // 缓存命中或超长句 → 直接系统语音（省去必然失败的有道请求）
  const cached = sentenceFailCache.get(text)
  if (text.length > MAX_YOUDAO_LEN || (cached && Date.now() - cached < SENT_FAIL_TTL)) {
    speakNative(text, accent, token)
    return
  }

  // 有道整句：canplay = 有音频（命中）；error = 未收录（500 JSON）
  const type = accent === 'us' ? 1 : 2
  const url = `${TTS_ENDPOINT}?type=${type}&audio=${encodeURIComponent(text)}`
  const a = new Audio(url)
  a.volume = 0.6 // 与单词发音同音量
  lastAudio = a
  let settled = false
  const finish = ok => {
    if (settled) return
    settled = true
    clearTimeout(timeout)
    if (isStale(token)) return // 已被打断：静默放弃（不播也不回退）
    if (ok) {
      sentenceFailCache.delete(text)
      a.play().catch(() => {}) // 命中 → 播放整句
    } else {
      sentenceFailCache.set(text, Date.now())
      speakNative(text, accent, token) // 未收录 → 回退系统语音整句连读
    }
  }
  // 有道加载可能久拖：5s 兜底，避免整句静默等待
  const timeout = setTimeout(() => finish(false), 5000)
  a.addEventListener('canplay', () => finish(true))
  a.addEventListener('error', () => finish(false))
}

// 朗读单词；连续朗读时自动打断上一个（包括整句朗读）
// 注意：只打断「正在播放」的音频；仍在加载（未开始出声）的不打断，
// 否则第一个词在加载慢（如外网有道接口）时会被下一个词掐掉，导致首词无声
export function speakWord(word, accent = 'uk') {
  if (!word) return
  stopAllSpeech() // 单词发音打断整句朗读
  try {
    const type = accent === 'us' ? 1 : 2
    const url = `${TTS_ENDPOINT}?type=${type}&audio=${encodeURIComponent(word)}`
    const a = new Audio(url)
    a.volume = 0.6 // 发音音量 60%
    a.play().catch(() => {})
    lastAudio = a
  } catch {
    /* 播放失败（如网络不可达）静默忽略 */
  }
}