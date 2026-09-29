#!/usr/bin/env python3
"""julebu 单包抓取（固定 L{order}.json 命名，杜绝 guess_filename 碰撞）

用法:
  JULEBU_COOKIE='...' JULEBU_SIG='...' python3 capture-to-order.py <packId> <slug>

行为:
  - 读 <项目>/julebu-raw-<slug>/course-list.json
  - 串行 curl courses.findOne，逐课转换后写 <输出目录>/L{order:02d}.json
  - 已存在的 Lxx.json 跳过（断点续跑）
  - 429/401 打印并停止（重借签名重跑）
  - 每次请求间 sleep 0.4s，避免限流
"""
import json
import os
import re
import shutil
import subprocess
import sys
import time
import urllib.parse

PROJ = '/Users/douba/Projects/shuangping'
API = 'https://api.julebu.co/trpc/courses.findOne'
COOKIE = os.environ.get('JULEBU_COOKIE', '')
SIG = os.environ.get('JULEBU_SIG', '')
UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/152.0.0.0 Safari/537.36'
ZWJ = re.compile(r'[\u200b-\u200f\u2060-\u2064\u202a-\u202e\u2066-\u2069]')

def clean(s):
    return ZWJ.sub('', s) if isinstance(s, str) else s

def api_to_raw(data):
    """findOne 响应 data → course-packs raw 结构"""
    sents = []
    for s in data.get('sentences', []):
        sents.append({
            'id': s['id'], 'content': clean(s.get('content', '')),
            'english': clean(s.get('english', '')), 'chinese': clean(s.get('chinese', '')),
            'sortOrder': s.get('sortOrder'),
            'wordDetails': s.get('wordDetails') or [], 'wordGroups': s.get('wordGroups') or [],
        })
    sent_wd = {s['id']: (s.get('wordDetails') or []) for s in data.get('sentences', [])}
    stmts = []
    for s in data.get('statements', []):
        en = clean(s.get('english', ''))
        wds = sent_wd.get(s.get('sentenceId'), [])
        details = {}
        for wd in wds:
            w = wd['word']
            if re.search(r'(?<![A-Za-z])' + re.escape(w) + r'(?![A-Za-z])', en):
                details[w] = {'word': w,
                              'partOfSpeech': wd.get('pos') or wd.get('partOfSpeech', ''),
                              'definition': wd.get('definition', ''),
                              'phonetic': wd.get('phonetic') or None}
        stmts.append({
            'id': s['id'], 'order': s['order'], 'type': s.get('type', ''),
            'english': en, 'chinese': clean(s.get('chinese', '')),
            'phonetic': clean(s.get('soundmark', '')),
            'sentenceId': s.get('sentenceId'), 'details': details or None,
            'wordGroups': s.get('wordGroups') or None,
        })
    c = data
    return {
        'course': {'id': c['id'], 'title': clean(c.get('title', '')),
                   'description': clean(c.get('description', '')),
                   'order': c.get('order'), 'coursePackId': c.get('coursePackId'),
                   'type': c.get('type', 'normal')},
        'sentences': sents, 'statements': stmts,
    }


def fetch_and_save(pack, course, out_path):
    """返回 'OK'/'SKIP'/'429'/'401'/'ERR'
    抓原始响应 → 调用新版 api-to-raw.py（全字段保留）→ 按 order 归位到 L{order}.json"""
    if os.path.exists(out_path) and os.path.getsize(out_path) > 500:
        return 'SKIP'
    inp = json.dumps({"0": {"json": {"coursePackId": pack, "courseId": course['id'],
                                     "mode": "chinese_to_english"}}})
    url = f'{API}?batch=1&input=' + urllib.parse.quote(inp, safe='')
    order = course['o']
    tmp = f'/tmp/julebu-single-{order}.json'
    conv_dir = f'/tmp/julebu-conv-{order}'
    r = subprocess.run(['curl', '-s', '-m', '60',
                        '-H', f'User-Agent: {UA}',
                        '-H', 'Origin: https://julebu.co',
                        '-H', 'Referer: https://julebu.co/',
                        '-b', COOKIE, '-H', f'x-signature: {SIG}',
                        url, '-o', tmp, '-w', '%{http_code}'],
                       capture_output=True, text=True)
    code = r.stdout.strip()
    if code == '200':
        d = json.load(open(tmp))
        if 'error' in d[0]:
            os.remove(tmp)
            return 'ERR_API'
        # 调用新版全字段 api-to-raw.py（脚本同目录）
        here = os.path.dirname(os.path.abspath(__file__))
        to_raw = os.path.join(here, 'api-to-raw.py')
        if os.path.exists(conv_dir):
            shutil.rmtree(conv_dir)
        os.makedirs(conv_dir)
        conv = subprocess.run(['python3', to_raw, pack, tmp, conv_dir],
                              capture_output=True, text=True)
        os.remove(tmp)
        if conv.returncode != 0:
            return f'CONV_ERR:{conv.stderr[:100]}'
        # 转换产物可能被 guess_filename 命名为语义名 → 按 course.order 归位 L{order}.json
        out_files = [f for f in os.listdir(conv_dir) if f.endswith('.json')]
        if not out_files:
            shutil.rmtree(conv_dir)
            return 'CONV_EMPTY'
        src = os.path.join(conv_dir, out_files[0])
        shutil.move(src, out_path)
        shutil.rmtree(conv_dir)
        return 'OK'
    if code == '429':
        return '429'
    if code == '401':
        return '401'
    return f'ERR{code}'


def main():
    if len(sys.argv) < 3:
        print(__doc__); sys.exit(1)
    pack, slug = sys.argv[1], sys.argv[2]
    if not COOKIE or not SIG:
        print('需要 JULEBU_COOKIE 和 JULEBU_SIG'); sys.exit(1)
    list_path = f'{PROJ}/julebu-raw-{slug}/course-list.json'
    if not os.path.exists(list_path):
        print(f'缺清单 {list_path}'); sys.exit(1)
    courses = json.load(open(list_path))
    outdir = f'{PROJ}/julebu-raw-{slug}'
    os.makedirs(outdir, exist_ok=True)

    print(f'=== {slug} ({len(courses)} 课) ===', flush=True)
    ok = skip = 0
    for c in courses:
        out_path = f'{outdir}/L{c["o"]:02d}.json'
        status = fetch_and_save(pack, c, out_path)
        if status in ('429', '401'):
            print(f'  o{c["o"]:02d}: {status} — 停止，重借签名后重跑（已抓自动跳过）', flush=True)
            sys.exit(2)
        if status == 'OK':
            ok += 1
            d = json.load(open(out_path))
            print(f'  o{c["o"]:02d} OK  L{c["o"]:02d}.json  {d["course"]["title"][:40]}', flush=True)
        elif status == 'SKIP':
            skip += 1
        else:
            print(f'  o{c["o"]:02d}: {status}', flush=True)
        time.sleep(0.4)
    print(f'--- {slug}: {ok} 新抓, {skip} 已存在 ---', flush=True)


if __name__ == '__main__':
    main()
