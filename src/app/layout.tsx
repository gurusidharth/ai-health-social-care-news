import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { RegionProvider } from "@/lib/region-context";
import { SearchProvider } from "@/lib/search-context";
import "./globals.css";

export const metadata: Metadata = {
  title: "OneAICare — AI in Health & Social Care News",
  description:
    "UK-first news on AI and technology in health and social care: NHS digital health, social care tech, policy, research, startups and world coverage.",
};

const THEME_INIT_SCRIPT = `
(function () {
  try {
    var stored = localStorage.getItem("theme");
    var theme = stored || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    document.documentElement.setAttribute("data-theme", theme);
  } catch (e) {}
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB" suppressHydrationWarning>
      <body>
        {/* eslint-disable-next-line @next/next/no-sync-scripts */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <RegionProvider>
          <SearchProvider>
            <Header />
            <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>
            <Footer />
          </SearchProvider>
        </RegionProvider>
      </body>
    </html>
  );
}
