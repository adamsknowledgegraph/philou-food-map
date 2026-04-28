import Link from "next/link";
import { ArrowRight, Compass, MapPinned, Search, Sparkles } from "lucide-react";
import { MapPanel } from "@/components/map-panel";
import { PlaceCard } from "@/components/place-card";
import { PlacesFilterForm } from "@/components/places-filter-form";
import { SiteHeader } from "@/components/site-header";
import { VintagePhoto } from "@/components/vintage-photo";
import {
  DEFAULT_FILTERS,
  PLACE_COLLECTION_LABELS,
  getFacets,
  getHomeData,
  getMapPlaces,
  getPlaces,
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
  };
  const [home, facets, featuredPlaces, mapPlaces] = await Promise.all([
    getHomeData(),
    getFacets(),
    getPlaces(filters),
    getMapPlaces(filters),
  ]);
  const cityCount = facets.cities.filter(Boolean).length;
  const featuredCount = featuredPlaces.length;
  const collectionLinks = facets.collections
    .filter((collection) =>
      [
        "gastro-higher-end",
        "restaurants",
        "cafe-bakery",
        "bars-wine",
      ].includes(collection),
    )
    .slice(0, 4);
  const tagLinks = facets.tags
    .filter((tag) =>
      ["Japanese", "Italian", "Bistrot", "Brunch", "Street food", "Wine bar"].includes(tag),
    )
    .slice(0, 4);
  const quickLinks = [
    ...collectionLinks.map((collection) => ({
      label: PLACE_COLLECTION_LABELS[collection],
      href: `/places?collection=${encodeURIComponent(collection)}`,
    })),
    ...tagLinks.map((tag) => ({
      label: tag,
      href: `/places?tag=${encodeURIComponent(tag)}`,
    })),
  ].slice(0, 8);

  return (
    <div className="page-shell pb-16">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 pt-6 sm:px-6 lg:px-8">
        <section className="surface retro-panel poster-bands relative overflow-hidden rounded-[36px] px-6 py-7 sm:px-8 lg:px-10 lg:py-8">
          <div className="sunburst" />
          <div className="grid gap-8 lg:grid-cols-[1.12fr_0.88fr] lg:items-start">
            <div className="space-y-5 lg:pt-3">
              <div className="eyebrow">
                <Sparkles className="h-4 w-4" />
                Paris food map
              </div>
              <div className="space-y-3">
                <h1 className="display max-w-4xl text-5xl leading-[0.92] text-[var(--foreground)] sm:text-6xl lg:text-[4.8rem]">
                  Your shortcut to the Paris spots worth saving.
                </h1>
                <p className="max-w-xl text-base leading-7 text-[var(--muted)] sm:text-lg">
                  Browse {home.totalPlaces.toLocaleString("en-GB")} mapped addresses across {cityCount} cities, with Paris front and center.
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
                  , one of France&apos;s best-known food creators for Paris restaurant picks and
                  save-worthy addresses.
                </p>
              </div>
              <form action="/" className="surface soft-stripes flex max-w-3xl flex-col gap-3 rounded-[28px] p-3 sm:flex-row">
                <div className="flex flex-1 items-center gap-3 rounded-[20px] border border-[var(--line)] bg-white/88 px-4 py-3">
                  <Search className="h-5 w-5 text-[var(--muted)]" />
                  <input
                    type="search"
                    name="q"
                    placeholder="Search a place or arrondissement"
                    className="w-full bg-transparent text-sm uppercase tracking-[0.08em] placeholder:text-[var(--muted)]"
                  />
                </div>
                <button className="cta-button px-5 py-3">
                  Explore Paris
                </button>
              </form>
              <div className="flex flex-wrap gap-3 text-sm text-[var(--muted)]">
                <div className="rounded-full border border-[var(--line)] bg-white/80 px-4 py-2.5">
                  {featuredCount.toLocaleString("en-GB")} Paris spots in view
                </div>
                <div className="rounded-full border border-[var(--line)] bg-white/80 px-4 py-2.5">
                  Best for gastro, cafes, bars, and bakeries
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

            <div className="grid gap-4 lg:pt-2">
              <VintagePhoto
                src="/photos/hero-brunch.jpg"
                alt="Brunch table in Paris"
                sizes="(max-width: 1024px) 100vw, 42vw"
                preload
                className="aspect-[1.28/1]"
                objectPosition="center 51%"
                label="Long lunches, terrace stops, bakery mornings"
              />
              <div className="grid gap-4 sm:grid-cols-[1.1fr_0.9fr]">
                <div className="surface retro-panel rounded-[28px] bg-[rgba(242,215,166,0.3)] p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
                    Mapped out
                  </p>
                  <div className="mt-3 flex items-end gap-3">
                    <p className="display text-5xl leading-none text-[var(--foreground)]">
                      {home.totalPlaces.toLocaleString("en-GB")}
                    </p>
                    <p className="pb-1 text-sm text-[var(--muted)]">addresses</p>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                    Paris is the main focus, with the rest of Philou&apos;s saved spots still searchable.
                  </p>
                </div>
                <div className="surface retro-panel rounded-[28px] bg-[rgba(181,216,223,0.26)] p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
                    Cities
                  </p>
                  <p className="display mt-3 text-5xl leading-none text-[var(--foreground)]">
                    {cityCount.toLocaleString("en-GB")}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                    Start with Paris, then branch out when you want weekend-trip ideas.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="map-guide" className="surface retro-panel rounded-[32px] p-6">
          <div className="section-split">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
                Explore the guide
              </p>
              <h2 className="display mt-2 text-4xl leading-none">Map first</h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)]">
                Filter by higher-end spots, cafes, bars, arrondissement, or vibe and watch the map update.
              </p>
            </div>
            <div className="rounded-full border border-[var(--line)] bg-white/80 px-4 py-2 text-sm uppercase tracking-[0.14em] text-[var(--muted)]">
              {mapPlaces.length.toLocaleString("en-GB")} pins showing
            </div>
          </div>
          <div className="mt-6">
            <PlacesFilterForm
              action="/"
              filters={filters}
              facets={facets}
              variant="consumer"
              cityMode="hidden"
            />
          </div>
          <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="surface retro-panel h-[580px] overflow-hidden rounded-[32px] p-3">
              <MapPanel places={mapPlaces} />
            </div>
            <div className="grid gap-4">
              {featuredPlaces.slice(0, 5).map((place) => (
                <PlaceCard key={place.id} place={place} compact showImage={false} />
              ))}
              <Link href="/places?city=Paris" className="ghost-button px-5 py-3">
                Browse all Paris places
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>

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
