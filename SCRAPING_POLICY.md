# Scraping Policy

## Core policy

This project starts with public non-Instagram sources first.

Public-source priority:

1. Influencer website
2. Link hub
3. Google Maps lists
4. Mapstr
5. Blog posts
6. Newsletter archives
7. Public notion, airtable, or sheet pages
8. Articles and interviews
9. YouTube descriptions or transcripts
10. Easily accessible TikTok captions
11. Podcast or show notes
12. Other public mentions

## Current implementation

The current codebase prioritizes:

- Public Mapstr
- Public Madame Figaro pages
- Other public editorial discovery pages

## Rules for public scraping

- Fetch only publicly accessible pages
- Save raw HTML locally for reproducibility
- Preserve source URLs
- Preserve evidence snippets
- Never invent place names or addresses
- Mark uncertain records as needing review

## Rules for Instagram later

- Manual login only
- No password storage in code
- No auth bypass
- No collection beyond the specified influencer profile
- Stop on rate limits, challenges, or warnings
- No unrelated user data

## Data quality policy

- Exact address visible: higher confidence
- Name only: lower confidence and review required
- Ambiguous geocode: do not guess coordinates
- Duplicate risk: create a candidate instead of silently merging
