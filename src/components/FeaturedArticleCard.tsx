import type { Article } from "@/lib/news";
import { getCategory } from "@/lib/news";
import ArticleImage from "./ArticleImage";
import BookmarkButton from "./BookmarkButton";
import SourceBadge from "./SourceBadge";
import TimeAgo from "./TimeAgo";

/** Wide featured card: image on the left, text on the right — used to break up dense card grids. */
export default function FeaturedArticleCard({ article }: { article: Article }) {
  const cat = getCategory(article.category);
  return (
    <a
      href={article.link}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex rounded-xl overflow-hidden bg-card border border-line hover:border-accent/40 shadow-sm hover:shadow-md transition-all min-h-[150px] md:min-h-[170px]"
    >
      <div className="relative w-2/5 shrink-0">
        <div className="absolute inset-0 overflow-hidden">
          <ArticleImage
            src={article.image}
            alt={article.title}
            gradient={cat?.gradient ?? "from-slate-700 to-slate-900"}
            label={cat?.short ?? "News"}
            source={article.source}
            showLabel={false}
            className="absolute inset-0 w-full h-full transition-transform duration-300 group-hover:scale-[1.04]"
          />
        </div>
        <div className="absolute bottom-3 left-3 z-10">
          <SourceBadge category={article.category} size={28} className="ring-2 ring-card" />
        </div>
      </div>
      <div className="relative flex flex-col justify-center flex-1 p-4 pr-9 min-w-0">
        <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider mb-1.5">
          <span className="text-ink/70">{article.source}</span>
          <span className="text-muted normal-case font-medium">
            · <TimeAgo date={article.date} />
          </span>
        </div>
        <h3 className="text-sm md:text-base font-bold leading-snug group-hover:text-accent transition-colors line-clamp-3">
          {article.title}
        </h3>
        <div className="absolute bottom-3 right-3">
          <BookmarkButton articleId={article.id} />
        </div>
      </div>
    </a>
  );
}
