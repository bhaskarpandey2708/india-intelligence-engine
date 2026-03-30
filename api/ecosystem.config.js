// PM2 config for Hostinger Node.js deployment
// Usage: pm2 start ecosystem.config.js --env production
module.exports = {
  apps: [
    {
      name: 'india-intelligence-api',
      script: 'src/server.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'development',
        PORT: 3001,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3001,
        CORS_ORIGIN: 'https://data.future-ai.co',
        DATA_DIR: '/home/u584311545/domains/data.future-ai.co/data',
        FRONTEND_DIR: '/home/u584311545/domains/data.future-ai.co/public_html',
      },
    },
  ],
};
