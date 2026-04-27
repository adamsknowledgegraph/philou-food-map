import { readFile } from "node:fs/promises";
import Papa from "papaparse";
import { prisma } from "../src/lib/prisma";
import { REVIEW_DIR } from "./lib/utils";

function truthy(value: string | undefined) {
  return ["1", "true", "yes", "y"].includes((value ?? "").trim().toLowerCase());
}

async function main() {
  const reviewCsv = await readFile(`${REVIEW_DIR}/places_review.csv`, "utf8");
  const duplicateCsv = await readFile(`${REVIEW_DIR}/duplicate_candidates.csv`, "utf8");

  const placeRows = Papa.parse<Record<string, string>>(reviewCsv, {
    header: true,
    skipEmptyLines: true,
  }).data;
  const duplicateRows = Papa.parse<Record<string, string>>(duplicateCsv, {
    header: true,
    skipEmptyLines: true,
  }).data;

  for (const row of placeRows) {
    if (!row.place_id || !row.approved) {
      continue;
    }

    const approved = truthy(row.approved);
    await prisma.place.update({
      where: {
        id: row.place_id,
      },
      data: {
        name: row.corrected_name || row.name,
        address: row.corrected_address || row.address || null,
        city: row.corrected_city || row.city || null,
        neighborhood: row.corrected_neighborhood || row.neighborhood || null,
        priceRange: row.corrected_price_range || row.price_range || null,
        tags:
          row.corrected_tags && row.corrected_tags.trim()
            ? JSON.stringify(
                row.corrected_tags
                  .split(",")
                  .map((value) => value.trim())
                  .filter(Boolean),
              )
            : undefined,
        needsReview: !approved,
        status: approved ? "approved" : "rejected",
      },
    });

    await prisma.reviewLog.create({
      data: {
        entityType: "place",
        entityId: row.place_id,
        oldValue: null,
        newValue: JSON.stringify(row),
        reason: row.reviewer_notes || "Imported from places_review.csv",
      },
    });
  }

  for (const row of duplicateRows) {
    if (!row.place_id_1 || !row.place_id_2 || !row.approved_merge) {
      continue;
    }

    const approvedMerge = truthy(row.approved_merge);
    const candidate = await prisma.duplicateCandidate.findFirst({
      where: {
        placeId1: row.place_id_1,
        placeId2: row.place_id_2,
      },
    });

    if (!candidate) {
      continue;
    }

    await prisma.duplicateCandidate.update({
      where: {
        id: candidate.id,
      },
      data: {
        status: approvedMerge ? "merged" : "ignored",
      },
    });

    await prisma.reviewLog.create({
      data: {
        entityType: "duplicate_candidate",
        entityId: candidate.id,
        oldValue: null,
        newValue: JSON.stringify(row),
        reason: row.reviewer_notes || "Imported from duplicate_candidates.csv",
      },
    });
  }

  console.log("Imported manual review decisions from CSV files.");
}

main()
  .catch(async (error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
