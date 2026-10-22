import { countries } from "@/content/catalog";
import { sr } from "@/content/sr";

// Rečenice-rezimei iz odgovora u profilu, kao na YC-u ("I'm technical, ready
// within three months, and have some ideas…"). Čiste funkcije: vraćaju dijelove
// teksta, a ključne riječi su označene kao bold. Koriste ih prikaz profila,
// "Tvoji filteri" i kartice u listama.

export interface SummaryPart {
  text: string;
  bold?: boolean;
}

type Forms = readonly [string, string, string];

const s = sr.profileView.summary;
const areaOptions = sr.profile.steps.more.areaOptions;

/** Rodna forma: [muški, ženski, neodređeno]. */
export function byGender(forms: Forms, gender: string | null | undefined): string {
  if (gender === "MALE") return forms[0];
  if (gender === "FEMALE") return forms[1];
  return forms[2];
}

const b = (text: string): SummaryPart => ({ text, bold: true });
const t = (text: string): SummaryPart => ({ text });

/** "a", "a i b", "a, b i c" — svaki element je niz dijelova. */
export function joinParts(items: SummaryPart[][], last: string = s.and): SummaryPart[] {
  const out: SummaryPart[] = [];
  items.forEach((item, i) => {
    if (i > 0) out.push(t(i === items.length - 1 ? last : ", "));
    out.push(...item);
  });
  return out;
}

function capitalizeFirst(parts: SummaryPart[]): SummaryPart[] {
  const [first, ...rest] = parts;
  if (!first) return parts;
  return [{ ...first, text: first.text.charAt(0).toUpperCase() + first.text.slice(1) }, ...rest];
}

export function areaLabel(code: string): string {
  return areaOptions[code as keyof typeof areaOptions] ?? code;
}

export function countryName(code: string | null | undefined): string | null {
  if (!code) return null;
  return countries.find((c) => c.code === code)?.name ?? code;
}

function timingPhrase(timing: string | null | undefined): string | null {
  if (!timing) return null;
  return s.timing[timing as keyof typeof s.timing] ?? null;
}

export interface SelfSummaryInput {
  gender?: string | null;
  isTechnical: boolean | null;
  timing: string | null;
  ideaStatus: string | null;
}

/** "Ja sam **tehnički**, spreman **odmah**, i **imam ideju**." */
export function selfSummary(p: SelfSummaryInput): SummaryPart[] | null {
  const clauses: SummaryPart[][] = [];
  if (p.isTechnical != null) {
    clauses.push([b(byGender(p.isTechnical ? s.technical : s.nonTechnical, p.gender))]);
  }
  const timing = timingPhrase(p.timing);
  if (timing) clauses.push([t(byGender(s.ready, p.gender)), b(timing)]);

  const ideaForms = p.ideaStatus ? s.idea[p.ideaStatus as keyof typeof s.idea] : undefined;
  const idea = ideaForms ? b(byGender(ideaForms, p.gender)) : null;

  if (clauses.length === 0 && !idea) return null;
  if (clauses.length === 0 && idea) return [...capitalizeFirst([idea]), t(".")];

  const parts: SummaryPart[] = [t(s.iAm), ...joinParts(clauses, ", ")];
  if (idea) parts.push(t(s.andComma), idea);
  parts.push(t("."));
  return parts;
}

/** "Spreman sam da preuzmem **Product**, **Engineering** i **Operations**." */
export function areasSummary(p: { gender?: string | null; areas: string[] | null }): SummaryPart[] | null {
  const areas = p.areas ?? [];
  if (areas.length === 0) return null;
  return [t(byGender(s.areasLead, p.gender)), ...joinParts(areas.map((a) => [b(areaLabel(a))])), t(".")];
}

export interface IdealInput {
  technical: string | null;
  idea: string | null;
  timingImportance: string | null;
  location: string | null;
  interestsImportance: string | null;
}

export interface OwnerInput {
  timing: string | null;
  city: string | null;
  countryCode: string | null;
}

/** "Idealno, moj co-founder je **tehnički**, **u mojoj zemlji (Srbija)** i **dijeli moje interese**." */
export function idealSummary(pref: IdealInput, owner: OwnerInput): SummaryPart[] | null {
  const clauses: SummaryPart[][] = [];
  if (pref.idea === "HAS_IDEA" || pref.idea === "OPEN_TO_IDEAS") clauses.push([b(s.wantIdea[pref.idea])]);
  if (pref.technical === "TECHNICAL") clauses.push([b(s.wantTechnical)]);
  if (pref.technical === "NON_TECHNICAL") clauses.push([b(s.wantNonTechnical)]);

  const timing = pref.timingImportance ? timingPhrase(owner.timing) : null;
  if (timing) clauses.push([t(s.wantTiming), b(timing)]);

  const country = countryName(owner.countryCode);
  if (pref.location === "SAME_CITY" && owner.city) clauses.push([b(s.wantSameCity(owner.city))]);
  else if (pref.location === "SAME_COUNTRY" && country) clauses.push([b(s.wantSameCountry(country))]);


  if (pref.interestsImportance) clauses.push([b(s.wantInterests)]);

  if (clauses.length === 0) return null;
  return [t(s.ideallyLead), ...joinParts(clauses), t(".")];
}

/** "Želim co-foundera koji će preuzeti **Engineering**, **Design** i **Product**." */
export function wantedAreasSummary(wantedAreas: string[] | null | undefined): SummaryPart[] | null {
  const areas = wantedAreas ?? [];
  if (areas.length === 0) return null;
  return [t(s.wantAreasLead), ...joinParts(areas.map((a) => [b(areaLabel(a))])), t(".")];
}

/** "Aktivan danas" / "Aktivna prije 3 dana". */
export function activeLabel(lastActiveAt: Date | string, now: Date, gender?: string | null): string {
  const days = Math.max(0, Math.floor((now.getTime() - new Date(lastActiveAt).getTime()) / 86_400_000));
  if (days === 0) return byGender(sr.profileView.activeToday, gender);
  return byGender(sr.profileView.activeDaysAgo(days) as unknown as Forms, gender);
}

/** Običan tekst (bez bold oznaka) — za kartice u listama. */
export function plainText(parts: SummaryPart[] | null): string {
  return parts ? parts.map((p) => p.text).join("") : "";
}
