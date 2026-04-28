import Link from "next/link";
import { ExternalLink, MapPin } from "lucide-react";
import { GoogleRating } from "@/components/google-rating";
import { PlaceImage } from "@/components/place-image";
import {
  getReviewLabel,
  parseStringList,
  type PlaceRecord,
} from "@/lib/places";

type PlaceCardProps = {
  place: PlaceRecord;
  compact?: boolean;
  showImage?: boolean;
};

export function PlaceCard({
  place,
  compact = false,
  showImage = true,
}: PlaceCardProps) {
  const tags = parseStringList(place.tags)
    .filter(
      (tag) =>
        !["mapstr", "to try", "restaurant", "cafe", "bar", "paris"].includes(
          tag.toLowerCase(),
        ),
    )
    .slice(0, compact ? 2 : 3);
  const foodTypes = parseStringList(place.foodType).slice(0, compact ? 2 : 4);
  const latestRecommendation = place.recommendations[0];
  const details = [place.cuisineType, place.priceRange, place.neighborhood]
    .filter(Boolean)
    .slice(0, 3) as string[];

  return (
    <article className="surface retro-panel overflow-hidden rounded-[30px] bg-[rgba(255,247,236,0.92)] transition hover:-translate-y-0.5">
      {showImage ? (
        <PlaceImage
          placeId={place.id}
          name={place.name}
          hasGooglePhoto={Boolean(place.googlePhotoName)}
          imageUrl={place.googlePhotoUrl}
          compact={compact}
        />
      ) : null}
      <div className="p-5">
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                <span className="chip rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em]">
                  {getReviewLabel(place)}
                </span>
                <GoogleRating
                  rating={place.googleRating}
                  count={place.googleUserRatingCount}
                  compact
                />
              </div>
              <h2 className="display text-3xl leading-none text-[var(--foreground)]">
                <Link href={`/places/${place.id}`}>{place.name}</Link>
              </h2>
              <p className="flex items-center gap-2 text-sm text-[var(--muted)]">
                <MapPin className="h-4 w-4" />
                {place.address ?? "Address under review"}
              </p>
            </div>
            {place.googleMapsUrl ? (
              <a
                href={place.googleMapsUrl}
                target="_blank"
                rel="noreferrer"
                className="ghost-button px-3 py-2"
              >
                Open map
                <ExternalLink className="h-4 w-4" />
              </a>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-2">
            {foodTypes.map((foodType) => (
              <span
                key={foodType}
                className="rounded-full bg-[rgba(141,183,170,0.18)] px-3 py-1 text-sm text-[var(--accent-ink)]"
              >
                {foodType}
              </span>
            ))}
            {place.cuisineType ? (
              <span className="rounded-full bg-[rgba(238,144,119,0.16)] px-3 py-1 text-sm text-[var(--accent-ink)]">
                {place.cuisineType}
              </span>
            ) : null}
            {place.arrondissement ? (
              <span className="rounded-full border border-[var(--line)] bg-white/80 px-3 py-1 text-sm">
                {place.arrondissement}
              </span>
            ) : null}
            {place.priceRange ? (
              <span className="rounded-full border border-[var(--line)] bg-white/80 px-3 py-1 text-sm">
                {place.priceRange}
              </span>
            ) : null}
          </div>

          {latestRecommendation ? (
            <p className="text-sm leading-6 text-[var(--muted)]">
              {latestRecommendation.reasonRecommended ||
                latestRecommendation.originalTextSnippet ||
                "Saved from a public recommendation source."}
            </p>
          ) : null}

          {details.length ? (
            <div className="flex flex-wrap gap-2">
              {details.map((detail) => (
                <span
                  key={detail}
                  className="rounded-full border border-[var(--line)] bg-white/76 px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--muted)]"
                >
                  {detail}
                </span>
              ))}
            </div>
          ) : null}

          {tags.length ? (
            <p className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">
              {tags.join(" · ")}
            </p>
          ) : null}
        </div>
      </div>
    </article>
  );
}
