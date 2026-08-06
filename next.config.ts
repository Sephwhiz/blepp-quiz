// @ts-ignore - next-pwa has no TS definitions
import withPWAInit from "next-pwa";
import type { NextConfig } from "next";

const withPWA = withPWAInit({
  dest: "public",
  register: true,
  skipWaiting: true,
  // ✅ FIX: Set to false to ENABLE PWA in Development Mode for testing
  disable: false, 
});

const nextConfig: NextConfig = {
 // output: 'export',
  images: {
    unoptimized: true,
  },
  // Force Webpack bundler (required for next-pwa compatibility)
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = { fs: false, net: false, tls: false };
    }
    return config;
  },
};

export default withPWA(nextConfig);