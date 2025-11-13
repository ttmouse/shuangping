// Xiaohe Shuangpin scheme definition

export const XIAOHE_SCHEME = {
  id: 'xiaohe',
  name: '小鹤双拼',
  // map of special multi-letter initials to key label
  initialMap: { zh: 'V', ch: 'I', sh: 'U' },
  keyRows: [
    ['KeyQ','KeyW','KeyE','KeyR','KeyT','KeyY','KeyU','KeyI','KeyO','KeyP'],
    ['KeyA','KeyS','KeyD','KeyF','KeyG','KeyH','KeyJ','KeyK','KeyL'],
    ['KeyZ','KeyX','KeyC','KeyV','KeyB','KeyN','KeyM'],
  ],
  keys: [
    { code:'KeyQ', label:'Q', finals:['iu'], mnemonics:['秋'] },
    { code:'KeyW', label:'W', finals:['ei'], mnemonics:['闱'] },
    { code:'KeyE', label:'E', finals:['e'], mnemonics:['额'] },
    { code:'KeyR', label:'R', finals:['uan'], mnemonics:['软'] },
    { code:'KeyT', label:'T', finals:['ue','ve'], mnemonics:['月'] },
    { code:'KeyY', label:'Y', finals:['un'], mnemonics:['云'] },
    { code:'KeyU', label:'U', finals:['u'], hint:'sh', mnemonics:['梳'] },
    { code:'KeyI', label:'I', finals:['i'], hint:'ch', mnemonics:['翅'] },
    { code:'KeyO', label:'O', finals:['o','uo'], mnemonics:['哦'] },
    { code:'KeyP', label:'P', finals:['ie'], mnemonics:['些'] },

    { code:'KeyA', label:'A', finals:['a'], mnemonics:['啊'] },
    { code:'KeyS', label:'S', finals:['iong','ong'], mnemonics:['松'] },
    { code:'KeyD', label:'D', finals:['ai'], mnemonics:['黛'] },
    { code:'KeyF', label:'F', finals:['en'], mnemonics:['粉'] },
    { code:'KeyG', label:'G', finals:['eng'], mnemonics:['更'] },
    { code:'KeyH', label:'H', finals:['ang'], mnemonics:['航'] },
    { code:'KeyJ', label:'J', finals:['an'], mnemonics:['安'] },
    { code:'KeyK', label:'K', finals:['ing','uai'], mnemonics:['快'] },
    { code:'KeyL', label:'L', finals:['iang','uang'], mnemonics:['两'] },

    { code:'KeyZ', label:'Z', finals:['ou'], mnemonics:['奏'] },
    { code:'KeyX', label:'X', finals:['ia','ua'], mnemonics:['夏'] },
    { code:'KeyC', label:'C', finals:['ao'], mnemonics:['草'] },
    { code:'KeyV', label:'V', finals:['ui','v'], hint:'zh', mnemonics:['追'] },
    { code:'KeyB', label:'B', finals:['in'], mnemonics:['滨'] },
    { code:'KeyN', label:'N', finals:['iao'], mnemonics:['鸟'] },
    { code:'KeyM', label:'M', finals:['ian'], mnemonics:['眠'] },
  ],
}

