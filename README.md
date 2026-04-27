# Philippine Darblay Food Map

A Next.js + TypeScript + Tailwind + Prisma SQLite MVP for browsing Philippine Darblay's recommended addresses, starting with the fastest public non-Instagram sources first and keeping Paris as the main review focus.

## What is already built

- A searchable website with:
  - Home page
  - Places page with filters and sorting, including city
  - Map page with interactive markers
  - Place detail page with sources and evidence
  - Admin review page for approving, correcting, rejecting, and merging
- A SQLite database schema for:
  - `Place`
  - `Recommendation`
  - `Source`
  - `Evidence`
  - `ReviewLog`
  - `DuplicateCandidate`
- A working public-web pipeline for:
  - Source discovery
  - Source ingestion
  - Structured extraction
  - Normalization into SQLite
  - Duplicate candidate generation
  - Geocoding with cache
  - Review CSV export/import
- Deferred Instagram command stubs and docs so Instagram does not block the core product.

## Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- Prisma ORM
- SQLite
- React Leaflet

## Current source strategy

The project intentionally starts with public non-Instagram pages:

1. Public Mapstr map
2. Madame Figaro episode hub
3. Individual Madame Figaro food articles
4. Other public editorial or newsletter landing pages for discovery

The Mapstr pipeline now pulls the full public map payload from the embedded web app, not just the 100-place SEO preview on the public HTML page.

See [sources.md](./sources.md) for the researched source inventory.

## Database path

The default SQLite file is configured as an absolute local path in `.env`:

`file:/Users/adamhome/.local/share/food-reco-paris/app.db`

If you want a different location, copy `.env.example` to `.env` and update `DATABASE_URL`.

## Commands

```bash
npm run dev
npm run db:migrate
npm run db:seed
npm run sources:discover
npm run sources:ingest
npm run extract
npm run normalize
npm run dedupe
npm run geocode
npm run google:enrich
npm run review:export
npm run review:import
npm run instagram:collect
npm run instagram:import
npm run instagram:transcribe
npm run instagram:ocr
npm run instagram:extract
npm run pipeline:quick
npm run pipeline:full
```

## Recommended run order

```bash
npm install
npm run db:migrate
npm run db:seed
npm run pipeline:quick
npm run google:enrich
npm run dev
```

## Key files

- [src/app](/Users/adamhome/Desktop/Food%20App%20-%20Emily%20tutorial/src/app)
- [src/lib/places.ts](/Users/adamhome/Desktop/Food%20App%20-%20Emily%20tutorial/src/lib/places.ts)
- [prisma/schema.prisma](/Users/adamhome/Desktop/Food%20App%20-%20Emily%20tutorial/prisma/schema.prisma)
- [prisma/seed.ts](/Users/adamhome/Desktop/Food%20App%20-%20Emily%20tutorial/prisma/seed.ts)
- [scripts](/Users/adamhome/Desktop/Food%20App%20-%20Emily%20tutorial/scripts)
- [data](/Users/adamhome/Desktop/Food%20App%20-%20Emily%20tutorial/data)

## More docs

- [QUICK_START.md](/Users/adamhome/Desktop/Food%20App%20-%20Emily%20tutorial/QUICK_START.md)
- [DATA_PIPELINE.md](/Users/adamhome/Desktop/Food%20App%20-%20Emily%20tutorial/DATA_PIPELINE.md)
- [REVIEW_WORKFLOW.md](/Users/adamhome/Desktop/Food%20App%20-%20Emily%20tutorial/REVIEW_WORKFLOW.md)
- [INSTAGRAM_ENRICHMENT.md](/Users/adamhome/Desktop/Food%20App%20-%20Emily%20tutorial/INSTAGRAM_ENRICHMENT.md)
- [SCRAPING_POLICY.md](/Users/adamhome/Desktop/Food%20App%20-%20Emily%20tutorial/SCRAPING_POLICY.md)
