// 内置英文短文（分级双语对照：英文句 + 中文翻译）
// 用于英文模式「短文」内容：整句流式练习，句子上方显示中文翻译
// 单词提取规则：练习时自动解析（字母序列，含撇号），无需手工维护 words
export const EN_STORIES = [
  {
    id: 'farm',
    grade: 'g4',
    title: 'My Day at the Farm',
    titleCn: '农场的一天',
    sentences: [
      { en: "It's sunny and warm today.", cn: '今天天气晴朗又暖和。' },
      { en: "My family and I go to Uncle Tom's farm.", cn: '我和家人一起去汤姆叔叔的农场。' },
      { en: 'We get up at 6:30 and have breakfast at 7:00.', cn: '我们 6:30 起床，7:00 吃早餐。' },
      { en: 'We go to the farm by car at 7:30.', cn: '我们 7:30 坐车去农场。' },
      { en: 'There are many animals on the farm.', cn: '农场里有很多动物。' },
      { en: 'Look! There are ten cows, twelve sheep and some hens.', cn: '看！有十头奶牛、十二只绵羊和一些母鸡。' },
      { en: 'The horses are strong.', cn: '马很强壮。' },
      { en: 'I like the little lambs very much.', cn: '我非常喜欢小羊羔。' },
      { en: "At 12:00, it's time for lunch.", cn: '12:00 是吃午饭的时间了。' },
      { en: 'We have beef, tomatoes, carrots and noodles.', cn: '我们吃了牛肉、西红柿、胡萝卜和面条。' },
      { en: 'They are yummy!', cn: '真好吃！' },
      { en: 'In the afternoon, we go to the vegetable garden.', cn: '下午我们去了菜园。' },
      { en: 'We pick some tomatoes and carrots.', cn: '我们摘了一些西红柿和胡萝卜。' },
      { en: 'We go home at 4:30.', cn: '我们 4:30 回家。' },
      { en: 'What a happy day!', cn: '多么开心的一天啊！' },
    ],
  },
]
