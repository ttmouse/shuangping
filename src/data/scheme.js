// Active scheme accessors and helpers (reactive-friendly)
import { computed } from 'vue'
import { useSettingsStore } from '../stores/settings.js'
import { XIAOHE_SCHEME } from './schemes/xiaohe.js'
import { ZIRAN_SCHEME } from './schemes/ziran.js'
import { SOGOU_SCHEME } from './schemes/sogou.js'
import { MICROSOFT_SCHEME } from './schemes/microsoft.js'
import { ABC_SCHEME } from './schemes/abc.js'
import { JIAJIA_SCHEME } from './schemes/jiajia.js'
import { ZIGUANG_SCHEME } from './schemes/ziguang.js'
import { GUOJI_SCHEME } from './schemes/guoji.js'

// Registry: add more schemes here when available
export const SCHEMES = [
  XIAOHE_SCHEME,
  ZIRAN_SCHEME,
  SOGOU_SCHEME,
  MICROSOFT_SCHEME,
  ABC_SCHEME,
  JIAJIA_SCHEME,
  ZIGUANG_SCHEME,
  GUOJI_SCHEME,
]

const byId = new Map(SCHEMES.map(s => [s.id, s]))

export function getSchemeById(id) {
  const base = byId.get(id) || XIAOHE_SCHEME
  const settings = useSettingsStore()
  const ov = (settings.schemeOverrides || {})[id]
  if (!ov) return base
  const merged = { ...base }
  if (ov.initialMap) merged.initialMap = { ...(base.initialMap || {}), ...ov.initialMap }
  if (Array.isArray(ov.keys) && ov.keys.length) {
    // Preserve labels and hints if not provided
    const labelByCode = new Map((base.keys || []).map(k => [k.code, k.label]))
    const hintByCode = new Map((base.keys || []).map(k => [k.code, k.hint]))
    merged.keys = ov.keys.map(k => ({
      code: k.code,
      label: k.label || labelByCode.get(k.code) || (k.code||'').replace('Key',''),
      finals: Array.isArray(k.finals) ? k.finals : [],
      hint: k.hint ?? hintByCode.get(k.code) ?? ''
    }))
  }
  return merged
}

export function listSchemes() {
  return SCHEMES.map(s => ({ id: s.id, name: s.name }))
}

function buildMapsFor(scheme) {
  const keyByCode = new Map(scheme.keys.map(k => [k.code, k]))
  const finalsPool = Array.from(new Set(scheme.keys.flatMap(k => k.finals)))
  const finalToKeyCodes = (() => {
    const m = new Map()
    for (const k of scheme.keys) {
      for (const f of k.finals) {
        if (!m.has(f)) m.set(f, new Set())
        m.get(f).add(k.code)
      }
    }
    return m
  })()
  const ranges = [
    { id: 'all', name: '全键盘', keyCodes: scheme.keys.map(k => k.code) },
    { id: 'row1', name: '第一排', keyCodes: scheme.keyRows[0] },
    { id: 'row2', name: '第二排', keyCodes: scheme.keyRows[1] },
    { id: 'row3', name: '第三排', keyCodes: scheme.keyRows[2] },
  ]
  return { keyByCode, finalsPool, finalToKeyCodes, ranges }
}

// Non-reactive accessor (call inside functions, not at module top level)
export function getActiveSchemeData() {
  const settings = useSettingsStore()
  const scheme = getSchemeById(settings.schemeId || 'xiaohe')
  const maps = buildMapsFor(scheme)
  return { scheme, ...maps }
}

// Composition helper for components to track scheme changes reactively
export function useActiveScheme() {
  const settings = useSettingsStore()
  const scheme = computed(() => getSchemeById(settings.schemeId || 'xiaohe'))
  const maps = computed(() => buildMapsFor(scheme.value))
  const keyRows = computed(() => scheme.value.keyRows)
  const keyByCode = computed(() => maps.value.keyByCode)
  const finalToKeyCodes = computed(() => maps.value.finalToKeyCodes)
  const finalsPool = computed(() => maps.value.finalsPool)
  const ranges = computed(() => maps.value.ranges)
  const initialMap = computed(() => scheme.value.initialMap || {})
  return { scheme, keyRows, keyByCode, finalToKeyCodes, finalsPool, ranges, initialMap }
}
