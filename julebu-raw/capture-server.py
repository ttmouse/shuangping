#!/usr/bin/env python3
"""本地接收服务：接收 julebu 课程全量数据并写盘到 julebu-raw/。

用法: python3 capture-server.py [port]   # 默认 8931
POST /save?file=<name>.json  body=JSON   -> 写入 julebu-raw/<name>.json
POST /done                                 -> 标记完成，返回统计
GET  /status                                -> 返回已保存文件列表
"""
import json
import os
import sys
from http.server import BaseHTTPRequestHandler, HTTPServer

HERE = os.path.dirname(os.path.abspath(__file__))
PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8931
os.makedirs(HERE, exist_ok=True)


class Handler(BaseHTTPRequestHandler):
    def _cors(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')

    def _send(self, code, obj):
        body = json.dumps(obj).encode()
        self.send_response(code)
        self._cors()
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self.send_response(204)
        self._cors()
        self.end_headers()

    def do_GET(self):
        if self.path.startswith('/status'):
            files = [f for f in os.listdir(HERE) if f.endswith('.json') and f != 'capture-server.py']
            self._send(200, {'saved': sorted(files), 'count': len(files)})
        else:
            self._send(404, {'error': 'not found'})

    def do_POST(self):
        try:
            length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(length)
            if self.path.startswith('/save'):
                from urllib.parse import urlparse, parse_qs
                qs = parse_qs(urlparse(self.path).query)
                fname = qs.get('file', ['unknown.json'])[0]
                if not fname.endswith('.json'):
                    fname += '.json'
                # 防目录穿越
                fname = os.path.basename(fname)
                with open(os.path.join(HERE, fname), 'w') as f:
                    f.write(body.decode('utf-8'))
                self._send(200, {'ok': True, 'file': fname, 'bytes': len(body)})
            elif self.path.startswith('/done'):
                files = [f for f in os.listdir(HERE) if f.endswith('.json') and f != 'capture-server.py']
                self._send(200, {'done': True, 'count': len(files), 'files': sorted(files)})
            else:
                self._send(404, {'error': 'not found'})
        except Exception as e:
            self._send(500, {'error': str(e)})

    def log_message(self, fmt, *args):
        sys.stderr.write('[capture] %s\n' % (fmt % args))


if __name__ == '__main__':
    print(f'capture-server listening on http://127.0.0.1:{PORT}', flush=True)
    HTTPServer(('127.0.0.1', PORT), Handler).serve_forever()
