"use client";

import Link from "next/link";
import { latLngBounds } from "leaflet";
import { useEffect } from "react";
import { CircleMarker, MapContainer, Popup, TileLayer, useMap } from "react-leaflet";
import type { MapPlace } from "@/lib/places";

type PlacesMapProps = {
  places: MapPlace[];
  selectedId?: string | null;
  onSelect?: (placeId: string) => void;
  zoom?: number;
};

function MapSelectionController({
  places,
  selectedId,
}: {
  places: MapPlace[];
  selectedId?: string | null;
}) {
  const map = useMap();

  useEffect(() => {
    if (selectedId) {
      return;
    }

    if (places.length === 0) {
      return;
    }

    if (places.length === 1) {
      map.setView([places[0].latitude, places[0].longitude], 14, {
        animate: true,
      });
      return;
    }

    const bounds = latLngBounds(
      places.map((place) => [place.latitude, place.longitude] as [number, number]),
    );
    map.fitBounds(bounds, {
      padding: [32, 32],
      maxZoom: 14,
      animate: true,
    });
  }, [map, places, selectedId]);

  useEffect(() => {
    if (!selectedId) {
      return;
    }

    const selectedPlace = places.find((place) => place.id === selectedId);
    if (!selectedPlace) {
      return;
    }

    map.flyTo([selectedPlace.latitude, selectedPlace.longitude], Math.max(map.getZoom(), 14), {
      duration: 0.45,
    });
  }, [map, places, selectedId]);

  return null;
}

export default function PlacesMap({
  places,
  selectedId = null,
  onSelect,
  zoom = 12,
}: PlacesMapProps) {
  const defaultCenter: [number, number] =
    places.length > 0
      ? [places[0].latitude, places[0].longitude]
      : [48.8566, 2.3522];

  return (
    <MapContainer center={defaultCenter} zoom={zoom} scrollWheelZoom className="h-full w-full">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapSelectionController places={places} selectedId={selectedId} />
      {places.map((place) => (
        <CircleMarker
          key={place.id}
          center={[place.latitude, place.longitude]}
          pathOptions={{
            color: selectedId === place.id ? "#38281f" : "#7a5138",
            fillColor: selectedId === place.id ? "#f2cf76" : "#ee9077",
            fillOpacity: 0.9,
            weight: selectedId === place.id ? 2 : 1.2,
          }}
          radius={selectedId === place.id ? 11 : 9}
          eventHandlers={
            onSelect
              ? {
                  click: () => onSelect(place.id),
                }
              : undefined
          }
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
