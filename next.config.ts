import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const isProd = process.env.NODE_ENV === "production";

const apiOrigin = (process.env.NEXT_PUBLIC_API_URL || process.env.POSLITE_API_ORIGIN || 'http://localhost:8080').replace(/\/$/, '');

const nextConfig: NextConfig = {
  allowedDevOrigins: ["*"],
  turbopack: {},
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${apiOrigin}/api/:path*`,
      },
    ];
  },
};

const withPWA = withPWAInit({
  dest: "public",
  disable: !isProd,
  register: true,
  workboxOptions: {
    skipWaiting: true,
    clientsClaim: true,
    runtimeCaching: [
      {
        urlPattern: /^\/api\/.*/i,
        handler: "NetworkOnly",
      },
    ],
  },
});

export default withPWA(nextConfig);
