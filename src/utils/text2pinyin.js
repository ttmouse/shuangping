// Utilities to convert Chinese text to per-character pinyin using pinyin-pro
import { pinyin } from 'pinyin-pro'

const HAN_RE = /[\u4E00-\u9FFF]/

// 行首「角色名 + 冒号」前缀，如 "Monica: "、"莫妮卡："
// 英文名：字母开头，可含空格/点/连字符/撇号；中文名：1-8 个汉字
const DIALOG_PREFIX_RE = /^(?:[A-Za-z][A-Za-z0-9 .'_-]{0,29}|[\u4E00-\u9FFF]{1,8})\s*[:：]\s*/

// 剥离每行行首的角色名与冒号，仅用于练习内容，不影响原文
// 例："莫妮卡：没什么好说的！" → "没什么好说的！"
// 例："Monica: There's nothing to tell!" → "There's nothing to tell!"
export function stripDialogPrefix(text = '') {
  return String(text).split(/\r?\n/).map(line => line.replace(DIALOG_PREFIX_RE, '')).join('\n')
}

export function extractChinese(text = '') {
  const out = []
  // 逐行剥离「角色名：」前缀，避免把对话台词里的人名/冒号混入练习
  for (const line of String(text).split(/\r?\n/)) {
    const cleaned = line.replace(DIALOG_PREFIX_RE, '')
    for (const ch of Array.from(cleaned)) {
      if (HAN_RE.test(ch)) out.push(ch)
    }
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

