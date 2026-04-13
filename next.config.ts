import type { NextConfig } from 'next';
import withPWA from '@ducanh2912/next-pwa';

const nextConfig: NextConfig = {
  allowedDevOrigins: ['*'],
};

export default withPWA({
  dest: 'public',
  register: true,
  workboxOptions: {
    skipWaiting: true,
    clientsClaim: true,
  },
})(nextConfig);