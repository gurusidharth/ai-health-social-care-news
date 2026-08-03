import { notFound } from "next/navigation";
import CategoryFeed from "@/components/CategoryFeed";
import FollowButton from "@/components/FollowButton";
import { CATEGORIES, getArticlesByCategory, getCategory } from "@/lib/news";

export function generateStaticParams() {
  return CATEGORIES.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const cat = getCategory(slug);
  return { title: `${cat?.label ?? "News"} — OneAICare` };
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const cat = getCategory(slug);
  if (!cat) notFound();

  const articles = getArticlesByCategory(slug);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-extrabold text-2xl">{cat.label}</h1>
        <FollowButton slug={cat.slug} />
      </div>
      <CategoryFeed category={cat} articles={articles} />
    </div>
  );
}
