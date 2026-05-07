import "dotenv/config";
import { NextResponse } from "next/server";
import * as cheerio from "cheerio";
import { prisma } from "@/lib/prisma";

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

type RouteProps = {
  params: Promise<{ id: string }>;
};

type GooglePhotoMedia = {
  photoUri?: string;
};

function getWebsiteImageUrl(websiteUrl: string) {
  try {
    return new URL(websiteUrl);
  } catch {
    return null;
  }
}

async function fetchWebsiteImage(websiteUrl: string) {
  const parsedUrl = getWebsiteImageUrl(websiteUrl);
  if (!parsedUrl) {
    return null;
  }

  try {
    const response = await fetch(parsedUrl.toString(), {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; ParisFoodMapBot/1.0; +https://philou-food-map.vercel.app)",
      },
      redirect: "follow",
      cache: "force-cache",
      next: {
        revalidate: 60 * 60 * 24 * 7,
      },
    });

    if (!response.ok) {
      return null;
    }

    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("text/html")) {
      return null;
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    const imageCandidate =
      $('meta[property="og:image"]').attr("content") ||
      $('meta[name="twitter:image"]').attr("content") ||
      $('meta[property="og:image:url"]').attr("content");

    if (!imageCandidate) {
      return null;
    }

    return new URL(imageCandidate, parsedUrl).toString();
  } catch {
    return null;
  }
}

export async function GET(_: Request, { params }: RouteProps) {
  const { id } = await params;
  const place = await prisma.place.findUnique({
    where: { id },
    select: {
      googlePhotoName: true,
      googlePhotoUrl: true,
      websiteUrl: true,
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

  if (place.websiteUrl) {
    const websiteImage = await fetchWebsiteImage(place.websiteUrl);

    if (websiteImage) {
      return NextResponse.redirect(websiteImage);
    }
  }

  return NextResponse.json({ error: "Photo not available." }, { status: 404 });
}
