/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [{ protocol: "https", hostname: "assets.aceternity.com" }],
  },
  // Silence the workspace root lockfile warning
  outputFileTracingRoot: process.cwd(),
};

export default nextConfig;
