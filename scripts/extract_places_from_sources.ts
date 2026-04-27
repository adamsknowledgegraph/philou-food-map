import { readFile } from "node:fs/promises";
import { join } from "node:path";
import * as cheerio from "cheerio";
import { EXTRACTABLE_SOURCES, INFLUENCER } from "./lib/catalog";
import type { MapstrPlaceRecord } from "./lib/mapstr";
import {
  PROCESSED_DIR,
  RAW_WEB_DIR,
  arrondissementFromText,
  buildGoogleMapsUrl,
  ensureProjectDirs,
  writeJson,
} from "./lib/utils";

type ExtractedPlace = {
  source_url: string;
  source_platform: string;
  source_title: string;
  source_date: string | null;
  places: Array<{
    name: string;
    address: string | null;
    city: string | null;
    neighborhood: string | null;
    arrondissement: string | null;
    country: string | null;
    latitude: number | null;
    longitude: number | null;
    google_place_id: string | null;
    cuisine_type: string | null;
    food_type: string[];
    price_range: string | null;
    estimated_price_per_person: number | null;
    recommended_items: string[];
    tags: string[];
    reason_recommended: string | null;
    booking_url: string | null;
    google_maps_url: string | null;
    instagram_url: string | null;
    website_url: string | null;
    mentioned_only: boolean;
    evidence_snippet: string;
    confidence_score: number;
    needs_review: boolean;
  }>;
};

function extractJsonLd<T>(html: string, predicate: (value: unknown) => boolean) {
  const $ = cheerio.load(html);
  const matches: T[] = [];

  $('script[type="application/ld+json"]').each((_, element) => {
    const raw = $(element).text().trim();
    if (!raw) {
      return;
    }

    try {
      const parsed = JSON.parse(raw);
      const values = Array.isArray(parsed) ? parsed : [parsed];
      for (const value of values) {
        if (predicate(value)) {
          matches.push(value as T);
        }
      }
    } catch {
      // Ignore malformed blocks and keep searching.
    }
  });

  return matches;
}

function inferFoodTypes(place: MapstrPlaceRecord) {
  const inferred = new Set<string>();
  const icon = place.icon?.trim().toLowerCase();

  if (icon) {
    inferred.add(icon);
  }

  if (place.tags_names?.some((tag) => /brunch/i.test(tag))) {
    inferred.add("brunch");
  }

  if (place.tags_names?.some((tag) => /hotel/i.test(tag))) {
    inferred.add("hotel");
  }

  return [...inferred];
}

function getBookingUrl(place: MapstrPlaceRecord) {
  return (
    place.services?.find((service) => service.type === "restaurant_booking")?.widget_url ??
    place.menu ??
    null
  );
}

async function extractFromMapstr(source: (typeof EXTRACTABLE_SOURCES)[number]) {
  const raw = await readFile(join(RAW_WEB_DIR, `${source.slug}.places.json`), "utf8");
  const payload = JSON.parse(raw) as {
    mapId: string;
    places: MapstrPlaceRecord[];
  };

  const places = payload.places.map((place) => {
    const city = place.addressComponents?.city ?? null;
    const country = place.addressComponents?.country ?? null;
    const arrondissement =
      city?.toLowerCase() === "paris" ? arrondissementFromText(place.address) : null;
    const hasFullAddress =
      Boolean(place.address) &&
      Boolean(place.addressComponents?.street_name) &&
      Boolean(place.addressComponents?.city) &&
      Boolean(place.addressComponents?.country);

    return {
      name: place.name,
      address: place.address,
      city,
      neighborhood: null,
      arrondissement,
      country,
      latitude: place.geopoint?.latitude ?? null,
      longitude: place.geopoint?.longitude ?? null,
      google_place_id: place.googleId ?? null,
      cuisine_type: null,
      food_type: inferFoodTypes(place),
      price_range: null,
      estimated_price_per_person: null,
      recommended_items: [],
      tags: [...(place.tags_names ?? []), "mapstr", "public-map"],
      reason_recommended: "Publicly saved in Philippine Darblay's Mapstr map.",
      booking_url: getBookingUrl(place),
      google_maps_url: place.address ? buildGoogleMapsUrl(place.address) : null,
      instagram_url: null,
      website_url: place.website ?? null,
      mentioned_only: false,
      evidence_snippet: `Saved on Philippine Darblay's public Mapstr map: ${place.name} — ${place.address ?? "address unavailable"}`,
      confidence_score: hasFullAddress ? 0.98 : 0.82,
      needs_review: !hasFullAddress,
    };
  });

  return {
    source_url: source.url,
    source_platform: source.platform,
    source_title: source.title,
    source_date: null,
    places,
  } satisfies ExtractedPlace;
}

async function extractFromFigaro(html: string, source: (typeof EXTRACTABLE_SOURCES)[number]) {
  const [article] = extractJsonLd<{
    datePublished?: string;
    description?: string;
    articleBody?: string;
  }>(
    html,
    (value) =>
      typeof value === "object" &&
      value !== null &&
      (value as Record<string, unknown>)["@type"] === "NewsArticle",
  );

  if (!article || !source.extraction) {
    return null;
  }

  const articleText = [article.description ?? "", article.articleBody ?? ""].join(" ");
  const arrondissement = arrondissementFromText(articleText);
  const evidenceSnippet =
    article.description ??
    article.articleBody?.slice(0, 240) ??
    `${source.extraction.placeName} recommended by Philippine Darblay on Madame Figaro.`;

  return {
    source_url: source.url,
    source_platform: source.platform,
    source_title: source.title,
    source_date: article.datePublished ?? null,
    places: [
      {
        name: source.extraction.placeName ?? source.title,
        address: null,
        city: "Paris",
        neighborhood: null,
        arrondissement,
        country: "France",
        latitude: null,
        longitude: null,
        google_place_id: null,
        cuisine_type: source.extraction.cuisineType ?? null,
        food_type: source.extraction.foodType ?? [],
        price_range: null,
        estimated_price_per_person: null,
        recommended_items: source.extraction.recommendedItems ?? [],
        tags: source.extraction.tags ?? ["madame-figaro"],
        reason_recommended:
          source.extraction.reasonHint ?? article.articleBody ?? article.description ?? null,
        booking_url: null,
        google_maps_url: null,
        instagram_url: null,
        website_url: null,
        mentioned_only: false,
        evidence_snippet: evidenceSnippet,
        confidence_score: arrondissement ? 0.66 : 0.58,
        needs_review: true,
      },
    ],
  } satisfies ExtractedPlace;
}

async function main() {
  await ensureProjectDirs();
  const extracted: ExtractedPlace[] = [];

  for (const source of EXTRACTABLE_SOURCES) {
    const html = await readFile(join(RAW_WEB_DIR, `${source.slug}.html`), "utf8");

    const result =
      source.extraction?.mode === "mapstr"
        ? await extractFromMapstr(source)
        : await extractFromFigaro(html, source);

    if (result) {
      extracted.push(result);
    }
  }

  await writeJson(join(PROCESSED_DIR, "extracted_places.json"), {
    influencer: INFLUENCER,
    extractedAt: new Date().toISOString(),
    sources: extracted,
  });

  const placeCount = extracted.reduce((sum, source) => sum + source.places.length, 0);
  console.log(`Extracted ${placeCount} place records from ${extracted.length} sources.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
