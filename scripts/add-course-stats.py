#!/usr/bin/env python3
"""给 public/course-packs/<pack>/index.json 的每个课程补 stats 快照。
统计口径与 App 练习队列一致（statementsToQueue → inferStatementType）：
  - type 为空：含空格 → sentence，否则 → word
  - 显式 type(word/phrase/sentence/chunk/combinedChunks) 原样计数
stats = {
  sentences: len(sentences[]) 阅读/例句列表条数（信息性字段，卡片不再直接叫"句"）
  total:    statements 总条数（练习单元数）
  word/phrase/sentence/chunk/combinedChunks: 按上述口径计数（>0 才写）
}
用法：--packs=a,b 或 --all；--force 强制重算已有 stats。
"""
import json, glob, os, re, sys, collections

PACK_ROOT = 'public/course-packs'

def infer_type(stmt):
    t = stmt.get('type')
    if t:
        return t
    return 'sentence' if re.search(r'\s', String(stmt.get('english') or '').strip()) else 'word'

def String(x):  # 兼容类字段可能非 str
    return str(x)

def stat_course(path):
    with open(path, encoding='utf-8') as f:
        d = json.load(f)
    st = d.get('statements') or []
    cnt = collections.Counter(infer_type(s) for s in st)
    stats = {
        'sentences': len(d.get('sentences') or []),
        'total': len(st),
    }
    for k in ('word', 'phrase', 'sentence', 'chunk', 'combinedChunks'):
        if cnt.get(k):
            stats[k] = cnt[k]
    return stats

def main():
    args = sys.argv[1:]
    force = '--force' in args
    all_flag = '--all' in args
    packs_arg = None
    for a in args:
        if a.startswith('--packs='):
            packs_arg = a.split('=', 1)[1].split(',')
    targets = []
    for idx in sorted(glob.glob(f'{PACK_ROOT}/*/index.json')):
        slug = os.path.dirname(idx).split('/')[-1]
        if all_flag or (packs_arg and slug in packs_arg):
            targets.append((slug, idx))
    total_courses = 0
    for slug, idx in targets:
        with open(idx, encoding='utf-8') as f:
            d = json.load(f)
        changed = False
        for c in d.get('courses') or []:
            if 'stats' in c and not force:
                continue
            fp = os.path.join(os.path.dirname(idx), c.get('file', ''))
            if not os.path.exists(fp):
                print(f'  !! {slug}/{c.get("file")} MISSING, skip')
                continue
            try:
                c['stats'] = stat_course(fp)
            except Exception as e:
                print(f'  !! {slug}/{c.get("file")} err {e}')
                continue
            changed = True
            total_courses += 1
        if changed:
            with open(idx, 'w', encoding='utf-8') as f:
                json.dump(d, f, ensure_ascii=False, indent=2)
                f.write('\n')
        print(f'{slug}: ok ({total_courses} courses so far)')
    print(f'DONE, stats (re)written for {total_courses} courses')

if __name__ == '__main__':
    main()
