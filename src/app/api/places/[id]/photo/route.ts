import "dotenv/config";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

type RouteProps = {
  params: Promise<{ id: string }>;
};

type GooglePhotoMedia = {
  photoUri?: string;
};

export async function GET(_: Request, { params }: RouteProps) {
  const { id } = await params;
  const place = await prisma.place.findUnique({
    where: { id },
    select: {
      googlePhotoName: true,
      googlePhotoUrl: true,
    },
  });

  if (!place) {
    return NextResponse.json({ error: "Place not found." }, { status: 404 });
  }

  if (place.googlePhotoName && GOOGLE_MAPS_API_KEY) {
    const response = await fetch(
      `https://places.googleapis.com/v1/${place.googlePhotoName}/media?maxWidthPx=1200&skipHttpRedirect=true`,
      {
        headers: {
          "X-Goog-Api-Key": GOOGLE_MAPS_API_KEY,
          "X-Goog-FieldMask": "name,photoUri",
        },
        cache: "no-store",
      },
    );

    if (response.ok) {
      const payload = (await response.json()) as GooglePhotoMedia;

      if (payload.photoUri) {
        return NextResponse.redirect(payload.photoUri);
      }
    }
  }

  if (place.googlePhotoUrl) {
    return NextResponse.redirect(place.googlePhotoUrl);
  }

  return NextResponse.json({ error: "Photo not available." }, { status: 404 });
}
