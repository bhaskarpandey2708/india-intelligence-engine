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
        PORT: 3001,               // Hostinger will proxy this port
        CORS_ORIGIN: 'https://indiaintelligence.in,https://www.indiaintelligence.in',
        // DATA_DIR: '/home/u123456789/india-intelligence-engine/data'  ← set if needed
      },
    },
  ],
};
