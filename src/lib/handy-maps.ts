import { PLACE_COLLECTION_LABELS, type PlaceCollection } from "@/lib/place-collections";

export type HandyMapSlug =
  | "all-paris"
  | "restaurants"
  | "gastro-higher-end"
  | "cafes-bakeries"
  | "bars-wine"
  | "bistros-brasseries"
  | "japanese-spots"
  | "italian-spots";

export type HandyMapPlace = {
  id?: string;
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
  googleEditorialSummary: string | null;
  googlePrimaryTypeLabel: string | null;
  latitude: number | null;
  longitude: number | null;
  philouSummary: string | null;
  websiteUrl?: string | null;
  bookingUrl?: string | null;
};

type HandyMapDefinition = {
  slug: HandyMapSlug;
  title: string;
  kicker: string;
  description: string;
  image: string;
  imagePosition: string;
  browseHref: string;
  matches: (place: HandyMapPlace) => boolean;
};

export type HandyMapCard = Omit<HandyMapDefinition, "matches"> & {
  count: number;
  csvHref: string;
  kmlHref: string;
};

function normalizeText(value: string | null | undefined) {
  return (value ?? "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

function placeSignals(place: HandyMapPlace) {
  return [
    place.cuisineType,
    place.googlePrimaryTypeLabel,
    ...place.tags,
    ...place.foodTypes,
    place.philouSummary,
    place.googleEditorialSummary,
  ]
    .map((value) => normalizeText(value))
    .filter(Boolean);
}

function matchesAny(place: HandyMapPlace, candidates: string[]) {
  const signals = placeSignals(place);
  return candidates.some((candidate) => {
    const normalizedCandidate = normalizeText(candidate);
    return signals.some(
      (signal) =>
        signal === normalizedCandidate ||
        signal.includes(normalizedCandidate) ||
        normalizedCandidate.includes(signal),
    );
  });
}

function collectionMatch(collection: PlaceCollection) {
  return (place: HandyMapPlace) => place.collection === collection;
}

const handyMapDefinitions: HandyMapDefinition[] = [
  {
    slug: "all-paris",
    title: "All Paris addresses",
    kicker: "The full map",
    description:
      "The full Paris guide in one place, from destination tables to coffee counters and wine bars.",
    image: "/photos/paris-cafe-street.jpg",
    imagePosition: "center 52%",
    browseHref: "/map?city=Paris",
    matches: (place) => place.city === "Paris",
  },
  {
    slug: "restaurants",
    title: PLACE_COLLECTION_LABELS.restaurants,
    kicker: "The main list",
    description:
      "A focused list of Paris restaurants worth saving, for everything from neighborhood dinners to harder-to-book tables.",
    image: "/photos/paris-brasserie.jpg",
    imagePosition: "center 35%",
    browseHref: "/map?city=Paris&collection=restaurants",
    matches: collectionMatch("restaurants"),
  },
  {
    slug: "gastro-higher-end",
    title: PLACE_COLLECTION_LABELS["gastro-higher-end"],
    kicker: "Special occasion",
    description:
      "Philou’s finer-dining side of Paris, for celebratory dinners, polished rooms, and chef-led menus.",
    image: "/photos/cafe-de-flore.jpg",
    imagePosition: "center 30%",
    browseHref: "/map?city=Paris&collection=gastro-higher-end",
    matches: collectionMatch("gastro-higher-end"),
  },
  {
    slug: "cafes-bakeries",
    title: PLACE_COLLECTION_LABELS["cafe-bakery"],
    kicker: "Morning to goûter",
    description:
      "Cafe stops, bakery counters, pastry breaks, and easy addresses for a slower Paris day.",
    image: "/photos/hero-croissants.jpg",
    imagePosition: "center 55%",
    browseHref: "/map?city=Paris&collection=cafe-bakery",
    matches: collectionMatch("cafe-bakery"),
  },
  {
    slug: "bars-wine",
    title: PLACE_COLLECTION_LABELS["bars-wine"],
    kicker: "After-hours",
    description:
      "Natural wine bars, cocktails, and late-night spots for the side of Paris that starts after dinner.",
    image: "/photos/paris-cafe-terrace.jpg",
    imagePosition: "center 58%",
    browseHref: "/map?city=Paris&collection=bars-wine",
    matches: collectionMatch("bars-wine"),
  },
  {
    slug: "bistros-brasseries",
    title: "Bistros & brasseries",
    kicker: "Classic Paris",
    description:
      "Old-school bistro energy, brasserie comfort, and classic French tables you can return to again and again.",
    image: "/photos/paris-brasserie.jpg",
    imagePosition: "center 38%",
    browseHref: "/map?city=Paris&collection=restaurants&q=bistro",
    matches: (place) =>
      matchesAny(place, ["bistro", "bistrot", "brasserie", "classic french", "french"]),
  },
  {
    slug: "japanese-spots",
    title: "Japanese spots",
    kicker: "Sushi to ramen",
    description:
      "A Paris map for sushi counters, ramen bowls, izakayas, and Japanese addresses Philou has flagged.",
    image: "/photos/paris-cafe-street.jpg",
    imagePosition: "center 45%",
    browseHref: "/map?city=Paris&collection=restaurants&q=japanese",
    matches: (place) =>
      matchesAny(place, ["japanese", "japonais", "sushi", "ramen", "izakaya"]),
  },
  {
    slug: "italian-spots",
    title: "Italian spots",
    kicker: "Pasta, pizza, trattorias",
    description:
      "A tighter list for Roman lunches, pizza nights, trattorias, and the Italian addresses that keep coming up.",
    image: "/photos/hero-brunch.jpg",
    imagePosition: "center 50%",
    browseHref: "/map?city=Paris&collection=restaurants&q=italian",
    matches: (place) =>
      matchesAny(place, ["italian", "italien", "pizza", "pasta", "trattoria"]),
  },
];

function filterParisPlaces(places: HandyMapPlace[]) {
  return places.filter(
    (place) => place.city === "Paris" && place.address && place.collection !== "hotels-stays",
  );
}

export function getHandyMapFilename(slug: HandyMapSlug, extension: "csv" | "kml") {
  return `philou-paris-${slug}-google-mymaps.${extension}`;
}

export function getHandyMapCards(places: HandyMapPlace[]): HandyMapCard[] {
  const parisPlaces = filterParisPlaces(places);

  return handyMapDefinitions
    .map((definition) => {
      const count = parisPlaces.filter(definition.matches).length;

      return {
        ...definition,
        count,
        csvHref: `/exports/${getHandyMapFilename(definition.slug, "csv")}`,
        kmlHref: `/exports/${getHandyMapFilename(definition.slug, "kml")}`,
      };
    })
    .filter((map) => map.count > 0);
}

export function getHandyMapPlaces(
  places: HandyMapPlace[],
  slug: HandyMapSlug,
) {
  const definition = handyMapDefinitions.find((item) => item.slug === slug);
  if (!definition) {
    return [];
  }

  return filterParisPlaces(places).filter(definition.matches);
}
