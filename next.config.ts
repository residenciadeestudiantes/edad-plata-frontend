import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "1337",
        pathname: "/uploads/**",
      },
    ],
    // Next 16 blocks optimizing images from local IPs/hosts by default;
    // the Strapi backend runs on localhost in development.
    dangerouslyAllowLocalIP: true,
  },
};

export default nextConfig;