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
        // Apuntamos al dominio de Sandbox (que Nginx manda al 8087)
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
