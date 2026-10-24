import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

// Content-Security-Policy. Next.js ubacuje inline skripte (bez nonce-a), pa je potreban
// 'unsafe-inline' za skripte; ostalo je stegnuto: bez ugrađenih okvira (video je samo link),
// bez plugin objekata, slike samo sa našeg domena i Vercel Blob-a, veze samo ka našem domenu.
// Zasad ide kao Report-Only (ne ruši ništa, greške se vide u konzoli); kad se na produkciji potvrdi
// da nema prijava, zamijeni ključ u "Content-Security-Policy".
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://*.public.blob.vercel-storage.com",
  "font-src 'self' data:",
  "connect-src 'self'",
  "media-src 'self'",
  "frame-src 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy-Report-Only", value: csp },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()" },
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
];

const nextConfig: NextConfig = {
  devIndicators: false,
  // Aplikacija iza prijave se ne kešira (ni bfcache/Nazad poslije odjave): traži se ponovo prijava.
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
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
