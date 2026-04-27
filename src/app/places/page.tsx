import { PlaceCard } from "@/components/place-card";
import { PlacesFilterForm } from "@/components/places-filter-form";
import { SiteHeader } from "@/components/site-header";
import { getFacets, getPlaces, resolveFilters, resolveSearchParams } from "@/lib/places";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function PlacesPage({ searchParams }: PageProps) {
  const params = resolveSearchParams(await searchParams);
  const filters = resolveFilters(params);
  const [places, facets] = await Promise.all([getPlaces(filters), getFacets()]);

  return (
    <div className="page-shell pb-16">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 pt-6 sm:px-6 lg:px-8">
        <section className="surface retro-panel poster-bands rounded-[32px] p-6">
          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
              Places
            </p>
            <h1 className="display text-5xl leading-none">Search, sort, and filter the guide</h1>
            <p className="max-w-2xl text-sm leading-6 text-[var(--muted)]">
              Filters are database-backed and keep the MVP useful even while richer
              fields are still under review.
            </p>
          </div>
          <div className="mt-6">
            <PlacesFilterForm action="/places" filters={filters} facets={facets} />
          </div>
        </section>

        <section className="flex items-center justify-between">
          <p className="eyebrow">
            {places.length} place{places.length === 1 ? "" : "s"} matched
          </p>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          {places.map((place) => (
            <PlaceCard key={place.id} place={place} />
          ))}
          {places.length === 0 ? (
            <div className="surface retro-panel col-span-full rounded-[32px] p-8 text-center">
              <p className="display text-3xl">No places matched those filters.</p>
              <p className="mt-3 text-sm text-[var(--muted)]">
                Try clearing one or two facets, or run the quick pipeline to pull in
                a larger source batch.
              </p>
            </div>
          ) : null}
        </section>
      </main>
    </div>
  );
}
