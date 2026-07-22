"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "@/lib/nav";
import RegionToggle from "./RegionToggle";
import SearchToggle from "./SearchToggle";
import ThemeToggle from "./ThemeToggle";

export default function Header() {
  const pathname = usePathname();

  const tabs = [{ label: "Home", href: "/" }, ...NAV_ITEMS];

  return (
    <header className="sticky top-0 z-50 bg-bg/95 backdrop-blur border-b border-line">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center gap-3 h-14">
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
          <div className="ml-auto flex items-center gap-2">
            <SearchToggle />
            <ThemeToggle />
            <RegionToggle />
          </div>
        </div>

        <nav className="flex gap-1 overflow-x-auto no-scrollbar -mx-4 px-4">
          {tabs.map((tab) => {
            const active = tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);
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
    </header>
  );
}
