import type { NextConfig } from "next";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants";

export default function nextConfig(phase: string): NextConfig {
  return {
    // Keep dev compilation from overwriting files used by `next build/start`.
    distDir: phase === PHASE_DEVELOPMENT_SERVER ? ".next-dev" : ".next",
    images: {
      // Keep all existing public and local API image paths working, including
      // cache-busting query strings used by uploaded sidebar icons.
      localPatterns: [{ pathname: "/**" }],
    },
  };
}
