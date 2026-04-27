import { updateDuplicateCandidateAction, updatePlaceReviewAction } from "./actions";
import { SiteHeader } from "@/components/site-header";
import { getDuplicateCandidates, getPlacesNeedingReview, parseStringList } from "@/lib/places";

export default async function AdminReviewPage() {
  const [places, duplicateCandidates] = await Promise.all([
    getPlacesNeedingReview(),
    getDuplicateCandidates(),
  ]);

  return (
    <div className="page-shell pb-16">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 pt-6 sm:px-6 lg:px-8">
        <section className="surface retro-panel poster-bands rounded-[32px] p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
            Admin review
          </p>
          <h1 className="display mt-2 text-5xl leading-none">Approve, reject, correct, and merge</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--muted)]">
            This page is intentionally pragmatic: edit a few fields, approve confident
            records, reject weak ones, and merge duplicate candidates once the core
            place data looks right.
          </p>
        </section>

        <section className="grid gap-5">
          {places.map((place) => (
            <form
              key={place.id}
              action={updatePlaceReviewAction}
              className="surface retro-panel grid gap-4 rounded-[30px] bg-[rgba(255,247,236,0.92)] p-5 lg:grid-cols-[1.1fr_0.9fr]"
            >
              <input type="hidden" name="placeId" value={place.id} />
              <div className="grid gap-4">
                <label className="grid gap-2 text-sm">
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
                    Name
                  </span>
                  <input
                    name="name"
                    defaultValue={place.name}
                    className="retro-input"
                  />
                </label>
                <label className="grid gap-2 text-sm">
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
                    Address
                  </span>
                  <input
                    name="address"
                    defaultValue={place.address ?? ""}
                    className="retro-input"
                  />
                </label>
                <div className="grid gap-4 sm:grid-cols-3">
                  <label className="grid gap-2 text-sm">
                    <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
                      City
                    </span>
                    <input
                      name="city"
                      defaultValue={place.city ?? ""}
                      className="retro-input"
                    />
                  </label>
                  <label className="grid gap-2 text-sm">
                    <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
                      Neighborhood
                    </span>
                    <input
                      name="neighborhood"
                      defaultValue={place.neighborhood ?? ""}
                      className="retro-input"
                    />
                  </label>
                  <label className="grid gap-2 text-sm">
                    <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
                      Price range
                    </span>
                    <input
                      name="priceRange"
                      defaultValue={place.priceRange ?? ""}
                      className="retro-input"
                    />
                  </label>
                </div>
                <label className="grid gap-2 text-sm">
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
                    Tags (comma separated)
                  </span>
                  <input
                    name="tags"
                    defaultValue={parseStringList(place.tags).join(", ")}
                    className="retro-input"
                  />
                </label>
                <label className="grid gap-2 text-sm">
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
                    Reviewer notes
                  </span>
                  <textarea
                    name="reviewerNotes"
                    rows={4}
                    placeholder="What changed, what still looks uncertain, or why this should be rejected."
                    className="retro-textarea"
                  />
                </label>
              </div>

              <div className="grid gap-4 rounded-[26px] border border-[var(--line)] bg-white/75 p-5">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
                    Extraction context
                  </p>
                  <p className="mt-2 text-sm text-[var(--muted)]">
                    Confidence {place.confidenceScore.toFixed(2)} · Status {place.status}
                  </p>
                </div>
                <div className="grid gap-3 text-sm">
                  {place.recommendations.slice(0, 3).map((recommendation) => (
                    <div key={recommendation.id} className="rounded-[18px] bg-[rgba(181,216,223,0.18)] p-4">
                      <p className="font-semibold">{recommendation.sourceTitle ?? recommendation.sourcePlatform}</p>
                      <p className="mt-2 leading-6 text-[var(--muted)]">
                        {recommendation.originalTextSnippet ?? recommendation.reasonRecommended}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap gap-3">
                  <button
                    name="intent"
                    value="approve"
                    className="cta-button px-4 py-2.5"
                  >
                    Approve place
                  </button>
                  <button
                    name="intent"
                    value="save"
                    className="ghost-button px-4 py-2.5"
                  >
                    Save for later
                  </button>
                  <button
                    name="intent"
                    value="close"
                    className="ghost-button px-4 py-2.5"
                  >
                    Mark closed
                  </button>
                  <button
                    name="intent"
                    value="reject"
                    className="pill-button bg-[rgba(238,144,119,0.22)] px-4 py-2.5"
                  >
                    Reject extraction
                  </button>
                </div>
              </div>
            </form>
          ))}

          {places.length === 0 ? (
            <div className="surface retro-panel rounded-[32px] p-8 text-center">
              <p className="display text-3xl">No places currently need review.</p>
              <p className="mt-3 text-sm text-[var(--muted)]">
                Run the pipeline again or import reviewer corrections to create new work.
              </p>
            </div>
          ) : null}
        </section>

        <section className="surface retro-panel rounded-[32px] p-6">
          <h2 className="display text-3xl">Duplicate candidates</h2>
          <div className="mt-5 grid gap-4">
            {duplicateCandidates.map((candidate) => (
              <form
                key={candidate.id}
                action={updateDuplicateCandidateAction}
                className="rounded-[24px] border border-[var(--line)] bg-white/80 p-5"
              >
                <input type="hidden" name="candidateId" value={candidate.id} />
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="font-semibold">
                      {candidate.place1.name} ↔ {candidate.place2.name}
                    </p>
                    <p className="mt-1 text-sm text-[var(--muted)]">
                      {candidate.matchReason} · similarity {candidate.similarityScore.toFixed(2)}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <button
                      name="intent"
                      value="merge"
                      className="cta-button px-4 py-2.5"
                    >
                      Merge into first place
                    </button>
                    <button
                      name="intent"
                      value="ignore"
                      className="ghost-button px-4 py-2.5"
                    >
                      Ignore candidate
                    </button>
                  </div>
                </div>
              </form>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
