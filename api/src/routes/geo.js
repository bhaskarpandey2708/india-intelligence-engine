/**
 * GET /api/geo/states        — simplified state boundaries GeoJSON
 * GET /api/geo/districts     — simplified district boundaries GeoJSON
 * GET /api/geo/subdistricts  — simplified subdistrict boundaries GeoJSON
 */

async function geoRoutes(fastify) {
  const { geo } = fastify.db;

  fastify.get('/geo/states', async (req, reply) => {
    if (!geo.states) return reply.code(404).send({ error: 'States GeoJSON not available' });
    reply.header('Content-Type', 'application/geo+json');
    reply.header('Cache-Control', 'public, max-age=86400');
    return geo.states;
  });

  fastify.get('/geo/districts', async (req, reply) => {
    if (!geo.districts) return reply.code(404).send({ error: 'Districts GeoJSON not available' });

    // Optional filter: ?state=Maharashtra
    const { state } = req.query;
    if (state) {
      const filtered = {
        ...geo.districts,
        features: geo.districts.features.filter(f =>
          f.properties?.STATE_NAME?.toLowerCase().includes(state.toLowerCase()) ||
          f.properties?.state_name?.toLowerCase().includes(state.toLowerCase()) ||
          f.properties?.State?.toLowerCase().includes(state.toLowerCase())
        ),
      };
      reply.header('Content-Type', 'application/geo+json');
      return filtered;
    }

    reply.header('Content-Type', 'application/geo+json');
    reply.header('Cache-Control', 'public, max-age=86400');
    return geo.districts;
  });

  fastify.get('/geo/subdistricts', async (req, reply) => {
    if (!geo.subdistricts) return reply.code(404).send({ error: 'Subdistricts GeoJSON not available' });

    const { district } = req.query;
    if (district) {
      const filtered = {
        ...geo.subdistricts,
        features: geo.subdistricts.features.filter(f =>
          JSON.stringify(f.properties || {}).toLowerCase().includes(district.toLowerCase())
        ),
      };
      reply.header('Content-Type', 'application/geo+json');
      return filtered;
    }

    reply.header('Content-Type', 'application/geo+json');
    reply.header('Cache-Control', 'public, max-age=3600');
    return geo.subdistricts;
  });
}

module.exports = geoRoutes;
