import type { Article } from "@/lib/news";
import ArticleCard from "./ArticleCard";
import FeaturedArticleCard from "./FeaturedArticleCard";

/** Renders a card list as 4-col / 2-col-featured / 4-col rows, breaking up an otherwise uniform grid. */
export default function ArticleCardRows({ articles }: { articles: Article[] }) {
  const row1 = articles.slice(0, 4);
  const row2 = articles.slice(4, 6);
  const row3 = articles.slice(6);

  return (
    <div className="space-y-4">
      {row1.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
          {row1.map((a) => (
            <ArticleCard key={a.id} article={a} />
          ))}
        </div>
      )}
      {row2.length > 0 && (
        <div className="grid sm:grid-cols-2 gap-4">
          {row2.map((a) => (
            <FeaturedArticleCard key={a.id} article={a} />
          ))}
        </div>
      )}
      {row3.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
          {row3.map((a) => (
            <ArticleCard key={a.id} article={a} />
          ))}
        </div>
      )}
    </div>
  );
}
