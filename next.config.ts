import type { NextConfig } from "next";

// On GitHub Pages the site is served from /<repo-name>/
const repo = "ai-health-social-care-news";
const isCI = process.env.GITHUB_ACTIONS === "true";

const nextConfig: NextConfig = {
  output: "export",
  basePath: isCI ? `/${repo}` : "",
  images: { unoptimized: true },
  trailingSlash: true,
};

export default nextConfig;
