const Fastify = require('fastify');
const cors = require('@fastify/cors');
const staticPlugin = require('@fastify/static');
const path = require('path');
const { loadAll } = require('./data-loader');

const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || '0.0.0.0';

// In production, restrict CORS to the frontend origin.
// Set CORS_ORIGIN env var to your frontend URL (e.g. https://indiaintelligence.in)
const CORS_ORIGIN = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map(s => s.trim())
  : true; // dev: allow all

async function buildServer() {
  const fastify = Fastify({ logger: { level: 'info' } });

  await fastify.register(cors, {
    origin: CORS_ORIGIN,
    methods: ['GET'],
  });

  // Load all data at startup
  const db = await loadAll();
  fastify.decorate('db', db);

  // Health check
  fastify.get('/health', async () => ({
    status: 'ok',
    version: '1.0.0',
    data: {
      districts: db.districtCensus.length,
      states: db.stateCensus.length,
      geo_states: db.geo.states?.features?.length || 0,
      geo_districts: db.geo.districts?.features?.length || 0,
      geo_subdistricts: db.geo.subdistricts?.features?.length || 0,
    },
  }));

  // Serve Next.js static frontend
  const FRONTEND_DIR = process.env.FRONTEND_DIR || path.join(__dirname, '../../frontend/out');
  await fastify.register(staticPlugin, {
    root: FRONTEND_DIR,
    prefix: '/',
    index: 'index.html',
    decorateReply: false,
  });

  // Register route modules under /api prefix
  fastify.register(require('./routes/census'), { prefix: '/api' });
  fastify.register(require('./routes/geo'), { prefix: '/api' });

  return fastify;
}

async function start() {
  try {
    const fastify = await buildServer();
    await fastify.listen({ port: PORT, host: HOST });
    console.log(`\nIndia Intelligence Engine API running at http://localhost:${PORT}`);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

start();
