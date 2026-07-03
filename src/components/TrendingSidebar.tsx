import type { Article } from "@/lib/news";
import TimeAgo from "./TimeAgo";

export default function TrendingSidebar({ articles }: { articles: Article[] }) {
  return (
    <section className="bg-card rounded-xl p-4">
      <h2 className="font-extrabold text-lg mb-2 flex items-center gap-2">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-accent">
          <path d="M23 6l-9.5 9.5-5-5L1 18" />
          <path d="M17 6h6v6" />
        </svg>
        Trending
      </h2>
      <ol className="divide-y divide-line">
        {articles.map((a, i) => (
          <li key={a.id}>
            <a
              href={a.link}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex gap-3 py-3"
            >
              <span className="text-2xl font-extrabold text-line group-hover:text-accent transition-colors leading-none w-7 shrink-0">
                {i + 1}
              </span>
              <div>
                <p className="text-sm font-semibold leading-snug group-hover:text-accent transition-colors line-clamp-2">
                  {a.title}
                </p>
                <p className="text-[11px] font-bold uppercase tracking-wider text-muted mt-1">
                  {a.source} · <TimeAgo date={a.date} />
                </p>
              </div>
            </a>
          </li>
        ))}
      </ol>
    </section>
  );
}
