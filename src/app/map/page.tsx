import { MapPanel } from "@/components/map-panel";
import { PlacesFilterForm } from "@/components/places-filter-form";
import { PlaceCard } from "@/components/place-card";
import { PostcardArt } from "@/components/postcard-art";
import { SiteHeader } from "@/components/site-header";
import { getFacets, getMapPlaces, getPlaces, resolveFilters, resolveSearchParams } from "@/lib/places";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function MapPage({ searchParams }: PageProps) {
  const params = resolveSearchParams(await searchParams);
  const filters = resolveFilters(params);
  const [places, mapPlaces, facets] = await Promise.all([
    getPlaces(filters),
    getMapPlaces(filters),
    getFacets(),
  ]);

  return (
    <div className="page-shell pb-16">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 pt-6 sm:px-6 lg:px-8">
        <section className="surface retro-panel poster-bands rounded-[32px] p-6">
          <div className="section-split">
            <div>
              <h1 className="display text-5xl leading-none">Discover the map</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">
                Browse higher-end spots, cafes, bars, and Paris neighborhoods on the map.
              </p>
            </div>
            <div className="postcard-frame">
              <PostcardArt seed="map-guide" alt="Map section artwork" compact />
            </div>
          </div>
          <div className="mt-6">
            <PlacesFilterForm action="/map" filters={filters} facets={facets} variant="consumer" />
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="surface retro-panel h-[580px] overflow-hidden rounded-[32px] p-3">
            <MapPanel places={mapPlaces} />
          </div>
          <div className="grid gap-4">
            {places.slice(0, 6).map((place) => (
              <PlaceCard key={place.id} place={place} compact />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
