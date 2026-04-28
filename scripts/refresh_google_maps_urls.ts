import "dotenv/config";
import { prisma } from "../src/lib/prisma";
import { buildGoogleMapsUrl } from "./lib/utils";

async function main() {
  const places = await prisma.place.findMany({
    where: {
      status: {
        not: "merged",
      },
    },
    select: {
      id: true,
      name: true,
      city: true,
      country: true,
      googlePlaceId: true,
    },
  });

  let updated = 0;

  for (const place of places) {
    const query = [place.name, place.city, place.country].filter(Boolean).join(", ");

    if (!query) {
      continue;
    }

    await prisma.place.update({
      where: { id: place.id },
      data: {
        googleMapsUrl: buildGoogleMapsUrl({
          query,
          placeId: place.googlePlaceId,
        }),
      },
    });

    updated += 1;
  }

  console.log(`Refreshed Google Maps URLs for ${updated} places.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
