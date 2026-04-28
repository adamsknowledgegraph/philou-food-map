"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ExternalLink, MapPin, Search } from "lucide-react";
import { useDeferredValue, useEffect, useState } from "react";
import { GoogleRating } from "@/components/google-rating";
import { MapPanel } from "@/components/map-panel";
import { PlaceImage } from "@/components/place-image";
import {
  PLACE_COLLECTION_LABELS,
  type PlaceCollection,
  type ExplorerPlace,
} from "@/lib/place-collections";

type ExplorerMode = "home" | "map";

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

const collections: PlaceCollection[] = [
  "restaurants",
  "gastro-higher-end",
  "cafe-bakery",
  "bars-wine",
];

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
  const deferredQuery = useDeferredValue(query);

  const collectionPlaces = places.filter((place) => place.collection === collection);
  const arrondissements = [...new Set(collectionPlaces.map((place) => place.arrondissement).filter(Boolean))] as string[];
  const tags = [...new Set(collectionPlaces.flatMap((place) => place.tags))].slice(0, 18);
  const priceRanges = [...new Set(collectionPlaces.map((place) => place.priceRange).filter(Boolean))] as string[];

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

      if (tag && !place.tags.includes(tag)) {
        return false;
      }

      if (priceRange && place.priceRange !== priceRange) {
        return false;
      }

      return true;
    }),
    sort,
  );

  const activeSelectedId =
    selectedId && filteredPlaces.some((place) => place.id === selectedId)
      ? selectedId
      : filteredPlaces[0]?.id ?? null;

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

  const visiblePlaces = mode === "home" ? filteredPlaces.slice(0, 6) : filteredPlaces;
  const selectedCollectionLabel = PLACE_COLLECTION_LABELS[collection];

  return (
    <section className="surface retro-panel rounded-[32px] p-6">
      <div className="section-split">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
            Paris lists
          </p>
          <h2 className="display mt-2 text-4xl leading-none">{selectedCollectionLabel} in Paris</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)]">
            Browse one list at a time, filter instantly, and use the map to see where each pick sits in Paris.
          </p>
        </div>
        <div className="rounded-full border border-[var(--line)] bg-white/80 px-4 py-2 text-sm uppercase tracking-[0.14em] text-[var(--muted)]">
          {filteredPlaces.length.toLocaleString("en-GB")} places
        </div>
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
          </button>
        ))}
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-[1.3fr_0.7fr_0.7fr_0.6fr_0.6fr]">
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
            Vibe
          </span>
          <select
            value={tag}
            onChange={(event) => setTag(event.target.value)}
            className="retro-select"
          >
            <option value="">All</option>
            {tags.map((item) => (
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

      <div className={`mt-6 grid gap-6 ${mode === "home" ? "lg:grid-cols-[1.02fr_0.98fr]" : "lg:grid-cols-[0.95fr_1.05fr]"}`}>
        <div className={`grid gap-4 ${mode === "map" ? "max-h-[78vh] overflow-y-auto pr-1" : ""}`}>
          {visiblePlaces.map((place) => {
            const summary =
              place.philouSummary ||
              place.recommendationReason ||
              place.googleEditorialSummary ||
              place.recommendationSnippet ||
              "Saved from Philou's public Paris picks.";

            return (
              <article
                key={place.id}
                className={`surface retro-panel overflow-hidden rounded-[30px] bg-[rgba(255,247,236,0.92)] transition ${
                  activeSelectedId === place.id
                    ? "ring-2 ring-[rgba(240,143,102,0.38)]"
                    : "hover:-translate-y-0.5"
                }`}
                onMouseEnter={() => setSelectedId(place.id)}
              >
              <PlaceImage
                  placeId={place.id}
                  name={place.name}
                  hasGooglePhoto={Boolean(place.googlePhotoName)}
                  imageUrl={place.googlePhotoUrl}
                  compact
                />
                <div className="p-5">
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="space-y-2">
                        <div className="flex flex-wrap gap-2">
                          <span className="chip rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em]">
                            Philou pick
                          </span>
                          <GoogleRating
                            rating={place.googleRating}
                            count={place.googleUserRatingCount}
                            compact
                          />
                        </div>
                        <h3 className="display text-3xl leading-none text-[var(--foreground)]">
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
                      {place.foodTypes.slice(0, 3).map((foodType) => (
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
                      {place.arrondissement ? (
                        <span className="rounded-full border border-[var(--line)] bg-white/80 px-3 py-1 text-sm">
                          {place.arrondissement}
                        </span>
                      ) : null}
                      {place.priceRange ? (
                        <span className="rounded-full border border-[var(--line)] bg-white/80 px-3 py-1 text-sm">
                          {place.priceRange}
                        </span>
                      ) : null}
                    </div>

                    <p className="text-sm leading-6 text-[var(--muted)]">
                      {summary}
                    </p>

                    {place.recommendedItems.length ? (
                      <div className="rounded-[18px] bg-[rgba(242,215,166,0.22)] px-4 py-3 text-sm text-[var(--accent-ink)]">
                        <span className="font-semibold">What to order:</span>{" "}
                        {place.recommendedItems.slice(0, 3).join(", ")}
                      </div>
                    ) : null}
                  </div>
                </div>
              </article>
            );
          })}

          {visiblePlaces.length === 0 ? (
            <div className="surface retro-panel rounded-[30px] p-8 text-center">
              <p className="display text-3xl">No Paris places matched those filters.</p>
              <p className="mt-3 text-sm text-[var(--muted)]">
                Try another arrondissement, clear a vibe tag, or switch to a different list.
              </p>
            </div>
          ) : null}
        </div>

        <div className="grid gap-4">
          <div className={`surface retro-panel overflow-hidden rounded-[32px] p-3 ${mode === "home" ? "h-[430px]" : "h-[78vh]"}`}>
            <MapPanel
              places={mapPlaces}
              selectedId={activeSelectedId}
              onSelect={setSelectedId}
              zoom={mode === "home" ? 12 : 13}
            />
          </div>
          <div className="rounded-[26px] border border-[var(--line)] bg-white/78 px-5 py-4 text-sm leading-6 text-[var(--muted)]">
            <span className="font-semibold text-[var(--foreground)]">Mini map:</span> click a marker to
            highlight a place, or hover a card to pull the map toward that address.
          </div>
        </div>
      </div>
    </section>
  );
}
