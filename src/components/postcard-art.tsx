"use client";

import { VintagePhoto } from "@/components/vintage-photo";

const artwork = [
  {
    src: "/photos/paris-cafe-street.jpg",
    position: "center 52%",
    label: "Paris cafe",
  },
  {
    src: "/photos/paris-cafe-terrace.jpg",
    position: "center 52%",
    label: "Terrace lunch",
  },
  {
    src: "/photos/cafe-de-flore.jpg",
    position: "center 30%",
    label: "Classic stop",
  },
  {
    src: "/photos/paris-brasserie.jpg",
    position: "center 35%",
    label: "Brasserie hour",
  },
  {
    src: "/photos/hero-croissants.jpg",
    position: "center 56%",
    label: "Bakery pick",
  },
  {
    src: "/photos/hero-brunch.jpg",
    position: "center 48%",
    label: "Weekend brunch",
  },
  {
    src: "/postcards/arrondissement-awning.svg",
    position: "center",
    label: "Retro awning",
  },
  {
    src: "/postcards/arrondissement-bistro.svg",
    position: "center",
    label: "Bistro corner",
  },
  {
    src: "/postcards/arrondissement-cafe.svg",
    position: "center",
    label: "Coffee stop",
  },
  {
    src: "/postcards/arrondissement-market.svg",
    position: "center",
    label: "Market lunch",
  },
  {
    src: "/postcards/arrondissement-night.svg",
    position: "center",
    label: "Night plans",
  },
  {
    src: "/postcards/arrondissement-river.svg",
    position: "center",
    label: "Rive gauche",
  },
  {
    src: "/postcards/city-spritz.svg",
    position: "center",
    label: "Apero hour",
  },
  {
    src: "/postcards/hero-noodles.svg",
    position: "center",
    label: "Dinner plans",
  },
] as const;

function hashString(value: string) {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }

  return Math.abs(hash);
}

type PostcardArtProps = {
  seed: string;
  alt: string;
  compact?: boolean;
};

export function PostcardArt({
  seed,
  alt,
  compact = false,
}: PostcardArtProps) {
  const photo = artwork[hashString(seed) % artwork.length];

  return (
    <VintagePhoto
      src={photo.src}
      alt={alt}
      sizes={compact ? "(max-width: 1024px) 100vw, 40vw" : "(max-width: 1024px) 100vw, 50vw"}
      className={compact ? "aspect-[5/2]" : "aspect-[5/3]"}
      objectPosition={photo.position}
      label={photo.label}
    />
  );
}
