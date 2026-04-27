# Review Workflow

## Why review exists

Some sources give exact addresses. Others only give a place name, cuisine, arrondissement, or descriptive snippet. The review layer is there to keep incomplete but valuable records visible without pretending they are fully verified.

## In-app review page

Open:

`/admin/review`

You can:

- Approve a place
- Save edits while keeping it in review
- Mark a place as closed
- Reject a weak extraction
- Merge duplicate candidates

## CSV review files

Export:

```bash
npm run review:export
```

Files:

- [data/review/places_review.csv](/Users/adamhome/Desktop/Food%20App%20-%20Emily%20tutorial/data/review/places_review.csv)
- [data/review/duplicate_candidates.csv](/Users/adamhome/Desktop/Food%20App%20-%20Emily%20tutorial/data/review/duplicate_candidates.csv)

Main place review columns:

- `place_id`
- `name`
- `address`
- `city`
- `neighborhood`
- `arrondissement`
- `cuisine_type`
- `food_type`
- `price_range`
- `tags`
- `source_url`
- `evidence_snippet`
- `confidence_score`
- `needs_review`
- `reviewer_notes`
- `approved`
- `corrected_name`
- `corrected_address`
- `corrected_city`
- `corrected_neighborhood`
- `corrected_price_range`
- `corrected_tags`

## Import reviewed CSVs

```bash
npm run review:import
```

This will:

- Apply corrected place fields
- Flip records to approved or rejected
- Update duplicate candidate statuses
- Write a `ReviewLog` entry for traceability
