import { prisma } from "../src/lib/prisma";
import { normalizeText } from "./lib/utils";

function bigrams(value: string) {
  const normalized = normalizeText(value).replace(/\s+/g, "");
  const grams = new Set<string>();

  for (let index = 0; index < normalized.length - 1; index += 1) {
    grams.add(normalized.slice(index, index + 2));
  }

  return grams;
}

function similarity(left: string, right: string) {
  const leftBigrams = bigrams(left);
  const rightBigrams = bigrams(right);

  if (leftBigrams.size === 0 || rightBigrams.size === 0) {
    return 0;
  }

  let overlap = 0;
  for (const gram of leftBigrams) {
    if (rightBigrams.has(gram)) {
      overlap += 1;
    }
  }

  return (2 * overlap) / (leftBigrams.size + rightBigrams.size);
}

async function main() {
  const places = await prisma.place.findMany({
    where: {
      status: {
        not: "merged",
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  await prisma.duplicateCandidate.deleteMany();

  let candidateCount = 0;

  for (let leftIndex = 0; leftIndex < places.length; leftIndex += 1) {
    const left = places[leftIndex];

    for (let rightIndex = leftIndex + 1; rightIndex < places.length; rightIndex += 1) {
      const right = places[rightIndex];
      const sameAddress =
        left.normalizedAddress &&
        right.normalizedAddress &&
        left.normalizedAddress === right.normalizedAddress;
      const sameName = left.normalizedName === right.normalizedName;
      const nameSimilarity = similarity(left.name, right.name);
      const addressSimilarity = similarity(left.address ?? "", right.address ?? "");

      let shouldCreate = false;
      let reason = "";
      let score = 0;

      if (sameAddress && sameName) {
        shouldCreate = true;
        reason = "Exact normalized name and address match.";
        score = 0.99;
      } else if (sameName && left.city === right.city) {
        shouldCreate = true;
        reason = "Same normalized name in the same city.";
        score = 0.93;
      } else if (nameSimilarity >= 0.9 && addressSimilarity >= 0.75) {
        shouldCreate = true;
        reason = "Very similar name and address text.";
        score = Number(((nameSimilarity + addressSimilarity) / 2).toFixed(2));
      }

      if (!shouldCreate) {
        continue;
      }

      await prisma.duplicateCandidate.create({
        data: {
          placeId1: left.id,
          placeId2: right.id,
          matchReason: reason,
          similarityScore: score,
          status: "pending",
        },
      });
      candidateCount += 1;
    }
  }

  console.log(`Created ${candidateCount} duplicate candidates.`);
}

main()
  .catch(async (error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
