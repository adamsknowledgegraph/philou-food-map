export const PLACE_COLLECTIONS = [
  "gastro-higher-end",
  "restaurants",
  "cafe-bakery",
  "bars-wine",
  "hotels-stays",
  "to-explore",
] as const;

export type PlaceCollection = (typeof PLACE_COLLECTIONS)[number];

export const PLACE_COLLECTION_LABELS: Record<PlaceCollection, string> = {
  "gastro-higher-end": "Gastro / higher-end",
  restaurants: "Restaurants",
  "cafe-bakery": "Cafes & bakeries",
  "bars-wine": "Bars & wine",
  "hotels-stays": "Hotels & stays",
  "to-explore": "Everything else",
};

export type ExplorerPlace = {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  arrondissement: string | null;
  neighborhood: string | null;
  cuisineType: string | null;
  foodTypes: string[];
  priceRange: string | null;
  tags: string[];
  collection: PlaceCollection;
  googleMapsUrl: string | null;
  googleRating: number | null;
  googleUserRatingCount: number | null;
  googlePhotoName: string | null;
  googlePhotoUrl: string | null;
  googleEditorialSummary: string | null;
  googleNeighborhoodSummary: string | null;
  googlePrimaryTypeLabel: string | null;
  googleOpenNow: boolean | null;
  latitude: number | null;
  longitude: number | null;
  philouSummary: string | null;
  websiteUrl: string | null;
  bookingUrl: string | null;
  recommendationReason: string | null;
  recommendationSnippet: string | null;
  recommendedItems: string[];
};
