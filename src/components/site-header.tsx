"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/places", label: "Places" },
  { href: "/map", label: "Discover the map" },
  { href: "/admin/review", label: "Admin review" },
];

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-30 border-b border-[var(--line)] bg-[rgba(255,244,226,0.9)] backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <div className="space-y-2">
          <span className="eyebrow py-2">Philippine Darblay</span>
          <div>
            <Link href="/" className="display text-4xl leading-none text-[var(--foreground)] sm:text-5xl">
              Philou&apos;s Paris
            </Link>
            <p className="mt-1 text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
              Food guide
            </p>
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
