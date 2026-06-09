import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  // Prevent Turbopack from picking the wrong root when multiple lockfiles exist.
  turbopack: {
    root: process.cwd(),
  },
  async rewrites() {
    // Local development proxies /api/* to the FastAPI server.
    // Set NEXT_PUBLIC_API_BASE only if you intentionally want direct browser calls.
    if (process.env.NEXT_PUBLIC_API_BASE) return [];
    const target = process.env.API_PROXY_TARGET ?? "http://localhost:8000";
    return [
      {
        source: "/api/:path*",
        destination: `${target}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
