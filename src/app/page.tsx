import Link from "next/link";
import { Compass, MapPinned, Search, Sparkles } from "lucide-react";
import { PlaceExplorer } from "@/components/place-explorer";
import { PlaceCard } from "@/components/place-card";
import { SiteHeader } from "@/components/site-header";
import { VintagePhoto } from "@/components/vintage-photo";
import {
  DEFAULT_FILTERS,
  PLACE_COLLECTION_LABELS,
  type PlaceCollection,
  getExplorerPlaces,
  getFacets,
  getHomeData,
  resolveFilters,
  resolveSearchParams,
} from "@/lib/places";

const arrondissementCards = [
  {
    image: "/photos/paris-cafe-street.jpg",
    note: "Cafe mornings",
    position: "center 52%",
  },
  {
    image: "/photos/paris-cafe-terrace.jpg",
    note: "Terrace lunch",
    position: "center 52%",
  },
  {
    image: "/photos/cafe-de-flore.jpg",
    note: "Classic Paris",
    position: "center 30%",
  },
  {
    image: "/photos/paris-brasserie.jpg",
    note: "Brasserie hour",
    position: "center 35%",
  },
  {
    image: "/photos/hero-croissants.jpg",
    note: "Bakery stop",
    position: "center 55%",
  },
  {
    image: "/photos/hero-brunch.jpg",
    note: "Weekend brunch",
    position: "center 48%",
  },
  {
    image: "/photos/paris-cafe-terrace.jpg",
    note: "Street tables",
    position: "center 52%",
  },
  {
    image: "/photos/cafe-de-flore.jpg",
    note: "Old-school cafe",
    position: "center 30%",
  },
] as const;

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function HomePage({ searchParams }: PageProps) {
  const params = resolveSearchParams(await searchParams);
  const filters = {
    ...DEFAULT_FILTERS,
    ...resolveFilters(params),
    city: params.city || "Paris",
    collection: params.collection || "restaurants",
  };
  const [home, facets, parisPlaces] = await Promise.all([
    getHomeData(),
    getFacets(),
    getExplorerPlaces("Paris"),
  ]);
  const featuredCount = parisPlaces.length;
  const parisCollections: PlaceCollection[] = [
    "gastro-higher-end",
    "restaurants",
    "cafe-bakery",
    "bars-wine",
  ];
  const quickLinks = parisCollections.map((collection) => ({
    label: PLACE_COLLECTION_LABELS[collection],
    href: `/places?city=Paris&collection=${encodeURIComponent(collection)}`,
  }));
  const selectedCollection = (filters.collection || "restaurants") as PlaceCollection;

  return (
    <div className="page-shell pb-16">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 pt-6 sm:px-6 lg:px-8">
        <section className="surface retro-panel poster-bands relative overflow-hidden rounded-[36px] px-6 py-6 sm:px-8 lg:px-10 lg:py-7">
          <div className="sunburst" />
          <div className="grid gap-6 lg:grid-cols-[1.12fr_0.88fr] lg:items-start">
            <div className="space-y-4 lg:pt-2">
              <div className="eyebrow">
                <Sparkles className="h-4 w-4" />
                Top restaurants in Paris
              </div>
              <div className="space-y-2.5">
                <h1 className="display max-w-4xl text-4xl leading-[0.94] text-[var(--foreground)] sm:text-5xl lg:text-[4.1rem]">
                  Top restaurants in Paris, all in one map.
                </h1>
                <p className="max-w-xl text-base leading-7 text-[var(--muted)] sm:text-lg">
                  Browse {featuredCount.toLocaleString("en-GB")} Paris addresses pulled from Philou&apos;s public picks, from higher-end tables to bakeries, wine bars, and neighborhood favorites.
                </p>
                <p className="max-w-xl text-sm leading-6 text-[var(--muted)]">
                  Built from public recommendations by{" "}
                  <a
                    href="https://www.instagram.com/philoudarblay/"
                    target="_blank"
                    rel="noreferrer"
                    className="editorial-link"
                  >
                    Philippine Darblay
                  </a>
                  , one of France&apos;s best-known food creators for restaurant picks in Paris.
                </p>
              </div>
              <form action="/" className="surface soft-stripes flex max-w-3xl flex-col gap-3 rounded-[28px] p-3 sm:flex-row">
                <div className="flex flex-1 items-center gap-3 rounded-[20px] border border-[var(--line)] bg-white/88 px-4 py-3">
                  <Search className="h-5 w-5 text-[var(--muted)]" />
                  <input
                    type="search"
                    name="q"
                    placeholder="Search a Paris place or arrondissement"
                    className="w-full bg-transparent text-sm uppercase tracking-[0.08em] placeholder:text-[var(--muted)]"
                  />
                </div>
                <button className="cta-button px-5 py-3">
                  Explore Paris
                </button>
              </form>
              <div className="flex flex-wrap gap-3 text-sm text-[var(--muted)]">
                <div className="rounded-full border border-[var(--line)] bg-white/80 px-4 py-2.5">
                  {featuredCount.toLocaleString("en-GB")} {selectedCollection === "restaurants" ? "Paris restaurants" : "Paris spots"} mapped
                </div>
                <div className="rounded-full border border-[var(--line)] bg-white/80 px-4 py-2.5">
                  Restaurants, cafes, bakeries, and bars
                </div>
                <Link href="#map-guide" className="ghost-button px-5 py-2.5">
                  See the map
                </Link>
              </div>
              <div className="flex flex-wrap gap-2">
                {quickLinks.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="chip rounded-full px-3 py-1.5 text-sm uppercase tracking-[0.08em]"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>

            <div className="grid gap-4 lg:pt-1">
              <VintagePhoto
                src="/photos/hero-brunch.jpg"
                alt="Brunch table in Paris"
                sizes="(max-width: 1024px) 100vw, 42vw"
                preload
                className="aspect-[1.55/1]"
                objectPosition="center 51%"
                label="Paris lunches, terraces, and bakery stops"
              />
              <div className="grid gap-4 sm:grid-cols-[1.15fr_0.85fr]">
                <div className="surface retro-panel rounded-[28px] bg-[rgba(242,215,166,0.3)] p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
                    Paris mapped out
                  </p>
                  <div className="mt-3 flex items-end gap-3">
                    <p className="display text-5xl leading-none text-[var(--foreground)]">
                      {featuredCount.toLocaleString("en-GB")}
                    </p>
                    <p className="pb-1 text-sm text-[var(--muted)]">{selectedCollection === "restaurants" ? "restaurants" : "places"}</p>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                    A tighter Paris-first guide, focused on the spots most worth saving.
                  </p>
                </div>
                <VintagePhoto
                  src="/photos/hero-croissants.jpg"
                  alt="Croissants in a Paris bakery"
                  sizes="(max-width: 1024px) 100vw, 20vw"
                  className="aspect-[1.05/1]"
                  objectPosition="center 55%"
                  label="Bakery mornings"
                />
              </div>
            </div>
          </div>
        </section>

        <div id="map-guide">
          <PlaceExplorer
            places={parisPlaces}
            initialCollection={selectedCollection}
            initialQuery={filters.q}
            initialArrondissement={filters.arrondissement}
            initialTag={filters.tag}
            initialPriceRange={filters.priceRange}
            initialSort={(filters.sort as "recent" | "alphabetical" | "price") || "recent"}
            mode="home"
            anchor="#map-guide"
          />
        </div>

        <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="surface retro-panel rounded-[32px] p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Compass className="h-5 w-5 text-[var(--accent-ink)]" />
                <h2 className="display text-3xl">By arrondissement</h2>
              </div>
              <Link href="/map" className="pill-button px-4 py-2.5">
                Discover the map
              </Link>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {facets.arrondissements.slice(0, 8).map((arrondissement, index) => {
                const artwork = arrondissementCards[index % arrondissementCards.length];

                return (
                  <Link
                    key={arrondissement}
                    href={`/places?arrondissement=${encodeURIComponent(arrondissement)}`}
                    className="overflow-hidden rounded-[24px] border border-[var(--line)] bg-white/82 transition hover:-translate-y-0.5"
                  >
                    <VintagePhoto
                      src={artwork.image}
                      alt={`${arrondissement} scene`}
                      sizes="(max-width: 640px) 100vw, 50vw"
                      className="aspect-[5/3] rounded-none border-b border-[var(--line)] p-3"
                      objectPosition={artwork.position}
                      label={artwork.note}
                    />
                    <div className="soft-stripes p-4">
                      <p className="display text-2xl leading-none">{arrondissement}</p>
                      <p className="mt-1 text-sm text-[var(--muted)]">
                        Browse the saved spots.
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="surface retro-panel rounded-[32px] p-6">
            <div className="flex items-center gap-3">
              <MapPinned className="h-5 w-5 text-[var(--accent)]" />
              <h2 className="display text-3xl">Recently added</h2>
            </div>
            <div className="mt-5 grid gap-4">
              {home.recentPlaces.slice(0, 4).map((place) => (
                <PlaceCard key={place.id} place={place} compact showImage={false} />
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
