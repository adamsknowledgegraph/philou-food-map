"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

function parseOptionalDate(value: FormDataEntryValue | null) {
  const raw = String(value || "").trim();
  return raw ? new Date(raw) : null;
}

function parseOptionalInt(value: FormDataEntryValue | null) {
  const raw = String(value || "").trim();
  if (!raw) {
    return null;
  }

  const parsed = Number.parseInt(raw, 10);
  return Number.isNaN(parsed) ? null : parsed;
}

export async function updatePersonalPlaceStateAction(formData: FormData) {
  const placeId = String(formData.get("placeId") || "");

  if (!placeId) {
    return;
  }

  const place = await prisma.place.findUnique({
    where: { id: placeId },
  });

  if (!place) {
    return;
  }

  const isFavorite = formData.get("isFavorite") === "on";
  const visited = formData.get("visited") === "on";
  const visitDate = visited ? parseOptionalDate(formData.get("visitDate")) : null;
  const personalRating = visited ? parseOptionalInt(formData.get("personalRating")) : null;
  const notes = String(formData.get("notes") || "").trim() || null;

  await prisma.personalPlaceState.upsert({
    where: {
      placeId,
    },
    update: {
      isFavorite,
      visited,
      visitDate,
      personalRating,
      notes,
    },
    create: {
      placeId,
      isFavorite,
      visited,
      visitDate,
      personalRating,
      notes,
    },
  });

  revalidatePath(`/places/${placeId}`);
  revalidatePath("/places");
  revalidatePath("/map");
  revalidatePath("/");
}
