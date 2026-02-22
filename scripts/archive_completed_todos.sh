#!/bin/bash
# 归档已完成的 todos 脚本
# Usage: ./scripts/archive_completed_todos.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
TODOS_FILE="$PROJECT_DIR/todos.json"
ARCHIVE_DIR="$PROJECT_DIR/.archive"
DATE_STR=$(date +"%Y-%m-%d")

echo "🗄️  开始归档已完成的 todos..."

# 检查 todos.json 是否存在
if [ ! -f "$TODOS_FILE" ]; then
    echo "ℹ️  未找到 todos.json，跳过归档"
    exit 0
fi

# 创建归档目录
mkdir -p "$ARCHIVE_DIR"

# 归档文件名
ARCHIVE_FILE="$ARCHIVE_DIR/todos_${DATE_STR}.json"

# 如果归档文件已存在，添加时间戳
if [ -f "$ARCHIVE_FILE" ]; then
    TIMESTAMP=$(date +"%H%M%S")
    ARCHIVE_FILE="$ARCHIVE_DIR/todos_${DATE_STR}_${TIMESTAMP}.json"
fi

# 读取并归档已完成的 todos
python3 << EOF
import json
import sys

try:
    with open('$TODOS_FILE', 'r', encoding='utf-8') as f:
        todos = json.load(f)
    
    if not isinstance(todos, list):
        print("⚠️  todos.json 格式不正确")
        sys.exit(0)
    
    completed = [t for t in todos if t.get('completed', False)]
    pending = [t for t in todos if not t.get('completed', False)]
    
    if completed:
        # 保存到归档文件
        archive_data = {
            "archived_at": "$DATE_STR",
            "completed_count": len(completed),
            "todos": completed
        }
        with open('$ARCHIVE_FILE', 'w', encoding='utf-8') as f:
            json.dump(archive_data, f, ensure_ascii=False, indent=2)
        print(f"✅ 已归档 {len(completed)} 个完成的任务到 $ARCHIVE_FILE")
        
        # 更新 todos.json，只保留未完成的任务
        with open('$TODOS_FILE', 'w', encoding='utf-8') as f:
            json.dump(pending, f, ensure_ascii=False, indent=2)
        print(f"✅ 已更新 todos.json，剩余 {len(pending)} 个未完成任务")
    else:
        print("ℹ️  没有已完成的任务需要归档")
        
except FileNotFoundError:
    print("ℹ️  todos.json 不存在")
except json.JSONDecodeError:
    print("⚠️  todos.json 解析失败")
except Exception as e:
    print(f"❌ 归档失败: {e}")
EOF

echo "🎉 归档完成"
