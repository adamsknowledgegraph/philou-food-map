import "dotenv/config";
import { mkdir, writeFile } from "node:fs/promises";
import {
  type HandyMapPlace,
  getHandyMapCards,
  getHandyMapFilename,
  getHandyMapPlaces,
} from "../src/lib/handy-maps";
import { getPlaceCollection } from "../src/lib/places";
import { prisma } from "../src/lib/prisma";

function parseStringList(value: string | null | undefined) {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed)
      ? parsed.map((entry) => String(entry)).filter(Boolean)
      : [];
  } catch {
    return value
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean);
  }
}

function csvEscape(value: string | number | null | undefined) {
  const stringValue = value == null ? "" : String(value);
  if (/[",\n]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, "\"\"")}"`;
  }
  return stringValue;
}

function buildDescription(place: {
  cuisineType: string | null;
  arrondissement: string | null;
  neighborhood: string | null;
  priceRange: string | null;
  googlePrimaryTypeLabel: string | null;
  googleRating: number | null;
  googleUserRatingCount: number | null;
  googleEditorialSummary: string | null;
  philouSummary: string | null;
  googleMapsUrl: string | null;
  websiteUrl: string | null;
  bookingUrl: string | null;
  tags: string | null;
  foodType: string | null;
}) {
  const tags = parseStringList(place.tags).filter(
    (tag) => !["mapstr", "public-map", "To try"].includes(tag),
  );
  const foodTypes = parseStringList(place.foodType);
  const lines = [
    place.googlePrimaryTypeLabel ? `Type: ${place.googlePrimaryTypeLabel}` : null,
    place.cuisineType ? `Cuisine: ${place.cuisineType}` : null,
    place.arrondissement ? `Arrondissement: ${place.arrondissement}` : null,
    place.neighborhood ? `Neighborhood: ${place.neighborhood}` : null,
    place.priceRange ? `Price: ${place.priceRange}` : null,
    typeof place.googleRating === "number"
      ? `Google: ${place.googleRating.toFixed(1)} (${(place.googleUserRatingCount ?? 0).toLocaleString("en-GB")} reviews)`
      : null,
    foodTypes.length ? `Food types: ${foodTypes.join(", ")}` : null,
    tags.length ? `Tags: ${tags.join(", ")}` : null,
    place.philouSummary ? `Philou note: ${place.philouSummary}` : null,
    place.googleEditorialSummary ? `Google summary: ${place.googleEditorialSummary}` : null,
    place.googleMapsUrl ? `Google Maps: ${place.googleMapsUrl}` : null,
    place.websiteUrl ? `Website: ${place.websiteUrl}` : null,
    place.bookingUrl ? `Booking: ${place.bookingUrl}` : null,
  ].filter(Boolean);

  return lines.join("\n");
}

function toCsv(rows: Record<string, string | number | null | undefined>[]) {
  if (rows.length === 0) {
    return "";
  }

  const headers = Object.keys(rows[0]);
  const lines = [
    headers.join(","),
    ...rows.map((row) => headers.map((header) => csvEscape(row[header])).join(",")),
  ];

  return `${lines.join("\n")}\n`;
}

function toKmlPlacemark(place: {
  name: string;
  description: string;
  longitude: number;
  latitude: number;
}) {
  const escapeXml = (value: string) =>
    value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");

  return `    <Placemark>
      <name>${escapeXml(place.name)}</name>
      <description>${escapeXml(place.description)}</description>
      <Point>
        <coordinates>${place.longitude},${place.latitude},0</coordinates>
      </Point>
    </Placemark>`;
}

async function main() {
  await mkdir("data/export", { recursive: true });
  await mkdir("public/exports", { recursive: true });

  const places = await prisma.place.findMany({
    where: {
      address: {
        not: null,
      },
      status: {
        not: "merged",
      },
    },
    orderBy: [
      {
        city: "asc",
      },
      {
        name: "asc",
      },
    ],
  });

  const normalizedPlaces: HandyMapPlace[] = places.map((place) => ({
    id: place.id,
    name: place.name,
    address: place.address,
    city: place.city,
    arrondissement: place.arrondissement,
    neighborhood: place.neighborhood,
    cuisineType: place.cuisineType,
    foodTypes: parseStringList(place.foodType),
    priceRange: place.priceRange,
    tags: parseStringList(place.tags).filter(
      (tag) => !["mapstr", "public-map", "To try"].includes(tag),
    ),
    collection: getPlaceCollection(place),
    googleMapsUrl: place.googleMapsUrl,
    googleRating: place.googleRating,
    googleUserRatingCount: place.googleUserRatingCount,
    googleEditorialSummary: place.googleEditorialSummary,
    googlePrimaryTypeLabel: place.googlePrimaryTypeLabel,
    latitude: place.latitude,
    longitude: place.longitude,
    philouSummary: place.philouSummary,
    websiteUrl: place.websiteUrl,
    bookingUrl: place.bookingUrl,
  }));

  const exportRows = places.map((place) => ({
    name: place.name,
    address: place.address,
    city: place.city,
    arrondissement: place.arrondissement,
    neighborhood: place.neighborhood,
    category: parseStringList(place.foodType).join(", "),
    cuisine: place.cuisineType,
    price_range: place.priceRange,
    rating: place.googleRating,
    review_count: place.googleUserRatingCount,
    latitude: place.latitude,
    longitude: place.longitude,
    google_maps_url: place.googleMapsUrl,
    website_url: place.websiteUrl,
    booking_url: place.bookingUrl,
    description: buildDescription(place),
  }));

  const parisRows = exportRows.filter((row) => row.city === "Paris");
  const fullChunks = [exportRows.slice(0, 2000), exportRows.slice(2000)];

  const writeExport = async (filename: string, contents: string) => {
    await writeFile(`data/export/${filename}`, contents, "utf8");
    await writeFile(`public/exports/${filename}`, contents, "utf8");
  };

  await writeExport("philou-paris-google-mymaps.csv", toCsv(parisRows));

  for (const [index, chunk] of fullChunks.entries()) {
    if (chunk.length === 0) {
      continue;
    }

    await writeExport(`philou-all-google-mymaps-part-${index + 1}.csv`, toCsv(chunk));
  }

  const parisKmlPlacemarks = places
    .filter(
      (place) =>
        place.city === "Paris" &&
        typeof place.latitude === "number" &&
        typeof place.longitude === "number",
    )
    .map((place) =>
      toKmlPlacemark({
        name: place.name,
        description: buildDescription(place),
        latitude: place.latitude as number,
        longitude: place.longitude as number,
      }),
    )
    .join("\n");

  const parisKml = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>Philou Paris Food Map</name>
    <description>Philou's Paris food addresses exported from the app</description>
${parisKmlPlacemarks}
  </Document>
</kml>
`;

  await writeExport("philou-paris-google-mymaps.kml", parisKml);

  const handyMaps = getHandyMapCards(normalizedPlaces);

  for (const handyMap of handyMaps) {
    const handyMapPlaces = getHandyMapPlaces(normalizedPlaces, handyMap.slug);
    const handyMapRows = handyMapPlaces.map((place) => ({
      name: place.name,
      address: place.address,
      city: place.city,
      arrondissement: place.arrondissement,
      neighborhood: place.neighborhood,
      category: place.foodTypes.join(", "),
      cuisine: place.cuisineType,
      price_range: place.priceRange,
      rating: place.googleRating,
      review_count: place.googleUserRatingCount,
      latitude: place.latitude,
      longitude: place.longitude,
      google_maps_url: place.googleMapsUrl,
      website_url: place.websiteUrl,
      booking_url: place.bookingUrl,
      description: buildDescription({
        cuisineType: place.cuisineType,
        arrondissement: place.arrondissement,
        neighborhood: place.neighborhood,
        priceRange: place.priceRange,
        googlePrimaryTypeLabel: place.googlePrimaryTypeLabel,
        googleRating: place.googleRating,
        googleUserRatingCount: place.googleUserRatingCount,
        googleEditorialSummary: place.googleEditorialSummary,
        philouSummary: place.philouSummary,
        googleMapsUrl: place.googleMapsUrl,
        websiteUrl: place.websiteUrl ?? null,
        bookingUrl: place.bookingUrl ?? null,
        tags: JSON.stringify(place.tags),
        foodType: JSON.stringify(place.foodTypes),
      }),
    }));

    await writeExport(getHandyMapFilename(handyMap.slug, "csv"), toCsv(handyMapRows));

    const kmlPlacemarks = handyMapPlaces
      .filter(
        (place) =>
          typeof place.latitude === "number" && typeof place.longitude === "number",
      )
      .map((place) =>
        toKmlPlacemark({
          name: place.name,
          description: buildDescription({
            cuisineType: place.cuisineType,
            arrondissement: place.arrondissement,
            neighborhood: place.neighborhood,
            priceRange: place.priceRange,
            googlePrimaryTypeLabel: place.googlePrimaryTypeLabel,
            googleRating: place.googleRating,
            googleUserRatingCount: place.googleUserRatingCount,
            googleEditorialSummary: place.googleEditorialSummary,
            philouSummary: place.philouSummary,
            googleMapsUrl: place.googleMapsUrl,
            websiteUrl: place.websiteUrl ?? null,
            bookingUrl: place.bookingUrl ?? null,
            tags: JSON.stringify(place.tags),
            foodType: JSON.stringify(place.foodTypes),
          }),
          latitude: place.latitude as number,
          longitude: place.longitude as number,
        }),
      )
      .join("\n");

    const kml = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>${handyMap.title}</name>
    <description>${handyMap.description}</description>
${kmlPlacemarks}
  </Document>
</kml>
`;

    await writeExport(getHandyMapFilename(handyMap.slug, "kml"), kml);
  }

  const summary = {
    totalPlaces: exportRows.length,
    parisPlaces: parisRows.length,
    handyMaps: handyMaps.map((map) => ({
      slug: map.slug,
      title: map.title,
      count: map.count,
      csvFile: getHandyMapFilename(map.slug, "csv"),
      kmlFile: getHandyMapFilename(map.slug, "kml"),
    })),
    allParts: fullChunks.filter((chunk) => chunk.length > 0).map((chunk, index) => ({
      file: `philou-all-google-mymaps-part-${index + 1}.csv`,
      rows: chunk.length,
    })),
  };

  await writeExport("philou-google-mymaps-summary.json", JSON.stringify(summary, null, 2));

  console.log("Google My Maps exports created:");
  console.log("- data/export/philou-paris-google-mymaps.csv");
  console.log("- data/export/philou-paris-google-mymaps.kml");
  for (const map of handyMaps) {
    console.log(`- data/export/${getHandyMapFilename(map.slug, "csv")} (${map.count} rows)`);
    console.log(`- data/export/${getHandyMapFilename(map.slug, "kml")}`);
  }
  for (const part of summary.allParts) {
    console.log(`- data/export/${part.file} (${part.rows} rows)`);
  }
}

main()
  .catch(async (error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
