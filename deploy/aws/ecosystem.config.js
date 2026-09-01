module.exports = {
  apps: [
    {
      name: 'devtrace-api',
      script: 'dist/server.js',
      cwd: '/home/ubuntu/devtrace/backend',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
      },
      max_memory_restart: '400M',
      out_file: '/home/ubuntu/logs/devtrace-api-out.log',
      error_file: '/home/ubuntu/logs/devtrace-api-error.log',
    },
    {
      name: 'devtrace-worker',
      script: 'dist/worker/index.js',
      cwd: '/home/ubuntu/devtrace/backend',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
      },
      max_memory_restart: '400M',
      out_file: '/home/ubuntu/logs/devtrace-worker-out.log',
      error_file: '/home/ubuntu/logs/devtrace-worker-error.log',
    },
  ],
};
