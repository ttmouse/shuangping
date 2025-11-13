Put finals audio files (mp3) here.

File naming:
- Lowercase pinyin finals, e.g. an.mp3, ang.mp3, eng.mp3, ing.mp3, iong.mp3, uan.mp3, uang.mp3, ui.mp3, ve.mp3, v.mp3, etc.

Auto-download:
- You can try: npm run fetch:finals (attempts to fetch from yunmu.hanyupinyin.cn). Some files may fail due to network or CORS; place missing ones manually.

Runtime lookup order (see src/utils/pronounce.js):
1) /finals/<final>.mp3 (this folder)
2) /sounds/finals/<final>.mp3
Then fall back to speech synthesis if none is found.

