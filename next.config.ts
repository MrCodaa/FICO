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
      {
        // Lokalno otpremljene slike: browser ne smije "pogadjati" tip fajla.
        source: "/uploads/:path*",
        headers: [{ key: "X-Content-Type-Options", value: "nosniff" }],
      },
    ];
  },
};

export default nextConfig;
