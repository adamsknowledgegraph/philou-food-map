"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Camera } from "lucide-react";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/places", label: "Places" },
  { href: "/map", label: "Map" },
  { href: "/handy-maps", label: "Handy maps" },
];

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-30 border-b border-[var(--line)] bg-[rgba(255,244,226,0.9)] backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-3.5 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="relative hidden h-[3.75rem] w-[3.75rem] overflow-hidden rounded-[20px] border border-[var(--line)] bg-[rgba(255,248,236,0.86)] shadow-[var(--shadow-soft)] sm:block">
            <Image
              src="/photos/paris-cafe-terrace.jpg"
              alt="Paris cafe terrace"
              fill
              sizes="60px"
              className="object-cover vintage-photo-image"
              style={{ objectPosition: "center 58%" }}
            />
            <div className="vintage-photo-wash" />
            <div className="vintage-photo-grain" />
          </div>
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="eyebrow px-3 py-2">Paris Food Map</span>
              <a
                href="https://www.instagram.com/philoudarblay/"
                target="_blank"
                rel="noreferrer"
                aria-label="Philippine Darblay on Instagram"
                className="inline-flex items-center justify-center rounded-full border border-[var(--line)] bg-white/84 p-2 text-[var(--accent-ink)] transition hover:-translate-y-0.5"
              >
                <Camera className="h-3.5 w-3.5" />
              </a>
            </div>
            <div>
              <Link href="/" className="display text-3xl leading-none text-[var(--foreground)] sm:text-[2.5rem]">
                Paris Food Map
              </Link>
              <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--muted)]">
                Paris restaurants, cafes, bakeries, and bars
              </p>
              <p className="mt-1.5 max-w-xl text-sm leading-5 text-[var(--muted)]">
                Top food references and influencer picks, organized into one clean Paris guide.
              </p>
            </div>
          </div>
        </div>
        <nav className="flex flex-wrap gap-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`pill-button px-4 py-2.5 ${
                pathname === item.href ? "pill-button-active" : ""
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
