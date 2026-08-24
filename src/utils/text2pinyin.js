// Utilities to convert Chinese text to per-character pinyin using pinyin-pro
import { pinyin } from 'pinyin-pro'

const HAN_RE = /[\u4E00-\u9FFF]/

export function extractChinese(text = '') {
  const out = []
  for (const ch of Array.from(text)) {
    if (HAN_RE.test(ch)) out.push(ch)
  }
  return out
}

export function toPinyinArray(chineseChars = []) {
  // Convert each Chinese char to a no-tone pinyin syllable
  // Use per-char conversion to ensure 1:1 mapping without relying on segmentation
  const opts = { toneType: 'none' }
  const res = []
  for (const ch of chineseChars) {
    const py = (pinyin(ch, opts) || '').trim()
    // Normalize ü and other variants to 'v' for downstream shuangpin mapping
    const norm = py.replaceAll('ü','v').replaceAll('u:','v')
    res.push(norm)
  }
  return res
}

export function toWordSyllables(text = '') {
  // 整词转换：利用 pinyin-pro 词典正确处理多音字（如 银行→yin hang），返回逐字无声调音节数组
  const opts = { toneType: 'none', type: 'array' }
  const arr = pinyin(text, opts) || []
  return arr.map(s => (s || '').replaceAll('ü','v').replaceAll('u:','v').replace(/[^a-z]/g, ''))
}

