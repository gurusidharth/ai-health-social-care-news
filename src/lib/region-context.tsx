"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import type { RegionFilter } from "./news";

type RegionContextValue = {
  region: RegionFilter;
  setRegion: (r: RegionFilter) => void;
};

const RegionContext = createContext<RegionContextValue | undefined>(undefined);

export function RegionProvider({ children }: { children: ReactNode }) {
  const [region, setRegion] = useState<RegionFilter>("all");
  return <RegionContext.Provider value={{ region, setRegion }}>{children}</RegionContext.Provider>;
}

export function useRegion(): RegionContextValue {
  const ctx = useContext(RegionContext);
  if (!ctx) throw new Error("useRegion must be used within a RegionProvider");
  return ctx;
}
