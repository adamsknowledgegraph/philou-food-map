import Link from "next/link";
import { Compass, MapPinned, Search, Sparkles } from "lucide-react";
import { PlaceCard } from "@/components/place-card";
import { SiteHeader } from "@/components/site-header";
import { getFacets, getHomeData } from "@/lib/places";

export default async function HomePage() {
  const [home, facets] = await Promise.all([getHomeData(), getFacets()]);

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
                Paris food addresses recommended by Philippine Darblay
              </div>
              <div className="space-y-4">
                <h1 className="display max-w-4xl text-5xl leading-[0.92] text-[var(--foreground)] sm:text-7xl">
                  A pastel, searchable guide to the Paris places she keeps sending
                  people back to.
                </h1>
                <p className="max-w-2xl text-base leading-7 text-[var(--muted)] sm:text-lg">
                  Built from quick public sources first: Mapstr, Madame Figaro, and
                  other pages we can verify now. Instagram comes later as an
                  enrichment layer, not the bottleneck.
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
                    placeholder="Search a place, dish, arrondissement, or tag"
                    className="w-full bg-transparent text-sm uppercase tracking-[0.08em] placeholder:text-[var(--muted)]"
                  />
                </div>
                <button className="cta-button px-5 py-3">
                  Search the guide
                </button>
              </form>
              <div className="flex flex-wrap gap-3">
                <Link href="/map" className="ghost-button px-5 py-3">
                  Open map view
                </Link>
                <Link href="/places?sort=confidence" className="ghost-button px-5 py-3">
                  Browse top confidence spots
                </Link>
              </div>
              <div className="flex flex-wrap gap-2">
                {facets.tags.slice(0, 8).map((tag) => (
                  <Link
                    key={tag}
                    href={`/places?tag=${encodeURIComponent(tag)}`}
                    className="chip rounded-full px-3 py-1.5 text-sm uppercase tracking-[0.08em]"
                  >
                    #{tag}
                  </Link>
                ))}
              </div>
            </div>

            <div className="grid gap-4">
              <div className="surface retro-panel rounded-[32px] bg-[rgba(255,245,233,0.92)] p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--muted)]">
                  Current edition
                </p>
                <p className="display mt-3 text-4xl leading-none sm:text-5xl">
                  Paris, only the addresses worth circling.
                </p>
                <p className="mt-4 max-w-sm text-sm leading-6 text-[var(--muted)]">
                  Restaurants, cafes, bakeries, food shops, and bars gathered into a
                  reviewable database with evidence attached.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
                {[
                  {
                    label: "Live places",
                    value: String(home.totalPlaces),
                    detail: "Across Paris-focused public sources",
                    tone: "bg-[rgba(242,215,166,0.45)]",
                  },
                  {
                    label: "Needs review",
                    value: String(home.needsReviewCount),
                    detail: "Uncertain or incomplete records",
                    tone: "bg-[rgba(238,144,119,0.16)]",
                  },
                  {
                    label: "Usable sources",
                    value: String(home.totalSources),
                    detail: "Prioritized for non-Instagram extraction",
                    tone: "bg-[rgba(141,183,170,0.22)]",
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
            <div className="flex items-center gap-3">
              <Compass className="h-5 w-5 text-[var(--accent-ink)]" />
              <h2 className="display text-3xl">Featured neighborhoods</h2>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {facets.arrondissements.slice(0, 8).map((arrondissement) => (
                <Link
                  key={arrondissement}
                  href={`/places?arrondissement=${encodeURIComponent(arrondissement)}`}
                  className="soft-stripes rounded-[24px] border border-[var(--line)] bg-white/82 p-4 transition hover:-translate-y-0.5"
                >
                  <p className="display text-2xl leading-none">{arrondissement}</p>
                  <p className="mt-1 text-sm text-[var(--muted)]">
                    Explore the latest nearby recommendations.
                  </p>
                </Link>
              ))}
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
