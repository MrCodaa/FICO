import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  // Aplikacija iza prijave se ne kešira (ni bfcache/Nazad poslije odjave): traži se ponovo prijava.
  async headers() {
    return [
      {
        source: "/app/:path*",
        headers: [{ key: "Cache-Control", value: "no-store, must-revalidate" }],
      },
    ];
  },
};

export default nextConfig;
