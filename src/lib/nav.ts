import { CATEGORIES } from "./news";

export type NavItem = { label: string; href: string };

// Client-specified nav order — matches CATEGORIES order directly.
export const NAV_ITEMS: NavItem[] = CATEGORIES.map((c) => ({
  label: c.label,
  href: `/category/${c.slug}/`,
}));
