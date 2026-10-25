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

## Gradovi (katalog)
- [ ] Neko iz svake države pregleda svoj spisak (docs/gradovi-izvori.md). Slovenija (69 mesta) i Hrvatska (128) su sa Wikipedije, ne iz zakona.
- [ ] Odlučiti o izuzecima za mjesta koja nisu pravni gradovi, a poznata su (npr. Preševo, Bujanovac); vlasnik je tražio da se nikome ne uskrati ono što mu pripada.
- [ ] Politička odluka o Kosovu (sada 38 opština pod Srbijom) potvrđena prije javnog puštanja.

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

## Domen i mreža
- [ ] Domen kupljen i povezan sa Vercelom; `APP_URL` postavljen na taj domen (koriste ga mejlovi, `robots.txt`, `sitemap.xml` i dijeljenje linka).
- [ ] Preusmjerenje `www` na root domen (ili obrnuto) postavljeno u Vercelu, tako da postoji jedna kanonska adresa.
- [ ] Vercel Pro ako se uvede monetizacija (Hobby plan je samo za nekomercijalnu upotrebu); provjeriti i da je `maxDuration = 60` na SSE ruti dozvoljen na planu.

## Mejl (dopuna)
- [ ] Uz SPF i DKIM postavljen i DMARC zapis (npr. `v=DMARC1; p=none; rua=mailto:...`, kasnije pooštriti).
- [ ] Probana isporuka mejlova (potvrda, reset, odobren profil) na Gmail i Outlook, uključujući folder neželjene pošte.
- [ ] `ADMIN_NOTIFY_EMAILS` ostavljen uključen (zadano) ili ugašen sa `false`; probano da admin dobija mejl za novi profil na pregledu i novu prijavu.

## Cron i chat (probe na produkciji)
- [ ] Probana ruta `/api/cron/expire-requests` sa zaglavljem `Authorization: Bearer <CRON_SECRET>` (200 sa tajnom, 401 bez nje) i provjerena da je cron upisan u Vercelu.
- [ ] SSE chat (`/api/matches/:id/stream`) probano na Safariju (macOS i iOS) i na Androidu; poruke stižu za manje od 3 s, a fallback polling radi kad se stream prekine.

## Uređaji
- [ ] Probano na pravom iOS Safariju i Android Chromeu: registracija, profil sa slikom, Otkrij profile, Zahtjevi, Poruke, Podešavanja.

## Pravno
- [ ] Pravnik pregledao Politiku privatnosti i Uslove korištenja (`src/content/legal.ts`): to su NACRTI. Popuniti markere `[ROK]` (rokovi čuvanja) i `[DRŽAVA]` (mjerodavno pravo), potvrditi pravni osnov obrade i obavezu prijave zbirke podataka kod nadležnog organa.
- [ ] Izvršen pravni pregled referentnih slika: `docs/reference/` je izbačen iz git indeksa i u `.gitignore`, ali istorija gita i dalje sadrži te slike (repo je javan). Odluka o čišćenju istorije (npr. `git filter-repo`) je na vlasniku.

## Lansiranje
- [ ] Zatvorena beta po pozivnicama: prvih 50–100 stvarnih profila prije otvaranja za sve, da Otkrij profile ima koga da prikaže.
- [ ] Bez lažnih profila u produkciji (ni seed, ni ručno pravljeni "demo" nalozi).
- [ ] Odluka o praćenju grešaka (npr. Sentry) i analitici; ako se uvedu, ažurirati Politiku privatnosti (sada kaže da nema analitičkih kolačića).
- [ ] Lektura svih tekstova u `src/content/sr.ts` i `src/content/legal.ts` (pravopis, ton, ijekavica/ekavica dosljedno).
