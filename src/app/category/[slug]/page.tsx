import { notFound } from "next/navigation";
import ArticleCard from "@/components/ArticleCard";
import FeedList from "@/components/FeedList";
import HeroCard from "@/components/HeroCard";
import { CATEGORIES, getArticlesByCategory, getCategory } from "@/lib/news";

export function generateStaticParams() {
  return CATEGORIES.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const cat = getCategory(slug);
  return { title: `${cat?.label ?? "News"} — CarePulse` };
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const cat = getCategory(slug);
  if (!cat) notFound();

  const articles = getArticlesByCategory(slug);
  const [hero, ...rest] = articles;
  const cards = rest.slice(0, 12);
  const more = rest.slice(12);

  return (
    <div className="space-y-6">
      <h1 className="font-extrabold text-2xl">{cat.label}</h1>

      {!hero && (
        <p className="text-muted">
          No stories in this category right now — check back after the next refresh.
        </p>
      )}

      {hero && <HeroCard article={hero} />}

      {cards.length > 0 && (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {cards.map((a) => (
            <ArticleCard key={a.id} article={a} />
          ))}
        </div>
      )}

      {more.length > 0 && <FeedList articles={more} title={`More ${cat.label}`} />}
    </div>
  );
}
