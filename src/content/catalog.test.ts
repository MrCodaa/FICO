import { describe, expect, it } from "vitest";

import { citiesByCountry, countries, isRemovedCityName, legacyCityNames, normalizeCityName } from "@/content/catalog";
import { kosovoMunicipalities } from "@/content/cities-data";
import { findCatalogCity } from "@/content/cities-search";

// Tačni brojevi po pravilu države (vidi docs/gradovi-izvori.md).
const EXPECTED_COUNT: Record<string, number> = {
  BA: 139, // 79 FBiH + 64 RS (Kupres i Trnovo isto ime u oba entiteta) + Brčko + Istočno Sarajevo; Skender Vakuf = Kneževo (jedan unos)
  RS: 28 + 38, // 27 pravnih gradova + Beograd, plus 38 opština Kosova
  HR: 128, // pravni gradovi
  ME: 25,
  MK: 71,
  SI: 69, // naselja sa statusom mesta
};

describe("catalog gradova", () => {
  it("svaka država ima gradove i svaki grad pripada postojećoj državi", () => {
    const codes = countries.map((c) => c.code);
    expect(Object.keys(citiesByCountry).sort()).toEqual([...codes].sort());
    for (const code of codes) expect(citiesByCountry[code]?.length ?? 0).toBeGreaterThan(0);
  });

  it("nema praznih imena, razmaka na krajevima ni duplikata (bez obzira na velika slova)", () => {
    for (const [code, list] of Object.entries(citiesByCountry)) {
      const seen = new Set<string>();
      for (const name of list) {
        expect(name.trim(), `${code}: prazno ime`).not.toBe("");
        expect(name, `${code}: ${name}`).toBe(name.trim());
        const key = name.toLowerCase();
        expect(seen.has(key), `${code}: duplikat ${name}`).toBe(false);
        seen.add(key);
      }
    }
  });

  it("broj unosa je tačno broj gradova po pravilu države", () => {
    for (const [code, count] of Object.entries(EXPECTED_COUNT)) {
      expect(citiesByCountry[code]?.length ?? 0, code).toBe(count);
    }
    expect(kosovoMunicipalities).toHaveLength(38);
  });

  it("Srbija: samo pravni gradovi (i Kosovo), bez opština i gradskih opština", () => {
    const rs = citiesByCountry.RS ?? [];
    for (const name of ["Beograd", "Zaječar", "Valjevo", "Bor", "Pirot", "Vranje", "Novi Pazar", "Užice", "Šabac"]) expect(rs, name).toContain(name);
    for (const name of ["Ada", "Voždovac", "Mladenovac", "Obrenovac", "Lazarevac", "Barajevo", "Grocka", "Sopot", "Surčin", "Aranđelovac", "Smederevska Palanka", "Inđija"]) {
      expect(rs, name).not.toContain(name);
    }
    for (const name of kosovoMunicipalities) expect(rs, name).toContain(name);
  });

  it("Hrvatska ima samo gradove, Slovenija samo mesta, bez općina i ostalih občina", () => {
    for (const name of ["Gračac", "Konavle", "Medulin", "Blato", "Ston", "Orebić", "Vela Luka"]) expect(citiesByCountry.HR).not.toContain(name);
    for (const name of ["Zagreb", "Popovača", "Požega", "Komiža"]) expect(citiesByCountry.HR).toContain(name);
    for (const name of ["Ankaran", "Kostel", "Bohinj", "Brda"]) expect(citiesByCountry.SI).not.toContain(name);
    for (const name of ["Ljubljana", "Bled", "Piran", "Višnja Gora"]) expect(citiesByCountry.SI).toContain(name);
  });

  it("uklonjeni gradovi: prihvaćeni pri čitanju i validaciji, ne nude se u katalogu", () => {
    expect(isRemovedCityName("Gračac", "HR")).toBe(true);
    expect(isRemovedCityName("Ada", "RS")).toBe(true);
    expect(isRemovedCityName("Bohinj", "SI")).toBe(true);
    expect(isRemovedCityName("Zagreb", "HR")).toBe(false);
    expect(findCatalogCity("Gračac", "HR")).toBeNull();
    expect(findCatalogCity("gracac", "HR", true)).toBe("Gračac");
    expect(findCatalogCity("Ada", "RS", true)).toBe("Ada");
    expect(findCatalogCity("Ada", "HR", true)).toBeNull();
    expect(normalizeCityName("Gračac", "HR")).toBe("Gračac");
    for (const sub of ["Mladenovac", "Obrenovac", "Lazarevac", "Barajevo", "Grocka", "Sopot", "Surčin"]) {
      expect(normalizeCityName(sub, "RS")).toBe("Beograd");
      expect(findCatalogCity(sub, "RS")).toBe("Beograd");
    }
    expect(normalizeCityName("Mladenovac", "HR")).toBe("Mladenovac");
  });

  it("poznati granični i sporni slučajevi su u pravoj državi i nigdje drugdje", () => {
    const placed: Record<string, string> = {
      Neum: "BA",
      Kupres: "BA",
      Livno: "BA",
      Brčko: "BA",
      Vukovar: "HR",
      Ilok: "HR",
      Dubrovnik: "HR",
      Piran: "SI",
      "Herceg Novi": "ME",
      Ulcinj: "ME",
      Bitola: "MK",
      Ohrid: "MK",
      "Novi Pazar": "RS",
    };
    for (const [name, code] of Object.entries(placed)) {
      for (const [c, list] of Object.entries(citiesByCountry)) {
        expect(list.includes(name), `${name} u ${c}`).toBe(c === code);
      }
    }
  });

  it("ukinute opštine Makedonije (spojene u Kičevo 2013) nisu u katalogu", () => {
    for (const name of ["Zajas", "Oslomej", "Drugovo", "Vraneštica"]) {
      expect(citiesByCountry.MK).not.toContain(name);
    }
  });

  it("BiH koristi bosansku (predratnu) upotrebu imena, a stara imena se mapiraju na nova", () => {
    const ba = citiesByCountry.BA ?? [];
    for (const name of ["Bosanski Brod", "Bosanska Kostajnica", "Bosanska Dubica", "Bosanski Šamac", "Bosanska Gradiška", "Bosanski Novi", "Skender Vakuf", "Istočno Sarajevo", "Foča"]) {
      expect(ba, name).toContain(name);
    }
    for (const old of ["Srpski Brod", "Srbinje", "Srpsko Sarajevo", "Srpska Kostajnica", "Kneževo", "Kozarska Dubica", "Brod", "Kostajnica", "Šamac", "Gradiška", "Novi Grad"]) {
      expect(ba, old).not.toContain(old);
    }
    for (const [old, now] of Object.entries(legacyCityNames.BA ?? {})) {
      expect(ba, now).toContain(now);
      expect(normalizeCityName(old, "BA")).toBe(now);
      expect(findCatalogCity(old, "BA")).toBe(now);
    }
    expect(normalizeCityName("Sarajevo", "BA")).toBe("Sarajevo");
  });

  it("država MK se zove Makedonija", () => {
    expect(countries.find((c) => c.code === "MK")?.name).toBe("Makedonija");
  });
});
