import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { sr } from "@/content/sr";
import { getSiteUrl } from "@/lib/siteUrl";

// next/font hostuje font lokalno (bez zahtjeva ka Google-u pri učitavanju)
// i sprječava pomjeranje teksta dok se font učitava.
const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin", "latin-ext"],
  display: "swap",
  variable: "--font-jakarta",
});

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: { default: sr.seo.siteTitle, template: `%s | ${sr.landing.brand}` },
  description: sr.seo.description,
  openGraph: {
    type: "website",
    siteName: sr.landing.brand,
    locale: "sr_RS",
    title: sr.seo.siteTitle,
    description: sr.seo.description,
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: sr.seo.siteTitle,
    description: sr.seo.description,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#1b1a3a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="sr-Latn" className={jakarta.variable}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
