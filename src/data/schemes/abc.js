// Zhineng ABC (智能ABC双拼) scheme placeholder; mapping to be verified
// Zhineng ABC (智能ABC) mapping derived from Rime double_pinyin_abc

export const ABC_SCHEME = {
  id: 'abc',
  name: '智能ABC',
  initialMap: { zh: 'A', ch: 'E', sh: 'V' },
  keyRows: [
    ['KeyQ','KeyW','KeyE','KeyR','KeyT','KeyY','KeyU','KeyI','KeyO','KeyP'],
    ['KeyA','KeyS','KeyD','KeyF','KeyG','KeyH','KeyJ','KeyK','KeyL'],
    ['KeyZ','KeyX','KeyC','KeyV','KeyB','KeyN','KeyM'],
  ],
  keys: [
    { code:'KeyQ', label:'Q', finals:['ei'] },
    { code:'KeyW', label:'W', finals:['ian'] },
    { code:'KeyE', label:'E', finals:['e'] },
    { code:'KeyR', label:'R', finals:['er','iu'] },
    { code:'KeyT', label:'T', finals:['iang','uang'] },
    { code:'KeyY', label:'Y', finals:['ing'] },
    { code:'KeyU', label:'U', finals:['u'] },
    { code:'KeyI', label:'I', finals:['i'] },
    { code:'KeyO', label:'O', finals:['uo','o'] },
    { code:'KeyP', label:'P', finals:['uan'] },

    { code:'KeyA', label:'A', finals:['a'] },
    { code:'KeyS', label:'S', finals:['iong','ong'] },
    { code:'KeyD', label:'D', finals:['ia','ua'] },
    { code:'KeyF', label:'F', finals:['en'] },
    { code:'KeyG', label:'G', finals:['eng'] },
    { code:'KeyH', label:'H', finals:['ang'] },
    { code:'KeyJ', label:'J', finals:['an'] },
    { code:'KeyK', label:'K', finals:['ao'] },
    { code:'KeyL', label:'L', finals:['ai'] },

    { code:'KeyZ', label:'Z', finals:['iao'] },
    { code:'KeyX', label:'X', finals:['ve','ue','ui'] },
    { code:'KeyC', label:'C', finals:['in','uai'] },
    { code:'KeyV', label:'V', finals:[], hint:'sh' },
    { code:'KeyB', label:'B', finals:['ou'] },
    { code:'KeyN', label:'N', finals:['un'] },
    { code:'KeyM', label:'M', finals:['ie'] },
  ],
}
