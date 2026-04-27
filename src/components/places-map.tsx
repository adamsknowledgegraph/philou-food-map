"use client";

import Link from "next/link";
import { CircleMarker, MapContainer, Popup, TileLayer } from "react-leaflet";
import type { MapPlace } from "@/lib/places";

type PlacesMapProps = {
  places: MapPlace[];
};

export default function PlacesMap({ places }: PlacesMapProps) {
  const defaultCenter: [number, number] =
    places.length > 0
      ? [places[0].latitude, places[0].longitude]
      : [48.8566, 2.3522];

  return (
    <MapContainer center={defaultCenter} zoom={12} scrollWheelZoom className="h-full w-full">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {places.map((place) => (
        <CircleMarker
          key={place.id}
          center={[place.latitude, place.longitude]}
          pathOptions={{
            color: "#7a5138",
            fillColor: "#ee9077",
            fillOpacity: 0.9,
            weight: 1.2,
          }}
          radius={9}
        >
          <Popup>
            <div className="min-w-[200px] space-y-2">
              <p className="display text-2xl leading-none">{place.name}</p>
              <p className="text-sm text-[var(--muted)]">{place.address ?? "Address under review"}</p>
              <Link
                href={`/places/${place.id}`}
                className="inline-flex text-sm font-semibold uppercase tracking-[0.08em] text-[#7a5138]"
              >
                Open place detail
              </Link>
            </div>
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
