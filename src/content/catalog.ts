import { rawCitiesByCountry } from "./cities-data";

export interface Country {
  code: string;
  name: string;
  region: string;
}

export const countries: Country[] = [
  { code: "BA", name: "Bosna i Hercegovina", region: "Zapadni Balkan" },
  { code: "RS", name: "Srbija", region: "Zapadni Balkan" },
  { code: "HR", name: "Hrvatska", region: "Jadran" },
  { code: "ME", name: "Crna Gora", region: "Zapadni Balkan" },
  { code: "MK", name: "Makedonija", region: "Zapadni Balkan" },
  { code: "SI", name: "Slovenija", region: "Jadran" },
] as const;

// Kodovi država koji više nisu u katalogu, a mogu postojati u starim profilima u bazi.
// Čitanje ih tolerantno mapira (baza se ne mijenja); null = nepoznata država.
// Vraćanje Kosova kao zasebne države: vidi izvještaj (vrati XK u countries i blok gradova, ukloni ovaj unos).
export const legacyCountryCodes: Record<string, string | null> = { XK: "RS", AL: null };

export function normalizeCountryCode(code: string | null | undefined): string | null {
  if (!code) return null;
  if (code in legacyCountryCodes) return legacyCountryCodes[code] ?? null;
  return code;
}

// Stara imena gradova (prije ujednačavanja na bosansku/federalnu upotrebu) -> trenutno ime u katalogu.
// Profili u bazi čuvaju grad kao tekst, pa stari unosi i dalje prolaze validaciju i prikaz.
export const legacyCityNames: Record<string, Record<string, string>> = {
  BA: {
    Brod: "Bosanski Brod",
    Kostajnica: "Bosanska Kostajnica",
    Kneževo: "Skender Vakuf",
    "Kozarska Dubica": "Bosanska Dubica",
    Šamac: "Bosanski Šamac",
    Gradiška: "Bosanska Gradiška",
    "Novi Grad": "Bosanski Novi",
  },
};

/** Staro ime grada -> trenutno ime iz kataloga; sve ostalo vraća nepromijenjeno. */
export function normalizeCityName(city: string, countryCode?: string | null): string {
  const maps = countryCode ? [legacyCityNames[countryCode]] : Object.values(legacyCityNames);
  for (const map of maps) {
    const hit = map && Object.prototype.hasOwnProperty.call(map, city) ? map[city] : undefined;
    if (hit) return hit;
  }
  return city;
}

export const countryCodes: readonly string[] = countries.map((c) => c.code);

// Region se izvodi iz države (CLAUDE.md). Ne nudi se kao preferenca lokacije.
export const regionByCountry: Record<string, string> = Object.fromEntries(
  countries.map((c) => [c.code, c.region]),
);

// Gradovi i veća naselja po državi (podaci u cities-data.ts): bez duplikata, sortirano po abecedi.
export const citiesByCountry: Record<string, string[]> = Object.fromEntries(
  Object.entries(rawCitiesByCountry).map(([code, list]) => [
    code,
    [...new Set(list)].sort((a, b) => a.localeCompare(b, "sr")),
  ]),
);

export interface Interest {
  code: string;
  label: string;
}

export const interests: Interest[] = [
  { code: "AI_ML", label: "AI/ML" },
  { code: "FINTECH", label: "Fintech" },
  { code: "ECOMMERCE", label: "E-commerce" },
  { code: "SAAS", label: "SaaS" },
  { code: "MARKETPLACE", label: "Marketplace" },
  { code: "HEALTHTECH", label: "HealthTech" },
  { code: "EDTECH", label: "EdTech" },
  { code: "GAMING", label: "Gaming" },
  { code: "HARDVER", label: "Hardver" },
  { code: "KLIMA_ODRZIVOST", label: "Klima/Održivost" },
  { code: "WEB3", label: "Web3" },
  { code: "MOBILNE_APLIKACIJE", label: "Mobilne aplikacije" },
  { code: "DEVELOPER_ALATI", label: "Developer alati" },
  { code: "CYBERSECURITY", label: "Cybersecurity" },
  { code: "LOGISTIKA", label: "Logistika" },
  { code: "MEDIJI_ZABAVA", label: "Mediji i zabava" },
  { code: "PUTOVANJA", label: "Putovanja" },
  { code: "NEKRETNINE", label: "Nekretnine" },
] as const;

export const interestCodes: readonly string[] = interests.map((i) => i.code);
