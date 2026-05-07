import Link from "next/link";
import { Download, ExternalLink, MapPinned } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { VintagePhoto } from "@/components/vintage-photo";
import { getHandyMapCards, type HandyMapPlace } from "@/lib/handy-maps";
import { getExplorerPlaces } from "@/lib/places";

function toHandyMapPlace(place: Awaited<ReturnType<typeof getExplorerPlaces>>[number]): HandyMapPlace {
  return {
    id: place.id,
    name: place.name,
    address: place.address,
    city: place.city,
    arrondissement: place.arrondissement,
    neighborhood: place.neighborhood,
    cuisineType: place.cuisineType,
    foodTypes: place.foodTypes,
    priceRange: place.priceRange,
    tags: place.tags,
    collection: place.collection,
    googleMapsUrl: place.googleMapsUrl,
    googleRating: place.googleRating,
    googleUserRatingCount: place.googleUserRatingCount,
    googleEditorialSummary: place.googleEditorialSummary,
    googlePrimaryTypeLabel: place.googlePrimaryTypeLabel,
    latitude: place.latitude,
    longitude: place.longitude,
    philouSummary: place.philouSummary,
  };
}

export default async function HandyMapsPage() {
  const parisPlaces = await getExplorerPlaces("Paris");
  const maps = getHandyMapCards(parisPlaces.map(toHandyMapPlace));
  const totalMapCount = maps.reduce((sum, map) => sum + map.count, 0);

  return (
    <div className="page-shell pb-16">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 pt-6 sm:px-6 lg:px-8">
        <section className="surface retro-panel poster-bands relative overflow-hidden rounded-[34px] px-6 py-6 sm:px-8 lg:px-10">
          <div className="sunburst" />
          <div className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr] lg:items-center">
            <div className="space-y-4">
              <div className="eyebrow">
                <MapPinned className="h-4 w-4" />
                Handy maps of Paris
              </div>
              <div className="space-y-3">
                <h1 className="display max-w-4xl text-4xl leading-[0.94] sm:text-5xl lg:text-[4rem]">
                  Philou&apos;s Paris, split into the maps people actually want.
                </h1>
                <p className="max-w-2xl text-base leading-7 text-[var(--muted)] sm:text-lg">
                  Open a focused Paris map for restaurants, cafes, bars, bistros, and more, or download each list for Google My Maps.
                </p>
              </div>
              <div className="flex flex-wrap gap-3 text-sm text-[var(--muted)]">
                <div className="rounded-full border border-[var(--line)] bg-white/82 px-4 py-2.5">
                  {parisPlaces.length.toLocaleString("en-GB")} Paris addresses
                </div>
                <div className="rounded-full border border-[var(--line)] bg-white/82 px-4 py-2.5">
                  {maps.length} themed maps
                </div>
                <div className="rounded-full border border-[var(--line)] bg-white/82 px-4 py-2.5">
                  {totalMapCount.toLocaleString("en-GB")} total saves across lists
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link href="/map?city=Paris" className="cta-button px-5 py-3">
                  Open the full Paris map
                </Link>
                <a href="/exports/philou-paris-all-paris-google-mymaps.csv" className="ghost-button px-5 py-3">
                  Download the full CSV
                </a>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <VintagePhoto
                src="/photos/paris-cafe-street.jpg"
                alt="Cafe-lined Paris street"
                sizes="(max-width: 1024px) 100vw, 28vw"
                className="aspect-[1.04/1]"
                objectPosition="center 52%"
                label="Streets worth saving"
              />
              <VintagePhoto
                src="/photos/hero-croissants.jpg"
                alt="Croissants in Paris"
                sizes="(max-width: 1024px) 100vw, 28vw"
                className="aspect-[1.04/1]"
                objectPosition="center 55%"
                label="Bakery mornings"
              />
            </div>
          </div>
        </section>

        <section className="surface retro-panel rounded-[34px] p-6 sm:p-8">
          <div className="section-split gap-4">
            <div>
              <h2 className="display text-4xl leading-none">Choose a Paris list</h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)]">
                Each list opens inside the app map, and each one also comes with CSV and KML downloads ready for Google My Maps.
              </p>
            </div>
            <div className="rounded-[24px] border border-[var(--line)] bg-white/80 p-4 text-sm leading-6 text-[var(--muted)]">
              Import tip: use the CSV file in Google My Maps for the quickest shareable version, or KML if you want a more portable map file.
            </div>
          </div>

          <div className="mt-6 grid gap-5 lg:grid-cols-2">
            {maps.map((map) => (
              <article
                key={map.slug}
                className="overflow-hidden rounded-[28px] border border-[var(--line)] bg-white/86 shadow-[var(--shadow-soft)]"
              >
                <VintagePhoto
                  src={map.image}
                  alt={map.title}
                  sizes="(max-width: 1024px) 100vw, 48vw"
                  className="aspect-[1.8/1] rounded-none border-b border-[var(--line)] p-3"
                  objectPosition={map.imagePosition}
                  label={map.kicker}
                />
                <div className="p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="display text-3xl leading-none">{map.title}</h3>
                      <p className="mt-3 max-w-xl text-sm leading-6 text-[var(--muted)]">
                        {map.description}
                      </p>
                    </div>
                    <div className="rounded-full border border-[var(--line)] bg-[rgba(242,207,118,0.24)] px-4 py-2 text-sm font-semibold uppercase tracking-[0.16em] text-[var(--accent-ink)]">
                      {map.count.toLocaleString("en-GB")} places
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-3">
                    <Link href={map.browseHref} className="cta-button px-4 py-2.5">
                      <ExternalLink className="h-4 w-4" />
                      Open in app
                    </Link>
                    <a href={map.csvHref} className="ghost-button px-4 py-2.5" download>
                      <Download className="h-4 w-4" />
                      CSV for Google Maps
                    </a>
                    <a href={map.kmlHref} className="ghost-button px-4 py-2.5" download>
                      <Download className="h-4 w-4" />
                      KML
                    </a>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
