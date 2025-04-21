// next.config.ts
import withPWA from "next-pwa";
import type { NextConfig } from "next";

const isProd = process.env.VERCEL_ENV === "production" && process.env.NODE_ENV === "production";

const pwaOptions = {
  dest: "public",
  register: isProd,
  skipWaiting: isProd,
  disable: !isProd,
  fallbacks: {
    document: "/offline.html",
  },
};

const withPWAMiddleware = withPWA(pwaOptions);

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // …他に必要な Next.js の設定 …
};

export default withPWAMiddleware(nextConfig);