import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Creators can paste any image URL (or upload to imgBB), so unlike the old
    // `domains` allowlist this accepts any HTTPS host — the unsplash placeholder,
    // imgBB, and arbitrary user-supplied URLs all work. Next still blocks
    // localhost/private IPs by default. Narrow the list if you need to lock it down.
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
  },
  turbopack: {
    rules: {
      '*.css': {
        loaders: ['@tailwindcss/turbopack'],
        as: '*.css',
      },
    },
  },
};

export default nextConfig;
