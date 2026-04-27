import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { prisma } from "../src/lib/prisma";
import {
  PROCESSED_DIR,
  buildGoogleMapsUrl,
  normalizeText,
  serializeList,
  uniqueList,
} from "./lib/utils";

type ExtractedPayload = {
  sources: Array<{
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
  }>;
};

function parseJsonList(value: string | null | undefined) {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map((entry) => String(entry)) : [];
  } catch {
    return [];
  }
}

function findExistingPlace(
  places: Awaited<ReturnType<typeof prisma.place.findMany>>,
  incoming: {
    normalizedName: string;
    normalizedAddress: string | null;
    city: string | null;
    arrondissement: string | null;
  },
) {
  return places.find((place) => {
    if (
      place.normalizedName === incoming.normalizedName &&
      place.normalizedAddress &&
      incoming.normalizedAddress &&
      place.normalizedAddress === incoming.normalizedAddress
    ) {
      return true;
    }

    return (
      place.normalizedName === incoming.normalizedName &&
      place.city === incoming.city &&
      place.arrondissement === incoming.arrondissement
    );
  });
}

function mergeSummary(
  existingSummary: string | null | undefined,
  nextParts: Array<string | null | undefined>,
) {
  const chunks = [
    ...(existingSummary ? [existingSummary] : []),
    ...nextParts
      .map((part) => part?.trim())
      .filter((part): part is string => Boolean(part)),
  ];

  const uniqueChunks = chunks.filter(
    (chunk, index, array) => array.findIndex((candidate) => candidate === chunk) === index,
  );

  return uniqueChunks.join("\n\n").slice(0, 1800) || null;
}

async function main() {
  const raw = await readFile(join(PROCESSED_DIR, "extracted_places.json"), "utf8");
  const payload = JSON.parse(raw) as ExtractedPayload;
  const places = await prisma.place.findMany();
  let upserted = 0;

  for (const sourceRecord of payload.sources) {
    const source = await prisma.source.upsert({
      where: {
        url: sourceRecord.source_url,
      },
      update: {
        platform: sourceRecord.source_platform,
        title: sourceRecord.source_title,
        date: sourceRecord.source_date ? new Date(sourceRecord.source_date) : undefined,
        processedStatus: "normalized",
      },
      create: {
        platform: sourceRecord.source_platform,
        url: sourceRecord.source_url,
        title: sourceRecord.source_title,
        date: sourceRecord.source_date ? new Date(sourceRecord.source_date) : null,
        processedStatus: "normalized",
      },
    });

    for (const extracted of sourceRecord.places) {
      const normalizedName = normalizeText(extracted.name);
      const normalizedAddress = normalizeText(extracted.address);
      const existing = findExistingPlace(places, {
        normalizedName,
        normalizedAddress: normalizedAddress || null,
        city: extracted.city,
        arrondissement: extracted.arrondissement,
      });

      const place = existing
        ? await prisma.place.update({
            where: { id: existing.id },
            data: {
              address: existing.address ?? extracted.address,
              normalizedAddress: existing.normalizedAddress ?? (normalizedAddress || null),
              city: existing.city ?? extracted.city,
              neighborhood: existing.neighborhood ?? extracted.neighborhood,
              arrondissement: existing.arrondissement ?? extracted.arrondissement,
              country: existing.country ?? extracted.country,
              latitude: existing.latitude ?? extracted.latitude,
              longitude: existing.longitude ?? extracted.longitude,
              googlePlaceId: existing.googlePlaceId ?? extracted.google_place_id,
              cuisineType: existing.cuisineType ?? extracted.cuisine_type,
              foodType: serializeList(
                uniqueList([
                  ...parseJsonList(existing.foodType),
                  ...extracted.food_type,
                ]),
              ),
              priceRange: existing.priceRange ?? extracted.price_range,
              estimatedPricePerPerson:
                existing.estimatedPricePerPerson ?? extracted.estimated_price_per_person,
              tags: serializeList(
                uniqueList([...parseJsonList(existing.tags), ...extracted.tags]),
              ),
              googleMapsUrl:
                existing.googleMapsUrl ??
                extracted.google_maps_url ??
                (extracted.address ? buildGoogleMapsUrl(extracted.address) : null),
              instagramUrl: existing.instagramUrl ?? extracted.instagram_url,
              websiteUrl: existing.websiteUrl ?? extracted.website_url,
              bookingUrl: existing.bookingUrl ?? extracted.booking_url,
              philouSummary: mergeSummary(existing.philouSummary, [
                extracted.reason_recommended,
                extracted.recommended_items.length
                  ? `Recommended items: ${extracted.recommended_items.join(", ")}`
                  : null,
              ]),
              confidenceScore: Math.max(existing.confidenceScore, extracted.confidence_score),
              needsReview: existing.needsReview && extracted.needs_review,
              status:
                existing.status === "rejected" || existing.status === "merged"
                  ? existing.status
                  : existing.needsReview && extracted.needs_review
                    ? "needs_review"
                    : "approved",
            },
          })
        : await prisma.place.create({
            data: {
              name: extracted.name,
              normalizedName,
              address: extracted.address,
              normalizedAddress: normalizedAddress || null,
              city: extracted.city,
              neighborhood: extracted.neighborhood,
              arrondissement: extracted.arrondissement,
              country: extracted.country,
              latitude: extracted.latitude,
              longitude: extracted.longitude,
              googlePlaceId: extracted.google_place_id,
              cuisineType: extracted.cuisine_type,
              foodType: serializeList(extracted.food_type),
              priceRange: extracted.price_range,
              estimatedPricePerPerson: extracted.estimated_price_per_person,
              tags: serializeList(extracted.tags),
              googleMapsUrl:
                extracted.google_maps_url ??
                (extracted.address ? buildGoogleMapsUrl(extracted.address) : null),
              instagramUrl: extracted.instagram_url,
              websiteUrl: extracted.website_url,
              bookingUrl: extracted.booking_url,
              philouSummary: mergeSummary(null, [
                extracted.reason_recommended,
                extracted.recommended_items.length
                  ? `Recommended items: ${extracted.recommended_items.join(", ")}`
                  : null,
              ]),
              confidenceScore: extracted.confidence_score,
              needsReview: extracted.needs_review,
              status: extracted.needs_review ? "needs_review" : "approved",
            },
          });

      if (!existing) {
        places.push(place);
      }

      const recommendationExists = await prisma.recommendation.findFirst({
        where: {
          placeId: place.id,
          sourceUrl:
            sourceRecord.source_platform === "mapstr" && extracted.google_maps_url
              ? sourceRecord.source_url
              : sourceRecord.source_url,
          sourceTitle: sourceRecord.source_title,
        },
      });

      if (!recommendationExists) {
        await prisma.recommendation.create({
          data: {
            placeId: place.id,
            influencerName: "Philippine Darblay",
            influencerHandle: "philoudarblay",
            sourceId: source.id,
            sourcePlatform: sourceRecord.source_platform,
            sourceUrl: sourceRecord.source_url,
            sourceTitle: sourceRecord.source_title,
            sourceDate: sourceRecord.source_date ? new Date(sourceRecord.source_date) : null,
            originalTextSnippet: extracted.evidence_snippet,
            recommendedItems: serializeList(extracted.recommended_items),
            reasonRecommended: extracted.reason_recommended,
            mentionedOnly: extracted.mentioned_only,
            confidenceScore: extracted.confidence_score,
            needsReview: extracted.needs_review,
          },
        });
      }

      const evidenceExists = await prisma.evidence.findFirst({
        where: {
          placeId: place.id,
          sourceId: source.id,
          evidenceText: extracted.evidence_snippet,
        },
      });

      if (!evidenceExists) {
        await prisma.evidence.create({
          data: {
            placeId: place.id,
            sourceId: source.id,
            evidenceType:
              sourceRecord.source_platform === "mapstr" ? "mapstr_save" : "article_snippet",
            evidenceText: extracted.evidence_snippet,
            confidenceScore: extracted.confidence_score,
          },
        });
      }

      upserted += 1;
    }
  }

  console.log(`Normalized and upserted ${upserted} place records into SQLite.`);
}

main()
  .catch(async (error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
