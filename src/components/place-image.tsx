"use client";

import Image from "next/image";
import { useState } from "react";
import { PostcardArt } from "@/components/postcard-art";

type PlaceImageProps = {
  placeId?: string;
  name: string;
  hasGooglePhoto?: boolean;
  imageUrl?: string | null;
  compact?: boolean;
  showBadge?: boolean;
};

export function PlaceImage({
  placeId,
  name,
  hasGooglePhoto = false,
  imageUrl,
  compact = false,
  showBadge = true,
}: PlaceImageProps) {
  const initialSrc =
    placeId && (hasGooglePhoto || imageUrl)
      ? `/api/places/${placeId}/photo`
      : null;
  const [currentSrc, setCurrentSrc] = useState(initialSrc);

  if (!currentSrc) {
    return (
      <PostcardArt
        seed={name}
        alt={`${name} poster artwork`}
        compact={compact}
      />
    );
  }

  return (
    <div
      className={`relative overflow-hidden border-b border-[var(--line)] bg-[rgba(181,216,223,0.24)] ${
        compact ? "aspect-[5/2]" : "aspect-[5/3]"
      }`}
    >
      <Image
        src={currentSrc}
        alt={name}
        fill
        unoptimized
        className="object-cover"
        sizes={compact ? "(max-width: 1024px) 100vw, 40vw" : "(max-width: 1024px) 100vw, 50vw"}
        onError={() => {
          setCurrentSrc(null);
        }}
      />
      <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-[rgba(255,248,235,0.48)] to-transparent" />
      {showBadge ? (
        <div className="absolute bottom-3 left-3 rounded-full border border-[rgba(112,86,59,0.18)] bg-[rgba(255,248,235,0.92)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--accent-ink)]">
          Google photo
        </div>
      ) : null}
    </div>
  );
}
