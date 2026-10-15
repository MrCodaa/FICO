import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "FICO — Pronađi co-foundera",
  description: "Platforma za pronalazak co-foundera na Balkanu.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="sr-Latn">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
