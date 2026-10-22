import { PageBand, PageContainer } from "@/components/ui/page";
import { sr } from "@/content/sr";
import { HelpContent } from "@/features/help/components/HelpContent";

export default function HelpPage() {
  return (
    <>
      <PageBand title={sr.misc.help.title} />
      <PageContainer width="narrow">
        <HelpContent faqHref="/app/faq" />
      </PageContainer>
    </>
  );
}
