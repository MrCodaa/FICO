import { PageBand, PageContainer } from "@/components/ui/page";
import { sr } from "@/content/sr";

export default function AboutPage() {
  return (
    <>
      <PageBand title={sr.misc.about.title} />
      <PageContainer>
        <p className="text-muted-foreground text-lg">{sr.misc.about.placeholder}</p>
      </PageContainer>
    </>
  );
}
