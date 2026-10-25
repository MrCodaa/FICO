import { describe, expect, it } from "vitest";

import { citiesByCountry } from "@/content/catalog";
import { profileDraftSchema } from "@/features/profile/schemas";

import { findCatalogCity, searchCities } from "./cities-search";

describe("cities-search", () => {
  it("ignoriše dijakritike i velika/mala slova", () => {
    expect(findCatalogCity("sarajevo", "BA")).toBe("Sarajevo");
    expect(findCatalogCity("nis", "RS")).toBe("Niš");
    expect(findCatalogCity("DJAKOVICA", "RS")).toBe("Đakovica");
    expect(searchCities("RS", "NIS")).toContain("Niš");
  });

  it("filtrira po državi", () => {
    expect(searchCities("BA", "zagreb")).toEqual([]);
    expect(findCatalogCity("Zagreb", "BA")).toBeNull();
  });

  it("katalog nema sela, gradskih djelova ni duplikata", () => {
    for (const unwanted of ["Novi Beograd", "Zemun", "Futog", "Petrovaradin"]) {
      expect(findCatalogCity(unwanted, "RS")).toBeNull();
    }
    expect(findCatalogCity("Gazi Baba", "MK")).toBeNull();
    expect(findCatalogCity("Bečići", "ME")).toBeNull();
    expect(citiesByCountry.ME).toHaveLength(25);
    for (const list of Object.values(citiesByCountry)) {
      expect(new Set(list).size).toBe(list.length);
    }
  });

  it("Zod šema prihvata samo grad iz kataloga i vraća zvanični zapis", () => {
    expect(profileDraftSchema.parse({ city: "sabac" }).city).toBe("Šabac");
    expect(profileDraftSchema.parse({ city: "  sarajevo ", countryCode: "BA" }).city).toBe("Sarajevo");
  });

  it("Zod šema i dalje prihvata uklonjene stare gradove iz profila, a Beograd preuzima prigradske opštine", () => {
    expect(profileDraftSchema.parse({ city: "Gračac", countryCode: "HR" }).city).toBe("Gračac");
    expect(profileDraftSchema.parse({ city: "Ada", countryCode: "RS" }).city).toBe("Ada");
    expect(profileDraftSchema.parse({ city: "Obrenovac", countryCode: "RS" }).city).toBe("Beograd");
    expect(profileDraftSchema.safeParse({ city: "Gračac", countryCode: "RS" }).success).toBe(false);
    expect(searchCities("HR", "gračac")).toEqual([]);
  });

  it("Zod šema odbija svoj grad, prazan grad i grad iz druge države", () => {
    const own = profileDraftSchema.safeParse({ city: "Mali Selo" });
    expect(own.success).toBe(false);
    if (!own.success) expect(own.error.issues[0]?.message).toBe("Greška: izaberi grad sa spiska.");
    expect(profileDraftSchema.safeParse({ city: "12" }).success).toBe(false);
    expect(profileDraftSchema.safeParse({ city: "" }).success).toBe(false);
    expect(profileDraftSchema.safeParse({ city: "Zagreb", countryCode: "BA" }).success).toBe(false);
  });
});
