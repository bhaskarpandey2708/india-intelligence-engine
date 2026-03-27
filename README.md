# India Intelligence Engine

A dedicated intelligence platform for India — built entirely on open, public data.

Not a general-purpose AI. A purpose-built system to query, analyze, and understand India at every administrative level: state, district, sub-district, village, habitation.

## Vision

Phase 1 — Census + Geo data platform (current)
Phase 2 — Ingest all data.gov.in datasets (economy, health, education, agriculture)
Phase 3 — Cross-dataset modeling and correlations
Phase 4 — Natural language interface ("show districts where literacy < 50% and SC population > 30%")
Phase 5 — Open API for researchers, journalists, and developers

## Structure

```
india-intelligence-engine/
├── api/                  → Node.js REST API (deployed on Hostinger)
├── frontend/             → Next.js web app (maps, dashboards, NL interface)
├── data-pipeline/        → Python scripts for ingesting and processing data
│   ├── scripts/          → Runnable pipeline scripts
│   ├── configs/          → Dataset source configs (URLs, schemas)
│   └── schemas/          → Expected column schemas for validation
├── data/
│   ├── raw/              → Downloaded source files (gitignored, stored on HuggingFace)
│   ├── processed/        → Cleaned outputs (gitignored, stored on HuggingFace)
│   └── exports/          → Parquet files for HuggingFace upload (gitignored)
└── docs/                 → Architecture, data dictionary, API docs
```

## Data Storage

Large data files are hosted on HuggingFace Datasets (free, public).
This repo contains only code, configs, and schemas.

## Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, Leaflet
- **API**: Node.js, Express/Fastify
- **Data Pipeline**: Python, GeoPandas, Pandas, PyArrow
- **Data Storage**: HuggingFace Datasets (large files), GitHub (code)
- **Hosting**: Hostinger Business (Node.js)
- **AI Layer**: Claude API (natural language queries)

## Data Sources

- Census 2011 (SHRUG v2.1 — Development Data Lab)
- Census 2011 Demographics (Office of Registrar General, India)
- Habitation Data 2009–2012 (Census of India)
- data.gov.in (thousands of datasets — ongoing ingestion)
- Election Commission of India (constituency data)

## PC11 Code Standard

All datasets are joined via PC11 (Population Census 2011) codes:
- State: 2 digits
- District: 3 digits
- Sub-District: 4 digits
- Village: 6 digits
