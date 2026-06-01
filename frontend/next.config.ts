import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  // Prevent Turbopack from picking the wrong root when multiple lockfiles exist.
  turbopack: {
    root: process.cwd(),
  },
  async rewrites() {
    // If NEXT_PUBLIC_API_BASE is set, the client will call that URL directly.
    // Otherwise, local development can proxy /api/* to the FastAPI server.
    if (process.env.NEXT_PUBLIC_API_BASE) return [];
    const target =
      process.env.API_PROXY_TARGET ??
      (process.env.NODE_ENV === "production" ? undefined : "http://localhost:8000");
    if (!target) return [];
    return [
      {
        source: "/api/:path*",
        destination: `${target}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
