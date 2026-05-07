import "dotenv/config";
import * as cheerio from "cheerio";
import { prisma } from "@/lib/prisma";

function normalizeUrl(input: string) {
  try {
    return new URL(input);
  } catch {
    return null;
  }
}

async function getWebsiteImage(websiteUrl: string) {
  const parsedUrl = normalizeUrl(websiteUrl);
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

async function main() {
  const limitArg = process.argv.find((argument) => argument.startsWith("--limit="));
  const limit = limitArg ? Number(limitArg.split("=")[1]) : 250;

  const places = await prisma.place.findMany({
    where: {
      city: "Paris",
      googlePhotoName: null,
      googlePhotoUrl: null,
      websiteUrl: {
        not: null,
      },
    },
    select: {
      id: true,
      name: true,
      websiteUrl: true,
    },
    take: limit,
  });

  let updated = 0;

  for (const place of places) {
    const websiteUrl = place.websiteUrl?.trim();
    if (!websiteUrl) {
      continue;
    }

    const imageUrl = await getWebsiteImage(websiteUrl);
    if (!imageUrl) {
      continue;
    }

    await prisma.place.update({
      where: {
        id: place.id,
      },
      data: {
        googlePhotoUrl: imageUrl,
      },
    });

    updated += 1;
    console.log(`Updated ${place.name}`);
  }

  console.log(`Website image enrichment complete. Updated ${updated} places.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
