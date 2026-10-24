# FICO — UI specifikacija (izvor istine za izgled i tok)

Pravilo broj 1: **FICO je kopija YC Co-Founder Matching-a.** Raspored, ekrani, redoslijed sekcija,
tekstovi i ponašanje se kopiraju 1:1 (prevedeno na srpski, latinica). Jedine razlike su ove dvije
FICO funkcije:

1. **Tri odluke umjesto Invite/Skip/Save** — Sviđa mi se (sa obaveznom porukom), Razmisliću, Ne zanima me.
2. **Poruke** — chat u aplikaciji između korisnika koji su se spojili (match), plus zvonce sa obavještenjima.

Sve što ovdje nije navedeno → uradi kako radi YC na referentnim slikama. Ne izmišljaj dodatne ekrane,
widgete, landing sekcije, animacije ni boje.

Referentne slike (obavezno ih otvori i uporedi): `docs/reference/`

| Slika | Šta prikazuje |
|---|---|
| `yc-discover-1-vrh.png` | Discover: vrh profila, desna kolona sa odlukom |
| `yc-discover-2-sredina.png` | Discover: sredina profila |
| `yc-discover-3-dno.png` | Discover: dno profila, interesi, LinkedIn, footer |
| `yc-my-account-meni.png` | Lijevi meni, otvoren "My Account" |
| `yc-settings.png` | Podešavanja |
| `yc-my-profile.png` | Moj profil (uređivanje u koracima) |
| `yc-dashboard.png` | Kontrolna tabla |

---

## 1. Okvir aplikacije (svaka ulogovana stranica)

Tri zone. Lijeva i desna su **statične** (sticky, ne skroluju se sa sadržajem); skroluje se samo sredina.

```
┌──────────────┬────────────────────────────────────┬──────────────────────┐
│ LIJEVI MENI  │  SREDINA (sadržaj stranice)        │  DESNA KOLONA        │
│ (sticky)     │  skroluje se                       │  (sticky, samo na    │
│              │                                    │   stranama gdje je   │
│              │                                    │   ima: Discover,     │
│              │                                    │   profil, Dashboard) │
└──────────────┴────────────────────────────────────┴──────────────────────┘
                         FOOTER (samo u sredini, na dnu)
```

### Lijevi meni (redoslijed tačno ovaj)

1. Logo + "FICO" (link na Kontrolnu tablu)
2. **Kontrolna tabla** — `/app`
3. **Otkrij profile** — `/app/discover`
4. **Ponovo pogledaj profile** ▸ (podmeni, otvara se na klik, kao na YC)
   - Sviđa mi se (poslati zahtjevi, sa statusom: Na čekanju / Prihvaćeno / Nije prihvaćeno / Isteklo)
   - Razmisliću
   - Ne zanima me
5. **Zahtjevi** — primljeni zahtjevi (profil pošiljaoca + njegova poruka + Prihvati / Odbij), sa brojačem
6. **Poruke** — lista matcheva i chat, sa brojačem nepročitanih
7. **Moj nalog** ▸ (podmeni, avatar korisnika lijevo, kao na YC)
   - Uredi profil — `/app/profile`
   - Podešavanja — `/app/settings`
   - Odjavi se

Aktivna stavka je podebljana/istaknuta kao na YC. Zvonce sa obavještenjima stoji gore desno u
sredini (ili uz logo), sa brojem nepročitanih.

**Nema** stavki "Kurikulum" ni "YC vodič" — za sada ih ne prikazuj uopšte.

### Footer (dno sredine)

Logo FICO · O nama · Privatnost · FAQ · Pomoć · Odjavi se — u jednom redu, kao na `yc-discover-3-dno.png`.

### Vizuelni stil

Kao YC: bijela pozadina sredine, bež traka sa naslovom stranice na vrhu ("FICO" sitno iznad,
naslov krupno), kartice sa tankim sivim okvirom, sekcije profila sa bež zaglavljem. Primarno dugme
zeleno (kao "Invite to connect"), sekundarno sivo (kao "Skip for now"). Bez gradijenata, bez sjenki
osim blagih, bez hero sekcija.

---

## 2. Otkrij profile (`/app/discover`) — glavni ekran

Prikazuje **jedan** profil odjednom, kompletan, kao `yc-discover-1/2/3`. Cilj: korisnik pročita
sve što je drugi napisao.

### Sredina — profil (redoslijed tačno ovaj)

1. "‹ Nazad"
2. **Zaglavlje**: krupna okrugla slika, ime i prezime, ispod u redu: 📍 grad, država · 🎂 godine
   (ne prikazuj ako je korisnik sakrio godine) · 🕒 "Aktivan/na prije X dana"
3. **Kartica-rezime** (rečenice generisane iz odgovora, ključne riječi podebljane):
   - "Ja sam **tehnički**, spreman/na **odmah / kad nađem co-foundera / u narednih godinu dana**, i **imam ideju / imam ideje ali sam otvoren / nemam ideju**."
   - "Spreman/na sam da preuzmem **Product**, **Engineering**, … i **Operations**."
4. **O meni** (bež zaglavlje): Uvod · Životna priča · Slobodno vrijeme · Ostalo (`intro`, `lifePath`, `freeTime`, `other`)
5. **Moja pozadina**: Impresivno postignuće · Obrazovanje · Zaposlenje (`accomplishment`, `education`, `employment`)
6. **Potencijalne ideje** (`ideas`) — samo ako postoji
7. **Šta tražim u co-founderu**: rečenica-rezime njegovih preferenci ("Idealno, moj co-founder je **tehnički**, **u mojoj zemlji (Srbija)** i **dijeli moje interese**.") · Idealan co-founder (`lookingFor`) · Očekivanja oko udjela (`equityExpectations`)
8. **Interesi**: "Naši zajednički interesi" (zeleni čipovi) + "Moji interesi" (sivi čipovi, ostali)
9. Link "Pogledaj na LinkedInu" (ako postoji)
10. Footer

Prazna polja se ne prikazuju (ni naslov ni prazan okvir).

### Desna kolona (sticky) — ovo zamjenjuje YC Invite/Skip/Save

Redoslijed:

1. **Kartica "Sviđa mi se"** (mjesto YC "Invite to connect"):
   - textarea, placeholder: "Ako te zanima rad sa ovom osobom, napiši kratku poruku i klikni »Sviđa mi se«."
   - zeleno dugme **Sviđa mi se** — onemogućeno dok je poruka prazna (1–500 znakova, brojač)
   - ispod: "(Ostalo ti je **N** zahtjeva ove sedmice.)"
2. Ispod kartice, dva dugmeta jedno pored drugog:
   - **Razmisliću** (mjesto YC "Save to favorites")
   - **Ne zanima me** (sivo, mjesto YC "Skip for now")
3. Svaka od tri odluke odmah učitava sljedeći profil (bez reloada cijele strane).
4. **"Zašto se slažete"** — kartica sa do 3 razloga iz algoritma (npr. "Oboje ste u Srbiji", "Traži tehničkog — ti si tehnički").
5. **Tvoji filteri** + dugme **Uredi** (vodi na Uredi profil → korak Preference): rečenice-rezime korisnikovih preferenci, kao na YC.
6. Sitni kurziv tekst: "Molimo ne kontaktiraj nikoga van FICO platforme bez njihove saglasnosti." + link **Prijavi profil** ("ako misliš da prodaje usluge, zapošljava ili radi bilo šta osim traženja co-foundera") — otvara modal sa razlogom; tu je i **Blokiraj**.

### Prazno stanje

Kad nema više profila: poruka u sredini "Trenutno nema novih profila koji odgovaraju tvojim filterima." + dugmad "Uredi filtere" i "Pogledaj profile o kojima razmišljaš".

---

## 3. Javni profil (`/app/profiles/[id]`)

Isti prikaz kao Discover (sredina identična). Desna kolona zavisi od odnosa:

| Odnos | Desna kolona |
|---|---|
| Nema odluke | Iste tri odluke kao na Discover |
| Razmisliću / Ne zanima me | Iste tri odluke (može se promijeniti mišljenje) |
| Poslao sam zahtjev | "Zahtjev poslat [datum]" + status + moja poruka |
| Primio sam zahtjev | Njegova poruka + **Prihvati** / **Odbij** |
| Match | Dugme **Otvori poruke** |

Ovaj prikaz se koristi iz: Ponovo pogledaj profile, Zahtjevi, Poruke (klik na ime).

---

## 4. Kontrolna tabla (`/app`) — kao `yc-dashboard.png`

Bež traka: "Kontrolna tabla".

Lijevo, kartice u mreži (2 u redu):

1. 🔍 "**N** osnivača u tvom redu odgovara tvojim kriterijumima!" → dugme **Pogledaj profile** (Discover)
2. ★ "Imaš **N** profila o kojima razmišljaš." → **Pogledaj sačuvane** (Ponovo pogledaj → Razmisliću)
3. ✉ "Imaš **N** novih zahtjeva." → **Pogledaj zahtjeve**
4. 💬 "Imaš **N** nepročitanih poruka." → **Otvori poruke**
5. 🤝 (FICO dodatak, samo kad korisnik ima bar jedan match) "Imaš **N** matcheva." → **Pogledaj svoje matcheve** (Poruke)

Desno (kolona):

1. **Kako funkcioniše** — tekst: "Na stranici Otkrij profile vidiš jedan profil odjednom. Ako ti se neko sviđa, pošalji mu kratku poruku — dobiće obavještenje i email sa tvojim profilom. Ako prihvati, spojićemo vas i možete se dopisivati u Porukama. Da bi iskustvo bilo dobro za sve, možeš poslati **20** zahtjeva sedmično."
2. **Tvoji filteri** + **Uredi**
3. Kartica o povjerenju zajednice: "Povjerenje zajednice nam je jako važno. Ako te neko uznemirava, koristi platformu da prodaje usluge ili radi bilo šta osim traženja co-foundera, ili te kontaktira bez saglasnosti van platforme — prijavi ga."

Ako profil još nije odobren: na vrhu sredine traka "Tvoj profil čeka odobrenje" (ili razlog odbijanja + link na Uredi profil), a kartice za Discover su onemogućene.

---

## 5. Uredi profil (`/app/profile`) — kao `yc-my-profile.png`

Bež traka: sitno "FICO", krupno "Moj profil".

Uvodni tekst ispod trake: "Dobro došao/la na svoj profil! Sve što ovdje napišeš biće prikazano u procesu spajanja. Napiši koliko god želiš, ali imaj na umu: što više napišeš o sebi, lakše je potencijalnom co-founderu da procijeni da li želi da radi sa tobom."

Lijevo kartica "Moj profil" sa koracima (zelena kvačica kad je korak kompletan, aktivni korak istaknut plavom pozadinom):

1. **Osnovno**
2. **Više o tebi**
3. **Preference za co-foundera**
4. **Pregled profila** (prikazuje profil tačno kako ga drugi vide — isti komponent kao Discover)

Desno forma trenutnog koraka (bež zaglavlje sa nazivom koraka). **Sva pitanja iz registracije/onboardinga su ovdje** i mogu se mijenjati — isti Zod šeme, isti komponenti polja kao u onboardingu (DRY: jedan skup komponenti za oba mjesta).

- Osnovno: slika (krug + "Promijeni sliku"), ime, prezime, email (samo prikaz), LinkedIn URL + "Nemam LinkedIn profil", lokacija (država + grad), uvod, video, postignuće, obrazovanje, zaposlenje, tehnički (da/ne), pol, datum rođenja, link za zakazivanje, X/Twitter, Instagram.
- Više o tebi: ideja (status + opis), već ima co-foundera, kada full-time, oblasti, interesi, udio, slobodno vrijeme, životna priča, ostalo.
- Preference: šta tražiš (tekst) + svaka preferenca sa "Obavezno / Poželjno / Bez preference" kao na YC.

Dugme **Sačuvaj** na dnu svakog koraka. Izmjene odobrenog profila su odmah vidljive (bez ponovnog review-a).

---

## 6. Podešavanja (`/app/settings`) — kao `yc-settings.png`

Bež traka: "Podešavanja". Jedna forma, redoslijed:

1. **Da li želiš da tvoj profil bude aktivan?** (radio)
   - Da, prikaži moj profil potencijalnim co-founderima
   - Ne, pauziraj moj nalog
2. **Koje emailove želiš da primaš?** (checkboxovi)
   - Novi zahtjevi i matchevi
   - Nova poruka od matcha
   - Podsjetnici da odgovoriš na zahtjeve (najviše jednom sedmično)
   - Sedmične novosti i predlozi profila
   - Obavještenje kad se pridruži novi profil koji odgovara svim tvojim preferencama
   - Najave novih funkcija
   - Pozivi na događaje uživo u tvojoj oblasti
   - Bez ikakvih lifecycle emailova (isključuje sve gore)
3. **Sa kim si postao/la co-founder?** — select sa tvojim matchevima; podnaslov "Odgovori iskreno; ovo će biti prikazano za oboje."
4. **Da li želiš da sakriješ godine od potencijalnih co-foundera?** (radio) Da, sakrij · Ne, prikaži
5. Dugme **Sačuvaj** + tekst stanja "Nema nesačuvanih izmjena" / "Imaš nesačuvane izmjene"
6. Plavo dugme **Resetuj preskočene profile (N)** — briše sve "Ne zanima me" odluke, uz potvrdu
7. Link **Obriši nalog** — modal sa potvrdom (upiši email), briše nalog (cascade)

---

## 7. Ponovo pogledaj profile (`/app/revisit/[liked|thinking|declined]`)

Lista kartica (slika, ime, lokacija, rezime-rečenica, datum odluke). Klik → javni profil (sekcija 3).
Na "Sviđa mi se" listi svaka kartica ima status bedž. Sortirano od najnovijeg.

## 8. Zahtjevi (`/app/requests`)

Lista primljenih zahtjeva na čekanju: kartica sa profilom pošiljaoca, njegova poruka, **Prihvati** / **Odbij**, "Ističe za X dana". Klik na ime → javni profil.

## 9. Poruke (`/app/messages`, `/app/messages/[matchId]`)

Lijevo lista matcheva (slika, ime, zadnja poruka, vrijeme, tačka za nepročitano), desno chat.
Samo matchevi — na čekanju i odbijeni se ne prikazuju ovdje (oni su u Ponovo pogledaj → Sviđa mi se).
Prva poruka u chatu je originalna poruka iz zahtjeva. Real-time: SSE + POST, kako je u `docs/api.md`.

---

## 10. Promjene u bazi koje ova specifikacija traži

Dodaj jednom migracijom (`npx prisma migrate dev --name settings`), ništa više:

| Model | Polje | Svrha |
|---|---|---|
| `Profile` | `hideAge Boolean @default(false)` | Podešavanja: sakrij godine |
| `User` | `pausedAt DateTime?` | Podešavanja: pauziraj nalog (pauziran = isključen iz Discover-a, kao nevidljiv) |
| `User` | `cofounderMatchId String?` | Podešavanja: sa kim si postao co-founder (FK na `Match`, `onDelete: SetNull`) |
| `Preference` | `emailInvites`, `emailMessages`, `emailReminders`, `emailWeekly`, `emailAnnouncements`, `emailEvents` — svi `Boolean @default(true)`; `emailNone Boolean @default(false)` | Podešavanja: emailovi (`alertOnNewMatch` već postoji = "novi profil koji odgovara") |

`emailNone = true` gasi sve ostale pri slanju (provjera u `EmailService`, ne u UI-ju).

Novi endpointi (dodaj ih i u `docs/api.md`):

| Metoda | Ruta | Guard | Šta radi |
|---|---|---|---|
| GET | `/api/settings` | auth | Vraća podešavanja |
| PATCH | `/api/settings` | auth | Mijenja podešavanja (Zod šema `settingsSchema`) |
| DELETE | `/api/decisions/not-interested` | onboarded | Resetuj preskočene profile; vraća broj obrisanih |
| DELETE | `/api/me` | auth | Briše nalog (traži email u body-ju kao potvrdu), briše cookie |
| GET | `/api/dashboard` | onboarded | Brojači za kartice Kontrolne table |
