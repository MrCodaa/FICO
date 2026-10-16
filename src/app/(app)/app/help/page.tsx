import { PageBand, PageContainer } from "@/components/ui/page";
import { sr } from "@/content/sr";

export default function HelpPage() {
  return (
    <>
      <PageBand title={sr.misc.help.title} />
      <PageContainer>
        <p className="text-muted-foreground text-lg">{sr.misc.help.placeholder}</p>
      </PageContainer>
    </>
  );
}
