/**
 * Data Loader — loads all census/geo data at startup into memory.
 * Small datasets (states, districts) are fully cached.
 * Large datasets (habitation, subdistricts GeoJSON) are streamed on demand.
 */

const parquet = require('@dsnp/parquetjs');
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../../data');
const EXPORTS = path.join(DATA_DIR, 'exports');
const PROCESSED = path.join(DATA_DIR, 'processed');
const GEO_DIR = path.join(__dirname, '../../../india-geodata-platform/public/data');

// BigInt → Number safe conversion
function sanitize(row) {
  const out = {};
  for (const [k, v] of Object.entries(row)) {
    out[k] = typeof v === 'bigint' ? Number(v) : v;
  }
  return out;
}

async function readParquet(filePath, limit = null) {
  const reader = await parquet.ParquetReader.openFile(filePath);
  const cursor = reader.getCursor();
  const rows = [];
  let row;
  while ((row = await cursor.next())) {
    rows.push(sanitize(row));
    if (limit && rows.length >= limit) break;
  }
  await reader.close();
  return rows;
}

function readGeoJSON(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

async function loadAll() {
  console.log('[data] Loading census data...');

  // ── Census district data (640 rows) ───────────────────────────────────────
  const districtCensus = await readParquet(
    path.join(EXPORTS, 'census_district_2011.parquet')
  );
  // Index by district name + state name for fast lookup
  const districtCensusIndex = {};
  for (const row of districtCensus) {
    const key = String(row['District code'] || '').padStart(3, '0');
    districtCensusIndex[key] = row;
  }

  // ── State data (36 rows) ──────────────────────────────────────────────────
  const stateCensus = await readParquet(
    path.join(EXPORTS, 'census_state_2011.parquet')
  );

  // ── Simplified GeoJSONs ───────────────────────────────────────────────────
  console.log('[data] Loading GeoJSON layers...');

  // Try simplified first, fall back to original
  function loadGeo(name) {
    const simplified = path.join(PROCESSED, `${name}_simplified.geojson`);
    const original = path.join(GEO_DIR, `${name.replace('geo_', '')}.geojson`);
    if (fs.existsSync(simplified)) return readGeoJSON(simplified);
    if (fs.existsSync(original)) return readGeoJSON(original);
    return null;
  }

  const statesGeo = loadGeo('geo_states');
  const districtsGeo = loadGeo('geo_districts');
  const subdistrictsGeo = loadGeo('geo_subdistricts');

  console.log(`[data] Loaded: ${districtCensus.length} districts | ${stateCensus.length} states`);
  console.log(`[data] GeoJSON: ${statesGeo?.features?.length} states | ${districtsGeo?.features?.length} districts | ${subdistrictsGeo?.features?.length} subdistricts`);

  return {
    districtCensus,
    districtCensusIndex,
    stateCensus,
    geo: { states: statesGeo, districts: districtsGeo, subdistricts: subdistrictsGeo },
  };
}

module.exports = { loadAll, readParquet };
