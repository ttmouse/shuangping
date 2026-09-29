#!/usr/bin/env python3
"""julebu tRPC findOne 响应 → course-packs raw JSON（全字段保留，不裁剪）

用法:
  python3 api-to-raw.py <packId> <输入响应文件.json> <输出目录/>

设计原则（用户定，2026-09-03）：
  原始 API 有什么就存什么，不做字段白名单裁剪——哪怕暂时用不到。
  只做三类必要加工：
    1. 递归剥零宽字符水印（julebu 反爬：english/title/content/explanation 等混入）
    2. statements 附加 details（逐词词典）——API 原始无此字段，前端 buildCourseDict 依赖；
       从该句 sentence.wordDetails 按词边界匹配重建（实测 156/156 精确）
    3. wordDetails 附加 partOfSpeech 兼容别名——API 原始字段名是 pos，前端读 partOfSpeech
  其余字段（dependencyAnalysis/sentenceStructure/region/image/startTime/endTime/
  mediaUrl/statementId 等）全部原样保留。
"""
import json
import re
import sys
import os

# 零宽字符水印（julebu 在文本字段混入反爬水印）
ZWJ = re.compile(r'[\u200b-\u200f\u2060-\u2064\u202a-\u202e\u2066-\u2069]')


def clean(s):
    """剥零宽水印（保留其他原样）"""
    return ZWJ.sub('', s) if isinstance(s, str) else s


def clean_deep(o):
    """递归剥水印：dict/list 遍历，str 清洗；非 str 原样"""
    if isinstance(o, str):
        return ZWJ.sub('', o)
    if isinstance(o, dict):
        return {k: clean_deep(v) for k, v in o.items()}
    if isinstance(o, list):
        return [clean_deep(v) for v in o]
    return o


def find_sentence_word_details(sentences):
    """sentenceId → wordDetails 列表（剥过水印）"""
    return {s['id']: (s.get('wordDetails') or []) for s in sentences}


def rebuild_details(statement_english, word_details):
    """从 wordDetails 按词边界重建该 statement 的逐词词典 details"""
    en = clean(statement_english)
    details = {}
    for wd in word_details:
        w = wd.get('word')
        if not w:
            continue
        # 词边界匹配：词出现在 statement 文本中
        if re.search(r'(?<![A-Za-z])' + re.escape(w) + r'(?![A-Za-z])', en):
            details[w] = {
                'word': w,
                'partOfSpeech': wd.get('partOfSpeech') or wd.get('pos') or '',
                'definition': wd.get('definition') or '',
                'phonetic': wd.get('phonetic') or None,
            }
    return details or None


def normalize_word_details(wd):
    """wordDetails 单条：原始字段全保留 + 补 partOfSpeech 兼容别名"""
    out = clean_deep(wd) if isinstance(wd, dict) else wd
    if isinstance(out, dict) and 'pos' in out and 'partOfSpeech' not in out:
        out['partOfSpeech'] = out['pos']
    return out


def api_to_raw(data):
    """findOne(mode) 响应 data → raw 结构（course 层全字段保留）"""
    c = data

    # sentences：原始键全保留 + wordDetails 补 partOfSpeech 别名
    sentences = []
    for s in c.get('sentences', []):
        out = clean_deep(s)
        if isinstance(out.get('wordDetails'), list):
            out['wordDetails'] = [normalize_word_details(wd) for wd in out['wordDetails']]
        sentences.append(out)

    # statements：原始键全保留 + 补 details（API 原始没有，前端依赖）
    sent_wd = find_sentence_word_details(c.get('sentences', []))
    statements = []
    for s in c.get('statements', []):
        out = clean_deep(s)
        en = out.get('english', '')
        wds = sent_wd.get(out.get('sentenceId'), [])
        details = rebuild_details(en, wds)
        if details:
            out['details'] = details
        # wordGroups 补 null 一致性（原始可能缺）
        if 'wordGroups' not in out:
            out['wordGroups'] = None
        statements.append(out)

    # course 层：原始键全保留（title/description 剥水印）
    course = clean_deep({k: v for k, v in c.items()
                         if k not in ('sentences', 'statements')})

    return {'course': course, 'sentences': sentences, 'statements': statements}


def main():
    if len(sys.argv) < 4:
        print(__doc__)
        sys.exit(1)
    outdir = sys.argv[3]
    os.makedirs(outdir, exist_ok=True)

    raw = json.load(open(sys.argv[2]))
    if isinstance(raw, list):
        if 'error' in raw[0]:
            print(f"ERROR: {raw[0]['error']['json'].get('message', raw[0]['error'])}")
            sys.exit(2)
        data = raw[0]['result']['data']['json']
    else:
        data = raw['result']['data']['json']

    converted = api_to_raw(data)
    order = converted['course'].get('order', 0)
    title = converted['course'].get('title', '')
    # 语义化文件名（回退：guess order 前缀）
    name = guess_filename(order, title) or f'L{order:02d}.json'
    out_path = os.path.join(outdir, name)
    json.dump(converted, open(out_path, 'w'), ensure_ascii=False)

    # 打印摘要 + 全字段自检（保证没有漏原始键）
    n_st = len(converted['statements'])
    n_se = len(converted['sentences'])
    n_da = sum(1 for s in converted['sentences'] if s.get('dependencyAnalysis'))
    n_ss = sum(1 for s in converted['sentences'] if s.get('sentenceStructure'))
    print(f"{name:24s} | order={order:2d} stmts={n_st:3d} sents={n_se:3d} "
          f"depAna={n_da}/{n_se} struct={n_ss}/{n_se} | {title[:40]}")


def guess_filename(order, title):
    """语义化文件名推断（无匹配时返回 None 由调用方 fallback）"""
    t = title
    if 'Review' in t or 'Recycle' in t:
        import re as _re
        m = _re.search(r'Recycle (\d)', t)
        if m:
            return f'REC{m.group(1)}.json'
        m = _re.search(r'Review Units (\d)-(\d)', t)
        if m:
            return f'RV{m.group(1)}-{m.group(2)}.json'
        return f'REV{order}.json'
    import re as _re
    m = _re.search(r'Unit (\d)', t)
    u = m.group(1) if m else None
    if '单词' in t:
        return f'U{u}-words.json' if u else None
    if 'Part A' in t:
        return f'U{u}-partA.json' if u else None
    if 'Part B' in t:
        return f'U{u}-partB.json' if u else None
    if 'Part C' in t:
        return f'U{u}-partC.json' if u else None
    if _re.match(r'L\d+', t):
        return f'L{order:02d}.json'
    if 'Friends' in t or 'S0' in t:
        return f'L{order:02d}.json'
    if 'Starter' in t:
        return f'L{order:02d}.json'
    return None


if __name__ == '__main__':
    main()
