"use client";

import ArticleCard from "@/components/ArticleCard";
import FeedList from "@/components/FeedList";
import HeroCard from "@/components/HeroCard";
import TrendingSidebar from "@/components/TrendingSidebar";
import { useRegion } from "@/lib/region-context";
import { filterByRegion, getTopStories, getTrending, type Article } from "@/lib/news";

export default function HomeFeed({ articles }: { articles: Article[] }) {
  const { region } = useRegion();
  const filtered = filterByRegion(articles, region);

  if (filtered.length === 0) {
    return <p className="text-muted">No stories match this filter right now.</p>;
  }

  const top = getTopStories(filtered, 13);
  const [hero, ...cards] = top;
  const latest = filtered.slice(0, 12);
  const trending = getTrending(filtered, 6);

  return (
    <div className="grid lg:grid-cols-[1fr_340px] gap-6 items-start">
      <div className="space-y-6 min-w-0">
        {hero && <HeroCard article={hero} />}

        <section>
          <h2 className="font-extrabold text-xl mb-3">Top stories</h2>
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {cards.map((a) => (
              <ArticleCard key={a.id} article={a} />
            ))}
          </div>
        </section>
      </div>

      <aside className="space-y-6 lg:sticky lg:top-28">
        <TrendingSidebar articles={trending} />
        <FeedList articles={latest} />
      </aside>
    </div>
  );
}
