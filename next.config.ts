import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'ph-files.imgix.net',
      },
      {
        protocol: 'https',
        hostname: 'ph-static.imgix.net',
      },
      {
        protocol: 'https',
        hostname: 'producthunt.com',
      },
    ],
  },
};

export default nextConfig;