/**
 * shuangping - PM2 进程配置
 * 开发服务器：npm run dev（Vite，端口 9529），与项目 run.sh 的启动命令一致。
 * 与 ~/.pm2/ecosystem.config.js 中的同名应用保持一致。
 */
module.exports = {
  apps: [
    {
      name: 'shuangping',
      cwd: '/Users/douba/Projects/shuangping',
      script: '/opt/homebrew/bin/npm',
      args: 'run dev',
      instances: 1,
      autorestart: true,
      watch: false,
      min_uptime: 10000,
      max_restarts: 10,
      exp_backoff_restart_delay: 1000,
      max_memory_restart: '300M',
      env: {
        NODE_ENV: 'development',
        PORT: '9529',
        // 绝对路径脚本 + 显式 PATH：避免从 GUI 启动时（PATH 不含 Homebrew）找不到 npm/node
        PATH: '/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin',
        HOME: '/Users/douba',
      },
      error_file: '/Users/douba/.pm2/logs/shuangping-error.log',
      out_file: '/Users/douba/.pm2/logs/shuangping-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      merge_logs: true,
    },
  ],
};
