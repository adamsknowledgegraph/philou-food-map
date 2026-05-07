import { PlaceExplorer } from "@/components/place-explorer";
import { PostcardArt } from "@/components/postcard-art";
import { SiteHeader } from "@/components/site-header";
import {
  type PlaceCollection,
  getExplorerPlaces,
  resolveFilters,
  resolveSearchParams,
} from "@/lib/places";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function MapPage({ searchParams }: PageProps) {
  const params = resolveSearchParams(await searchParams);
  const filters = resolveFilters(params);
  const parisPlaces = await getExplorerPlaces("Paris");
  const initialCollection = (filters.collection || "restaurants") as PlaceCollection;

  return (
    <div className="page-shell pb-16">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 pt-6 sm:px-6 lg:px-8">
        <section className="surface retro-panel poster-bands rounded-[32px] p-6">
          <div className="section-split">
            <div>
              <h1 className="display text-5xl leading-none">Paris Food Map</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">
                A cleaner way to browse Paris restaurants, cafes, bakeries, and bars using top food references and richer place data.
              </p>
            </div>
            <div className="postcard-frame">
              <PostcardArt seed="map-guide" alt="Map section artwork" compact />
            </div>
          </div>
        </section>

        <PlaceExplorer
          places={parisPlaces}
          initialCollection={initialCollection}
          initialQuery={filters.q}
          initialArrondissement={filters.arrondissement}
          initialCuisine={filters.cuisine}
          initialTag={filters.tag}
          initialPriceRange={filters.priceRange}
          initialSort={(filters.sort as "recent" | "alphabetical" | "price") || "recent"}
          mode="map"
        />
      </main>
    </div>
  );
}
