#!/usr/bin/env python3
"""
Telegram 通知脚本 - 发送任务完成通知
Usage: python scripts/tg_notifier.py send_simple_notification
"""
import os
import sys
import urllib.request
import urllib.parse
import json

def get_env_var(name, default=None):
    """获取环境变量，支持 .env 文件"""
    value = os.environ.get(name, default)
    if value is None:
        # 尝试从 .env 文件读取
        env_path = os.path.join(os.path.dirname(__file__), '..', '.env')
        if os.path.exists(env_path):
            with open(env_path, 'r', encoding='utf-8') as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith('#') and '=' in line:
                        key, val = line.split('=', 1)
                        if key.strip() == name:
                            return val.strip().strip('"\'')
    return value

def send_telegram_message(message, parse_mode='HTML'):
    """发送 Telegram 消息"""
    bot_token = get_env_var('TELEGRAM_BOT_TOKEN')
    chat_id = get_env_var('TELEGRAM_CHAT_ID')

    if not bot_token or not chat_id:
        print("错误: 未设置 TELEGRAM_BOT_TOKEN 或 TELEGRAM_CHAT_ID")
        print("请设置环境变量或在 .env 文件中配置")
        return False

    url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
    data = {
        'chat_id': chat_id,
        'text': message,
        'parse_mode': parse_mode,
        'disable_web_page_preview': True
    }

    try:
        req = urllib.request.Request(
            url,
            data=urllib.parse.urlencode(data).encode('utf-8'),
            headers={'Content-Type': 'application/x-www-form-urlencoded'},
            method='POST'
        )
        with urllib.request.urlopen(req, timeout=30) as response:
            result = json.loads(response.read().decode('utf-8'))
            if result.get('ok'):
                print("✅ Telegram 通知发送成功")
                return True
            else:
                print(f"❌ Telegram API 错误: {result}")
                return False
    except Exception as e:
        print(f"❌ 发送失败: {e}")
        return False

def send_simple_notification():
    """发送简单的任务完成通知"""
    # 获取 git 信息
    try:
        import subprocess
        commit_msg = subprocess.check_output(
            ['git', 'log', '-1', '--pretty=%s'],
            cwd=os.path.dirname(os.path.dirname(__file__))
        ).decode('utf-8').strip()
        commit_hash = subprocess.check_output(
            ['git', 'rev-parse', '--short', 'HEAD'],
            cwd=os.path.dirname(os.path.dirname(__file__))
        ).decode('utf-8').strip()
    except:
        commit_msg = "未知提交"
        commit_hash = "unknown"

    message = f"""🎉 <b>任务完成通知</b>

📁 <b>项目:</b> shuangping (双拼练习工具)
📝 <b>最新提交:</b> <code>{commit_hash}</code>
💬 <b>提交信息:</b> {commit_msg}

✅ 高级练习模式功能已全部实现:
   • 盲打模式
   • 限时挑战
   • 错误字重练
   • 自定义练习集

⏰ 完成时间: {os.popen('date "+%Y-%m-%d %H:%M:%S"').read().strip()}
"""
    return send_telegram_message(message)

def main():
    if len(sys.argv) < 2:
        print("Usage: python tg_notifier.py <command>")
        print("Commands:")
        print("  send_simple_notification  - 发送任务完成通知")
        sys.exit(1)

    command = sys.argv[1]

    if command == 'send_simple_notification':
        success = send_simple_notification()
        sys.exit(0 if success else 1)
    else:
        print(f"未知命令: {command}")
        sys.exit(1)

if __name__ == '__main__':
    main()
