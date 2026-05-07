import { PlaceExplorer } from "@/components/place-explorer";
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
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 pt-4 sm:px-6 lg:px-8">
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
