// Pinyin Jiajia (拼音加加双拼) scheme placeholder; mapping to be verified
// Pinyin Jiajia (拼音加加) mapping derived from Rime double_pinyin_pyjj

export const JIAJIA_SCHEME = {
  id: 'jiajia',
  name: '拼音加加',
  initialMap: { zh: 'V', ch: 'U', sh: 'I' },
  keyRows: [
    ['KeyQ','KeyW','KeyE','KeyR','KeyT','KeyY','KeyU','KeyI','KeyO','KeyP'],
    ['KeyA','KeyS','KeyD','KeyF','KeyG','KeyH','KeyJ','KeyK','KeyL'],
    ['KeyZ','KeyX','KeyC','KeyV','KeyB','KeyN','KeyM'],
  ],
  keys: [
    { code:'KeyQ', label:'Q', finals:['er','ing'] },
    { code:'KeyW', label:'W', finals:['ei'] },
    { code:'KeyE', label:'E', finals:['e'] },
    { code:'KeyR', label:'R', finals:['en'] },
    { code:'KeyT', label:'T', finals:['eng'] },
    { code:'KeyY', label:'Y', finals:['iong','ong'] },
    { code:'KeyU', label:'U', finals:[], hint:'ch' },
    { code:'KeyI', label:'I', finals:[], hint:'sh' },
    { code:'KeyO', label:'O', finals:['uo','o'] },
    { code:'KeyP', label:'P', finals:['ou'] },

    { code:'KeyA', label:'A', finals:['a'] },
    { code:'KeyS', label:'S', finals:['ai'] },
    { code:'KeyD', label:'D', finals:['ao'] },
    { code:'KeyF', label:'F', finals:['an'] },
    { code:'KeyG', label:'G', finals:['ang'] },
    { code:'KeyH', label:'H', finals:['iang','uang'] },
    { code:'KeyJ', label:'J', finals:['ian'] },
    { code:'KeyK', label:'K', finals:['iao'] },
    { code:'KeyL', label:'L', finals:['in'] },

    { code:'KeyZ', label:'Z', finals:['un'] },
    { code:'KeyX', label:'X', finals:['ve','ue','uai'] },
    { code:'KeyC', label:'C', finals:['uan'] },
    { code:'KeyV', label:'V', finals:['ui','v'], hint:'zh' },
    { code:'KeyB', label:'B', finals:['ia','ua'] },
    { code:'KeyN', label:'N', finals:['iu'] },
    { code:'KeyM', label:'M', finals:['ie'] },
  ],
}
