// 小鹤双拼键位映射（按目标站点还原）

export const keyRows = [
  ['KeyQ','KeyW','KeyE','KeyR','KeyT','KeyY','KeyU','KeyI','KeyO','KeyP'],
  ['KeyA','KeyS','KeyD','KeyF','KeyG','KeyH','KeyJ','KeyK','KeyL'],
  ['KeyZ','KeyX','KeyC','KeyV','KeyB','KeyN','KeyM'],
]

export const keys = [
  { code:'KeyQ', label:'Q', finals:['iu'], hint:'', mnemonics:['秋'] },
  { code:'KeyW', label:'W', finals:['ei'], hint:'', mnemonics:['闱'] },
  { code:'KeyE', label:'E', finals:['e'], hint:'' },
  { code:'KeyR', label:'R', finals:['uan'], hint:'', mnemonics:['软'] },
  { code:'KeyT', label:'T', finals:['ue','ve'], hint:'', mnemonics:['月'] },
  { code:'KeyY', label:'Y', finals:['un'], hint:'', mnemonics:['云'] },
  { code:'KeyU', label:'U', finals:['u'], hint:'sh', mnemonics:['梳'] },
  { code:'KeyI', label:'I', finals:['i'], hint:'ch', mnemonics:['翅'] },
  { code:'KeyO', label:'O', finals:['o','uo'], hint:'' },
  { code:'KeyP', label:'P', finals:['ie'], hint:'', mnemonics:['撇'] },

  { code:'KeyA', label:'A', finals:['a'], hint:'' },
  { code:'KeyS', label:'S', finals:['iong','ong'], hint:'', mnemonics:['松','拥'] },
  { code:'KeyD', label:'D', finals:['ai'], hint:'', mnemonics:['黛'] },
  { code:'KeyF', label:'F', finals:['en'], hint:'', mnemonics:['粉'] },
  { code:'KeyG', label:'G', finals:['eng'], hint:'', mnemonics:['更'] },
  { code:'KeyH', label:'H', finals:['ang'], hint:'', mnemonics:['航'] },
  { code:'KeyJ', label:'J', finals:['an'], hint:'', mnemonics:['安'] },
  { code:'KeyK', label:'K', finals:['ing','uai'], hint:'', mnemonics:['快','莺'] },
  { code:'KeyL', label:'L', finals:['iang','uang'], hint:'', mnemonics:['两','望'] },

  { code:'KeyZ', label:'Z', finals:['ou'], hint:'', mnemonics:['奏'] },
  { code:'KeyX', label:'X', finals:['ia','ua'], hint:'', mnemonics:['夏','蛙'] },
  { code:'KeyC', label:'C', finals:['ao'], hint:'', mnemonics:['草'] },
  { code:'KeyV', label:'V', finals:['ui','v'], hint:'zh', mnemonics:['追','鱼'] },
  { code:'KeyB', label:'B', finals:['in'], hint:'', mnemonics:['滨'] },
  { code:'KeyN', label:'N', finals:['iao'], hint:'', mnemonics:['鸟'] },
  { code:'KeyM', label:'M', finals:['ian'], hint:'', mnemonics:['眠'] },
]

export const keyByCode = new Map(keys.map(k => [k.code, k]))
export const codeToRow = (() => {
  const m = new Map()
  keyRows.forEach((row, ri) => row.forEach(code => m.set(code, ri)))
  return m
})()

// 去重后的韵母池（目标站映射合并）
export const finalsPool = Array.from(new Set(keys.flatMap(k => k.finals)))

// 韵母 -> 可按键 code 集合
export const finalToKeyCodes = (() => {
  const m = new Map()
  for (const k of keys) {
    for (const f of k.finals) {
      if (!m.has(f)) m.set(f, new Set())
      m.get(f).add(k.code)
    }
  }
  return m
})()

// 练习范围（预埋，UI 暂不展示）
export const ranges = [
  { id: 'all', name: '全键盘', keyCodes: keys.map(k => k.code) },
  { id: 'row1', name: '第一排', keyCodes: keyRows[0] },
  { id: 'row2', name: '第二排', keyCodes: keyRows[1] },
  { id: 'row3', name: '第三排', keyCodes: keyRows[2] },
]
