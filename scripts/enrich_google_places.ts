import "dotenv/config";
import { prisma } from "../src/lib/prisma";
import { normalizeText, sleep } from "./lib/utils";

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;
const SEARCH_URL = "https://places.googleapis.com/v1/places:searchText";
const DETAILS_BASE_URL = "https://places.googleapis.com/v1/places";

type GoogleSearchPlace = {
  id: string;
  displayName?: {
    text?: string;
  };
  formattedAddress?: string;
  location?: {
    latitude?: number;
    longitude?: number;
  };
};

type GoogleReviewPayload = {
  name: string;
  relativePublishTimeDescription?: string;
  text?: {
    text?: string;
    languageCode?: string;
  };
  originalText?: {
    text?: string;
    languageCode?: string;
  };
  rating?: number;
  authorAttribution?: {
    displayName?: string;
    uri?: string;
    photoUri?: string;
  };
  publishTime?: string;
  flagContentUri?: string;
  googleMapsUri?: string;
};

type GooglePhotoPayload = {
  name?: string;
};

type GooglePlaceDetails = {
  id: string;
  displayName?: {
    text?: string;
  };
  primaryType?: string;
  primaryTypeDisplayName?: {
    text?: string;
  };
  formattedAddress?: string;
  googleMapsUri?: string;
  websiteUri?: string;
  rating?: number;
  userRatingCount?: number;
  priceLevel?: string;
  businessStatus?: string;
  nationalPhoneNumber?: string;
  internationalPhoneNumber?: string;
  editorialSummary?: {
    text?: string;
  };
  neighborhoodSummary?: {
    text?: string;
  };
  currentOpeningHours?: {
    openNow?: boolean;
    weekdayDescriptions?: string[];
  };
  regularOpeningHours?: {
    weekdayDescriptions?: string[];
  };
  reservable?: boolean;
  outdoorSeating?: boolean;
  delivery?: boolean;
  takeout?: boolean;
  dineIn?: boolean;
  goodForGroups?: boolean;
  servesBreakfast?: boolean;
  servesBrunch?: boolean;
  servesLunch?: boolean;
  servesDinner?: boolean;
  servesDessert?: boolean;
  servesCoffee?: boolean;
  servesWine?: boolean;
  servesCocktails?: boolean;
  servesVegetarianFood?: boolean;
  photos?: GooglePhotoPayload[];
  reviews?: GoogleReviewPayload[];
};

type GooglePhotoMedia = {
  name?: string;
  photoUri?: string;
};

type EnrichOptions = {
  city: string | null;
  venueOnly: boolean;
  missingOnly: boolean;
  force: boolean;
  limit: number | null;
};

function parseArgs(argv: string[]): EnrichOptions {
  const options: EnrichOptions = {
    city: "Paris",
    venueOnly: true,
    missingOnly: true,
    force: false,
    limit: null,
  };

  for (const arg of argv) {
    if (arg.startsWith("--city=")) {
      options.city = arg.slice("--city=".length) || null;
      continue;
    }

    if (arg === "--all-cities") {
      options.city = null;
      continue;
    }

    if (arg === "--all-types") {
      options.venueOnly = false;
      continue;
    }

    if (arg === "--include-synced") {
      options.missingOnly = false;
      continue;
    }

    if (arg === "--force") {
      options.force = true;
      options.missingOnly = false;
      continue;
    }

    if (arg.startsWith("--limit=")) {
      const parsed = Number(arg.slice("--limit=".length));
      options.limit = Number.isFinite(parsed) && parsed > 0 ? parsed : null;
    }
  }

  return options;
}

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

function isVenueLike(place: {
  foodType: string | null;
  tags: string | null;
}) {
  const values = [
    ...parseStringList(place.foodType),
    ...parseStringList(place.tags),
  ].map((value) => normalizeText(value));

  const venueSignals = [
    "restaurant",
    "cafe",
    "bakery",
    "bar",
    "wine bar",
    "cocktail",
    "brunch",
    "pastry",
    "pastry shop",
    "street food",
    "bistrot",
    "hotel",
    "lodging",
    "healthy",
    "japanese",
    "italian",
    "asian",
  ].map((value) => normalizeText(value));

  return venueSignals.some((signal) => values.includes(signal));
}

function needsGoogleEnrichment(place: {
  googleRating: number | null;
  googlePhotoName: string | null;
  googlePhotoUrl: string | null;
  googlePlaceId: string | null;
  googleEditorialSummary?: string | null;
  googleOpeningHoursText?: string | null;
}) {
  return !(
    place.googlePlaceId &&
    typeof place.googleRating === "number" &&
    (place.googlePhotoName || place.googlePhotoUrl) &&
    place.googleEditorialSummary &&
    place.googleOpeningHoursText &&
    place.googleOpeningHoursText !== "[]"
  );
}

function ensureApiKey() {
  if (!GOOGLE_MAPS_API_KEY) {
    throw new Error("Missing GOOGLE_MAPS_API_KEY in the environment.");
  }
}

async function googleFetch<T>(
  url: string,
  init: RequestInit & { fieldMask: string },
) {
  ensureApiKey();

  const response = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": GOOGLE_MAPS_API_KEY!,
      "X-Goog-FieldMask": init.fieldMask,
      ...(init.headers ?? {}),
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Google Places request failed (${response.status}): ${body}`);
  }

  return (await response.json()) as T;
}

function buildTextQuery(place: {
  name: string;
  address: string | null;
  city: string | null;
  country: string | null;
}) {
  return [place.name, place.address, place.city, place.country]
    .filter(Boolean)
    .join(", ");
}

function searchScore(
  place: {
    name: string;
    address: string | null;
    city: string | null;
  },
  candidate: GoogleSearchPlace,
) {
  let score = 0;
  const candidateName = normalizeText(candidate.displayName?.text);
  const candidateAddress = normalizeText(candidate.formattedAddress);
  const placeName = normalizeText(place.name);
  const placeAddress = normalizeText(place.address);
  const placeCity = normalizeText(place.city);

  if (candidateName === placeName) {
    score += 5;
  } else if (candidateName.includes(placeName) || placeName.includes(candidateName)) {
    score += 3;
  }

  if (placeAddress && candidateAddress.includes(placeAddress)) {
    score += 4;
  }

  if (placeCity && candidateAddress.includes(placeCity)) {
    score += 1;
  }

  return score;
}

async function searchGooglePlaceId(place: {
  name: string;
  address: string | null;
  city: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
}) {
  const body: Record<string, unknown> = {
    textQuery: buildTextQuery(place),
    pageSize: 5,
    languageCode: "fr",
  };

  if (typeof place.latitude === "number" && typeof place.longitude === "number") {
    body.locationBias = {
      circle: {
        center: {
          latitude: place.latitude,
          longitude: place.longitude,
        },
        radius: 500,
      },
    };
  }

  const payload = await googleFetch<{ places?: GoogleSearchPlace[] }>(SEARCH_URL, {
    method: "POST",
    body: JSON.stringify(body),
    fieldMask: "places.id,places.displayName,places.formattedAddress,places.location",
  });

  const candidates = payload.places ?? [];

  if (candidates.length === 0) {
    return null;
  }

  const ranked = [...candidates].sort(
    (left, right) => searchScore(place, right) - searchScore(place, left),
  );

  return ranked[0]?.id ?? null;
}

async function fetchGooglePlaceDetails(googlePlaceId: string) {
  return googleFetch<GooglePlaceDetails>(`${DETAILS_BASE_URL}/${googlePlaceId}`, {
    method: "GET",
    fieldMask:
      "id,displayName,primaryType,primaryTypeDisplayName,formattedAddress,googleMapsUri,websiteUri,rating,userRatingCount,priceLevel,businessStatus,nationalPhoneNumber,internationalPhoneNumber,editorialSummary,neighborhoodSummary,currentOpeningHours,regularOpeningHours,reservable,outdoorSeating,delivery,takeout,dineIn,goodForGroups,servesBreakfast,servesBrunch,servesLunch,servesDinner,servesDessert,servesCoffee,servesWine,servesCocktails,servesVegetarianFood,photos,reviews",
  });
}

async function fetchGooglePhotoMedia(photoName: string) {
  return googleFetch<GooglePhotoMedia>(`https://places.googleapis.com/v1/${photoName}/media?maxWidthPx=1200`, {
    method: "GET",
    fieldMask: "name,photoUri",
  });
}

function mapPriceLevel(priceLevel: string | undefined) {
  switch (priceLevel) {
    case "PRICE_LEVEL_FREE":
      return "Free";
    case "PRICE_LEVEL_INEXPENSIVE":
      return "€";
    case "PRICE_LEVEL_MODERATE":
      return "€€";
    case "PRICE_LEVEL_EXPENSIVE":
      return "€€€";
    case "PRICE_LEVEL_VERY_EXPENSIVE":
      return "€€€€";
    default:
      return null;
  }
}

function serializeList(values: string[] | undefined) {
  return JSON.stringify((values ?? []).filter(Boolean));
}

async function main() {
  ensureApiKey();
  const options = parseArgs(process.argv.slice(2));

  const candidates = await prisma.place.findMany({
    where: {
      status: {
        not: "merged",
      },
      address: {
        not: null,
      },
    },
    orderBy: {
      confidenceScore: "desc",
    },
  });

  const places = candidates
    .filter((place) => (options.city ? place.city === options.city : true))
    .filter((place) => (options.venueOnly ? isVenueLike(place) : true))
    .filter((place) =>
      options.force || !options.missingOnly ? true : needsGoogleEnrichment(place),
    )
    .slice(0, options.limit ?? undefined);

  let matched = 0;
  let updated = 0;
  let failed = 0;

  console.log(
    `Google enrichment starting for ${places.length} places` +
      `${options.city ? ` in ${options.city}` : ""}` +
      `${options.venueOnly ? " (venue-only)" : ""}` +
      `${options.missingOnly && !options.force ? " (missing-first)" : ""}.`,
  );

  for (const place of places) {
    try {
      const googlePlaceId =
        place.googlePlaceId ??
        (await searchGooglePlaceId({
          name: place.name,
          address: place.address,
          city: place.city,
          country: place.country,
          latitude: place.latitude,
          longitude: place.longitude,
        }));

      await sleep(150);

      if (!googlePlaceId) {
        continue;
      }

      matched += 1;
      const details = await fetchGooglePlaceDetails(googlePlaceId);
      await sleep(150);

      const firstPhotoName = details.photos?.[0]?.name ?? null;
      let firstPhotoUrl: string | null = null;

      if (firstPhotoName) {
        try {
          const photoMedia = await fetchGooglePhotoMedia(firstPhotoName);
          firstPhotoUrl = photoMedia.photoUri ?? null;
          await sleep(150);
        } catch (error) {
          console.warn(`Photo fetch failed for ${place.name}:`, error);
        }
      }

      const reviews = details.reviews ?? [];
      const openingHours =
        details.currentOpeningHours?.weekdayDescriptions ??
        details.regularOpeningHours?.weekdayDescriptions ??
        [];

      await prisma.$transaction([
        prisma.place.update({
          where: { id: place.id },
          data: {
            googlePlaceId,
            googlePhotoName: firstPhotoName,
            googlePhotoUrl: firstPhotoUrl,
            googleRating: details.rating ?? null,
            googleUserRatingCount: details.userRatingCount ?? null,
            googlePriceLevel: details.priceLevel ?? null,
            googlePrimaryType: details.primaryType ?? null,
            googlePrimaryTypeLabel: details.primaryTypeDisplayName?.text ?? null,
            googleBusinessStatus: details.businessStatus ?? null,
            googleNationalPhone: details.nationalPhoneNumber ?? null,
            googleInternationalPhone: details.internationalPhoneNumber ?? null,
            googleEditorialSummary: details.editorialSummary?.text ?? null,
            googleNeighborhoodSummary: details.neighborhoodSummary?.text ?? null,
            googleOpeningHoursText: serializeList(openingHours),
            googleOpenNow: details.currentOpeningHours?.openNow ?? null,
            googleReservable: details.reservable ?? null,
            googleOutdoorSeating: details.outdoorSeating ?? null,
            googleDelivery: details.delivery ?? null,
            googleTakeout: details.takeout ?? null,
            googleDineIn: details.dineIn ?? null,
            googleGoodForGroups: details.goodForGroups ?? null,
            googleServesBreakfast: details.servesBreakfast ?? null,
            googleServesBrunch: details.servesBrunch ?? null,
            googleServesLunch: details.servesLunch ?? null,
            googleServesDinner: details.servesDinner ?? null,
            googleServesDessert: details.servesDessert ?? null,
            googleServesCoffee: details.servesCoffee ?? null,
            googleServesWine: details.servesWine ?? null,
            googleServesCocktails: details.servesCocktails ?? null,
            googleServesVegetarian: details.servesVegetarianFood ?? null,
            googleReviewsUpdatedAt: new Date(),
            googleMapsUrl: details.googleMapsUri ?? place.googleMapsUrl,
            websiteUrl: place.websiteUrl ?? details.websiteUri ?? null,
            priceRange: place.priceRange ?? mapPriceLevel(details.priceLevel),
          },
        }),
        prisma.googleReview.deleteMany({
          where: {
            placeId: place.id,
            googleReviewId: {
              notIn: reviews.map((review) => review.name),
            },
          },
        }),
        ...reviews.map((review) =>
          prisma.googleReview.upsert({
            where: {
              googleReviewId: review.name,
            },
            update: {
              authorName: review.authorAttribution?.displayName ?? null,
              authorUri: review.authorAttribution?.uri ?? null,
              authorPhotoUri: review.authorAttribution?.photoUri ?? null,
              rating: Math.round(review.rating ?? 0),
              relativePublishTimeDescription:
                review.relativePublishTimeDescription ?? null,
              publishTime: review.publishTime ? new Date(review.publishTime) : null,
              text: review.text?.text ?? null,
              originalText: review.originalText?.text ?? null,
              languageCode:
                review.text?.languageCode ?? review.originalText?.languageCode ?? null,
              googleMapsUri: review.googleMapsUri ?? null,
              flagContentUri: review.flagContentUri ?? null,
              placeId: place.id,
            },
            create: {
              googleReviewId: review.name,
              placeId: place.id,
              authorName: review.authorAttribution?.displayName ?? null,
              authorUri: review.authorAttribution?.uri ?? null,
              authorPhotoUri: review.authorAttribution?.photoUri ?? null,
              rating: Math.round(review.rating ?? 0),
              relativePublishTimeDescription:
                review.relativePublishTimeDescription ?? null,
              publishTime: review.publishTime ? new Date(review.publishTime) : null,
              text: review.text?.text ?? null,
              originalText: review.originalText?.text ?? null,
              languageCode:
                review.text?.languageCode ?? review.originalText?.languageCode ?? null,
              googleMapsUri: review.googleMapsUri ?? null,
              flagContentUri: review.flagContentUri ?? null,
            },
          }),
        ),
      ]);

      updated += 1;
    } catch (error) {
      failed += 1;
      console.warn(`Google enrichment failed for ${place.name}:`, error);
    }
  }

  console.log(
    `Google Places matched ${matched} places, updated ${updated}, failed ${failed}.`,
  );
}

main()
  .catch(async (error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
