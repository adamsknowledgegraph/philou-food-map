"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Camera, Menu } from "lucide-react";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/places", label: "Places" },
  { href: "/map", label: "Map" },
  { href: "/handy-maps", label: "Handy maps" },
];

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-30 border-b border-black bg-white/95 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4">
          <div className="hidden items-center gap-3 md:flex">
            <div className="inline-flex h-10 w-10 items-center justify-center border border-black">
              <Menu className="h-5 w-5 text-black" />
            </div>
            <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-black/60">
              The Paris food edit
            </span>
          </div>

          <div className="space-y-1">
            <p className="text-center text-sm font-semibold text-black sm:text-left">
              The taste of Paris
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Link href="/" className="text-[2.85rem] font-black uppercase leading-none tracking-[-0.06em] text-black sm:text-[4.4rem]">
                Paris Food Map
              </Link>
              <a
                href="https://www.instagram.com/philoudarblay/"
                target="_blank"
                rel="noreferrer"
                aria-label="Philippine Darblay on Instagram"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-black bg-[#ffe04d] text-black transition hover:-translate-y-0.5"
              >
                <Camera className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>

        <nav className="flex flex-wrap items-center gap-x-5 gap-y-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`text-[11px] font-bold uppercase tracking-[0.18em] ${
                pathname === item.href
                  ? "bg-[#ffe04d] px-2 py-1 text-black"
                  : "text-black/65"
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
