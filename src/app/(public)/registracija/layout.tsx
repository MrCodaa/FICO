import { redirectIfSignedIn } from "@/lib/auth/redirectIfSignedIn";

export default async function Layout({ children }: { children: React.ReactNode }) {
  await redirectIfSignedIn();
  return children;
}
