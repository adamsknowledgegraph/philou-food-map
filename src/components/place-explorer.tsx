"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ExternalLink,
  Filter,
  List,
  Map as MapIcon,
  RotateCcw,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import { useDeferredValue, useEffect, useState } from "react";
import { GoogleMyMapEmbed } from "@/components/google-my-map-embed";
import { GoogleRating } from "@/components/google-rating";
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
  initialCuisine?: string;
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

function getLocationLabel(place: ExplorerPlace) {
  if (place.arrondissement) {
    return place.arrondissement;
  }

  if (place.neighborhood) {
    return place.neighborhood;
  }

  if (place.address) {
    return place.address.split(",")[0]?.trim() ?? place.address;
  }

  return "Paris";
}

function getHighlightLabel(place: ExplorerPlace) {
  const preferredTag = place.tags.find((tag) => !hiddenThemeTags.has(normalizeText(tag)));

  return preferredTag || place.cuisineType || place.googlePrimaryTypeLabel || place.foodTypes[0] || "Paris pick";
}

function PlaceListCard({
  place,
  duplicateCount,
}: {
  place: ExplorerPlace;
  duplicateCount: number;
}) {
  const description = truncateText(
    place.googleEditorialSummary ||
      place.googleNeighborhoodSummary ||
      place.philouSummary ||
      place.recommendationReason ||
      place.recommendationSnippet ||
      "Saved from trusted Paris food references.",
    150,
  );
  const locationLabel = getLocationLabel(place);
  const highlight = getHighlightLabel(place);
  const detailLine = [place.arrondissement, place.cuisineType, place.priceRange]
    .filter(Boolean)
    .join(" · ");

  return (
    <article className="overflow-hidden rounded-[24px] border border-black bg-white shadow-[0_22px_50px_rgba(0,0,0,0.08)] transition duration-200 hover:-translate-y-0.5">
      <div className="space-y-4 p-5 pb-0">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="inline-flex bg-[#ffe04d] px-3 py-1 text-[0.75rem] font-bold uppercase tracking-[0.08em] text-black">
            {highlight}
          </span>
          <GoogleRating
            rating={place.googleRating}
            count={place.googleUserRatingCount}
            compact
          />
        </div>

        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-[2rem] font-bold uppercase leading-none tracking-[-0.03em] text-black">
              <Link href={`/places/${place.id}`}>{place.name}</Link>
            </h3>
            {duplicateCount > 1 ? (
              <span className="rounded-full border border-black/15 bg-black px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white">
                {locationLabel}
              </span>
            ) : null}
          </div>
          <p className="text-sm leading-6 text-[#3d3d3d]">
            {place.address ?? "Address under review"}
          </p>
          {detailLine ? (
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6b6b6b]">
              {detailLine}
            </p>
          ) : null}
        </div>

        <p className="min-h-[4.75rem] text-sm leading-6 text-[#3d3d3d]">{description}</p>

        <div className="flex flex-wrap items-center justify-between gap-3 pb-4">
          <div className="flex flex-wrap gap-2">
            {place.foodTypes.slice(0, 2).map((foodType) => (
              <span
                key={foodType}
                className="rounded-full border border-black/14 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-black"
              >
                {foodType}
              </span>
            ))}
            {place.tags.slice(0, 1).map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-black/14 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-black/70"
              >
                {tag}
              </span>
            ))}
          </div>
          {place.googleMapsUrl ? (
            <a
              href={place.googleMapsUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-black"
            >
              Open map
              <ExternalLink className="h-4 w-4" />
            </a>
          ) : null}
        </div>
      </div>

      <div className="border-t border-black">
        <PlaceImage
          placeId={place.id}
          name={place.name}
          hasGooglePhoto={Boolean(place.googlePhotoName)}
          imageUrl={place.googlePhotoUrl}
          compact
          showBadge={false}
        />
      </div>
    </article>
  );
}

export function PlaceExplorer({
  places,
  initialCollection,
  initialQuery = "",
  initialArrondissement = "",
  initialCuisine = "",
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
  const [cuisine, setCuisine] = useState(initialCuisine);
  const [tag, setTag] = useState(initialTag);
  const [priceRange, setPriceRange] = useState(initialPriceRange);
  const [sort, setSort] = useState<"recent" | "alphabetical" | "price">(initialSort);
  const [viewMode, setViewMode] = useState<ExplorerView>("map");
  const deferredQuery = useDeferredValue(query);

  const collectionPlaces = places.filter((place) => place.collection === collection);
  const collectionCounts = getCollectionCounts(places);
  const arrondissements = [...new Set(collectionPlaces.map((place) => place.arrondissement).filter(Boolean))] as string[];
  const cuisines = [...new Set(collectionPlaces.map((place) => place.cuisineType).filter(Boolean))] as string[];
  const priceRanges = [...new Set(collectionPlaces.map((place) => place.priceRange).filter(Boolean))] as string[];
  const themeCounts = getThemeCounts(collectionPlaces);
  const duplicateNameCounts = new Map<string, number>();
  for (const place of collectionPlaces) {
    const normalizedName = normalizeText(place.name);
    duplicateNameCounts.set(normalizedName, (duplicateNameCounts.get(normalizedName) ?? 0) + 1);
  }

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

      if (cuisine && place.cuisineType !== cuisine) {
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
    if (cuisine) {
      params.set("cuisine", cuisine);
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
  }, [anchor, arrondissement, collection, cuisine, pathname, priceRange, query, sort, tag]);

  const resetFilters = () => {
    setQuery("");
    setArrondissement("");
    setCuisine("");
    setTag("");
    setPriceRange("");
    setSort("recent");
  };

  const activeFilterCount = [query, arrondissement, cuisine, tag, priceRange].filter(Boolean).length;
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
              A cleaner way to browse Paris spots with ratings, photos, location tags, and better filters than the original Mapstr map.
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

        <div className="mt-6 grid gap-4 xl:grid-cols-[1.15fr_0.85fr_0.85fr_0.7fr]">
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
              Cuisine
            </span>
            <select
              value={cuisine}
              onChange={(event) => setCuisine(event.target.value)}
              className="retro-select"
            >
              <option value="">All</option>
              {cuisines.map((item) => (
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

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          {visiblePlaces.map((place) => (
            <PlaceListCard
              key={place.id}
              place={place}
              duplicateCount={duplicateNameCounts.get(normalizeText(place.name)) ?? 1}
            />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-5">
      <div className="border-b border-black pb-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-black/60">
              Paris Food Map
            </p>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
              {collections.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setCollection(item)}
                  className={`text-left text-[1.65rem] font-bold uppercase leading-none tracking-[-0.03em] transition ${
                    collection === item ? "bg-[#ffe04d] px-2 py-1 text-black" : "text-black/55 hover:text-black"
                  }`}
                >
                  {PLACE_COLLECTION_LABELS[item]}
                </button>
              ))}
            </div>
          </div>

          <div className="inline-flex items-center rounded-full border border-black bg-white p-1">
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`rounded-full px-4 py-2 text-[11px] font-bold uppercase tracking-[0.16em] ${
                viewMode === "list" ? "bg-black text-white" : "text-black"
              }`}
            >
              <span className="inline-flex items-center gap-2">
                <List className="h-4 w-4" />
                List
              </span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("map")}
              className={`rounded-full px-4 py-2 text-[11px] font-bold uppercase tracking-[0.16em] ${
                viewMode === "map" ? "bg-black text-white" : "text-black"
              }`}
            >
              <span className="inline-flex items-center gap-2">
                <MapIcon className="h-4 w-4" />
                Map
              </span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-black/12 pb-5">
            <div>
              <p className="text-[2rem] font-bold uppercase leading-none tracking-[-0.03em] text-black">
                {filteredPlaces.length.toLocaleString("en-GB")} results
              </p>
              <p className="mt-2 text-sm text-black/60">
                {placesWithRatings.toLocaleString("en-GB")} rated · {placesWithPhotos.toLocaleString("en-GB")} with photos
              </p>
            </div>

            <div className="flex w-full flex-wrap items-center gap-3 xl:w-auto">
              <label className="min-w-[18rem] flex-1 xl:w-[26rem] xl:flex-none">
                <div className="flex items-center gap-3 border border-black bg-white px-4 py-3">
                  <Search className="h-4 w-4 text-black/50" />
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Paris, arrondissement, restaurant..."
                    className="w-full bg-transparent text-sm uppercase tracking-[0.05em] text-black placeholder:text-black/45"
                  />
                </div>
              </label>
              {activeFilterCount ? (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="inline-flex items-center gap-2 border border-black px-4 py-3 text-[11px] font-bold uppercase tracking-[0.16em] text-black"
                >
                  <RotateCcw className="h-4 w-4" />
                  Reset
                </button>
              ) : null}
            </div>
          </div>

          {viewMode === "map" ? (
            <GoogleMyMapEmbed className="min-h-[860px]" />
          ) : (
            <div className="grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
              {filteredPlaces.map((place) => (
                <PlaceListCard
                  key={place.id}
                  place={place}
                  duplicateCount={duplicateNameCounts.get(normalizeText(place.name)) ?? 1}
                />
              ))}
              {filteredPlaces.length === 0 ? (
                <div className="rounded-[24px] border border-black bg-white p-8 text-center md:col-span-2 2xl:col-span-3">
                  <p className="text-[2rem] font-bold uppercase tracking-[-0.03em] text-black">
                    No places matched those filters
                  </p>
                  <p className="mt-3 text-sm text-black/60">
                    Try clearing a filter or switching to another list.
                  </p>
                </div>
              ) : null}
            </div>
          )}
        </div>

        <aside className="h-fit border border-black bg-white p-5 xl:sticky xl:top-24">
          <div className="space-y-5">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-black/60">
                Filters
              </p>
              <p className="mt-2 text-sm leading-6 text-black/65">
                Narrow the Paris list by arrondissement, cuisine, price, or one of the stronger food themes.
              </p>
            </div>

            <div className="grid gap-4">
              <label className="grid gap-2 text-sm">
                <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-black/55">
                  Arrondissement
                </span>
                <select
                  value={arrondissement}
                  onChange={(event) => setArrondissement(event.target.value)}
                  className="border border-black bg-white px-4 py-3 text-sm"
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
                <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-black/55">
                  Cuisine
                </span>
                <select
                  value={cuisine}
                  onChange={(event) => setCuisine(event.target.value)}
                  className="border border-black bg-white px-4 py-3 text-sm"
                >
                  <option value="">All</option>
                  {cuisines.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-2 text-sm">
                <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-black/55">
                  Price
                </span>
                <select
                  value={priceRange}
                  onChange={(event) => setPriceRange(event.target.value)}
                  className="border border-black bg-white px-4 py-3 text-sm"
                >
                  <option value="">All</option>
                  {priceRanges.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-2 text-sm">
                <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-black/55">
                  Sort
                </span>
                <select
                  value={sort}
                  onChange={(event) =>
                    setSort(event.target.value as "recent" | "alphabetical" | "price")
                  }
                  className="border border-black bg-white px-4 py-3 text-sm"
                >
                  <option value="recent">Recent</option>
                  <option value="alphabetical">A-Z</option>
                  <option value="price">Price</option>
                </select>
              </label>
            </div>

            <div className="border-t border-black/12 pt-5">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-black" />
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-black/60">
                  Food themes
                </p>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {themeCounts.map((item) => {
                  const active = normalizeText(tag) === normalizeText(item.label);
                  return (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => setTag(active ? "" : item.label)}
                      className={`border px-3 py-2 text-[11px] font-bold uppercase tracking-[0.12em] ${
                        active
                          ? "border-black bg-[#ffe04d] text-black"
                          : "border-black/15 bg-white text-black/75"
                      }`}
                    >
                      {item.label} [{item.count}]
                    </button>
                  );
                })}
              </div>
            </div>

            {viewMode === "map" ? (
              <div className="border-t border-black/12 pt-5 text-sm leading-6 text-black/60">
                <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-black/60">
                  <SlidersHorizontal className="h-4 w-4" />
                  Map mode
                </div>
                <p className="mt-3">
                  This uses the shared Google map with all the pins. Switch to list when you want richer cards, descriptions, cuisine, and price filtering.
                </p>
              </div>
            ) : null}
          </div>
        </aside>
      </div>
    </section>
  );
}
