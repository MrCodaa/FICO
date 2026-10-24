Trenutni interfejs ne odgovara onome što sam tražio. FICO mora biti kopija YC Co-Founder Matching-a 1:1, plus samo dvije FICO funkcije (tri odluke i Poruke). Mnogo stvari koje se podrazumijevaju kod YC-a nisu urađene.

Izvor istine za sve što se vidi u interfejsu je `docs/ui-spec.md` i slike u `docs/reference/`. Ažurirao sam i `CLAUDE.md` da se slaže sa njima. Šema i API ostaju kako su, osim dodataka navedenih u sekciji 10 `ui-spec.md`.

Radi ovim redom:

1. **Pročitaj** `CLAUDE.md`, cijeli `docs/ui-spec.md` i otvori svih 7 slika iz `docs/reference/`.

2. **Revizija, bez mijenjanja koda.** Prođi kroz postojeći kod i napravi tabelu po ekranima (Okvir/meni/footer, Otkrij profile, Javni profil, Kontrolna tabla, Uredi profil, Podešavanja, Ponovo pogledaj, Zahtjevi, Poruke). Za svaku stavku iz specifikacije napiši: ✅ urađeno kako treba / ⚠️ urađeno drugačije (šta tačno) / ❌ fali. Na kraju navedi sve što postoji u kodu a nije u specifikaciji (npr. Kurikulum, procenat poklapanja), jer to treba ukloniti. Pokaži mi tabelu i plan izmjena i sačekaj moje "ok".

3. **Implementacija**, po ovom redosledu, svaki korak do kraja prije sljedećeg:
   1. Okvir aplikacije: lijevi sticky meni sa podmenijima (Ponovo pogledaj profile ▸, Moj nalog ▸), footer, zvonce, vizuelni stil kao YC. Ukloni Kurikulum i sve što nije u specifikaciji.
   2. Komponenta za prikaz profila (sredina), tačno po sekciji 2. Ista komponenta se koristi na Discover, Javnom profilu i u koraku "Pregled profila".
   3. Otkrij profile: desna sticky kolona sa tri odluke, brojačem zahtjeva, Zašto se slažete, Tvoji filteri, Prijavi/Blokiraj; prazno stanje.
   4. Javni profil `/app/profiles/[id]` sa desnom kolonom po odnosu (tabela u sekciji 3).
   5. Uredi profil: 4 koraka sa kvačicama, sva pitanja iz onboardinga, iste Zod šeme i isti komponenti polja kao onboarding.
   6. Migracija iz sekcije 10, zatim Podešavanja sa svim opcijama, resetom preskočenih i brisanjem naloga. Dodaj nove endpointe u `docs/api.md`. Pauziran nalog uključi u `visibleTo`, `hideAge` u mapper profila, a `emailNone` i email checkboxove u `EmailService`.
   7. Kontrolna tabla sa 4 kartice, Kako funkcioniše, Tvoji filteri i karticom o povjerenju (`/api/dashboard`).
   8. Ponovo pogledaj (3 liste), Zahtjevi i Poruke: provjeri da su po sekcijama 7–9 i doradi šta fali.

4. **Provjera, za svaki ekran.** Pokreni app sa seed podacima, Playwright-om napravi screenshot na 1920×1080 i uporedi ga sa odgovarajućom slikom iz `docs/reference/`: raspored, redoslijed sekcija, sticky kolone, tekstovi. Ispravi razlike. Zatim prođi cijeli tok sa dva naloga: registracija → profil → odobrenje → Discover → Sviđa mi se sa porukom → drugi nalog prihvata → poruke u oba smjera → Podešavanja (pauza, sakrij godine, reset preskočenih).

5. Na kraju pokreni `npm run lint`, `npm run typecheck` i `npm run test` i popravi greške. Pošalji mi kratku listu šta je promijenjeno, po ekranima.

Pravila:
- Svi tekstovi na srpskom (latinica) u `src/content/sr.ts`. Koristi tekstove iz specifikacije doslovno.
- Ne dodaji ekrane, sekcije, polja, biblioteke ni "poboljšanja" kojih nema u specifikaciji. Ako nešto nije opisano, uradi kako radi YC na slikama. Ako ni to nije jasno, pitaj me.
- Ne diraj algoritam matchinga, osim što procenat više ne prikazuješ.
