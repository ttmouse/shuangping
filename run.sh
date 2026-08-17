#!/usr/bin/env bash
# 快捷启动 shuangping 开发服务器
set -e
cd "$(dirname "$0")"

if [ ! -d node_modules ]; then
  echo "==> 未检测到 node_modules，先安装依赖..."
  npm install
fi

echo "==> 启动开发服务器 (npm run dev)"
exec npm run dev
