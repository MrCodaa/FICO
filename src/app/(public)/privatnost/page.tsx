import { LegalDocument } from "../_components/LegalDocument";
import { privacy } from "@/content/legal";
import { sr } from "@/content/sr";

export const metadata = { title: privacy.title, description: sr.seo.pages.privacy };

export default function PrivacyPage() {
  return <LegalDocument doc={privacy} />;
}
