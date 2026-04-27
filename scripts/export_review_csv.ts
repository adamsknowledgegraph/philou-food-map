import { writeFile } from "node:fs/promises";
import Papa from "papaparse";
import { prisma } from "../src/lib/prisma";
import { REVIEW_DIR, ensureProjectDirs } from "./lib/utils";

function list(value: string | null | undefined) {
  if (!value) {
    return "";
  }

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.join(", ") : "";
  } catch {
    return value;
  }
}

async function main() {
  await ensureProjectDirs();

  const places = await prisma.place.findMany({
    where: {
      needsReview: true,
    },
    include: {
      evidence: {
        take: 1,
        orderBy: {
          createdAt: "desc",
        },
      },
      recommendations: {
        take: 1,
        orderBy: {
          createdAt: "desc",
        },
      },
    },
    orderBy: {
      confidenceScore: "asc",
    },
  });

  const duplicateCandidates = await prisma.duplicateCandidate.findMany({
    include: {
      place1: true,
      place2: true,
    },
    where: {
      status: "pending",
    },
  });

  const placeCsv = Papa.unparse(
    places.map((place) => ({
      place_id: place.id,
      name: place.name,
      address: place.address ?? "",
      city: place.city ?? "",
      neighborhood: place.neighborhood ?? "",
      arrondissement: place.arrondissement ?? "",
      cuisine_type: place.cuisineType ?? "",
      food_type: list(place.foodType),
      price_range: place.priceRange ?? "",
      tags: list(place.tags),
      source_url: place.recommendations[0]?.sourceUrl ?? "",
      evidence_snippet: place.evidence[0]?.evidenceText ?? "",
      confidence_score: place.confidenceScore,
      needs_review: place.needsReview,
      reviewer_notes: "",
      approved: "",
      corrected_name: "",
      corrected_address: "",
      corrected_city: "",
      corrected_neighborhood: "",
      corrected_price_range: "",
      corrected_tags: "",
    })),
  );

  const duplicateCsv = Papa.unparse(
    duplicateCandidates.map((candidate) => ({
      place_id_1: candidate.placeId1,
      place_1_name: candidate.place1.name,
      place_id_2: candidate.placeId2,
      place_2_name: candidate.place2.name,
      match_reason: candidate.matchReason,
      similarity_score: candidate.similarityScore,
      status: candidate.status,
      reviewer_notes: "",
      approved_merge: "",
      keeper_place_id: candidate.placeId1,
    })),
  );

  await writeFile(`${REVIEW_DIR}/places_review.csv`, `${placeCsv}\n`, "utf8");
  await writeFile(
    `${REVIEW_DIR}/duplicate_candidates.csv`,
    `${duplicateCsv}\n`,
    "utf8",
  );

  console.log(
    `Exported ${places.length} review rows and ${duplicateCandidates.length} duplicate candidates.`,
  );
}

main()
  .catch(async (error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
