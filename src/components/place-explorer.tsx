"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ExternalLink,
  Filter,
  List,
  Map as MapIcon,
  MapPin,
  RotateCcw,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import { useDeferredValue, useEffect, useState } from "react";
import { GoogleMapsPreview } from "@/components/google-maps-preview";
import { GoogleRating } from "@/components/google-rating";
import { MapPanel } from "@/components/map-panel";
import { PlaceImage } from "@/components/place-image";
import {
  PLACE_COLLECTION_LABELS,
  type ExplorerPlace,
  type PlaceCollection,
} from "@/lib/place-collections";

type ExplorerMode = "home" | "map";
type ExplorerView = "map" | "list";

type PlaceExplorerProps = {
  places: ExplorerPlace[];
  initialCollection: PlaceCollection;
  initialQuery?: string;
  initialArrondissement?: string;
  initialTag?: string;
  initialPriceRange?: string;
  initialSort?: "recent" | "alphabetical" | "price";
  mode?: ExplorerMode;
  anchor?: string;
};

type ThemeCount = {
  label: string;
  count: number;
};

const collections: PlaceCollection[] = [
  "restaurants",
  "gastro-higher-end",
  "cafe-bakery",
  "bars-wine",
];

const hiddenThemeTags = new Set([
  "mapstr",
  "public-map",
  "to try",
  "spot to visit",
  "place to visit",
  "restaurant",
  "cafe",
  "bar",
  "hotel / bb",
  "high-end",
  "gastro / higher end",
  "museum",
  "shopping",
  "beauty",
]);

function normalizeText(value: string | null | undefined) {
  return (value ?? "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

function sortPlaces(
  places: ExplorerPlace[],
  sort: "recent" | "alphabetical" | "price",
) {
  if (sort === "alphabetical") {
    return [...places].sort((left, right) => left.name.localeCompare(right.name, "fr"));
  }

  if (sort === "price") {
    const priceMap: Record<string, number> = {
      "€": 1,
      "€€": 2,
      "€€€": 3,
      "€€€€": 4,
    };

    return [...places].sort((left, right) => {
      const leftValue = priceMap[left.priceRange ?? ""] ?? 99;
      const rightValue = priceMap[right.priceRange ?? ""] ?? 99;
      return leftValue - rightValue;
    });
  }

  return places;
}

function placeMatchesTheme(place: ExplorerPlace, theme: string) {
  const normalizedTheme = normalizeText(theme);
  const values = [place.cuisineType, ...place.foodTypes, ...place.tags]
    .map((value) => normalizeText(value))
    .filter(Boolean);

  return values.includes(normalizedTheme);
}

function getThemeCounts(places: ExplorerPlace[]) {
  const counts = new Map<string, ThemeCount>();

  for (const place of places) {
    const uniqueSignals = new Map<string, string>();
    for (const rawValue of [place.cuisineType, ...place.foodTypes, ...place.tags]) {
      const value = rawValue?.trim();
      const normalized = normalizeText(value);
      if (!value || !normalized || hiddenThemeTags.has(normalized)) {
        continue;
      }

      uniqueSignals.set(normalized, value);
    }

    for (const [normalized, label] of uniqueSignals) {
      const current = counts.get(normalized);
      counts.set(normalized, {
        label,
        count: (current?.count ?? 0) + 1,
      });
    }
  }

  return [...counts.values()]
    .sort((left, right) => {
      if (right.count !== left.count) {
        return right.count - left.count;
      }

      return left.label.localeCompare(right.label, "fr");
    })
    .slice(0, 16);
}

function getCollectionCounts(places: ExplorerPlace[]) {
  return collections.reduce<Record<PlaceCollection, number>>((accumulator, collection) => {
    accumulator[collection] = places.filter((place) => place.collection === collection).length;
    return accumulator;
  }, {} as Record<PlaceCollection, number>);
}

function truncateText(value: string, maxLength: number) {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength).trim()}…`;
}

function buildDirectionsUrl(place: ExplorerPlace) {
  const query = [place.name, place.address, place.city].filter(Boolean).join(", ");
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(query)}`;
}

function PlaceListCard({
  place,
  selected,
  onHover,
}: {
  place: ExplorerPlace;
  selected: boolean;
  onHover: () => void;
}) {
  const summary = truncateText(
    place.philouSummary ||
      place.recommendationReason ||
      place.googleEditorialSummary ||
      place.recommendationSnippet ||
      "Saved from Philou's public Paris picks.",
    165,
  );

  return (
    <article
      className={`surface retro-panel overflow-hidden rounded-[28px] bg-[rgba(255,247,236,0.92)] transition ${
        selected ? "ring-2 ring-[rgba(240,143,102,0.38)]" : "hover:-translate-y-0.5"
      }`}
      onMouseEnter={onHover}
    >
      <PlaceImage
        placeId={place.id}
        name={place.name}
        hasGooglePhoto={Boolean(place.googlePhotoName)}
        imageUrl={place.googlePhotoUrl}
        compact
      />
      <div className="space-y-4 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
              {place.googleOpenNow === true ? (
                <span className="chip rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em]">
                  Open now
                </span>
              ) : null}
              <GoogleRating
                rating={place.googleRating}
                count={place.googleUserRatingCount}
                compact
              />
            </div>
            <h3 className="display text-[1.9rem] leading-none text-[var(--foreground)]">
              <Link href={`/places/${place.id}`}>{place.name}</Link>
            </h3>
            <p className="flex items-center gap-2 text-sm text-[var(--muted)]">
              <MapPin className="h-4 w-4" />
              {place.address ?? "Address under review"}
            </p>
          </div>
          {place.googleMapsUrl ? (
            <a
              href={place.googleMapsUrl}
              target="_blank"
              rel="noreferrer"
              className="ghost-button px-3 py-2"
            >
              Open map
              <ExternalLink className="h-4 w-4" />
            </a>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2">
          {place.foodTypes.slice(0, 2).map((foodType) => (
            <span
              key={foodType}
              className="rounded-full bg-[rgba(141,183,170,0.18)] px-3 py-1 text-sm text-[var(--accent-ink)]"
            >
              {foodType}
            </span>
          ))}
          {place.cuisineType ? (
            <span className="rounded-full bg-[rgba(238,144,119,0.16)] px-3 py-1 text-sm text-[var(--accent-ink)]">
              {place.cuisineType}
            </span>
          ) : null}
          {place.priceRange ? (
            <span className="rounded-full border border-[var(--line)] bg-white/80 px-3 py-1 text-sm">
              {place.priceRange}
            </span>
          ) : null}
          {place.arrondissement ? (
            <span className="rounded-full border border-[var(--line)] bg-white/80 px-3 py-1 text-sm">
              {place.arrondissement}
            </span>
          ) : null}
        </div>

        <p className="text-sm leading-6 text-[var(--muted)]">{summary}</p>

        {place.recommendedItems.length ? (
          <div className="rounded-[18px] bg-[rgba(242,215,166,0.22)] px-4 py-3 text-sm text-[var(--accent-ink)]">
            <span className="font-semibold">What to order:</span>{" "}
            {place.recommendedItems.slice(0, 3).join(", ")}
          </div>
        ) : null}
      </div>
    </article>
  );
}

function SelectedPlacePanel({ place }: { place: ExplorerPlace }) {
  const summary = place.philouSummary || place.recommendationReason || place.googleEditorialSummary;

  return (
    <div className="surface retro-panel rounded-[30px] p-5">
      <div className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="space-y-4">
          <PlaceImage
            placeId={place.id}
            name={place.name}
            hasGooglePhoto={Boolean(place.googlePhotoName)}
            imageUrl={place.googlePhotoUrl}
            compact
          />

          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <GoogleRating
                rating={place.googleRating}
                count={place.googleUserRatingCount}
              />
              {place.googleOpenNow === true ? (
                <span className="chip rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em]">
                  Open now
                </span>
              ) : null}
            </div>

            <div>
              <h3 className="display text-4xl leading-none">{place.name}</h3>
              <p className="mt-2 flex items-center gap-2 text-sm text-[var(--muted)]">
                <MapPin className="h-4 w-4" />
                {place.address ?? "Address under review"}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {place.foodTypes.slice(0, 2).map((foodType) => (
                <span
                  key={foodType}
                  className="rounded-full bg-[rgba(141,183,170,0.18)] px-3 py-1 text-sm text-[var(--accent-ink)]"
                >
                  {foodType}
                </span>
              ))}
              {place.cuisineType ? (
                <span className="rounded-full bg-[rgba(238,144,119,0.16)] px-3 py-1 text-sm text-[var(--accent-ink)]">
                  {place.cuisineType}
                </span>
              ) : null}
              {place.priceRange ? (
                <span className="rounded-full border border-[var(--line)] bg-white/80 px-3 py-1 text-sm">
                  {place.priceRange}
                </span>
              ) : null}
              {place.arrondissement ? (
                <span className="rounded-full border border-[var(--line)] bg-white/80 px-3 py-1 text-sm">
                  {place.arrondissement}
                </span>
              ) : null}
              {place.tags.slice(0, 2).map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-[var(--line)] bg-white/80 px-3 py-1 text-sm text-[var(--muted)]"
                >
                  {tag}
                </span>
              ))}
            </div>

            {summary ? (
              <p className="text-sm leading-6 text-[var(--muted)]">
                {truncateText(summary, 220)}
              </p>
            ) : null}

            {place.recommendedItems.length ? (
              <div className="rounded-[18px] bg-[rgba(242,215,166,0.22)] px-4 py-3 text-sm text-[var(--accent-ink)]">
                <span className="font-semibold">What to order:</span>{" "}
                {place.recommendedItems.slice(0, 4).join(", ")}
              </div>
            ) : null}

            <div className="flex flex-wrap gap-3">
              {place.googleMapsUrl ? (
                <a
                  href={place.googleMapsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="cta-button px-4 py-2.5"
                >
                  Open in Google Maps
                </a>
              ) : null}
              <a
                href={buildDirectionsUrl(place)}
                target="_blank"
                rel="noreferrer"
                className="ghost-button px-4 py-2.5"
              >
                Directions
              </a>
              <Link href={`/places/${place.id}`} className="ghost-button px-4 py-2.5">
                Full details
              </Link>
            </div>
          </div>
        </div>

        <div className="grid gap-4">
          <GoogleMapsPreview
            name={place.name}
            address={place.address}
            city={place.city}
            className="min-h-[320px]"
          />
          {place.googleNeighborhoodSummary ? (
            <div className="rounded-[22px] border border-[var(--line)] bg-white/80 p-4 text-sm leading-6 text-[var(--muted)]">
              {place.googleNeighborhoodSummary}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function PlaceExplorer({
  places,
  initialCollection,
  initialQuery = "",
  initialArrondissement = "",
  initialTag = "",
  initialPriceRange = "",
  initialSort = "recent",
  mode = "home",
  anchor,
}: PlaceExplorerProps) {
  const pathname = usePathname();
  const [collection, setCollection] = useState<PlaceCollection>(initialCollection);
  const [query, setQuery] = useState(initialQuery);
  const [arrondissement, setArrondissement] = useState(initialArrondissement);
  const [tag, setTag] = useState(initialTag);
  const [priceRange, setPriceRange] = useState(initialPriceRange);
  const [sort, setSort] = useState<"recent" | "alphabetical" | "price">(initialSort);
  const [selectedId, setSelectedId] = useState<string | null>(places[0]?.id ?? null);
  const [viewMode, setViewMode] = useState<ExplorerView>("map");
  const deferredQuery = useDeferredValue(query);

  const collectionPlaces = places.filter((place) => place.collection === collection);
  const collectionCounts = getCollectionCounts(places);
  const arrondissements = [...new Set(collectionPlaces.map((place) => place.arrondissement).filter(Boolean))] as string[];
  const priceRanges = [...new Set(collectionPlaces.map((place) => place.priceRange).filter(Boolean))] as string[];
  const themeCounts = getThemeCounts(collectionPlaces);

  const filteredPlaces = sortPlaces(
    collectionPlaces.filter((place) => {
      const haystack = [
        place.name,
        place.address,
        place.arrondissement,
        place.neighborhood,
        place.cuisineType,
        ...place.foodTypes,
        ...place.tags,
        place.googlePrimaryTypeLabel,
        place.googleNeighborhoodSummary,
        place.philouSummary,
        place.recommendationReason,
        place.recommendationSnippet,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      if (deferredQuery && !haystack.includes(deferredQuery.toLowerCase())) {
        return false;
      }

      if (arrondissement && place.arrondissement !== arrondissement) {
        return false;
      }

      if (tag && !placeMatchesTheme(place, tag)) {
        return false;
      }

      if (priceRange && place.priceRange !== priceRange) {
        return false;
      }

      return true;
    }),
    sort,
  );

  const selectedPlace =
    filteredPlaces.find((place) => place.id === selectedId) ??
    filteredPlaces[0] ??
    null;
  const activeSelectedId = selectedPlace?.id ?? null;

  const mapPlaces = filteredPlaces
    .filter(
      (place) =>
        typeof place.latitude === "number" && typeof place.longitude === "number",
    )
    .map((place) => ({
      id: place.id,
      name: place.name,
      address: place.address,
      latitude: place.latitude as number,
      longitude: place.longitude as number,
    }));

  useEffect(() => {
    const params = new URLSearchParams();
    params.set("city", "Paris");

    if (collection !== "restaurants") {
      params.set("collection", collection);
    }
    if (query) {
      params.set("q", query);
    }
    if (arrondissement) {
      params.set("arrondissement", arrondissement);
    }
    if (tag) {
      params.set("tag", tag);
    }
    if (priceRange) {
      params.set("priceRange", priceRange);
    }
    if (sort !== "recent") {
      params.set("sort", sort);
    }

    const queryString = params.toString();
    const url = queryString ? `${pathname}?${queryString}` : pathname;
    window.history.replaceState({}, "", `${url}${anchor ?? ""}`);
  }, [anchor, arrondissement, collection, pathname, priceRange, query, sort, tag]);

  const resetFilters = () => {
    setQuery("");
    setArrondissement("");
    setTag("");
    setPriceRange("");
    setSort("recent");
  };

  const activeFilterCount = [query, arrondissement, tag, priceRange].filter(Boolean).length;
  const placesWithRatings = filteredPlaces.filter((place) => typeof place.googleRating === "number").length;
  const placesWithPhotos = filteredPlaces.filter((place) => Boolean(place.googlePhotoName || place.googlePhotoUrl)).length;

  if (mode === "home") {
    const visiblePlaces = filteredPlaces.slice(0, 6);

    return (
      <section className="surface retro-panel rounded-[32px] p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
              Paris lists
            </p>
            <h2 className="display mt-2 text-4xl leading-none">
              {PLACE_COLLECTION_LABELS[collection]} in Paris
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)]">
              A cleaner way to browse Philou&apos;s saved spots with ratings, photos, and better filters than the original Mapstr map.
            </p>
          </div>
          <Link href="/map?city=Paris" className="cta-button px-4 py-2.5">
            Open the full explorer
          </Link>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {collections.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setCollection(item)}
              className={collection === item ? "cta-button px-4 py-2.5" : "ghost-button px-4 py-2.5"}
            >
              {PLACE_COLLECTION_LABELS[item]}
              <span className="rounded-full bg-white/86 px-2 py-0.5 text-[10px] font-semibold tracking-[0.08em] text-[var(--accent-ink)]">
                {collectionCounts[item].toLocaleString("en-GB")}
              </span>
            </button>
          ))}
        </div>

        <div className="mt-6 grid gap-4 xl:grid-cols-[1.2fr_0.8fr_0.8fr]">
          <label className="grid gap-2 text-sm">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
              Search
            </span>
            <div className="flex items-center gap-3 rounded-[18px] border border-[rgba(133,83,58,0.16)] bg-[rgba(255,251,245,0.94)] px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
              <Search className="h-4 w-4 text-[var(--muted)]" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search a place or arrondissement"
                className="w-full bg-transparent text-sm"
              />
            </div>
          </label>

          <label className="grid gap-2 text-sm">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
              Arrondissement
            </span>
            <select
              value={arrondissement}
              onChange={(event) => setArrondissement(event.target.value)}
              className="retro-select"
            >
              <option value="">All</option>
              {arrondissements.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-2 text-sm">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
              Sort
            </span>
            <select
              value={sort}
              onChange={(event) =>
                setSort(event.target.value as "recent" | "alphabetical" | "price")
              }
              className="retro-select"
            >
              <option value="recent">Recent</option>
              <option value="alphabetical">A-Z</option>
              <option value="price">Price</option>
            </select>
          </label>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          {visiblePlaces.map((place) => (
            <PlaceListCard
              key={place.id}
              place={place}
              selected={selectedPlace?.id === place.id}
              onHover={() => setSelectedId(place.id)}
            />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="surface retro-panel rounded-[34px] p-4 sm:p-6">
      <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <aside className="surface retro-panel h-fit rounded-[28px] bg-[rgba(255,248,236,0.96)] p-5 xl:sticky xl:top-24">
          <div className="space-y-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
                Philou&apos;s Paris map
              </p>
              <h2 className="display mt-2 text-4xl leading-none">Browse the saved spots</h2>
              <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
                Search, filter, and switch between map and list view without the clutter of the original Mapstr map.
              </p>
            </div>

            <div className="flex flex-wrap gap-2 text-sm text-[var(--muted)]">
              <div className="rounded-full border border-[var(--line)] bg-white/80 px-4 py-2.5">
                {filteredPlaces.length.toLocaleString("en-GB")} places
              </div>
              <div className="rounded-full border border-[var(--line)] bg-white/80 px-4 py-2.5">
                {placesWithRatings.toLocaleString("en-GB")} rated
              </div>
              <div className="rounded-full border border-[var(--line)] bg-white/80 px-4 py-2.5">
                {placesWithPhotos.toLocaleString("en-GB")} with photos
              </div>
            </div>

            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-white/80 p-1">
              <button
                type="button"
                onClick={() => setViewMode("map")}
                className={viewMode === "map" ? "pill-button pill-button-active px-4 py-2.5" : "ghost-button px-4 py-2.5"}
              >
                <MapIcon className="h-4 w-4" />
                Map
              </button>
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className={viewMode === "list" ? "pill-button pill-button-active px-4 py-2.5" : "ghost-button px-4 py-2.5"}
              >
                <List className="h-4 w-4" />
                List
              </button>
            </div>

            <div className="grid gap-3">
              {collections.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setCollection(item)}
                  className={`flex items-center justify-between rounded-[18px] border px-4 py-3 text-left transition ${
                    collection === item
                      ? "border-[rgba(240,143,102,0.34)] bg-[rgba(240,143,102,0.14)]"
                      : "border-[var(--line)] bg-white/72 hover:-translate-y-0.5"
                  }`}
                >
                  <span className="text-sm font-semibold uppercase tracking-[0.12em] text-[var(--accent-ink)]">
                    {PLACE_COLLECTION_LABELS[item]}
                  </span>
                  <span className="rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-[var(--accent-ink)]">
                    {collectionCounts[item].toLocaleString("en-GB")}
                  </span>
                </button>
              ))}
            </div>

            <label className="grid gap-2 text-sm">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
                Search
              </span>
              <div className="flex items-center gap-3 rounded-[18px] border border-[rgba(133,83,58,0.16)] bg-white/88 px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
                <Search className="h-4 w-4 text-[var(--muted)]" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search a place, street, or arrondissement"
                  className="w-full bg-transparent text-sm"
                />
              </div>
            </label>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              <label className="grid gap-2 text-sm">
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
                  Arrondissement
                </span>
                <select
                  value={arrondissement}
                  onChange={(event) => setArrondissement(event.target.value)}
                  className="retro-select"
                >
                  <option value="">All</option>
                  {arrondissements.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-2 text-sm">
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
                  Price
                </span>
                <select
                  value={priceRange}
                  onChange={(event) => setPriceRange(event.target.value)}
                  className="retro-select"
                >
                  <option value="">All</option>
                  {priceRanges.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="grid gap-2 text-sm">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
                Sort
              </span>
              <select
                value={sort}
                onChange={(event) =>
                  setSort(event.target.value as "recent" | "alphabetical" | "price")
                }
                className="retro-select"
              >
                <option value="recent">Recent</option>
                <option value="alphabetical">A-Z</option>
                <option value="price">Price</option>
              </select>
            </label>

            <div className="rounded-[22px] border border-[var(--line)] bg-white/74 p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-[var(--accent-ink)]" />
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
                    Quick filters
                  </p>
                </div>
                {activeFilterCount ? (
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="ghost-button px-3 py-2"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Reset
                  </button>
                ) : null}
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {themeCounts.map((item) => {
                  const active = normalizeText(tag) === normalizeText(item.label);
                  return (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => setTag(active ? "" : item.label)}
                      className={active ? "cta-button px-3 py-2" : "ghost-button px-3 py-2"}
                    >
                      {item.label}
                      <span className="rounded-full bg-white/84 px-2 py-0.5 text-[10px] font-semibold tracking-[0.08em] text-[var(--accent-ink)]">
                        {item.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="rounded-[22px] border border-[var(--line)] bg-[rgba(242,215,166,0.16)] p-4 text-sm leading-6 text-[var(--muted)]">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent-ink)]">
                <SlidersHorizontal className="h-4 w-4" />
                Better than Mapstr
              </div>
              <p className="mt-3">
                The goal here is simple: the same Paris addresses, but easier to choose from thanks to ratings, photos, tags, and a cleaner map or list flow.
              </p>
            </div>
          </div>
        </aside>

        <div className="grid gap-5">
          {viewMode === "map" ? (
            <>
              <div className="surface retro-panel overflow-hidden rounded-[32px] p-3">
                <div className="h-[72vh]">
                  <MapPanel
                    places={mapPlaces}
                    selectedId={activeSelectedId}
                    onSelect={setSelectedId}
                    zoom={13}
                  />
                </div>
              </div>
              {selectedPlace ? (
                <SelectedPlacePanel place={selectedPlace} />
              ) : null}
            </>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {filteredPlaces.map((place) => (
                <PlaceListCard
                  key={place.id}
                  place={place}
                  selected={activeSelectedId === place.id}
                  onHover={() => setSelectedId(place.id)}
                />
              ))}
              {filteredPlaces.length === 0 ? (
                <div className="surface retro-panel rounded-[30px] p-8 text-center lg:col-span-2">
                  <p className="display text-3xl">No Paris places matched those filters.</p>
                  <p className="mt-3 text-sm text-[var(--muted)]">
                    Try clearing a filter or switching to another list.
                  </p>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
