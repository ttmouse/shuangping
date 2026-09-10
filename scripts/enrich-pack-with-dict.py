#!/usr/bin/env python3
"""
Enrich a plain-text course pack with per-word dictionary data — Anki-插件式批量查词。

For each sentence in the pack's L*.json, tokenize English into words, then look up
each unique word via two PUBLIC youdao HTTP endpoints (no LLM, ~zero tokens):
  1. /suggest  -> part of speech + Chinese definition  (explain "n. 农场")
  2. detail page via local vite proxy (/api/youdao) or youdao jsonapi_s -> phonetics

Output: fills sentence[].wordDetails[] and (optionally) statement[].details{}
matching the julebu course-pack schema, so packs behave like real captured ones.

Usage:
  python3 scripts/enrich-pack-with-dict.py <packDir> [--no-phonetic]
Example:
  python3 scripts/enrich-pack-with-dict.py LocalCoursePacks/farm-day-at-the-farm
"""
import sys, os, json, re, time, glob, urllib.request, urllib.parse

UA = {'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'}
WORD_RE = re.compile(r"[A-Za-z]+(?:'[A-Za-z]+)?")

def fetch_json(url):
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=10) as r:
        return json.loads(r.read().decode('utf-8'))

def suggest(word):
    """有道 suggest → {pos_prefix, definition} 或 None"""
    url = 'https://dict.youdao.com/suggest?num=5&ver=3.0&doctype=json&cache=false&le=en&q=' + urllib.parse.quote(word)
    try:
        d = fetch_json(url)
        for e in d.get('data', {}).get('entries', []):
            if e.get('entry', '').lower() == word:
                return e.get('explain', '')
    except Exception:
        return None
    return None

def pos_and_def(explain):
    """explain 形如 'n. 农场，养殖场; v. 耕种' → 拆出第一个 (pos, definition)"""
    if not explain:
        return '', ''
    m = re.match(r'\s*([a-zA-Z]+)\.\s*(.*)', explain)
    if m:
        return m.group(1).upper(), simplify_definition(explain)
    return '', simplify_definition(explain)

def phonetic(word):
    """从有道 jsonapi_s 接口提取音标（ukphone/usphone，直连无需代理）；失败返回空"""
    try:
        url = 'https://dict.youdao.com/jsonapi_s?doctype=json&jsonversion=4&q=' + urllib.parse.quote(word)
        req = urllib.request.Request(url, headers={'Referer': 'https://dict.youdao.com', **UA})
        with urllib.request.urlopen(req, timeout=10) as r:
            d = json.loads(r.read().decode('utf-8'))
        found = {}
        # 递归找 ukphone/usphone（simple.word / ec.word 都行，取第一个非空）
        def walk(o):
            if isinstance(o, dict):
                if 'ukphone' in o and isinstance(o.get('ukphone'), str) and o['ukphone'].strip() and 'uk' not in found:
                    found['uk'] = o['ukphone'].strip()
                if 'usphone' in o and isinstance(o.get('usphone'), str) and o['usphone'].strip() and 'us' not in found:
                    found['us'] = o['usphone'].strip()
                for v in o.values(): walk(v)
            elif isinstance(o, list):
                for v in o: walk(v)
        walk(d)
        return found
    except Exception:
        return {}


# 精简释义（移植自前端 simplifyExplain）：取每个词性下的首义项、去语域括号，多词性用 / 连接
# 目标风格 = julebu 课包（850: student→学生；family→时间→时间、早晨→早晨 极短核心义）
def simplify_definition(explain):
    if not explain:
        return ''
    def clean(seg):
        seg = re.sub(r'<[^>]*>', '', seg).replace('<', '')  # 语域标记 <非正式> <美> 删除
        seg = re.sub(r'[（(].*?[)）]', '', seg)              # 括号注释全删（含嵌套）
        idx = seg.find('；')
        if idx >= 0: seg = seg[:idx]                        # 只取第一个分号前
        idx = seg.find(';')
        if idx >= 0: seg = seg[:idx]
        idx = seg.find('，')                                  # 逗号同义罗列也只取首个
        if idx >= 0: seg = seg[:idx]
        seg = seg.strip().rstrip('。，、;；')
        return seg
    # 按词性前缀分块（n. v. adj. adv. 等）
    parts = []
    for m in re.finditer(r'(?:(?<=^)|(?<=[;；]))\s*([A-Za-z]+)\.\s*', explain):
        start = m.end()
        # 块终点 = 下一个词性前缀
        nxt = re.search(r'[;；]\s*[A-Za-z]+\.\s*', explain[start:])
        end = start + nxt.start() if nxt else len(explain)
        seg = clean(explain[start:end])
        if seg and seg not in parts:
            parts.append(seg)
    if not parts:
        # 没有词性前缀（罕见）→ 整段取首义
        seg = clean(explain)
        if seg: parts.append(seg)
    # julebu 风格：只保留第一个词性的核心义（student→学生，不罗列第二词性）
    out = parts[0] if parts else ''
    return out[:16] if len(out) > 16 else out

def normalize_word(w):
    """所有格剥 's；处理 it's → it/be 之类由 suggest 兜底"""
    w = w.lower()
    if w.endswith("'s") and w != "it's":
        return w[:-2]
    return w

def main():
    if len(sys.argv) < 2:
        print(__doc__); sys.exit(1)
    pack_dir = sys.argv[1].rstrip('/')
    do_phonetic = '--no-phonetic' not in sys.argv

    files = sorted(glob.glob(os.path.join(pack_dir, 'L*.json')))
    if not files:
        print('no L*.json in', pack_dir); sys.exit(1)
    print(f'课包: {pack_dir} | 单课文件: {len(files)}')

    # 缓存：唯一词 → dict
    word_cache = {}
    for f in files:
        data = json.load(open(f))
        sentences = data.get('sentences', [])
        # 收集全课包唯一词
        for s in sentences:
            for raw in WORD_RE.findall(s.get('english', '') or ''):
                w = normalize_word(raw)
                word_cache.setdefault(w, None)

    # 参考课包语境词典：family8000（亲子日常，与内置短文同题材）词义准确，优先于有道 suggest
    ref_pack = os.path.join(os.path.dirname(pack_dir), 'family-8000')
    if os.path.isdir(ref_pack):
        refs = {}
        for rf in glob.glob(os.path.join(ref_pack, 'L*.json'))[:40]:
            try:
                rd = json.load(open(rf))
            except Exception:
                continue
            for rs in rd.get('sentences', []):
                for rwd in rs.get('wordDetails', []):
                    w = (rwd.get('word') or '').lower().strip("'")
                    if w and w not in refs and rwd.get('definition'):
                        refs[w] = {
                            'pos': rwd.get('partOfSpeech') or rwd.get('pos') or '',
                            'definition': rwd['definition'],
                            'phonetic': rwd.get('phonetic') or None,
                        }
        filled = 0
        for w in word_cache:
            if w in refs:
                word_cache[w] = {'ok': True, **refs[w]}
                filled += 1
        print(f'  参考 family8000 语境词典预填: {filled}/{len(word_cache)} 词')

    print(f'唯一单词: {len(word_cache)}，开始批量查词…')
    miss = []
    for i, w in enumerate(sorted(word_cache), 1):
        if word_cache[w] is not None:  # 已由参考词典预填
            continue
        explain = suggest(w)
        if explain is None:
            word_cache[w] = {'ok': False}
            miss.append(w)
            continue
        pos, definition = pos_and_def(explain)
        ph = phonetic(w) if do_phonetic else {}
        word_cache[w] = {'ok': True, 'pos': pos, 'definition': definition or explain,
                         'phonetic': ph if ph else None}
        if i % 10 == 0 or i == len(word_cache):
            print(f'  [{i}/{len(word_cache)}] {w}: {pos} {definition[:20]}')
        time.sleep(0.1)
    print('未命中:', miss if miss else '无 ✓')

    # 写入：sentence.wordDetails + statement.details
    for f in files:
        data = json.load(open(f))
        for s in data.get('sentences', []):
            s['wordDetails'] = []
            for raw in WORD_RE.findall(s.get('english', '') or ''):
                w = normalize_word(raw)
                info = word_cache.get(w, {})
                if info.get('ok'):
                    s['wordDetails'].append({
                        'word': w, 'pos': info['pos'],
                        'phonetic': info['phonetic'],
                        'definition': info['definition'],
                        'partOfSpeech': info['pos'],
                    })
        # statement.details：按整句词表重建（对齐 julebu 形态：词 → {word,pos,definition,phonetic}）
        for st in data.get('statements', []):
            det = {}
            for raw in WORD_RE.findall(st.get('english', '') or ''):
                w = normalize_word(raw)
                info = word_cache.get(w, {})
                if info.get('ok'):
                    det[w] = {'word': w, 'partOfSpeech': info['pos'],
                              'definition': info['definition'], 'phonetic': info['phonetic']}
            st['details'] = det if det else None
        json.dump(data, open(f, 'w'), ensure_ascii=False)
    print('完成 ✅ wordDetails/details 已写入')

if __name__ == '__main__':
    main()
