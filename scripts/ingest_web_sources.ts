import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { SOURCE_CATALOG } from "./lib/catalog";
import { fetchAllMapstrPlaces, fetchMapstrMapInfo } from "./lib/mapstr";
import { RAW_WEB_DIR, ensureProjectDirs, writeJson } from "./lib/utils";
import { prisma } from "../src/lib/prisma";

async function fetchHtml(url: string) {
  const response = await fetch(url, {
    headers: {
      "user-agent":
        "Mozilla/5.0 (compatible; PhilippineDarblayFoodMap/1.0; +https://example.local)",
      "accept-language": "fr-FR,fr;q=0.9,en;q=0.8",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }

  return response.text();
}

async function main() {
  await ensureProjectDirs();

  const manifest = [];

  for (const source of SOURCE_CATALOG) {
    const html = await fetchHtml(source.url);
    const htmlPath = join(RAW_WEB_DIR, `${source.slug}.html`);
    const metaPath = join(RAW_WEB_DIR, `${source.slug}.json`);
    const sourceMeta: Record<string, unknown> = {
      slug: source.slug,
      url: source.url,
      platform: source.platform,
      title: source.title,
      fetchedAt: new Date().toISOString(),
      htmlPath,
    };

    await writeFile(htmlPath, html, "utf8");

    if (source.extraction?.mode === "mapstr") {
      const mapIdMatch = html.match(/https:\/\/web\.mapstr\.com\/\?mapId=([^"'&]+)/);
      const mapId = mapIdMatch?.[1];

      if (!mapId) {
        throw new Error(`Could not find embedded Mapstr mapId for ${source.url}`);
      }

      const [mapInfo, places] = await Promise.all([
        fetchMapstrMapInfo(mapId),
        fetchAllMapstrPlaces(mapId),
      ]);
      const placesPath = join(RAW_WEB_DIR, `${source.slug}.places.json`);

      await writeJson(placesPath, {
        mapId,
        fetchedAt: new Date().toISOString(),
        mapInfo,
        places,
      });

      sourceMeta.mapId = mapId;
      sourceMeta.mapInfo = {
        placesCount: mapInfo.placesCount,
        followersCount: mapInfo.followersCount,
      };
      sourceMeta.placesPath = placesPath;
      sourceMeta.fullPlacesCount = places.length;
    }

    await writeJson(metaPath, sourceMeta);

    await prisma.source.upsert({
      where: {
        url: source.url,
      },
      update: {
        platform: source.platform,
        title: source.title,
        rawText: html,
        rawJsonPath: metaPath,
        processedStatus: "ingested",
      },
      create: {
        platform: source.platform,
        url: source.url,
        title: source.title,
        rawText: html,
        rawJsonPath: metaPath,
        processedStatus: "ingested",
      },
    });

    manifest.push({
      slug: source.slug,
      url: source.url,
      htmlPath,
      metaPath,
    });
  }

  await writeJson(join(RAW_WEB_DIR, "manifest.json"), manifest);
  console.log(`Ingested ${manifest.length} public source pages.`);
}

main()
  .catch(async (error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
