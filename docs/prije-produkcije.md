# Prije produkcije: lista za provjeru

Ništa od ovoga ne smeta lokalnom radu. Ovo je lista da se ne zaboravi prije prvog pravog korisnika.
Kad stavku završiš, označi je sa [x].

## Tajne i pristup
- [x] GitHub: Secret scanning i Push protection uključeni (repo je javan).
- [x] Neon: lozinka PRODUKCIJSKOG brancha je promijenjena (24.10., greškom dok je bio izabran production). Novi string čuvaj za Vercel.
- [ ] Neon: lozinka DEV brancha (ep-cold-river-bavbiwoe) još treba da se promijeni, jer je stari string bio u razgovoru.
- [ ] Postavljeni na Vercelu (Settings > Environment Variables): `DATABASE_URL` (pooled), `DIRECT_URL`,
      `JWT_SECRET` (nov, 32+ nasumična znaka, ne isti kao lokalno), `CRON_SECRET`, `APP_URL`,
      `ADMIN_EMAILS`, `ADMIN_PATH` (npr. `/upravljanje-k7x2q`; bez njega je admin ugašen),
      `BLOB_READ_WRITE_TOKEN`, `RESEND_API_KEY`, `RESEND_WEBHOOK_SECRET`, `EMAIL_FROM`.
- [ ] `.env` nikad u gitu (provjera: `git ls-files | findstr /i "\.env"` ne smije vratiti ništa osim `.env.example`).

## Baza
- [ ] Na produkcijskoj bazi primijenjene sve migracije: `npx prisma migrate deploy` (nikad `migrate dev`).
- [ ] Seed se NIKAD ne pokreće nad produkcijom. Test nalozi (`@fico.test`) ne postoje u produkciji.
- [ ] Odvojena uloga baze sa najmanje prava za aplikaciju (migracije ostaju na vlasniku): vidi docs/baza-i-sigurnost.md.
- [ ] Neon: provjerena dužina historije/rezervnih kopija (Settings > Restore window).

## Mejl
- [ ] Resend: potvrđen domen (SPF/DKIM), API ključ, webhook na `APP_URL/api/webhooks/resend`
      (događaji `email.bounced` i `email.complained`). Uputstvo: docs/email-setup.md.
- [ ] `sr.supportEmail` (src/content/sr.ts) zamijenjen pravom adresom (sada je izmišljena podrska@fico.app).
- [ ] Probana cijela registracija sa pravim mejlom i blacklist sa izmišljenom adresom.

## Slike
- [ ] Vercel Blob store je Public i token je na Vercelu; probano slanje slike u produkciji.

## Admin
- [ ] Admin panel radi samo na adresi iz `ADMIN_PATH`; `/admin` daje 404.
- [ ] Razmotriti dvofaktorsku prijavu za admina.

## Aplikacija
- [ ] Content-Security-Policy prebaciti iz Report-Only u strogi režim kad se potvrdi da nema prijava.
- [ ] Zaključavanje prijave radi iza Vercela (zaglavlje `x-forwarded-for` daje pravu IP adresu).
- [ ] `npm audit` pregledan (ranjivosti u zavisnostima `@vercel/blob`; `--force` ne koristiti, čekati novu verziju).
- [ ] `npm run lint`, `npm run typecheck`, `npm run test` zeleni; `next build` prolazi.
- [ ] Probano na telefonu: prijava, profil, Otkrij profile, Poruke.
- [ ] Postman kolekcija ažurirana novim rutama.
