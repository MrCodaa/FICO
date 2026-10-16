import { PageBand, PageContainer } from "@/components/ui/page";
import { sr } from "@/content/sr";

export default function PrivacyPage() {
  return (
    <>
      <PageBand title={sr.misc.privacy.title} />
      <PageContainer>
        <p className="text-muted-foreground text-lg">{sr.misc.privacy.placeholder}</p>
      </PageContainer>
    </>
  );
}
