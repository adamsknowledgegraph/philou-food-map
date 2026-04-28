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
