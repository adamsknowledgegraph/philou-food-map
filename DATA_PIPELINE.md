# Data Pipeline

## Goal

Populate the Paris food guide from public non-Instagram sources first, then add Instagram as an enrichment layer later.

## Inputs

- Public source catalog in [scripts/lib/catalog.ts](/Users/adamhome/Desktop/Food%20App%20-%20Emily%20tutorial/scripts/lib/catalog.ts)
- Raw HTML snapshots in [data/raw/web](/Users/adamhome/Desktop/Food%20App%20-%20Emily%20tutorial/data/raw/web)
- Review corrections in [data/review](/Users/adamhome/Desktop/Food%20App%20-%20Emily%20tutorial/data/review)

## Pipeline steps

### 1. Discover sources

Command:

```bash
npm run sources:discover
```

Output:

- [sources.md](/Users/adamhome/Desktop/Food%20App%20-%20Emily%20tutorial/sources.md)
- [data/source_catalog.json](/Users/adamhome/Desktop/Food%20App%20-%20Emily%20tutorial/data/source_catalog.json)

### 2. Ingest web pages

Command:

```bash
npm run sources:ingest
```

Output:

- Raw HTML per source in [data/raw/web](/Users/adamhome/Desktop/Food%20App%20-%20Emily%20tutorial/data/raw/web)
- Source records in SQLite

### 3. Extract places from raw sources

Command:

```bash
npm run extract
```

Output:

- [data/processed/extracted_places.json](/Users/adamhome/Desktop/Food%20App%20-%20Emily%20tutorial/data/processed/extracted_places.json)

Rules:

- Never invent restaurant names or addresses
- Save unknown fields as `null`
- Preserve evidence snippets
- Use higher confidence when an exact address is present

### 4. Normalize into SQLite

Command:

```bash
npm run normalize
```

What it does:

- Normalizes names and addresses
- Merges matching records
- Creates or updates `Place`, `Recommendation`, and `Evidence`
- Preserves review flags

### 5. Generate duplicate candidates

Command:

```bash
npm run dedupe
```

What it does:

- Compares normalized names and addresses
- Creates `DuplicateCandidate` rows for likely merges

### 6. Geocode

Command:

```bash
npm run geocode
```

What it does:

- Uses OpenStreetMap Nominatim
- Caches successful results in [data/cache/geocode_cache.json](/Users/adamhome/Desktop/Food%20App%20-%20Emily%20tutorial/data/cache/geocode_cache.json)
- Logs failures in [data/cache/geocode_failures.json](/Users/adamhome/Desktop/Food%20App%20-%20Emily%20tutorial/data/cache/geocode_failures.json)

### 7. Export review files

Command:

```bash
npm run review:export
```

Output:

- [data/review/places_review.csv](/Users/adamhome/Desktop/Food%20App%20-%20Emily%20tutorial/data/review/places_review.csv)
- [data/review/duplicate_candidates.csv](/Users/adamhome/Desktop/Food%20App%20-%20Emily%20tutorial/data/review/duplicate_candidates.csv)

### 8. Import review decisions

Command:

```bash
npm run review:import
```

What it does:

- Applies reviewer corrections
- Updates statuses
- Appends to `ReviewLog`

## Quick pipeline

```bash
npm run pipeline:quick
```

## Full pipeline

```bash
npm run pipeline:full
```

`pipeline:full` is the same as `pipeline:quick` plus the later Instagram enrichment commands.
