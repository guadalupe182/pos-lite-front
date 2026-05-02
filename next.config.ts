import type { NextConfig } from "next";
import withPWA from "@ducanh2912/next-pwa";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["*"],
  turbopack: {},
};

const isProd = process.env.NODE_ENV === "production";

export default isProd
  ? withPWA({
      dest: "public",
      register: true,
      workboxOptions: {
        skipWaiting: true,
        runtimeCaching: [
          {
            urlPattern: /^\/api\/.*/i,
            handler: 'NetworkOnly',
          },
        ],
      },
    })(nextConfig)
  : nextConfig;