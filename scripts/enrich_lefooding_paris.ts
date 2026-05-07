import "dotenv/config";
import * as cheerio from "cheerio";
import { prisma } from "../src/lib/prisma";
import { normalizeText, parseStringList, serializeList } from "../src/lib/places";

const FOODING_SEARCH_URL =
  "https://lefooding.com/en/search/restaurant/place/paris-8246?page=";

type FoodingSearchResult = {
  url: string;
  name: string;
};

type FoodingDetail = {
  url: string;
  name: string;
  address: string | null;
  postalCode: string | null;
  imageUrl: string | null;
  description: string | null;
  cravings: string[];
  extras: string[];
  priceBucket: string | null;
  publishedAt: Date | null;
  websiteUrl: string | null;
};

type FoodingRestaurantJsonLd = Record<string, unknown> & {
  name?: string;
  address?: Record<string, unknown>;
  review?: Record<string, unknown>;
};

function mapFoodingPrice(priceBucket: string | null) {
  switch (priceBucket) {
    case "Less than €15":
      return "€";
    case "€16 to €35":
      return "€€";
    case "€36 to €50":
      return "€€€";
    case "More than €51":
      return "€€€€";
    default:
      return null;
  }
}

function parseCravings(metaDescription: string | null) {
  if (!metaDescription) {
    return [];
  }

  const match = metaDescription.match(/Cravings:\s*(.+?)\.\s*Extras:/i);
  if (!match?.[1]) {
    return [];
  }

  return match[1]
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseExtras(metaDescription: string | null) {
  if (!metaDescription) {
    return [];
  }

  const match = metaDescription.match(/Extras:\s*(.+?)\.\s*$/i);
  if (!match?.[1]) {
    return [];
  }

  return match[1]
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parsePriceBucket(pageText: string) {
  const match = pageText.match(
    /(Less than €15|€16 to €35|€36 to €50|More than €51)/i,
  );
  return match?.[1] ?? null;
}

function parseWebsiteUrl(pageText: string) {
  const match = pageText.match(/website\s+(https?:\/\/\S+)/i);
  return match?.[1] ?? null;
}

async function fetchHtml(url: string) {
  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; ParisFoodMapBot/1.0; +https://philou-food-map.vercel.app)",
      "Accept-Language": "en-US,en;q=0.9,fr;q=0.8",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }

  return response.text();
}

async function fetchSearchResults(page: number) {
  const url = `${FOODING_SEARCH_URL}${page}`;
  const html = await fetchHtml(url);
  const $ = cheerio.load(html);
  const seen = new Set<string>();
  const results: FoodingSearchResult[] = [];

  $("a[href]").each((_, element) => {
    const href = $(element).attr("href");
    const text = $(element).text().replace(/\s+/g, " ").trim();

    if (!href?.startsWith("/en/restaurants/")) {
      return;
    }

    const urlValue = new URL(href, "https://lefooding.com").toString();
    if (seen.has(urlValue)) {
      return;
    }

    seen.add(urlValue);
    results.push({
      url: urlValue,
      name: text,
    });
  });

  return results;
}

async function fetchFoodingDetail(url: string) {
  const html = await fetchHtml(url);
  const $ = cheerio.load(html);
  const metaDescription =
    $('meta[property="og:description"]').attr("content") ||
    $('meta[name="description"]').attr("content") ||
    null;
  const imageUrl = $('meta[property="og:image"]').attr("content") || null;
  const scripts = $('script[type="application/ld+json"]')
    .map((_, element) => $(element).text().trim())
    .get();

  let name: string | null = null;
  let address: string | null = null;
  let postalCode: string | null = null;
  let description: string | null = null;
  let publishedAt: Date | null = null;

  for (const raw of scripts) {
    try {
      const parsed = JSON.parse(raw);
      const blocks = Array.isArray(parsed) ? parsed : [parsed];

      for (const block of blocks) {
        if (
          typeof block === "object" &&
          block !== null &&
          String((block as Record<string, unknown>)["@type"]).toLowerCase() ===
            "restaurant"
        ) {
          const record = block as FoodingRestaurantJsonLd;
          name = typeof record.name === "string" ? record.name : name;
          address =
            typeof record.address?.streetAddress === "string"
              ? `${record.address.streetAddress}, ${record.address.postalCode} ${record.address.addressLocality}, ${record.address.addressCountry}`
              : address;
          postalCode =
            typeof record.address?.postalCode === "string"
              ? record.address.postalCode
              : postalCode;
          description =
            typeof record.review?.description === "string"
              ? record.review.description
              : description;
          publishedAt =
            typeof record.review?.datePublished === "string"
              ? new Date(record.review.datePublished)
              : publishedAt;
        }
      }
    } catch {
      // Ignore malformed JSON-LD blocks.
    }
  }

  const pageText = $("body").text().replace(/\s+/g, " ").trim();

  return {
    url,
    name: name ?? $("h1").first().text().trim() ?? url.split("/").pop() ?? "Unknown",
    address,
    postalCode,
    imageUrl,
    description,
    cravings: parseCravings(metaDescription),
    extras: parseExtras(metaDescription),
    priceBucket: parsePriceBucket(pageText),
    publishedAt,
    websiteUrl: parseWebsiteUrl(pageText),
  } satisfies FoodingDetail;
}

function matchPlace(
  detail: FoodingDetail,
  places: Array<{
    id: string;
    name: string;
    normalizedName: string;
    address: string | null;
    normalizedAddress: string | null;
    tags: string | null;
    priceRange: string | null;
    city: string | null;
    websiteUrl: string | null;
    googlePhotoName: string | null;
    googlePhotoUrl: string | null;
  }>,
) {
  const normalizedName = normalizeText(detail.name);
  const byName = places.filter(
    (place) => place.city?.toLowerCase() === "paris" && place.normalizedName === normalizedName,
  );

  if (byName.length === 1) {
    return byName[0];
  }

  const normalizedAddress = normalizeText(detail.address);
  if (normalizedAddress) {
    const exactAddress = byName.find(
      (place) =>
        place.normalizedAddress &&
        (place.normalizedAddress.includes(normalizedAddress) ||
          normalizedAddress.includes(place.normalizedAddress)),
    );

    if (exactAddress) {
      return exactAddress;
    }
  }

  if (detail.postalCode) {
    const byPostal = byName.filter((place) => place.address?.includes(detail.postalCode!));
    if (byPostal.length === 1) {
      return byPostal[0];
    }
  }

  return null;
}

async function main() {
  const pagesArg = process.argv.find((argument) => argument.startsWith("--pages="));
  const maxPages = pagesArg ? Number(pagesArg.split("=")[1]) : 28;

  const places = await prisma.place.findMany({
    where: {
      city: "Paris",
    },
    select: {
      id: true,
      name: true,
      normalizedName: true,
      address: true,
      normalizedAddress: true,
      tags: true,
      priceRange: true,
      city: true,
      websiteUrl: true,
      googlePhotoName: true,
      googlePhotoUrl: true,
    },
  });

  const resultMap = new Map<string, FoodingSearchResult>();

  for (let page = 1; page <= maxPages; page += 1) {
    const results = await fetchSearchResults(page);
    for (const result of results) {
      resultMap.set(result.url, result);
    }
  }

  let matched = 0;
  let enriched = 0;

  for (const result of resultMap.values()) {
    const detail = await fetchFoodingDetail(result.url);
    const place = matchPlace(detail, places);

    if (!place) {
      continue;
    }

    matched += 1;

    const existingTags = parseStringList(place.tags);
    const mergedTags = [
      ...existingTags,
      ...detail.cravings,
      ...detail.extras,
      "Fooding",
    ];
    const mappedPrice = mapFoodingPrice(detail.priceBucket);

    const source = await prisma.source.upsert({
      where: {
        url: detail.url,
      },
      update: {
        platform: "lefooding",
        title: `Le Fooding: ${detail.name}`,
        rawText: detail.description,
        processedStatus: "enriched",
      },
      create: {
        platform: "lefooding",
        url: detail.url,
        title: `Le Fooding: ${detail.name}`,
        rawText: detail.description,
        processedStatus: "enriched",
      },
    });

    await prisma.place.update({
      where: {
        id: place.id,
      },
      data: {
        tags: serializeList(mergedTags),
        priceRange: place.priceRange ?? mappedPrice,
        websiteUrl: place.websiteUrl ?? detail.websiteUrl,
        googlePhotoUrl:
          place.googlePhotoName || place.googlePhotoUrl ? undefined : detail.imageUrl,
      },
    });

    await prisma.recommendation.upsert({
      where: {
        id: `${place.id}-lefooding`,
      },
      update: {
        influencerName: "Le Fooding",
        influencerHandle: "lefooding",
        sourceId: source.id,
        sourcePlatform: "lefooding",
        sourceUrl: detail.url,
        sourceTitle: `Le Fooding: ${detail.name}`,
        sourceDate: detail.publishedAt,
        originalTextSnippet: detail.description?.slice(0, 500) ?? null,
        reasonRecommended: detail.description,
        recommendedItems: serializeList(detail.cravings),
        mentionedOnly: false,
        confidenceScore: 0.86,
        needsReview: false,
      },
      create: {
        id: `${place.id}-lefooding`,
        placeId: place.id,
        influencerName: "Le Fooding",
        influencerHandle: "lefooding",
        sourceId: source.id,
        sourcePlatform: "lefooding",
        sourceUrl: detail.url,
        sourceTitle: `Le Fooding: ${detail.name}`,
        sourceDate: detail.publishedAt,
        originalTextSnippet: detail.description?.slice(0, 500) ?? null,
        reasonRecommended: detail.description,
        recommendedItems: serializeList(detail.cravings),
        mentionedOnly: false,
        confidenceScore: 0.86,
        needsReview: false,
      },
    });

    if (detail.description) {
      await prisma.evidence.deleteMany({
        where: {
          sourceId: source.id,
          placeId: place.id,
          evidenceType: "lefooding_review",
        },
      });

      await prisma.evidence.create({
        data: {
          sourceId: source.id,
          placeId: place.id,
          evidenceType: "lefooding_review",
          evidenceText: detail.description.slice(0, 1500),
          confidenceScore: 0.86,
        },
      });
    }

    enriched += 1;
    console.log(`Matched Fooding → ${place.name}`);
  }

  console.log(
    `Fooding enrichment complete. Matched ${matched} Paris places and enriched ${enriched}.`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
