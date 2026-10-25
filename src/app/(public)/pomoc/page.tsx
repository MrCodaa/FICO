import { sr } from "@/content/sr";
import { HelpContent } from "@/features/help/components/HelpContent";
import { PublicShell } from "@/features/help/components/PublicShell";

export const metadata = { title: sr.misc.help.title, description: sr.seo.pages.help };

export default function HelpPage() {
  return (
    <PublicShell title={sr.misc.help.title}>
      <HelpContent faqHref="/faq" />
    </PublicShell>
  );
}
