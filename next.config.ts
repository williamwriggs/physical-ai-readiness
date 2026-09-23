import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The Vercel launcher requires these server bundles as CommonJS even though
  // the repository uses ESM for its tooling. Keep Next's module boundary traced.
  outputFileTracingIncludes: {
    '/api/evidence/*': ['./.next/package.json'],
  },
};

export default nextConfig;
