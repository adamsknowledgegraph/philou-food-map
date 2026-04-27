"use client";

import dynamic from "next/dynamic";
import type { MapPlace } from "@/lib/places";

const PlacesMap = dynamic(() => import("@/components/places-map"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center rounded-[28px] bg-[rgba(255,248,235,0.9)] text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent-ink)]">
      Loading the map
    </div>
  ),
});

type MapPanelProps = {
  places: MapPlace[];
};

export function MapPanel({ places }: MapPanelProps) {
  return <PlacesMap places={places} />;
}
