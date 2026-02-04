import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  images: {
    unoptimized: true,
  },
  // For GitHub Pages deployment
  basePath: process.env.NODE_ENV === "production" ? "/visualiser" : "",
  assetPrefix: process.env.NODE_ENV === "production" ? "/visualiser/" : "",
};

export default nextConfig;
