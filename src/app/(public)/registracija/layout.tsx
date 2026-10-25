import { sr } from "@/content/sr";
import { redirectIfSignedIn } from "@/lib/auth/redirectIfSignedIn";

export const metadata = { title: "Registracija", description: sr.seo.pages.register };

export default async function Layout({ children }: { children: React.ReactNode }) {
  await redirectIfSignedIn();
  return children;
}
