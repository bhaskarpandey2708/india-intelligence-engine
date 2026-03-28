# Hostinger Deployment Guide

## Architecture

```
Browser
  └── Frontend (static HTML/CSS/JS)  →  Hostinger public_html / subdomain
        └── API calls  →  api.indiaintelligence.in  →  Fastify Node.js on Hostinger
                              └── Reads data/ folder (parquets + GeoJSONs)
```

- **Frontend**: Static export (`/frontend/out/`) — no Node.js needed
- **API**: Fastify app (`/api/`) — runs as a Node.js process via PM2

---

## One-Time Setup on Hostinger

### 1. Point domains
In Hostinger hPanel → Domains:
- `indiaintelligence.in` → `public_html/` (frontend)
- `api.indiaintelligence.in` → Node.js app (see step 3)

### 2. Clone the repo on Hostinger (via SSH)
```bash
ssh u123456789@indiaintelligence.in
cd ~
git clone https://github.com/bhaskarpandey2708/india-intelligence-engine.git
cd india-intelligence-engine
```

### 3. Install API dependencies
```bash
cd api
npm install --production
```

### 4. Create the API `.env` file
```bash
cp .env.example .env
nano .env   # fill in the values
```

Required values:
```
PORT=3001
NODE_ENV=production
CORS_ORIGIN=https://indiaintelligence.in,https://www.indiaintelligence.in
```

### 5. Start the API with PM2
```bash
pm2 start ecosystem.config.js --env production
pm2 save        # persist across reboots
pm2 startup     # auto-start on server reboot
```

### 6. Configure Hostinger Node.js proxy
In hPanel → Node.js → Create Application:
- Node.js version: 20.x
- Application root: `/home/u123456789/india-intelligence-engine/api`
- Application URL: `api.indiaintelligence.in`
- Application startup file: `src/server.js`

### 7. Deploy the frontend
```bash
# On your local machine:
cd frontend
npm run build    # generates /out folder

# Upload the /out folder contents to Hostinger public_html
# Use FileZilla / hPanel File Manager / rsync:
rsync -avz out/ u123456789@indiaintelligence.in:~/public_html/
```

---

## Re-deploying (after code changes)

### API update
```bash
ssh u123456789@indiaintelligence.in
cd ~/india-intelligence-engine
git pull
cd api && npm install --production
pm2 restart india-intelligence-api
```

### Frontend update
```bash
# Local:
cd frontend
npm run build
rsync -avz out/ u123456789@indiaintelligence.in:~/public_html/
```

---

## Data files

The following files are committed to git (small enough, needed at runtime):

| File | Size | Purpose |
|---|---|---|
| `data/exports/census_district_2011.parquet` | 499KB | District census data |
| `data/exports/census_state_2011.parquet` | 8KB | State census data |
| `data/processed/geo_states_simplified.geojson` | 770KB | State boundaries |
| `data/processed/geo_districts_simplified.geojson` | 4.3MB | District boundaries |
| `data/processed/geo_subdistricts_simplified.geojson` | 23MB | Subdistrict boundaries |

Large files (habitation, MI6) stay on HuggingFace: `bhaskarpandey2708/india-intelligence-data`

---

## Verify deployment

```bash
# Health check
curl https://api.indiaintelligence.in/health

# Stats
curl https://api.indiaintelligence.in/api/stats

# Search
curl "https://api.indiaintelligence.in/api/search?q=Mumbai"
```

Expected health response:
```json
{
  "status": "ok",
  "version": "1.0.0",
  "data": {
    "districts": 640,
    "states": 36,
    "geo_states": 35,
    "geo_districts": 641
  }
}
```
