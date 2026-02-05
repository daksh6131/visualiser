import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  images: {
    unoptimized: true,
  },
  // No basePath needed for custom domain (visualiser.pixeluplabs.com)
};

export default nextConfig;
