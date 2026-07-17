"use client";

import ArticleCardRows from "@/components/ArticleCardRows";
import HeroCard from "@/components/HeroCard";
import MoreArticlesCarousel from "@/components/MoreArticlesCarousel";
import { useRegion } from "@/lib/region-context";
import { useSearch } from "@/lib/search-context";
import { filterByRegion, filterBySearch, type Article, type Category } from "@/lib/news";

export default function CategoryFeed({ category, articles }: { category: Category; articles: Article[] }) {
  const { region } = useRegion();
  const { query } = useSearch();
  const filtered = filterBySearch(filterByRegion(articles, region), query);
  const [hero, ...rest] = filtered;
  const cards = rest.slice(0, 12);
  const more = rest.slice(12);

  return (
    <>
      {!hero && (
        <p className="text-muted">
          No {region === "all" ? "" : region === "uk" ? "UK " : "global "}stories in this category
          right now — check back after the next refresh.
        </p>
      )}

      {hero && <HeroCard article={hero} />}

      {cards.length > 0 && <ArticleCardRows articles={cards} />}

      {more.length > 0 && <MoreArticlesCarousel articles={more} title={`More ${category.label}`} />}
    </>
  );
}
