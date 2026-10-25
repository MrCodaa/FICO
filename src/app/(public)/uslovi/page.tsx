import { LegalDocument } from "../_components/LegalDocument";
import { terms } from "@/content/legal";
import { sr } from "@/content/sr";

export const metadata = { title: terms.title, description: sr.seo.pages.terms };

export default function TermsPage() {
  return <LegalDocument doc={terms} />;
}
