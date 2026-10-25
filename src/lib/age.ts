export function computeAge(birthDate: Date, now: Date): number {
  let age = now.getFullYear() - birthDate.getFullYear();
  const monthDiff = now.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

/** Najmanja dozvoljena starost korisnika i najranija prihvatljiva godina rođenja. */
export const MIN_AGE = 18;
export const MIN_BIRTH_YEAR = 1900;

export type BirthDateIssue = "invalid" | "out_of_range" | "underage";

/**
 * Jedino mjesto pravila za datum rođenja (Zod šema profila i živa poruka u formi).
 * Računa u UTC jer `<input type="date">` i z.coerce.date daju ponoć UTC, pa ne zavisi od vremenske zone.
 */
export function birthDateIssue(birthDate: Date, now: Date): BirthDateIssue | null {
  if (Number.isNaN(birthDate.getTime())) return "invalid";
  const year = birthDate.getUTCFullYear();
  if (year < MIN_BIRTH_YEAR || birthDate.getTime() > now.getTime()) return "out_of_range";
  let age = now.getUTCFullYear() - year;
  const monthDiff = now.getUTCMonth() - birthDate.getUTCMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getUTCDate() < birthDate.getUTCDate())) age--;
  return age < MIN_AGE ? "underage" : null;
}
