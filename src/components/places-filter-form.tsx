import {
  PLACE_COLLECTION_LABELS,
  type PlaceFacets,
  type PlaceFilters,
} from "@/lib/places";

type PlacesFilterFormProps = {
  action: string;
  filters: PlaceFilters;
  facets: PlaceFacets;
  variant?: "consumer" | "admin";
  cityMode?: "show" | "hidden";
};

function SelectField({
  label,
  name,
  value,
  options,
  labels,
}: {
  label: string;
  name: string;
  value: string;
  options: string[];
  labels?: Record<string, string>;
}) {
  return (
    <label className="grid gap-2 text-sm">
      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
        {label}
      </span>
      <select
        name={name}
        defaultValue={value}
        className="retro-select"
      >
        <option value="">All</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {labels?.[option] ?? option}
          </option>
        ))}
      </select>
    </label>
  );
}

function buildFilterHref(
  action: string,
  filters: PlaceFilters,
  overrides: Partial<PlaceFilters>,
) {
  const params = new URLSearchParams();
  const nextFilters = {
    ...filters,
    ...overrides,
  };

  for (const [key, value] of Object.entries(nextFilters)) {
    if (value) {
      params.set(key, value);
    }
  }

  const query = params.toString();
  return query ? `${action}?${query}` : action;
}

export function PlacesFilterForm({
  action,
  filters,
  facets,
  variant = "consumer",
  cityMode = "show",
}: PlacesFilterFormProps) {
  const quickCollections = facets.collections.slice(0, 5);
  const showReviewControls = variant === "admin";
  const showCityField = cityMode === "show";
  const showExtendedFields = action !== "/";

  return (
    <form action={action} className="grid gap-4 lg:grid-cols-4">
      <div className="lg:col-span-4">
        <div className="flex flex-wrap gap-2">
          <a
            href={buildFilterHref(action, filters, { collection: "", sort: filters.sort || "recent" })}
            className={filters.collection ? "ghost-button px-4 py-2.5" : "cta-button px-4 py-2.5"}
          >
            All places
          </a>
          {quickCollections.map((collection) => (
            <a
              key={collection}
              href={buildFilterHref(action, filters, { collection })}
              className={
                filters.collection === collection
                  ? "cta-button px-4 py-2.5"
                  : "ghost-button px-4 py-2.5"
              }
            >
              {PLACE_COLLECTION_LABELS[collection]}
            </a>
          ))}
        </div>
      </div>

      <label className="grid gap-2 text-sm lg:col-span-2">
        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
          Search
        </span>
        <input
          type="search"
          name="q"
          defaultValue={filters.q}
          placeholder="Search a place, arrondissement, or vibe"
          className="retro-input"
        />
      </label>

      <SelectField
        label="Collection"
        name="collection"
        value={filters.collection}
        options={facets.collections}
        labels={PLACE_COLLECTION_LABELS}
      />
      {showCityField ? (
        <SelectField label="City" name="city" value={filters.city} options={facets.cities} />
      ) : null}
      <SelectField
        label="Arrondissement"
        name="arrondissement"
        value={filters.arrondissement}
        options={facets.arrondissements}
      />
      <SelectField label="Cuisine or vibe" name="tag" value={filters.tag} options={facets.tags} />
      <SelectField
        label="Price"
        name="priceRange"
        value={filters.priceRange}
        options={facets.priceRanges}
      />
      {showExtendedFields ? (
        <SelectField
          label="Food type"
          name="foodType"
          value={filters.foodType}
          options={facets.foodTypes}
        />
      ) : null}
      {showExtendedFields ? (
        <SelectField
          label="Neighborhood"
          name="neighborhood"
          value={filters.neighborhood}
          options={facets.neighborhoods}
        />
      ) : null}
      {showReviewControls ? (
        <SelectField
          label="Source"
          name="source"
          value={filters.source}
          options={facets.sources}
        />
      ) : null}
      {showReviewControls ? (
        <SelectField
          label="Review status"
          name="reviewStatus"
          value={filters.reviewStatus}
          options={["needs_review", "approved", "merged", "rejected", "closed"]}
        />
      ) : null}
      <SelectField
        label="Sort"
        name="sort"
        value={filters.sort}
        options={["recent", "alphabetical", "price"]}
      />

      <div className="flex items-end gap-3 lg:col-span-4">
        <button className="cta-button px-5 py-3">
          Apply filters
        </button>
        <a
          href={action}
          className="ghost-button px-5 py-3"
        >
          Clear
        </a>
      </div>
    </form>
  );
}
