import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Turbopack requires native bindings not always available on Windows.
  // Using Webpack (default fallback) for stable local development.
};

export default nextConfig;
