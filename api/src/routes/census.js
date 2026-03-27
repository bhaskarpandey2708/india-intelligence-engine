/**
 * GET /api/states                    — list all states
 * GET /api/states/:name              — state details + districts list
 * GET /api/districts                 — all districts (optional ?state= filter)
 * GET /api/districts/:code           — single district with census data
 * GET /api/census/district/:code     — full census data for a district
 * GET /api/search?q=                 — search states + districts by name
 * GET /api/stats                     — aggregate national stats
 */

// Compute derived fields from raw census columns
function enrich(d) {
  const pop = d['Population'] || 0;
  const male = d['Male'] || 0;
  const female = d['Female'] || 0;
  const literate = d['Literate'] || 0;
  return {
    ...d,
    literacy_rate: pop > 0 ? Math.round((literate / pop) * 10000) / 100 : null,
    sex_ratio: male > 0 ? Math.round((female / male) * 1000) : null,
  };
}

async function censusRoutes(fastify) {
  const { districtCensus: _raw, stateCensus, geo } = fastify.db;
  const districtCensus = _raw.map(enrich);

  // ── States ──────────────────────────────────────────────────────────────
  fastify.get('/states', async (req, reply) => {
    const states = stateCensus.map(s => ({
      name: s['State / Union Territory'] || s['State'],
      population: s['Population'] || s['Total Population'],
      area_sq_km: s['Area(Sq.Km.)'] || s['Area'],
      density: s['Density/ Sq.Km.'] || s['Density'],
      sex_ratio: s['Sex Ratio'] || s['sex_ratio'],
    })).filter(s => s.name);

    return { count: states.length, states };
  });

  fastify.get('/states/:name', async (req, reply) => {
    const { name } = req.params;
    const state = stateCensus.find(s =>
      (s['State / Union Territory'] || s['State'] || '')
        .toLowerCase().includes(name.toLowerCase())
    );
    if (!state) return reply.code(404).send({ error: `State not found: ${name}` });

    const districts = districtCensus
      .filter(d => (d['State name'] || '').toLowerCase().includes(name.toLowerCase()))
      .map(d => ({
        code: String(d['District code'] || '').padStart(3, '0'),
        name: d['District name'],
        population: d['Population'],
        literacy_rate: d['Literacy Rate'],
      }));

    return { state, districts_count: districts.length, districts };
  });

  // ── Districts ─────────────────────────────────────────────────────────────
  fastify.get('/districts', async (req, reply) => {
    const { state, min_pop, max_pop, min_literacy, page = 1, limit = 50 } = req.query;

    let results = districtCensus;

    if (state) {
      results = results.filter(d =>
        (d['State name'] || '').toLowerCase().includes(state.toLowerCase())
      );
    }
    if (min_pop) results = results.filter(d => (d['Population'] || 0) >= Number(min_pop));
    if (max_pop) results = results.filter(d => (d['Population'] || 0) <= Number(max_pop));
    if (min_literacy) results = results.filter(d => (d['literacy_rate'] || 0) >= Number(min_literacy));

    const total = results.length;
    const offset = (Number(page) - 1) * Number(limit);
    const paginated = results.slice(offset, offset + Number(limit)).map(d => ({
      code: String(d['District code'] || '').padStart(3, '0'),
      name: d['District name'],
      state: d['State name'],
      population: d['Population'],
      literacy_rate: d['literacy_rate'],
      sex_ratio: d['sex_ratio'],
    }));

    return {
      total,
      page: Number(page),
      limit: Number(limit),
      districts: paginated,
    };
  });

  fastify.get('/districts/:code', async (req, reply) => {
    const { code } = req.params;
    const district = districtCensus.find(d =>
      String(d['District code'] || '').padStart(3, '0') === code.padStart(3, '0') ||
      (d['District name'] || '').toLowerCase() === code.toLowerCase()
    );
    if (!district) return reply.code(404).send({ error: `District not found: ${code}` });
    return district;
  });

  // ── Census data ───────────────────────────────────────────────────────────
  fastify.get('/census/district/:code', async (req, reply) => {
    const { code } = req.params;
    const district = districtCensus.find(d =>
      String(d['District code'] || '').padStart(3, '0') === code.padStart(3, '0') ||
      (d['District name'] || '').toLowerCase() === code.toLowerCase()
    );
    if (!district) return reply.code(404).send({ error: `District not found: ${code}` });
    return { district_code: code, census_2011: district };
  });

  // ── Search ────────────────────────────────────────────────────────────────
  fastify.get('/search', async (req, reply) => {
    const { q } = req.query;
    if (!q || q.length < 2) return reply.code(400).send({ error: 'Query must be at least 2 characters' });

    const term = q.toLowerCase();

    const matchedStates = stateCensus
      .filter(s => (s['State / Union Territory'] || s['State'] || '').toLowerCase().includes(term))
      .map(s => ({ type: 'state', name: s['State / Union Territory'] || s['State'], population: s['Population'] }));

    const matchedDistricts = districtCensus
      .filter(d => (d['District name'] || '').toLowerCase().includes(term))
      .slice(0, 20)
      .map(d => ({
        type: 'district',
        code: String(d['District code'] || '').padStart(3, '0'),
        name: d['District name'],
        state: d['State name'],
        population: d['Population'],
      }));

    return {
      query: q,
      results: [...matchedStates, ...matchedDistricts],
      total: matchedStates.length + matchedDistricts.length,
    };
  });

  // ── National stats ────────────────────────────────────────────────────────
  fastify.get('/stats', async () => {
    const totalPop = districtCensus.reduce((s, d) => s + (d['Population'] || 0), 0);
    const avgLiteracy = districtCensus.reduce((s, d) => s + (d['literacy_rate'] || 0), 0) / districtCensus.length;
    const avgSexRatio = districtCensus.reduce((s, d) => s + (d['sex_ratio'] || 0), 0) / districtCensus.length;

    const byPop = [...districtCensus].sort((a, b) => (b['Population'] || 0) - (a['Population'] || 0));
    const byLiteracy = [...districtCensus].sort((a, b) => (b['literacy_rate'] || 0) - (a['literacy_rate'] || 0));

    return {
      source: 'Census 2011',
      total_districts: districtCensus.length,
      total_population: totalPop,
      avg_literacy_rate: Math.round(avgLiteracy * 100) / 100,
      avg_sex_ratio: Math.round(avgSexRatio),
      most_populous_district: { name: byPop[0]?.['District name'], state: byPop[0]?.['State name'], population: byPop[0]?.['Population'] },
      highest_literacy_district: { name: byLiteracy[0]?.['District name'], state: byLiteracy[0]?.['State name'], literacy: byLiteracy[0]?.['literacy_rate'] },
      lowest_literacy_district: { name: byLiteracy.at(-1)?.['District name'], state: byLiteracy.at(-1)?.['State name'], literacy: byLiteracy.at(-1)?.['literacy_rate'] },
    };
  });
}

module.exports = censusRoutes;
