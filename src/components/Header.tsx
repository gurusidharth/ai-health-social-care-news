"use client";

// import { useEffect, useState } from "react";
import Link from "next/link";
// import { usePathname } from "next/navigation";
// import { NAV_ITEMS } from "@/lib/nav";
import RegionToggle from "./RegionToggle";
import SearchToggle from "./SearchToggle";
import ThemeToggle from "./ThemeToggle";

export default function Header() {
  // const pathname = usePathname();
  // const [menuOpen, setMenuOpen] = useState(false);

  // const tabs = [{ label: "Home", href: "/" }, ...NAV_ITEMS];

  // useEffect(() => {
  //   setMenuOpen(false);
  // }, [pathname]);

  return (
    <header className="sticky top-0 z-50 bg-bg/95 backdrop-blur border-b border-line">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center gap-5 h-16">
          {/*
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Open menu"
            aria-expanded={menuOpen}
            className="md:hidden flex items-center justify-center w-8 h-8 -ml-1 rounded-lg text-ink shrink-0"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              {menuOpen ? <path d="M18 6 6 18M6 6l12 12" /> : <path d="M4 6h16M4 12h16M4 18h16" />}
            </svg>
          </button>
          */}

          <Link href="/" className="flex items-center gap-2 shrink-0">
            <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-accent">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0f1114" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
              </svg>
            </span>
            <span className="font-extrabold text-lg tracking-tight whitespace-nowrap">
              OneAI<span className="text-accent">Care</span>
            </span>
          </Link>

          {/*
          <nav className="hidden md:flex items-center gap-5 overflow-x-auto no-scrollbar min-w-0">
            {tabs.map((tab) => {
              const active = tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={`whitespace-nowrap text-sm font-semibold transition-colors ${
                    active ? "text-ink" : "text-muted hover:text-ink"
                  }`}
                >
                  {tab.label}
                </Link>
              );
            })}
          </nav>
          */}

          <div className="ml-auto flex items-center gap-2 shrink-0">
            <SearchToggle />
            <ThemeToggle />
            <RegionToggle />
          </div>
        </div>
      </div>

      {/*
      {menuOpen && (
        <nav className="md:hidden border-t border-line bg-bg">
          <div className="max-w-6xl mx-auto px-4 py-2 flex flex-col">
            {tabs.map((tab) => {
              const active = tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={`py-2.5 text-sm font-semibold border-b border-line last:border-b-0 ${
                    active ? "text-accent" : "text-ink"
                  }`}
                >
                  {tab.label}
                </Link>
              );
            })}
          </div>
        </nav>
      )}
      */}
    </header>
  );
}
