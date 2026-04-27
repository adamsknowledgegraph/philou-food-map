import { type PlaceFacets, type PlaceFilters } from "@/lib/places";

type PlacesFilterFormProps = {
  action: string;
  filters: PlaceFilters;
  facets: PlaceFacets;
};

function SelectField({
  label,
  name,
  value,
  options,
}: {
  label: string;
  name: string;
  value: string;
  options: string[];
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
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

export function PlacesFilterForm({
  action,
  filters,
  facets,
}: PlacesFilterFormProps) {
  return (
    <form action={action} className="grid gap-4 lg:grid-cols-4">
      <label className="grid gap-2 text-sm lg:col-span-2">
        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
          Search
        </span>
        <input
          type="search"
          name="q"
          defaultValue={filters.q}
          placeholder="Search names, evidence, tags, or addresses"
          className="retro-input"
        />
      </label>

      <SelectField label="Cuisine" name="cuisine" value={filters.cuisine} options={facets.cuisines} />
      <SelectField
        label="Food type"
        name="foodType"
        value={filters.foodType}
        options={facets.foodTypes}
      />
      <SelectField
        label="Price range"
        name="priceRange"
        value={filters.priceRange}
        options={facets.priceRanges}
      />
      <SelectField label="City" name="city" value={filters.city} options={facets.cities} />
      <SelectField
        label="Neighborhood"
        name="neighborhood"
        value={filters.neighborhood}
        options={facets.neighborhoods}
      />
      <SelectField
        label="Arrondissement"
        name="arrondissement"
        value={filters.arrondissement}
        options={facets.arrondissements}
      />
      <SelectField label="Tag" name="tag" value={filters.tag} options={facets.tags} />
      <SelectField
        label="Source"
        name="source"
        value={filters.source}
        options={facets.sources}
      />
      <SelectField
        label="Confidence"
        name="confidence"
        value={filters.confidence}
        options={["high", "medium", "low"]}
      />
      <SelectField
        label="Review status"
        name="reviewStatus"
        value={filters.reviewStatus}
        options={["needs_review", "approved", "merged", "rejected", "closed"]}
      />
      <SelectField
        label="Sort"
        name="sort"
        value={filters.sort}
        options={["recent", "confidence", "alphabetical", "price"]}
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
