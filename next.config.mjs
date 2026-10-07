/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ["assets.aceternity.com"],
  },
  // Skip ESLint during `next build` — run it separately in CI
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Skip TypeScript type errors that are already caught by tsc separately
  typescript: {
    ignoreBuildErrors: false,
  },
  // Silence the workspace root lockfile warning
  outputFileTracingRoot: process.cwd(),
};

export default nextConfig;