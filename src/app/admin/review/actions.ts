"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { parseStringList, serializeList } from "@/lib/places";

function csvToList(value: FormDataEntryValue | null) {
  if (!value) {
    return [];
  }

  return String(value)
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}

export async function updatePlaceReviewAction(formData: FormData) {
  const placeId = String(formData.get("placeId"));
  const intent = String(formData.get("intent"));
  const place = await prisma.place.findUnique({ where: { id: placeId } });

  if (!place) {
    return;
  }

  const data = {
    name: String(formData.get("name") || place.name),
    address: String(formData.get("address") || place.address || "") || null,
    city: String(formData.get("city") || place.city || "") || null,
    neighborhood:
      String(formData.get("neighborhood") || place.neighborhood || "") || null,
    priceRange: String(formData.get("priceRange") || place.priceRange || "") || null,
    tags: serializeList(csvToList(formData.get("tags"))),
    needsReview: place.needsReview,
    status: place.status,
  };

  if (intent === "approve") {
    data.needsReview = false;
    data.status = "approved";
  } else if (intent === "reject") {
    data.needsReview = false;
    data.status = "rejected";
  } else if (intent === "close") {
    data.needsReview = false;
    data.status = "closed";
  } else {
    data.needsReview = true;
    data.status = "needs_review";
  }

  await prisma.$transaction([
    prisma.place.update({
      where: { id: placeId },
      data,
    }),
    prisma.reviewLog.create({
      data: {
        entityType: "place",
        entityId: placeId,
        oldValue: JSON.stringify({
          name: place.name,
          address: place.address,
          city: place.city,
          neighborhood: place.neighborhood,
          priceRange: place.priceRange,
          tags: parseStringList(place.tags),
          status: place.status,
          needsReview: place.needsReview,
        }),
        newValue: JSON.stringify({
          ...data,
          tags: parseStringList(data.tags),
        }),
        reason: String(formData.get("reviewerNotes") || intent),
      },
    }),
  ]);

  revalidatePath("/admin/review");
  revalidatePath("/places");
  revalidatePath("/map");
}

export async function updateDuplicateCandidateAction(formData: FormData) {
  const candidateId = String(formData.get("candidateId"));
  const intent = String(formData.get("intent"));
  const candidate = await prisma.duplicateCandidate.findUnique({
    where: { id: candidateId },
  });

  if (!candidate) {
    return;
  }

  if (intent === "ignore") {
    await prisma.duplicateCandidate.update({
      where: { id: candidateId },
      data: { status: "ignored" },
    });
  } else if (intent === "merge") {
    const keeperId = String(formData.get("keeperId") || candidate.placeId1);
    const archivedId =
      keeperId === candidate.placeId1 ? candidate.placeId2 : candidate.placeId1;

    await prisma.$transaction([
      prisma.recommendation.updateMany({
        where: { placeId: archivedId },
        data: { placeId: keeperId },
      }),
      prisma.evidence.updateMany({
        where: { placeId: archivedId },
        data: { placeId: keeperId },
      }),
      prisma.place.update({
        where: { id: archivedId },
        data: { status: "merged", needsReview: false },
      }),
      prisma.duplicateCandidate.update({
        where: { id: candidateId },
        data: { status: "merged" },
      }),
      prisma.reviewLog.create({
        data: {
          entityType: "duplicate_candidate",
          entityId: candidateId,
          oldValue: JSON.stringify(candidate),
          newValue: JSON.stringify({ status: "merged", keeperId, archivedId }),
          reason: "Merged duplicate places from admin review",
        },
      }),
    ]);
  }

  revalidatePath("/admin/review");
  revalidatePath("/places");
  revalidatePath("/map");
}
