import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  basePath: '/hoxe-daily-briefing',
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
