<template>
  <div class="app">
    <TopStatusBar :course="courseBar" :started="started" />

    <div class="pageCenter">
      <div class="tipsTextContent">
        <!-- 英文进行中：顶部显示进度/提示（替换无意义描述文案） -->
        <template v-if="isEnPractice && started">
          <div class="enProgHeader">
            <h1 class="enProgTitle">
              第
              <template v-if="enSentenceJumpOpen">
                <input
                  ref="enJumpInput"
                  class="enJumpInput"
                  type="number"
                  v-model.number="enSentenceJumpTarget"
                  min="1"
                  :max="enQueue.length"
                  @keydown.enter="jumpToSentence"
                  @blur="jumpToSentence"
                  @keydown.escape="enSentenceJumpOpen = false"
                />
              </template>
              <span v-else class="enJumpSentence" @click="openEnJumpInput">{{ sentenceIdx + 1 }}</span>
              / {{ enQueue.length }} 句
              <span v-if="wordIdx < enSentence.length">· 第 {{ wordIdx + 1 }} / {{ enSentence.length }} 词</span>
              <span v-else>· 本句完成</span>
            </h1>
            <h2 class="enProgHint">{{ enSentenceDone ? '（本句完成，按 空格/回车 进入下一句）' : (((dictWords.has(currentWord) || settings.enDisplayMode === 'dictation') && settings.enDisplayMode !== 'guide') && !enHadError ? '（默写：看中文打英文，打错会显示单词）' : '（空格/回车 进入下一词）') }}</h2>
          </div>
        </template>
        <template v-else>
          <h1>{{ activeModeLabel }}</h1>
          <h2>{{ activeModeDesc }}</h2>
        </template>
      </div>

      <!-- 课包课程：右上角模式切换 chip（句乐部样式：🔒 初级）—— 定位在页面右上角 -->
      <div v-if="mode === 'stories' && started && julebuFullQueue.length" class="enModeBox" @click.stop>
        <button
          class="enModeChip"
          :class="{ open: enModePanelOpen }"
          @click="enModePanelOpen = !enModePanelOpen"
          data-nav
          title="练习模式"
        >
          <svg class="enModeLock" viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>
          <span>{{ enDifficultyLabel }}</span>
          <svg class="enModeCaret" viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.4"><path d="m6 9 6 6 6-6"/></svg>
        </button>
        <span class="enModeSep">|</span>
        <button
          class="enModeDicChip"
          :class="{ dictation: enDictationMode }"
          @click="toggleEnDictationMode()"
          data-nav
          title="切换练习模式"
        ><svg class="enModeDicIcon" viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m5 8 6 6"/><path d="m4 14 6-6 2-3"/><path d="M2 5h12"/><path d="M7 2h1"/><path d="m22 14-2 2-2-2"/><path d="M18 8v8"/></svg><span>{{ enDictationMode ? '听写' : '中译英' }}</span></button>
        <span class="enModeSep">|</span>
        <div class="enModeDispBox">
          <button
            class="enModeDispChip"
            :class="{ open: enDispPanelOpen }"
            @click="enDispPanelOpen = !enDispPanelOpen"
            data-nav
            title="显示模式"
          >
            <svg class="enModeDispIcon" viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8z"/></svg>
            <span>{{ enDispLabel }}</span>
            <svg class="enModeDispCaret" viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2.4"><path d="m6 9 6 6 6-6"/></svg>
          </button>
          <div v-if="enDispPanelOpen" class="enModeDispPanel">
            <button
              v-for="opt in EN_DISPLAY_OPTIONS"
              :key="opt.key"
              class="enModeDispOpt"
              :class="{ active: settings.enDisplayMode === opt.key }"
              @click="settings.setEnDisplayMode(opt.key); enDispPanelOpen = false"
              data-nav
            >
              <span class="enModeDispOptLabel">{{ opt.label }}</span>
              <span class="enModeDispOptDesc">{{ opt.desc }}</span>
            </button>
          </div>
        </div>
        <span class="enModeSep">|</span>
        <span class="enModeOptChips">
          <span class="enModeOptChipWrap">
            <button
              class="enModeDicChip"
              :class="{ dictation: settings.enShowWordCn }"
              @click="settings.toggleEnShowWordCn()"
              data-nav
              title="单词上方显示中文释义"
            ><svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m5 8 6 6"/><path d="m4 14 6-6 2-3"/><path d="M2 5h12"/><path d="M7 2h1"/></svg><span>{{ settings.enShowWordCn ? '释义' : '隐藏' }}</span></button>
          </span>
          <span class="enModeSep">|</span>
          <span class="enModeOptChipWrap">
            <button
              class="enModeDicChip"
              :class="{ dictation: settings.enRedoPractice }"
              @click="settings.toggleEnRedoPractice()"
              data-nav
              title="打错的单词重新入队重练"
            ><svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 2v6h-6"/><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M3 22v-6h6"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/></svg><span>{{ settings.enRedoPractice ? '重练' : '跳过' }}</span></button>
          </span>
          <span class="enModeSep">|</span>
          <span class="enModeOptChipWrap">
            <button
              class="enModeDicChip"
              :class="{ dictation: settings.enGentleMode }"
              @click="settings.toggleEnGentleMode()"
              data-nav
              title="输入过程中不判错，整词完成后统一判断"
            ><svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22c5.5 0 10-4.5 10-10S17.5 2 12 2 2 6.5 2 12s4.5 10 10 10z"/><path d="m9 12 2 2 4-4"/></svg><span>{{ settings.enGentleMode ? '宽松' : '严格' }}</span></button>
          </span>
        </span>
        <!-- 下拉面板：档位 + 自定义类型勾选 -->
        <div v-if="enModePanelOpen" class="enModePanel">
          <button
            v-for="opt in DIFFICULTY_OPTIONS_WITH_COUNT"
            :key="opt.key"
            class="enModeDispOpt"
            :class="{ active: enDifficulty === opt.key }"
            :disabled="!opt.count"
            @click="switchEnDifficulty(opt.key)"
            data-nav
          >
            <span class="enModeDispOptRow">
              <span class="enModeDispOptLabel">{{ opt.label }}</span>
              <span class="enModeDispOptMeta">{{ opt.count }}</span>
            </span>
            <span class="enModeDispOptDesc">{{ opt.desc }}</span>
          </button>
          <div class="enModeDictateDivider"></div>
          <button
            v-for="opt in CUSTOM_TYPE_OPTIONS_FILTERED"
            :key="opt.key"
            class="enModeDispOpt"
            @click="selectCustomType(opt.key)"
            data-nav
          >
            <span class="enModeDispOptRow">
              <span class="enModeDispOptLabel">{{ opt.label }}</span>
              <span class="enModeDispOptMeta">{{ opt.count }}</span>
            </span>
          </button>
        </div>
      </div>

      <!-- 未开始且无配置区的模式：轻提示（不拦截输入，直接打字即开始） -->
      <div v-if="!started && !(mode === 'letters' || mode === 'cards' || isEnPractice)" class="startHint">
        <p>直接开始打字练习</p>
      </div>

      <!-- 练习主体（卡片/字母/英文模式未开始时也显示，便于切换内容） -->
      <div v-if="started || mode === 'cards' || mode === 'letters' || isEnPractice" class="practiceArea">
        <!-- 英文/错词本：已开始 → 共用练习界面 -->
        <template v-if="isEnPractice && started">
          <div class="enStage">
            <div class="enSentenceCn" v-if="!enSentenceDone && (enCustomMode || enStoryMode) && enSentenceCn && !enDictationMode">{{ enSentenceCn }}</div>
            <!-- 评级弹层（复刻官网 comboPopup：Perfect/Great + combo；独立浮层不占位） -->
            <Transition name="combo-pop" appear>
              <div
                v-if="comboPopupVisible && enLastRating"
                :key="popFx"
                class="combo-popup"
              >
                <span class="comboRating">{{ enLastRating === 'perfect' ? 'Perfect' : 'Great' }}</span>
                <span v-if="enLastCombo > 1" class="comboCount">× {{ enLastCombo }}</span>
              </div>
            </Transition>
            <!-- 整句完成态：官网式句子成分结构图（组框 + 词卡：音标/词/词性下划线/释义/词性） -->
            <div v-if="enSentenceDone && enSentenceGroups.length" class="spParse" role="group" aria-label="本句成分解析">
              <div
                v-for="(g, gi) in enSentenceGroups"
                :key="gi"
                class="spGroup"
                :class="{ plain: !g.role }"
                :style="{
                  borderColor: g.color + '80',
                  '--sp-chip': g.color,
                  '--gi': gi,
                }"
              >
                <span v-if="g.role" class="spChip">{{ g.role }}</span>
                <div v-for="(wd, wi) in g.words" :key="wi" class="spUnit">
                  <span class="spPh">{{ wd.ph }}</span>
                  <span class="spCell">
                    <span class="spWord">{{ wd.word }}<span class="spUl" :style="{ backgroundColor: wd.posColor }"></span></span><span v-if="wd.punct" class="spPunct">{{ wd.punct }}</span>
                  </span>
                  <span class="spDef">{{ wd.def }}</span>
                  <span class="spPos">{{ wd.posCn }}</span>
                  <!-- 官网式：悬停单词弹出成分讲解浮层 -->
                  <div v-if="g.explanation" class="spTip">
                    <div class="spTipTitle">
                      <span v-if="g.role" class="spTipRole">{{ g.role }}</span>
                      <span v-if="g.type" class="spTipType">{{ g.type }}</span>
                    </div>
                    <div class="spTipBody">{{ g.explanation }}</div>
                  </div>
                </div>
              </div>
              <!-- 整句中文：放卡片堆下方 -->
              <div v-if="(enCustomMode || enStoryMode) && enSentenceCn" class="enSentenceCn spCn">{{ enSentenceCn }}</div>
            </div>
            <div v-else class="enSentenceWrap">
              <!-- 第一行：正常词（不含重练词）；单行横向滚动 -->
              <div
                class="enSentence"
                :class="{ 'left-fade': enSentenceScrolled, story: enStoryMode }"
                ref="enSentenceRef"
                @scroll="onEnSentenceScroll"
              >
                <template v-for="(w, wi) in enSentence" :key="wi">
                  <div
                    v-if="!enRedoSet.has(wi)"
                    class="word-col"
                    :class="{ active: wi === wordIdx, completed: wi < wordIdx || enDoneByInput(wi), redo: enRedoSet.has(wi) }"
                  >
                    <span class="word-cn" v-if="(!enStoryMode && !enCustomMode) || settings.enShowWordCn">{{ wordCn(w) }}</span>
                    <div class="word-box">
                      <span class="word-letters">
                        <template v-for="(l, li) in w" :key="li">
                          <span
                            class="letter"
                            :class="letterClass(wi, li)"
                          >{{ letterChar(wi, li, l) }}</span>
                        </template>
                      </span>
                    </div>
                    <span
                      v-if="settings.enShowWordTime"
                      class="word-time"
                      :class="{ 'has-value': !!enWordAvgs[wi] }"
                    >{{ enWordAvgs[wi] ? enWordAvgs[wi] + 'ms' : '' }}</span>
                  </div>
                </template>
              </div>
              <!-- 第二行：出错后自动补练的重练词（独立一行，紧凑横向滚动） -->
              <div
                class="enSentence enSentenceRedo"
                ref="enSentenceRedoRef"
              >
                <template v-for="(w, wi) in enSentence" :key="wi">
                  <div
                    v-if="enRedoSet.has(wi)"
                    class="word-col redo-row"
                    :data-wi="wi"
                    :class="{ active: wi === wordIdx, completed: wi < wordIdx, redo: true }"
                  >
                    <span class="word-cn">{{ wordCn(w) }}</span>
                    <div class="word-box">
                      <span class="word-letters">
                        <template v-for="(l, li) in w" :key="li">
                          <span
                            class="letter"
                            :class="letterClass(wi, li)"
                          >{{ letterChar(wi, li, l) }}</span>
                        </template>
                      </span>
                    </div>
                    <span
                      v-if="settings.enShowWordTime"
                      class="word-time"
                      :class="{ 'has-value': !!enWordAvgs[wi] }"
                    >{{ enWordAvgs[wi] ? enWordAvgs[wi] + 'ms' : '' }}</span>
                  </div>
                </template>
              </div>
            </div>
          </div>
          <div class="enProgress">
            <button class="enActionBtn" :disabled="!enCanViewAnswer" @click="enViewAnswer" title="显示当前单词（计入完成统计）" data-nav><svg class="enIcon" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>答案</button>
            <button class="enActionBtn" @click="enRelisten" title="重读当前单词" data-nav><svg class="enIcon" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 5 6 9H2v6h4l5 4V5z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/></svg>重听</button>
            <button v-if="settings.enSpeakSentence" class="enActionBtn" @click="speakWholeSentence" title="重听整句 (Ctrl+')" data-nav><svg class="enIcon" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 5 6 9H2v6h4l5 4V5z"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>重听整句</button>
          </div>
        </template>

        <!-- 单词模式：未开始 → 词库配置 -->
        <template v-else-if="mode === 'words'">
          <div class="enStage">
            <div class="enGradeRow">
              <select class="enGradeSelect" :value="settings.enGrade" @change="onEnGradeChange" title="英文词库年级">
                <option value="all">全部词库</option>
                <option value="g4">四年级</option>
                <option value="g5">五年级</option>
                <option value="g6">六年级</option>
              </select>
            </div>
            <div class="numHint">从右上角选择词库开始，或按任意键开始</div>
          </div>
        </template>

        <!-- 短文模式：未开始 → 短文/课包列表 -->
        <template v-else-if="mode === 'stories'">
          <div class="enStage">
            <div class="storyPanel" :class="{ 'storyPanelWide': packBrowseLevel === 'courses' }">
              <!-- 课包课程列表：独立视图，隐藏其他内容 -->
              <template v-if="packBrowseLevel === 'courses' && activePack">
                <div class="packBrowser">
                  <div class="packTitle">
                    <button class="btn storyBackBtn" @click="backToPacks" data-nav>
                      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
                      返回课包
                    </button>
                    <span class="packTitleText">{{ activePack.title }}</span>
                    <span v-if="courseLoading" class="packLoadingTip">加载课程…</span>
                  </div>
                  <div v-if="activePack.description" class="packDesc">{{ activePack.description }}</div>
                  <div v-if="packError" class="packError">{{ packError }}</div>
                  <div v-if="packCoursesLoading" class="packEmpty">课程加载中…</div>
                  <div v-else class="storyList courseGrid">
                    <button
                      v-for="c in (activePack.courses || [])"
                      :key="c.id"
                      class="storyItem courseCard"
                      :disabled="courseLoading"
                      @click="startJulebuCourse(c)"
                      data-nav
                    >
                      <span class="courseOrder">#{{ c.order }}</span>
                      <span class="storyTitle courseTitle">{{ c.title }}</span>
                      <span v-if="c.subtitle" class="storySubtitle">{{ c.subtitle }}</span>
                      <span class="storyMeta">
                        <span v-if="courseProgress[activePack.slug]?.[c.file]?.completed" class="courseDone" title="已练习完成">✓ 已完成</span>
                        <span v-else>点击开始练习</span>
                      </span>
                    </button>
                  </div>
                </div>
              </template>
              <!-- 非课包浏览：短文列表 + 课包列表 -->
              <template v-else>
                <div class="storyPanelTitle">
                  <span>短文</span>
                  <button class="btn storyAddBtn" @click="openCustomEditor" data-nav>＋ 新增自定义</button>
                </div>
                <div v-if="customEditorOpen" class="customEditor">
                  <input v-model="newCustomTitle" placeholder="给这组内容起个名字（可留空）" class="customTitleInput" />
                  <textarea v-model="newCustomText" placeholder="粘贴英文内容（可中英对照，每句一行，中文行自动配为翻译）" rows="4"></textarea>
                  <div class="customOpts">
                    <button class="btn" :disabled="!newCustomText.trim()" @click="saveCustomStory" data-nav>{{ editingCustomId ? '保存修改' : '保存并加入' }}</button>
                    <button class="btn" @click="customEditorOpen = false" data-nav>取消</button>
                  </div>
                </div>
                <div v-if="enCustomStoryList.length" class="storyList">
                  <div v-for="s in enCustomStoryList" :key="s.id" class="storyItemWrap">
                    <button class="storyItem" @click="startEnStory(s)" data-nav>
                      <span class="storyTitle">{{ s.title }}</span>
                      <span class="storyMeta">{{ s.sentences.length }} 句 · 自定义{{ s.firstLine ? ' · ' + s.firstLine.slice(0, 28) + (s.firstLine.length > 28 ? '…' : '') : '' }}</span>
                    </button>
                    <button class="storyEdit" title="编辑" @click="editCustomStory(s.id)">✎</button>
                    <button class="storyDel" title="删除" @click="removeEnCustomStory(s.id)">×</button>
                  </div>
                </div>
                <!-- 主题课包（julebu 课程）浏览：课包列表 -->
                <div class="packBrowser">
                  <div class="packTitle">
                    <span>主题课包</span>
                    <button v-if="!packList.length && !packLoading" class="btn storyAddBtn" @click="loadCoursePackRegistry" data-nav>加载课包</button>
                    <button v-else-if="packLoading" class="btn" disabled data-nav>加载中…</button>
                  </div>
                  <div v-if="packError" class="packError">{{ packError }}</div>
                  <div v-if="!packList.length && !packLoading" class="packEmpty">点击"加载课包"获取主题课程（850 基础词等）</div>
                  <div v-if="packList.length" class="storyList">
                    <button v-for="p in packList" :key="p.slug" class="storyItem" @click="openCoursePack(p)" data-nav>
                      <span class="storyTitle">{{ p.title }}</span>
                      <span class="storyMeta">{{ p.courseCount || '' }} 课 · 主题课包 ›</span>
                    </button>
                  </div>
                </div>
                <div class="storyList" v-if="EN_STORIES.length">
                  <div class="packBuiltinLabel">内置短文</div>
                  <button
                    v-for="s in EN_STORIES"
                    :key="s.id"
                    class="storyItem"
                    @click="startEnStory(s)"
                    data-nav
                  >
                    <span class="storyTitle">{{ s.title }}</span>
                    <span class="storyMeta">{{ gradeLabel(s.grade) }} · {{ s.sentences.length }} 句 · {{ s.titleCn }}</span>
                  </button>
                </div>
              </template>
            </div>
          </div>
        </template>

        <!-- 错词本：未开始 → 错词/慢词列表 -->
        <template v-else-if="mode === 'mistake-book'">
          <div class="mistakeBookStage">
            <div class="mistakePanel enMistakePanel">
              <template v-if="enMistakeWords.length">
                <div class="mistakeList">
                  <div v-for="w in enMistakeWords" :key="w" class="mistakeItem">
                    <span class="mistakeWord">{{ w }}<i class="mistakeCn">{{ wordCn(w) }}</i></span>
                    <span class="mistakeCount" :class="{ err: enMastery[w] === 'error' }">{{ enMastery[w] === 'error' ? '打错' : '太慢' }}</span>
                  </div>
                </div>
                <div class="mistakeOpts">
                  <button class="btn" @click="startEnMistakePractice" data-nav>练习这 {{ enMistakeWords.length }} 个错词</button>
                  <button class="btn" @click="clearEnMistakes" data-nav>清空错题</button>
                </div>
              </template>
              <div v-else class="mistakeEmpty">暂无错题——打错的英文单词会自动记到这里，专练到记住为止。</div>
            </div>
            <div class="mistakePanel enMistakePanel">
              <template v-if="enSlowList.length">
                <div class="slowBar">
                  <span class="slowBarTitle">慢词刻意练习</span>
                  <span class="slowBarMeta">{{ enSlowList.length }} 个词待练快（平均耗时 &gt; {{ settings.enPracticeMs || 300 }}ms/字母）</span>
                </div>
                <div class="mistakeOpts">
                  <label class="repeatLabel">每词重复
                    <input type="number" v-model.number="customRepeat" min="1" max="20" /> 遍
                  </label>
                  <button class="btn" @click="startEnSlowPractice" data-nav>练到 {{ settings.enPracticeMs || 300 }}ms 以内</button>
                  <button class="btn" @click="clearEnSlowWords" data-nav>清空</button>
                </div>
              </template>
              <div v-else class="mistakeEmpty">暂无慢词——平均耗时超过 {{ settings.enPracticeMs || 300 }}ms/字母 的词会自动收录，刻意练到变快。</div>
            </div>
            <div class="numHint">从错词本中挑选需要专练的单词</div>
          </div>
        </template>

        <!-- 键盘数字 -->
        <template v-if="mode === 'numbers'">
          <div class="numStage">
            <div class="numGroup">
              <template v-for="(d, i) in currentGroup" :key="i">
                <span class="numDigit" :class="{ typed: i < digitIdx, current: i === digitIdx }">{{ d }}</span>
              </template>
            </div>
            <div class="numProgress">第 {{ groupIdx + 1 }} / {{ numQueue.length }} 组数字</div>
            <div class="numHint">用键盘数字行输入，熟悉手指位置</div>
          </div>
        </template>

        <!-- 字母键位 -->
        <template v-if="mode === 'letters'">
          <div class="letterStage">
            <div class="letterLevels">
              <button
                v-for="l in LETTER_LEVELS"
                :key="l.id"
                class="levelBtn"
                :class="{ active: letterLevel === l.id }"
                @click="setLetterLevel(l.id)"
                data-nav
              >{{ l.name }}</button>
            </div>
            <template v-if="started">
              <div class="letterGroup">
                <template v-for="(d, i) in currentLetterGroup" :key="i">
                  <span class="letterDigit" :class="{ typed: i < letterCharIdx, current: i === letterCharIdx }">{{ d }}</span>
                </template>
              </div>
              <div class="numProgress">第 {{ letterGroupIdx + 1 }} / {{ letterQueue.length }} 组字母</div>
            </template>
            <div class="numHint">{{ started ? '按键盘输入字母，盲打熟悉手指位置' : '选择难度后，按任意键开始' }}</div>
          </div>
        </template>

        <!-- 拼音音节 -->
        <template v-if="mode === 'syllables'">
          <div class="sylStage">
            <div class="sylChar" v-if="currentSyllable?.char">{{ currentSyllable.char }}</div>
            <div class="sylGroup">
              <template v-for="(l, i) in (currentSyllable?.letters || [])" :key="i">
                <span class="sylLetter" :class="{ typed: i < sylCharIdx, current: i === sylCharIdx }">{{ l }}</span>
              </template>
            </div>
            <div class="numProgress">第 {{ sylIdx + 1 }} / {{ sylQueue.length }} 个音节</div>
            <div class="numHint">逐字母输入拼音音节，音节结束自动推进</div>
          </div>
        </template>

        <!-- Anki 卡片 -->
        <template v-if="mode === 'cards'">
          <div class="cardStage">
            <!-- 内容源：点击即开始（错题本/自定义先开面板确认） -->
            <div class="letterLevels">
              <button
                v-for="c in CONTENT_TYPES"
                :key="c.id"
                class="levelBtn"
                :class="{ active: content === c.id }"
                @click="selectContent(c.id)"
                data-nav
              >{{ c.name }}</button>
            </div>

            <!-- 隐藏/显示拼音字母提示开关（存到设置，作用于全部卡片类型） -->
            <div class="letterLevels">
              <button
                class="levelBtn"
                :class="{ active: settings.cardHideLetters }"
                @click="settings.toggleCardHideLetters()"
                data-nav
              >{{ settings.cardHideLetters ? '隐藏字母' : '显示拼音' }}</button>
            </div>

            <!-- 自定义词表输入面板 -->
            <div v-if="cardType === 'custom' && !started" class="customPanel">
              <textarea
                v-model="customCardsInput"
                placeholder="每行一个词，支持：&#10;中文词（自动转拼音）：时间 中国 学习&#10;直接拼音/字母：shijian zhongguo&#10;短语也可，如：qing wen"
              />
              <div class="customOpts">
                <label class="repeatLabel">每词重复
                  <input type="number" v-model.number="customRepeat" min="1" max="20" /> 遍
                </label>
                <button
                  class="btn primary"
                  :disabled="!customCardsInput.trim()"
                  @click="start"
                  data-nav
                >开始练习</button>
              </div>
              <div class="numHint">每个词会按设定次数反复出现，打错的词会再次插入队尾重练</div>
            </div>

            <!-- 错题本面板 -->
            <div v-if="cardType === 'mistake' && !started" class="mistakePanel">
              <template v-if="mistakes.list.length">
                <div class="mistakeList">
                  <div v-for="m in mistakes.list" :key="m.text" class="mistakeItem">
                    <span class="mistakeWord">{{ m.text }}</span>
                    <span class="mistakeCount">×{{ m.count }}</span>
                  </div>
                </div>
                <div class="mistakeOpts">
                  <button class="btn primary" @click="start" data-nav>开始练习</button>
                  <button class="btn" @click="mistakes.clear()" data-nav>清空错题本</button>
                </div>
              </template>
              <div v-else class="mistakeEmpty">还没有错题记录——打错的词会自动记到这里，反复练习直到记住。</div>
            </div>

            <!-- 卡片主体（仅练习中显示，避免未开始时空卡片残留） -->
            <template v-if="started">
              <div class="ankiCard" :class="{ redo: currentCard?.redo }">
                <div class="ankiDisplay">{{ currentCard?.display }}</div>
                <div class="ankiSyl" :class="{ hideMode: hideLetters }" v-if="currentCard">
                  <span
                    v-for="(s, si) in currentCard.syllables"
                    :key="si"
                    class="ankiSylItem"
                    :class="{ done: si < cardSylIdx, current: si === cardSylIdx }"
                  >
                    <template v-for="(l, li) in s" :key="li">
                      <span
                        class="sylLetter"
                        :class="cardLetterStates[si + '-' + li]"
                      >{{ l }}</span>
                    </template>
                  </span>
                </div>
                <div class="ankiProgress">第 {{ cardIdx + 1 }} / {{ cardQueue.length }} 张卡</div>
              </div>
              <div class="numHint">
                <template v-if="cardAdvancePending">本卡完成，按 空格/回车 进入下一张</template>
                <template v-else>
                  {{ cardType === 'word' ? '打出词语的拼音，音节自动切换' : cardType === 'sentence' ? '逐字打出整句拼音，错卡自动重练' : cardType === 'mistake' ? '专练错题本里的词，错得越多越常出现' : '刻意练习：反复打熟你指定的词' }}
                  <template v-if="hideLetters">（隐藏字母：输入正确后展示并保留横线，错误标红）</template>
                </template>
              </div>
            </template>
            <div class="numHint" v-if="!started && cardType !== 'custom' && cardType !== 'mistake'">点击上方词库直接开始，或按任意键开始</div>
          </div>
        </template>
      </div>

      <!-- 键盘（受控展示模式：按压/闪光由页面驱动，输入由页面统一处理） -->
      <Keyboard
        v-if="started && settings.showKeyboard"
        :pressed-codes="keyPressed"
        :flash-codes="flashState"
        :show-hints="false"
      />

      <!-- 完成页：英文为浮动评测卡（半透明遮罩 + 居中卡片），其余模式保持居中弹窗 -->
      <div v-if="completed && isEnPractice" class="overlay" @click.self="backToModeSelect">
        <div class="resultModal resultPageInner">
          <!-- 顶部条：返回 + 标题 -->
          <div class="rpTopbar">
            <button class="rpBack" @click="backToModeSelect" data-nav>
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
              返回
            </button>
            <div class="rpTitleRow">
              <span class="rpTitle">练习完成</span>
              <span class="rpSubtitle">英文 · 本次评测</span>
            </div>
          </div>

          <!-- 主统计区：答对/又错 + 时长/答题数，横向一字排开，纯文字无背景块 -->
          <div class="rpSummary">
            <div class="rpItem">
              <span class="rpItemValue ok">{{ enFirstHitCount }}</span>
              <span class="rpItemLabel">答对</span>
            </div>
            <div class="rpItem">
              <span class="rpItemValue wrong">{{ enWrongCount }}</span>
              <span class="rpItemLabel">又错</span>
            </div>
            <div class="rpItem">
              <span class="rpItemValue">{{ formatDuration(finalDuration) }}</span>
              <span class="rpItemLabel">练习时长</span>
            </div>
            <div class="rpItem">
              <span class="rpItemValue">{{ enWordCount }}</span>
              <span class="rpItemLabel">答题数</span>
            </div>
          </div>

          <!-- 数据分析：5 项横排，纯文字无边框 -->
          <div class="rpSection">
            <div class="rpSectionTitle">数据分析</div>
            <div class="rpChart">
              <div class="rpStat">
                <span class="rpStatValue">{{ enFirstHitRate }}%</span>
                <span class="rpStatLabel">一次命中率</span>
              </div>
              <div class="rpStat">
                <span class="rpStatValue">{{ accuracy }}%</span>
                <span class="rpStatLabel">正确率</span>
              </div>
              <div class="rpStat">
                <span class="rpStatValue">{{ enViewAnswers }}</span>
                <span class="rpStatLabel">查看答案</span>
              </div>
              <div class="rpStat">
                <span class="rpStatValue">{{ enRelistens }}</span>
                <span class="rpStatLabel">重听次数</span>
              </div>
              <div class="rpStat">
                <span class="rpStatValue">{{ enAvgWordTime }}<small>ms</small></span>
                <span class="rpStatLabel">平均用时/词</span>
              </div>
            </div>
          </div>

          <!-- 纪录 -->
          <div class="rpSection" v-if="finalDuration > 0">
            <div class="rpSectionTitle">纪录</div>
            <div class="recordBox" :class="{ new: isNewRecord }">
              <template v-if="isNewRecord">
                <span class="recordBadge">新纪录！</span>
                <span class="recordText" v-if="prevBest !== null">本次用时 {{ formatDuration(finalDuration) }}，打破之前纪录 {{ formatDuration(prevBest) }}</span>
                <span class="recordText" v-else>本次用时 {{ formatDuration(finalDuration) }} · 首次完成，纪录已建立</span>
              </template>
              <span class="recordText" v-else>本模式最佳纪录 {{ formatDuration(sessionBest) }} · 本次用时 {{ formatDuration(finalDuration) }}</span>
            </div>
          </div>

          <!-- 本次错词：展示 -->
          <div class="rpSection" v-if="sessionMistakes.length">
            <div class="rpSectionTitle">本次错词（{{ sessionMistakes.length }} 个）</div>
            <div class="sessionMistakeBox">
              <div class="smChips">
                <span v-for="w in sessionMistakes" :key="w" class="smChip">{{ w + (wordCn(w) ? '·' + wordCn(w) : '') }}</span>
              </div>
            </div>
          </div>

          <!-- 底部操作 -->
          <div class="rpActions">
            <button ref="restartBtnRef" class="btn primary" @click="restart">
              再来一次 <span class="shortcut">(空格)</span>
            </button>
            <button class="btn" @click="switchMode(nextMode)">
              换个模式 <span class="shortcut">(M)</span>
            </button>
            <button v-if="sessionMistakes.length" class="btn" @click="startMistakePractice">
              刻意练习这 {{ sessionMistakes.length }} 个错词
            </button>
          </div>
          <p class="modalHint">ESC 返回开始 · M 切换模式</p>
        </div>
      </div>

      <!-- 其余模式完成弹窗（保持居中） -->
      <div v-else-if="completed" class="overlay" @click.self="restart">
        <div class="resultModal">
          <h3>练习完成</h3>
          <div class="resultStats">
            <div class="rStat">
              <span class="rValue">{{ accuracy }}%</span>
              <span class="rLabel">正确率</span>
            </div>
            <div class="rStat">
              <span class="rValue">{{ speed }}</span>
              <span class="rLabel">字/分</span>
            </div>
            <div class="rStat">
              <span class="rValue">{{ formatDuration(finalDuration) }}</span>
              <span class="rLabel">总用时</span>
            </div>
          </div>
          <div class="recordBox" v-if="finalDuration > 0" :class="{ new: isNewRecord }">
            <template v-if="isNewRecord">
              <span class="recordBadge">新纪录！</span>
              <span class="recordText" v-if="prevBest !== null">本次用时 {{ formatDuration(finalDuration) }}，打破之前纪录 {{ formatDuration(prevBest) }}</span>
              <span class="recordText" v-else>本次用时 {{ formatDuration(finalDuration) }} · 首次完成，纪录已建立</span>
            </template>
            <span class="recordText" v-else>本模式最佳纪录 {{ formatDuration(sessionBest) }} · 本次用时 {{ formatDuration(finalDuration) }}</span>
          </div>
          <!-- 本次错词：展示 + 刻意练习 -->
          <div class="sessionMistakeBox" v-if="sessionMistakes.length">
            <div class="smTitle">本次错词（{{ sessionMistakes.length }} 个）</div>
            <div class="smChips">
              <span v-for="w in sessionMistakes" :key="w" class="smChip">{{ w }}</span>
            </div>
            <button class="btn primary" @click="startMistakePractice">刻意练习这 {{ sessionMistakes.length }} 个错词</button>
          </div>
          <div class="resultActions">
            <button ref="restartBtnRef" class="btn primary" @click="restart">
              再来一次 <span class="shortcut">(空格)</span>
            </button>
            <button class="btn" @click="switchMode(nextMode)">
              换个模式 <span class="shortcut">(M)</span>
            </button>
          </div>
          <p class="modalHint">ESC 返回开始 · M 切换模式</p>
        </div>
      </div>

      <div class="footerSpace" />
    </div>

    <!-- 底部四指标（无背景，纯文本）；英文句序列练习时两侧出现切句箭头 -->
    <div v-if="started && !completed" class="bottomStats">
      <button
        v-if="enHasSentenceNav"
        class="bsArrow"
        :disabled="sentenceIdx < 1"
        title="上一个句子"
        aria-label="上一个句子"
        @click="arrowJumpSentence(-1)"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
      </button>
      <div class="bsItem">
        <span class="bsValue">{{ accuracy }}%</span>
        <span class="bsLabel">正确率</span>
      </div>
      <div class="bsItem">
        <span class="bsValue">{{ speed }}</span>
        <span class="bsLabel">字/分</span>
      </div>
      <div class="bsItem">
        <span class="bsValue">{{ correctCount }}<small>/{{ totalCount }}</small></span>
        <span class="bsLabel">按键</span>
      </div>
      <div class="bsItem">
        <span class="bsValue">{{ formatDuration(elapsedSec) }}</span>
        <span class="bsLabel">用时</span>
      </div>
      <button
        v-if="enHasSentenceNav"
        class="bsArrow"
        :disabled="sentenceIdx >= enQueue.length - 1"
        title="下一个句子"
        aria-label="下一个句子"
        @click="arrowJumpSentence(1)"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6" /></svg>
      </button>
    </div>

    <AchievementNotification :new-achievements="newAchievements" />
  </div>
</template>

<script setup>
import { computed, onMounted, onBeforeUnmount, ref, reactive, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import TopStatusBar from '../components/TopStatusBar.vue'
import AchievementNotification from '../components/AchievementNotification.vue'
import Keyboard from '../components/Keyboard.vue'
import { WORDS } from '../data/words.js'
import { EN_WORDS } from '../data/englishWords.js'
import { GRADE_EN_WORDS } from '../data/schoolEnglish.js'
import { fetchEnTranslation } from '../utils/enTranslation.js'
import { EN_STORIES } from '../data/enStories.js'
import { fetchCoursePackRegistry, fetchCoursePack, fetchCourseData, getCourseDict, courseToStory, statementsToQueue, filterQueueByDifficulty, filterQueueByCustomTypes, CUSTOM_TYPE_OPTIONS } from '../utils/coursePacks.js'
import { WORD_SEGMENTS } from '../data/wordSegments.js'
import { getSyllableMap } from '../data/enSyllables.js'
import { GRADE_WORDS } from '../data/schoolWords.js'
import { extractChinese, stripDialogPrefix, toPinyinArray, toWordSyllables } from '../utils/text2pinyin.js'
import { keyByCode, keyRows } from '../data/xiaohe.js'
import { SYLLABLES } from '../data/syllables.js'
import { useSettingsStore } from '../stores/settings.js'
import { useStatsStore } from '../stores/stats.js'
import { useProgressStore } from '../stores/progress.js'
import { useMistakesStore } from '../stores/mistakes.js'
import { playKeySound } from '../utils/sound.js'
import confetti from 'canvas-confetti'

const MODES = [
  {
    id: 'cards',
    label: '中文拼音',
    desc: '打出词语/短句的拼音，音节自动切换，错卡自动重练',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/><path d="M6 15h4"/></svg>',
  },
  {
    id: 'words',
    label: '英文单词',
    desc: '按词库流式练习英文单词拼写',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 7h16"/><path d="M4 12h16"/><path d="M4 17h10"/></svg>',
  },
  {
    id: 'stories',
    label: '英文短文',
    desc: '短文/课包整句流式练习，句子上方中文对照',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/><path d="M9 9h6"/><path d="M9 13h6"/><path d="M9 7h6"/></svg>',
  },
  {
    id: 'numbers',
    label: '键盘数字',
    desc: '数字键位专项练习，错组自动重练',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 9h16"/><path d="M4 15h16"/><path d="M10 3L8 21"/><path d="M16 3l-2 18"/></svg>',
  },
  {
    id: 'letters',
    label: '字母键位',
    desc: '字母分区与易错键专项练习',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><rect x="3" y="9" width="8" height="8" rx="1.5"/><rect x="13" y="9" width="8" height="8" rx="1.5"/></svg>',
  },
  {
    id: 'syllables',
    label: '拼音音节',
    desc: '拼音音节组合拼打练习',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12h3l2-5 3 10 3-8 2 3h5"/></svg>',
  },
  {
    id: 'mistake-book',
    label: '错词本',
    desc: '集中练习英文错词和慢词',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/><path d="M9 9h6"/><path d="M9 13h6"/><path d="M9 7h6"/></svg>',
  },
]

// 卡片练习的内容源（一层选择，点击即开始；错题本/自定义需面板确认）
const CONTENT_TYPES = [
  { id: 'all', name: '全部词库', cardType: 'word', grade: 'all' },
  { id: 'g4', name: '四年级', cardType: 'word', grade: 'g4' },
  { id: 'g5', name: '五年级', cardType: 'word', grade: 'g5' },
  { id: 'g6', name: '六年级', cardType: 'word', grade: 'g6' },
  { id: 'sentence', name: '短句', cardType: 'sentence', grade: null },
  { id: 'mistake', name: '错题本', cardType: 'mistake', grade: null },
  { id: 'custom', name: '自定义', cardType: 'custom', grade: null },
]

// 英文词库年级（选项在顶部栏）
const enGrade = computed(() => settings.enGrade || 'all')

// 字母键位练习的难度分区（对应 keyRows：0=上排 Q..P，1=中排 A..L，2=下排 Z..M）
const LETTER_LEVELS = [
  { id: 'home', name: '中排', rows: [1] },
  { id: 'top', name: '上排', rows: [0] },
  { id: 'bottom', name: '下排', rows: [2] },
  { id: 'full', name: '全键盘', rows: [0, 1, 2] },
  { id: 'error', name: '易错键', rows: [] },
]

// 短句卡片的拼句语料（可读性优先）
const CN_SENTENCES = [
  '中文输入拼音练习，提升速度与准确，保持节奏与专注。',
  '秋风微凉，二人软语，月与云伴，乌衣巷口我也有缘。',
  '大江东去，风拂更长，岸边少年，快意江湖，两个伙伴望海。',
  '走在小路上，草色翠绿，追风而行，滨海鸟鸣，绵延不断。',
]

const settings = useSettingsStore()
const stats = useStatsStore()
const progress = useProgressStore()
// 今日目标实时进度（三达标：时长/正确率/错词清零），供顶部目标条与完成弹窗
const goal = computed(() => progress.todayGoal)
const mistakes = useMistakesStore()
const route = useRoute()
const router = useRouter()

const mode = ref('cards')
const started = ref(false)
const completed = ref(false)

// 会话统计
const totalCount = ref(0)
const correctCount = ref(0)
const completedUnits = ref(0) // 完成的目标单元数（字/词/字符），速度口径
const sessionStart = ref(0)

// 会话计时与破纪录：实时用时、完成时的总用时、是否打破该模式最佳纪录
const elapsedSec = ref(0)
const finalDuration = ref(0)
const prevBest = ref(null)
const isNewRecord = ref(false)
let elapsedTimer = null

// 各模式最佳用时纪录（秒），按模式独立统计（卡片/中文/数字等题量不同，不能跨模式比较）
const BEST_TIMES_KEY = 'sp-best-times'
const bestTimes = reactive(loadBestTimes())
function loadBestTimes() {
  try { return JSON.parse(localStorage.getItem(BEST_TIMES_KEY) || '{}') } catch { return {} }
}
function saveBestTimes() {
  try { localStorage.setItem(BEST_TIMES_KEY, JSON.stringify(bestTimes)) } catch {}
}

// 英文状态（参考 localhost:3002：整句单词流练习）
const enQueue = ref([]) // [{ words: ['the','quick',...] }, ...] 句子数组
const sentenceIdx = ref(0)
const wordIdx = ref(0)
const letterIdx = ref(0)
const currentInput = ref('') // 当前词已输入内容（含错误字符，用于覆盖修正显示）
const wordCompleted = ref(false)

// 英文单词掌握度（持久化）：{ word: 'mastered' | 'error' }，缺省 = 正常（兼容旧值 true/false）
const EN_MASTERY_KEY = 'sp-en-mastery'
// 英文掌握度判定阈值：提示模式（显示字母抄写）与默写模式（隐藏字母回忆）两套逻辑
// 提示模式无回忆成本，须真正快才算掌握（阈值严）；默写模式含思考时间，阈值放宽
const enMasteryMs = computed(() => settings.enMasteryMs || 500)
const enSlowMs = computed(() => settings.enSlowMs || 1300)
const enMasteryMsDict = computed(() => settings.enMasteryMsDict || 1000)
const enSlowMsDict = computed(() => settings.enSlowMsDict || 2500)
// 随机抽取权重：错词/慢词 > 正常 > 掌握
const EN_TIER_WEIGHT = { error: 5, slow: 5, normal: 2, mastered: 1 }
const enMastery = reactive(loadEnMastery())
function loadEnMastery() {
  try { return JSON.parse(localStorage.getItem(EN_MASTERY_KEY) || '{}') } catch { return {} }
}
function saveEnMastery() {
  try { localStorage.setItem(EN_MASTERY_KEY, JSON.stringify(enMastery)) } catch {}
}
// 当前词输入计时（用于掌握度判断）
const enWordStartTime = ref(0)
const enWordKeystrokes = ref(0)
const enLastWordAvg = ref(0) // 上一个词的平均耗时（ms/字母）
const enWordAvgs = ref({}) // 本句各词完成后的平均耗时（按词位置记录，用于词下方显示）
const enSentenceDone = ref(false) // 整句打完，等待再一次空格进入下一句

// ---- 整句评级特效（复刻 julebu.co 规则，不自我发挥）----
// rating：perfect(首答对零 typo) / great(首答对但 typo) / none(用过提示或首答错) / skip
// popup 只在 perfect|great 弹（文案 Perfect/Great + 当前 combo）
// combo：perfect|great → +1；none/skip → 归零
const enCombo = ref(0)               // 当前连击（官网 combo，跨句累计）
const enMaxCombo = ref(0)
const enLastRating = ref('')         // 最近一次句子的 rating（弹层文案）
const enLastCombo = ref(0)           // 弹层展示 combo
const popFx = ref(0)                 // 自增 ID：驱动弹层动画重放
const comboPopupVisible = ref(false) // 弹层可见（浮现 ~1.3s 后自行淡出）
// 本句作答过程状态（每句开始时清零）
const sentUsedHint = ref(false)      // 本句是否按过"答案"（=官网 hintsUsed）
const sentFirstTry = ref(true)       // 本句是否全程首答（无错词/无重练）
const sentTypos = ref(0)             // 本句 typo 计数（打错过但自行纠正）
// 触发整句完成评级：rating 由调用方算好传入
function fireSentenceCelebration(rating) {
  // 整句提交即内容全部正确（严格模式错字母不前进、宽松模式错词插回重练）→ 响官网式"叮"
  // 官网实测：句子提交准确 → 立即 0.6s 短叮（correct.mp3），与是否 perfect 无关
  if (settings.sound) playKeySound('correct', { volume: Math.min(1, (settings.soundVolume || 0.18) * 3) })
  const good = rating === 'perfect' || rating === 'great'
  // 连击维护（官网：只有 perfect|great 才 +1，否则归零）
  if (good) { enCombo.value++ } else { enCombo.value = 0 }
  enMaxCombo.value = Math.max(enMaxCombo.value, enCombo.value)
  // none/skip 不弹层不庆祝
  if (!good) { enLastRating.value = ''; comboPopupVisible.value = false; return }
  enLastRating.value = rating
  enLastCombo.value = enCombo.value
  popFx.value++
  comboPopupVisible.value = true
  clearTimeout(fireSentenceCelebration._t)
  fireSentenceCelebration._t = setTimeout(() => { comboPopupVisible.value = false }, 1300)
  // 官网：每句 Perfect/Great 只弹 popup + combo 音效，不放彩带烟花
  // combo 音量比打字 ok/bad 音效醒目：跟随全局音量再放大 ~3 倍（封顶 1）
  if (settings.sound) playKeySound('combo', { volume: Math.min(1, (settings.soundVolume || 0.18) * 3) })
}
// 完成一句的评级结算（由整句完成点调用）
function rateSentenceCompletion() {
  // 官网 Cie：skipped→skip / hintsUsed>0 或 firstAttemptCorrect===false → none /
  // firstAttemptCorrect && typos===0 → perfect / 否则 great
  if (sentUsedHint.value || !sentFirstTry.value) return 'none'
  return sentTypos.value === 0 ? 'perfect' : 'great'
}
// 整课完成庆祝（复刻官网 StatsSummary：completeCourse → 300ms 后 confetti + victory 音效）
// 官网三选一随机：30% 双烟花 / 30% 顶部彩带 / 40% 双侧礼炮；仅此一次，不频繁
function fireCourseCelebration() {
  setTimeout(() => {
    const r = Math.random()
    if (r < 0.3) {
      // fireworks（官网 fireworksEffect 近似：双簇上炸）
      for (let k = 0; k < 2; k++) {
        confetti({ particleCount: 90, spread: 130, startVelocity: 45, origin: { x: 0.25 + k * 0.5, y: 0.55 }, ticks: 220, zIndex: 300 })
      }
    } else if (r < 0.6) {
      // normal（官网 normalEffect：粒子从顶部洒下）
      confetti({ particleCount: 300, spread: 180, origin: { y: -0.1 }, startVelocity: -35, ticks: 200, zIndex: 300 })
    } else {
      // schoolPride 近似：两侧礼炮
      confetti({ particleCount: 130, angle: 60, spread: 75, origin: { x: 0, y: 0.7 }, zIndex: 300 })
      confetti({ particleCount: 130, angle: 120, spread: 75, origin: { x: 1, y: 0.7 }, zIndex: 300 })
    }
    if (settings.sound) playKeySound('victory', { volume: 0.16 })
  }, 300)
}

// 换句/重开：重置本句过程状态
function resetSentenceScoring() {
  clearEnReplay(-1) // 清错误回放状态/定时器（跨句不残留）
  sentUsedHint.value = false
  sentFirstTry.value = true
  sentTypos.value = 0
}
// 英文错题本：enMastery 中 error（打错）/ slow（太慢没想起来）的词 = 错题池
const enMistakeMode = ref(false) // 是否在错题本练习模式
const enStoryMode = ref(false) // 是否在短文练习中
const selectedEnStory = ref(null)

// ---- 主题课包（julebu 课程）浏览状态 ----
const packList = ref([]) // 总注册表：课包列表
const packLoading = ref(false)
const packError = ref('')
const activePack = ref(null) // 展开的课包（含课程清单）
const packCoursesLoading = ref(false)
const courseLoading = ref(false) // 正在加载某课（进入练习前）
// 当前课的本地词典（释义跟课文走）；兜底仍可走有道
const currentCourseDict = ref({})
// 难度分级：beginner(初级全量) | intermediate(中级去词) | advanced(高级仅句) | custom(自定义勾选)
// 仅 julebu 课包课程显示；farm/自定义不受影响
const EN_DIFFICULTY_KEY = 'sp-en-difficulty'
const EN_CUSTOM_TYPES_KEY = 'sp-en-custom-types'
function loadEnDifficulty() {
  try {
    const v = localStorage.getItem(EN_DIFFICULTY_KEY)
    if (v) enDifficulty.value = v
  } catch {}
}
function loadEnCustomTypes() {
  try {
    const v = localStorage.getItem(EN_CUSTOM_TYPES_KEY)
    if (v) enCustomTypes.value = JSON.parse(v)
  } catch {}
}
function saveEnCustomTypes() {
  try { localStorage.setItem(EN_CUSTOM_TYPES_KEY, JSON.stringify(enCustomTypes.value)) } catch {}
}
const enDictationMode = ref(false) // false=中译英, true=听写
const EN_DICTATION_KEY = 'sp-en-dictation'
function loadEnDictationMode() {
  try {
    const v = localStorage.getItem(EN_DICTATION_KEY)
    if (v === 'true') enDictationMode.value = true
  } catch {}
}
function saveEnDictationMode() {
  try { localStorage.setItem(EN_DICTATION_KEY, enDictationMode.value ? 'true' : '') } catch {}
}
function toggleEnDictationMode() {
  enDictationMode.value = !enDictationMode.value
  saveEnDictationMode()
}

const enDifficulty = ref('beginner')
const DIFFICULTY_OPTIONS = [
  { key: 'beginner', label: '初级', desc: '单词 + 短语 + 整句' },
  { key: 'intermediate', label: '中级', desc: '短语 + 整句' },
  { key: 'advanced', label: '高级', desc: '仅整句' },
]
const CUSTOM_TYPE_OPTIONS_FILTERED = computed(() =>
  CUSTOM_TYPE_OPTIONS.filter(o => o.key !== 'sentence').map(opt => {
    const count = julebuFullQueue.value.filter(s => s.type === opt.key).length
    return { ...opt, count }
  })
)
const DIFFICULTY_OPTIONS_WITH_COUNT = computed(() =>
  DIFFICULTY_OPTIONS.map(opt => {
    const count = filterQueueByDifficulty(julebuFullQueue.value, opt.key).length
    return { ...opt, count }
  })
)
const EN_DISPLAY_OPTIONS = [
  { key: 'smart', label: '智能', desc: '按掌握度自动切换' },
  { key: 'guide', label: '看答案', desc: '始终显示字母，逐字母指引输入' },
  { key: 'dictation', label: '全默写', desc: '始终隐藏字母，凭记忆拼写' },
]
// 自定义勾选：sentence句子 / chunk组合语块 / phrase语块 / word短语单词
const enCustomTypes = ref({ sentence: true, chunk: true, phrase: true, word: true })
const julebuFullQueue = ref([]) // 当前课的原始全量队列（切难度时过滤用，不重复 fetch）
const enModePanelOpen = ref(false) // 右上角模式 chip 的下拉面板
const enDispPanelOpen = ref(false) // 显示模式下拉面板
const enDispLabel = computed(() => {
  const opt = EN_DISPLAY_OPTIONS.find(o => o.key === settings.enDisplayMode)
  return opt ? opt.label : '智能'
})
// chip 上显示当前档位名（自定义时按勾选数动态显示）
const enDifficultyLabel = computed(() => {
  if (enDifficulty.value === 'custom') {
    const on = CUSTOM_TYPE_OPTIONS.filter(o => enCustomTypes.value[o.key])
    const n = on.length
    if (n === 4) return '全类型'
    if (n <= 0) return '自定义'
    return '自定义' + on.map(o => o.label).join('·')
  }
  const opt = DIFFICULTY_OPTIONS.find(o => o.key === enDifficulty.value)
  return opt ? opt.label : '初级'
})
// 课包浏览器 UI 状态：'packs'（课包列表）| 'courses'（课包内课程列表）
const packBrowseLevel = ref('packs')
// 当前正在练习的课程（课包课程：用于导航到上一课/下一课）
const currentCourse = ref(null)
// 课程进度持久化：记录每课是否完成过（packSlug -> { courseFile -> { completed, lastPracticed } }）
const COURSE_PROGRESS_KEY = 'sp-course-progress'
const courseProgress = reactive(loadCourseProgress())
function loadCourseProgress() {
  try { return JSON.parse(localStorage.getItem(COURSE_PROGRESS_KEY) || '{}') } catch { return {} }
}
function saveCourseProgress() {
  try { localStorage.setItem(COURSE_PROGRESS_KEY, JSON.stringify(courseProgress)) } catch {}
}
function markCourseComplete(packSlug, courseFile) {
  if (!packSlug || !courseFile) return
  if (!courseProgress[packSlug]) courseProgress[packSlug] = {}
  courseProgress[packSlug][courseFile] = { completed: true, lastPracticed: Date.now() }
  saveCourseProgress()
}
// 当前课程在课包中的索引（用于导航）
const currentCourseIndex = computed(() => {
  if (!activePack.value?.courses || !currentCourse.value) return -1
  return activePack.value.courses.findIndex(c => c.file === currentCourse.value.file)
})
const currentCoursePosition = computed(() => {
  const idx = currentCourseIndex.value
  const total = activePack.value?.courses?.length || 0
  if (idx < 0 || !total) return ''
  return `第 ${idx + 1} / ${total} 课`
})
// 课包课程面包屑导航数据（传给 TopStatusBar 的 course prop）
const courseBar = computed(() => {
  if (!activePack.value || !currentCourse.value || !julebuFullQueue.value.length) return null
  return {
    packTitle: activePack.value.title,
    courseTitle: currentCourse.value.title,
    position: currentCoursePosition.value,
    index: currentCourseIndex.value,
    total: activePack.value.courses?.length || 0,
    onPrev: goToPrevCourse,
    onNext: goToNextCourse,
    onBack: backToCourseList,
  }
})
// 课包课程导航：上一课/下一课/回到课程列表
function goToPrevCourse() {
  const idx = currentCourseIndex.value
  if (idx <= 0) return
  const course = activePack.value?.courses?.[idx - 1]
  if (course) startJulebuCourse(course)
}
function goToNextCourse() {
  const idx = currentCourseIndex.value
  const courses = activePack.value?.courses || []
  if (idx < 0 || idx >= courses.length - 1) return
  const course = courses[idx + 1]
  if (course) startJulebuCourse(course)
}
 function backToCourseList() {
   // 退出当前练习，回到课程列表
   endSession()
   packBrowseLevel.value = 'courses'
   started.value = false
   completed.value = false
   currentCourse.value = null
 }

// 短文模式初始化：进入课包浏览态并懒加载注册表（由 applyModeFromQuery / 模式切换时调用）
function initStoriesBrowse() {
  packBrowseLevel.value = 'packs'
  activePack.value = null
  loadCoursePackRegistry()
}
function syncJulebuUrl({ pack, course }) {
  const q = { ...route.query }
  if (pack) q.pack = pack
  else delete q.pack
  if (course) q.course = course
  else delete q.course
  router.replace({ query: q })
}
// 从 URL 恢复课包浏览状态：找到匹配的课包并展开，如有课程则自动加载
async function restoreJulebuFromUrl() {
  const packSlug = route.query.pack
  const courseFile = route.query.course
  if (!packSlug) return
  let pack = packList.value.find(p => p.slug === packSlug)
  if (!pack) {
    // packList 未加载时直接从 URL 的 slug 拉取
    try {
      const data = await fetchCoursePack(packSlug)
      pack = { slug: packSlug, title: data.title || '', description: data.description || '', courses: data.courses || [] }
    } catch { return }
  }
  if (pack) {
    await openCoursePack(pack)
    if (courseFile) {
      const course = activePack.value?.courses?.find(c => c.file === courseFile)
      if (course) {
        await startJulebuCourse(course)
      }
    }
  }
}
// 打开短文 tab 时懒加载课包注册表
async function loadCoursePackRegistry() {
  if (packList.value.length) return
  packLoading.value = true
  packError.value = ''
  try {
    const reg = await fetchCoursePackRegistry()
    packList.value = reg.packs || []
  } catch (e) {
    packError.value = '课包加载失败：' + (e.message || e)
  } finally {
    packLoading.value = false
  }
}
// 展开课包 → 拉课程清单
async function openCoursePack(pack) {
  activePack.value = pack
  packBrowseLevel.value = 'courses'
  syncJulebuUrl({ pack: pack.slug })
  if (pack.courses) return // 已加载
  packCoursesLoading.value = true
  try {
    const data = await fetchCoursePack(pack.slug)
    activePack.value = { ...pack, courses: data.courses || [] }
  } catch (e) {
    packError.value = '课程清单加载失败：' + (e.message || e)
  } finally {
    packCoursesLoading.value = false
  }
}
function backToPacks() {
  activePack.value = null
  packBrowseLevel.value = 'packs'
  syncJulebuUrl({ pack: null, course: null })
  currentCourse.value = null
}
// 选课 → 加载单课全量 → 转成 story → 开始练习（释义跟课文走）
 async function startJulebuCourse(course) {
   const pack = activePack.value
   if (!pack || courseLoading.value) return
   courseLoading.value = true
   packError.value = ''
   // 结束上一课会话（导航切换时从已完成/进行中切换到新课）
   endSession()
   started.value = false
   completed.value = false
   syncJulebuUrl({ pack: pack.slug, course: course.file })
  try {
    const data = await fetchCourseData(pack.slug, course.file)
    const { buildCourseDict } = await import('../utils/coursePacks.js')
    // 构建当前课词典，并清空上一课的有道缓存（释义跟课文走，不串课）
    currentCourseDict.value = buildCourseDict(data)
    extraCn.value = {}
    // 缓存全量队列；story 先给全量（startEnStory 内 buildEnglishQueue 会读它）
    enModePanelOpen.value = false
    julebuFullQueue.value = statementsToQueue(data)
    currentCourse.value = course
    const story = courseToStory(data)
    story.source = 'julebu'
    startEnStory(story)
  } catch (e) {
    packError.value = '课程加载失败：' + (e.message || e)
  } finally {
    courseLoading.value = false
  }
}
// 退出练习回课包浏览时清词典（避免串课）
function resetCourseDict() {
  currentCourseDict.value = {}
}

// 按当前难度把全量队列过滤（返回过滤后的队列副本）；custom 用勾选集合
function filterByDifficulty() {
  if (enDifficulty.value === 'custom') {
    return filterQueueByCustomTypes(julebuFullQueue.value, enCustomTypes.value)
  }
  return filterQueueByDifficulty(julebuFullQueue.value, enDifficulty.value)
}
// 难度切换：重设 story.sentences 为过滤后的队列
function applyDifficultyQueue() {
  const st = selectedEnStory.value
  if (!st) return
  st.sentences = filterByDifficulty()
}
// 练习中切换难度（仅课包课程）：重建队列并从头开始该难度
function switchEnDifficulty(key) {
  if (!selectedEnStory.value || !julebuFullQueue.value.length) return
  if (enDifficulty.value === key) {
    enModePanelOpen.value = false // 再点当前档位 = 收起面板
    return
  }
  enDifficulty.value = key
  applyDifficultyQueue()
  if (key !== 'custom') enModePanelOpen.value = false // 固定档位选完收起；自定义保持打开供勾选
  restart()
}
// 自定义：勾选某类型 → 重建队列并从头（行为与固定档位一致）
function toggleCustomType(typeKey) {
  if (enDifficulty.value !== 'custom') return
  const sel = { ...enCustomTypes.value }
  sel[typeKey] = !sel[typeKey]
  // 至少要留一个类型，否则队列为空无法练
  if (!Object.values(sel).some(Boolean)) return
  enCustomTypes.value = sel
  applyDifficultyQueue()
  restart()
}
function selectCustomType(typeKey) {
  if (!selectedEnStory.value || !julebuFullQueue.value.length) return
  // 设为全关，只开当前类型
  const sel = {}
  for (const k of Object.keys(enCustomTypes.value)) {
    sel[k] = k === typeKey
  }
  enCustomTypes.value = sel
  saveEnCustomTypes()
  // 复用 switchEnDifficulty 的逻辑：设 custom 难度 + applyQueue + restart
  enDifficulty.value = 'custom'
  applyDifficultyQueue()
  enModePanelOpen.value = false
  restart()
}
const enHasOtherTypes = (key) => Object.keys(enCustomTypes.value).some(k => k !== key && enCustomTypes.value[k])
const enHasMultipleTypes = computed(() => Object.values(enCustomTypes.value).filter(Boolean).length > 1)
// 完成/退出练习时收起模式面板，避免残留
function closeEnModePanel() {
  enModePanelOpen.value = false
}

function gradeLabel(g) {
  return { g4: '四年级', g5: '五年级', g6: '六年级' }[g] || ''
}
function startEnStory(story) {
  if (!story || !story.sentences?.length) return
  selectedEnStory.value = story
  enMistakeMode.value = false
  enCustomMode.value = false
  enSlowMode.value = false
  enStoryMode.value = true
  // 非课包课程（farm/自定义）：清空课包上下文，避免难度条误显示
  if (story.source !== 'julebu') {
    julebuFullQueue.value = []
    currentCourseDict.value = {}
  } else {
    // 课包课程：应用已缓存的难度（刷新后恢复高级/中级等）
    applyDifficultyQueue()
  }
  start()
}
// 英文自定义模式：粘贴自己的英文内容练习（解析英文句 + 配对中文翻译）
const enCustomMode = ref(false)
const enCustomText = ref('') // textarea 内容
const EN_CUSTOM_KEY = 'sp-en-custom'
function loadEnCustom() {
  try { enCustomText.value = localStorage.getItem(EN_CUSTOM_KEY) || '' } catch {}
}
function saveEnCustom() {
  try { localStorage.setItem(EN_CUSTOM_KEY, enCustomText.value) } catch {}
}
// 解析粘贴内容：英文行（≥2 个英文词）作为句子，紧接其后的中文行配对为该句翻译
// 短文 tab 的多自定义条目管理：每篇独立标题+内容，可增删，本地持久化
const EN_CUSTOM_STORIES_KEY = 'shuangping:en-custom-stories'
const enCustomStories = ref([])
const customEditorOpen = ref(false)
const editingCustomId = ref(null) // null=新增；非 null=编辑该条
const newCustomTitle = ref('')
const newCustomText = ref('')
function saveEnCustomStories() {
  try { localStorage.setItem(EN_CUSTOM_STORIES_KEY, JSON.stringify(enCustomStories.value)) } catch {}
}
function loadEnCustomStories() {
  try {
    const raw = localStorage.getItem(EN_CUSTOM_STORIES_KEY)
    if (raw) {
      const arr = JSON.parse(raw)
      if (Array.isArray(arr)) enCustomStories.value = arr
    }
  } catch {}
}

// 每篇自定义 → 短文结构（保留原句，供整句流式+中文对照；标题缺省按序号命名）
function enCustomStoryOf(c, idx) {
  const sents = parseCustomStory(c.text)
  return {
    id: c.id,
    grade: 'custom',
    title: c.title || `自定义 ${idx + 1}`,
    titleCn: '自己粘贴的内容',
    firstLine: sents[0]?.en || '',
    sentences: sents,
    // 供编辑弹窗回显：剥离角色名前缀，避免重新编辑时冒号又出现
    cleanText: c.text ? String(c.text).split(/\n+/).map(l => stripDialogPrefix(l)).join('\n') : '',
  }
}
const enCustomStoryList = computed(() => enCustomStories.value.map((c, i) => enCustomStoryOf(c, i)))
function openCustomEditor() {
  // 新增模式：清空输入
  newCustomTitle.value = ''
  newCustomText.value = ''
  editingCustomId.value = null
  customEditorOpen.value = true
}
function editCustomStory(id) {
  const c = enCustomStories.value.find(x => x.id === id)
  if (!c) return
  newCustomTitle.value = c.title || ''
  newCustomText.value = c.cleanText || c.text || ''
  editingCustomId.value = id
  customEditorOpen.value = true
}
function saveCustomStory() {
  const text = newCustomText.value.trim()
  if (!text) return
  if (editingCustomId.value) {
    // 编辑：覆盖原条目（保留 id，练习中的引用不受影响）
    const c = enCustomStories.value.find(x => x.id === editingCustomId.value)
    if (c) {
      c.title = newCustomTitle.value.trim()
      c.text = text
      saveEnCustomStories()
      newCustomTitle.value = ''
      newCustomText.value = ''
      editingCustomId.value = null
      customEditorOpen.value = false
      return
    }
  }
  enCustomStories.value.push({
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
    title: newCustomTitle.value.trim(),
    text,
  })
  saveEnCustomStories()
  newCustomTitle.value = ''
  newCustomText.value = ''
  editingCustomId.value = null
  customEditorOpen.value = false
}
function removeEnCustomStory(id) {
  enCustomStories.value = enCustomStories.value.filter(c => c.id !== id)
  saveEnCustomStories()
}

// 解析英文句 → 单词数组。标点并入词尾（如 "cows," "today." "Look!"），
// 这样输入序列符合真实打字：cows, 打完字母后直接打逗号（无空格），再空格进下一词。
// 时间格式 12:00 / 6:30 作为整体保留（冒号是数字间分隔）。
function parseEnSentence(line) {
  const words = []
  // 词干（字母/数字/撇号，含时间 12:00）+ 尾部标点；孤立标点（句首等）也作为词
  const re = /[A-Za-z0-9']+(?::\d+)*[^A-Za-z0-9'\s]*|[^A-Za-z0-9'\s]+/g
  let m
  while ((m = re.exec(line))) {
    if (m[0]) words.push(m[0].toLowerCase())
  }
  return { words }
}

function parseCustomEnglish(text) {
  const lines = (text || '').split(/\n+/).map(l => stripDialogPrefix(l).trim()).filter(Boolean)
  const sentences = []
  let lastEnIndex = -1
  for (const line of lines) {
    const parsed = parseEnSentence(line)
    const words = parsed.words
    // 英文句判定：必须含英文字母（避免中文行里含 6:30 等数字被误判为英文）
    if (words.length >= 2 && /[A-Za-z]/.test(line)) {
      sentences.push({ words, cn: '' })
      lastEnIndex = sentences.length - 1
    } else if (lastEnIndex >= 0) {
      // 中文行：追加为最近英文句的翻译
      sentences[lastEnIndex].cn = (sentences[lastEnIndex].cn ? sentences[lastEnIndex].cn + ' ' : '') + line
    }
  }
  return sentences.filter(s => s.words.length > 0)
}

// 自定义内容 → 短文结构（保留原句大小写/标点，供短文模式整句流式+中文对照）
function parseCustomStory(text) {
  const lines = (text || '').split(/\n+/).map(l => stripDialogPrefix(l).trim()).filter(Boolean)
  const sentences = []
  let last = -1
  for (const line of lines) {
    const parsed = parseEnSentence(line)
    const words = parsed.words
    // 英文句判定：必须含英文字母（避免中文行里含 6:30 等数字被误判为英文）
    if (words.length >= 2 && /[A-Za-z]/.test(line)) {
      sentences.push({ en: line, words, cn: '' })
      last = sentences.length - 1
    } else if (last >= 0) {
      // 中文行：追加为最近英文句的翻译
      sentences[last].cn = (sentences[last].cn ? sentences[last].cn + ' ' : '') + line
    }
  }
  return sentences.filter(s => s.words.length > 0)
}
function startEnCustomPractice() {
  if (!enCustomText.value.trim()) return
  saveEnCustom()
  enStoryMode.value = false
  enMistakeMode.value = false
  enSlowMode.value = false
  enCustomMode.value = true
  start()
}
// 本次会话错词（完成弹窗展示 + 刻意练习用）：卡片/英文打错时收集，去重
const sessionMistakes = ref([])
const mistakePracticeMode = ref(false) // 是否在「本次错词刻意练习」中
function recordSessionMistake(word) {
  if (word && !sessionMistakes.value.includes(word)) sessionMistakes.value.push(word)
}
const enMistakeWords = computed(() =>
  Object.entries(enMastery)
    .filter(([, v]) => v === 'error' || v === 'slow')
    .map(([w]) => w)
)
function startEnMistakePractice() {
  enStoryMode.value = false
  enCustomMode.value = false
  enSlowMode.value = false
  enMistakeMode.value = true
  start()
}
function clearEnMistakes() {
  for (const w of enMistakeWords.value) delete enMastery[w]
  saveEnMastery()
}
// 慢词刻意练习：收录平均耗时超过阈值的词（{ avg, pass }）
// 过关：任何练习中，该词累计达标（无错且 avg≤阈值）repeat 次（默认 3）→ 移除（跨会话累计、不要求连续）
const EN_SLOW_KEY = 'sp-en-slowwords'
const enSlowWords = reactive(loadEnSlowWords())
const enSlowMode = ref(false) // 是否在慢词刻意练习中（专项队列）
function loadEnSlowWords() {
  try {
    const raw = JSON.parse(localStorage.getItem(EN_SLOW_KEY) || '{}')
    const out = {}
    for (const [w, v] of Object.entries(raw)) {
      out[w] = typeof v === 'number' ? { avg: v, pass: 0 } : v // 兼容旧格式
    }
    return out
  } catch { return {} }
}
function saveEnSlowWords() {
  try { localStorage.setItem(EN_SLOW_KEY, JSON.stringify(enSlowWords)) } catch {}
}
const enSlowList = computed(() =>
  Object.entries(enSlowWords).map(([w, v]) => ({ w, avg: v.avg, pass: v.pass || 0 })).sort((a, b) => b.avg - a.avg)
)
function recordSlowWord(word, avg) {
  if (!word || !Number.isFinite(avg)) return
  const threshold = settings.enPracticeMs || 300
  const cur = enSlowWords[word]
  if (cur !== undefined) {
    // 已在慢词清单：更新最近耗时；达标 → 累计过关次数，达满 repeat → 移除
    cur.avg = Math.round(avg)
    if (!enHadError.value && avg <= threshold) {
      cur.pass = (cur.pass || 0) + 1
      const repeat = Math.max(1, Math.min(20, Number(customRepeat.value) || 3))
      if (cur.pass >= repeat) {
        delete enSlowWords[word]
      }
    }
    saveEnSlowWords()
  } else if (avg > threshold) {
    enSlowWords[word] = { avg: Math.round(avg), pass: 0 }
    saveEnSlowWords()
  }
}
function startEnSlowPractice() {
  if (!enSlowList.value.length) return
  enStoryMode.value = false
  enCustomMode.value = false
  enMistakeMode.value = false
  enSlowMode.value = true
  start()
}
function clearEnSlowWords() {
  for (const k of Object.keys(enSlowWords)) delete enSlowWords[k]
  saveEnSlowWords()
}
// 完成弹窗「刻意练习本次错词」：卡片用错词建卡队列、英文用错词组句，各重复练到记牢
function startMistakePractice() {
  if (!sessionMistakes.value.length) return
  mistakePracticeMode.value = true
  restart()
}
function startEnWord() {
  // 进入新词前：跳过无需输入的标点词（独立 , . ?），它们只展示、不参与输入/计时
  enSkipOptionalWords()
  enWordStartTime.value = Date.now()
  enWordKeystrokes.value = 0
  // 上一个词刚完成：hadError 表示曾打错/揭示 —— 官网视为 typo 或首答失败
  // 曾用提示或宽松模式判错 → firstAttemptCorrect=false（none）
  // 仅打错后自行纠正 → typo（great）
  if (enHadError.value && !sentUsedHint.value) sentTypos.value++
  sentUsedHint.value = false // 提示标记随词走，跨词不累计（每词独立作答）
  enHadError.value = false // 每个新词开始时重置错误标记，避免残留影响下一个词的默写隐藏
  // 每个英文单词出现时朗读一遍（可设置关闭）；换句首词的朗读由整句朗读覆盖，不再单独读
  // 开启「整句后免单词预读」→ 所有单词输入前都不朗读（打错仍会纠音朗读）
  if (settings.enSpeakWords && !settings.enNoWordPreSpeak && !enSkipWordSpeak.value) speakEnglish(currentWord.value)
  enSkipWordSpeak.value = false
}

// 底部指标条左右箭头（上一句/下一句）：仅英文句序列（story/custom/错句/慢词组句）显示
const enHasSentenceNav = computed(() => (enQueue.value?.length || 0) > 1)
// 箭头切句：delta=-1 上一句 / +1 下一句（复用 jumpToSentence 的整句重置流程）
function arrowJumpSentence(delta) {
  if (!enHasSentenceNav.value) return
  enSentenceJumpTarget.value = sentenceIdx.value + 1 + delta
  jumpToSentence()
}

// 英文句子跳转：点击进度数字打开输入框
function openEnJumpInput() {
  enSentenceJumpTarget.value = sentenceIdx.value + 1
  enSentenceJumpOpen.value = true
  nextTick(() => {
    enJumpInput.value?.focus()
    enJumpInput.value?.select()
  })
}

// 确认跳转到目标句
function jumpToSentence() {
  enCombo.value = 0 // 跳句视为打断连击
  resetSentenceScoring()
  const target = enSentenceJumpTarget.value
  enSentenceJumpOpen.value = false
  if (!target || target < 1 || target > enQueue.value.length || target === sentenceIdx.value + 1) return
  const idx = target - 1
  sentenceIdx.value = idx
  wordIdx.value = 0
  letterIdx.value = 0
  currentInput.value = ''
  wordCompleted.value = false
  enWordAvgs.value = {}
  enSentenceDone.value = false
  enSentenceSpoken.value = false
  enGentleInputs.value = []
  enGentleErrors.value = {}
  enHadError.value = false
  enSkipWordSpeak.value = false
  // 与换句体验一致：开启整句朗读 → 朗读整句，首词不再单独朗读；150ms 视觉缓冲后开始首词
  if (settings.enSpeakSentence) {
    enSkipWordSpeak.value = true
    nextTick(() => setTimeout(() => speakWholeSentence(), 150))
  }
  nextTick(() => setTimeout(() => startEnWord(), 150))
}

// 宽松模式：整句完成后统一检查。首次检查把错词插入队尾第二行（重练区）并登记队列；
// 后续每轮句末只复查队列副本（words 只增不减，副本索引 = origLen + 队列序号，稳定可寻址），
// 未打对的词回退到该副本强制重打 —— 错词永远进不了完成界面（对齐官网：提交含错词被拦、需改正）
function checkGentleSentence() {
  const sentenceObj = enQueue.value[sentenceIdx.value]
  if (!sentenceObj) return false
  const words = enSentence.value
  const queue = sentenceObj.enRedoQueue
  if (!queue || !queue.length) {
    // ---- 扫描原词区（重练关闭时每轮到句末都走到这里；重练开启时这是首次检查）----
    enGentleErrors.value = {}
    sentenceObj.enRedoQueue = []
    let hasError = false
    let firstBad = -1
    words.forEach((w, wi) => {
      // 可忽略标点（句号/逗号/问号）双方都剥离后再比：展示但没打不算错，顺手打错了也不算错
      // 纯可忽略标点词（独立 , . ?）无需输入，直接跳过不检查
      const text = enCore(unitText(w))
      if (!text) return
      const input = enCore(enGentleInputs.value[wi] || '')
      const maxLen = Math.max(text.length, input.length)
      let wordError = false
      for (let li = 0; li < maxLen; li++) {
        if (input[li] !== text[li]) {
          enGentleErrors.value[`${wi}:${li}`] = true
          wordError = true
        }
      }
      // 更新会话统计
      enWordCount.value++
      if (!wordError) enFirstHitCount.value++
      if (wordError) {
        hasError = true
        if (firstBad < 0) firstBad = wi
        sentFirstTry.value = false // 宽松：整句内首次查出错词即首答失败（不等结算点，最终全对轮会漏判）
        const wKey = isPunct(w) ? text : stripPunct(text)
        progress.recordDailyWrongWord(wKey)
        recordSessionMistake(wKey)
        // 立即写入错题本（enMastery）：宽松模式下整句检查时就把错词入错题本
        enMastery[wKey] = 'error'
        saveEnMastery()
        // 错词处理按"错词重练"开关分流：
        // - 开启（重练）：插入句尾第二行重练区并登记队列复查（标点单元不重练）
        // - 关闭（跳过）：不插副本、不出现第二行 —— 由调用处把输入回退到最早错词就地重打
        if (settings.enRedoPractice && !isPunct(w)) {
          sentenceObj.redoWords = sentenceObj.redoWords || new Set()
          const redoWi = sentenceObj.words.length
          sentenceObj.redoWords.add(redoWi)
          sentenceObj.words.push(text)
          sentenceObj.enRedoQueue.push({ text, done: false, wi: redoWi })
        }
      }
    })
    if (hasError) {
      enHadError.value = true
      if (!settings.enRedoPractice && firstBad >= 0) {
        // 重练关闭：回退到最早打错的词，清空输入就地重打（错误字符已标红）。
        // 回退后该词成为当前词；其后方已打对的词由空格"滑过"逻辑自动完成，无需重打
        wordIdx.value = firstBad
        startEnWord()
        // 错误回放：先把打错的字母红字显示（不直接替换成正确字母），1 秒后自动清空回归初始
        startEnReplay(firstBad)
      }
    }
    // 重练开启：副本连续排在 origLen 起；wordIdx 仍停在旧句末 → 自然落到第一个副本等待输入
    return hasError
  }
  // ---- 后续轮：只复查重练队列里未 done 的副本；没打对的"交接"成新副本追加到队尾，再打一轮 ----
  enGentleErrors.value = {}
  let hasError = false
  const badQueue = [] // 未打对的队列序号（按原顺序）
  queue.forEach((q, qi) => {
    if (q.done) return
    const wi = q.wi
    const text = q.text
    const w = words[wi]
    if (!w) { q.done = true; return }
    const input = enCore(enGentleInputs.value[wi] || '')
    const maxLen = Math.max(text.length, input.length)
    let bad = false
    for (let li = 0; li < maxLen; li++) {
      if (input[li] !== text[li]) {
        enGentleErrors.value[`${wi}:${li}`] = true
        bad = true
      }
    }
    if (bad) { hasError = true; badQueue.push(qi) } else { q.done = true }
  })
  if (hasError) {
    // 未打对的副本：本轮视为"已交接"，把同样文本的新副本追加到句尾继续输入
    // （wordIdx 停在旧句末 = 第一个新副本位置，无需回退，已完成的其他词不受影响）
    const fresh = badQueue.map(qi => queue[qi].text)
    badQueue.forEach(qi => { queue[qi].done = true })
    for (const text of fresh) {
      sentenceObj.redoWords = sentenceObj.redoWords || new Set()
      const redoWi = sentenceObj.words.length
      sentenceObj.redoWords.add(redoWi)
      sentenceObj.words.push(text)
      queue.push({ text, done: false, wi: redoWi })
    }
  }
  return hasError
}

// 英文单词发音：有道词典 TTS 接口（参考 3002 的 audio-player.js，type=2 英音）
// 词出现时朗读；打错时 force 再次朗读提示正确发音
// 整句朗读：整句作一次请求先试有道原声，未收录回退系统语音连读
import { speakWord, speakSentence } from '../utils/tts.js'
const enSkipWordSpeak = ref(false) // 换句首词不单独朗读（该词已包含在整句朗读中）
let enLastSpokenKey = '' // 最近朗读的「词#句」避免重复
// 进入新句子时朗读整句（含单个单词的句子，如短文模式中的 "OK" "Sure"）
function speakWholeSentence() {
  if (!settings.enSpeakSentence) return
  const words = enSentence.value.filter((_, i) => !enRedoSet.value.has(i)).map(w => unitText(w)).filter(Boolean)
  if (!words.length) return
  speakSentence(words, settings.enTTSAccent || 'uk', enStoryMode.value ? 2 : 1)
}
function speakEnglish(word, force = false) {
  if (!word) return
  // 标点单元不朗读
  const w = isPunct(word) ? '' : stripPunct(unitText(word))
  if (!w) return
  const key = w + '#' + sentenceIdx.value
  // 同句同词不重复朗读（force=打错时强制朗读）
  if (!force && enLastSpokenKey === key) return
  enLastSpokenKey = key
  speakWord(w, settings.enTTSAccent || 'uk')
}

// 数字状态
const numQueue = ref([]) // [group] group: "4829"
const groupIdx = ref(0)
const digitIdx = ref(0)

// 字母键位状态
const letterQueue = ref([]) // ['afdjg', ...] 每组一串字母
const letterGroupIdx = ref(0)
const letterCharIdx = ref(0)
const letterLevel = ref('home') // 当前难度

// 拼音音节状态
const sylQueue = ref([]) // [{ letters, char }]
const sylIdx = ref(0)
const sylCharIdx = ref(0)

// 卡片状态（Anki 风格：单卡展示，错卡重练）
const cardQueue = ref([]) // [{ display, syllables: ['zhong','guo'], redo }]
const cardIdx = ref(0)
const cardSylIdx = ref(0) // 卡内当前音节
const cardCharIdx = ref(0) // 音节内当前字母
const cardType = ref('word') // 'word' | 'sentence' | 'custom' | 'mistake'
const wordGrade = ref('all') // 词语卡年级词库：'all' | 'g4' | 'g5' | 'g6'
const content = ref('all') // 当前内容源 id（CONTENT_TYPES）

// 根据持久化的内容源（含年级选择）初始化卡片类型/词库（onMounted 中 settings.load() 后调用）
function applyCardContent(id) {
  const c = CONTENT_TYPES.find(x => x.id === id) || CONTENT_TYPES[0]
  content.value = c.id
  cardType.value = c.cardType
  wordGrade.value = c.grade || 'all'
}
const currentCardHadError = ref(false) // 当前卡是否出过错（用于错卡重练）
// 隐藏字母模式下，记录每个位置打错的字母（key: `${sylIdx}-${charIdx}`），用于警告色提示
const cardWrongMap = reactive({})

// 自定义词表（刻意练习：固定词反复打）——内容持久化到 localStorage
const CUSTOM_CACHE_KEY = 'sp-custom-cards'
function loadCustomCache() {
  try {
    const raw = localStorage.getItem(CUSTOM_CACHE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch { return {} }
}
const customCache = loadCustomCache()
const customCardsInput = ref(customCache.text || '')
const customRepeat = ref(Number(customCache.repeat) || 3) // 每词重复遍数
function saveCustomCache() {
  try {
    localStorage.setItem(CUSTOM_CACHE_KEY, JSON.stringify({ text: customCardsInput.value, repeat: customRepeat.value }))
  } catch {}
}
watch([customCardsInput, customRepeat], saveCustomCache)
const isCustomPanel = computed(() => mode.value === 'cards' && cardType.value === 'custom' && !started.value)
// 英文族练习模式（单词/短文/错词本）：共用整套英文练习界面与逻辑
const isEnPractice = computed(() => mode.value === 'words' || mode.value === 'stories' || mode.value === 'mistake-book')

// 各模式的错题重练标记：当前单元（词/数字/字母/音节）是否出过错
const enSentenceSpoken = ref(false) // 当前句是否已播放过整句语音（避免重练完成时重复播放）
const enHadError = ref(false)
// 宽松模式：保存每个单词的用户输入（用于整句完成时统一检查）
const enGentleInputs = ref([]) // { wordIdx: inputString }
// 宽松模式：整句检查后的错误位置标记
const enGentleErrors = ref({}) // { "wi:li": true } for wrong characters
// ---- 宽松+跳过：错词"错误回放"——回退到错词时先把打错的字母红字显示 1 秒，再回归初始待输入 ----
const enReplayWi = ref(-1) // 正在回放的词索引（-1 = 无）
let enReplayTimer = 0
const EN_REPLAY_MS = 1000

// 开始回放词 wi 的错误输入（红字显示用户打错的内容，不替换成正确字母）
function startEnReplay(wi) {
  if (!settings.enGentleMode || settings.enRedoPractice) return
  const wrong = enGentleInputs.value[wi] || ''
  if (wrong === '') return
  clearTimeout(enReplayTimer)
  enReplayWi.value = wi
  currentInput.value = wrong // 显示用户打错的内容
  letterIdx.value = wrong.length
  enReplayTimer = setTimeout(() => clearEnReplay(wi), EN_REPLAY_MS)
}
// 结束回放：清定时器；wi>=0 时让该词回归初始未输入状态（清输入/该词红标，作为重打起点）
function clearEnReplay(wi) {
  clearTimeout(enReplayTimer)
  if (wi < 0 || enReplayWi.value === wi) enReplayWi.value = -1
  if (wi >= 0) {
    if (wordIdx.value === wi) {
      currentInput.value = ''
      letterIdx.value = 0
    }
    enGentleInputs.value[wi] = ''
    for (const k of Object.keys(enGentleErrors.value)) {
      if (k.startsWith(`${wi}:`)) delete enGentleErrors.value[k]
    }
  }
}
// 宽松模式：标记是否已执行过整句检查（避免重练时再次检查导致重复插入错词）
// 英文句子跳转：点击进度数字直接输入目标句号
const enSentenceJumpOpen = ref(false)
const enSentenceJumpTarget = ref(1)
const enJumpInput = ref(null)
// 英文会话统计（完成弹窗展示）：一次命中率 / 查看答案 / 重听 / 平均每词用时
const enWordCount = ref(0) // 完成词数（含重练）
const enFirstHitCount = ref(0) // 一次命中：该词完成时无打错且未查看答案
const enViewAnswers = ref(0)
const enRelistens = ref(0)
const enWordTimeSum = ref(0) // 词总用时（ms）
const enFirstHitRate = computed(() => enWordCount.value ? Math.round((enFirstHitCount.value / enWordCount.value) * 100) : 100)
// 又错数 = 答错的词数（答题数 - 一次命中数）：与「答对」徽章配对，两者相加 = 答题数
const enWrongCount = computed(() => Math.max(0, enWordCount.value - enFirstHitCount.value))
const enAvgWordTime = computed(() => enWordCount.value ? Math.round(enWordTimeSum.value / enWordCount.value) : 0)
// 「查看答案」可点条件：当前词处于默写隐藏（字母本就没有显示）且尚未揭示（标点单元不可查看）
const enCanViewAnswer = computed(() => {
  const w = currentWord.value
  if (isPunct(w)) return false
  const k = stripPunct(unitText(w))
  return !!k && settings.enDisplayMode !== 'guide' && (dictWords.value.has(k) || settings.enDisplayMode === 'dictation') && !enHadError.value
})
function enViewAnswer() {
  if (!enCanViewAnswer.value) return
  enViewAnswers.value++
  sentUsedHint.value = true // 官网 hintsUsed>0 → rating none
  enHadError.value = true // 复用打错揭示机制：当前词立即显示；完成时判错、不算一次命中
}
function enRelisten() {
  const w = currentWord.value
  if (isPunct(w)) return
  const k = stripPunct(unitText(w))
  if (!k) return
  enRelistens.value++
  speakEnglish(k, true) // force=true：同词重听也朗读
}
const numHadError = ref(false)
const letterHadError = ref(false)
const sylHadError = ref(false)

// 外部键盘状态（受控展示模式）：按压 Set + 闪光 Map，由页面 keydown/keyup 与提交结果驱动
const keyPressed = reactive(new Set())
const flashState = reactive(new Map())
const flashTimers = new Map()

function flashKey(code, kind) {
  flashState.set(code, kind)
  if (flashTimers.has(code)) clearTimeout(flashTimers.get(code))
  flashTimers.set(code, setTimeout(() => {
    if (flashState.get(code) === kind) flashState.delete(code)
    flashTimers.delete(code)
  }, kind === 'ok' ? 220 : 280))
}

const newAchievements = ref([])

// 完成浮层「再来一次」按钮引用（自动聚焦以支持键盘操作）
const restartBtnRef = ref(null)

// 完成时自动聚焦主按钮，方便直接空格/回车再来一次
watch(completed, async (v) => {
  if (v) {
    await nextTick()
    restartBtnRef.value?.focus()
  }
})

const enSentence = computed(() => enQueue.value[sentenceIdx.value]?.words || [])
// 词 wi 之前的标点（已并入单词，此函数保留为空，兼容旧引用）
function punctAt(wi) { return '' }
const enTrailingPunct = computed(() => '')

// 字符 → 期望键盘键（KeyboardEvent.code）。标点并入单词后，标点字符也要能对应到键盘键输入
function charToKey(ch) {
  if (!ch) return null
  if (/[a-zA-Z]/.test(ch)) return 'Key' + ch.toUpperCase()
  if (/[0-9]/.test(ch)) return 'Digit' + ch
  const map = {
    ',': 'Comma', '.': 'Period', '/': 'Slash', ';': 'Semicolon', "'": 'Quote',
    '[': 'BracketLeft', ']': 'BracketRight', '\\': 'Backslash', '-': 'Minus', '=': 'Equal',
    '!': 'Digit1', '@': 'Digit2', '#': 'Digit3', '$': 'Digit4', '%': 'Digit5',
    '^': 'Digit6', '&': 'Digit7', '*': 'Digit8', '(': 'Digit9', ')': 'Digit0',
    ':': 'Semicolon', '?': 'Slash', '"': 'Quote', '_': 'Minus', '+': 'Equal',
    '{': 'BracketLeft', '}': 'BracketRight', '|': 'Backslash', '<': 'Comma', '>': 'Period', '~': 'Backquote',
    '`': 'Backquote', ' ': 'Space', '\t': 'Tab', '\n': 'Enter', '\r': 'Enter',
  }
  return map[ch] || null
}
// Shift 组合键：Digit/标点键按住 Shift 时打出的符号（'%'=Shift+5、':'=Shift+; 等）
const SHIFT_CODE_CHARS = {
  Digit1: '!', Digit2: '@', Digit3: '#', Digit4: '$', Digit5: '%', Digit6: '^',
  Digit7: '&', Digit8: '*', Digit9: '(', Digit0: ')',
  Semicolon: ':', Quote: '"', Slash: '?', Comma: '<', Period: '>',
  Minus: '_', Equal: '+', BracketLeft: '{', BracketRight: '}', Backslash: '|', Backquote: '~',
}
// 标准 US 布局不需 Shift 即可打出的字符（字母/数字/无 Shift 形态的符号）
const NO_SHIFT_CHARS = new Set("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 ,.;'/[]\\-=" + '`')
// 目标字符是否必须按 Shift 才能输入（% @ # ^ & * ( ) : ? 等）
function needsShift(ch) { return !NO_SHIFT_CHARS.has(ch) }
// 键盘键 → 字符（宽松模式记录实际输入用；标点键反查，Shift 组合键按 shiftKey 还原符号）
function codeToChar(code, shiftKey) {
  if (code.startsWith('Key')) return code.replace('Key', '').toLowerCase()
  if (shiftKey && SHIFT_CODE_CHARS[code]) return SHIFT_CODE_CHARS[code]
  if (/^Digit/.test(code)) return code.replace('Digit', '')
  const map = {
    Comma: ',', Period: '.', Slash: '/', Semicolon: ';', Quote: "'",
    BracketLeft: '[', BracketRight: ']', Backslash: '\\', Minus: '-', Equal: '=',
    Backquote: '`', Space: ' ', Enter: '\n', Tab: '\t',
  }
  return map[code] || ''
}
// 当前句的重练词索引集合（出错后自动补练的词，样式区分）
const enRedoSet = computed(() => {
  const s = enQueue.value[sentenceIdx.value]
  if (!s) return new Set()
  // 显式追踪 words 长度和 redoWords 内容变化，确保模板正确渲染
  s.words.length
  if (s.redoWords) s.redoWords.size
  return s.redoWords ? new Set(s.redoWords) : new Set()
})
// 当前句的中文翻译（自定义模式：解析的句对翻译；词库模式为空）
const enSentenceCn = computed(() => enQueue.value[sentenceIdx.value]?.cn || '')

// ---- 整句完成态逐词解析（julebu 全字段课包：词性 + 句子成分）----
// POS（词性）→ 中文名：850 词包 pos 全集 + 通用兜底
const POS_CN = {
  NOUN: '名词', VERB: '动词', AUX: '助动词', ADJ: '形容词', ADV: '副词',
  PRON: '代词', DET: '限定词', ADP: '介词', CCONJ: '连词', SCONJ: '连词',
  PART: '小品词', INTJ: '叹词', PROPN: '专有名词', PROPN_PERSON: '人名', NUM: '数词',
  X: '其他', PUNCT: '标点', '.': '标点', '': '',
}
// 句子成分 type（英文标签）→ 中文（sentenceStructure.type / dependencyAnalysis 用）
const COMP_CN = {
  subject: '主语', predicate: '谓语', predicative: '表语', object: '宾语',
  indirectObject: '间接宾语', adverbial: '状语', attributive: '定语',
  complement: '补语', conjunction: '连词', root: '主干',
  nsubj: '主语', aux: '助动词', det: '限定词', amod: '定语', obl: '状语',
  case: '介词', cop: '系动词', advmod: '状语', compound: '复合词',
  dep: '依存', '': '',
}
// ---- 官网风格配色（取自 julebu.co 练习页 DOM，2026-09-03）----
// 成分（组框/胶囊）实色；边框用同色 50% 透明
const COMP_COLORS = {
  subject: '#b45309',        // 琥珀（官网实测）
  predicate: '#be123c',      // 玫瑰（官网实测）
  predicative: '#7c3aed',    // 紫（官网实测）
  object: '#059669', indirectObject: '#0d9488',
  adverbial: '#0369a1', attributive: '#db2777',
  complement: '#ea580c', conjunction: '#64748b',
  root: '#475569',
}
// 词性 → 词下方下划线色（tailwind-500 系；前五个官网实测）
const POS_COLORS = {
  PRON: '#ef4444',   // 代词 红（官网实测）
  AUX: '#22c55e',    // 助动词 绿（官网实测）
  PART: '#6b7280',   // 小品词 灰（官网实测）
  DET: '#14b8a6',    // 限定词 teal（官网实测）
  NOUN: '#3b82f6',   // 名词 蓝（官网实测）
  VERB: '#f97316', ADJ: '#ec4899', ADV: '#8b5cf6', ADP: '#a855f7',
  CCONJ: '#eab308', SCONJ: '#eab308', INTJ: '#f43f5e',
  PROPN: '#0ea5e9', PROPN_PERSON: '#0ea5e9', NUM: '#84cc16',
  X: '#9ca3af', PUNCT: '#9ca3af',
}

// 整句完成态 → 官网式"成分组框"结构：按 sentenceStructure 区间把词分进各成分组。
// 每组 = { role(中文), color, explanation, words: [{word, ph, def, pos, posCn, posColor}] }
const enSentenceGroups = computed(() => {
  const s = enQueue.value[sentenceIdx.value]
  const meta = s?.meta
  if (!meta) return []
  const wds = meta.wordDetails || []
  const comps = (meta.sentenceStructure || []).filter(c => typeof c.start === 'number')
  // 官网个别单元连词级词典都没给（如星荣包的单词卡 like/don't，源句就是孤词）：
  // 从课内词典兜底取词性/释义/音标把词卡撑起来（词性取不到就只显示词义）
  if (!wds.length) {
    const words = enSentence.value
      .filter(w => !isPunct(w))
      .map(w => {
        const body = String(unitText(w)).trim()
        if (!body) return null
        const lower = body.toLowerCase().replace(/[.,!?;:"]+$/, '')
        const de = currentCourseDict.value[lower]
        const pos = de?.pos || de?.partOfSpeech || ''
        const defRaw = de?.definition ?? de?.cn ?? ''
        const def = Array.isArray(defRaw) ? (defRaw[0] || '') : String(defRaw || '')
        let ph = ''
        if (de?.phonetic) {
          const p = de.phonetic
          ph = (p && typeof p === 'object') ? (p.us || p.uk || '') : String(p || '')
        }
        return {
          word: body,
          punct: '',
          ph: ph ? '/' + ph + '/' : '',
          // 兜底：单卡（词级练习）且课内词典没命中时，用本句翻译当词义（like → 喜欢）
          def: def || (enSentence.value.length === 1 ? String(enQueue.value[sentenceIdx.value]?.cn || '') : ''),
          pos,
          posCn: POS_CN[pos] || '',
          posColor: POS_COLORS[pos] || '#9ca3af',
        }
      })
      .filter(Boolean)
    if (!words.length) return []
    return [{ role: '', type: '', color: '#64748b', explanation: '', words }]
  }
  // 有词但官网没给成分结构（如老友记"对话版无拆解"包）时，不早退——全部词平铺成
  // 一整组无框词卡（词性下划线/释义/音标照常，无主语谓语分组框）
  // 官网结构区间 [start,end] 索引的是“纯词序列”（wordDetails 不含标点，如
  // "No , I am not the teacher" 逗号前后带空格）。若把原句标点切成独立 token，
  // 全部区间会错位一格（逗号被当成主语）。这里按空白拆词，把每个词后紧跟的
  // 标点收进 puncts（不占词索引位），保证与 wordDetails / sentenceStructure 对齐。
  // 标点归一：全角 → 半角（否则问号等会 fallback 到中文字体，字形高度/基线全歪）
  const full2half = { '，': ',', '。': '.', '？': '?', '！': '!', '；': ';', '：': ':', '、': ',',
    '“': '"', '”': '"', '‘': "'", '’': "'", '（': '(', '）': ')', '【': '[', '】': ']',
    '《': '<', '》': '>', '…': '...', '—': '-', '–': '-' }
  const normPunct = (s) => String(s || '').split('').map(ch => full2half[ch] || ch)
    .join('').replace(/[^.,!?;:'"()<>\[\]…—-]+/g, '')
  const bodies = []   // 词正文（保留原大小写，不含标点）
  const puncts = []   // 紧跟每个词之后的标点串（原句顺序）
  const rawToks = String(meta.sentenceEn || '').split(/\s+/).filter(Boolean)
  for (const tok of rawToks) {
    const m = /^[A-Za-z0-9']+/.exec(tok)
    if (m) {
      bodies.push(m[0])
      puncts.push(normPunct(tok.slice(m[0].length)))
    } else if (bodies.length) {
      // 独立标点 token（如官网 "No , I …" 的逗号）挂到上一个词尾，不新增词位
      puncts[puncts.length - 1] += normPunct(tok)
    }
  }
  // 兜底：分词数与词典词数不一致时（罕见脏数据），以词典词序为准保索引不歪
  if (bodies.length !== wds.length && wds.length) {
    bodies.splice(0, bodies.length, ...wds.map(w => String(w.word || '')))
    puncts.splice(0, puncts.length, ...bodies.map(() => ''))
  }
  // wordDetails 词根 → 条目
  const wdMap = new Map()
  for (const wd of wds) {
    const k = String(wd.word || '').toLowerCase().replace(/[.,!?;:"]+$/, '')
    if (k && !wdMap.has(k)) wdMap.set(k, wd)
  }
  const mkWord = (body, tail) => {
    const text = String(body || '').toLowerCase().replace(/[.,!?;:"]+$/, '')
    const wd = wdMap.get(text)
    const pos = wd?.pos || wd?.partOfSpeech || ''
    const cnRaw = wd?.definition || ''
    const def = Array.isArray(cnRaw) ? (cnRaw[0] || '') : cnRaw
    const ph = wd?.phonetic
    const phStr = (ph && typeof ph === 'object') ? (ph.us || ph.uk || '') : (ph || '')
    return {
      word: body || text,
      punct: tail || '',                       // 词后标点：行内同基线展示，不参与成分/词性标记
      ph: phStr ? '/' + phStr + '/' : '',
      def,
      pos,
      posCn: POS_CN[pos] || (pos ? pos.toLowerCase() : ''),
      posColor: POS_COLORS[pos] || '#9ca3af',
    }
  }
  // 词/语块级拆解练习（官网把整句按难度拆开挂同一源句，如 "do you have…" 的 do/you/have…）：
  // 完成态只平铺当前练习的词卡本身（词性/释义/音标照常），不把整个源句的成分结构图弹出来
  if (s && s.fullSentence === false) {
    const words = enSentence.value
      .filter(w => !isPunct(w))
      .map(w => mkWord(String(unitText(w)).trim(), ''))
      .filter(w => w.word)
    if (!words.length) return []
    return [{ role: '', type: '', color: '#64748b', explanation: '', words }]
  }
  // 词按成分区间分组成 keep 顺序（未覆盖区间的词塞进最后组 / 独立组）
  const groups = []
  const used = new Array(bodies.length).fill(false)
  for (const c of comps) {
    const words = []
    for (let i = c.start; i <= (c.end ?? c.start) && i < bodies.length; i++) {
      words.push(mkWord(bodies[i], puncts[i]))
      used[i] = true
    }
    if (words.length) {
      groups.push({ role: c.role || COMP_CN[c.type] || '', type: c.type || '', color: COMP_COLORS[c.type] || '#64748b', explanation: c.explanation || '', words })
    }
  }
  const loose = []
  bodies.forEach((b, i) => { if (!used[i]) loose.push(mkWord(b, puncts[i])) })
  if (loose.length) {
    if (groups.length) groups[groups.length - 1].words.push(...loose)
    else groups.push({ role: '', color: '#64748b', explanation: '', words: loose })
  }
  return groups
})
// ---- 单词中文释义：优先当前课词典（释义跟课文走），未命中才走有道 suggest ----
// 响应式：查询返回后更新 ref 触发模板重渲染；结果同时进 enTranslation 模块的缓存
const extraCn = ref({}) // 单词 -> 查询到的中文（响应式）

// 词形变化反查：students → student、going → go，尽量命中课内词典原词
const SIMPLE_PLURAL = /^(.+?)(s|es)$/ // 复数 → 单数（粗略）
function normalizeWordForm(word) {
  const w = String(word || '').toLowerCase()
  if (!w) return ''
  // 词典优先直接命中（含大小写归一），否则试常见变化：去 s/es（复数）
  const candidates = [w]
  const m = w.match(/^(.+?)(s|es)$/)
  if (m) candidates.push(m[1])
  // he's → he / is 等缩写拆不开就不猜，交给有道兜底
  return w
}
// 查词主流程：本地课词典 → 有道
async function lookupWordCn(w) {
  const key = String(w || '').trim()
  if (!key) return
  const lower = key.toLowerCase()
  if (extraCn.value[lower] !== undefined) return // 已查询过（含空结果，避免重复请求）
  // 1) 当前课词典（释义跟课文走，词形原词直接命中）
  const localDict = currentCourseDict.value
  const direct = localDict[lower]
  const dictEntry = direct || localDict[normalizeWordForm(lower)] || null
  if (dictEntry && dictEntry.cn) {
    extraCn.value[lower] = dictEntry.cn
    return
  }
  // 2) 兜底：有道 suggest
  const cn = await fetchEnTranslation(key)
  if (cn) extraCn.value[lower] = cn
  else extraCn.value[lower] = '' // 记录空结果防抖（本次会话不再重复请求）
}
// 渲染函数：异步缓存 → 空（标点单元无释义，单词剥离标点后查）
function wordCn(w) {
  if (isPunct(w)) return ''
  const key = stripPunct(unitText(w)).trim()
  if (!key) return ''
  return extraCn.value[key.toLowerCase()] || ''
}
// 触发查询：单词进入视野（当前句/错题本/结果弹窗）时批量查
function ensureCnForWords(words) {
  if (!Array.isArray(words)) return
  const seen = new Set()
  for (const w of words) {
    if (isPunct(w)) continue
    const key = stripPunct(unitText(w)).trim().toLowerCase()
    if (!key || seen.has(key)) continue
    seen.add(key)
    if (extraCn.value[key] === undefined) lookupWordCn(key)
  }
}

// 句子进入视野：预查未收录单词的中文（异步补全，不阻塞输入）
watch(
  enSentence,
  (words) => { ensureCnForWords(words) },
  { immediate: true }
)
// 错题本/完成弹窗打开时也触发查询（错词可能有未收录词）
watch(completed, (v) => {
  if (v) ensureCnForWords(sessionMistakes.value)
})

// 单行布局：横向滚动 + 左侧淡出，自动把当前词滚到可视区
// （放在 enSentence 之后，避免 watch 源在 setup 阶段先于声明求值）
const enSentenceRef = ref(null)
const enSentenceRedoRef = ref(null)
// 左侧淡出只在实际滚动后出现（scrollLeft > 0）：
// 未滚动时第一个词位于最左边，不能被遮罩淡出
const enSentenceScrolled = ref(false)
function onEnSentenceScroll() {
  const el = enSentenceRef.value
  enSentenceScrolled.value = !!el && el.scrollLeft > 0
}
// 滚动到当前词：普通词滚第一行，重练词滚第二行；用 data-wi 精确定位
function scrollToCurrentWord() {
  const target = wordIdx.value
  const isRedo = enRedoSet.value.has(target)
  const el = (isRedo ? enSentenceRedoRef.value : enSentenceRef.value)
  if (!el) return
  const cur = el.querySelector(`.word-col[data-wi="${target}"]`)
  if (!cur) return
  const t = cur.offsetLeft - (el.clientWidth - cur.offsetWidth) + 48
  el.scrollTo({ left: Math.max(0, t), behavior: 'smooth' })
}
// 当前词/句子/重练词数量变化时：滚动到当前词
watch(
  [wordIdx, sentenceIdx, () => enSentence.value.length],
  () => { nextTick(() => scrollToCurrentWord()) }
)
const currentWord = computed(() => enSentence.value[wordIdx.value] || '')
// 输入单元：字符串=单词，对象{p}=独立标点单元
const isPunct = u => !!(u && typeof u === 'object' && u.p)
const unitText = u => isPunct(u) ? u.p : String(u || '')
// 剥离词首词尾标点（保留内部撇号/时间冒号）：cows,→cows, today.→today, (hello)→hello, 12:00→12:00
function stripPunct(word) {
  return String(word || '').replace(/^[^A-Za-z0-9']+|[^A-Za-z0-9']+$/g, '')
}
// 可忽略标点（句中展示但无需输入）：句号/逗号/问号/感叹号。
// 撇号（you'll / What's）、冒号（7:30）等仍必须输入。
const EN_OPTIONAL_PUNCT = new Set([',', '.', '?', '!'])
// 单词的必需输入核心：去掉可忽略标点（class.→class；独立的 , . ? → ''；you'll / 7:30 原样保留）
function enCore(word) {
  const s = String(word || '')
  let out = ''
  for (let i = 0; i < s.length; i++) {
    if (!EN_OPTIONAL_PUNCT.has(s[i])) out += s[i]
  }
  return out
}
function enCoreLen(word) { return enCore(word).length }
// 滑过无需输入的标点词（数据里独立出现的 , . ? 词单元，如 "May I come in ?" 的 "?"）：
// 不要求用户输入也不等额外空格，自动推进到下一个真正需要输入的词
function enSkipOptionalWords() {
  let guard = 0
  while (wordIdx.value < enSentence.value.length && enCore(unitText(enSentence.value[wordIdx.value])) === '' && guard++ < 100) {
    wordIdx.value++
    completedUnits.value++ // 与旧口径一致：每个显示单元记一个完成位（仅进度展示）
  }
}
// 已掌握（默写）单词集合
const dictWords = computed(() => new Set(Object.entries(enMastery).filter(([, v]) => v === 'mastered' || v === true).map(([k]) => k)))
// 掌握档位：'error' | 'slow' | 'normal' | 'mastered'（兼容旧布尔值）
function masteryTier(word) {
  const v = enMastery[stripPunct(unitText(word))]
  if (v === 'mastered' || v === true) return 'mastered'
  if (v === 'error' || v === false) return 'error'
  if (v === 'slow') return 'slow'
  return 'normal'
}
const currentGroup = computed(() => numQueue.value[groupIdx.value] || '')
const currentLetterGroup = computed(() => letterQueue.value[letterGroupIdx.value] || '')
const currentSyllable = computed(() => sylQueue.value[sylIdx.value] || null)
const currentCard = computed(() => cardQueue.value[cardIdx.value] || null)
// 卡片模式：隐藏拼音字母提示，只显示横线位置；正确输入后展示字母，错误用警告色标出（由设置 cardHideLetters 控制）
const hideLetters = computed(() => settings.cardHideLetters)

// 单个字母的显示状态：typed=已正确输入，current=当前位置，blind=隐藏（仅横线），wrong=打错（警告色，显示的是正确字母）
function cardLetterState(si, li) {
  const typed = si < cardSylIdx.value || (si === cardSylIdx.value && li < cardCharIdx.value)
  const current = si === cardSylIdx.value && li === cardCharIdx.value
  const wrongLetter = cardWrongMap[`${si}-${li}`] || ''
  return {
    typed,
    current,
    blind: hideLetters.value && !typed && !(current && wrongLetter),
    wrong: hideLetters.value && current && !!wrongLetter,
  }
}
const cardLetterStates = computed(() => {
  const map = {}
  const card = currentCard.value
  if (!card) return map
  for (let si = 0; si < card.syllables.length; si++) {
    for (let li = 0; li < card.syllables[si].length; li++) {
      map[`${si}-${li}`] = cardLetterState(si, li)
    }
  }
  return map
})
function clearCardWrongMap() {
  for (const k in cardWrongMap) delete cardWrongMap[k]
}

const accuracy = computed(() => {
  if (totalCount.value === 0) return 100
  return Math.round((correctCount.value / totalCount.value) * 100)
})
const speed = computed(() => {
  // 先访问 completedUnits 确保依赖被收集（避免首次求值早退导致缓存永不失效）
  const units = completedUnits.value
  if (!sessionStart.value) return 0
  const mins = (Date.now() - sessionStart.value) / 60000
  if (mins <= 0) return 0
  // 速度 = 字符数 ÷ 分钟（与历史记录口径一致：字符/分，而非词/分）
  return Math.round((stats.sessionChars || 0) / mins)
})
const sessionBest = computed(() => bestTimes[mode.value] || null)

// 当前模式的下一个推荐模式（"换个模式"按钮用）
// 英文相关模式一组，其余模式一组，避免从英文跳到数字等不相关模式
const EN_MODES = ['words', 'stories', 'mistake-book']
const OTHER_MODES = ['cards', 'numbers', 'letters', 'syllables']
const nextMode = computed(() => {
  const group = EN_MODES.includes(mode.value) ? EN_MODES : OTHER_MODES
  const idx = group.indexOf(mode.value)
  return group[(idx + 1) % group.length]
})

// 当前模式的标题/描述（顶部标题区展示）
const activeModeLabel = computed(() => MODES.find(m => m.id === mode.value)?.label || '常规打字练习')
const activeModeDesc = computed(() => MODES.find(m => m.id === mode.value)?.desc || '')

function formatDuration(sec) {
  sec = Math.max(0, Math.floor(sec || 0))
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = sec % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${m}:${String(s).padStart(2, '0')}`
}

function startElapsedTimer() {
  stopElapsedTimer()
  elapsedSec.value = 0
  elapsedTimer = setInterval(() => { elapsedSec.value++ }, 1000)
}

function stopElapsedTimer() {
  if (elapsedTimer) {
    clearInterval(elapsedTimer)
    elapsedTimer = null
  }
}

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function buildEnglishQueue() {
  // 参考 localhost:3002：把所选词库的单词随机组成若干句（每句 4~7 词），整句流式练习
  // 短文模式：直接返回所选短文的句子（英文句逐词 + 中文翻译）
  if (enStoryMode.value && selectedEnStory.value) {
    return selectedEnStory.value.sentences.map(s => {
      const q = {
        words: parseEnSentence(s.en).words,
        cn: s.cn || '',
      }
      // julebu 课包：附带逐词解析元数据（词性/成分），整句完成态展示用
      if (s.meta) q.meta = s.meta
      // 官网按难度拆出的 word/chunk/phrase 级单元：整句完成态不该弹源句成分结构图
      if (typeof s.fullSentence === 'boolean') q.fullSentence = s.fullSentence
      return q
    }).filter(s => s.words.length > 0)
  }
  // 自定义模式：直接返回粘贴内容解析出的句子（保持原文顺序，含中文翻译）
  if (enCustomMode.value) {
    const parsed = parseCustomEnglish(enCustomText.value)
    return parsed.map(s => ({ words: s.words, cn: s.cn || '' }))
  }
  // 慢词刻意练习：每个慢词单独一行，行内连续重复 N 遍（高频重复，默认 3 遍可调）
  if (enSlowMode.value) {
    const pool = Object.keys(enSlowWords)
    if (pool.length) {
      const repeat = Math.max(1, Math.min(20, Number(customRepeat.value) || 3))
      return shuffle(pool).map(w => ({ words: Array(repeat).fill(w), cn: '' }))
    }
  }
  // 掌握度加权随机：错词权重最高（5x）、正常 2x、掌握最低（1x），错词更常出现
  // 错题本模式：只用错词池（error/slow 词），打对自动移出错题
  // 刻意练习：只用本次会话错词（完成弹窗进入）
  let pool = mistakePracticeMode.value
    ? [...sessionMistakes.value]
    : enMistakeMode.value
      ? [...enMistakeWords.value]
      : (enGrade.value === 'all' ? EN_WORDS : GRADE_EN_WORDS[enGrade.value])
  if ((enMistakeMode.value || mistakePracticeMode.value) && pool.length < 3) {
    const base = enGrade.value === 'all' ? EN_WORDS : GRADE_EN_WORDS[enGrade.value]
    for (const w of (base || EN_WORDS)) {
      if (!pool.includes(w)) pool.push(w)
      if (pool.length >= 6) break
    }
  }
  const expanded = []
  for (const w of (pool || EN_WORDS)) {
    const n = EN_TIER_WEIGHT[masteryTier(w)] || 2
    for (let i = 0; i < n; i++) expanded.push(w)
  }
  const words = shuffle(expanded)
  const sentences = []
  let i = 0
  while (i < words.length && sentences.length < 6) {
    // 错题池可能很小：每句长度不超过池大小，保证能组成句
    const poolSize = (enMistakeMode.value || mistakePracticeMode.value) ? pool.length : Infinity
    const n = Math.min(4 + Math.floor(Math.random() * 4), poolSize || 1) // 4~7（错词池小时取小）
    const slice = []
    const seen = new Set()
    while (slice.length < n && i < words.length) {
      const w = words[i++]
      if (seen.has(w)) continue // 同一句内不重复
      seen.add(w)
      slice.push(w)
    }
    if (slice.length < 2) break
    sentences.push({ words: slice })
  }
  return sentences
}

// 词根结构：返回 { 位置: 'pre'|'root'|'root2'|'suf' } 映射（长度=词长），复杂词按词根区分灰色深浅
// 复合词多个词根：第一个=root（中性灰），后续=root2（青绿灰），色相上有区别
function wordSegmentMap(word) {
  const segs = WORD_SEGMENTS[word]
  const map = {}
  if (!segs) return map
  let pos = 0
  let rootCount = 0
  for (const [text, type] of segs) {
    if (type === 'root') rootCount++
    const cls = type === 'prefix' ? 'pre' : type === 'suffix' ? 'suf' : rootCount === 1 ? 'root' : 'root2'
    for (let i = 0; i < text.length; i++) map[pos + i] = cls
    pos += text.length
  }
  return map
}
// 当前句各词的词根映射（标点单元跳过）
const enSegments = computed(() => {
  const map = {}
  for (const w of enSentence.value) {
    if (isPunct(w)) continue
    const k = stripPunct(w)
    map[k] = wordSegmentMap(k)
  }
  return map
})

// 当前句各词的音节映射：{ word: { letterIndex: syllableIndex } }
const enSyllableMap = computed(() => {
  const map = {}
  for (const w of enSentence.value) {
    if (isPunct(w)) continue
    const k = stripPunct(w)
    map[k] = getSyllableMap(k)
  }
  return map
})

// 单词内字母状态（参考 localhost:3002：correct/current/incorrect）
// 已掌握单词（dict）：未输入字母隐藏为横线（看中文默写）；打错后临时揭示
// 宽松模式：该词已在整句输入中输入正确（用于光标之后保持"已完成"观感/容器样式）
function enDoneByInput(wi) {
  if (!settings.enGentleMode) return false
  const u = enSentence.value[wi]
  if (!u) return false
  const wc = enCore(unitText(u))
  if (!wc) return false
  const inp = enCore(enGentleInputs.value[wi] || '')
  return inp !== '' && inp === wc
}

function letterClass(wi, li) {
  const unit = enSentence.value[wi]
  const word = unitText(unit)
  const ch = word[li]
  // 标点字符：不参与着色/默写隐藏，但参与 正确/当前/完成 状态标记
  const isPunctCh = !/[A-Za-z0-9']/.test(ch)
  // 宽松模式：重练单词强制为默写状态（隐藏字母，凭记忆打）
  const isRedoWord = enRedoSet.value.has(wi)
  // 宽松模式重练词：强制 dict（不受 enHadError 影响，永远隐藏字母）
  const forceDict = settings.enGentleMode && isRedoWord
  const dict = !isPunctCh && settings.enDisplayMode !== 'guide' && (dictWords.value.has(stripPunct(word)) || settings.enDisplayMode === 'dictation' || forceDict) && !(wi === wordIdx.value && enHadError.value && !forceDict)
  // 音节着色（enColorMode === 'syllable'）：不同色相区分发音块，不受 dict 影响
  const sylCls = {}
  if (!isPunctCh && settings.enColorMode === 'syllable') {
    const sylMap = enSyllableMap.value[stripPunct(word)]
    if (sylMap && sylMap[li] !== undefined) {
      const idx = sylMap[li] % 5 // 5 色循环
      sylCls[`syl-${idx}`] = true
    }
  }
  // 词根着色（enColorMode === 'word-root'，默认）：不同深浅灰色区分前缀/词根/后缀
  const seg = (!isPunctCh && settings.enColorMode === 'word-root' && !dict) ? (enSegments.value[stripPunct(word)]?.[li] || '') : ''
  const segCls = seg ? { [`seg-${seg}`]: true } : {}
  // 宽松模式：光标之后已输入过的词按输入结果定型（回退重打时不能退回"未输入"观感）
  // - 已输入正确 → 与已完成词同观感（颜色/透明度一致，样式不变）
  // - 已输入仍错（还没轮到的错词）→ 红色待改，让用户知道后面还有词要改
  const wordCore = enCore(word)
  const gentleInp = settings.enGentleMode ? enCore(enGentleInputs.value[wi] || '') : ''
  const doneByInput = gentleInp !== '' && gentleInp === wordCore
  const wrongByInput = gentleInp !== '' && gentleInp !== wordCore
  // 已完成的词（含宽松模式光标后已输入正确的词）
  if (wi < wordIdx.value || (settings.enGentleMode && wi > wordIdx.value && doneByInput)) {
    // 宽松模式：整句检查后，标记错误位置的字符
    if (settings.enGentleMode && enGentleErrors.value[`${wi}:${li}`]) {
      return { incorrect: true }
    }
    // 音节模式：已完成词用音节色（降低透明度），不覆盖为深灰
    if (settings.enColorMode === 'syllable') return sylCls
    // 标点字符：已完成用固定淡色
    if (isPunctCh) return { 'punct-done': true }
    return { correct: true }
  }
  // 未到的词
  if (wi > wordIdx.value) {
    // 宽松模式：输入过但打错、还没轮到的词 → 红色待改状态（多错词时提前可见）
    if (settings.enGentleMode && wrongByInput) {
      if (isPunctCh) return { 'punct-done': true }
      return { incorrect: true }
    }
    if (isPunctCh) return { punct: true }
    return dict ? { hidden: true } : (settings.enColorMode === 'syllable' ? sylCls : segCls)
  }
  // 当前词
  // 无需输入的可忽略标点（句号/逗号/问号）：固定按已完成淡色展示，不参与输入高亮/等待
  if (isPunctCh && EN_OPTIONAL_PUNCT.has(ch) && li >= enCoreLen(word)) return { 'punct-done': true }
  // 宽松模式整句检查标出的错位（重练关闭时回退就地重打的词）：还没重打到的字母保持红色，
  // 让"打错了"的状态可见；已重打（li < letterIdx）的字母走下方常规显示，红色随修正逐步消失
  if (settings.enGentleMode && enGentleErrors.value[`${wi}:${li}`] && li >= letterIdx.value) {
    return { incorrect: true }
  }
  // 错误回放：回退后短暂显示打错的内容（用户输入原样，不替换成正确字母），
  // 但逐位对比——输入与目标一致的字母位不标红（正常显示），只有真正打错的位标红
  if (settings.enGentleMode && enReplayWi.value === wi && li < letterIdx.value) {
    const inputCh = currentInput.value[li]
    return inputCh === ch ? { correct: true } : { incorrect: true }
  }
  if (li < letterIdx.value) {
    // 宽松模式：已输入字母正常显示（用主文字色；词根灰/半透明色太淡）
    // 不标"正确绿"、也不标"错误红"——宽松模式只提示、不纠错
    if (settings.enGentleMode) {
      if (isPunctCh) return { 'punct-done': true }
      if (dict) return { correct: true }
      return { correct: true }
    }
    // 标点字符：已输入（正确）→ 标记完成
    if (isPunctCh) return { 'punct-done': true }
    return { correct: true }
  }
  if (li === letterIdx.value) {
    // 宽松模式：当前位置即使有错误输入也不显示红色，只显示下划线高亮
    // 重练单词（默写状态）强制隐藏字母，不依赖 enDictCurrentHint 设置
    if (settings.enGentleMode) {
      if (isPunctCh) return { 'punct-current': true }
      // 揭示后（看答案/打错）：当前字母清晰显示
      if (enHadError.value) return { correct: true }
      // 默写状态（dict）：当前字母不展示文字，仅下划线+淡背景定位输入位置
      if (dict) return { 'dict-current': true }
      return { current: true }
    }
    // 当前位置有错误输入时显示 incorrect
    if (currentInput.value.length > letterIdx.value) return { incorrect: true }
    // 标点字符：当前位置（等待输入）→ 高亮提示
    if (isPunctCh) return { 'punct-current': true }
    // 揭示后（看答案/打错）：当前字母清晰显示
    if (enHadError.value) return { correct: true }
    // 默写状态（dict）：当前字母不展示文字，仅下划线+淡背景定位输入位置
    if (dict) return { 'dict-current': true }
    // 普通（非默写）词：当前字母可作提示显示
    return { current: true }
  }
  // 当前词内未输入字母：按着色模式渲染
  if (isPunctCh) return { punct: true }
  if (dict) return { hidden: true }
  // 揭示后（看答案/打错）：清晰显示当前词，不着色 → 与宽松模式样式一致
  if (enHadError.value && wi === wordIdx.value) return { correct: true }
  if (settings.enColorMode === 'syllable') return sylCls
  return segCls
}

// 宽松模式：显示用户实际输入的字符，而非目标单词的字符
function letterChar(wi, li, defaultChar) {
  if (settings.enGentleMode) {
    // 当前词：显示用户输入的内容
    if (wi === wordIdx.value) {
      if (li < currentInput.value.length) return currentInput.value[li]
    }
    // 已完成词：始终显示用户输入的字符（保持原样，不自动修复）
    if (wi < wordIdx.value) {
      const input = enGentleInputs.value[wi] || ''
      if (li < input.length) return input[li]
    }
    // 光标之后但已输入过的词（回退重打时保持"已打"观感：对词显示输入原文、错词显示待改内容）
    if (wi > wordIdx.value) {
      const input = enGentleInputs.value[wi] || ''
      if (li < input.length) return input[li]
    }
  }
  return defaultChar
}

function buildNumberQueue() {
  const groups = []
  for (let g = 0; g < 12; g++) {
    let s = ''
    const len = 3 + Math.floor(Math.random() * 3) // 3~5 位
    for (let i = 0; i < len; i++) s += String(Math.floor(Math.random() * 10))
    groups.push(s)
  }
  return groups
}

function buildLetterQueue() {
  let level = LETTER_LEVELS.find(l => l.id === letterLevel.value) || LETTER_LEVELS[0]
  let pool
  if (letterLevel.value === 'error') {
    // 易错键专项：从统计页写入的易错键列表取字母池；无数据时回退全键盘
    try { pool = JSON.parse(localStorage.getItem('sp-error-keys') || '[]') } catch { pool = [] }
    if (!pool.length) {
      pool = 'abcdefghijklmnopqrstuvwxyz'.split('')
      level = LETTER_LEVELS.find(l => l.id === 'full') || LETTER_LEVELS[0]
    }
  } else {
    pool = level.rows.flatMap(ri => keyRows[ri]).map(code => code.replace('Key', '').toLowerCase())
  }
  const groups = []
  for (let g = 0; g < 12; g++) {
    let s = ''
    let prev = ''
    for (let i = 0; i < 5; i++) {
      let ch = pool[Math.floor(Math.random() * pool.length)]
      let guard = 0
      while (ch === prev && guard++ < 10) ch = pool[Math.floor(Math.random() * pool.length)]
      s += ch
      prev = ch
    }
    groups.push(s)
  }
  return groups
}

function buildSyllableQueue() {
  // 从常用音节池 + words.js 提取音节，随机取 20 个
  const pool = [...SYLLABLES]
  const seen = new Set(pool.map(s => s.letters))
  for (const w of WORDS) {
    const pys = w.pinyin.trim().split(/\s+/)
    for (let i = 0; i < pys.length; i++) {
      const py = pys[i].replace(/[^a-z]/g, '')
      if (py && !seen.has(py)) {
        seen.add(py)
        pool.push({ letters: py, char: Array.from(w.text)[i] || '' })
      }
    }
  }
  return shuffle(pool).slice(0, 20)
}

function cleanSyllable(py) {
  return (py || '').replace(/[^a-z]/g, '')
}

function buildCardQueue() {
  if (cardType.value === 'custom') {
    return buildCustomCardQueue()
  }
  if (cardType.value === 'mistake') {
    return buildMistakeQueue()
  }
  // 完成弹窗「刻意练习本次错词」：用本次错词建卡队列（每词重复 3 遍，练到记住）
  if (mistakePracticeMode.value && sessionMistakes.value.length) {
    const pool = []
    for (const text of sessionMistakes.value) {
      for (let i = 0; i < 3; i++) pool.push(text)
    }
    return shuffle(pool).map(text => ({
      display: text,
      syllables: toWordSyllables(text).filter(Boolean),
    })).filter(c => c.syllables.length > 0)
  }
  if (cardType.value === 'sentence') {
    // 随机生成 10 句：每张卡一句（内置句 + 随机词补足，避免固定几句打完就结束）
    const sentences = []
    for (let i = 0; i < 10; i++) {
      let text = CN_SENTENCES[Math.floor(Math.random() * CN_SENTENCES.length)]
      const target = 15 + Math.floor(Math.random() * 10) // 补足到 15~24 字
      while (extractChinese(text).length < target) {
        const w = WORDS[Math.floor(Math.random() * WORDS.length)]
        text += w.text
      }
      sentences.push(text)
    }
    return sentences.map(text => ({
      display: text,
      syllables: toPinyinArray(extractChinese(text)).map(cleanSyllable).filter(Boolean),
    })).filter(c => c.syllables.length > 0)
  }
  // 词语卡 / 默写卡：从所选年级词库（或全部词库）随机抽 10 个词，词内音节拆开
  const texts = wordGrade.value === 'all'
    ? [...WORDS.map(w => w.text), ...Object.values(GRADE_WORDS).flat()]
    : [...GRADE_WORDS[wordGrade.value]]
  return shuffle([...new Set(texts)]).slice(0, 10).map(text => ({
    display: text,
    syllables: toWordSyllables(text).filter(Boolean),
  })).filter(c => c.syllables.length > 0)
}

// 自定义词表：每行一个词（中文自动转全拼；非中文按拼音/字母串处理），每词重复 N 遍
// 错题本：错词按错误次数加权随机抽取（错得越多越常练）
function buildMistakeQueue() {
  const entries = mistakes.list
  if (!entries.length) return []
  const pool = []
  for (const m of entries) {
    const w = Math.min(m.count, 5)
    for (let i = 0; i < w; i++) pool.push(m.text)
  }
  return shuffle(pool).slice(0, 10).map(text => ({
    display: text,
    syllables: toWordSyllables(text).filter(Boolean),
  })).filter(c => c.syllables.length > 0)
}

function buildCustomCardQueue() {
  const lines = customCardsInput.value.split(/[\n,，;；]+/).map(s => s.trim()).filter(Boolean)
  if (!lines.length) return []
  const cards = lines.map(line => {
    if (/[\u4e00-\u9fa5]/.test(line)) {
      const pys = toPinyinArray(extractChinese(line)).map(cleanSyllable).filter(Boolean)
      return { display: line, syllables: pys }
    }
    const parts = line.toLowerCase().split(/\s+/).filter(Boolean)
    return { display: line, syllables: parts }
  }).filter(c => c.syllables.length > 0)
  const n = Math.max(1, Math.min(20, Number(customRepeat.value) || 3))
  const queue = []
  for (const card of cards) {
    for (let i = 0; i < n; i++) queue.push({ ...card })
  }
  return queue
}

// 一键选择内容源：词语类（全部/四/五/六）与短句点击即开始；错题本/自定义先开面板
// 英文词库年级由顶部栏下拉切换：练习中变更 → 用新词库重开
function selectEnContent(id) {
  settings.setEnGrade(id)
  enMistakeMode.value = false // 切换词库时退出错题本模式
  enCustomMode.value = false // 同时退出自定义模式
  enStoryMode.value = false // 同时退出短文模式
}
// 英文词库年级变更：由「单词」tab 内的词库选择器触发
function onEnGradeChange(e) {
  settings.setEnGrade(e.target.value)
}
watch(enGrade, (id, old) => {
  if (old !== undefined && id !== old && started.value && mode.value === 'words') {
    endSession()
    started.value = false
    completed.value = false
    start()
  }
})

// 难度缓存：切换时自动保存
watch(enDifficulty, (v) => {
  try { localStorage.setItem(EN_DIFFICULTY_KEY, v) } catch {}
})
watch(enCustomTypes, (v) => {
  try { localStorage.setItem(EN_CUSTOM_TYPES_KEY, JSON.stringify(v)) } catch {}
}, { deep: true })

// 卡片一键选择内容源：词语类（全部/四/五/六）与短句点击即开始；错题本/自定义先开面板
function selectContent(id) {
  const c = CONTENT_TYPES.find(x => x.id === id)
  if (!c) return
  // 同一内容源且练习进行中：忽略重复触发（防止焦点残留按钮被空格误触导致重启）
  if (content.value === id && started.value && !completed.value) return
  const needPanel = c.cardType === 'custom' || c.cardType === 'mistake'
  if (started.value) {
    endSession()
    started.value = false
    completed.value = false
  }
  content.value = id
  cardType.value = c.cardType
  wordGrade.value = c.grade || 'all'
  settings.setCardContent(id) // 缓存内容源/年级选择
  if (!needPanel) start()
}

// 卡片完成：出错过的卡重新插回队尾重练（Anki 式错卡重练）
// 整卡打完拼音后保持展示，等待空格/回车进入下一张（不再自动跳转）
let cardAdvancePending = false
function markCardComplete() {
  cardAdvancePending = true
}
function advanceCard() {
  if (!cardAdvancePending) return
  cardAdvancePending = false
  nextCard()
}

function nextCard() {
  if (currentCardHadError.value && currentCard.value) {
    // 错题本：记录打错的词（短句是随机拼的，不记录）
    if (cardType.value !== 'sentence') {
      mistakes.recordWrong(currentCard.value.display)
      progress.recordDailyWrongWord(currentCard.value.display) // 计入今日错词（目标用）
      recordSessionMistake(currentCard.value.display) // 本次会话错词（完成弹窗用）
    }
    cardQueue.value.push({ ...currentCard.value, redo: true })
  } else if (currentCard.value) {
    // 打对：从错题本移除该词（练对消除），并从今日错词清单移除
    if (cardType.value !== 'sentence') {
      mistakes.removeWord(currentCard.value.display)
      progress.clearDailyWrongWord(currentCard.value.display)
      // 刻意练习中练对 → 从本次错词移除（全部练对后不再重复提示）
      if (mistakePracticeMode.value) {
        const i = sessionMistakes.value.indexOf(currentCard.value.display)
        if (i >= 0) sessionMistakes.value.splice(i, 1)
      }
    }
  }
  clearCardWrongMap()
  cardIdx.value++
  cardSylIdx.value = 0
  cardCharIdx.value = 0
  currentCardHadError.value = false
  if (cardIdx.value >= cardQueue.value.length) {
    finish()
  }
}

function start() {
  if (started.value) return
  enCombo.value = 0 // 新会话从零连击
  enMaxCombo.value = 0
  resetSentenceScoring()
  // 普通开始：清空本次错词记录；刻意练习开始（mistakePracticeMode=true）保留供队列使用
  if (!mistakePracticeMode.value) sessionMistakes.value = []
  // 初始化当前模式的队列
  if (mode.value === 'words' || mode.value === 'stories' || mode.value === 'mistake-book') {
    enQueue.value = buildEnglishQueue()
    sentenceIdx.value = 0
    wordIdx.value = 0
    letterIdx.value = 0
    currentInput.value = ''
    wordCompleted.value = false
    enWordAvgs.value = {}
    enSentenceDone.value = false
    enSentenceSpoken.value = false // 新句子重置整句语音播放标记
    enGentleInputs.value = [] // 宽松模式：重置输入记录
    enGentleErrors.value = {} // 宽松模式：重置错误标记
        enSkipWordSpeak.value = false // 重置可能残留的换句标记
    // 进入第一句：开启整句朗读 → 先朗读整句，首词不单独朗读
    if (settings.enSpeakSentence) {
      enSkipWordSpeak.value = true
      nextTick(() => speakWholeSentence())
    }
    startEnWord()
  } else if (mode.value === 'numbers') {
    numQueue.value = buildNumberQueue()
    groupIdx.value = 0
    digitIdx.value = 0
  } else if (mode.value === 'letters') {
    letterQueue.value = buildLetterQueue()
    letterGroupIdx.value = 0
    letterCharIdx.value = 0
  } else if (mode.value === 'syllables') {
    sylQueue.value = buildSyllableQueue()
    sylIdx.value = 0
    sylCharIdx.value = 0
  } else if (mode.value === 'cards') {
    cardQueue.value = buildCardQueue()
    cardIdx.value = 0
    cardSylIdx.value = 0
    cardCharIdx.value = 0
    currentCardHadError.value = false
    clearCardWrongMap()
  }
  // 卡片队列为空（如错题本暂无错题）时不开始
  if (mode.value === 'cards' && !cardQueue.value.length) return
  totalCount.value = 0
  correctCount.value = 0
  completedUnits.value = 0
  enHadError.value = numHadError.value = letterHadError.value = sylHadError.value = false
  enWordCount.value = 0
  enFirstHitCount.value = 0
  enViewAnswers.value = 0
  enRelistens.value = 0
  enWordTimeSum.value = 0
  completed.value = false
  sessionStart.value = Date.now()
  started.value = true
  startElapsedTimer()
  // 英文模式：渲染后检查溢出并滚动到当前词
  if (mode.value === 'words' || mode.value === 'stories' || mode.value === 'mistake-book') {
    nextTick(() => scrollToCurrentWord())
  }
  // 按实际模式记录会话（卡片/中文/数字…各自独立记录时长）
  // 单词模式即词库练习；短文模式细分内置/自定义/课包；错词本固定 en-mistake
  let practiceType = mode.value
  if (mode.value === 'words') {
    practiceType = 'en-words'
  } else if (mode.value === 'stories') {
    if (enStoryMode.value) practiceType = 'en-story'
    else if (enCustomMode.value) practiceType = 'en-custom'
    else practiceType = 'en-words'
  } else if (mode.value === 'mistake-book') {
    practiceType = 'en-mistake'
  }
  stats.startSession(practiceType)
  progress.startSession()
}

function switchMode(id) {
  if (id === mode.value && started.value) return
  mode.value = id
  started.value = false
  completed.value = false
  endSession()
  // 同步地址栏 query，让顶部导航高亮跟随（不 push，避免历史堆积）
  if (route.name === 'practice-modes') {
    router.replace({ path: '/practice-modes', query: { mode: id } })
  }
}

// 退出当前会话并聚焦到模式 tab（Esc = 回到模式选择）
function backToModeSelect() {
  closeEnModePanel()
  endSession()
  started.value = false
  completed.value = false
  nextTick(() => {
    const tab = document.querySelector('.topStatus .modeBtn.active') || document.querySelector('.topStatus .modeBtn')
    ;(tab || document.querySelector('.modeBtn[data-nav]'))?.focus()
  })
}

function setLetterLevel(id) {
  // 练习中切换难度：结束当前会话回到未开始，再开始即用新难度
  if (id === letterLevel.value && !started.value) return
  if (started.value) {
    endSession()
    started.value = false
    completed.value = false
  }
  letterLevel.value = id
}

function note(correct, expected = '', actual = '') {
  totalCount.value++
  if (correct) correctCount.value++
  // 记录到 stats store（统计页数据源）；此前 practice 模式从未写入，会话统计恒为 0
  stats.recordKeystroke(expected, actual, correct, 'practice')
  progress.recordKeystroke(correct)
  const unlocked = progress.checkAchievements(stats)
  if (unlocked.length > 0) {
    newAchievements.value = [...newAchievements.value, ...unlocked]
  }
}

function submitCode(code, shiftKey = false) {
  // 统一入口：code 为 KeyboardEvent.code（如 KeyA / Digit5）；shiftKey 用于区分 %(=Shift+5) 与 5
  if (!started.value || completed.value) return { correct: false }

  let correct = false
  let expected = ''

  if (mode.value === 'words' || mode.value === 'stories' || mode.value === 'mistake-book') {
    // 参考 localhost:3002：逐字母输入；词完成后按空格/回车推进
    const unit = currentWord.value
    if (!unit) return { correct: false }
    const word = unitText(unit)
    // 输入核心 = 去掉可忽略标点（句号/逗号/问号展示但不用打；撇号仍必打），如 class.→class
    const core = enCore(word)
    if (settings.enGentleMode || letterIdx.value < core.length) {
      const ch = core[letterIdx.value < core.length ? letterIdx.value : core.length - 1]
      // 支持撇号（it's / Uncle Tom's）等非字母字符：' → Quote 键；时间字符：数字 → Digit、冒号 → Semicolon；其余非字母视为无法输入
      const expectKey = charToKey(ch)
      if (!expectKey) return { correct: false }
      expected = expectKey
      // Shift 组合符号（% @ # 等）：必须按住 Shift 才算对，防止 5 冒充 %
      correct = expected === code && (!needsShift(ch) || shiftKey)
      if (settings.enGentleMode) {
        // 回放中开始重打：中断回放并清空错误内容（本次按键作为第一个输入字母）
        if (enReplayWi.value === wordIdx.value) {
          clearTimeout(enReplayTimer)
          enReplayWi.value = -1
          currentInput.value = ''
          letterIdx.value = 0
          enGentleInputs.value[wordIdx.value] = ''
        }
        // 宽松模式：不标记错误、不播错误音效、不记录错词
        enWordKeystrokes.value++ // 记录按键数（掌握度计时用，不计正确与否）
        // 存储实际输入的字符，原样显示（用于完成时比对）；Shift 组合键还原真实符号（shift+5 → % 而非 5）
        const typedChar = codeToChar(code, shiftKey) || ch
        // 核心字母已打满后：多余输入若为可忽略标点（. , ? !）允许补打（完成时剥掉、不影响判定），
        // 多余的普通字母直接静默忽略——否则多余字符没有显示位、用户看不见，
        // 整句检查时会被莫名判错（如 not 多打一个 t 成 nott，界面只有 3 个字母格）
        if (enCore(currentInput.value).length >= core.length && !EN_OPTIONAL_PUNCT.has(typedChar)) {
          // 丢弃多余普通字母（与严格模式打满后一致）
        } else {
          currentInput.value += typedChar
          letterIdx.value = currentInput.value.length
          // 整句检查标红的错位：本轮输入字母正确 → 清除该位置红标（回退重打时红色随修正消失）
          if (typedChar === ch) {
            const errKey = `${wordIdx.value}:${letterIdx.value - 1}`
            if (enGentleErrors.value[errKey]) delete enGentleErrors.value[errKey]
          }
        }
        // 不自动设置 wordCompleted——由空格/回车手动完成
      } else if (!correct) {
        // 非宽松模式：错误输入，记录错误状态（错题重练依赖此状态）
        enHadError.value = true
        // 标点并入单词后，错词记录统一用剥离标点的词
        const wKey = stripPunct(word)
        // 计入今日错词（目标「错词清零」用；练对后移除）
        progress.recordDailyWrongWord(wKey)
        recordSessionMistake(wKey) // 本次会话错词（完成弹窗用）
        // 立即写入错题本（enMastery）：即使中途退出也能在错题本里看到
        enMastery[wKey] = 'error'
        saveEnMastery()
        // 打错时朗读该词（参考 3002：打错 → 读单词提示正确发音）
        // 延迟 250ms：等错误音效先播完，避免两种声音混合成怪声
        if (settings.enSpeakWords) setTimeout(() => speakEnglish(word, true), 250)
        // 错误输入：位置不前进，仅填充错误字符用于显示
        const wrongChar = codeToChar(code, shiftKey) || code.replace('Key', '').toLowerCase()
        if (currentInput.value.length <= letterIdx.value) {
          currentInput.value += wrongChar
        } else {
          currentInput.value = currentInput.value.slice(0, letterIdx.value) + wrongChar
        }
      } else {
        // 非宽松模式 + 正确输入：推进输入位置
        enWordKeystrokes.value++ // 记录正确按键数（掌握度计时用）
        // 覆盖修正：错误后继续输入正确字符时，丢弃中间错误字符（与参考一致）
        if (currentInput.value.length > letterIdx.value) {
          currentInput.value = currentInput.value.slice(0, letterIdx.value) + core[letterIdx.value]
        } else {
          currentInput.value += core[letterIdx.value]
        }
        letterIdx.value++
        if (letterIdx.value >= core.length) {
          wordCompleted.value = true // 词已完成（可忽略标点无需输入），等待空格推进
        }
      }
    }
  } else if (mode.value === 'numbers') {
    const group = currentGroup.value
    if (digitIdx.value < group.length && /^Digit|^Numpad/.test(code)) {
      expected = 'Digit' + group[digitIdx.value]
      correct = expected === code
      if (!correct) numHadError.value = true
      if (correct) {
        digitIdx.value++
        completedUnits.value++ // 完成一个数字
        if (digitIdx.value >= group.length) {
          if (numHadError.value) {
            // 错组重练：整组插回队尾
            numQueue.value.push(group)
            numHadError.value = false
          }
          groupIdx.value++
          digitIdx.value = 0
          if (groupIdx.value >= numQueue.value.length) {
            finish()
          }
        }
      }
    }
  } else if (mode.value === 'letters') {
    const group = currentLetterGroup.value
    if (letterCharIdx.value < group.length && code.startsWith('Key')) {
      expected = 'Key' + group[letterCharIdx.value].toUpperCase()
      correct = expected === code
      if (!correct) letterHadError.value = true
      if (correct) {
        letterCharIdx.value++
        completedUnits.value++ // 完成一个字母
        if (letterCharIdx.value >= group.length) {
          if (letterHadError.value) {
            // 错组重练：整组插回队尾
            letterQueue.value.push(group)
            letterHadError.value = false
          }
          letterGroupIdx.value++
          letterCharIdx.value = 0
          if (letterGroupIdx.value >= letterQueue.value.length) {
            finish()
          }
        }
      }
    }
  } else if (mode.value === 'syllables') {
    const syl = currentSyllable.value
    if (syl && sylCharIdx.value < syl.letters.length && code.startsWith('Key')) {
      expected = 'Key' + syl.letters[sylCharIdx.value].toUpperCase()
      correct = expected === code
      if (!correct) sylHadError.value = true
      if (correct) {
        sylCharIdx.value++
        if (sylCharIdx.value >= syl.letters.length) {
          sylIdx.value++
          completedUnits.value++ // 完成一个音节
          if (sylHadError.value) {
            // 错音节重练：插回队尾再打一遍
            sylQueue.value.push({ ...syl, redo: true })
            sylHadError.value = false
          }
          sylCharIdx.value = 0
          if (sylIdx.value >= sylQueue.value.length) {
            finish()
          }
        }
      }
    }
  } else if (mode.value === 'cards') {
    const card = currentCard.value
    if (card && cardSylIdx.value < card.syllables.length) {
      const syl = card.syllables[cardSylIdx.value]
      if (cardCharIdx.value < syl.length && code.startsWith('Key')) {
        expected = 'Key' + syl[cardCharIdx.value].toUpperCase()
        correct = expected === code
        if (!correct) {
          currentCardHadError.value = true // 记录错误，用于错卡重练
          // 隐藏字母模式：记录打错的字母，用警告色提示
          cardWrongMap[`${cardSylIdx.value}-${cardCharIdx.value}`] = code.replace('Key', '').toLowerCase()
        }
        if (correct) {
          delete cardWrongMap[`${cardSylIdx.value}-${cardCharIdx.value}`]
          cardCharIdx.value++
          if (cardCharIdx.value >= syl.length) {
            cardSylIdx.value++
            completedUnits.value++ // 完成一个音节
            cardCharIdx.value = 0
            if (cardSylIdx.value >= card.syllables.length) {
              // 完整展示拼好的拼音，等待用户按空格进入下一张
              markCardComplete()
            }
          }
        }
      }
    }
  }

  note(correct, expected, code)
  if (settings.sound) {
    playKeySound(correct ? 'ok' : 'bad', { volume: settings.soundVolume })
  }
  return { correct }
}

// 统一输入入口：提交 + 驱动键盘闪光（物理键盘与鼠标点击共用）
function handleInput(code, shiftKey) {
  // 卡片完成等待空格 / 整句完成等待空格期间忽略输入
  if (cardAdvancePending || enSentenceDone.value) return { correct: false }
  const res = submitCode(code, shiftKey)
  flashKey(code, res.correct ? 'ok' : 'bad')
  return res
}

function finish() {
  completed.value = true
  // 整课完成庆祝（官网只在完成整门课时放彩带/烟花 + victory 音效，非每句）
  fireCourseCelebration()
  // 课包课程完成：标记进度
  if (mode.value === 'stories' && currentCourse.value && activePack.value) {
    markCourseComplete(activePack.value.slug, currentCourse.value.file)
  }
  closeEnModePanel()
  // 错词练习结束：自动退回正常词库模式（避免下次开始仍在错词池）
  if (isEnPractice.value) enMistakeMode.value = false
  if (isEnPractice.value) enCustomMode.value = false // 自定义练习结束 → 回正常词库
  // 短文课包完成时不清除 enStoryMode —— 保留课程上下文供"再来一次"重用
  // 非课包短文（内置短文/自定义短文）仍清除
  if (isEnPractice.value && !(mode.value === 'stories' && currentCourse.value && activePack.value)) {
    enStoryMode.value = false
  }
  enSlowMode.value = false // 慢词刻意练习结束 → 回正常词库
  // 刻意练习结束：复位（下次 start 恢复正常模式并清空本次错词）
  mistakePracticeMode.value = false
  // 记录本次总用时并检查是否打破该模式最佳纪录（需在 endSession 清零 sessionStart 前计算）
  if (sessionStart.value) {
    finalDuration.value = Math.round((Date.now() - sessionStart.value) / 1000)
    const prev = bestTimes[mode.value] || null
    prevBest.value = prev
    isNewRecord.value = prev === null || finalDuration.value < prev
    if (isNewRecord.value) {
      bestTimes[mode.value] = finalDuration.value
      saveBestTimes()
    }
  }
  endSession()
}

function endSession() {
  cardAdvancePending = false
  stopElapsedTimer()
  if (!sessionStart.value) return
  const duration = Math.round((Date.now() - sessionStart.value) / 60000)
  const chars = completedUnits.value
  if (duration > 0 || chars > 0) {
    progress.recordPracticeSession(duration, chars)
  }
  progress.checkDailyGoal(chars, duration)
  progress.endSession()
  stats.endSession()
  sessionStart.value = 0
}

function restart() {
  endSession()
  started.value = false
  start()
}

// 页面离开（关闭/刷新/切走）时自动记录进行中的练习
let pageHiddenRecorded = false
function onPageHide() {
  if (started.value && !completed.value && sessionStart.value) {
    pageHiddenRecorded = true
    endSession()
  }
}
// 切到后台（手机息屏/切 App）时也记录，避免长时间挂起后丢失
function onVisibilityChange() {
  if (document.hidden && started.value && !completed.value && sessionStart.value && !pageHiddenRecorded) {
    pageHiddenRecorded = true
    endSession()
  }
}

// 物理键盘输入
function onKeyDown(e) {
  if (e.repeat) return
  // 按压高亮：任何字母键按下即显示（纯视觉，与输入逻辑无关）
  if (keyByCode.has(e.code)) keyPressed.add(e.code)

  // 句子跳转输入框打开：放行所有按键（数字/退格/箭头等由输入框原生处理），避免被练习输入逻辑拦截
  if (enSentenceJumpOpen.value) {
    const tag = document.activeElement?.tagName
    if (tag === 'INPUT') return
  }

  // 完成浮层：支持键盘操作（参考 localhost:3002 的完成浮层快捷键）
  if (completed.value) {    if (e.code === 'Space' || e.code === 'Enter') {
      e.preventDefault()
      restart()
    } else if (e.key.toLowerCase() === 'm') {
      e.preventDefault()
      switchMode(nextMode.value)
    } else if (e.code === 'Escape') {
      e.preventDefault()
      // 课包课程完成 → 回课程列表；其他模式 → 回模式选择
      if (activePack.value && currentCourse.value) {
        backToCourseList()
      } else {
        backToModeSelect()
      }
    }
    return
  }

  if (!started.value) {
    // 自定义词表面板：不开始练习，让输入框正常接收键盘
    if (isCustomPanel.value) return
    // 焦点在文本输入框（英文自定义内容粘贴/卡片自定义编辑等）：放行所有按键
    const activeTag = document.activeElement?.tagName
    if (activeTag === 'TEXTAREA' || activeTag === 'INPUT') return
    // 方向键：键盘导航专用，不开始练习
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) return
    // 短文浏览模式 / 错词本模式：不在此处按任意键开始，需点击具体按钮
    if (mode.value === 'stories') return
    if (mode.value === 'mistake-book') return
    // 未开始按 Esc：把焦点带回模式导航（顶部栏当前模式按钮）
    if (e.key === 'Escape') {
      e.preventDefault()
      const tab = document.querySelector('.topStatus .modeBtn.active') || document.querySelector('.topStatus .modeBtn')
      if (document.activeElement !== tab && tab) tab.focus()
      else document.querySelector('.modeBtn[data-nav]')?.focus()
      return
    }
    // 键盘导航：焦点在导航按钮上时，Enter/Space 激活按钮而非开始练习；
    // 若焦点已在「当前激活」的按钮（模式 tab / 难度 / 类型）上再按 Enter/Space = 确认开始练习
    if ((e.key === 'Enter' || e.key === ' ') && document.activeElement?.hasAttribute?.('data-nav')) {
      if (document.activeElement.classList.contains('active')) {
        e.preventDefault()
        start()
      }
      return
    }
    e.preventDefault()
    start()
    return
  }

  // 练习中 Esc 退出：课包课程 → 回课程列表；其他模式 → 回模式选择
  if (e.key === 'Escape') {
    e.preventDefault()
    if (activePack.value && currentCourse.value) {
      backToCourseList()
    } else {
      backToModeSelect()
    }
    return
  }
  // 卡片模式：整卡拼音打完等待空格/回车进入下一张（期间忽略其他按键）
  if (mode.value === 'cards' && cardAdvancePending) {
    if (e.code === 'Space' || e.code === 'Enter') {
      e.preventDefault()
      advanceCard()
    }
    return
  }
  // 卡片模式：音节未完成时空格/回车无操作，但必须阻止默认行为
  // （否则会激活焦点上的内容源按钮，导致误触重启并产生碎片会话记录）
  if (mode.value === 'cards' && (e.code === 'Space' || e.code === 'Enter')) {
    e.preventDefault()
    return
  }
  // 英文模式：空格/回车推进下一词，退格回退，Ctrl+' 重听整句（参考 localhost:3002）
  if (mode.value === 'words' || mode.value === 'stories' || mode.value === 'mistake-book') {
    if (e.ctrlKey && e.code === 'Quote') {
      e.preventDefault()
      speakWholeSentence()
      return
    }
    if (e.shiftKey && (e.code === 'ArrowLeft' || e.code === 'ArrowRight')) {
      e.preventDefault()
      arrowJumpSentence(e.code === 'ArrowLeft' ? -1 : 1)
      return
    }
    if (e.code === 'Space' || e.code === 'Enter') {
      e.preventDefault()
      // 整句完成：再一次空格/回车进入下一句
      if (enSentenceDone.value) {
        enSentenceDone.value = false
        resetSentenceScoring() // 新句子重置评分过程状态（句首 startEnWord 不误结算）
        enSentenceSpoken.value = false // 新句子重置整句语音播放标记
        sentenceIdx.value++
        wordIdx.value = 0
        enWordAvgs.value = {} // 新句子清空耗时记录
        enGentleInputs.value = [] // 宽松模式：新句子重置输入记录
        enGentleErrors.value = {} // 宽松模式：新句子重置错误标记
        if (sentenceIdx.value >= enQueue.value.length) {
          finish()
        } else {
          // 换句首词：等渲染 + 150ms 视觉缓冲后再计时（换句后的定位时间不计入首词耗时）
          // 开启整句朗读 → 同时朗读整句，首词不再单独朗读
          if (settings.enSpeakSentence) {
            enSkipWordSpeak.value = true
            nextTick(() => setTimeout(() => speakWholeSentence(), 150))
          }
          nextTick(() => setTimeout(() => startEnWord(), 150))
        }
        return
      }
      const unit = currentWord.value
      if (!unit) return
      const word = unitText(unit)
      // 掌握度/错词/今日错词等记录统一用剥离标点的词（cows,→cows）
      const wordKey = stripPunct(word)
      // 完成判定基于输入核心：句号/逗号/问号没打也算完成（you'll 的撇号仍必须打）
      // 宽松模式 + 重练关闭的就地重打场景：回退后经过的"已打对"词无需重输，空格直接滑过
      const gentleSkipPass = settings.enGentleMode && currentInput.value === '' && enCore(enGentleInputs.value[wordIdx.value] || '') === enCore(word)
      // 错误回放中按空格/回车：提前结束回放、回归初始待输入（不把错误内容当完成提交）
      if (settings.enGentleMode && enReplayWi.value === wordIdx.value) {
        clearEnReplay(wordIdx.value)
        return
      }
      if (letterIdx.value >= enCoreLen(word) || gentleSkipPass) {
        // 宽松模式：不检查输入是否正确，直接完成单词，保存输入
        if (settings.enGentleMode) {
          enGentleInputs.value[wordIdx.value] = currentInput.value
        } else {
          // 正常模式：宽松模式不执行以下掌握度评估
          // 掌握度评估（提示/默写两套阈值）：出错 → 错词；无错且快 → 掌握；无错偏慢 → 正常；无错太慢 → 慢词
          // 提示模式（显示字母）抄写无回忆成本，阈值严格；默写模式（隐藏字母）回忆含思考时间，阈值放宽
          const elapsed = Date.now() - enWordStartTime.value
          // 首词缓冲可能导致 elapsed 为负（用户开始极快）→ 归零
          const avg = enWordKeystrokes.value > 0 ? Math.max(0, elapsed) / enWordKeystrokes.value : Infinity
          enLastWordAvg.value = Number.isFinite(avg) ? Math.round(avg) : 0 // 显示本词平均耗时
          enWordAvgs.value[wordIdx.value] = enLastWordAvg.value // 记录到该词位置（显示在词下方）
          // 英文会话统计累积
          enWordCount.value++
          enWordTimeSum.value += Math.max(0, elapsed)
          if (!enHadError.value) enFirstHitCount.value++
          const isDictation = (dictWords.value.has(wordKey) || settings.enDisplayMode === 'dictation') && settings.enDisplayMode !== 'guide' // 该词以默写（隐藏字母）方式展示
          const mMs = isDictation ? enMasteryMsDict.value : enMasteryMs.value
          const sMs = isDictation ? enSlowMsDict.value : enSlowMs.value
          // 慢词刻意练习：平均耗时超过阈值收录，刻意练习中达标移除
          recordSlowWord(wordKey, avg)
          if (enHadError.value) {
            enMastery[wordKey] = 'error'
          } else if (avg <= mMs) {
            enMastery[wordKey] = 'mastered'
            progress.clearDailyWrongWord(wordKey) // 练对 → 今日错词移除
            // 刻意练习中练对 → 从本次错词移除（全部练对后不再重复提示）
            if (mistakePracticeMode.value) {
              const si = sessionMistakes.value.indexOf(wordKey)
              if (si >= 0) sessionMistakes.value.splice(si, 1)
            }
          } else if (avg <= sMs) {
            delete enMastery[wordKey] // 偏慢 → 恢复正常（中等权重）
            progress.clearDailyWrongWord(wordKey) // 无错 → 今日错词移除
            if (mistakePracticeMode.value) {
              const si = sessionMistakes.value.indexOf(wordKey)
              if (si >= 0) sessionMistakes.value.splice(si, 1)
            }
          } else {
            enMastery[wordKey] = 'slow' // 太慢（无错也说明掌握不好）→ 最高权重
            progress.recordDailyWrongWord(wordKey) // 太慢没想起来也算今日错词
            recordSessionMistake(wordKey) // 本次会话错词
          }
          saveEnMastery()
        }
        // 词已完成，推进到下一词
        wordIdx.value++
        completedUnits.value++ // 完成一个词
        const hadError = enHadError.value // 在 startEnWord 重置前保存错误状态
        startEnWord()
        // 原始句子完成时播放整句语音（在重练之前，确保只播原始句子，不含重练词）
        if (wordIdx.value >= enSentence.value.length && !enSentenceSpoken.value) {
          enSentenceSpoken.value = true
          speakWholeSentence()
        }
        if (!settings.enGentleMode && hadError && settings.enRedoPractice) {
          // 错词重练：插回本句队尾再打一遍，并标记为重练词（样式区分）
          const s = enQueue.value[sentenceIdx.value]
          s.redoWords = s.redoWords || new Set()
          s.redoWords.add(s.words.length) // push 前的长度即新词索引
          s.words.push(word)
        }
        letterIdx.value = 0
        currentInput.value = ''
        wordCompleted.value = false
        // 宽松+跳过模式：回退就地重打后，把后方"已打对"的词自动滑过（无需逐个按空格），
        // 只停在下一个仍错的词或直接到句末 —— 错词改完即自动进入整句判定（官网：提交只看最终内容）
        if (settings.enGentleMode && !settings.enRedoPractice) {
          const sWords = enSentence.value
          while (wordIdx.value < sWords.length) {
            const tu = sWords[wordIdx.value]
            const ttext = enCore(unitText(tu))
            if (!ttext) { wordIdx.value++; continue } // 可忽略标点词自动过（与 enSkipOptionalWords 一致不计完成）
            if (enCore(enGentleInputs.value[wordIdx.value] || '') !== ttext) break // 该词还没打对 → 停在这里等输入
            wordIdx.value++
            completedUnits.value++
          }
          // 停在下一个仍错的词（有错误输入）→ 同样先红字回放 1 秒再回归初始重打
          if (wordIdx.value < sWords.length) {
            const wu = sWords[wordIdx.value]
            const wc = enCore(unitText(wu))
            if (wc && enCore(enGentleInputs.value[wordIdx.value] || '') !== wc) startEnReplay(wordIdx.value)
          }
        }
        if (wordIdx.value >= enSentence.value.length) {
          // 最后一个词打完：整句完成
          // 宽松模式：每轮到达句末都统一检查一次（不设"只查一次"闸门）——
          // 上一轮查出的错词重练后再乱打，若不再检查就能混进完成界面
          if (settings.enGentleMode) {
            const stillWrong = checkGentleSentence()
            // 报错：本轮仍有错词 → 错词已插回队尾重练（句子变长，wordIdx 落在错词上），
            // 不放行到完成界面，并给一次错误音反馈（对应官网提交错误被拦）
            if (stillWrong && settings.sound) playKeySound('bad', { volume: settings.soundVolume })
          }
          if (wordIdx.value >= enSentence.value.length) {
            // 整句真正完成：评级结算（官网规则）
            // 宽松模式整句有错 → 首答失败(none)；普通模式 hadError 视为 typo 但不至于 none（错词会重练，练对才算完成）
            if (settings.enGentleMode) {
              if (Object.keys(enGentleErrors.value).length > 0) sentFirstTry.value = false
            }
            const rating = rateSentenceCompletion()
            enSentenceDone.value = true
            fireSentenceCelebration(rating)
          }
        }
      } else {
        // 词未完成时空格 → 错误音效
        if (settings.sound) playKeySound('bad', { volume: settings.soundVolume })
      }
      return
    }
    if (e.code === 'Backspace') {
      e.preventDefault()
      // 错误回放中退格：直接结束回放回归初始（重打从空开始）
      if (settings.enGentleMode && enReplayWi.value === wordIdx.value) {
        clearEnReplay(wordIdx.value)
        return
      }
      if (currentInput.value.length > 0) {
        currentInput.value = currentInput.value.slice(0, -1)
        // 若回退到正确位置之前，同步回退 letterIdx
        if (currentInput.value.length < letterIdx.value) {
          letterIdx.value = currentInput.value.length
          wordCompleted.value = false
        }
        // 宽松模式：同步记录，保证完成/显示一致
        if (settings.enGentleMode) enGentleInputs.value[wordIdx.value] = currentInput.value
      } else if (settings.enGentleMode && !enSentenceDone.value && wordIdx.value > 0) {
        // 宽松模式：当前词还没输入时退格 = 撤回上一个已完成的词，从它已输入的内容末尾继续改
        // （跳过被自动跳过的可忽略标点词，如独立的 , . ?）
        let target = wordIdx.value - 1
        while (target > 0 && enCore(unitText(enSentence.value[target])).length === 0) target--
        const prevUnit = enSentence.value[target]
        if (prevUnit && enCore(unitText(prevUnit)).length > 0) {
          wordIdx.value = target
          const typed = enGentleInputs.value[target] || ''
          currentInput.value = typed
          letterIdx.value = typed.length
          wordCompleted.value = false
          enHadError.value = false
          enWordStartTime.value = Date.now()
          enWordKeystrokes.value = 0
        }
      }
      return
    }
    const code = e.code
    // 英文单词可含撇号（it's / Uncle Tom's）、时间字符（数字 + 冒号 7:30）、标点（, . ! ? ; - 等）
    // 允许 charToKey 支持的所有键：Key / Digit / Numpad / 标点键
    const PUNCT_CODES = new Set(['Quote', 'Semicolon', 'Comma', 'Period', 'Slash', 'Minus', 'Equal', 'BracketLeft', 'BracketRight', 'Backslash', 'Backquote'])
    if (!code.startsWith('Key') && !/^Digit/.test(code) && !/^Numpad/.test(code) && !PUNCT_CODES.has(code)) return
    e.preventDefault()
    handleInput(code, e.shiftKey)
    return
  }
  const code = e.code
  const handled =
    (mode.value === 'numbers' && (/^Digit|^Numpad/.test(code))) ||
    ((mode.value === 'letters' || mode.value === 'syllables' || mode.value === 'cards') && code.startsWith('Key'))
  if (!handled) return
  e.preventDefault()
  handleInput(code, e.shiftKey)
}

// 键盘导航：未开始时方向键在可导航元素间移动焦点（顶部导航 + 模式/难度/类型按钮），Enter/Space 由浏览器默认激活
function onNavKeydown(e) {
  if (started.value || completed.value) return
  if (e.repeat) return
  const tag = document.activeElement?.tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA') return
  if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) return
  const navs = [...document.querySelectorAll('[data-nav]')].filter(el => !el.disabled)
  if (!navs.length) return
  const idx = navs.indexOf(document.activeElement)
  const dir = (e.key === 'ArrowLeft' || e.key === 'ArrowUp') ? -1 : 1
  if (idx === -1) navs[0].focus()
  else navs[(idx + dir + navs.length) % navs.length].focus()
  e.preventDefault()
}

function onKeyUp(e) {
  if (keyByCode.has(e.code)) keyPressed.delete(e.code)
}

// 从路由 query 应用模式（顶部导航切换到某模式时入口）；error=1 易错键专项优先
function applyModeFromQuery() {
  if (route.query.error === '1') {
    mode.value = 'letters'
    letterLevel.value = 'error'
    return
  }
  const q = route.query.mode
  if (q && MODES.some(m => m.id === q)) {
    mode.value = q
  } else if (!q) {
    // 无 query（直接访问 /practice-modes）：默认中文拼音，并补写 query 保证顶部导航高亮一致
    mode.value = 'cards'
    router.replace({ path: '/practice-modes', query: { mode: 'cards' } })
  }
  // mode=words：确保词源为词库（退出短文/自定义/错题上下文），保持任意键即开始
  if (mode.value === 'words') {
    enStoryMode.value = false
    enCustomMode.value = false
    enMistakeMode.value = false
    enSlowMode.value = false
    mistakePracticeMode.value = false
  }
  // mode=stories：进入短文浏览态（packs 层级）并懒加载课包注册表
  if (mode.value === 'stories' && !activePack.value) {
    initStoriesBrowse()
  }
  // 从 URL 恢复课包浏览状态（stories 模式下的 pack/course 直达）
  if (mode.value === 'stories' && route.query.pack) {
    restoreJulebuFromUrl()
  }
}
onMounted(() => {
  settings.load()
  applyCardContent(settings.cardContent || 'all') // 恢复缓存的卡片内容源/年级
  stats.load()
  progress.load()
  mistakes.load()
  loadEnCustom() // 加载英文自定义内容
  loadEnCustomStories() // 加载短文自定义条目
  loadEnDifficulty() // 恢复难度缓存
  loadEnCustomTypes() // 恢复自定义类型缓存
  loadEnDictationMode() // 恢复听写/中译英模式
  window.addEventListener('keydown', onKeyDown)
  window.addEventListener('keydown', onNavKeydown)
  window.addEventListener('keyup', onKeyUp)
  // 页面离开/关闭/切后台时：自动结束进行中的练习并记录（避免练完直接关页面丢记录）
  window.addEventListener('pagehide', onPageHide)
  window.addEventListener('visibilitychange', onVisibilityChange)
  // 易错键专项练习入口（统计页跳转：/practice-modes?error=1）
  if (route.query.error === '1') {
    applyModeFromQuery()
    start()
  } else {
    // 顶部导航切换到某模式：进入页面时按 query 选中对应模式
    applyModeFromQuery()
  }
})
// 顶部导航切换模式时（query.mode 变化）重新应用，无需刷新页面
watch(() => route.query.mode, () => {
  if (route.name !== 'practice-modes') return
  if (route.query.error === '1') return // error 专项已由 onMounted 处理
  applyModeFromQuery()
})
// 英文子 tab 切换（浏览器前进/后退时恢复 section 状态）已随模式拆分移除
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeyDown)
  window.removeEventListener('keydown', onNavKeydown)
  window.removeEventListener('keyup', onKeyUp)
  window.removeEventListener('pagehide', onPageHide)
  window.removeEventListener('visibilitychange', onVisibilityChange)
  for (const t of flashTimers.values()) clearTimeout(t)
  flashTimers.clear()
  endSession()
})
</script>

<style scoped>
.pageCenter {
  min-height: calc(100vh - 52px);
  min-height: calc(100dvh - 52px);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px calc(12px + env(safe-area-inset-left)) calc(env(safe-area-inset-bottom)) calc(12px + env(safe-area-inset-right));
  position: relative;
}

.mask { position: absolute; inset: 0; display: none; align-items: center; justify-content: center; z-index: 30; padding: 24px; background: transparent; }
.mask.active { display: flex; }
.mask p { text-align: center; color: var(--theme-text-color); font-size: 18px; line-height: 1.7; }
.startHint { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; padding: 24px; pointer-events: none; }
.startHint p { text-align: center; color: var(--theme-text-color); font-size: 18px; line-height: 1.7; opacity: 0.75; }

.practiceArea { flex: 1; width: 100%; max-width: 1400px; display: flex; flex-direction: column; align-items: center; justify-content: flex-start; gap: 18px; }

/* 今日目标已移至顶部工具栏（TopStatusBar），此处仅保留完成弹窗提示样式 */
/* 完成弹窗：本次错词展示 + 刻意练习 */
.sessionMistakeBox {
  margin-top: 14px;
  padding: 12px 14px;
  border-radius: 10px;
  background: var(--theme-background-light-color);
  border: 1px solid var(--theme-border-color);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}
.smTitle { font-size: 13px; font-weight: 700; color: var(--theme-main-text-color); }
.smChips { display: flex; flex-wrap: wrap; justify-content: center; gap: 6px; max-height: 96px; overflow-y: auto; }
.smChip {
  font-size: 13px;
  padding: 4px 10px;
  border-radius: 16px;
  background: var(--theme-background-color);
  border: 1px solid #f56c6c55;
  color: #f56c6c;
  font-weight: 600;
}
.sessionMistakeBox .btn { padding: 8px 20px; }

/* 英文评测卡：错词区去背景块 + chip 去边框，纯文字展示 */
.resultPageInner .sessionMistakeBox {
  background: transparent;
  border: none;
  padding: 0;
  margin-top: 0;
  align-items: flex-start;
  text-align: left;
}
.resultPageInner .smChips { justify-content: flex-start; }
.resultPageInner .smChips .smChip:nth-child(n) { margin-bottom: 0; }
.resultPageInner .smChip {
  background: transparent;
  border: none;
  padding: 4px 0;
  color: #e05353;
  font-weight: 600;
}

/* 完成弹窗：今日目标达成提示 */
.goalResult {
  margin-top: 14px;
  padding: 10px 14px;
  border-radius: 10px;
  background: var(--theme-background-light-color);
  border: 1px solid var(--theme-border-color);
  font-size: 13px;
  color: var(--theme-text-color);
  line-height: 1.6;
}
.goalResult.done {
  border-color: #3db389;
  color: #2c8f6a;
  font-weight: 600;
}
.goalResult span { margin-right: 8px; }

/* 英文单词（参考 localhost:3002 整句流式练习） */
.enStage { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 18px; width: 100%; flex: 1; }
/* 自定义模式：当前句中文翻译（显示在句子上方） */
.enSentenceCn {
  font-size: 24px;
  font-weight: 500;
  color: #444444;                   /* 与主英文词 spWord 一致的深灰（浅色模式） */
  max-width: 90%;
  text-align: center;
  line-height: 1.4;
}
.dark .enSentenceCn, [data-theme='dark'] .enSentenceCn { color: #e2e8f0; }  /* 暗色模式浅色文字 */
/* 完成态结构图下方的整句中文（占满整行，与卡片堆留距） */
.spParse .spCn {
  flex-basis: 100%;
  font-size: 26px;
  margin-top: 10px;
  opacity: 0.92;
  animation: spCnIn .2s ease-out both;
  animation-delay: calc(var(--gi, 0) * 20ms + 380ms);
}
/* 英文自定义内容面板 */
.enCustomPanel {
  width: 560px;
  max-width: 94vw;
}
.enCustomPanel .customTitle {
  font-size: 14px;
  font-weight: 700;
  color: var(--theme-main-text-color);
  margin-bottom: 10px;
}
/* 词库年级选择器：单词模式配置区 */
.enGradeRow {
  display: flex;
  justify-content: center;
  margin-top: 12px;
}
.enGradeSelect {
  padding: 6px 14px;
  border-radius: 8px;
  border: 1px solid var(--theme-border-color);
  background: var(--theme-background-light-color);
  color: var(--theme-menu-text-color);
  font-size: 13px;
  cursor: pointer;
  outline: none;
}
.enGradeSelect:focus {
  border-color: var(--theme-menu-hover-color);
}
/* 内置短文列表 */
.storyPanel {
  width: 560px;
  max-width: 94vw;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 24px;
  background: var(--theme-background-light-color);
  border: 1px solid var(--theme-border-color);
  border-radius: 12px;
}
.storyPanelTitle {
  font-size: 14px;
  font-weight: 700;
  color: var(--theme-main-text-color);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
/* 浏览主题课包课程列表时加宽：卡片墙可排多列（参考 julebu 官网宽版课程网格） */
.storyPanelWide {
  width: min(1240px, 96vw);
}
.storyAddBtn {
  font-size: 12px;
  padding: 4px 10px;
}
.storyBackBtn {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 12px;
  padding: 5px 10px;
  border-radius: 8px;
  border: 1px solid var(--theme-border-color);
  background: var(--theme-background-color);
  color: var(--theme-menu-text-color);
  cursor: pointer;
  transition: all .15s ease;
  flex-shrink: 0;
}
.storyBackBtn:hover {
  border-color: var(--theme-menu-hover-color);
  background: color-mix(in srgb, var(--theme-menu-hover-color) 6%, var(--theme-background-color));
}
.customEditor {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  border: 1px dashed var(--theme-border-color);
  border-radius: 10px;
  background: var(--theme-background-color);
}
.customTitleInput {
  padding: 6px 10px;
  border-radius: 8px;
  border: 1px solid var(--theme-border-color);
  background: var(--theme-background-color);
  color: var(--theme-main-text-color);
  font-size: 14px;
  outline: none;
}
.storyItemWrap {
  position: relative;
  display: flex;
}
.storyItemWrap .storyItem {
  flex: 1;
  width: 100%;
}
.storyItemWrap:hover .storyEdit,
.storyItemWrap:hover .storyDel,
.storyItemWrap:focus-within .storyEdit,
.storyItemWrap:focus-within .storyDel {
  opacity: 1;
}
.storyDel {
  position: absolute;
  right: 4px;
  top: 50%;
  transform: translateY(-50%);
  width: 34px;
  border-radius: 10px;
  border: 1px solid var(--theme-border-color);
  background: transparent;
  color: var(--theme-menu-text-color);
  font-size: 16px;
  line-height: 1;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.15s ease;
}
.storyEdit {
  position: absolute;
  right: 40px;
  top: 50%;
  transform: translateY(-50%);
  width: 34px;
  border-radius: 10px;
  border: 1px solid var(--theme-border-color);
  background: transparent;
  color: var(--theme-menu-text-color);
  font-size: 15px;
  line-height: 1;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.15s ease;
}
.storyEdit:hover {
  color: #3498db;
  border-color: #3498db;
}
.storyDel:hover {
  color: #e74c3c;
  border-color: #e74c3c;
}
.storyList {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.storyItem {
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 12px 16px;
  border-radius: 10px;
  border: 1px solid var(--theme-border-color);
  background: var(--theme-background-color);
  color: var(--theme-main-text-color);
  font-size: 15px;
  cursor: pointer;
  text-align: left;
  transition: all .15s ease;
}
.storyItem:hover {
  border-color: var(--theme-menu-hover-color);
  background: color-mix(in srgb, var(--theme-menu-hover-color) 4%, var(--theme-background-color));
}
.storyMeta {
  font-size: 12px;
  color: var(--theme-menu-text-color);
}
.storySubtitle {
  font-size: 12.5px;
  color: var(--theme-menu-text-color);
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}
/* 主题课包·课程卡片网格（参考 julebu 官网卡片墙：多列网格 + 左上序号） */
.courseGrid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 10px;
}
.courseGrid .courseCard {
  position: relative;
  gap: 4px;
  min-height: 108px;
  padding: 28px 14px 12px;
  border-radius: 12px;
  justify-content: center;
  overflow: hidden;
  transition: all .18s ease;
  cursor: pointer;
}
.courseGrid .courseCard:hover {
  border-color: var(--theme-menu-hover-color);
  background: color-mix(in srgb, var(--theme-menu-hover-color) 6%, var(--theme-background-light-color));
}
.courseOrder {
  position: absolute;
  top: 8px;
  left: 10px;
  font-size: 11px;
  font-weight: 700;
  color: var(--theme-menu-text-color);
  opacity: 0.75;
  letter-spacing: 0.5px;
}
.courseCard .courseTitle {
  font-size: 14px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.courseCard .courseDone {
  color: #2e9e5b;
}
/* 主题课包浏览器 */
.packBrowser {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin: 6px 0 12px;
}
.packDesc {
  font-size: 13px;
  line-height: 1.6;
  color: var(--theme-menu-text-color);
  padding: 2px 2px 4px;
}
.packTitle {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 600;
}
.packTitleText {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.packLoadingTip {
  font-size: 12px;
  font-weight: 400;
  color: var(--theme-menu-text-color);
}
.packEmpty,
.packError {
  font-size: 13px;
  color: var(--theme-menu-text-color);
  padding: 6px 2px;
}
.packError {
  color: var(--destructive, #e5534b);
}
.packBuiltinLabel {
  font-size: 12px;
  color: var(--theme-menu-text-color);
  padding: 8px 2px 2px;
  border-top: 1px dashed var(--theme-border-color);
}
.storyItem[disabled] {
  opacity: 0.5;
  cursor: default;
}
.enSentence {
  display: flex;
  flex-wrap: nowrap; /* 单行不换行：重练词追加在原行右侧 */
  justify-content: center; /* fallback：浏览器不支持 safe 时居中 */
  justify-content: safe center; /* 内容不足时居中；过长需滚动时退回左对齐，避免裁掉第一个词 */
  align-items: center;
  gap: 10px;
  max-width: 100%;
  flex-shrink: 0;
  padding: 20px 16px;
  overflow-x: auto; /* 横向滚动保持当前词可见 */
  scrollbar-width: none;
  -webkit-overflow-scrolling: touch;
}
.enSentence::-webkit-scrollbar { display: none; }
/* 词间标点（开启设置后显示）：不参与输入，灰色装饰 */
.enPunct {
  color: var(--text-muted, #999);
  font-size: 0.85em;
  margin-left: -4px;
  margin-right: -4px;
  user-select: none;
  flex-shrink: 0;
}
/* 短文模式：一句话内单词间距更紧凑（单词模式保持默认 gap:10px） */
.enSentence.story { gap: 6px; }
.enSentence.story .word-box { padding: 6px 4px; }
/* 两行容器：第一行（正常词）+ 第二行（重练词）。固定 height 为第二行预留空间，避免第一行上下抖动 */
.enSentenceWrap {
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 100%;
  height: 210px;
}
/* 第二行：出错后补练的重练词，与第一行同字号 */
.enSentenceRedo {
  padding: 8px 16px;
  gap: 8px;
  flex-shrink: 0;
}
.enSentenceRedo .word-box { padding: 5px 10px; }
/* 左侧淡出：只在句子实际横向滚动后出现（未滚动时第一个词不能淡出） */
.enSentence.left-fade {
  mask-image: linear-gradient(to right, transparent 0, black 90px, black 100%);
  -webkit-mask-image: linear-gradient(to right, transparent 0, black 90px, black 100%);
}
.word-col {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}
.word-col.completed .letter.correct {
  color: #444444;               /* 已完成词：与主文本一致的深灰（浅色模式） */
  opacity: 1;
}
.dark .word-col.completed .letter.correct,
[data-theme='dark'] .word-col.completed .letter.correct { color: #e2e8f0; }  /* 暗色模式浅色 */
[data-theme='light'] .word-col.completed .letter.correct { color: #444444; }
.word-box {
  display: inline-flex;
  gap: 2px;
  padding: 6px 10px;
  border-radius: 8px;
  border: 2px solid transparent;
  transition: border-color .15s ease, opacity .2s ease, background .15s ease;
}
.word-letters {
  display: inline-flex;
  gap: 2px;
  font-size: 40px;
  font-weight: 600;
  line-height: 1.3;
}
/* 中文标注：在方框上方，字号加大 */
.word-cn {
  font-size: 15px;
  font-weight: 500;
  color: var(--theme-rich-text-color);
  opacity: 0.9;
  line-height: 1.2;
  white-space: nowrap;
  /* 始终占位：没有中文翻译的词也保留中文行高度，保证英文整行对齐 */
  min-height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
}
/* 词下方平均耗时：始终占位（无值也保留高度，避免改变中文/英文位置） */
.word-time {
  font-size: 11px;
  line-height: 1;
  min-height: 12px;
  color: var(--theme-rich-text-color);
  font-variant-numeric: tabular-nums;
  visibility: hidden;
}
.word-time.has-value {
  visibility: visible;
  opacity: 0.85;
}
.word-col.active .word-cn {
  opacity: 1;
  color: var(--theme-main-text-color);
}
/* 默写模式：未输入的字母隐藏为横线（透明度与普通未输入字母一致） */
.word-box .letter.hidden {
  color: transparent;
  opacity: 0.17;
  border-bottom-color: var(--theme-text-color);
}
/* 字母槽线常驻：未输入/已输入/标点等都保留同一条底部线（输入前后样式一致）。
   仅在正在输入的那一格(current/dict-current)短暂用主题色强调，打完后回归常线 */
.word-box .letter { color: var(--theme-text-color); opacity: 0.17; border-bottom: 5px solid color-mix(in srgb, var(--theme-text-color) 30%, transparent); transition: color .12s ease, opacity .12s ease, border-color .12s ease; }
/* 标点字符（并入单词）：灰色显示，不参与着色/默写隐藏 */
.word-box .letter.punct { color: var(--text-muted, #999); opacity: 0.55; }
/* 标点字符：已输入（正确）→ 深灰实色 */
.word-box .letter.punct-done { color: var(--text-muted, #777); opacity: 0.95; }
/* 标点字符：当前位置（等待输入）→ 主题色高亮 */
.word-box .letter.punct-current { color: var(--theme-accent, #4a90d9); opacity: 1; }
/* 词根分段：未输入字母按 前缀/词根/后缀 渲染不同深浅灰色 */
/* 词根分段：不同色相的灰色区分（冷灰=前缀，中性=第一个词根，青绿灰=后续词根，暖灰=后缀） */
.word-box .letter.seg-pre { color: #8fa8c9; opacity: 0.55; }
.word-box .letter.seg-root { color: #c2c2c2; opacity: 0.8; }
.word-box .letter.seg-root2 { color: #8fb8ab; opacity: 0.75; }
.word-box .letter.seg-suf { color: #c9a88a; opacity: 0.55; }
/* 音节着色：不同色相区分发音块（syl-0~syl-4 循环），未输入字母半透明 */
.word-box .letter.syl-0 { color: #5b9bd5; }
.word-box .letter.syl-1 { color: #70ad47; }
.word-box .letter.syl-2 { color: #ed7d31; }
.word-box .letter.syl-3 { color: #9b59b6; }
.word-box .letter.syl-4 { color: #e74c3c; }
.word-box .letter.syl-0,
.word-box .letter.syl-1,
.word-box .letter.syl-2,
.word-box .letter.syl-3,
.word-box .letter.syl-4 {
  opacity: 0.55;
}
/* 已完成词在音节模式下：保留音节色，不降为深灰 */
.word-col.completed .word-box .letter.syl-0,
.word-col.completed .word-box .letter.syl-1,
.word-col.completed .word-box .letter.syl-2,
.word-col.completed .word-box .letter.syl-3,
.word-col.completed .word-box .letter.syl-4 {
  opacity: 0.75;
}
.word-box .letter.correct { color: var(--theme-main-text-color); opacity: 1; }
/* 重练词（出错后自动补练）：完成后的字母用暖橙色区分，与正常完成词颜色不同 */
.word-col.redo .word-box .letter.correct {
  color: #e6a23c;
  opacity: 0.95;
}
.word-box .letter.current {
  /* 当前位置：半透文字 + 淡背景 + 中性线 */
  color: color-mix(in srgb, var(--theme-main-text-color) 20%, transparent);
  opacity: 1;
  border-bottom: 5px solid var(--theme-border-color);
  background: color-mix(in srgb, var(--theme-border-color) 12%, transparent);
  border-radius: 3px;
}
.word-box .letter.dict-current {
  /* 默写·关闭当前字母提示：字母隐藏（仅下划线 + 淡背景定位输入位置） */
  color: transparent;
  opacity: 1;
  border-bottom: 5px solid var(--theme-menu-hover-color);
  background: color-mix(in srgb, var(--theme-menu-hover-color) 12%, transparent);
  border-radius: 3px;
}
.word-box .letter.incorrect {
  color: #f56c6c;
  opacity: 1;
  border-bottom: 5px solid #f56c6c;
}
.enProgress { font-size: 14px; color: var(--theme-text-color); display: flex; align-items: center; flex-wrap: wrap; gap: 8px; margin-top: auto; }
.enHint { font-size: 13px; color: var(--theme-rich-text-color); }
/* 顶部进度标题（英文进行中）左栏 + 右上角模式 chip */
.enProgHeader {
  flex: 1;
  min-width: 0;
}
.enProgTitle {
  font-size: 20px;
  font-weight: 600;
  color: var(--theme-main-text-color);
}
.enProgTitle span { font-weight: normal; color: var(--theme-text-secondary, #6b7280); }
/* 右上角模式切换（句乐部样式：紫色半透明 chip，点击弹面板）
   定位父级 .app（全屏 flex 列容器）：练习进行中时固定右上角 */
.enModeBox {
  position: fixed;
  top: 56px;
  right: 16px;
  z-index: 80;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.enModeChip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 12px;
  border-radius: 999px;
  border: 1px solid var(--theme-border-color);
  background: var(--theme-surface-color, rgba(128,128,128,.06));
  color: var(--theme-main-text-color);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all .15s ease;
  backdrop-filter: blur(8px);
}
.enModeChip:hover { background: var(--theme-mistake-bg, rgba(128,128,128,.1)); }
.enModeChip.open { background: var(--theme-mistake-bg, rgba(128,128,128,.12)); }
.enModeLock { flex-shrink: 0; }
.enModeCaret { flex-shrink: 0; opacity: .8; transition: transform .15s; }
.enModeChip.open .enModeCaret { transform: rotate(180deg); }
/* 模式分隔符 | */
.enModeSep {
  color: var(--theme-border-color);
  font-size: 13px;
  opacity: .5;
  user-select: none;
}
/* 听写/中译英切换按钮 */
.enModeDicChip {
  display: inline-flex;
  align-items: center;
  padding: 0 10px;
  height: 28px;
  border-radius: 999px;
  border: 1px solid var(--theme-border-color);
  background: transparent;
  color: var(--theme-text-secondary, #6b7280);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all .15s ease;
  backdrop-filter: blur(8px);
}
.enModeDicChip:hover {
  background: var(--theme-mistake-bg, rgba(128,128,128,.08));
}
.enModeDicChip.dictation {
  background: var(--theme-mistake-bg, rgba(128,128,128,.1));
  color: var(--theme-main-text-color);
  font-weight: 600;
}
/* 显示模式下拉 */
.enModeDispBox {
  position: relative;
  display: inline-flex;
}
.enModeDispChip {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 0 10px;
  height: 28px;
  border-radius: 999px;
  border: 1px solid var(--theme-border-color);
  background: transparent;
  color: var(--theme-text-secondary, #6b7280);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all .15s ease;
  backdrop-filter: blur(8px);
}
.enModeDispChip:hover {
  background: var(--theme-mistake-bg, rgba(128,128,128,.08));
}
.enModeDispChip.open {
  background: var(--theme-mistake-bg, rgba(128,128,128,.1));
  color: var(--theme-main-text-color);
}
/* 开关选项芯片组 */
.enModeOptChips {
  display: inline-flex;
  gap: 4px;
}
.enModeOptChip {
  display: inline-flex;
  align-items: center;
  padding: 0 8px;
  height: 26px;
  border-radius: 999px;
  border: 1px solid var(--theme-border-color);
  background: transparent;
  color: var(--theme-text-secondary, #6b7280);
  font-size: 11px;
  cursor: pointer;
  transition: all .15s ease;
}
.enModeOptChip:hover {
  background: var(--theme-mistake-bg, rgba(128,128,128,.08));
  color: var(--theme-main-text-color);
}
.enModeOptChip.on {
  background: var(--theme-mistake-bg, rgba(128,128,128,.1));
  color: var(--theme-main-text-color);
  font-weight: 600;
  border-color: var(--theme-text-secondary, #6b7280);
}
.enModeDispCaret {
  flex-shrink: 0;
  opacity: .7;
  transition: transform .15s;
}
.enModeDispChip.open .enModeDispCaret {
  transform: rotate(180deg);
}
/* 下拉面板分隔线 */
.enModeDictateDivider {
  border-top: 1px dashed var(--theme-border-color);
  margin: 2px 0;
}
/* 开关选项组 */
.enModeOpts {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 2px 0;
}
.enModeOpt {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 5px 10px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  color: var(--theme-main-text-color);
  transition: background .15s;
}
.enModeOpt:hover {
  background: var(--theme-mistake-bg, rgba(128,128,128,.06));
}
.enModeOpt input[type="checkbox"] {
  accent-color: var(--theme-accent-color, #ac47ff);
}
.enModeDispPanel {
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  min-width: 160px;
  padding: 6px;
  border-radius: 10px;
  border: 1px solid var(--theme-border-color);
  background: var(--theme-background-color, var(--card, #fff));
  box-shadow: 0 8px 24px rgba(0,0,0,.1);
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.enModeDispOpt {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 1px;
  padding: 7px 10px;
  border: none;
  border-radius: 6px;
  background: transparent;
  cursor: pointer;
  text-align: left;
}
.enModeDispOpt:hover {
  background: var(--theme-mistake-bg, rgba(128,128,128,.1));
}
.enModeDispOpt.active {
  background: color-mix(in srgb, var(--theme-accent-color, #ac47ff) 14%, transparent);
}
.enModeDispOptLabel {
  font-size: 13px;
  font-weight: 600;
  color: var(--theme-main-text-color);
}
.enModeDispOpt.active .enModeDispOptLabel {
  color: var(--theme-main-text-color);
}
.enModeDispOptDesc {
  font-size: 11px;
  color: #999;
  line-height: 1.3;
  white-space: nowrap;
}
.enModeDispOptRow {
  display: flex;
  align-items: center;
  width: 100%;
  gap: 8px;
}
.enModeDispOptMeta {
  margin-left: auto;
  font-size: 11px;
  color: #bbb;
  font-weight: 500;
}
.enModeDispOpt:disabled {
  opacity: .4;
  cursor: not-allowed;
  pointer-events: none;
}
/* 下拉面板 */
.enModePanel {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  min-width: 220px;
  padding: 8px;
  border-radius: 12px;
  border: 1px solid var(--theme-border-color);
  background: var(--theme-background-color, var(--card, #fff));
  box-shadow: 0 12px 32px rgba(0,0,0,.12);
  display: flex;
  flex-direction: column;
  gap: 6px;
}

/* 句子跳转：当前句号可点击进入直接输入模式 */
.enJumpSentence {
  display: inline-block;
  padding: 0 2px;
  border-bottom: 1px dashed var(--theme-border-color);
  cursor: text;
  font-weight: 600;
  color: var(--theme-main-text-color);
  min-width: 1.2em;
  text-align: center;
}
.enJumpInput {
  width: 3.2em;
  padding: 1px 4px;
  font-size: 15px;
  font-weight: 600;
  text-align: center;
  border-radius: 6px;
  border: 1px solid var(--theme-menu-hover-color);
  background: var(--theme-background-color);
  color: var(--theme-main-text-color);
  outline: none;
}
.enProgHint { font-size: 13px; color: var(--theme-rich-text-color); }
.enActionBtn {
  font-size: 12px;
  padding: 3px 8px;
  border-radius: 8px;
  border: 1px solid var(--theme-border-color);
  background: var(--theme-background-color);
  color: var(--theme-main-text-color);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  transition: all .15s ease;
}
.enActionBtn:hover:not(:disabled) {
  border-color: var(--theme-menu-hover-color);
  background: color-mix(in srgb, var(--theme-menu-hover-color) 6%, var(--theme-background-color));
}
.enActionBtn svg { flex: none; }
.enActionBtn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

/* 评级弹层（复刻官网 comboPopup：居中一行简单文字，如 Perfect × 4，无背景装饰） */
.combo-popup {
  position: fixed;
  top: 15vh;               /* 相对靠上 */
  left: 50%;
  transform: translateX(-50%);
  display: inline-flex;
  align-items: baseline;
  justify-content: center;
  gap: 12px;
  z-index: 400;
  pointer-events: none;   /* 不挡点击/打字 */
  user-select: none;
  white-space: nowrap;
}
/* 评级词：渐变金 → 橙，粗斜体 + 柔和光晕（纯文字，无背景块） */
.comboRating {
  font-size: 42px;
  font-weight: 800;
  font-style: italic;
  line-height: 1;
  letter-spacing: 0.8px;
  background: linear-gradient(180deg, #ffd76a 8%, #f59e0b 55%, #ef7d1f 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  filter: drop-shadow(0 2px 6px rgba(245, 158, 11, 0.35)) drop-shadow(0 0 18px rgba(245, 158, 11, 0.18));
  text-transform: capitalize;
}
/* 连击数：深色实字，沉稳衬托 */
.comboCount {
  font-size: 22px;
  font-weight: 600;
  line-height: 1;
  color: var(--theme-main-text-color);
  letter-spacing: 0.3px;
}

/* 简化动画：从下向上位移滑出（配合弹层固定定位的水平居中，用 translate 组合实现） */
.combo-pop-enter-active { transition: transform .22s ease-out, opacity .22s ease-out; }
.combo-pop-leave-active { transition: transform .18s ease-in, opacity .18s ease-in; }
.combo-pop-enter-from { opacity: 0; transform: translate(-50%, 24px); }
.combo-pop-leave-to   { opacity: 0; transform: translate(-50%, 14px); }

/* 整句完成态入场微动画（与 combo 音效匹配：快速短促，节奏感）
   时序：英文单词最先出现（核心主体），组框/角色胶囊/辅助文字依次跟进
   英文单词：即时滑入，无延迟
   组框边框：主体接近完成时跟进淡入（opacity 0.2→1，子元素始终可见）
   角色胶囊：组框出现后弹入
   辅助文字（音标/释义/词性）：最后淡入 */
@keyframes spParseIn {
  from { opacity: 0; transform: scale(0.97) translateY(6px); }
  to   { opacity: 1; transform: scale(1) translateY(0); }
}
@keyframes spGroupIn {
  from { opacity: 0.2; }
  to   { opacity: 1; }
}
@keyframes spChipBounce {
  0%   { transform: translate(-50%, -58%) scale(0.5); opacity: 0; }
  55%  { transform: translate(-50%, -58%) scale(1.12); }
  100% { transform: translate(-50%, -58%) scale(1); opacity: 1; }
}
@keyframes spWordUp {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes spAuxIn {
  from { opacity: 0; transform: translateY(3px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes spCnIn {
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 0.92; transform: translateY(0); }
}

/* 整句完成态：官网式句子成分结构图（参考 julebu.co 练习页）
   结构：成分 = 圆角组框 + 顶部悬浮实色胶囊；词卡 = 音标/大字词/彩色下划线/释义/灰色词性 */
.spParse {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: center;
  gap: 12px 16px;
  padding: 6px 4px 4px;
  max-width: 920px;
  margin: 0 auto;
}
.spGroup {
  position: relative;
  display: inline-flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: center;
  gap: 8px 14px;
  border: 1.5px solid;
  border-radius: 18px;
  padding: 16px 12px 8px; /* 顶部留出胶囊悬浮空间 */
  transition: box-shadow .15s ease;
  background: color-mix(in srgb, var(--theme-background-light-color) 38%, transparent);
  animation: spGroupIn .15s ease-out both;
  animation-delay: calc(var(--gi, 0) * 20ms + 280ms);
}
.spGroup:hover { box-shadow: 0 4px 14px rgba(0, 0, 0, 0.10); }
/* 无成分结构的整句（如 friends 对话版无拆解）：词卡平铺，不套组框 */
.spGroup.plain {
  border: none;
  background: transparent;
  padding: 2px 2px 6px;
  box-shadow: none;
}
.spChip {
  position: absolute;
  left: 50%;
  top: 0;
  transform: translate(-50%, -58%);
  background: var(--sp-chip);
  color: #fff;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 1px;
  line-height: 1;
  padding: 4px 9px;
  border-radius: 999px;
  white-space: nowrap;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.18);
  animation: spChipBounce .2s ease-out both;
  animation-delay: calc(var(--gi, 0) * 20ms + 340ms);
}
/* 词卡单元：grid 四行——音标 / 词(+下划线) / 释义 / 词性 */
.spUnit {
  position: relative;
  display: inline-grid;
  grid-template-rows: auto auto auto auto;
  justify-items: center;
  gap: 0;
  padding: 2px 3px;
  min-width: 0;
}
/* 悬停浮层：参考官网 hover 单词出成分讲解 */
.spTip {
  position: absolute;
  bottom: calc(100% - 14px);   /* 浮层定位在词上方（避让音标行留少许重叠） */
  left: 50%;
  transform: translateX(-50%) translateY(-6px);
  z-index: 80;
  width: max-content;
  max-width: 340px;
  padding: 9px 12px;
  border-radius: 10px;
  border: 1px solid var(--theme-border-color);
  background: var(--theme-background-color);
  box-shadow: 0 8px 22px rgba(0, 0, 0, 0.16);
  opacity: 0;
  visibility: hidden;
  transition: opacity .16s ease, transform .16s ease, visibility .16s;
  pointer-events: none;
  text-align: left;
}
.spUnit:hover .spTip {
  opacity: 1;
  visibility: visible;
  transform: translateX(-50%) translateY(0);
}
.spTipTitle {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}
.spTipRole {
  font-size: 13px;
  font-weight: 700;
  color: var(--theme-main-text-color);
}
.spTipType {
  font-size: 11px;
  color: var(--theme-text-color);
  opacity: 0.75;
  font-style: italic;
  letter-spacing: 0.3px;
}
.spTipBody {
  font-size: 12px;
  line-height: 1.6;
  color: var(--theme-main-text-color);
}
.spPh {
  display: block;
  font-size: 11px;
  line-height: 1.3;
  min-height: 15px;               /* 无音标时也占行，保证词行对齐 */
  color: var(--theme-text-color);
  opacity: 0.75;
  white-space: nowrap;
  margin-bottom: 3px;
  user-select: none;
  animation: spAuxIn .15s ease-out both;
  animation-delay: calc(var(--gi, 0) * 20ms + 300ms);
}
.spCell {
  position: relative;             /* 标点 absolute 于词身右缘：不占列宽 → 底部标签行只对齐词身 */
  line-height: 1;
}
.spWord {
  position: relative;
  display: inline-block;
  font-size: 40px;
  font-weight: 600;
  line-height: 1.15;
  color: #444444;                    /* 主词深灰（浅色模式） */
  letter-spacing: 0.2px;
  padding: 0 2px 5px;                /* 底部留出词性线空间 */
  cursor: pointer;
  user-select: none;
  animation: spWordUp .18s ease-out both;
  animation-delay: calc(var(--gi, 0) * 20ms);
}
.dark .spWord, [data-theme='dark'] .spWord { color: #e2e8f0; }  /* 暗色模式浅色文字 */
.dark .spPunct, [data-theme='dark'] .spPunct { color: #e2e8f0; }  /* 暗色模式标点浅色 */
[data-theme='light'] .spWord { color: #444444; }
[data-theme='light'] .spPunct { color: #444444; }
.spUl {
  position: absolute;
  left: 2px;
  right: 2px;
  bottom: 0;
  height: 4px;
  border-radius: 999px;
  opacity: 0.9;
  pointer-events: none;
}
/* 词后标点（, . ! ? …）：与主词同行同字号、同一基线，不参与词性/成分标记 */
.spPunct {
  display: inline-block;
  font-size: 40px;
  font-weight: 600;
  line-height: 1.15;
  color: #444444;
  opacity: 0.55;
  user-select: none;
  pointer-events: none;
  margin-left: 1px;
}
.spDef {
  font-size: 13px;
  line-height: 1.35;
  min-height: 18px;   /* 空值也占行，卡片等高 */
  color: var(--theme-rich-text-color);
  text-align: center;
  max-width: 360px;
  white-space: nowrap;      /* 参考官网：释义单行不换行 */
  overflow: hidden;
  text-overflow: ellipsis;  /* 超长兜底省略号，避免撑爆布局 */
  margin-top: 2px;
  animation: spAuxIn .15s ease-out both;
  animation-delay: calc(var(--gi, 0) * 20ms + 300ms);
}
.spPos {
  font-size: 10px;
  min-height: 14px;   /* 空值也占行，卡片等高 */
  line-height: 1.4;
  color: var(--theme-text-color);
  opacity: 0.7;
  letter-spacing: 0.3px;
  margin-top: 2px;
  user-select: none;
  animation: spAuxIn .15s ease-out both;
  animation-delay: calc(var(--gi, 0) * 20ms + 300ms);
}
.spPos {
  font-size: 10px;
  line-height: 1.4;
  color: var(--theme-text-color);
  opacity: 0.7;
  letter-spacing: 0.3px;
  margin-top: 2px;
  user-select: none;
}
/* 语法讲解（点击组展开，显示在组框下方） */
.spExpl {
  flex-basis: 100%;
  text-align: center;
  font-size: 12px;
  line-height: 1.55;
  color: var(--theme-main-text-color);
  background: color-mix(in srgb, var(--theme-background-light-color) 60%, transparent);
  border-radius: 10px;
  padding: 6px 10px;
  margin-top: 4px;
  border: 1px dashed var(--theme-border-color);
  cursor: default;
}

/* 键盘数字 */
.numStage { display: flex; flex-direction: column; align-items: center; gap: 14px; }
.numGroup { display: flex; gap: 8px; font-size: 56px; font-weight: 700; font-variant-numeric: tabular-nums; }
.numDigit { opacity: 0.35; color: var(--theme-text-color); }
.numDigit.typed { opacity: 0.75; }
.numDigit.current { opacity: 1; color: var(--theme-main-text-color); transform: scale(1.1); border-bottom: 3px solid var(--theme-menu-hover-color); }
.numHint { font-size: 13px; color: var(--theme-rich-text-color); }

/* 字母键位 */
.letterStage { display: flex; flex-direction: column; align-items: center; gap: 14px; position: relative; z-index: 40; }
.letterLevels { display: flex; gap: 8px; flex-wrap: wrap; justify-content: center; }
.levelBtn {
  padding: 6px 14px;
  border-radius: 8px;
  border: 1px solid var(--theme-border-color);
  background: var(--theme-background-light-color);
  color: var(--theme-menu-text-color);
  cursor: pointer;
  font-size: 13px;
}
.levelBtn.active {
  border-color: var(--theme-menu-hover-color);
  box-shadow: 0 0 0 2px #35e2b733 inset;
  color: var(--theme-main-text-color);
}
.letterGroup { display: flex; gap: 8px; font-size: 56px; font-weight: 700; }
.letterDigit { opacity: 0.35; color: var(--theme-text-color); }
.letterDigit.typed { opacity: 0.75; }
.letterDigit.current { opacity: 1; color: var(--theme-main-text-color); transform: scale(1.1); border-bottom: 3px solid var(--theme-menu-hover-color); }

/* 拼音音节 */
.sylStage { display: flex; flex-direction: column; align-items: center; gap: 14px; }
.sylChar { font-size: 64px; font-weight: 700; color: var(--theme-main-text-color); line-height: 1; }
.sylGroup { display: flex; gap: 6px; font-size: 44px; font-weight: 700; }
.sylLetter { opacity: 0.35; color: var(--theme-text-color); }
.sylLetter.typed { opacity: 0.75; }
.sylLetter.current { opacity: 1; color: var(--theme-menu-hover-color); border-bottom: 3px solid var(--theme-menu-hover-color); }
/* 隐藏字母模式（卡片）：未输入字母透明，但每个字母位置始终保留下划线 */
.ankiSyl.hideMode .sylLetter { border-bottom: 2px solid var(--theme-border-color); }
.ankiSyl.hideMode .sylLetter.typed { border-color: var(--theme-text-color); }
.ankiSyl.hideMode .sylLetter.current { border-color: var(--theme-menu-hover-color); }
.sylLetter.blind { color: transparent; opacity: 1; }
/* 打错位置：显示正确字母但用警告色提示 */
.ankiSyl.hideMode .sylLetter.wrong { border-color: #f56c6c; }
.sylLetter.wrong { color: #f56c6c; opacity: 1; font-weight: 700; }

/* Anki 卡片 */
.cardStage { display: flex; flex-direction: column; align-items: center; gap: 14px; position: relative; z-index: 40; }
.ankiCard {
  width: 560px;
  max-width: 94vw;
  min-height: 240px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 28px 24px;
  background: var(--theme-background-light-color);
  border: 1px solid var(--theme-border-color);
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  position: relative;
}
.ankiCard.redo::after {
  content: '重练';
  position: absolute;
  top: 10px;
  right: 14px;
  font-size: 12px;
  color: var(--theme-rich-text-color);
}
.ankiDisplay { font-size: 52px; font-weight: 700; color: var(--theme-main-text-color); line-height: 1.3; text-align: center; letter-spacing: 2px; }
.ankiSyl { display: flex; flex-wrap: wrap; justify-content: center; gap: 8px 14px; font-size: 30px; font-weight: 600; }
.ankiSylItem { display: inline-flex; gap: 1px; opacity: 0.45; }
.ankiSylItem.done { opacity: 0.8; }
.ankiSylItem.current { opacity: 1; }
.ankiProgress { font-size: 14px; color: var(--theme-text-color); }

/* 自定义词表面板 */
.customPanel {
  width: 560px;
  max-width: 94vw;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 24px;
  background: var(--theme-background-light-color);
  border: 1px solid var(--theme-border-color);
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}
.customPanel textarea {
  width: 100%;
  height: 160px;
  padding: 12px;
  border-radius: 8px;
  border: 1px solid var(--theme-border-color);
  background: var(--theme-background-color);
  color: var(--theme-text-color);
  font-size: 15px;
  resize: vertical;
  outline: none;
}
.customPanel textarea:focus {
  border-color: var(--theme-menu-hover-color);
}
.customOpts {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}
.repeatLabel {
  font-size: 14px;
  color: var(--theme-text-color);
  display: flex;
  align-items: center;
  gap: 8px;
}
.repeatLabel input {
  width: 56px;
  padding: 6px 8px;
  border-radius: 6px;
  border: 1px solid var(--theme-border-color);
  background: var(--theme-background-color);
  color: var(--theme-text-color);
  text-align: center;
}
.customOpts .btn {
  flex: 0 0 auto;
  padding: 8px 22px;
}
.customOpts .btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 错题本面板 */
.mistakePanel {
  width: 560px;
  max-width: 94vw;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 24px;
  background: var(--theme-background-light-color);
  border: 1px solid var(--theme-border-color);
  border-radius: 12px;
}
.mistakeList {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  max-height: 240px;
  overflow-y: auto;
}
.mistakeItem {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: var(--theme-background-color);
  border: 1px solid var(--theme-border-color);
  border-radius: 999px;
  transition: all .15s ease;
}
.mistakeItem:hover {
  border-color: transparent;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
}
.mistakeWord { font-size: 15px; font-weight: 600; color: var(--theme-main-text-color); }
.mistakeCn { font-style: normal; font-weight: 400; font-size: 12px; color: var(--theme-menu-text-color); margin-left: 4px; }
.mistakeCount { font-size: 12px; color: #f56c6c; font-weight: 700; }
/* 英文错题本：慢词（太慢没想起来）用橙色，与打错红色区分 */
.mistakeCount:not(.err) { color: #e6a23c; }
/* 慢词刻意练习：显示耗时（橙色） */
.mistakeCount.slow { color: #e6a23c; }
/* 慢词卡片：简洁行（默认不展示词列表） */
.slowBar {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.slowBarTitle {
  font-size: 14px;
  font-weight: 700;
  color: var(--theme-main-text-color);
}
.slowBarMeta {
  font-size: 12px;
  color: var(--theme-menu-text-color);
}
.enMistakePanel { align-self: center; }
.enMistakePanel .btn:disabled { opacity: 0.4; cursor: not-allowed; }
.mistakeBookStage { width: 100%; max-width: 600px; margin: 0 auto; display: flex; flex-direction: column; gap: 12px; }
.mistakeOpts { display: flex; gap: 10px; }
.mistakeEmpty { color: var(--theme-text-color); font-size: 14px; text-align: center; padding: 20px 0; }

/* 会话状态栏（固定在页面底部） */
/* 完成弹窗 */
.overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 24px; }
.resultModal {
  background: var(--theme-background-color);
  border-radius: 12px;
  width: min(520px, 92vw);
  min-width: 320px;
  padding: 24px;
  text-align: center;
}
.resultModal h3 { margin: 0 0 16px; font-size: 20px; }

/* 英文模式浮动评测卡（半透明遮罩 + 居中卡片，参考「错题复盘完成」评测页布局） */
.resultPageInner {
  width: min(860px, 94vw);
  max-width: 860px;
  max-height: calc(100vh - 48px);
  overflow-y: auto;
  text-align: left;
  display: flex;
  flex-direction: column;
  gap: 18px;
  animation: rpIn 0.25s ease;
}
@keyframes rpIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
/* 顶部条：返回 + 标题在同一行 */
.rpTopbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.rpBack {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 8px 14px;
  border-radius: 8px;
  border: 1px solid var(--theme-border-color);
  background: var(--theme-background-light-color);
  color: var(--theme-menu-text-color);
  cursor: pointer;
  font-size: 14px;
}
.rpBack:focus-visible { outline: 2px solid var(--theme-menu-hover-color); outline-offset: 2px; }
.rpTitleRow { text-align: center; }
.rpTitle { display: block; font-size: 20px; font-weight: 700; color: var(--theme-main-text-color); }
.rpSubtitle { display: block; font-size: 12px; color: var(--theme-text-color); margin-top: 2px; }
/* 主统计区：横向一字排开，纯文字无背景块，用细分隔线分隔 */
.rpSummary {
  display: flex;
  align-items: center;
  justify-content: space-around;
  gap: 4px;
  padding: 4px 8px;
}
.rpItem {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  flex: 1;
  min-width: 0;
}
.rpItem + .rpItem { border-left: 1px solid var(--theme-border-color); }
.rpItemValue { font-size: 28px; font-weight: 700; line-height: 1; color: var(--theme-main-text-color); font-variant-numeric: tabular-nums; }
.rpItemValue.ok { color: #2c8f6a; }
.rpItemValue.wrong { color: #e05353; }
.rpItemLabel { font-size: 12px; color: var(--theme-text-color); }
/* 区块：无背景，只保留标题下方的细分隔线 */
.rpSection { padding: 2px 8px; }
.rpSectionTitle {
  font-size: 13px;
  font-weight: 700;
  color: var(--theme-main-text-color);
  margin-bottom: 14px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--theme-border-color);
}
/* 数据分析：5 列，纯文字无边框色块 */
.rpChart { display: flex; gap: 12px; }
.rpStat {
  flex: 1;
  min-width: 0;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}
.rpStatValue { font-size: 24px; font-weight: 700; color: var(--theme-main-text-color); font-variant-numeric: tabular-nums; }
.rpStatValue small { font-size: 13px; color: var(--theme-text-color); }
.rpStatLabel { font-size: 12px; color: var(--theme-text-color); }
/* 底部操作 */
.rpActions { display: flex; gap: 12px; margin-top: 4px; }
.rpActions .btn { flex: 1; padding: 12px; font-size: 15px; }
.rpActions .btn .shortcut { font-size: 12px; opacity: 0.75; margin-left: 4px; }
.rpActions .btn:focus-visible { outline: 2px solid var(--theme-menu-hover-color); outline-offset: 2px; }
@media (max-width: 640px) {
  .resultPageInner { max-height: calc(100vh - 32px); }
  .rpSummary { flex-wrap: wrap; }
  .rpItem { flex: 1 1 40%; }
  .rpItem:nth-child(odd) { border-left: none; }
  .rpChart { flex-wrap: wrap; }
  .rpStat { flex: 1 1 30%; }
  .rpActions { flex-wrap: wrap; }
  .rpActions .btn { flex: 1 1 45%; }
}

.resultStats { display: flex; gap: 12px; margin-bottom: 20px; }
.enResultStats { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 20px; }
.enResultStats .rStat { min-width: 108px; flex: 1 1 auto; }
.rStat { flex: 1; padding: 12px; background: var(--theme-background-light-color); border-radius: 8px; }
.rValue { display: block; font-size: 26px; font-weight: 700; color: var(--theme-main-text-color); }
.rLabel { font-size: 12px; color: var(--theme-text-color); }
.resultActions { display: flex; gap: 10px; margin-top: 18px; }
.resultActions .btn .shortcut { font-size: 12px; opacity: 0.75; margin-left: 2px; }
.resultActions .btn:focus-visible {
  outline: 2px solid var(--theme-menu-hover-color);
  outline-offset: 2px;
}
.recordBox {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 16px;
  padding: 8px 12px;
  border-radius: 8px;
  background: var(--theme-background-light-color);
  font-size: 13px;
  color: var(--theme-text-color);
}
.recordBox.new {
  border: 1px solid #f7ba2a;
  box-shadow: 0 0 0 2px #f7ba2a33 inset;
  color: var(--theme-main-text-color);
}
/* 英文评测卡：纪录去背景块，配合纯文字简洁风格 */
.resultPageInner .recordBox {
  background: transparent;
  border: none;
  box-shadow: none;
  margin-bottom: 0;
  padding: 0;
  justify-content: flex-start;
}
.resultPageInner .recordBox.new { box-shadow: none; color: var(--theme-main-text-color); }
.recordBadge { font-weight: 700; color: #f7ba2a; }
.modalHint { margin: 14px 0 0; font-size: 12px; color: var(--theme-rich-text-color); }
.btn {
  flex: 1;
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid var(--theme-border-color);
  background: var(--theme-background-light-color);
  color: var(--theme-menu-text-color);
  cursor: pointer;
  font-size: 14px;
}
.btn.primary { background: var(--theme-menu-text-color); border-color: var(--theme-menu-text-color); color: #fff; font-weight: 600; }

.footerSpace { height: 96px; }

/* 底部四指标（无背景，纯文本） */
.bottomStats {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 40;
  display: flex;
  gap: 14px;
  flex-wrap: wrap;
  justify-content: center;
  padding: 10px 12px calc(10px + env(safe-area-inset-bottom));
}
.bsItem { text-align: center; min-width: 72px; }
.bsValue { display: block; font-size: 18px; font-weight: 700; color: var(--theme-main-text-color); font-variant-numeric: tabular-nums; }
.bsValue small { font-size: 12px; color: var(--theme-text-color); }
.bsLabel { font-size: 11px; color: var(--theme-text-color); }
/* 底部指标条两侧的切句箭头（上一句/下一句） */
.bsArrow {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  margin: auto 2px;
  border-radius: 50%;
  border: 1px solid var(--theme-border-color);
  background: var(--theme-background-color);
  color: var(--theme-main-text-color);
  cursor: pointer;
  transition: background .15s ease, border-color .15s ease, color .15s ease, transform .1s ease;
  padding: 0;
  flex: none;
}
.bsArrow svg { width: 20px; height: 20px; }
.bsArrow:hover:not(:disabled) {
  background: var(--theme-menu-hover-color, color-mix(in srgb, var(--theme-primary-color) 12%, transparent));
  border-color: var(--theme-primary-color, #4a90d9);
}
.bsArrow:active:not(:disabled) { transform: scale(0.92); }
.bsArrow:disabled {
  opacity: 0.28;
  cursor: not-allowed;
  border-style: dashed;
}

@media (max-width: 600px) {
  .word-letters { font-size: 32px; }
  .numGroup { font-size: 40px; }
  .letterGroup { font-size: 40px; }
  .sylGroup { font-size: 34px; }
  .sylChar { font-size: 48px; }
  .ankiDisplay { font-size: 36px; }
  .ankiSyl { font-size: 22px; }
  .ankiCard { min-height: 190px; padding: 20px 14px; }
}
</style>
