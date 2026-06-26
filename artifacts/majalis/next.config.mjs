import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Required for pnpm monorepo deploys on Vercel (trace deps outside app root).
  outputFileTracingRoot: path.resolve(__dirname, "../.."),
  transpilePackages: ["@workspace/api-client-react"],
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    unoptimized: true,
  },
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "@": path.resolve(__dirname, "src"),
      "@assets": path.resolve(__dirname, "..", "..", "attached_assets"),
    };
    return config;
  },
};

export default nextConfig;
