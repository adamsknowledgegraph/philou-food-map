# Quick Start

This path is optimized for fast non-Instagram results.

## 1. Set the database path

Copy [.env.example](/Users/adamhome/Desktop/Food%20App%20-%20Emily%20tutorial/.env.example) to `.env` and confirm `DATABASE_URL`.

## 2. Prepare the app database

```bash
npm install
npm run db:migrate
npm run db:seed
```

This gives you a working site immediately with a small bootstrap dataset.

## 3. Discover the public web sources

```bash
npm run sources:discover
```

Review [sources.md](/Users/adamhome/Desktop/Food%20App%20-%20Emily%20tutorial/sources.md).

## 4. Run the quick public-source pipeline

```bash
npm run pipeline:quick
```

This runs:

1. Source discovery
2. Source ingestion
3. Extraction
4. Normalization into SQLite
5. Duplicate candidate generation
6. Geocoding with cache
7. Review CSV export

## 5. Start the website

```bash
npm run dev
```

Then open:

- `http://localhost:3000/`
- `http://localhost:3000/places`
- `http://localhost:3000/map`
- `http://localhost:3000/admin/review`

## 6. Review uncertain records

- Open the in-app review page.
- Or edit:
  - [data/review/places_review.csv](/Users/adamhome/Desktop/Food%20App%20-%20Emily%20tutorial/data/review/places_review.csv)
  - [data/review/duplicate_candidates.csv](/Users/adamhome/Desktop/Food%20App%20-%20Emily%20tutorial/data/review/duplicate_candidates.csv)

Then re-import:

```bash
npm run review:import
```
