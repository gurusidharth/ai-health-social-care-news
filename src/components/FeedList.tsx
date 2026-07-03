import type { Article } from "@/lib/news";
import { getCategory } from "@/lib/news";
import TimeAgo from "./TimeAgo";

export default function FeedList({ articles, title = "Latest news" }: { articles: Article[]; title?: string }) {
  return (
    <section className="bg-card rounded-xl p-4">
      <h2 className="font-extrabold text-lg mb-2">{title}</h2>
      <ul className="divide-y divide-line">
        {articles.map((a) => {
          const cat = getCategory(a.category);
          return (
            <li key={a.id}>
              <a
                href={a.link}
                target="_blank"
                rel="noopener noreferrer"
                className="group block py-3"
              >
                <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider mb-1">
                  <span className="text-accent">{cat?.short ?? "News"}</span>
                  <span className="text-muted">
                    {a.source} · <TimeAgo date={a.date} />
                  </span>
                </div>
                <p className="text-sm font-semibold leading-snug group-hover:text-accent transition-colors line-clamp-2">
                  {a.title}
                </p>
              </a>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
