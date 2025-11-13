// Microsoft (微软双拼) scheme placeholder; mapping to be verified
// Microsoft (MSPY 微软双拼) mapping derived from Rime double_pinyin_mspy

export const MICROSOFT_SCHEME = {
  id: 'microsoft',
  name: '微软双拼',
  initialMap: { zh: 'V', ch: 'I', sh: 'U' },
  keyRows: [
    ['KeyQ','KeyW','KeyE','KeyR','KeyT','KeyY','KeyU','KeyI','KeyO','KeyP'],
    ['KeyA','KeyS','KeyD','KeyF','KeyG','KeyH','KeyJ','KeyK','KeyL','Semicolon'],
    ['KeyZ','KeyX','KeyC','KeyV','KeyB','KeyN','KeyM'],
  ],
  keys: [
    { code:'KeyQ', label:'Q', finals:['iu'] },
    { code:'KeyW', label:'W', finals:['ia','ua'] },
    { code:'KeyE', label:'E', finals:['e'] },
    { code:'KeyR', label:'R', finals:['er','uan'] },
    { code:'KeyT', label:'T', finals:['ue','ve'] },
    { code:'KeyY', label:'Y', finals:['uai','v'] },
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
    { code:'Semicolon', label:';', finals:['ing'] },

    { code:'KeyZ', label:'Z', finals:['ei'] },
    { code:'KeyX', label:'X', finals:['ie'] },
    { code:'KeyC', label:'C', finals:['iao'] },
    { code:'KeyV', label:'V', finals:['ui'], hint:'zh' },
    { code:'KeyB', label:'B', finals:['ou'] },
    { code:'KeyN', label:'N', finals:['in'] },
    { code:'KeyM', label:'M', finals:['ian'] },
  ],
}
