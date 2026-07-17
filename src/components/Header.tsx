"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { CATEGORIES } from "@/lib/news";
import RegionToggle from "./RegionToggle";

export default function Header() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  // Close the mobile menu on navigation instead of leaving it open behind
  // the new page.
  useEffect(() => setMenuOpen(false), [pathname]);

  const tabs = [
    { slug: "", label: "Home", href: "/" },
    ...CATEGORIES.map((c) => ({ slug: c.slug, label: c.label, href: `/category/${c.slug}/` })),
  ];

  return (
    <header className="sticky top-0 z-50 bg-bg/95 backdrop-blur border-b border-line">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center gap-3 h-14">
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            className="md:hidden flex items-center justify-center w-9 h-9 -ml-1.5 rounded-lg text-ink hover:bg-card-hover transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              {menuOpen ? <path d="M18 6L6 18M6 6l12 12" /> : <path d="M3 6h18M3 12h18M3 18h18" />}
            </svg>
          </button>

          <Link href="/" className="flex items-center gap-2 shrink-0">
            <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-accent">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0f1114" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
              </svg>
            </span>
            <span className="font-extrabold text-lg tracking-tight">
              OneAI<span className="text-accent">Care</span>
            </span>
          </Link>
          <span className="hidden lg:block text-muted text-xs border-l border-line pl-3 leading-tight">
            AI in Health &amp; Social Care
          </span>
          <div className="ml-auto">
            <RegionToggle />
          </div>
        </div>

        <nav className="hidden md:flex gap-1 overflow-x-auto no-scrollbar -mx-4 px-4">
          {tabs.map((tab) => {
            const active =
              tab.href === "/" ? pathname === "/" : pathname.startsWith(`/category/${tab.slug}`);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`whitespace-nowrap px-3 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
                  active
                    ? "border-accent text-ink"
                    : "border-transparent text-muted hover:text-ink"
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {menuOpen && (
        <nav className="md:hidden border-t border-line bg-bg px-4 py-2 flex flex-col">
          {tabs.map((tab) => {
            const active =
              tab.href === "/" ? pathname === "/" : pathname.startsWith(`/category/${tab.slug}`);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`py-2.5 text-sm font-semibold border-b border-line last:border-0 ${
                  active ? "text-accent" : "text-ink"
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </nav>
      )}
    </header>
  );
}
