import HomeFeed from "@/components/HomeFeed";
import { getAllArticles } from "@/lib/news";

export default function Home() {
  const articles = getAllArticles();
  return <HomeFeed articles={articles} />;
}
