// 英文单词中文释义查询：有道词典 suggest 接口（JSONP，纯前端无 Key、无 CORS）
// 参考 tts.js 的思路：调用有道网页端公开接口，不需要申请任何 API Key。
// - 接口：https://dict.youdao.com/suggest?le=en&q=WORD&callback=cb
// - 返回：cb({"data":{"entries":[{"entry":"apple","explain":"n. 苹果"}, ...]}})
// - 说明：suggest 是词典联想接口，原生支持 JSONP（callback 参数），可绕过 CORS。
//   命中单词本身时取第一个精确匹配条目的 explain；未精确命中则静默返回空。
// 缓存策略：
// - 内存 Map：本次会话内不重复请求
// - localStorage：跨会话持久化（key: sp-en-dict-cache），查过一次不再请求

const CACHE_KEY = 'sp-en-dict-cache-v2' // v2：精简释义格式（v1 为未精简原始 explain，已废弃）
const MAX_CACHE_ENTRIES = 2000 // 防止无限膨胀，超出丢最旧的一半

let memCache = new Map()

// 加载 localStorage 缓存（启动时一次）
function loadPersistCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (raw) {
      const obj = JSON.parse(raw)
      if (obj && typeof obj === 'object') memCache = new Map(Object.entries(obj))
    }
  } catch {}
}
function persistCache() {
  try {
    const obj = Object.fromEntries(memCache)
    const keys = Object.keys(obj)
    // 超出上限：丢弃最早插入的一半（Map 迭代顺序=插入顺序）
    if (keys.length > MAX_CACHE_ENTRIES) {
      const drop = keys.length - Math.floor(MAX_CACHE_ENTRIES / 2)
      for (let i = 0; i < drop; i++) memCache.delete(keys[i])
    }
    localStorage.setItem(CACHE_KEY, JSON.stringify(Object.fromEntries(memCache)))
  } catch {}
}

// 精简中文释义：按词性切分，每个词性取第一个含义（去词性前缀），用 / 连接
// 例：'n. 苹果' → '苹果'
//     'contr. 它是（it is）；它已，它有（it has）' → '它是'
//     'n. 书，书籍；…; v. 预订，预约；…' → '书/预订'
//     'adj. 快的，迅速的；…; adv. 快速地；…' → '快的/快速地'
// 说明：suggest 接口的 explain 可能只含部分词性（如 standing 只有 adj），
//       能拿到几个就显示几个，无词性标记时按整段精简。
function simplifyExplain(raw) {
  const s = String(raw || '').trim()
  if (!s) return ''
  // 匹配词性标记（n./v./adj./adv./vi./vt./det./contr. 等）
  const posRe = /(?<![a-zA-Z])((?:adj|adv|n|v|vt|vi|det|prep|conj|pron|num|art|int|aux|modal|abbr|contr)\.)\s*/g
  const matches = [...s.matchAll(posRe)]
  if (!matches.length) {
    // 无词性标记：整段精简（取第一个分隔符前 + 去标记）
    let t = s
    const idx = t.search(/[，；,;]/)
    if (idx >= 0) t = t.slice(0, idx)
    // 删除尖括号语域标记（<非正式>、<美> 等，含不闭合截断），保留其后内容
    t = t.replace(/<[^>]*>/g, '').replace(/<[^>]*$/, '').trim()
    // 从第一个圆括号截断到段尾：注释、截断补充一律不要
    const parenIdx = t.search(/[（(]/)
    if (parenIdx >= 0) t = t.slice(0, parenIdx)
    t = t.trim()
    return t.replace(/[。，、;；]+$/, '').trim()
  }
  const parts = []
  for (let i = 0; i < matches.length; i++) {
    const segStart = matches[i][0].length + matches[i].index
    const segEnd = i + 1 < matches.length ? matches[i + 1].index : s.length
    let seg = s.slice(segStart, segEnd).trim()
    // 段内取第一个分隔符前（去同义词罗列）
    const idx = seg.search(/[，；,;]/)
    if (idx >= 0) seg = seg.slice(0, idx)
    // 删除尖括号语域标记（<非正式>、<美> 等，含不闭合截断），保留其后内容
    seg = seg.replace(/<[^>]*>/g, '').replace(/<[^>]*$/, '').trim()
    // 从第一个圆括号截断到段尾：注释、截断补充一律不要
    const parenIdx = seg.search(/[（(]/)
    if (parenIdx >= 0) seg = seg.slice(0, parenIdx)
    // 去尾部标点
    seg = seg.replace(/[。，、;；]+$/, '').trim()
    if (seg) parts.push(seg)
  }
  // 去重（不同词性可能出现相同首义，如 today: adv.今天 / n.今天 → 只留一个）
  return [...new Set(parts)].join('/')
}

// 精确匹配查询结果的条目（词形可能带大小写差异，如词典返回小写）
function pickEntry(entries, word) {
  const w = word.toLowerCase()
  for (const e of entries) {
    if (String(e.entry || '').toLowerCase() === w) return simplifyExplain(e.explain)
  }
  return ''
}

let seq = 0
const pending = new Map() // word -> [{resolve, reject}]

// JSONP 请求：动态创建 <script>，超时/失败走 reject
function jsonpRequest(word) {
  return new Promise((resolve, reject) => {
    const cb = '__ydDict' + (++seq)
    const url =
      'https://dict.youdao.com/suggest?num=5&ver=3.0&doctype=json&cache=false&le=en&callback=' +
      cb + '&q=' + encodeURIComponent(word)
    const timer = setTimeout(() => {
      cleanup()
      reject(new Error('timeout'))
    }, 6000)
    function cleanup() {
      clearTimeout(timer)
      delete window[cb]
      if (script.parentNode) script.parentNode.removeChild(script)
    }
    window[cb] = (data) => {
      cleanup()
      resolve(data)
    }
    const script = document.createElement('script')
    script.src = url
    script.onerror = () => {
      cleanup()
      reject(new Error('script error'))
    }
    document.head.appendChild(script)
  })
}

// 查询单词中文释义；未命中返回 ''。同一单词并发请求会合并。
export function fetchEnTranslation(word) {
  const key = String(word || '').trim()
  if (!key) return Promise.resolve('')
  const lower = key.toLowerCase()
  // 内存缓存（读取时也过精简，防御旧格式残留）
  if (memCache.has(lower)) return Promise.resolve(simplifyExplain(memCache.get(lower)))
  // 合并并发请求
  if (pending.has(lower)) return pending.get(lower)
  const p = jsonpRequest(key)
    .then((data) => {
      let explain = ''
      try {
        const entries = (data && data.data && data.data.entries) || []
        explain = pickEntry(entries, key)
      } catch {}
      if (explain) {
        memCache.set(lower, explain)
        persistCache()
      }
      return explain
    })
    .catch(() => '') // 失败静默降级为空（不阻塞练习）
    .finally(() => pending.delete(lower))
  pending.set(lower, p)
  return p
}

// 初始化时加载持久化缓存
if (typeof localStorage !== 'undefined') loadPersistCache()

// ---- 单词相关词条列表（有道 suggest 接口，支持 JSONP）----
// 返回多个相关词条的完整释义（含原 entry 名），用于词卡浮层展示更多释义
const entriesCache = new Map()
const entriesPending = new Map()
export function fetchEnWordEntries(word) {
  const key = String(word || '').trim()
  if (!key) return Promise.resolve([])
  const lower = key.toLowerCase()
  if (entriesCache.has(lower)) return Promise.resolve(entriesCache.get(lower))
  if (entriesPending.has(lower)) return entriesPending.get(lower)
  const p = jsonpRequest(key)
    .then((data) => {
      const entries = (data && data.data && data.data.entries) || []
      const list = entries.map(e => ({
        entry: String(e.entry || ''),
        explain: String(e.explain || ''),
      })).filter(e => e.entry)
      if (list.length) entriesCache.set(lower, list)
      return list
    })
    .catch(() => [])
    .finally(() => entriesPending.delete(lower))
  entriesPending.set(lower, p)
  return p
}

// ---- 有道词典完整详情（释义 + 双语例句 + 音标）----
// 通过 Vite dev server 代理 /api/youdao → https://dict.youdao.com，解决跨域
// 解析页面中嵌入的 window.__NUXT__ 数据（Nuxt SSR）
const YOUDAO_DETAIL_KEY = 'sp-youdao-detail-v1'
const MAX_YOUDAO_CACHE = 300
let youdaoMemCache = new Map()
function loadYoudaoCache() {
  try {
    const raw = localStorage.getItem(YOUDAO_DETAIL_KEY)
    if (raw) {
      const obj = JSON.parse(raw)
      if (obj && typeof obj === 'object') youdaoMemCache = new Map(Object.entries(obj))
    }
  } catch {}
}
function persistYoudaoCache() {
  try {
    const obj = Object.fromEntries(youdaoMemCache)
    const keys = Object.keys(obj)
    if (keys.length > MAX_YOUDAO_CACHE) {
      const drop = keys.length - Math.floor(MAX_YOUDAO_CACHE / 2)
      for (let i = 0; i < drop; i++) youdaoMemCache.delete(keys[i])
    }
    localStorage.setItem(YOUDAO_DETAIL_KEY, JSON.stringify(Object.fromEntries(youdaoMemCache)))
  } catch {}
}
if (typeof localStorage !== 'undefined') loadYoudaoCache()

const youdaoPending = new Map()

// 从 HTML 中提取并执行 window.__NUXT__ 数据
function parseNuxtData(html) {
  if (!html) return null
  // 匹配 window.__NUXT__=(function(...){...})(...) 或 window.__NUXT__={...}
  const m = html.match(/window\.__NUXT__\s*=\s*([\s\S]+?)<\/script>/)
  if (!m) return null
  const code = m[1].trim()
  try {
    // 用 new Function 执行，避免 eval 的作用域污染
    return new Function('return (' + code + ')')()
  } catch {
    return null
  }
}

// 从 ec.word[0].trs 中提取完整释义列表
function parseEcExplains(ecWord) {
  const list = []
  if (!Array.isArray(ecWord)) return list
  for (const w of ecWord) {
    const trs = w?.trs || []
    for (const tr of trs) {
      const items = tr?.tr || []
      for (const item of items) {
        const iArr = item?.l?.i || []
        for (const text of iArr) {
          if (text && !list.includes(text)) list.push(String(text).trim())
        }
      }
    }
  }
  return list
}

// 从 blng_sents_part 中提取双语例句
function parseBlngSentences(blng) {
  const list = []
  const pairs = blng?.['sentence-pair'] || []
  for (const sp of pairs) {
    const en = String(sp?.sentence || '').trim()
    const cn = String(sp?.['sentence-translation'] || '').trim()
    if (!en) continue
    // 发音 URL：相对路径拼接有道域名
    const speechPath = sp?.['sentence-speech'] || ''
    const speech = speechPath
      ? 'https://dict.youdao.com/dictvoice?audio=' + encodeURIComponent(speechPath) + '&type=2'
      : ''
    list.push({ en, cn, speech })
  }
  return list
}

// 根据环境返回有道词典页面的候选获取 URL 列表（按优先级排序，依次尝试）
// 开发环境：Vite dev server 代理（最稳定）
// 生产环境：Cloudflare Workers 代理（自建，稳定）
const CF_WORKER_PROXY = 'https://youdao-proxy.ttmouseg.workers.dev'
function getYoudaoPageUrls(word) {
  const isDev = typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  if (isDev) {
    return ['/api/youdao/result?word=' + encodeURIComponent(word) + '&lang=en']
  }
  // 生产环境：Cloudflare Workers 代理
  return [
    CF_WORKER_PROXY + '/api/youdao/result?word=' + encodeURIComponent(word) + '&lang=en',
  ]
}

// 依次尝试候选 URL，直到成功获取 HTML
async function fetchYoudaoHtml(word) {
  const urls = getYoudaoPageUrls(word)
  let lastError = null
  for (const url of urls) {
    try {
      const res = await fetch(url, { headers: { 'Accept': 'text/html' } })
      if (!res.ok) throw new Error('HTTP ' + res.status)
      const html = await res.text()
      if (html && html.length > 1000 && html.includes('__NUXT__')) return html
      throw new Error('invalid response')
    } catch (e) {
      lastError = e
    }
  }
  throw lastError || new Error('all proxies failed')
}

// 查询有道词典完整详情（音标 + 完整释义 + 双语例句）
// 查询有道词典完整详情（音标 + 完整释义 + 双语例句）
// 开发环境：Vite dev server 代理 /api/youdao
// 生产环境：Cloudflare Workers 代理 https://youdao-proxy.ttmouseg.workers.dev
// 失败返回 null（调用方降级不显示）
export function fetchYoudaoWordDetail(word) {
  const key = String(word || '').trim()
  if (!key) return Promise.resolve(null)
  const lower = key.toLowerCase()
  if (youdaoMemCache.has(lower)) return Promise.resolve(youdaoMemCache.get(lower))
  if (youdaoPending.has(lower)) return youdaoPending.get(lower)

  const p = fetchYoudaoHtml(key)
    .then(html => {
      const nuxt = parseNuxtData(html)
      const wordData = nuxt?.data?.[0]?.wordData
      if (!wordData) return null

      const ecWord = wordData.ec?.word
      const phonetic = Array.isArray(ecWord) && ecWord[0]
        ? { us: ecWord[0].usphone || '', uk: ecWord[0].ukphone || '' }
        : { us: '', uk: '' }
      const explains = parseEcExplains(ecWord)
      const sentences = parseBlngSentences(wordData.blng_sents_part)

      const result = { word: lower, phonetic, explains, sentences }
      // 至少有释义或例句才缓存
      if (explains.length || sentences.length) {
        youdaoMemCache.set(lower, result)
        persistYoudaoCache()
      }
      return result
    })
    .catch(() => null)
    .finally(() => youdaoPending.delete(lower))

  youdaoPending.set(lower, p)
  return p
}
