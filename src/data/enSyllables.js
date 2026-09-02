// 英文单词音节拆分表（按自然拼读规则划分）
// 用于英文练习模式：用不同色相区分音节，帮助玩家理解发音结构
// 格式：{ word: ['syl1', 'syl2', 'syl3'] }，各段拼接 = 原词

// 核心规则参考：
// 1. VCCV（元音-辅音-辅音-元音）：在两个辅音之间分 → but·ter, an·i·mal
// 2. VCV（元音-辅音-元音）：辅音归属后一个音节（长元音）→ mu·sic
//    或辅音归属前一个音节（短元音）→ an·i·mal, nev·er
// 3. 复合词：按词边界分 → sun·set, bed·room
// 4. -le 结尾：辅音+le 成音节 → ta·ble, peo·ple
// 5. 常见前缀/后缀独立成音节 → re·do, quick·ly, hope·ful

export const EN_SYLLABLES = {
  // ===== 基础高频 =====
  the: ['the'],
  be: ['be'],
  to: ['to'],
  of: ['of'],
  and: ['and'],
  a: ['a'],
  in: ['in'],
  that: ['that'],
  have: ['have'],
  i: ['i'],
  it: ['it'],
  for: ['for'],
  not: ['not'],
  on: ['on'],
  with: ['with'],
  he: ['he'],
  as: ['as'],
  you: ['you'],
  do: ['do'],
  at: ['at'],
  this: ['this'],
  but: ['but'],
  his: ['his'],
  by: ['by'],
  from: ['from'],
  they: ['they'],
  we: ['we'],
  say: ['say'],
  her: ['her'],
  she: ['she'],
  or: ['or'],
  an: ['an'],
  will: ['will'],
  my: ['my'],
  one: ['one'],
  all: ['all'],
  would: ['would'],
  there: ['there'],
  their: ['their'],
  what: ['what'],
  so: ['so'],
  up: ['up'],
  out: ['out'],
  if: ['if'],
  about: ['a', 'bout'],
  who: ['who'],
  get: ['get'],
  which: ['which'],
  go: ['go'],
  me: ['me'],
  when: ['when'],
  make: ['make'],
  can: ['can'],
  like: ['like'],
  time: ['time'],
  no: ['no'],
  just: ['just'],
  him: ['him'],
  know: ['know'],
  take: ['take'],
  people: ['peo', 'ple'],
  into: ['in', 'to'],
  year: ['year'],
  your: ['your'],
  good: ['good'],
  some: ['some'],
  could: ['could'],
  them: ['them'],
  see: ['see'],
  other: ['oth', 'er'],
  than: ['than'],
  then: ['then'],
  now: ['now'],
  look: ['look'],
  only: ['on', 'ly'],
  come: ['come'],
  its: ['its'],
  over: ['o', 'ver'],
  think: ['think'],
  also: ['al', 'so'],
  back: ['back'],
  after: ['aft', 'er'],
  use: ['use'],
  two: ['two'],
  how: ['how'],
  our: ['our'],
  work: ['work'],
  first: ['first'],
  well: ['well'],
  way: ['way'],
  even: ['e', 'ven'],
  new: ['new'],
  want: ['want'],
  because: ['be', 'cause'],
  any: ['a', 'ny'],
  these: ['these'],
  give: ['give'],
  day: ['day'],
  most: ['most'],
  us: ['us'],

  // ===== 常用词 =====
  apple: ['ap', 'ple'],
  water: ['wa', 'ter'],
  light: ['light'],
  house: ['house'],
  world: ['world'],
  school: ['school'],
  friend: ['friend'],
  family: ['fam', 'i', 'ly'],
  mother: ['moth', 'er'],
  father: ['fa', 'ther'],
  computer: ['com', 'pu', 'ter'],
  keyboard: ['key', 'board'],
  practice: ['prac', 'tice'],
  language: ['lan', 'guage'],
  english: ['eng', 'lish'],
  chinese: ['chi', 'nese'],
  number: ['num', 'ber'],
  letter: ['let', 'ter'],
  window: ['win', 'dow'],
  paper: ['pa', 'per'],
  morning: ['morn', 'ing'],
  evening: ['eve', 'ning'],
  night: ['night'],
  today: ['to', 'day'],
  tomorrow: ['to', 'mor', 'row'],
  yesterday: ['yes', 'ter', 'day'],
  butter: ['but', 'ter'],
  middle: ['mid', 'dle'],
  simple: ['sim', 'ple'],
  little: ['lit', 'tle'],
  battle: ['bat', 'tle'],
  couple: ['cou', 'ple'],
  double: ['dou', 'ble'],
  trouble: ['trou', 'ble'],
  humble: ['hum', 'ble'],
  captain: ['cap', 'tain'],
  certain: ['cer', 'tain'],
  complete: ['com', 'plete'],
  sheep: ['sheep'],
  beautiful: ['beau', 'ti', 'ful'],
  important: ['im', 'por', 'tant'],
  different: ['dif', 'fer', 'ent'],
  experience: ['ex', 'pe', 'ri', 'ence'],
  knowledge: ['know', 'ledge'],
  technology: ['tech', 'nol', 'o', 'gy'],
  together: ['to', 'geth', 'er'],
  another: ['a', 'noth', 'er'],
  between: ['be', 'tween'],
  through: ['through'],
  country: ['coun', 'try'],
  should: ['should'],
  always: ['al', 'ways'],
  around: ['a', 'round'],
  before: ['be', 'fore'],
  behind: ['be', 'hind'],
  believe: ['be', 'lieve'],
  better: ['bet', 'ter'],
  beyond: ['be', 'yond'],
  change: ['change'],
  child: ['child'],
  children: ['chil', 'dren'],

  // ===== 词根分段表已有词（同步 wordSegments） =====
  classroom: ['class', 'room'],
  playground: ['play', 'ground'],
  blackboard: ['black', 'board'],
  schoolbag: ['school', 'bag'],
  notebook: ['note', 'book'],
  bedroom: ['bed', 'room'],
  bathroom: ['bath', 'room'],
  livingroom: ['liv', 'ing', 'room'],
  library: ['li', 'brar', 'y'],
  chicken: ['chick', 'en'],
  teacher: ['teach', 'er'],
  student: ['stu', 'dent'],
  sunny: ['sun', 'ny'],
  rainy: ['rain', 'y'],
  cloudy: ['cloud', 'y'],
  windy: ['wind', 'y'],
  snowy: ['snow', 'y'],
  noodles: ['noo', 'dles'],
  vegetables: ['veg', 'e', 'ta', 'bles'],
  shoes: ['shoes'],
  socks: ['socks'],
  parents: ['par', 'ents'],
  breakfast: ['break', 'fast'],
  afternoon: ['aft', 'er', 'noon'],
  dinner: ['din', 'ner'],
  animal: ['an', 'i', 'mal'],
  animals: ['an', 'i', 'mals'],
  music: ['mu', 'sic'],
  picture: ['pic', 'ture'],
  rabbit: ['rab', 'bit'],
  monkey: ['mon', 'key'],
  panda: ['pan', 'da'],
  tiger: ['ti', 'ger'],
  elephant: ['el', 'e', 'phant'],
  orange: ['or', 'ange'],
  banana: ['ba', 'na', 'na'],
  grape: ['grape'],
  pencil: ['pen', 'cil'],
  ruler: ['ru', 'ler'],
  eraser: ['e', 'ra', 'ser'],
  marker: ['mark', 'er'],
  summer: ['sum', 'mer'],
  winter: ['win', 'ter'],
  spring: ['spring'],
  autumn: ['au', 'tumn'],
  season: ['sea', 'son'],
  weather: ['weath', 'er'],
  happy: ['hap', 'py'],
  sorry: ['sor', 'ry'],
  angry: ['an', 'gry'],
  hungry: ['hun', 'gry'],
  thirsty: ['thirs', 'ty'],
  tired: ['tired'],
  sleepy: ['sleep', 'y'],
  clever: ['clev', 'er'],
  pretty: ['pret', 'ty'],
  funny: ['fun', 'ny'],
  dirty: ['dirt', 'y'],
  kitchen: ['kitch', 'en'],
  garden: ['gar', 'den'],
  village: ['vil', 'lage'],
  bridge: ['bridge'],
  forest: ['for', 'est'],
  mountain: ['moun', 'tain'],
  river: ['riv', 'er'],
  lake: ['lake'],
  island: ['is', 'land'],
  building: ['build', 'ing'],
  supermarket: ['su', 'per', 'mar', 'ket'],
  hospital: ['hos', 'pi', 'tal'],
  restaurant: ['res', 'tau', 'rant'],
  bookstore: ['book', 'store'],
  policeman: ['po', 'lice', 'man'],
  doctor: ['doc', 'tor'],
  driver: ['driv', 'er'],
  farmer: ['farm', 'er'],
  singer: ['sing', 'er'],
  writer: ['writ', 'er'],
  dancer: ['danc', 'er'],
  player: ['play', 'er'],
  worker: ['work', 'er'],
  helper: ['help', 'er'],
  painter: ['paint', 'er'],
  cleaner: ['clean', 'er'],
  runner: ['run', 'ner'],
  swimmer: ['swim', 'mer'],
  reader: ['read', 'er'],
  speaker: ['speak', 'er'],
  listener: ['lis', 'ten', 'er'],
  beginner: ['be', 'gin', 'ner'],

  // ===== 常见派生词 =====
  quickly: ['quick', 'ly'],
  slowly: ['slow', 'ly'],
  carefully: ['care', 'ful', 'ly'],
  helpful: ['help', 'ful'],
  hopeful: ['hope', 'ful'],
  colorful: ['col', 'or', 'ful'],
  powerful: ['pow', 'er', 'ful'],
  useful: ['use', 'ful'],
  careful: ['care', 'ful'],
  thankful: ['thank', 'ful'],
  playful: ['play', 'ful'],
  peaceful: ['peace', 'ful'],
  painful: ['pain', 'ful'],
  joyful: ['joy', 'ful'],
  sadly: ['sad', 'ly'],
  happily: ['hap', 'pi', 'ly'],
  friendly: ['friend', 'ly'],
  lovely: ['love', 'ly'],
  lonely: ['lone', 'ly'],
  monthly: ['month', 'ly'],
  weekly: ['week', 'ly'],
  daily: ['dai', 'ly'],
  // re- 前缀
  redo: ['re', 'do'],
  replay: ['re', 'play'],
  restart: ['re', 'start'],
  return: ['re', 'turn'],
  repeat: ['re', 'peat'],
  review: ['re', 'view'],
  rewrite: ['re', 'write'],
  // un- 前缀
  unhappy: ['un', 'hap', 'py'],
  unable: ['un', 'a', 'ble'],
  unsafe: ['un', 'safe'],
  unclear: ['un', 'clear'],
  unclean: ['un', 'clean'],
  // -ing 结尾
  playing: ['play', 'ing'],
  reading: ['read', 'ing'],
  writing: ['writ', 'ing'],
  running: ['run', 'ning'],
  swimming: ['swim', 'ming'],
  singing: ['sing', 'ing'],
  dancing: ['danc', 'ing'],
  eating: ['eat', 'ing'],
  sleeping: ['sleep', 'ing'],
  walking: ['walk', 'ing'],
  talking: ['talk', 'ing'],
  working: ['work', 'ing'],
  looking: ['look', 'ing'],
  going: ['go', 'ing'],
  doing: ['do', 'ing'],
  having: ['hav', 'ing'],
  making: ['mak', 'ing'],
  coming: ['com', 'ing'],
  // -ed 结尾
  played: ['played'],
  walked: ['walked'],
  worked: ['worked'],
  helped: ['helped'],
  wanted: ['want', 'ed'],
  needed: ['need', 'ed'],
  waited: ['wait', 'ed'],
  started: ['start', 'ed'],
  ended: ['end', 'ed'],
  landed: ['land', 'ed'],
  // -er/-or 结尾
  bigger: ['big', 'ger'],
  smaller: ['small', 'er'],
  taller: ['tall', 'er'],
  shorter: ['short', 'er'],
  faster: ['fast', 'er'],
  slower: ['slow', 'er'],
  higher: ['high', 'er'],
  lower: ['low', 'er'],
  older: ['old', 'er'],
  younger: ['young', 'er'],
  actor: ['ac', 'tor'],
  visitor: ['vis', 'i', 'tor'],
  // -tion/-sion 结尾
  action: ['ac', 'tion'],
  station: ['sta', 'tion'],
  question: ['ques', 'tion'],
  direction: ['di', 'rec', 'tion'],
  information: ['in', 'for', 'ma', 'tion'],
  education: ['ed', 'u', 'ca', 'tion'],
  vacation: ['va', 'ca', 'tion'],
  national: ['na', 'tion', 'al'],
  // -able 结尾
  comfortable: ['com', 'fort', 'a', 'ble'],
  reasonable: ['rea', 'son', 'a', 'ble'],
  possible: ['pos', 'si', 'ble'],
  terrible: ['ter', 'ri', 'ble'],
  vegetable: ['veg', 'e', 'ta', 'ble'],
  table: ['ta', 'ble'],
  // 复合词
  sunset: ['sun', 'set'],
  sunrise: ['sun', 'rise'],
  raincoat: ['rain', 'coat'],
  firefly: ['fire', 'fly'],
  butterfly: ['but', 'ter', 'fly'],
  cupcake: ['cup', 'cake'],
  pancake: ['pan', 'cake'],
  popcorn: ['pop', 'corn'],
  eggplant: ['egg', 'plant'],
  watermelon: ['wa', 'ter', 'mel', 'on'],
  sunflower: ['sun', 'flow', 'er'],
  snowman: ['snow', 'man'],
  homework: ['home', 'work'],
  housework: ['house', 'work'],
  bookshelf: ['book', 'shelf'],
  haircut: ['hair', 'cut'],
  toothbrush: ['tooth', 'brush'],
  toothpaste: ['tooth', 'paste'],
  football: ['foot', 'ball'],
  basketball: ['bas', 'ket', 'ball'],
  volleyball: ['vol', 'ley', 'ball'],
  baseball: ['base', 'ball'],
  birthday: ['birth', 'day'],
  weekday: ['week', 'day'],
  weekend: ['week', 'end'],
  himself: ['him', 'self'],
  herself: ['her', 'self'],
  itself: ['it', 'self'],
  myself: ['my', 'self'],
  yourself: ['your', 'self'],
  everything: ['ev', 'ery', 'thing'],
  everyone: ['ev', 'ery', 'one'],
  everywhere: ['ev', 'ery', 'where'],
  anybody: ['a', 'ny', 'bod', 'y'],
  anything: ['a', 'ny', 'thing'],
  anyway: ['a', 'ny', 'way'],
  somewhere: ['some', 'where'],
  something: ['some', 'thing'],
  someone: ['some', 'one'],
  sometimes: ['some', 'times'],
  inside: ['in', 'side'],
  outside: ['out', 'side'],
  upside: ['up', 'side'],
  downstairs: ['down', 'stairs'],
  upstairs: ['up', 'stairs'],
  understand: ['un', 'der', 'stand'],
  dangerous: ['dan', 'ger', 'ous'],
  favorite: ['fa', 'vor', 'ite'],
  excellent: ['ex', 'cel', 'lent'],
  exercise: ['ex', 'er', 'cise'],
  example: ['ex', 'am', 'ple'],
  exciting: ['ex', 'cit', 'ing'],
  expensive: ['ex', 'pen', 'sive'],
}

// 简单回退算法：基于元音组的音节划分
// 不追求完美，对于非字典词做一个合理的视觉划分即可
function simpleSyllableSplit(word) {
  if (!word || word.length <= 3) return [word]

  const vowels = new Set('aeiou')
  const parts = []
  let current = ''

  for (let i = 0; i < word.length; i++) {
    current += word[i]

    // 末尾不分
    if (i === word.length - 1) {
      parts.push(current)
      break
    }

    const ch = word[i]
    const nextCh = word[i + 1]
    const afterNext = word[i + 2] || ''
    const isVowel = vowels.has(ch)
    const isNextVowel = vowels.has(nextCh)
    const isAfterNextVowel = afterNext ? vowels.has(afterNext) : false

    // -le 结尾：辅音+le 是独立音节（如 ta·ble, mid·dle）
    if (!isVowel && !isNextVowel && nextCh === 'l' && word.slice(i + 1, i + 3) === 'le' && current.length > 1) {
      // 前一个辅音归入 -le 音节 → 当前部分（不含当前字母）作为一个音节
      const withoutLast = current.slice(0, -1)
      if (withoutLast.length > 0) parts.push(withoutLast)
      current = ch + nextCh + (word[i + 2] || '')
      i += 2 // 跳过 le，此时 i 指向 le 的最后一个字母
      // 如果跳过后已到末尾，立即推入 current
      if (i >= word.length - 1) {
        parts.push(current)
        current = ''
      }
      continue
    }

    // VCCV：元音-辅音-辅音-元音 → 在两个辅音之间分（如 but·ter, hap·pen）
    if (isVowel && !isNextVowel && afterNext && !isAfterNextVowel && current.length >= 2) {
      // 当前字母是元音，下一个是辅音，再下一个也是辅音+元音
      // 在下一个辅音之前分 → 当前部分（含当前元音+下一个辅音）作为一个音节
      // 但更合理的：在第一个辅音之后分
      // 如 butter：u(元音) t(辅音1) t(辅音2) → 在 u 后分 → bu·tter
      // 不对，应该是 but·ter
      // 实际上：在第一个辅音和前一个元音之间分，但第一个辅音归前一个音节
      // 更简单：在下一个辅音（第二个辅音）之前分
      // 如 butter：u(元音) t(辅音1) → 下一个 t(辅音2) 再下一个 e(元音)
      // 在第一个辅音后分 → 当前部分 + 第一个辅音 as a syllable
      // 但我们需要等到下一个辅音被加入
      // 简单处理：不在这里分，让下一个辅音被加入后再判断
      continue
    }

    // 元音组合（双元音/元音组合）：ee, ea, oo, ai, ay, oa, ie, ue, ui, ou, oi, oy, au, aw 等不拆分
    const vowelDigraphs = new Set(['ee', 'ea', 'oo', 'ai', 'ay', 'oa', 'ie', 'ue', 'ui', 'ou', 'oi', 'oy', 'au', 'aw'])
    if (isVowel && isNextVowel && nextCh) {
      const pair = ch + nextCh
      if (vowelDigraphs.has(pair)) {
        // 元音组合不拆分，继续累积
        current += nextCh
        i++ // 跳过下一个元音
        continue
      }
      // 非组合的双元音（hiatus）：在两个元音之间分（如 li·on, cre·ate）
      if (current.length > 1) {
        parts.push(current)
        current = ''
        continue
      }
    }
  }

  // 处理末尾 silent e：如果最后一个音节只有 'e'，合并到前一个音节
  if (parts.length > 1 && parts[parts.length - 1] === 'e') {
    const last = parts[parts.length - 2]
    if (last && last.length >= 2) {
      parts[parts.length - 2] = last + 'e'
      parts.pop()
    }
  }

  return parts.length > 0 ? parts : [word]
}

// 对外接口：先查字典，再回退到算法
export function getSyllables(word) {
  if (!word) return []
  const lower = word.toLowerCase()
  if (EN_SYLLABLES[lower]) return [...EN_SYLLABLES[lower]]
  return simpleSyllableSplit(lower)
}

// 获取单词的音节映射：{ letterIndex: syllableIndex }
export function getSyllableMap(word) {
  const syllables = getSyllables(word)
  const map = {}
  let pos = 0
  for (let si = 0; si < syllables.length; si++) {
    const syl = syllables[si]
    for (let i = 0; i < syl.length; i++) {
      map[pos + i] = si
    }
    pos += syl.length
  }
  return map
}