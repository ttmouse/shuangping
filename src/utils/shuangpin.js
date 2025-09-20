import { keys, finalToKeyCodes, keyByCode } from '../data/xiaohe.js'

const initials = ['zh','ch','sh','b','p','m','f','d','t','n','l','g','k','h','j','q','x','r','z','c','s']

function normalizeZeroInitial(syl) {
  // y- 开头
  if (syl.startsWith('y')) {
    const r = syl.slice(1)
    // 注意顺序：先匹配更长的片段，避免被前缀 i 抢走
    if (r.startsWith('iong')) return { initial: '', final: 'iong' }
    if (r.startsWith('iang')) return { initial: '', final: 'iang' }
    if (r.startsWith('ing')) return { initial: '', final: 'ing' }
    if (r.startsWith('iao')) return { initial: '', final: 'iao' }
    if (r.startsWith('ian')) return { initial: '', final: 'ian' }
    if (r.startsWith('in')) return { initial: '', final: 'in' }
    if (r.startsWith('ang')) return { initial: '', final: 'iang' }
    if (r.startsWith('ao')) return { initial: '', final: 'iao' }
    if (r.startsWith('an')) return { initial: '', final: 'ian' }
    if (r.startsWith('ou')) return { initial: '', final: 'iu' }
    if (r === 'i') return { initial: '', final: 'i' }
    if (r.startsWith('i')) return { initial: '', final: 'i' }
    if (r.startsWith('a')) return { initial: '', final: 'ia' }
    if (r.startsWith('e')) return { initial: '', final: 'ie' }
    if (r.startsWith('o')) return { initial: '', final: 'io' } // rare
    if (r.startsWith('u')) {
      // y + u 系其实来源于 ü 系：yu/ yue / yuan / yun
      if (r === 'u') return { initial: '', final: 'v' }
      if (r.startsWith('ue')) return { initial: '', final: 've' }
      if (r.startsWith('uan')) return { initial: '', final: 'uan' }
      if (r.startsWith('un')) return { initial: '', final: 'un' }
    }
    return { initial: '', final: r }
  }
  // w- 开头
  if (syl.startsWith('w')) {
    const r = syl.slice(1)
    if (r === 'u') return { initial: '', final: 'u' }
    if (r.startsWith('a')) return { initial: '', final: 'ua' }
    if (r.startsWith('o')) return { initial: '', final: 'uo' }
    if (r.startsWith('ai')) return { initial: '', final: 'uai' }
    if (r.startsWith('an')) return { initial: '', final: 'uan' }
    if (r.startsWith('ei')) return { initial: '', final: 'ui' } // wei -> ui
    if (r.startsWith('en')) return { initial: '', final: 'un' } // wen -> un
    if (r.startsWith('eng')) return { initial: '', final: 'eng' }
    if (r.startsWith('ang')) return { initial: '', final: 'uang' }
    return { initial: '', final: r }
  }
  return null
}

export function splitSyllable(py) {
  py = py.toLowerCase()
  // Handle ü -> v
  py = py.replaceAll('ü','v').replaceAll('u:','v')
  // Try zero-initial rules
  const zi = normalizeZeroInitial(py)
  if (zi) return zi
  // Match longest initial
  for (const ini of initials) {
    if (py.startsWith(ini)) {
      let rest = py.slice(ini.length)
      // contractions
      if (rest === 'uei') rest = 'ui'
      if (rest === 'iou') rest = 'iu'
      if (rest === 'uen') rest = 'un'
      return { initial: ini, final: rest }
    }
  }
  // No initial
  return { initial: '', final: py }
}

export function initialToKeyLetter(initial) {
  if (!initial) return ''
  if (initial === 'zh') return 'V'
  if (initial === 'ch') return 'I'
  if (initial === 'sh') return 'U'
  return initial[0].toUpperCase()
}

export function finalToKeyLetter(final) {
  const codes = finalToKeyCodes.get(final)
  if (!codes) return ''
  const code = Array.from(codes)[0]
  return keyByCode.get(code)?.label || ''
}

export function syllableToKeyCodes(py) {
  const { initial, final } = splitSyllable(py)
  const seq = []
  const iLetter = initialToKeyLetter(initial)
  const fLetter = finalToKeyLetter(final)
  if (iLetter) seq.push('Key' + iLetter)
  if (fLetter) seq.push('Key' + fLetter)
  return seq
}

export function pinyinToKeySequence(pinyinStr) {
  // pinyinStr like "zhong guo" (space-separated syllables, no tones)
  const syllables = pinyinStr.trim().split(/\s+/).filter(Boolean)
  return syllables.flatMap(syllableToKeyCodes)
}
