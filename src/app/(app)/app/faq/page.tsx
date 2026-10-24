import { PageBand, PageContainer } from "@/components/ui/page";
import { sr } from "@/content/sr";
import { FaqAccordion } from "@/features/help/components/FaqAccordion";

export default function FaqPage() {
  return (
    <>
      <PageBand title={sr.misc.faq.title} />
      <PageContainer width="narrow">
        <FaqAccordion />
      </PageContainer>
    </>
  );
}
