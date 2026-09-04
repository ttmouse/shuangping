// 主题课包（julebu 课程包）数据加载
// 数据在 public/course-packs/<slug>/ 下，运行时 fetch 按需加载
// 结构：index.json（总注册表）→ <slug>/index.json（课包+课程清单）→ <slug>/Lxx.json（单课全量）

// 用相对根路径访问 public/course-packs（GitHub Pages 部署到子路径时由 base 配置保证）
// Vite 注入 import.meta.env.BASE_URL，运行时取当前 base 路径
const PACK_ROOT = `${import.meta.env.BASE_URL}course-packs`

// 单词释义缓存（课包slug → word → {pos, cn, phonetic}），供"释义跟课文走"
const dictCache = new Map()

// 规范化路径（parts 直接 join，避免多余处理）
function url(...parts) {
  return parts.join('/')
}

// 1. 读取总注册表：有哪些课包
export async function fetchCoursePackRegistry() {
  const res = await fetch(url(PACK_ROOT, 'index.json'))
  if (!res.ok) throw new Error(`课包注册表加载失败: ${res.status}`)
  return res.json()
}

// 2. 读取单个课包：元信息 + 课程清单
export async function fetchCoursePack(slug) {
  const res = await fetch(url(PACK_ROOT, slug, 'index.json'))
  if (!res.ok) throw new Error(`课包 ${slug} 加载失败: ${res.status}`)
  return res.json()
}

// 3. 读取单课全量数据（course + sentences + statements）
export async function fetchCourseData(slug, file) {
  const res = await fetch(url(PACK_ROOT, slug, file))
  if (!res.ok) throw new Error(`课程 ${file} 加载失败: ${res.status}`)
  return res.json()
}

// 从单课数据构建"单词 → 释义"映射（跟课文走：details + wordDetails 两个来源）
export function buildCourseDict(courseData) {
  const dict = {}
  const put = (w, pos, cn, ph) => {
    if (!w) return
    const key = String(w).toLowerCase()
    if (cn && !dict[key]) {
      dict[key] = { pos: pos || '', cn, ph: ph || null }
    }
  }
  // statements.details：每条含逐词 {word, partOfSpeech, definition, phonetic}
  for (const st of courseData.statements || []) {
    const det = st.details
    if (!det) continue
    for (const [k, v] of Object.entries(det)) {
      put(v?.word || k, v?.partOfSpeech, v?.definition, v?.phonetic)
    }
  }
  // sentences.wordDetails：句子逐词词典（补充词形变化）
  for (const s of courseData.sentences || []) {
    for (const wd of s.wordDetails || []) {
      put(wd.word, wd.partOfSpeech, wd.definition, wd.phonetic)
    }
  }
  return dict
}

// 获取课包的词典（带缓存：同课包只构建一次）
export async function getCourseDict(slug, file) {
  const key = `${slug}/${file}`
  if (dictCache.has(key)) return dictCache.get(key)
  const data = await fetchCourseData(slug, file)
  const dict = buildCourseDict(data)
  dictCache.set(key, dict)
  return dict
}

// 空 type 推断：单词卡（无空格）→ word；多词整句/短句（含空格）→ sentence。
// 依据：850 词包 type 齐全；pep5 单词卡 type 为空且是纯单词（如 "banana"），
// 其回应短句（如 "Sure !"）也应归 sentence；friends 对话包整课无拆解（整句对话）同样归 sentence。
// 不能一律兜底 word——否则整句内容在中级/高级难度会被过滤掉。
function inferStatementType(s) {
  if (s.type) return s.type
  const en = String(s.english || '').trim()
  return /\s/.test(en) ? 'sentence' : 'word'
}

// 生成练习队列：statements 原顺序 → { type, en, cn, phonetic, meta? }
// meta 含 sentenceId 关联的逐词解析（wordDetails + sentenceStructure 主语/谓语/表语），
// 供整句完成态展示词性/成分（850 全字段课包有；PEP/friends 旧数据可能缺 → 前端容错）
// 保持 word → phrase → sentence 的递进逻辑，与 enStories 旧格式兼容（含 en/cn）
export function statementsToQueue(courseData) {
  const stmts = [...(courseData.statements || [])].sort((a, b) => (a.order || 0) - (b.order || 0))
  // sentenceId → 关联 sentence（含 wordDetails/sentenceStructure）
  const sentById = new Map((courseData.sentences || []).map(s => [s.id, s]))
  const tokCount = (txt) => (String(txt || '').toLowerCase().match(/[a-z0-9']+/g) || []).length
  return stmts.map(s => {
    const item = {
      type: inferStatementType(s),
      en: s.english || '',
      cn: s.chinese || '',
      phonetic: s.phonetic || s.soundmark || '',
    }
    const sent = s.sentenceId ? sentById.get(s.sentenceId) : null
    // 官网把整句按难度拆成 word/chunk/phrase/sentence 多条 statement（挂在同一源句上）。
    // 只有 statement 词数与源句一致才是"整句级"练习；词/语块级练习完成时
    // 不应渲染整个源句的成分结构图（前端据此只平铺当前词卡）。
    item.fullSentence = !!sent && tokCount(s.english) > 0 && tokCount(s.english) === tokCount(sent.english)
    if (sent && (sent.wordDetails?.length || sent.sentenceStructure?.length)) {
      item.meta = {
        sentenceId: s.sentenceId,
        sentenceEn: sent.english || '',
        // 逐词词性/释义/音标（词序 = 原句词序）
        wordDetails: Array.isArray(sent.wordDetails) ? sent.wordDetails : [],
        // 句子成分（主语/谓语/表语…，带 start/end 词索引区间）
        sentenceStructure: Array.isArray(sent.sentenceStructure) ? sent.sentenceStructure : [],
      }
    }
    return item
  }).filter(s => s.en)
}

// 难度过滤：同一份 statements 按 type 出不同档位
// beginner(初级) = 全部（word+phrase+sentence+chunk）
// intermediate(中级) = 去纯单词（phrase+sentence+chunk）
// advanced(高级) = 仅整句（sentence）
export const DIFFICULTY_FILTER = {
  beginner: () => true,
  intermediate: (t) => t !== 'word',
  advanced: (t) => t === 'sentence',
}

// 自定义模式：四类显示名 → 真实 type 映射（与句乐部 UI 文案一致）
export const CUSTOM_TYPE_OPTIONS = [
  { key: 'sentence', label: '句子' },
  { key: 'chunk', label: '组合语块' },
  { key: 'phrase', label: '语块' },
  { key: 'word', label: '短语单词' },
]
// 默认全选（= 初级）
export const DEFAULT_CUSTOM_TYPES = { sentence: true, chunk: true, phrase: true, word: true }

// 按难度过滤队列（保留原顺序）
export function filterQueueByDifficulty(queue, difficulty) {
  const allowed = DIFFICULTY_FILTER[difficulty] || DIFFICULTY_FILTER.beginner
  return queue.filter(s => allowed(s.type))
}

// 按自定义勾选过滤队列（customTypes: {sentence/chunk/phrase/word: bool}）
export function filterQueueByCustomTypes(queue, customTypes) {
  const sel = customTypes || DEFAULT_CUSTOM_TYPES
  return queue.filter(s => !!sel[s.type])
}

// 单课数据 → 练习所需的 story 结构（App 现有 startEnStory 管道兼容）
export function courseToStory(courseData) {
  const course = courseData.course || {}
  const sentences = statementsToQueue(courseData)
  const order = String(course.order || '').padStart(2, '0')
  return {
    id: course.id || `${order}-${course.title}`,
    grade: 'julebu',
    title: course.title || '',
    titleCn: course.title || '',
    source: 'julebu',       // 标记来源：释义跟课文走时用
    packFile: course.file || null,
    sentences,
  }
}
