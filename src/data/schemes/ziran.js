// Ziranma (自然双拼) scheme placeholder; mapping to be verified
// Ziranma (自然双拼) scheme mapping derived from Rime double_pinyin (自然碼雙拼)

export const ZIRAN_SCHEME = {
  id: 'ziran',
  name: '自然双拼',
  initialMap: { zh: 'V', ch: 'I', sh: 'U' },
  keyRows: [
    ['KeyQ','KeyW','KeyE','KeyR','KeyT','KeyY','KeyU','KeyI','KeyO','KeyP'],
    ['KeyA','KeyS','KeyD','KeyF','KeyG','KeyH','KeyJ','KeyK','KeyL'],
    ['KeyZ','KeyX','KeyC','KeyV','KeyB','KeyN','KeyM'],
  ],
  keys: [
    { code:'KeyQ', label:'Q', finals:['iu'] },
    { code:'KeyW', label:'W', finals:['ia','ua'] },
    { code:'KeyE', label:'E', finals:['e'] },
    { code:'KeyR', label:'R', finals:['uan'] },
    { code:'KeyT', label:'T', finals:['ue','ve'] },
    { code:'KeyY', label:'Y', finals:['ing','uai'] },
    { code:'KeyU', label:'U', finals:['u'], hint:'sh' },
    { code:'KeyI', label:'I', finals:['i'], hint:'ch' },
    { code:'KeyO', label:'O', finals:['uo','o'] },
    { code:'KeyP', label:'P', finals:['un'] },

    { code:'KeyA', label:'A', finals:['a'] },
    { code:'KeyS', label:'S', finals:['iong','ong'] },
    { code:'KeyD', label:'D', finals:['iang','uang'] },
    { code:'KeyF', label:'F', finals:['en'] },
    { code:'KeyG', label:'G', finals:['eng'] },
    { code:'KeyH', label:'H', finals:['ang'] },
    { code:'KeyJ', label:'J', finals:['an'] },
    { code:'KeyK', label:'K', finals:['ao'] },
    { code:'KeyL', label:'L', finals:['ai'] },

    { code:'KeyZ', label:'Z', finals:['ei'] },
    { code:'KeyX', label:'X', finals:['ie'] },
    { code:'KeyC', label:'C', finals:['iao'] },
    { code:'KeyV', label:'V', finals:['ui'], hint:'zh' },
    { code:'KeyB', label:'B', finals:['ou'] },
    { code:'KeyN', label:'N', finals:['in'] },
    { code:'KeyM', label:'M', finals:['ian'] },
  ],
}
