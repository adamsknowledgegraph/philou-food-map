import Link from "next/link";
import { ArrowRight, MapPinned, Sparkles } from "lucide-react";
import { GoogleRating } from "@/components/google-rating";
import { PlaceExplorer } from "@/components/place-explorer";
import { PlaceImage } from "@/components/place-image";
import { SiteHeader } from "@/components/site-header";
import {
  DEFAULT_FILTERS,
  type ExplorerPlace,
  PLACE_COLLECTION_LABELS,
  type PlaceCollection,
  getExplorerPlaces,
  getHomeData,
  resolveFilters,
  resolveSearchParams,
} from "@/lib/places";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

type EditorialModule = {
  label: string;
  title: string;
  href: string;
  blurb: string;
  place: ExplorerPlace;
  collection: PlaceCollection;
  compact?: boolean;
};

function getPhotoPlaces(places: ExplorerPlace[]) {
  return places
    .filter((place) => Boolean(place.googlePhotoName || place.googlePhotoUrl))
    .sort((left, right) => {
      const leftScore =
        (left.googleRating ?? 0) * 100 + (left.googleUserRatingCount ?? 0);
      const rightScore =
        (right.googleRating ?? 0) * 100 + (right.googleUserRatingCount ?? 0);

      return rightScore - leftScore;
    });
}

function pickPlace(
  places: ExplorerPlace[],
  collection: PlaceCollection,
  fallbackIndex = 0,
) {
  const inCollection = places.filter((place) => place.collection === collection);
  return inCollection[fallbackIndex] ?? places[fallbackIndex] ?? places[0];
}

function summarizePlace(place: ExplorerPlace) {
  const summary =
    place.googleEditorialSummary ||
    place.googleNeighborhoodSummary ||
    place.philouSummary ||
    place.recommendationReason ||
    place.recommendationSnippet ||
    "Saved from trusted Paris food references.";

  return summary.length > 125 ? `${summary.slice(0, 122).trim()}…` : summary;
}

function getPlaceMeta(place: ExplorerPlace) {
  return [place.arrondissement, place.cuisineType, place.priceRange]
    .filter(Boolean)
    .join(" · ");
}

function EditorialCard({
  module,
}: {
  module: EditorialModule;
}) {
  const meta = getPlaceMeta(module.place);

  return (
    <Link
      href={module.href}
      className={`surface retro-panel group flex overflow-hidden rounded-[28px] bg-[rgba(255,248,236,0.94)] transition duration-200 hover:-translate-y-0.5 ${
        module.compact ? "flex-col" : "flex-col"
      }`}
    >
      <div className="border-b border-[var(--line)]">
        <PlaceImage
          placeId={module.place.id}
          name={module.place.name}
          hasGooglePhoto={Boolean(module.place.googlePhotoName)}
          imageUrl={module.place.googlePhotoUrl}
          compact
          showBadge={false}
        />
      </div>
      <div className="space-y-3 p-5">
        <div className="flex items-center justify-between gap-3">
          <span className="eyebrow px-3 py-2">{module.label}</span>
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
            {PLACE_COLLECTION_LABELS[module.collection]}
          </span>
        </div>
        <div className="space-y-2">
          <h2 className="display text-[2rem] leading-[0.95] text-[var(--foreground)]">
            {module.title}
          </h2>
          <p className="text-sm leading-6 text-[var(--muted)]">{module.blurb}</p>
        </div>
        <div className="rounded-[20px] border border-[var(--line)] bg-white/80 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <GoogleRating
              rating={module.place.googleRating}
              count={module.place.googleUserRatingCount}
              compact
            />
            {meta ? (
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
                {meta}
              </span>
            ) : null}
          </div>
          <p className="mt-3 display text-[1.7rem] leading-none">
            {module.place.name}
          </p>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
            {summarizePlace(module.place)}
          </p>
        </div>
      </div>
    </Link>
  );
}

export default async function HomePage({ searchParams }: PageProps) {
  const params = resolveSearchParams(await searchParams);
  const filters = {
    ...DEFAULT_FILTERS,
    ...resolveFilters(params),
    city: "Paris",
    collection: params.collection || "restaurants",
  };

  const [home, parisPlaces] = await Promise.all([
    getHomeData(),
    getExplorerPlaces("Paris"),
  ]);

  const selectedCollection = (filters.collection || "restaurants") as PlaceCollection;
  const featuredCount = parisPlaces.length;
  const placesWithRatings = parisPlaces.filter(
    (place) => typeof place.googleRating === "number",
  ).length;
  const placesWithPhotos = parisPlaces.filter(
    (place) => Boolean(place.googlePhotoName || place.googlePhotoUrl),
  ).length;

  const photoPlaces = getPhotoPlaces(parisPlaces);
  const mainPlace = pickPlace(photoPlaces, "restaurants");
  const cafePlace = pickPlace(photoPlaces, "cafe-bakery");
  const barPlace = pickPlace(photoPlaces, "bars-wine");

  const modules: EditorialModule[] = [
    {
      label: "Main",
      title: "Start with the best Paris restaurants.",
      href: "/map?city=Paris&collection=restaurants",
      blurb:
        "The strongest all-around view of the city: destination tables, bistros, and the places people actually save.",
      place: mainPlace,
      collection: "restaurants",
    },
    {
      label: "29 April",
      title: "Cafe mornings and bakery stops.",
      href: "/map?city=Paris&collection=cafe-bakery",
      blurb:
        "A softer edit for coffee runs, viennoiseries, and the addresses that make a neighborhood feel right.",
      place: cafePlace,
      collection: "cafe-bakery",
      compact: true,
    },
    {
      label: "24 April",
      title: "Bars, wine, and late lunches.",
      href: "/map?city=Paris&collection=bars-wine",
      blurb:
        "Where to end up after work: natural wine counters, polished bars, and low-light spots that still feel easy.",
      place: barPlace,
      collection: "bars-wine",
      compact: true,
    },
  ];

  return (
    <div className="page-shell pb-16">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 pt-6 sm:px-6 lg:px-8">
        <section className="surface retro-panel poster-bands relative overflow-hidden rounded-[36px] px-6 py-6 sm:px-8 lg:px-10 lg:py-8">
          <div className="sunburst" />
          <div className="grid gap-6 xl:grid-cols-[0.96fr_1.04fr]">
            <div className="space-y-5 xl:pr-4">
              <div className="eyebrow">
                <Sparkles className="h-4 w-4" />
                Paris Food Map
              </div>
              <div className="space-y-3">
                <h1 className="display max-w-3xl text-5xl leading-[0.92] text-[var(--foreground)] sm:text-6xl">
                  The Paris restaurants worth knowing, in one clean map.
                </h1>
                <p className="max-w-xl text-base leading-7 text-[var(--muted)] sm:text-lg">
                  Top Paris food references and influencer picks, cleaned up into a knowledge graph and turned into a guide you can actually browse.
                </p>
                <p className="max-w-xl text-sm leading-6 text-[var(--muted)]">
                  {featuredCount.toLocaleString("en-GB")} Paris addresses,{" "}
                  {placesWithRatings.toLocaleString("en-GB")} with ratings,{" "}
                  {placesWithPhotos.toLocaleString("en-GB")} with photos, across{" "}
                  {home.totalSources.toLocaleString("en-GB")} public sources.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link href="/map?city=Paris&collection=restaurants" className="cta-button px-5 py-3">
                  Open the Paris map
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/places?city=Paris&collection=restaurants" className="ghost-button px-5 py-3">
                  Browse the list
                </Link>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="surface retro-panel rounded-[24px] bg-white/72 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
                    Paris
                  </p>
                  <p className="display mt-2 text-4xl leading-none">
                    {featuredCount.toLocaleString("en-GB")}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                    Places mapped and ready to filter.
                  </p>
                </div>
                <div className="surface retro-panel rounded-[24px] bg-white/72 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
                    Photos
                  </p>
                  <p className="display mt-2 text-4xl leading-none">
                    {placesWithPhotos.toLocaleString("en-GB")}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                    Spots with real Google place imagery.
                  </p>
                </div>
                <div className="surface retro-panel rounded-[24px] bg-white/72 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
                    Sources
                  </p>
                  <p className="display mt-2 text-4xl leading-none">
                    {home.totalSources.toLocaleString("en-GB")}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                    Guides, creators, lists, and public references.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-[1.12fr_0.88fr]">
              <EditorialCard module={modules[0]} />
              <div className="grid gap-4">
                <EditorialCard module={modules[1]} />
                <EditorialCard module={modules[2]} />
              </div>
            </div>
          </div>
        </section>

        <section className="surface retro-panel rounded-[32px] px-6 py-5 sm:px-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
                Browse the guide
              </p>
              <h2 className="display text-4xl leading-none">
                Filter it like a real Paris cheat sheet.
              </h2>
              <p className="max-w-2xl text-sm leading-6 text-[var(--muted)]">
                Switch between restaurants, cafes, bakeries, and bars, then narrow by arrondissement, cuisine, and price.
              </p>
            </div>
            <Link href="/map?city=Paris&collection=restaurants" className="pill-button px-4 py-2.5">
              <MapPinned className="h-4 w-4" />
              Full map
            </Link>
          </div>
        </section>

        <div id="map-guide">
          <PlaceExplorer
            places={parisPlaces}
            initialCollection={selectedCollection}
            initialQuery={filters.q}
            initialArrondissement={filters.arrondissement}
            initialCuisine={filters.cuisine}
            initialTag={filters.tag}
            initialPriceRange={filters.priceRange}
            initialSort={
              (filters.sort as "recent" | "alphabetical" | "price") || "recent"
            }
            mode="home"
            anchor="#map-guide"
          />
        </div>
      </main>
    </div>
  );
}
