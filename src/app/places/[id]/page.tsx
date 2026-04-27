import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, MapPin, ShieldCheck } from "lucide-react";
import { GoogleRating } from "@/components/google-rating";
import { PlaceImage } from "@/components/place-image";
import { SiteHeader } from "@/components/site-header";
import {
  formatConfidence,
  formatDate,
  getPlaceById,
  getReviewLabel,
  parseStringList,
} from "@/lib/places";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function PlaceDetailPage({ params }: PageProps) {
  const { id } = await params;
  const place = await getPlaceById(id);

  if (!place) {
    notFound();
  }

  const tags = parseStringList(place.tags);
  const foodTypes = parseStringList(place.foodType);

  return (
    <div className="page-shell pb-16">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 pt-6 sm:px-6 lg:px-8">
        <Link
          href="/places"
          className="ghost-button w-fit px-4 py-2.5"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to places
        </Link>

        <section className="surface retro-panel poster-bands rounded-[34px] p-6 sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <span className="chip rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em]">
                  {getReviewLabel(place)}
                </span>
                <span className="rounded-full border border-[var(--line)] bg-[rgba(181,216,223,0.24)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em]">
                  Confidence {formatConfidence(place.confidenceScore)}
                </span>
                <GoogleRating
                  rating={place.googleRating}
                  count={place.googleUserRatingCount}
                />
              </div>
              <div>
                <h1 className="display text-5xl leading-none sm:text-6xl">{place.name}</h1>
                <p className="mt-3 flex items-center gap-2 text-sm text-[var(--muted)]">
                  <MapPin className="h-4 w-4" />
                  {place.address ?? "Address still under review"}
                </p>
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
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-[var(--line)] bg-white/82 px-3 py-1 text-sm uppercase tracking-[0.08em]"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="grid min-w-[280px] gap-4">
              <div className="postcard-frame">
                <PlaceImage
                  placeId={place.id}
                  name={place.name}
                  hasGooglePhoto={Boolean(place.googlePhotoName)}
                  imageUrl={place.googlePhotoUrl}
                  compact
                />
              </div>
              <div className="surface retro-panel rounded-[28px] bg-white/72 p-5">
                <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.14em] text-[var(--accent-ink)]">
                  <ShieldCheck className="h-4 w-4" />
                  Review summary
                </div>
                <dl className="mt-4 grid gap-3 text-sm">
                  <div className="flex items-center justify-between gap-4">
                    <dt className="text-[var(--muted)]">Status</dt>
                    <dd>{place.status}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <dt className="text-[var(--muted)]">City</dt>
                    <dd>{place.city ?? "Unknown"}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <dt className="text-[var(--muted)]">Arrondissement</dt>
                    <dd>{place.arrondissement ?? "Unknown"}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <dt className="text-[var(--muted)]">Price</dt>
                    <dd>{place.priceRange ?? "Unknown"}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <dt className="text-[var(--muted)]">Google</dt>
                    <dd>
                      {typeof place.googleRating === "number"
                        ? `${place.googleRating.toFixed(1)} / 5`
                        : "Not synced"}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="surface retro-panel rounded-[32px] p-6">
            <h2 className="display text-3xl">Useful links</h2>
            <div className="mt-4 grid gap-3 text-sm">
              {[
                ["Google Maps", place.googleMapsUrl],
                ["Instagram", place.instagramUrl],
                ["Website", place.websiteUrl],
                ["Booking", place.bookingUrl],
              ].map(([label, href]) =>
                href ? (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    className="soft-stripes flex items-center justify-between rounded-[20px] border border-[var(--line)] bg-white/88 px-4 py-3 transition hover:-translate-y-0.5"
                  >
                    <span>{label}</span>
                    <ExternalLink className="h-4 w-4 text-[var(--muted)]" />
                  </a>
                ) : null,
              )}
            </div>
          </div>

          <div className="surface retro-panel rounded-[32px] p-6">
            <h2 className="display text-3xl">Recommendations and evidence</h2>
            <div className="mt-5 grid gap-4">
              {place.recommendations.map((recommendation) => (
                <article
                  key={recommendation.id}
                  className="rounded-[24px] border border-[var(--line)] bg-white/85 p-5 shadow-[var(--shadow-soft)]"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold">{recommendation.sourceTitle ?? recommendation.sourcePlatform}</p>
                      <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
                        {recommendation.sourcePlatform} · {formatDate(recommendation.sourceDate)}
                      </p>
                    </div>
                    <a
                      href={recommendation.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.08em] text-[var(--accent-ink)]"
                    >
                      Source link
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                  {recommendation.reasonRecommended ? (
                    <p className="mt-4 text-sm leading-6 text-[var(--muted)]">
                      {recommendation.reasonRecommended}
                    </p>
                  ) : null}
                  {recommendation.originalTextSnippet ? (
                    <blockquote className="mt-4 rounded-[20px] bg-[rgba(181,216,223,0.22)] p-4 text-sm leading-6 text-[var(--foreground)]">
                      {recommendation.originalTextSnippet}
                    </blockquote>
                  ) : null}
                </article>
              ))}
            </div>
            {place.evidence.length ? (
              <div className="mt-6 rounded-[24px] border border-[var(--line)] bg-white/80 p-5">
                <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
                  Evidence snippets
                </h3>
                <div className="mt-4 grid gap-3">
                  {place.evidence.map((evidence) => (
                    <div key={evidence.id} className="rounded-[20px] bg-[rgba(238,144,119,0.12)] p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
                        {evidence.evidenceType}
                      </p>
                      <p className="mt-2 text-sm leading-6">{evidence.evidenceText}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </section>
      </main>
    </div>
  );
}
