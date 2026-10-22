// PRIVREMENO, dok gradimo ključne funkcije: otvoren ulaz u lokalnom razvoju.
//   - prijava prolazi sa bilo kojim emailom i lozinkom (nepostojeći nalog se napravi)
//   - bez pravila platforme i bez admin odobrenja: poslat profil je odmah odobren
// Radi samo uz `npm run dev`. Na Vercelu (production) i u testovima je isključeno,
// pa se tamo ne može ući u tuđi nalog. Kad budemo vraćali pravila, ovdje stavi `false`.
export const OPEN_ACCESS = process.env.NODE_ENV === "development";
