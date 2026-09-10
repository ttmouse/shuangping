// 自定义短文 → 完整课包（浏览器端，零 LLM）
// 复用项目已有的有道查询链路：fetchEnWordEntries（jsonp suggest：词性+释义）
//                             fetchYoudaoWordDetail（经代理：音标）
// 产出结构对齐 julebu 课包：course + sentences[wordDetails] + statements[word/phrase/sentence]
// 可直接写入用户选择的本地课包目录（File System Access readwrite）。

import { fetchEnWordEntries, fetchYoudaoWordDetail } from './enTranslation.js'

const WORD_RE = /[A-Za-z]+(?:'[A-Za-z]+)?/g

// —— 文本解析：中英对照 → [{en, cn}]（英文行 + 紧随的中文行作翻译）——
export function parseCustomLines(text) {
  const lines = String(text || '')
    .split(/\n+/)
    .map(l => l.trim())
    .filter(Boolean)
  const out = []
  let last = -1
  for (const line of lines) {
    const hasEn = /[A-Za-z]/.test(line)
    const nWords = (line.match(WORD_RE) || []).length
    if (hasEn && nWords >= 1) {
      out.push({ en: line, cn: '' })
      last = out.length - 1
    } else if (last >= 0) {
      out[last].cn = (out[last].cn ? out[last].cn + ' ' : '') + line
    }
  }
  return out.filter(s => (s.en.match(WORD_RE) || []).length > 0)
}

// —— 词形归一：Tom's → tom（it's 保持缩写形态）——
export function normalizeWord(w) {
  const s = String(w || '').toLowerCase()
  if (s.endsWith("'s") && s !== "it's") return s.slice(0, -2)
  return s
}

// —— 释义精简（对齐 julebu 风格）：只取首个词性的核心义，去语域标记/括号注释 ——
export function simplifyDefinition(explain) {
  if (!explain) return ''
  const clean = (seg) => {
    let t = seg.replace(/<[^>]*>/g, '').replace(/</g, '')
    t = t.replace(/[（(][^）)]*[）)]/g, '')
    for (const sep of ['；', ';', '，', ',']) {
      const i = t.indexOf(sep)
      if (i >= 0) { t = t.slice(0, i); break }
    }
    return t.trim().replace(/[。，、;；]+$/, '')
  }
  // 按词性前缀切块（n. / v. / adj. …），取第一块的核心义
  const blocks = []
  const re = /([A-Za-z]+)\.\s*([^;；]*)/g
  let m
  while ((m = re.exec(explain)) !== null) {
    const seg = clean(m[2])
    if (seg) blocks.push(seg)
  }
  if (!blocks.length) {
    const seg = clean(explain)
    return seg.length > 16 ? seg.slice(0, 16) : seg
  }
  const first = blocks[0]
  return first.length > 16 ? first.slice(0, 16) : first
}

// —— 拆分词性与释义 ——
export function splitPosAndDef(explain) {
  const m = String(explain || '').match(/^\s*([A-Za-z]+)\.\s*(.*)$/)
  if (m) return { pos: m[1].toUpperCase(), definition: simplifyDefinition(explain) }
  return { pos: '', definition: simplifyDefinition(explain) }
}

// —— 并发映射（限制并发数，避免请求过密被限流）——
async function mapLimit(items, limit, fn) {
  const results = new Array(items.length)
  let cursor = 0
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const i = cursor++
      results[i] = await fn(items[i], i)
    }
  })
  await Promise.all(workers)
  return results
}

// —— 单词查询：词性+释义（jsonp suggest）+ 音标（详情接口）——
export async function lookupWord(word, { withPhonetic = true } = {}) {
  const key = String(word || '').trim()
  if (!key) return null
  let explain = ''
  try {
    const entries = await fetchEnWordEntries(key)
    const hit = entries.find(e => e.entry.toLowerCase() === key.toLowerCase())
    explain = (hit || entries[0] || {}).explain || ''
  } catch { /* 查询失败保持空释义 */ }
  const { pos, definition } = splitPosAndDef(explain)
  let phonetic = null
  if (withPhonetic) {
    try {
      const detail = await fetchYoudaoWordDetail(key)
      const p = detail && detail.phonetic
      if (p && (p.uk || p.us)) phonetic = { uk: p.uk || '', us: p.us || '' }
    } catch { /* 音标失败不影响主流程 */ }
  }
  return { word: key, pos, definition, phonetic }
}

// —— 生成稳定 id（内容 hash + 随机尾，仿 julebu 24 位风格）——
function makeId(seed) {
  let h = 2166136261
  const s = String(seed)
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return (h >>> 0).toString(36).padStart(7, '0') + Math.random().toString(36).slice(2, 12)
}

// —— 短语切分（按标点/常见介词连词粗切，供 phrase 层练习）——
function splitPhrases(en) {
  const raw = String(en).split(/(, | and | but | at | in | on | for | by |\s+[.!?]\s*|\s*[.!?]\s*)/)
  const out = []
  for (const p of raw) {
    const t = (p || '').trim()
    if (!t || !/[A-Za-z]/.test(t)) continue
    if (/^[,.;!?]$/.test(t)) continue
    if ((t.match(WORD_RE) || []).length < 2) continue // 短语至少 2 词
    out.push(t)
  }
  return [...new Set(out)]
}

// —— 整句翻译（有道 jsonapi_s fanyi）→ 中文 ——
// 用户只粘贴英文时，自动为无中文的句子补翻译（en2zh-CHS）。
// jsonapi_s 是跨域接口，浏览器直连会被 CORS 拦 → 走项目已有的 youdao 代理：
//   dev：vite 代理 /api/youdao → dict.youdao.com；prod：Cloudflare Workers 代理
const CF_WORKER_PROXY = 'https://youdao-proxy.ttmouseg.workers.dev'
function youdaoApiUrl(path, qs) {
  const isDev = typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  const base = isDev ? '/api/youdao' : CF_WORKER_PROXY + '/api/youdao'
  return base + path + '?' + qs
}
const sentenceCache = new Map()
export async function translateSentence(en) {
  const key = String(en || '').trim()
  if (!key) return ''
  const lower = key.toLowerCase()
  if (sentenceCache.has(lower)) return sentenceCache.get(lower)
  try {
    const url = youdaoApiUrl('/jsonapi_s', 'doctype=json&jsonversion=4&q=' + encodeURIComponent(key))
    const res = await fetch(url)
    if (!res.ok) return ''
    const d = await res.json()
    const tran = ((d && d.fanyi && d.fanyi.tran) || '').trim()
    sentenceCache.set(lower, tran)
    return tran
  } catch {
    sentenceCache.set(lower, '')
    return ''
  }
}

// —— 主流程：文本 → 课包数据 ——
export async function buildPackFromText(text, { title = '', slug = '', onProgress, withPhonetic = true } = {}) {
  const sentenceList = parseCustomLines(text)
  if (!sentenceList.length) throw new Error('没有解析到英文句子（每行一句英文，中文行紧随其后作翻译）')
  // 纯英文输入时（无配对中文行），自动整句翻译补中文
  const missingCn = sentenceList.filter(s => !(s.cn || '').trim())
  if (missingCn.length) {
    onProgress && onProgress({ phase: 'translate', done: 0, total: missingCn.length })
    let tDone = 0
    await mapLimit(missingCn, 3, async (s) => {
      s.cn = await translateSentence(s.en)
      tDone++
      onProgress && onProgress({ phase: 'translate', done: tDone, total: missingCn.length })
    })
  }

  // 唯一词收集
  const uniq = new Set()
  for (const s of sentenceList) {
    for (const raw of s.en.match(WORD_RE) || []) uniq.add(normalizeWord(raw))
  }
  const words = [...uniq]

  // 批量查词（进度回调）
  let done = 0
  const dict = {}
  await mapLimit(words, 4, async (w) => {
    dict[w] = await lookupWord(w, { withPhonetic })
    done++
    onProgress && onProgress({ phase: 'lookup', done, total: words.length, word: w })
  })

  // 组装 sentences + statements
  const packId = `local-${makeId(title + slug + Date.now())}`
  const courseId = `${slug || 'custom'}-1`
  const sentences = []
  const statements = []
  const courseTitle = title || '自定义课包'
  const PACK_PREFIX = slug || 'custom-pack'

  sentenceList.forEach((lineItem, si) => {
    const en = lineItem.en
    const cn = lineItem.cn || ''
    const sid = makeId(`${PACK_PREFIX}-s${si}-${en}`)
    const tokens = en.match(WORD_RE) || []

    // wordDetails（逐词，按句序）
    const wordDetails = []
    const seenInSentence = new Set()
    for (const raw of tokens) {
      const w = normalizeWord(raw)
      if (seenInSentence.has(w)) continue
      seenInSentence.add(w)
      const info = dict[w]
      if (!info) continue
      wordDetails.push({
        word: raw,
        pos: info.pos,
        phonetic: info.phonetic,
        definition: info.definition,
        partOfSpeech: info.pos,
      })
    }

    sentences.push({
      id: sid,
      content: en,
      english: en,
      chinese: cn,
      sortOrder: si + 1,
      wordDetails,
      wordGroups: [],
      dependencyAnalysis: null,
      sentenceStructure: null,
      region: 'CH1',
    })

    // statements：word 层 → phrase 层 → sentence 层
    let order = 1
    const stmts = []
    for (const raw of tokens) {
      const w = normalizeWord(raw)
      const info = dict[w]
      stmts.push({
        id: makeId(`${sid}-w${order}-${raw}`),
        order: order++,
        chinese: (info && info.definition) || '',
        english: raw,
        soundmark: (info && info.phonetic && (info.phonetic.us || info.phonetic.uk)) || '',
        type: 'word',
        sentenceId: sid,
        image: null, startTime: null, endTime: null,
        details: info ? { [raw]: { word: raw, partOfSpeech: info.pos, definition: info.definition, phonetic: info.phonetic } } : null,
        wordGroups: null,
      })
    }
    for (const ph of splitPhrases(en)) {
      stmts.push({
        id: makeId(`${sid}-p${order}-${ph}`),
        order: order++,
        chinese: '',
        english: ph,
        soundmark: '',
        type: 'phrase',
        sentenceId: sid,
        image: null, startTime: null, endTime: null,
        details: null, wordGroups: null,
      })
    }
    stmts.push({
      id: makeId(`${sid}-sent`),
      order: order++,
      chinese: cn,
      english: en,
      soundmark: '',
      type: 'sentence',
      sentenceId: sid,
      image: null, startTime: null, endTime: null,
      details: null, wordGroups: null,
    })
    statements.push(...stmts)
  })

  // stats（与 add-course-stats.py 同口径）
  const cnt = {}
  for (const s of statements) cnt[s.type] = (cnt[s.type] || 0) + 1
  const stats = { sentences: sentences.length, total: statements.length }
  for (const k of ['word', 'phrase', 'chunk', 'sentence']) if (cnt[k]) stats[k] = cnt[k]

  const courseData = {
    course: {
      id: courseId,
      title: courseTitle,
      description: `${sentences.length} 句 · 自动生成（词性/释义/音标）`,
      order: 1,
      coursePackId: packId,
      type: 'normal',
      mediaUrl: null, mediaAssetId: null, image: null, statementId: null,
    },
    sentences,
    statements,
  }
  const packIndex = {
    id: packId,
    slug: PACK_PREFIX,
    title: courseTitle,
    description: `${sentences.length} 句自定义短文`,
    courseCount: 1,
    courses: [{ order: 1, id: courseId, title: courseTitle, file: 'L01.json', stats }],
  }
  const topEntry = {
    slug: PACK_PREFIX, id: packId, title: courseTitle,
    description: `${sentences.length} 句自定义短文`, courseCount: 1,
  }
  return { slug: PACK_PREFIX, courseData, packIndex, topEntry, stats }
}

// —— 写入本地课包目录（需 readwrite 句柄）+ 更新顶层注册表 ——
export async function writePackToDir(dirHandle, pack) {
  const { slug, courseData, packIndex, topEntry } = pack
  // 课包目录
  const packDir = await dirHandle.getDirectoryHandle(slug, { create: true })
  const writeJson = async (dir, name, obj) => {
    const fh = await dir.getFileHandle(name, { create: true })
    const w = await fh.createWritable()
    await w.write(JSON.stringify(obj, null, 1))
    await w.close()
  }
  await writeJson(packDir, 'L01.json', courseData)
  await writeJson(packDir, 'index.json', packIndex)

  // 顶层注册表（存在则合并，不存在则新建）
  let top = { version: 1, packs: [] }
  try {
    const fh = await dirHandle.getFileHandle('index.json')
    const text = await (await fh.getFile()).text()
    top = JSON.parse(text) || top
    if (!Array.isArray(top.packs)) top.packs = []
  } catch { /* 无注册表则新建 */ }
  const i = top.packs.findIndex(p => p.slug === slug)
  if (i >= 0) top.packs[i] = topEntry
  else top.packs.push(topEntry)
  await writeJson(dirHandle, 'index.json', top)

  return { slug, packDirName: slug }
}
