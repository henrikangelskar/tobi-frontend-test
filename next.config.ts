import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'static.finncdn.no',
      },
    ],
  },
};

export default nextConfig;
