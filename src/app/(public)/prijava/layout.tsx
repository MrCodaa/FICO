import { sr } from "@/content/sr";
import { redirectIfSignedIn } from "@/lib/auth/redirectIfSignedIn";

export const metadata = { title: "Prijava", description: sr.seo.pages.login };

export default async function Layout({ children }: { children: React.ReactNode }) {
  await redirectIfSignedIn();
  return children;
}
