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
  { code: "MK", name: "Sjeverna Makedonija", region: "Zapadni Balkan" },
  { code: "SI", name: "Slovenija", region: "Jadran" },
  { code: "XK", name: "Kosovo", region: "Zapadni Balkan" },
  { code: "AL", name: "Albanija", region: "Jugoistok" },
] as const;

export const countryCodes: readonly string[] = countries.map((c) => c.code);

// Region se izvodi iz države (CLAUDE.md). Koristi se u lib/matching za SAME_REGION.
export const regionByCountry: Record<string, string> = Object.fromEntries(
  countries.map((c) => [c.code, c.region]),
);

export const citiesByCountry: Record<string, string[]> = {
  BA: ["Sarajevo", "Banja Luka", "Tuzla", "Mostar", "Zenica"],
  RS: ["Beograd", "Novi Sad", "Niš", "Kragujevac", "Subotica"],
  HR: ["Zagreb", "Split", "Rijeka", "Osijek", "Zadar"],
  ME: ["Podgorica", "Nikšić", "Budva", "Bar", "Herceg Novi"],
  MK: ["Skoplje", "Bitola", "Kumanovo", "Ohrid", "Prilep"],
  SI: ["Ljubljana", "Maribor", "Celje", "Kranj", "Koper"],
  XK: ["Priština", "Prizren", "Peć", "Gnjilane", "Mitrovica"],
  AL: ["Tirana", "Drač", "Vlora", "Elbasan", "Škodra"],
};

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
