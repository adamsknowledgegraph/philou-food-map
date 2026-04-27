import Link from "next/link";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/places", label: "Places" },
  { href: "/map", label: "Map" },
  { href: "/admin/review", label: "Admin review" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-[var(--line)] bg-[rgba(248,239,223,0.86)] backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <div className="space-y-2">
          <span className="eyebrow py-2">
            Philippine Darblay&apos;s Paris recommendations
          </span>
          <div>
            <Link href="/" className="display text-4xl leading-none text-[var(--foreground)] sm:text-5xl">
              Paris Leisure Guide
            </Link>
            <p className="mt-1 text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
              Public-source edition · cafes, tables, bakeries, bars
            </p>
          </div>
        </div>
        <nav className="flex flex-wrap gap-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="pill-button px-4 py-2.5"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
