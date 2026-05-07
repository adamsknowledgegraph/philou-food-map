"use client";

import Image from "next/image";

function hashString(value: string) {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }

  return Math.abs(hash);
}

function getPalette(seed: string) {
  const hash = hashString(seed);
  const hueA = hash % 360;
  const hueB = (hash * 1.7) % 360;
  const hueC = (hash * 2.3) % 360;

  return {
    background: `hsl(${hueA} 72% 88%)`,
    accent: `hsl(${hueB} 86% 56%)`,
    accentSoft: `hsl(${hueC} 58% 72%)`,
    ink: `hsl(${(hueA + 210) % 360} 18% 12%)`,
    paper: "hsl(42 42% 96%)",
  };
}

function buildIllustration(seed: string) {
  const palette = getPalette(seed);
  const hash = hashString(seed);
  const dotX = 80 + (hash % 280);
  const dotY = 60 + ((hash >> 2) % 110);
  const circleX = 210 + ((hash >> 4) % 120);
  const circleY = 150 + ((hash >> 6) % 90);
  const waveY = 150 + ((hash >> 3) % 60);
  const arcStart = 40 + ((hash >> 5) % 80);
  const arcEnd = 300 + ((hash >> 7) % 70);
  const initial = seed.trim().charAt(0).toUpperCase() || "P";

  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 260" role="img" aria-label="${seed}">
      <rect width="480" height="260" rx="28" fill="${palette.paper}"/>
      <rect x="18" y="18" width="444" height="224" rx="22" fill="${palette.background}"/>
      <path d="M0 ${waveY} C 120 ${waveY - 38}, 180 ${waveY + 46}, 318 ${waveY + 8} S 420 ${waveY - 12}, 480 ${waveY + 32} V260 H0 Z" fill="${palette.accentSoft}" opacity="0.78"/>
      <circle cx="${circleX}" cy="${circleY}" r="72" fill="${palette.accent}" opacity="0.82"/>
      <circle cx="${dotX}" cy="${dotY}" r="22" fill="${palette.ink}" opacity="0.9"/>
      <path d="M${arcStart} 74 Q 242 10 ${arcEnd} 84" stroke="${palette.paper}" stroke-width="10" stroke-linecap="round" fill="none" opacity="0.88"/>
      <path d="M68 194 C 126 144, 184 170, 240 142 S 344 116, 404 174" stroke="${palette.ink}" stroke-width="7" stroke-linecap="round" fill="none" opacity="0.32"/>
      <rect x="36" y="168" width="126" height="44" rx="22" fill="${palette.paper}" opacity="0.96"/>
      <text x="58" y="197" font-family="Arial, Helvetica, sans-serif" font-size="18" letter-spacing="1.8" fill="${palette.ink}">PARIS PICK</text>
      <text x="342" y="92" text-anchor="middle" font-family="Georgia, Times New Roman, serif" font-size="112" fill="${palette.paper}" opacity="0.88">${initial}</text>
    </svg>
  `;
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
  const svg = buildIllustration(seed);
  const encoded = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

  return (
    <div
      className={`vintage-photo-shell ${compact ? "aspect-[5/2]" : "aspect-[5/3]"}`}
      aria-label={alt}
      role="img"
    >
      <div className="vintage-photo-frame">
        <Image
          src={encoded}
          alt={alt}
          fill
          unoptimized
          sizes={compact ? "(max-width: 1024px) 100vw, 40vw" : "(max-width: 1024px) 100vw, 50vw"}
          className="object-cover vintage-photo-image"
        />
        <div className="vintage-photo-wash" />
        <div className="vintage-photo-grain" />
        <div className="vintage-photo-border" />
        <div className="vintage-photo-label">Illustrated fallback</div>
      </div>
    </div>
  );
}
