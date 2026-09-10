// 主题课包（julebu 课程包）数据加载
// 数据在 public/course-packs/<slug>/ 下，运行时 fetch 按需加载
// 结构：index.json（总注册表）→ <slug>/index.json（课包+课程清单）→ <slug>/Lxx.json（单课全量）
//
// —— 双源加载 ——
// 默认从线上 public/course-packs/ fetch（git 跟踪、随部署走）。
// 本地课包可「多次添加」：每次选一个目录都会并入本地源列表（后添加的源优先），
// 三个加载函数优先从本地源读取，目录结构须与线上 course-packs 一致：
//   <dir>/index.json            → 总注册表
//   <dir>/<slug>/index.json     → 课包元信息 + 课程清单
//   <dir>/<slug>/Lxx.json       → 单课全量
// 课程数据完全不进 git、不随网页部署，纯本地磁盘可用（File System Access，
// 需 Chrome/Edge + 安全上下文 localhost/https）。
// 移除按课包粒度（removeLocalCoursePack）：单包目录=整源移出；多包目录=只移出该课包。
// 不提供"一键清除全部本地课包"：全部逐个移除后自然回到纯线上模式。

// 用相对根路径访问 public/course-packs（GitHub Pages 部署到子路径时由 base 配置保证）
// Vite 注入 import.meta.env.BASE_URL，运行时取当前 base 路径
const PACK_ROOT = `${import.meta.env.BASE_URL}course-packs`

// —— 本地课包源列表 ——
// 每个元素 = 一次「＋ 本地课包」添加的目录：{ id, name, kind, handle, real, removed }
//   handle：读取用目录句柄。registry 源=真实目录；single 源=虚拟根（slug 子目录指向真实目录）
//   real  ：真实 FileSystemDirectoryHandle（持久化 / 权限校验 / isSameEntry 去重；mock 句柄为 null）
//   removed：该源内被逐个移除的课包 slug（Set）。single 源移除课包=整源移除，不会走到这里
// 同名课包冲突时「后添加的源优先」（读取与注册表合并同一规则）。
let localSources = []
let sourceSeq = 0

// —— 本地源持久化（IndexedDB）——
// FileSystemDirectoryHandle 可结构化克隆存入 IDB；刷新/重开页面后凭句柄重取权限即可恢复，
// 无需用户每次重新选目录（浏览器会记住该来源的授权，除非用户主动撤销）。
const LOCAL_DIR_DB = 'sp-local-pack-dir'
const LOCAL_DIR_STORE = 'handles'
const LOCAL_DIR_KEY = 'root'

function idbOpen() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(LOCAL_DIR_DB, 1)
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(LOCAL_DIR_STORE)) {
        req.result.createObjectStore(LOCAL_DIR_STORE)
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function idbPut(key, value) {
  const db = await idbOpen()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(LOCAL_DIR_STORE, 'readwrite')
    tx.objectStore(LOCAL_DIR_STORE).put(value, key)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

async function idbGet(key) {
  const db = await idbOpen()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(LOCAL_DIR_STORE, 'readonly')
    const req = tx.objectStore(LOCAL_DIR_STORE).get(key)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function idbDelete(key) {
  const db = await idbOpen()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(LOCAL_DIR_STORE, 'readwrite')
    tx.objectStore(LOCAL_DIR_STORE).delete(key)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

// 持久化全部本地源：只存真实句柄 + removed 数组（虚拟包装对象含函数，无法结构化克隆，不存）。
// IDB 不可用/句柄不可克隆时静默降级为仅本次会话有效。
function persistLocalSources() {
  const records = localSources
    .filter(s => s.real)
    .map(s => ({ name: s.name, kind: s.kind, handle: s.real, removed: [...s.removed], storedAt: Date.now() }))
  return idbPut(LOCAL_DIR_KEY, records).catch(() => {})
}

// 从真实目录句柄读取 index.json（重建单包虚拟根时用）
async function readDirIndexJson(dir) {
  const fh = await dir.getFileHandle('index.json')
  const text = await (await fh.getFile()).text()
  return JSON.parse(text)
}

// 单课包目录 → 虚拟根：slug = 目录名，虚拟根下仅 <slug>/ 子目录 + index.json（打包元）
function makeSingleWrap(dir, indexObj) {
  const slug = dir.name
  return {
    name: dir.name,
    async getDirectoryHandle(name) {
      if (name === slug) return dir
      throw new DOMException('', 'NotFoundError')
    },
    async getFileHandle(name) {
      if (name === 'index.json') {
        const reg = { version: 1, packs: [{ slug, id: indexObj.id, title: indexObj.title, description: indexObj.description, courseCount: indexObj.courseCount }] }
        return { async getFile() { return { async text() { return JSON.stringify(reg) } } } }
      }
      throw new DOMException('', 'NotFoundError')
    },
  }
}

// 某源注册表里"当前可见"的课包（过滤 removed；registry 与 single 统一走句柄读 index.json）
async function sourceVisiblePacks(src) {
  const fh = await src.handle.getFileHandle('index.json')
  const text = await (await fh.getFile()).text()
  return ((JSON.parse(text).packs) || []).filter(p => !src.removed.has(p.slug))
}

function isMissingErr(e) {
  const msg = String((e && (e.name + ' ' + e.message)) || '')
  return /NotFoundError/.test(msg) || /ENOENT/.test(msg) || /not found/i.test(msg) || /no such file/i.test(msg)
}

// 按相对路径从本地源读 JSON（FS Access 句柄只认单层名，需逐层下钻）。
// 后添加的源优先：第一个能提供该文件的源生效；全部源都没有才抛缺失错误（交 loadJson 回退线上）。
async function handleReadJson(relParts) {
  let lastErr = null
  for (let i = localSources.length - 1; i >= 0; i--) {
    const src = localSources[i]
    try {
      let h = src.handle
      for (let j = 0; j < relParts.length - 1; j++) h = await h.getDirectoryHandle(relParts[j])
      const fh = await h.getFileHandle(relParts[relParts.length - 1])
      const text = await (await fh.getFile()).text()
      return JSON.parse(text)
    } catch (e) {
      if (isMissingErr(e)) { lastErr = e; continue }
      throw e
    }
  }
  throw lastErr || new Error('本地源无此文件')
}

// 统一 JSON 加载入口（策略见下）：
// - forceRemote=true（注册表专用）：只走线上 fetch（线上注册表是全集，本地注册表单独合并）
// - 否则本地源优先；所有本地源都没有该文件 → 回退线上 fetch。
//   这样"本地目录只放了部分课包"时，未放本地的包仍走线上，互不干扰。
async function loadJson(relParts, forceRemote = false) {
  if (localSources.length && !forceRemote) {
    try {
      return await handleReadJson(relParts)
    } catch (e) {
      if (!isMissingErr(e) && !/本地源无此文件/.test(String(e.message || ''))) throw e
    }
  }
  const res = await fetch(url(PACK_ROOT, ...relParts))
  if (!res.ok) throw new Error(`课包数据加载失败: ${res.status}`)
  return res.json()
}

// 汇总所有本地源注册表里的课包（无本地源 → 空数组，不抛错）；同名 slug 后添加的源覆盖
async function readLocalRegistryPacks() {
  if (!localSources.length) return []
  const bySlug = new Map()
  for (const src of localSources) {
    try {
      for (const p of await sourceVisiblePacks(src)) bySlug.set(p.slug, { ...p, local: true })
    } catch (e) {
      if (!isMissingErr(e)) throw e // 源目录 index.json 缺失 → 跳过该源，其它源照常合并
    }
  }
  return [...bySlug.values()]
}

// 单词释义缓存（课包slug → word → {pos, cn, phonetic}），供"释义跟课文走"
const dictCache = new Map()

// 规范化路径（parts 直接 join，避免多余处理）
function url(...parts) {
  return parts.join('/')
}

// 1. 读取总注册表：有哪些课包（线上注册表 + 全部本地源注册表合并，本地同名覆盖线上）
export async function fetchCoursePackRegistry() {
  const remote = await loadJson(['index.json'], true) // 线上注册表强制走线上
  const localPacks = await readLocalRegistryPacks()
  const remotePacks = (remote && remote.packs) || []
  if (!localPacks.length) return { ...(remote || {}), packs: remotePacks }
  const bySlug = new Map(remotePacks.map(p => [p.slug, p]))
  for (const lp of localPacks) bySlug.set(lp.slug, lp) // 本地覆盖同名
  return { ...(remote || {}), version: (remote && remote.version) || 1, packs: [...bySlug.values()] }
}

// 1b. 仅本地源注册表汇总（无本地源时返回 { packs: [] }；供 UI 单独感知本地包）
export async function fetchLocalCoursePackRegistry() {
  return { packs: await readLocalRegistryPacks() }
}

// 2. 读取单个课包：元信息 + 课程清单（本地优先，本地缺失自动回退线上）
export async function fetchCoursePack(slug) {
  return loadJson([slug, 'index.json'])
}

// 3. 读取单课全量数据（course + sentences + statements，本地优先回退线上）
export async function fetchCourseData(slug, file) {
  return loadJson([slug, file])
}

// 当前是否挂有任何本地课包源
export function hasLocalPackDir() {
  return localSources.length > 0
}

// —— 本地源注册（picker / 测试共用） ——
// 把已持有的目录句柄追加为一个本地源。kind: 'registry'（注册表根）| 'single'（单课包目录）。
// 真实浏览器句柄间用 isSameEntry 去重：同一目录重复选择 → 若之前有被移除的课包则恢复显示。
async function registerLocalPackSource(dir, kind) {
  const name = (dir && dir.name) || '本地课包'
  // 读取 index.json 探测课包元信息（single 包装虚拟根需要）
  let indexObj = null
  try {
    const fh = await dir.getFileHandle('index.json')
    indexObj = JSON.parse(await (await fh.getFile()).text())
  } catch { indexObj = null }

  // 真实句柄去重
  if (dir && dir.isSameEntry) {
    for (const s of localSources) {
      if (!s.real || !s.real.isSameEntry) continue
      try {
        if (await dir.isSameEntry(s.real)) {
          if (s.removed.size) {
            s.removed.clear()
            await persistLocalSources()
            return { ok: true, name: s.name, kind: s.kind, note: `已重新显示目录「${s.name}」中的本地课包`, packCount: 0, packs: [] }
          }
          return { ok: true, name: s.name, kind: s.kind, note: `目录「${s.name}」已在本地课包中`, packCount: 0, packs: [] }
        }
      } catch { /* 句柄比较不可用则忽略 */ }
    }
  }

  const src = {
    id: 's' + (++sourceSeq),
    name,
    kind,
    real: (dir && dir.isSameEntry) ? dir : null,
    removed: new Set(),
  }
  src.handle = kind === 'single' ? makeSingleWrap(dir, indexObj) : dir
  localSources.push(src)
  await persistLocalSources()
  const visible = await sourceVisiblePacks(src)
  return {
    ok: true, name, kind,
    note: kind === 'single' ? `已添加本地课包：${name}` : `已添加本地目录：${name}`,
    packCount: visible.length,
    packs: visible.map(p => ({ ...p, local: true })),
  }
}

/** 移除单个本地课包（逐包粒度，不提供一键全清）：
 *  单包目录源 → 整源移出；多包目录源 → 仅隐藏该课包（其余保留）；
 *  移除后任何可见课包数为 0 的空源一并清理（全部移除后自然回到纯线上）。
 *  磁盘文件不动，重新选择目录即可再加回（同目录重复选择会清掉隐藏标记恢复显示）。 */
export async function removeLocalCoursePack(slug) {
  let target = null
  for (const src of localSources) {
    try {
      if ((await sourceVisiblePacks(src)).some(p => p.slug === slug)) target = src // 后添加优先：取最后一个命中的
    } catch { /* 读不到的源跳过 */ }
  }
  if (!target) return { ok: false }
  if (target.kind === 'single') {
    localSources = localSources.filter(s => s !== target)
  } else {
    target.removed.add(slug)
  }
  // 清理空源：single 源移除即空；registry 源被逐个移除到 0 个可见课包也清理
  for (let i = localSources.length - 1; i >= 0; i--) {
    try {
      if (!(await sourceVisiblePacks(localSources[i])).length) localSources.splice(i, 1)
    } catch { /* 源已不可读：留在列表由下次读取兜底 */ }
  }
  await persistLocalSources()
  return { ok: true }
}

/** 启动时从 IndexedDB 恢复本地课包源列表：有记录且读取权限 granted 则恢复并返回 true */
export async function restoreLocalPackDir() {
  if (localSources.length) return true // 已设置，无需重复恢复
  let value
  try { value = await idbGet(LOCAL_DIR_KEY) } catch { return false }
  if (!value) return false
  const records = Array.isArray(value) ? value : [value] // 兼容旧版单记录存储
  let restoredAny = false
  for (const record of records) {
    const dir = record && record.handle
    if (!dir) continue
    // 校验句柄仍有读取权限
    try {
      if (dir.queryPermission) {
        const state = await dir.queryPermission({ mode: 'read' })
        if (state !== 'granted') continue // prompt/denied：等用户下次主动点按钮授权
      }
    } catch { continue }
    if (record.kind === 'single') {
      try {
        const indexObj = await readDirIndexJson(dir)
        const src = { id: 's' + (++sourceSeq), name: dir.name, kind: 'single', real: dir, removed: new Set(record.removed || []) }
        src.handle = makeSingleWrap(dir, indexObj)
        localSources.push(src)
        restoredAny = true
      } catch { /* 单包目录 index.json 缺失：跳过该记录 */ }
    } else {
      const src = { id: 's' + (++sourceSeq), name: dir.name || '本地课包', kind: 'registry', handle: dir, real: dir, removed: new Set(record.removed || []) }
      localSources.push(src)
      restoredAny = true
    }
  }
  return restoredAny
}

/** 当前本地源数量（供 UI 展示/调试） */
export function localSourceCount() {
  return localSources.length
}

// —— 供 UI 调用的本地目录选择入口（浏览器环境） ——
// 用户点「＋ 本地课包」→ showDirectoryPicker → 自动识别两种结构并追加为本地源（可多次）：
//   A. 注册表根：目录里直接有 index.json（含 packs[]）
//   B. 单课包子目录：目录里是课包级 index.json（含 courses[]，如 family-8000/）→ 自动包装成虚拟根
// 返回 { ok, name, note, kind, packCount, packs? }；用户取消返回 { ok:false, cancelled:true }
export async function pickLocalCoursePacksFromPicker() {
  if (!window.showDirectoryPicker) {
    return { ok: false, error: '当前浏览器不支持选择本地目录（需 Chrome/Edge，且 localhost/https）' }
  }
  let dir
  try {
    dir = await window.showDirectoryPicker({ mode: 'read' })
  } catch (e) {
    if (e && e.name === 'AbortError') return { ok: false, cancelled: true }
    return { ok: false, error: '选择目录失败：' + (e.message || e) }
  }

  // 探测目录结构
  let hasIndex = false
  let indexObj = null
  try {
    const fh = await dir.getFileHandle('index.json')
    const text = await (await fh.getFile()).text()
    indexObj = JSON.parse(text)
    hasIndex = true
  } catch { hasIndex = false }

  const isRegistryRoot = hasIndex && Array.isArray(indexObj.packs)
  const isSinglePackDir = hasIndex && indexObj && !Array.isArray(indexObj.packs) && Array.isArray(indexObj.courses)

  if (isRegistryRoot || isSinglePackDir) {
    const r = await registerLocalPackSource(dir, isRegistryRoot ? 'registry' : 'single')
    return {
      ok: true, name: r.name, note: r.note,
      kind: r.kind, packCount: r.packCount, packs: r.packs,
    }
  }
  // 结构不识别
  const hint = hasIndex
    ? 'index.json 结构不是课包注册表（应含 packs[] 或 courses[]）'
    : '目录里没有 index.json（应选择含 index.json 的 course-packs 根目录或课包子目录）'
  return { ok: false, error: '目录结构无法识别：' + hint }
}

/** 把已持有的目录句柄追加为本地课包源（picker 之外的程序化入口。
 *  典型用途：「自定义短文 → 生成课包」写盘后，把该目录直接挂载进本地源，列表立即可见）。 */
export async function addLocalPackDirSource(dir, kind = 'registry') {
  if (!dir) return { ok: false, error: '缺少目录句柄' }
  return registerLocalPackSource(dir, kind)
}

/** 测试/调试入口：直接用已持有的目录句柄追加一个本地源（与 picker 内部同一注册逻辑）。
 * dir 需具备 getFileHandle/getDirectoryHandle（真实句柄或 mock 均可）。 */
export async function addLocalPackSourceForTesting(dir, kind = 'registry') {
  if (!dir) return { ok: false, error: '缺少目录句柄' }
  return registerLocalPackSource(dir, kind)
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
  // 连字符复合词：课程数据 english 为 "hard - working"（连字符两侧带空格），
  // wordDetails 拆成 hard/working 两个词根，但整句 chinese 是复合词义（勤奋的）。
  // 归一化后把复合词作为整体加入词典，供错词本/生词本/完成态展示释义。
  // 仅单词卡（归一化后无空格）且有中文释义时加入，避免整句被误加入词典。
  const HYPHEN_NORM = /([A-Za-z0-9])\s*-\s*([A-Za-z0-9])/g
  const putHyphenated = (en, cn) => {
    const norm = String(en || '').replace(HYPHEN_NORM, '$1-$2').trim()
    if (norm && !/\s/.test(norm) && cn && !dict[norm.toLowerCase()]) {
      dict[norm.toLowerCase()] = { pos: '', cn: String(cn), ph: null }
    }
  }
  for (const s of courseData.sentences || []) {
    putHyphenated(s.english || s.content, s.chinese)
  }
  for (const st of courseData.statements || []) {
    putHyphenated(st.english || st.content, st.chinese)
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
