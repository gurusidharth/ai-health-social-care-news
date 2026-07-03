import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import "./globals.css";

export const metadata: Metadata = {
  title: "CarePulse — AI in Health & Social Care News",
  description:
    "UK-first news on AI and technology in health and social care: NHS digital health, social care tech, policy, research, startups and world coverage.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB">
      <body>
        <Header />
        <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
