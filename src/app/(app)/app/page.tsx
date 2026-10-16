import { PageBand } from "@/components/ui/page";
import { sr } from "@/content/sr";

// Kontrolna tabla — sadržaj dolazi u koraku 7 (docs/ui-spec.md §4).
export default function DashboardPage() {
  return <PageBand title={sr.nav.dashboard} />;
}
