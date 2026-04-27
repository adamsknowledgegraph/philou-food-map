import Image from "next/image";
import Link from "next/link";
import { Compass, MapPinned, Search, Sparkles } from "lucide-react";
import { PlaceCard } from "@/components/place-card";
import { SiteHeader } from "@/components/site-header";
import { getFacets, getHomeData } from "@/lib/places";

const arrondissementCards = [
  {
    image: "/postcards/arrondissement-cafe.svg",
    note: "Cafe mornings",
  },
  {
    image: "/postcards/arrondissement-river.svg",
    note: "Canal walks",
  },
  {
    image: "/postcards/arrondissement-awning.svg",
    note: "Lunch terraces",
  },
  {
    image: "/postcards/arrondissement-night.svg",
    note: "Late dinners",
  },
  {
    image: "/postcards/terrace-sun.svg",
    note: "Sunny corners",
  },
  {
    image: "/postcards/city-spritz.svg",
    note: "Cocktail stops",
  },
  {
    image: "/postcards/arrondissement-market.svg",
    note: "Market picks",
  },
  {
    image: "/postcards/arrondissement-bistro.svg",
    note: "Bistro nights",
  },
] as const;

export default async function HomePage() {
  const [home, facets] = await Promise.all([getHomeData(), getFacets()]);
  const cityCount = facets.cities.filter(Boolean).length;
  const cuisineLinks = facets.cuisines
    .filter(Boolean)
    .filter((cuisine) =>
      [
        "French",
        "Japanese",
        "Italian",
        "Mediterranean",
        "Filipino",
        "Portuguese",
      ].includes(cuisine),
    )
    .slice(0, 5);
  const priceLinks = facets.priceRanges.filter(Boolean).slice(0, 3);
  const quickLinks = [
    ...cuisineLinks.map((cuisine) => ({
      label: cuisine,
      href: `/places?cuisine=${encodeURIComponent(cuisine)}`,
    })),
    ...priceLinks.map((priceRange) => ({
      label: priceRange,
      href: `/places?priceRange=${encodeURIComponent(priceRange)}`,
    })),
  ].slice(0, 8);

  return (
    <div className="page-shell pb-16">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-4 pt-6 sm:px-6 lg:px-8">
        <section className="surface retro-panel poster-bands grid-fade relative overflow-hidden rounded-[36px] px-6 py-8 sm:px-8 lg:px-12 lg:py-12">
          <div className="sunburst" />
          <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
            <div className="space-y-6">
              <div className="eyebrow">
                <Sparkles className="h-4 w-4" />
                Where to eat next
              </div>
              <div className="space-y-4">
                <h1 className="display max-w-4xl text-5xl leading-[0.92] text-[var(--foreground)] sm:text-7xl">
                  Find the spots Philou makes you want to book immediately.
                </h1>
                <p className="max-w-xl text-base leading-7 text-[var(--muted)] sm:text-lg">
                  {home.totalPlaces.toLocaleString("en-GB")} mapped addresses across {cityCount} cities, with Paris front and center.
                </p>
              </div>
              <form
                action="/places"
                className="surface soft-stripes flex flex-col gap-3 rounded-[28px] p-3 sm:flex-row"
              >
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
                  Search the guide
                </button>
              </form>
              <div className="flex flex-wrap gap-3">
                <Link href="/map" className="cta-button px-5 py-3">
                  Discover the map
                </Link>
                <Link href="/places?sort=confidence" className="ghost-button px-5 py-3">
                  Browse the guide
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

            <div className="grid gap-4">
              <div className="grid gap-4 sm:grid-cols-[1.15fr_0.85fr]">
                <div className="surface retro-panel overflow-hidden rounded-[32px]">
                  <div className="relative aspect-[5/4] bg-[rgba(242,215,166,0.18)]">
                    <Image
                      src="/postcards/hero-croissant.svg"
                      alt="Croissant illustration"
                      fill
                      className="object-cover"
                      sizes="(max-width: 1024px) 100vw, 40vw"
                    />
                  </div>
                </div>
                <div className="grid gap-4">
                  <div className="surface retro-panel overflow-hidden rounded-[28px]">
                    <div className="relative aspect-[1/1] bg-[rgba(181,216,223,0.2)]">
                      <Image
                        src="/postcards/hero-noodles.svg"
                        alt="Noodle bowl illustration"
                        fill
                        className="object-cover"
                        sizes="(max-width: 1024px) 100vw, 20vw"
                      />
                    </div>
                  </div>
                  <div className="surface retro-panel overflow-hidden rounded-[28px]">
                    <div className="relative aspect-[1/1] bg-[rgba(240,143,102,0.12)]">
                      <Image
                        src="/postcards/hero-spritz.svg"
                        alt="Spritz illustration"
                        fill
                        className="object-cover"
                        sizes="(max-width: 1024px) 100vw, 20vw"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
                {[
                  {
                    label: "Mapped out",
                    value: home.totalPlaces.toLocaleString("en-GB"),
                    detail: "Addresses ready to browse",
                    tone: "bg-[rgba(242,215,166,0.45)]",
                  },
                  {
                    label: "Cities",
                    value: cityCount.toLocaleString("en-GB"),
                    detail: "Paris is the main focus",
                    tone: "bg-[rgba(181,216,223,0.24)]",
                  },
                  {
                    label: "To review",
                    value: home.needsReviewCount.toLocaleString("en-GB"),
                    detail: "A few records still need checking",
                    tone: "bg-[rgba(238,144,119,0.16)]",
                  },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className={`surface retro-panel rounded-[28px] p-5 ${stat.tone}`}
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
                      {stat.label}
                    </p>
                    <p className="display mt-3 text-5xl leading-none text-[var(--foreground)]">
                      {stat.value}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                      {stat.detail}
                    </p>
                  </div>
                ))}
              </div>
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
                    <div className="relative aspect-[5/3] overflow-hidden border-b border-[var(--line)] bg-[rgba(242,215,166,0.24)]">
                      <Image
                        src={artwork.image}
                        alt={`${arrondissement} postcard`}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 100vw, 50vw"
                      />
                      <div className="absolute bottom-3 left-3 rounded-full border border-[rgba(112,86,59,0.18)] bg-[rgba(255,248,235,0.88)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--accent-ink)]">
                        {artwork.note}
                      </div>
                    </div>
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
              <h2 className="display text-3xl">Recently added recommendations</h2>
            </div>
            <div className="mt-5 grid gap-4">
              {home.recentPlaces.slice(0, 4).map((place) => (
                <PlaceCard key={place.id} place={place} compact />
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
