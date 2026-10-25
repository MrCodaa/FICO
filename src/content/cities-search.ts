import { citiesByCountry, legacyCityNames, removedCityNames } from "@/content/catalog";

// Pretraga i poređenje gradova. Čista logika (bez I/O), dijele je combobox u formi
// i Zod šema profila, pa forma i API vide isto pravilo. Grad se bira isključivo iz kataloga.

/** Za poređenje: mala slova, bez dijakritika, đ i dj se izjednačavaju (Đakovo = Djakovo = Dakovo). */
export function foldText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/đ/g, "d")
    .replace(/dj/g, "d")
    .replace(/\s+/g, " ")
    .trim();
}

export function cleanCityInput(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

const allCities: { name: string; folded: string }[] = Object.values(citiesByCountry)
  .flat()
  .map((name) => ({ name, folded: foldText(name) }));

/**
 * Tačan grad iz kataloga (ignoriše dijakritike i velika/mala slova); country sužava izbor.
 * allowRemoved: prihvata i uklonjene (stare) gradove iz profila u bazi i vraća ih nepromijenjene;
 * izbor i autocomplete to ne uključuju.
 */
export function findCatalogCity(value: string, countryCode?: string, allowRemoved = false): string | null {
  const folded = foldText(value);
  if (!folded) return null;
  const legacy = (countryCode ? [legacyCityNames[countryCode]] : Object.values(legacyCityNames))
    .flatMap((map) => Object.entries(map ?? {}))
    .find(([old]) => foldText(old) === folded);
  if (legacy) return legacy[1];
  const pool = countryCode
    ? (citiesByCountry[countryCode] ?? []).map((name) => ({ name, folded: foldText(name) }))
    : allCities;
  const hit = pool.find((c) => c.folded === folded)?.name;
  if (hit || !allowRemoved) return hit ?? null;
  const removed = (countryCode ? [removedCityNames[countryCode]] : Object.values(removedCityNames))
    .flatMap((list) => list ?? [])
    .find((name) => foldText(name) === folded);
  return removed ?? null;
}

/** Prijedlozi za izabranu državu: prvo počinje sa upitom, pa početak neke riječi, pa sadrži. */
export function searchCities(countryCode: string, query: string, limit = 50): string[] {
  const cities = citiesByCountry[countryCode] ?? [];
  const q = foldText(query);
  if (!q) return cities.slice(0, limit);

  const ranked: { name: string; rank: number }[] = [];
  for (const name of cities) {
    const folded = foldText(name);
    const index = folded.indexOf(q);
    if (index === -1) continue;
    const rank = index === 0 ? 0 : folded[index - 1] === " " || folded[index - 1] === "-" ? 1 : 2;
    ranked.push({ name, rank });
  }
  ranked.sort((a, b) => a.rank - b.rank || a.name.localeCompare(b.name, "sr-Latn"));
  return ranked.slice(0, limit).map((r) => r.name);
}
