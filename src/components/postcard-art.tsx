"use client";

import Image from "next/image";

const artwork = [
  "/postcards/arrondissement-cafe.svg",
  "/postcards/arrondissement-river.svg",
  "/postcards/arrondissement-awning.svg",
  "/postcards/arrondissement-night.svg",
  "/postcards/terrace-sun.svg",
  "/postcards/city-spritz.svg",
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
  const src = artwork[hashString(seed) % artwork.length];

  return (
    <div
      className={`relative overflow-hidden border-b border-[var(--line)] bg-[rgba(181,216,223,0.28)] ${
        compact ? "aspect-[5/2]" : "aspect-[5/3]"
      }`}
    >
      <Image
        src={src}
        alt={alt}
        fill
        className="object-cover"
        sizes={compact ? "(max-width: 1024px) 100vw, 40vw" : "(max-width: 1024px) 100vw, 50vw"}
      />
      <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-[rgba(255,248,235,0.72)] to-transparent" />
      <div className="absolute bottom-3 left-3 rounded-full border border-[rgba(112,86,59,0.18)] bg-[rgba(255,248,235,0.88)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--accent-ink)]">
        Philou pick
      </div>
    </div>
  );
}
