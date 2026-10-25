import { sr } from "@/content/sr";

// Stranica je klijentska, pa meta podaci idu preko layouta.
export const metadata = { title: sr.about.title, description: sr.seo.pages.about };

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
