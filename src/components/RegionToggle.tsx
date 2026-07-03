"use client";

import { useRegion } from "@/lib/region-context";
import type { RegionFilter } from "@/lib/news";

const OPTIONS: { value: RegionFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "uk", label: "🇬🇧 UK" },
  { value: "global", label: "🌐 Global" },
];

export default function RegionToggle() {
  const { region, setRegion } = useRegion();

  return (
    <div className="flex items-center gap-0.5 bg-card border border-line rounded-full p-0.5 shrink-0">
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => setRegion(opt.value)}
          aria-pressed={region === opt.value}
          className={`px-3 py-1 text-xs font-bold rounded-full transition-colors whitespace-nowrap ${
            region === opt.value
              ? "bg-accent text-[#0f1114]"
              : "text-muted hover:text-ink"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
