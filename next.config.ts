import type { NextConfig } from "next";

// Served from the custom domain root (oneaicare.com), not a GitHub Pages
// project subpath, so no basePath is needed.
const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
  trailingSlash: true,
};

export default nextConfig;
