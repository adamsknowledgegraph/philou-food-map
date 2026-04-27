import { cache } from "react";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const placeInclude = {
  recommendations: {
    orderBy: {
      createdAt: "desc" as const,
    },
  },
  evidence: {
    orderBy: {
      createdAt: "desc" as const,
    },
  },
  googleReviews: {
    orderBy: [
      {
        rating: "desc" as const,
      },
      {
        publishTime: "desc" as const,
      },
    ],
  },
  personalState: true,
};

export type PlaceRecord = Prisma.PlaceGetPayload<{
  include: typeof placeInclude;
}>;

export type DuplicateCandidateRecord = Prisma.DuplicateCandidateGetPayload<{
  include: {
    place1: true;
    place2: true;
  };
}>;

export type PlaceFilters = {
  q: string;
  cuisine: string;
  foodType: string;
  priceRange: string;
  city: string;
  neighborhood: string;
  arrondissement: string;
  tag: string;
  source: string;
  confidence: string;
  reviewStatus: string;
  sort: string;
};

export type MapPlace = {
  id: string;
  name: string;
  address: string | null;
  latitude: number;
  longitude: number;
};

export type PlaceFacets = {
  cuisines: string[];
  foodTypes: string[];
  priceRanges: string[];
  cities: string[];
  neighborhoods: string[];
  arrondissements: string[];
  tags: string[];
  sources: string[];
};

export const DEFAULT_FILTERS: PlaceFilters = {
  q: "",
  cuisine: "",
  foodType: "",
  priceRange: "",
  city: "",
  neighborhood: "",
  arrondissement: "",
  tag: "",
  source: "",
  confidence: "",
  reviewStatus: "",
  sort: "recent",
};

export function normalizeText(value: string | null | undefined) {
  return (value ?? "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function parseStringList(value: string | null | undefined) {
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

export function serializeList(values: string[]) {
  return JSON.stringify(
    values
      .map((value) => value.trim())
      .filter(Boolean)
      .filter((value, index, array) => array.indexOf(value) === index),
  );
}

function uniqueSorted(values: string[]) {
  return [...new Set(values.filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, "fr"),
  );
}

function getConfidenceBucket(score: number) {
  if (score >= 0.8) {
    return "high";
  }

  if (score >= 0.6) {
    return "medium";
  }

  return "low";
}

function priceSortValue(place: PlaceRecord) {
  const explicit = place.estimatedPricePerPerson ?? null;
  if (explicit !== null) {
    return explicit;
  }

  const priceMap: Record<string, number> = {
    "€": 1,
    "€€": 2,
    "€€€": 3,
    "€€€€": 4,
  };

  return priceMap[place.priceRange ?? ""] ?? 99;
}

function matchesFilter(place: PlaceRecord, filters: PlaceFilters) {
  const haystack = normalizeText(
    [
      place.name,
      place.address,
      place.city,
      place.neighborhood,
      place.arrondissement,
      place.cuisineType,
      ...parseStringList(place.foodType),
      ...parseStringList(place.tags),
      ...place.recommendations.map((item) => item.reasonRecommended ?? ""),
      ...place.recommendations.map((item) => item.originalTextSnippet ?? ""),
      ...place.recommendations.map((item) => item.sourceTitle ?? ""),
    ].join(" "),
  );

  if (filters.q && !haystack.includes(normalizeText(filters.q))) {
    return false;
  }

  if (filters.cuisine && place.cuisineType !== filters.cuisine) {
    return false;
  }

  if (filters.foodType && !parseStringList(place.foodType).includes(filters.foodType)) {
    return false;
  }

  if (filters.priceRange && place.priceRange !== filters.priceRange) {
    return false;
  }

  if (filters.city && place.city !== filters.city) {
    return false;
  }

  if (filters.neighborhood && place.neighborhood !== filters.neighborhood) {
    return false;
  }

  if (filters.arrondissement && place.arrondissement !== filters.arrondissement) {
    return false;
  }

  if (filters.tag && !parseStringList(place.tags).includes(filters.tag)) {
    return false;
  }

  if (
    filters.source &&
    !place.recommendations.some(
      (recommendation) => recommendation.sourcePlatform === filters.source,
    )
  ) {
    return false;
  }

  if (
    filters.confidence &&
    getConfidenceBucket(place.confidenceScore) !== filters.confidence
  ) {
    return false;
  }

  if (filters.reviewStatus && place.status !== filters.reviewStatus) {
    return false;
  }

  return true;
}

function sortPlaces(places: PlaceRecord[], sort: string) {
  return [...places].sort((left, right) => {
    if (sort === "alphabetical") {
      return left.name.localeCompare(right.name, "fr");
    }

    if (sort === "confidence") {
      return right.confidenceScore - left.confidenceScore;
    }

    if (sort === "price") {
      return priceSortValue(left) - priceSortValue(right);
    }

    return right.createdAt.getTime() - left.createdAt.getTime();
  });
}

export function resolveSearchParams(
  params: Record<string, string | string[] | undefined>,
) {
  return Object.fromEntries(
    Object.entries(params).map(([key, value]) => [
      key,
      Array.isArray(value) ? value[0] ?? "" : value ?? "",
    ]),
  ) as Record<string, string>;
}

export function resolveFilters(params: Record<string, string>) {
  return {
    ...DEFAULT_FILTERS,
    ...params,
  };
}

const getRawPlaces = cache(async () =>
  prisma.place.findMany({
    include: placeInclude,
    orderBy: {
      createdAt: "desc",
    },
  }),
);

export const getPlaces = cache(async (filters: PlaceFilters) => {
  const places = await getRawPlaces();
  return sortPlaces(places.filter((place) => matchesFilter(place, filters)), filters.sort);
});

export const getMapPlaces = cache(async (filters: PlaceFilters) => {
  const places = await getPlaces(filters);

  return places
    .filter(
      (place) =>
        typeof place.latitude === "number" && typeof place.longitude === "number",
    )
    .map(
      (place): MapPlace => ({
        id: place.id,
        name: place.name,
        address: place.address,
        latitude: place.latitude as number,
        longitude: place.longitude as number,
      }),
    );
});

export const getFacets = cache(async (): Promise<PlaceFacets> => {
  const places = await getRawPlaces();

  return {
    cuisines: uniqueSorted(places.map((place) => place.cuisineType ?? "")),
    foodTypes: uniqueSorted(places.flatMap((place) => parseStringList(place.foodType))),
    priceRanges: uniqueSorted(places.map((place) => place.priceRange ?? "")),
    cities: uniqueSorted(places.map((place) => place.city ?? "")),
    neighborhoods: uniqueSorted(places.map((place) => place.neighborhood ?? "")),
    arrondissements: uniqueSorted(places.map((place) => place.arrondissement ?? "")),
    tags: uniqueSorted(places.flatMap((place) => parseStringList(place.tags))),
    sources: uniqueSorted(
      places.flatMap((place) =>
        place.recommendations.map((recommendation) => recommendation.sourcePlatform),
      ),
    ),
  };
});

export const getPlaceById = cache(async (id: string) =>
  prisma.place.findUnique({
    where: { id },
    include: placeInclude,
  }),
);

export const getPlacesNeedingReview = cache(async () =>
  prisma.place.findMany({
    where: {
      needsReview: true,
    },
    include: placeInclude,
    orderBy: {
      confidenceScore: "asc",
    },
  }),
);

export const getDuplicateCandidates = cache(async (): Promise<DuplicateCandidateRecord[]> =>
  prisma.duplicateCandidate.findMany({
    where: {
      status: "pending",
    },
    include: {
      place1: true,
      place2: true,
    },
    orderBy: {
      similarityScore: "desc",
    },
  }),
);

export const getHomeData = cache(async () => {
  const [places, favoritePlaces, sources] = await Promise.all([
    prisma.place.findMany({
      include: placeInclude,
      orderBy: { createdAt: "desc" },
      take: 4,
    }),
    prisma.place.findMany({
      where: {
        personalState: {
          isFavorite: true,
        },
      },
      include: placeInclude,
      orderBy: {
        updatedAt: "desc",
      },
      take: 4,
    }),
    prisma.source.count(),
  ]);

  const [totalPlaces, needsReviewCount, favoritesCount] = await Promise.all([
    prisma.place.count(),
    prisma.place.count({
      where: {
        needsReview: true,
      },
    }),
    prisma.personalPlaceState.count({
      where: {
        isFavorite: true,
      },
    }),
  ]);

  return {
    totalPlaces,
    needsReviewCount,
    favoritesCount,
    totalSources: sources,
    recentPlaces: places,
    favoritePlaces,
  };
});

export function formatPriceLevel(priceLevel: string | null | undefined) {
  if (!priceLevel) {
    return "Unknown";
  }

  return priceLevel.replace(/^PRICE_LEVEL_/, "").toLowerCase().replace(/_/g, " ");
}

export function getReviewLabel(place: {
  status: string;
  needsReview: boolean;
}) {
  if (place.status === "merged") {
    return "Merged";
  }

  if (place.status === "rejected") {
    return "Rejected";
  }

  if (place.needsReview) {
    return "Needs review";
  }

  return "Approved";
}

export function formatConfidence(score: number) {
  return `${Math.round(score * 100)}%`;
}

export function formatDate(value: Date | null | undefined) {
  if (!value) {
    return "Unknown date";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(value);
}
