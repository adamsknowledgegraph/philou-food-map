# Instagram Enrichment

Instagram is intentionally not the core dependency of this project.

The website, database, and public-source pipeline should already work before you start using any Instagram data.

## What Instagram should add later

- More source URLs
- Captions
- Video transcripts
- OCR text from overlays
- Additional recommended dishes
- Additional tags
- More evidence
- Confidence boosts for already-known places

## Mode A: Authorized browser-assisted collection

Use only when you have authorization and are ready to enrich the existing database.

Rules:

- Use your own local browser session
- Log in manually
- Do not store your password in code
- Store session state only in a private ignored location
- Visit only the specified influencer profile
- Stop if challenges, CAPTCHA, warnings, or rate limits appear
- Do not collect unrelated accounts, comments, DMs, or private content
- Do not bypass protections

Command:

```bash
npm run instagram:collect
```

Current status:

- Folder preparation exists
- Full browser-assisted collection is deferred by design

## Mode B: Manual fallback

Supported folders:

- [data/input/instagram_posts.csv](/Users/adamhome/Desktop/Food%20App%20-%20Emily%20tutorial/data/input/instagram_posts.csv)
- [data/videos](/Users/adamhome/Desktop/Food%20App%20-%20Emily%20tutorial/data/videos)
- [data/screenshots](/Users/adamhome/Desktop/Food%20App%20-%20Emily%20tutorial/data/screenshots)
- [data/captions](/Users/adamhome/Desktop/Food%20App%20-%20Emily%20tutorial/data/captions)
- [data/transcripts](/Users/adamhome/Desktop/Food%20App%20-%20Emily%20tutorial/data/transcripts)
- [data/ocr](/Users/adamhome/Desktop/Food%20App%20-%20Emily%20tutorial/data/ocr)

Commands:

```bash
npm run instagram:import
npm run instagram:transcribe
npm run instagram:ocr
npm run instagram:extract
```

## Suggested next implementation order

1. Visible Playwright login flow
2. Manual import from CSV and copied captions
3. FFmpeg audio extraction
4. Transcription
5. OCR on screenshots and video frames
6. Evidence merge
7. Structured place extraction
8. Attach to existing places before creating new ones
