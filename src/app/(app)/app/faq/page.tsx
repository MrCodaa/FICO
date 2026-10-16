import { PageBand, PageContainer } from "@/components/ui/page";
import { sr } from "@/content/sr";

export default function FaqPage() {
  return (
    <>
      <PageBand title={sr.misc.faq.title} />
      <PageContainer>
        <p className="text-muted-foreground text-lg">{sr.misc.faq.placeholder}</p>
      </PageContainer>
    </>
  );
}
