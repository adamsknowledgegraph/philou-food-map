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

type GooglePlaceDetails = {
  id: string;
  displayName?: {
    text?: string;
  };
  formattedAddress?: string;
  googleMapsUri?: string;
  websiteUri?: string;
  rating?: number;
  userRatingCount?: number;
  priceLevel?: string;
  reviews?: GoogleReviewPayload[];
};

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
      "id,displayName,formattedAddress,googleMapsUri,websiteUri,rating,userRatingCount,priceLevel,reviews",
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

async function main() {
  ensureApiKey();

  const places = await prisma.place.findMany({
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

  let matched = 0;
  let updated = 0;

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

      const reviews = details.reviews ?? [];

      await prisma.$transaction([
        prisma.place.update({
          where: { id: place.id },
          data: {
            googlePlaceId,
            googleRating: details.rating ?? null,
            googleUserRatingCount: details.userRatingCount ?? null,
            googlePriceLevel: details.priceLevel ?? null,
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
      console.warn(`Google enrichment failed for ${place.name}:`, error);
    }
  }

  console.log(`Google Places matched ${matched} places and updated ${updated}.`);
}

main()
  .catch(async (error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
