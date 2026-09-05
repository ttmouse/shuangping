// 英文单词发音：有道词典 TTS 接口（参考 localhost:3002 的 audio-player.js）
// https://dict.youdao.com/dictvoice?type=2&audio=WORD （type=2 英音，type=1 美音）
// 注意：dictvoice 音频为「预生成」，单词/短语命中率高，但任意整句大多返回
// 500 null audio。
// 网页端（youdao.com/result）朗读整句实际走的是 dict.youdao.com/pronounce/base
// —— 实时 TTS 合成接口，任意句子都能合成（需 MD5 签名，密钥来自网页 JS：
// voiceDictWeb 配置的 signSecretKey=U3uACNRWSDWdcsKm；
// sign = MD5(按参数名排序的非空参数 k=v&k=v&...&key=密钥)，pointParam=参数名列表）
// 策略：speakSentence = 先试 pronounce/base（实时合成，任意句子可读）→
//   失败回退 dictvoice 整句（词典预生成原声）→ 再失败回退浏览器内置
//   SpeechSynthesis 整句连贯朗读。
const TTS_ENDPOINT = 'https://dict.youdao.com/dictvoice'
const TTS_SENTENCE_ENDPOINT = 'https://dict.youdao.com/pronounce/base'
const TTS_SIGN_KEY = 'U3uACNRWSDWdcsKm' // 页面 voiceDictWeb 配置的签名密钥

let lastAudio = null

// ---- 打断机制：任何新朗读（单词/整句）使进行中的朗读全部失效 ----
let speechToken = null
export function stopAllSpeech() {
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
const MAX_YOUDAO_LEN = 300 // 超过此长度合成耗时长，直接走语音合成

// ---- MD5（公版实现）：pronounce/base 签名用 ----
// 注意：MD5 按字节计算，须先把字符串 UTF-8 编码（句子含破折号等非 ASCII 时 charCodeAt 会算错）
function md5Utf8(string) {
  try {
    const bytes = new TextEncoder().encode(string)
    let s = ''
    for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i])
    return s
  } catch {
    return unescape(encodeURIComponent(string)) // 旧环境回退
  }
}
function md5(string) {
  string = md5Utf8(string)
  function RotateLeft(lValue, iShiftBits) { return (lValue << iShiftBits) | (lValue >>> (32 - iShiftBits)) }
  function AddUnsigned(lX, lY) {
    const lX4 = (lX & 0x40000000) | 0
    const lY4 = (lY & 0x40000000) | 0
    const lX8 = (lX & 0x80000000) | 0
    const lY8 = (lY & 0x80000000) | 0
    const lX12 = (lX & 0x10000000) | 0
    const lY12 = (lY & 0x10000000) | 0
    let lTemp = (lX & 0x3fffffff) + (lY & 0x3fffffff)
    if (lX4 & lY4) return (lX8 ^ lY8) ^ (lTemp ^ 0x80000000)
    if (lX4 | lY4) {
      if (lTemp & 0x40000000) return (lX8 ^ lY8) ^ (lTemp ^ 0xc0000000)
      return (lX8 ^ lY8) ^ (lTemp ^ 0x40000000)
    }
    return (lX8 ^ lY8) ^ lTemp
  }
  function F(x, y, z) { return (x & y) | (~x & z) }
  function G(x, y, z) { return (x & z) | (y & ~z) }
  function H(x, y, z) { return x ^ y ^ z }
  function I(x, y, z) { return y ^ (x | ~z) }
  function FF(a, b, c, d, x, s, ac) { a = AddUnsigned(a, AddUnsigned(AddUnsigned(F(b, c, d), x), ac)); return AddUnsigned(RotateLeft(a, s), b) }
  function GG(a, b, c, d, x, s, ac) { a = AddUnsigned(a, AddUnsigned(AddUnsigned(G(b, c, d), x), ac)); return AddUnsigned(RotateLeft(a, s), b) }
  function HH(a, b, c, d, x, s, ac) { a = AddUnsigned(a, AddUnsigned(AddUnsigned(H(b, c, d), x), ac)); return AddUnsigned(RotateLeft(a, s), b) }
  function II(a, b, c, d, x, s, ac) { a = AddUnsigned(a, AddUnsigned(AddUnsigned(I(b, c, d), x), ac)); return AddUnsigned(RotateLeft(a, s), b) }
  function ConvertToWordArray(string) {
    let lWordCount
    const lMessageLength = string.length
    const lNumberOfWords_temp1 = lMessageLength + 8
    const lNumberOfWords_temp2 = (lNumberOfWords_temp1 - (lNumberOfWords_temp1 % 64)) / 64 + 1
    const lNumberOfWords = lNumberOfWords_temp2 * 16
    const lWordArray = Array(lNumberOfWords - 1)
    let lBytePosition = 0, lByteCount = 0
    while (lByteCount < lMessageLength) {
      lWordCount = (lByteCount - (lByteCount % 4)) / 4
      lBytePosition = (lByteCount % 4) * 8
      lWordArray[lWordCount] = lWordArray[lWordCount] | (string.charCodeAt(lByteCount) << lBytePosition)
      lByteCount++
    }
    lWordCount = (lByteCount - (lByteCount % 4)) / 4
    lBytePosition = (lByteCount % 4) * 8
    lWordArray[lWordCount] = lWordArray[lWordCount] | (0x80 << lBytePosition)
    lWordArray[lNumberOfWords - 2] = lMessageLength << 3
    lWordArray[lNumberOfWords - 1] = lMessageLength >>> 29
    return lWordArray
  }
  function WordToHex(lValue) {
    let WordToHexValue = '', WordToHexValue_temp = '', lByte, lCount
    for (lCount = 0; lCount <= 3; lCount++) {
      lByte = (lValue >>> (lCount * 8)) & 255
      WordToHexValue_temp = '0' + lByte.toString(16)
      WordToHexValue = WordToHexValue + WordToHexValue_temp.substr(WordToHexValue_temp.length - 2, 2)
    }
    return WordToHexValue
  }
  let x = ConvertToWordArray(string)
  let k, AA, BB, CC, DD, a = 0x67452301, b = 0xefcdab89, c = 0x98badcfe, d = 0x10325476
  for (k = 0; k < x.length; k += 16) {
    AA = a; BB = b; CC = c; DD = d
    a = FF(a, b, c, d, x[k + 0], 7, 0xd76aa478); d = FF(d, a, b, c, x[k + 1], 12, 0xe8c7b756); c = FF(c, d, a, b, x[k + 2], 17, 0x242070db)
    b = FF(b, c, d, a, x[k + 3], 22, 0xc1bdceee); a = FF(a, b, c, d, x[k + 4], 7, 0xf57c0faf); d = FF(d, a, b, c, x[k + 5], 12, 0x4787c62a)
    c = FF(c, d, a, b, x[k + 6], 17, 0xa8304613); b = FF(b, c, d, a, x[k + 7], 22, 0xfd469501); a = FF(a, b, c, d, x[k + 8], 7, 0x698098d8)
    d = FF(d, a, b, c, x[k + 9], 12, 0x8b44f7af); c = FF(c, d, a, b, x[k + 10], 17, 0xffff5bb1); b = FF(b, c, d, a, x[k + 11], 22, 0x895cd7be)
    a = FF(a, b, c, d, x[k + 12], 7, 0x6b901122); d = FF(d, a, b, c, x[k + 13], 12, 0xfd987193); c = FF(c, d, a, b, x[k + 14], 17, 0xa679438e); b = FF(b, c, d, a, x[k + 15], 22, 0x49b40821)
    a = GG(a, b, c, d, x[k + 1], 5, 0xf61e2562); d = GG(d, a, b, c, x[k + 6], 9, 0xc040b340); c = GG(c, d, a, b, x[k + 11], 14, 0x265e5a51)
    b = GG(b, c, d, a, x[k + 0], 20, 0xe9b6c7aa); a = GG(a, b, c, d, x[k + 5], 5, 0xd62f105d); d = GG(d, a, b, c, x[k + 10], 9, 0x2441453)
    c = GG(c, d, a, b, x[k + 15], 14, 0xd8a1e681); b = GG(b, c, d, a, x[k + 4], 20, 0xe7d3fbc8); a = GG(a, b, c, d, x[k + 9], 5, 0x21e1cde6)
    d = GG(d, a, b, c, x[k + 14], 9, 0xc33707d6); c = GG(c, d, a, b, x[k + 3], 14, 0xf4d50d87); b = GG(b, c, d, a, x[k + 8], 20, 0x455a14ed)
    a = GG(a, b, c, d, x[k + 13], 5, 0xa9e3e905); d = GG(d, a, b, c, x[k + 2], 9, 0xfcefa3f8); c = GG(c, d, a, b, x[k + 7], 14, 0x676f02d9); b = GG(b, c, d, a, x[k + 12], 20, 0x8d2a4c8a)
    a = HH(a, b, c, d, x[k + 5], 4, 0xfffa3942); d = HH(d, a, b, c, x[k + 8], 11, 0x8771f681); c = HH(c, d, a, b, x[k + 11], 16, 0x6d9d6122)
    b = HH(b, c, d, a, x[k + 14], 23, 0xfde5380c); a = HH(a, b, c, d, x[k + 1], 4, 0xa4beea44); d = HH(d, a, b, c, x[k + 4], 11, 0x4bdecfa9)
    c = HH(c, d, a, b, x[k + 7], 16, 0xf6bb4b60); b = HH(b, c, d, a, x[k + 10], 23, 0xbebfbc70); a = HH(a, b, c, d, x[k + 13], 4, 0x289b7ec6); d = HH(d, a, b, c, x[k + 0], 11, 0xeaa127fa)
    c = HH(c, d, a, b, x[k + 3], 16, 0xd4ef3085); b = HH(b, c, d, a, x[k + 6], 23, 0x4881d05); a = HH(a, b, c, d, x[k + 9], 4, 0xd9d4d039)
    d = HH(d, a, b, c, x[k + 12], 11, 0xe6db99e5); c = HH(c, d, a, b, x[k + 15], 16, 0x1fa27cf8); b = HH(b, c, d, a, x[k + 2], 23, 0xc4ac5665)
    a = II(a, b, c, d, x[k + 0], 6, 0xf4292244); d = II(d, a, b, c, x[k + 7], 10, 0x432aff97); c = II(c, d, a, b, x[k + 14], 15, 0xab9423a7)
    b = II(b, c, d, a, x[k + 5], 21, 0xfc93a039); a = II(a, b, c, d, x[k + 12], 6, 0x655b59c3); d = II(d, a, b, c, x[k + 3], 10, 0x8f0ccc92)
    c = II(c, d, a, b, x[k + 10], 15, 0xffeff47d); b = II(b, c, d, a, x[k + 1], 21, 0x85845dd1); a = II(a, b, c, d, x[k + 8], 6, 0x6fa87e4f)
    d = II(d, a, b, c, x[k + 15], 10, 0xfe2ce6e0); c = II(c, d, a, b, x[k + 6], 15, 0xa3014314); b = II(b, c, d, a, x[k + 13], 21, 0x4e0811a1)
    a = II(a, b, c, d, x[k + 4], 6, 0xf7537e82); d = II(d, a, b, c, x[k + 11], 10, 0xbd3af235); c = II(c, d, a, b, x[k + 2], 15, 0x2ad7d2bb); b = II(b, c, d, a, x[k + 9], 21, 0xeb86d391)
    a = AddUnsigned(a, AA); b = AddUnsigned(b, BB); c = AddUnsigned(c, CC); d = AddUnsigned(d, DD)
  }
  return (WordToHex(a) + WordToHex(b) + WordToHex(c) + WordToHex(d)).toLowerCase()
}

// pronounce/base：实时 TTS 合成整句（sign 算法逆向自网页 JS）
function buildPronounceUrl(text, accent) {
  const params = {
    product: 'webdict', appVersion: '1', client: 'web', mid: '1', vendor: 'web',
    screen: '1', model: '1', imei: '1', network: 'wifi', keyfrom: 'dick',
    keyid: 'voiceDictWeb', mysticTime: String(Date.now()), yduuid: 'abcdefg',
    le: 'eng', phonetic: '', rate: '4', word: text, type: String(accent === 'us' ? 1 : 2), id: '',
  }
  const p = {}
  for (const k of Object.keys(params)) if (params[k] !== '') p[k] = params[k]
  const keys = Object.keys(p).sort() // 参数名排序（空值不参与）
  const pp = [...keys, 'key']
  p.key = TTS_SIGN_KEY
  const raw = pp.map(k => `${k}=${p[k]}`).join('&')
  p.sign = md5(raw)
  p.pointParam = pp.join(',')
  delete p.key // key 仅用于签名，发送时不带（与网页一致）
  return TTS_SENTENCE_ENDPOINT + '?' + new URLSearchParams(p).toString()
}

// 浏览器内置语音（SpeechSynthesis）：整句连贯朗读；口音用 voice（en-GB/en-US）匹配
let cachedVoices = []
function refreshVoices() {
  try { cachedVoices = speechSynthesis.getVoices() } catch { cachedVoices = [] }
}
if (typeof speechSynthesis !== 'undefined') {
  refreshVoices()
  speechSynthesis.addEventListener?.('voiceschanged', refreshVoices)
}
function speakNative(text, accent, token, repeat = 1, onDone = null) {
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
    const speakOnce = () => speechSynthesis.speak(u)
    let n = repeat
    u.onend = () => {
      if (isStale(token)) return
      if (--n > 0) speakOnce()
      else if (typeof onDone === 'function') onDone()
    }
    speakOnce()
  } catch {}
}

// 整句朗读：整个句子作为一次请求发给有道（同接口同音色）；
// 命中（词典预生成音频）→ 直接播放整句；失败（500 null audio / 超时）
// → 回退系统语音整句连读。textOrWords 支持单词数组或字符串。
export function speakSentence(textOrWords, accent = 'uk', repeat = 1, onDone = null) {
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
    speakNative(text, accent, token, repeat, onDone)
    return
  }

  // 有道整句：canplay = 有音频（命中）；error = 未收录（500 JSON）
  // 优先级：pronounce/base（实时合成，任意句子可读）→ dictvoice（词典预生成原声）→ 系统语音
  const type = accent === 'us' ? 1 : 2
  let settled = false, attempt = 0
  const finish = ok => {
    if (settled) return
    settled = true
    clearTimeout(timeout)
    if (isStale(token)) return // 已被打断：静默放弃（不播也不回退）
    if (ok) {
      sentenceFailCache.delete(text)
      playRepeat(Math.max(1, repeat)) // 命中 → 播放整句（repeat 次，如短文模式两遍）
    } else {
      // 第一通道失败 → 第二通道（dictvoice 词典原声）→ 再失败走系统语音
      if (attempt === 0) {
        settled = false
        attempt = 1
        return tryDictvoice()
      }
      sentenceFailCache.set(text, Date.now())
      speakNative(text, accent, token, repeat, onDone) // 未收录 → 回退系统语音整句连读
    }
  }
  // 重复播放：一遍结束后自动接着下一遍（打被断时中止后续重复）
  const playRepeat = n => {
    const playOnce = () => a.play().catch(() => {})
    if (n <= 1) {
      a.onended = () => { if (!isStale(token) && typeof onDone === 'function') onDone() }
      playOnce()
      return
    }
    a.onended = () => {
      if (isStale(token)) return // 已被打断：不再重播
      if (--n > 0) { a.currentTime = 0; playOnce() }
      else { a.onended = null; if (typeof onDone === 'function') onDone() }
    }
    playOnce()
  }
  let a
  const tryPronounce = () => {
    a = new Audio(buildPronounceUrl(text, accent)) // 实时合成：任意句子都能读
    a.volume = 0.6 // 与单词发音同音量
    lastAudio = a
    a.addEventListener('canplay', () => finish(true))
    a.addEventListener('error', () => finish(false))
  }
  const tryDictvoice = () => {
    const url = `${TTS_ENDPOINT}?type=${type}&audio=${encodeURIComponent(text)}`
    a = new Audio(url)
    a.volume = 0.6
    lastAudio = a
    a.addEventListener('canplay', () => finish(true))
    a.addEventListener('error', () => finish(false))
  }
  // 加载兜底：避免整句静默等待
  const timeout = setTimeout(() => finish(false), 6000)
  tryPronounce()
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