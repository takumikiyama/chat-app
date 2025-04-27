// next.config.ts
import withPWA from "next-pwa";
import type { NextConfig } from "next";


const pwaOptions = {
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: false,
  swSrc: "service-worker.js", 
  // ← ここでプリキャッシュから除外したいパターンを指定
  buildExcludes: [
    /app-build-manifest\.json$/,      // App Router の古い manifest
    /middleware-build-manifest\.json$/,
    /\.js\.map$/,                     // ソースマップも除外
  ],

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