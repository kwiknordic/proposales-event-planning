import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Do not let `next dev` generate instruction files for AI coding agents; README.md is the only documentation
  agentRules: false,
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
