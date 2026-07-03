import ArticleCard from "@/components/ArticleCard";
import FeedList from "@/components/FeedList";
import HeroCard from "@/components/HeroCard";
import TrendingSidebar from "@/components/TrendingSidebar";
import { getAllArticles, getTopStories, getTrending } from "@/lib/news";

export default function Home() {
  const top = getTopStories(13);
  const [hero, ...cards] = top;
  const latest = getAllArticles().slice(0, 12);
  const trending = getTrending(6);

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
