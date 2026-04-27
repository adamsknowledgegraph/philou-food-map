import { Star } from "lucide-react";

type GoogleRatingProps = {
  rating: number | null | undefined;
  count?: number | null | undefined;
  compact?: boolean;
};

export function GoogleRating({
  rating,
  count,
  compact = false,
}: GoogleRatingProps) {
  if (typeof rating !== "number") {
    return null;
  }

  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(240,143,102,0.2)] bg-[rgba(255,247,232,0.92)] px-3 py-1.5 text-[var(--accent-ink)] shadow-[var(--shadow-soft)]">
      <Star className="h-4 w-4 fill-[var(--accent-4)] text-[var(--accent-4)]" />
      <span className={`font-semibold ${compact ? "text-xs" : "text-sm"}`}>
        {rating.toFixed(1)}
      </span>
      {typeof count === "number" && count > 0 ? (
        <span className="text-xs uppercase tracking-[0.08em] text-[var(--muted)]">
          {count.toLocaleString("en-GB")} reviews
        </span>
      ) : null}
    </div>
  );
}
