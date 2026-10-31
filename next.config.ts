import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const isProd = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["*"],
  turbopack: {},
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        // Ahora TODO va por Nginx, y Nginx decide qué mandar al 8090 y qué al 8087
        destination: 'https://pos-sandbox-api.gdevsoftware.com/api/:path*', 
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
