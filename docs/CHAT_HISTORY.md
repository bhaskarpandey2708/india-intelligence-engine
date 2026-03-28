# India Intelligence Engine — Chat History & Decision Log

A running log of all Claude sessions, decisions made, and why. Read this before starting any new session.

---

## Session 1 — Project Bootstrap
**Date:** ~March 2026 (early)
**What happened:**
- Decided to build a dedicated India data intelligence platform using only free/open data
- Chose Census 2011 as the foundation (35 states, 641 districts, 5,969 sub-districts, 648,254 villages)
- Joined everything via **PC11 code** (Census 2011 location code standard)

**Key decisions:**
- **HuggingFace** for all large data files (CSV, Parquet, GeoJSON, Shapefiles) — free, no LFS needed
  - Repo: `bhaskarpandey2708/india-intelligence-data`
- **GitHub** for code only (no data files)
- **Hostinger Business Plan** for Node.js API + Next.js frontend deployment
- **No paid data** — everything must be open/government-released

**Tech stack chosen:**
- Frontend: Next.js 14, TypeScript, Tailwind CSS, Leaflet (choropleth map)
- API: Node.js/Express on Hostinger
- Data Pipeline: Python (GeoPandas, Pandas, PyArrow)
- AI Layer (future): Claude API for natural language queries

---

## Session 2 — Data Pipeline & HuggingFace Upload
**Date:** ~March 2026
**What happened:**
- Built pipeline scripts (`data-pipeline/scripts/01` through `05`) for processing Census data
- Converted raw CSVs to Parquet for efficient storage
- Added Lok Sabha + Assembly constituency shapefiles
- Uploaded all data to HuggingFace: `bhaskarpandey2708/india-intelligence-data`

**Data ingested so far:**
| Dataset | Rows | HF Path |
|---|---|---|
| District Census 2011 | 640 | `data/census/census_district_2011.parquet` |
| State Population 2011 | 36 | `data/census/census_state_2011.parquet` |
| Habitation Info 2009 | 1,658,322 | `data/census/habitation_2009.parquet` |
| Habitation Info 2010 | 1,661,057 | `data/census/habitation_2010.parquet` |
| Habitation Info 2011 | 1,664,185 | `data/census/habitation_2011.parquet` |
| Habitation Info 2012 | 1,666,074 | `data/census/habitation_2012.parquet` |

---

## Session 3 — Next.js Frontend Built
**Date:** March 2026
**Commit:** `93eb072 Add Next.js frontend — interactive choropleth map`
**What happened:**
- Built the initial frontend: interactive choropleth map of India
- Components: `MapView`, `MainLayout`, `SearchBar`, `InfoPanel`, `StatsBar`
- API layer (`app/lib/api.ts`) points to `NEXT_PUBLIC_API_URL` (defaults to `localhost:3001`)
- All components marked `'use client'` (no server components used in practice)
- `StatsBar` originally received stats as a prop from a server-side fetch in `page.tsx`

---

## Session 4 — MI6 Irrigation Data + Folder Reorganization
**Date:** March 28, 2026
**Commit:** `7e6017c Add MI6 irrigation data + reorganize folder structure`
**What happened:**
- Added 6th Minor Irrigation Census (MI6) data — village-level irrigation data
- 51 new files, ~1.68M rows across 21 Indian states
- Ground water types: DTW (Deep Tube Well), MTW (Medium Tube Well), STW (Shallow Tube Well), DGW (Dug Well)
- Surface water types: SF (Surface Flow), SL (Surface Lift)
- Converted all non-empty MI6 CSVs to Parquet (~55MB total, 20 files)
- Reorganized `/data/raw/` into: `census/`, `habitation/`, `minor_irrigation/`
- Updated `datasets.json` to v1.1.0 with all 10 datasets catalogued
- Created `docs/data-sources.md` with full data dictionary

---

## Session 5 — Static Export Migration for Hostinger
**Date:** March 28, 2026
**Status:** IN PROGRESS

### The Problem
Hostinger Business Plan supports Node.js apps but we want the **frontend to be a pure static build** (HTML/CSS/JS) for simpler deployment — no Node.js process needed for the frontend. The API (Express) runs separately on Hostinger's Node.js.

### What Was Changed
1. **`next.config.ts`** — Removed API proxy rewrites, added `output: 'export'` + `trailingSlash: true`
   - **Why remove rewrites?** With `output: 'export'`, Next.js generates static files. There's no Next.js server running to handle rewrites. Frontend calls the API directly via `NEXT_PUBLIC_API_URL`.
   - **Why `trailingSlash: true`?** Static hosting (Apache/Nginx on Hostinger) serves `about/index.html` for `/about/` — trailing slashes ensure correct file resolution.

2. **`page.tsx`** — Removed server-side `api.stats()` call, made Home a plain (non-async) component
   - **Why?** `output: 'export'` does NOT support async server components that fetch data at runtime. All data fetching must be client-side.

3. **`StatsBar.tsx`** — Moved stats fetch into `useEffect` hook (client-side), added loading skeleton
   - **Why?** Component used to receive `stats` as a prop from the server. Now fetches independently on mount.

4. **`api.ts`** — Removed `next: { revalidate: 3600 }` from fetch options
   - **Why?** This is a Next.js server-side caching hint. Meaningless (and potentially breaking) in a pure client-side context.

### Deployment Plan (Hostinger)
- **Frontend:** Build with `npm run build` → upload `/out` folder to Hostinger public_html
- **API:** Node.js Express app runs on Hostinger Node.js hosting (separate subdomain or port)
- **Env var:** Set `NEXT_PUBLIC_API_URL=https://api.yourdomain.com` before build

### Outcome
- Build verified clean ✓
- All changes committed (`fc9b1c9`)

---

## Session 6 — Hostinger Deployment Setup
**Date:** March 28, 2026
**Commit:** `7274b95`
**What happened:**

### Problems fixed
1. **`data-loader.js` broken GeoJSON path** — it referenced `../../../india-geodata-platform/public/data` which only exists locally. Removed the fallback, now only reads from `data/processed/` (simplified GeoJSONs). Made `DATA_DIR` configurable via env var.
2. **CORS open to all** — tightened to `CORS_ORIGIN` env var in production (comma-separated list of allowed origins).
3. **Data files not in git** — `.gitignore` was excluding all parquets/GeoJSONs. Whitelisted the 5 small runtime files (507KB census parquets + 28MB GeoJSONs). Large habitation files (132MB) stay on HuggingFace only.
4. **`frontend/.env.production` blocked by gitignore** — the `frontend/.gitignore` had `.env*` catch-all. Changed to specific excludes and allowed `.env.production`.
5. **`api.ts` had `next: { revalidate }` hint** — removed (session 5), meaningless client-side.

### New files
- `api/ecosystem.config.js` — PM2 config for Hostinger, with `env_production` block
- `api/.env.example` — documents all env vars
- `frontend/.env.production` — sets `NEXT_PUBLIC_API_URL=https://api.indiaintelligence.in`
- `docs/DEPLOYMENT.md` — full Hostinger setup guide + re-deploy steps

### Domain convention
- Frontend: `https://indiaintelligence.in` → `public_html/`
- API: `https://api.indiaintelligence.in` → Node.js app via PM2

### Next Steps
- [ ] Push to GitHub
- [ ] SSH into Hostinger, clone repo, `npm install`, create `.env`, start PM2
- [ ] Upload `frontend/out/` to Hostinger `public_html/`
- [ ] Verify with `curl https://api.indiaintelligence.in/health`

---

## Roadmap (Phases)
1. **Census + Geo platform** ← current
2. Ingest all data.gov.in datasets
3. Cross-dataset modeling (join MI6 + Census + habitation by PC11)
4. NL interface (Claude API for plain-English queries over data)
5. Open API for researchers

---

## Constraints & Rules (Non-Negotiable)
- No paid data sources — everything is open/government
- GitHub = code only, HuggingFace = data files
- Hostinger Business Plan = only paid infra
- Everything else must be free/open source
- PC11 code is the universal join key across all datasets
