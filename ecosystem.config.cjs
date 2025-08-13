module.exports = {
  apps: [
    {
      name: "backend",
      script: "src/index.js",
      exec_mode: "fork",
      instances: 1,
      watch: false,
      autorestart: true,
      min_uptime: 5000,
      max_restarts: 10,
      restart_delay: 5000,
      max_memory_restart: "512M",
      time: true,
      env: { NODE_ENV: "production" },
      env_production: { NODE_ENV: "production" },
      error_file: "/home/ubuntu/.pm2/logs/backend-err.log",
      out_file: "/home/ubuntu/.pm2/logs/backend-out.log",
      merge_logs: true
    }
  ]
};
