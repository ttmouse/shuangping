// Download finals audio into public/finals
// Usage: node scripts/fetch-finals.js
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { finalsPool } from '../src/data/xiaohe.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const outDir = path.resolve(__dirname, '../public/finals')

/** Candidate URL patterns to try for each final */
function candidateUrls(final) {
  const f = String(final).toLowerCase()
  const list = [
    // New candidate domain provided by user
    `http://du.hanyupinyin.cn/du/pinyin/${f}.mp3`,
    // Known site (may block direct access). Adjust if you have a mirror.
    `https://yunmu.hanyupinyin.cn/audio/${f}.mp3`,
    `https://yunmu.hanyupinyin.cn/sounds/${f}.mp3`,
    `https://yunmu.hanyupinyin.cn/static/audio/${f}.mp3`,
  ]
  if (f === 'er') {
    // Also try numbered tone files for er
    list.unshift(
      'http://du.hanyupinyin.cn/du/pinyin/er1.mp3',
      'http://du.hanyupinyin.cn/du/pinyin/er2.mp3',
      'http://du.hanyupinyin.cn/du/pinyin/er3.mp3',
      'http://du.hanyupinyin.cn/du/pinyin/er4.mp3',
    )
  }
  return list
}

async function fetchToFile(url, filePath) {
  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const buf = Buffer.from(await res.arrayBuffer())
  await fs.promises.writeFile(filePath, buf)
}

async function ensureDir(p) { await fs.promises.mkdir(p, { recursive: true }) }

async function main() {
  await ensureDir(outDir)
  // Support CLI args to fetch a subset, e.g. `node scripts/fetch-finals.js o an ang`
  const args = process.argv.slice(2).map(s => String(s).toLowerCase()).filter(Boolean)
  const finals = (args.length ? args : Array.from(new Set(finalsPool))).sort()
  let ok = 0, fail = 0
  for (const f of finals) {
    const file = path.join(outDir, `${f}.mp3`)
    if (fs.existsSync(file)) { console.log(`[skip] ${f}`); ok++; continue }
    const urls = candidateUrls(f)
    let saved = false
    for (const u of urls) {
      try { await fetchToFile(u, file); console.log(`[ok] ${f} <- ${u}`); ok++; saved = true; break } catch { /* try next */ }
    }
    if (!saved) { console.warn(`[fail] ${f}`); fail++ }
  }
  console.log(`Done. ok=${ok}, fail=${fail}, out=${outDir}`)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
