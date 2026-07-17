import type { Article } from "@/lib/news";
import { getCategory } from "@/lib/news";
import ArticleImage from "./ArticleImage";
import BookmarkButton from "./BookmarkButton";
import SourceIcon from "./SourceIcon";
import TimeAgo from "./TimeAgo";

export default function ArticleCard({ article }: { article: Article }) {
  const cat = getCategory(article.category);
  return (
    <article className="group relative rounded-xl bg-card border border-line hover:border-accent/40 shadow-sm hover:shadow-md transition-all">
      <a
        href={article.link}
        target="_blank"
        rel="noopener noreferrer"
        className="flex gap-3 p-3"
      >
        <div className="relative w-28 h-20 sm:w-40 sm:h-28 shrink-0 rounded-lg overflow-hidden">
          <ArticleImage
            src={article.image}
            alt={article.title}
            gradient={cat?.gradient ?? "from-slate-700 to-slate-900"}
            label={cat?.short ?? "News"}
            className="absolute inset-0 w-full h-full transition-transform duration-300 group-hover:scale-[1.04]"
          />
        </div>
        <div className="flex flex-col min-w-0 flex-1 pr-8">
          <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider mb-1.5">
            <SourceIcon source={article.source} />
            <span className="text-muted truncate">{article.source}</span>
            <span className="text-muted shrink-0">
              · <TimeAgo date={article.date} />
            </span>
          </div>
          <h3 className="font-bold leading-snug group-hover:text-accent transition-colors line-clamp-2">
            {article.title}
          </h3>
          {article.description && (
            <p className="hidden sm:block mt-1 text-sm text-muted line-clamp-2">{article.description}</p>
          )}
        </div>
      </a>
      <BookmarkButton id={article.id} className="absolute top-3 right-3" />
    </article>
  );
}
