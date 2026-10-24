import { describe, expect, it } from "vitest";

import { citiesByCountry, countries } from "@/content/catalog";

// Minimalni brojevi zvaničnih jedinica lokalne samouprave (donja granica, da niko ne ispadne).
const MIN_COUNT: Record<string, number> = {
  BA: 140,
  RS: 150,
  HR: 540,
  ME: 25,
  MK: 70,
  SI: 212,
  XK: 38,
  AL: 61,
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

  it("broj unosa ne pada ispod broja zvaničnih opština i gradova", () => {
    for (const [code, min] of Object.entries(MIN_COUNT)) {
      expect(citiesByCountry[code]?.length ?? 0, code).toBeGreaterThanOrEqual(min);
    }
  });
});
