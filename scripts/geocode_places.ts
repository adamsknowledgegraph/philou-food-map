import { join } from "node:path";
import { prisma } from "../src/lib/prisma";
import {
  CACHE_DIR,
  arrondissementFromText,
  ensureProjectDirs,
  readJson,
  sleep,
  writeJson,
} from "./lib/utils";

type GeocodeCache = Record<
  string,
  {
    latitude: number;
    longitude: number;
    displayName: string;
    cachedAt: string;
  }
>;

type GeocodeFailureLog = Record<
  string,
  {
    reason: string;
    lastTriedAt: string;
  }
>;

const cachePath = join(CACHE_DIR, "geocode_cache.json");
const failurePath = join(CACHE_DIR, "geocode_failures.json");

async function geocode(address: string) {
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", address);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", "1");

  const response = await fetch(url, {
    headers: {
      "user-agent":
        "Mozilla/5.0 (compatible; PhilippineDarblayFoodMap/1.0; contact local-only)",
      "accept-language": "fr-FR,fr;q=0.9,en;q=0.8",
    },
  });

  if (!response.ok) {
    throw new Error(`Nominatim request failed with ${response.status}`);
  }

  return (await response.json()) as Array<{
    lat: string;
    lon: string;
    display_name: string;
  }>;
}

async function main() {
  await ensureProjectDirs();

  const cache = await readJson<GeocodeCache>(cachePath, {});
  const failures: GeocodeFailureLog = {};
  const places = await prisma.place.findMany({
    where: {
      latitude: null,
      longitude: null,
      address: {
        not: null,
      },
      status: {
        not: "merged",
      },
    },
  });

  let updated = 0;

  for (const place of places) {
    const address = place.address?.trim();

    if (!address || !/\d/.test(address) || !arrondissementFromText(address)) {
      failures[place.id] = {
        reason: "Address too ambiguous for automatic geocoding.",
        lastTriedAt: new Date().toISOString(),
      };
      continue;
    }

    const cached = cache[address];
    if (cached) {
      await prisma.place.update({
        where: { id: place.id },
        data: {
          latitude: cached.latitude,
          longitude: cached.longitude,
        },
      });
      updated += 1;
      continue;
    }

    const results = await geocode(address);
    await sleep(1100);

    if (results.length < 1 || !results[0].display_name.includes("Paris")) {
      failures[place.id] = {
        reason: `Ambiguous geocoding result count: ${results.length}`,
        lastTriedAt: new Date().toISOString(),
      };
      continue;
    }

    const [result] = results;
    cache[address] = {
      latitude: Number(result.lat),
      longitude: Number(result.lon),
      displayName: result.display_name,
      cachedAt: new Date().toISOString(),
    };

    await prisma.place.update({
      where: { id: place.id },
      data: {
        latitude: Number(result.lat),
        longitude: Number(result.lon),
      },
    });
    updated += 1;
  }

  await writeJson(cachePath, cache);
  await writeJson(failurePath, failures);
  console.log(`Updated coordinates for ${updated} places.`);
}

main()
  .catch(async (error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
