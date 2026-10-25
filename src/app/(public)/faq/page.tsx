import { sr } from "@/content/sr";
import { FaqAccordion } from "@/features/help/components/FaqAccordion";
import { PublicShell } from "@/features/help/components/PublicShell";

export const metadata = { title: sr.misc.faq.title, description: sr.seo.pages.faq };

export default function FaqPage() {
  return (
    <PublicShell title={sr.misc.faq.title}>
      <FaqAccordion />
    </PublicShell>
  );
}
