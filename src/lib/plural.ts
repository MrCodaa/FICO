/**
 * Srpski plural: 0 = jednina (1, 21, 31…), 1 = mali broj (2–4, 22–24…),
 * 2 = ostalo (0, 5–20, 25…). Koristi se sa trojkama tekstova iz sr.ts.
 */
export function pluralIndex(n: number): 0 | 1 | 2 {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return 0;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 1;
  return 2;
}

export function plural(n: number, forms: readonly [string, string, string]): string {
  return forms[pluralIndex(n)];
}
