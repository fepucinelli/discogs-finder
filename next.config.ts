import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.discogs.com",
      },
    ],
  },
};

export default nextConfig;
