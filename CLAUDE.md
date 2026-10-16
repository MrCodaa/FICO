# FICO — Find Co-Founder za Balkan

Platforma za pronalazak co-foundera: **kopija YC Co-Founder Matching-a 1:1** (raspored, ekrani, tekstovi, ponašanje) plus dvije FICO funkcije: tri odluke umjesto Invite/Skip i Poruke (chat) za matcheve. Korisnik pravi profil (YC set pitanja), admin ga ručno odobrava, a zatim kroz Otkrij profile gleda kandidate jedan po jedan, uz razloge zašto se slažu. Za svakog bira **Sviđa mi se**, **Razmisliću** ili **Ne zanima me**. Lajk je zahtjev sa porukom, a chat se otključava tek kad drugi prihvati.

Interfejs je na našem jeziku, latinica.

## Izvor istine

- `prisma/schema.prisma`: šema baze (cijela, od Faze 0)
- `docs/api.md`: svi endpointi, guardovi, kodovi grešaka i transakcije
- `docs/ui-spec.md` + slike u `docs/reference/`: izgled i tok svakog ekrana. **Za sve što se vidi u interfejsu ovo ima prednost** nad ostatkom ovog fajla.
- ovaj fajl: stack, arhitektura, principi, poslovna pravila, faze

## Pravila rada (obavezno)

1. Implementiraj tačno šemu i API iz fajlova iznad. Ne izmišljaj modele, polja ni rute. Ako nešto fali ili je nejasno, stani i pitaj.
2. Radi jednu fazu po razgovoru. Prvo plan, pa implementacija tek kad se plan odobri.
3. Ne dodaji biblioteke van stacka bez pitanja.
4. Svi tekstovi interfejsa idu u `src/content/sr.ts`, na latinici. Katalozi (interesi, države, regioni, gradovi) idu u `src/content/catalog.ts`.
5. Poštuj principe ispod. Pattern uvodi samo tamo gdje smanjuje kod ili rizik.
6. Na kraju faze pokreni `npm run lint`, `npm run typecheck` i `npm run test`, i popravi sve greške.
7. Ne pokreći seed nad produkcijskom bazom.

## Stack (zaključano)

- Next.js 16 (App Router), TypeScript strict, monolit. Middleware je `proxy.ts`.
- PostgreSQL na Neonu, **Prisma 7.10** (`prisma`, `@prisma/client`, `@prisma/adapter-pg`, sve `@7`). Ne koristi 8.x RC, iako ga npm trenutno vodi kao `latest`.
  - `prisma.config.ts` drži `DIRECT_URL` za migracije.
  - `src/lib/db.ts` pravi jedan `PrismaClient` sa `PrismaPg` adapterom i pooled `DATABASE_URL` (singleton zbog hot reload-a).
  - Klijent se importuje iz `@/generated/prisma/client`.
- REST Route Handlers → service → repository; Zod validacija (iste šeme koriste forme i API)
- Auth: vlastiti. Lozinke su bcrypt (cost 12). JWT preko `jose` (HS256, 7 dana, payload `{ sub, tv }`) u cookie-ju `fico_session` (`httpOnly; Secure; SameSite=Lax`).
- Email: Resend iza `EmailProvider`, a `ConsoleEmailProvider` ispisuje mailove u log (`EMAIL_PROVIDER=console`)
- Slike: Vercel Blob iza `StorageProvider`; slika profila je obavezna (jpeg/png/webp, ≤ 4 MB, klijent smanjuje na 800 px)
- UI: Tailwind + shadcn/ui, react-hook-form + zodResolver, TanStack Query
- Testovi: Vitest (obavezno za `lib/matching` i servise sa pravilima), Postman kolekcija
- Hosting: Vercel + Vercel Cron (jednom dnevno)

## Arhitektura

```text
src/
  app/
    (public)/            landing, prijava, registracija, potvrda emaila, reset lozinke
    (app)/               dashboard, discover, revisit, requests, messages, profile, settings, profiles/[id]
    admin/               pregled profila, prijave, deaktivacija
    api/                 tanke REST rute (samo withRoute + poziv servisa)
  features/
    auth/ profile/ discover/ requests/ chat/ notifications/ admin/ safety/
      service.ts         poslovna pravila, transakcije
      repository.ts      jedino mjesto sa Prisma upitima
      schemas.ts         Zod šeme (forme + API)
      mappers.ts         DTO: toProfileView, toProfileCard, …
      components/
  lib/
    matching/            čisti algoritam (bez I/O) + testovi
    http/withRoute.ts    guard, parsiranje, mapiranje grešaka, touchLastActive
    container.ts         composition root: bira implementacije prema env-u
    auth/  email/  storage/  db.ts  errors.ts  clock.ts
  content/sr.ts, catalog.ts
  generated/prisma/      Prisma klijent (generisano, u .gitignore)
prisma/                  schema.prisma, migrations/, seed.ts
docs/api.md
prisma.config.ts
```

## Principi koda

**SOLID**
- **S:** route = HTTP, service = pravila, repository = podaci, `lib/matching` = računanje, mapper = oblik odgovora.
- **O:** novi kriterijum matchinga, email ili storage provider je novi fajl u registru, bez izmjene postojećeg koda.
- **L:** `ConsoleEmailProvider` i `ResendEmailProvider` su zamjenjivi, a testovi koriste fake istog interfejsa.
- **I:** mali interfejsi: `EmailProvider { send }`, `StorageProvider { put, remove }`, `Clock { now }`. Repo je po funkcionalnosti.
- **D:** servisi dobijaju zavisnosti kroz fabriku (`createRequestService({ repo, email, clock })`), a `lib/container.ts` ih povezuje.

**DRY**
- Jedna osnovna Zod šema profila: `.partial()` za nacrt, stroga za slanje, ista za formu.
- `withRoute(handler, { guard, body, query })` za svaki endpoint; rute ne pišu `try/catch`.
- Pravila koja postoje samo jednom: `visibleTo(viewerId)`, `effectiveStatus(request, now)`, `toDisplayStatus(request, now)`, `touchLastActive(userId)` (opisano u `docs/api.md`).
- DTO mapperi; modeli iz baze nikad ne idu direktno u odgovor.

**KISS**
- Bez queue-a, event busa i keša. Admin ide preko `ADMIN_EMAILS`.
- Profil je jedna tabela sa nullable poljima, a kompletnost provjerava Zod pri slanju.
- Interesi su `String[]` iz kataloga. Region se izvodi iz države.
- Istek zahtjeva se računa pri čitanju, a cron ga samo upisuje. Matching se računa na zahtjev, u memoriji.

**ACID**
- Svaka operacija koja mijenja više redova ide u jednu `prisma.$transaction` (tabela u `docs/api.md`).
- Limit lajkova: `SELECT 1 FROM "User" WHERE id = $1 FOR UPDATE` na pošiljaocu na početku transakcije.
- Promjene statusa idu kao uslovni `updateMany` (npr. `where: { id, status: 'PENDING' }`); 0 redova → 409.
- Prisma `P2002` (unique) → 409. Mailovi i brisanje starih slika idu tek **poslije** commita.

## Matching (lib/matching)

Čiste funkcije, Strategy patern: svaki kriterijum je `{ key, weight, evaluate(viewer, candidate) → { score: 0..1, reason?: string } }` u registru. Težine su u `lib/matching/config.ts`.

Za korisnika A:
1. **Isključi** sebe, nevidljive (`visibleTo`), sve sa zahtjevom u bilo kom smjeru (bilo koji status) ili matchem, Decision `THINKING` mlađi od 30 dana i `NOT_INTERESTED` mlađi od 90 dana.
2. **Obavezni uslovi:** svaki kriterijum sa `Importance.REQUIRED` mora biti ispunjen, i A → B i B → A. U SQL ide lako filtrirljivo (država/region, godine, tehnički), a ostatak u TypeScript.
3. `fit(A→B) = Σ wᵢ·sᵢ / Σ wᵢ`, samo po kriterijumima gdje A ima preferencu (`null` = preskoči). Bez ijedne preference koriste se interesi i oblasti.
4. `score = (fit(A→B) + fit(B→A)) / 2 · a(B)`, gdje je a(B) = 1,0 (aktivan ≤ 7 dana), 0,9 (≤ 30), 0,75 (stariji).
5. Sortiraj opadajuće po score-u, a izjednačene po `lastActiveAt`.
6. **Razlozi:** top 3 po doprinosu (težina × score), iz oba smjera, kao rečenice iz `content/sr.ts`.

| Kriterijum | sᵢ | REQUIRED znači | Težina |
| --- | --- | --- | --- |
| Tehnički | 1 ako odgovara, inače 0 | sᵢ = 1 | 3 |
| Oblasti (`wantedAreas` vs `areas`) | udio traženih oblasti koje B preuzima | bar jedna | 3 |
| Ideja (`idea` vs `ideaStatus`) | HAS_IDEA↔COMMITTED, OPEN_TO_IDEAS↔OPEN = 1; EXPLORING = 0,5 | sᵢ = 1 | 2 |
| Timing (A.timing vs B.timing) | 1 isti, 0,5 susjedni, 0 ostalo | sᵢ = 1 | 2 |
| Lokacija (grad / država / region) | 1 u opsegu; za SAME_CITY 0,5 ako je ista država | sᵢ = 1 | 2 |
| Interesi | zajednički / min(broj A, broj B) | bar jedan | 2 |
| Godine | 1 u rasponu, linearno do 0 na 5 godina van raspona | u rasponu | 1 |

Testovi: po jedan za svaki kriterijum, REQUIRED isključuje u oba smjera, slučaj bez preferenci, redosled, najviše 3 razloga i vremenski prozori odluka (uz fake `Clock`).

## Poslovna pravila

- **Navigacija i ekrani:** tačno kako piše u `docs/ui-spec.md` (Kontrolna tabla, Otkrij profile, Ponovo pogledaj profile ▸, Zahtjevi, Poruke, Moj nalog ▸ Uredi profil / Podešavanja / Odjavi se; footer; zvonce). Nema Kurikuluma ni vodiča.
- **Discover:** kao YC: cijeli profil u sredini, desno sticky kolona sa porukom + Sviđa mi se, Razmisliću, Ne zanima me, "ostalo N zahtjeva ove sedmice", Zašto se slažete (3 razloga), Tvoji filteri, Prijavi profil. Procenat poklapanja se ne prikazuje (koristi se samo za sortiranje).
- **Lajk:** poruka je obavezna (1–500). Limit je 20 u zadnjih 7 dana (rolling). Razmisliću i Ne zanima me ne troše limit. Lajk briše postojeći Decision.
- **Zahtjev:** ističe 14 dana poslije slanja. Primalac bira Prihvati (match + chat) ili Odbij. Pošiljalac u "Sviđa mi se" vidi `PENDING`, `MATCHED` ili `NOT_ACCEPTED` (odbijen i istekao izgledaju isto).
- **Odbijanje je tiho:** bez obavještenja i maila.
- **Match:** poruka iz zahtjeva je prva poruka u chatu. Poruke prikazuju samo matcheve.
- **Chat:** slanje ide POST-om. SSE stream traje oko 50 s, provjerava nove poruke svake 2 s i obnavlja se preko `Last-Event-ID`. Fallback je polling na 3 s. Ako nije član ili postoji blokada → 403.
- **Zvonce:** `REQUEST_RECEIVED`, `MATCH_CREATED`, `PROFILE_APPROVED`, `PROFILE_REJECTED`, `NEW_MATCHING_PROFILE`, `SYSTEM`. Mail ide za potvrdu emaila, reset lozinke, odobren/odbijen profil, novi zahtjev i match.
- **Sigurnost:** prijava ide u admin red. Blokiranje sakriva korisnika u oba smjera i odbija pending zahtjeve između njih.
- **Profil:** YC set pitanja, autosave nacrta (lokalno + `PATCH` na "Sačuvaj i nastavi"). Dok je na pregledu, profil je zaključan (409). Izmjene poslije odobrenja idu odmah uživo.

## Faze

| # | Faza | API | Gotovo kada |
| --- | --- | --- | --- |
| 0 | Postavka: Next, Tailwind, shadcn, Prisma 7.10 + Neon, **cijela šema kao prva migracija**, Vitest, `withRoute`, `container`, skripte, deploy | — | prazna stranica radi na Vercelu, a migracija je primijenjena |
| 1 | Landing | — | landing je na produkciji i radi na telefonu |
| 2 | Registracija, potvrda emaila, prijava, odjava, reset lozinke, guardovi | `/api/auth/*`, `/api/me` | link iz loga potvrđuje nalog, nepotvrđen ne prolazi, Postman je zelen |
| 3 | Pravila platforme (6 potvrda) | `/api/agreement` | bez prihvatanja nema pristupa profilu |
| 4 | Profil u 4 koraka + slika + autosave + slanje na pregled | `/api/profile*`, `/api/preference` | podaci preživljavaju izlazak usred koraka, a poslat profil ne ulazi u Discover |
| 5 | Admin pregled | `/api/admin/profiles*` | odobren ulazi u aplikaciju, a odbijen ispravlja i šalje ponovo |
| 6 | `lib/matching` + testovi, seed (~40 profila), Discover, Razmisliću / Ne zanima me, Pregledani | `/api/discover/next`, `/api/profiles/:userId`, `/api/decisions*` | Vitest zelen, red sortiran, bez sebe, blokiranih i profila sa zahtjevom ili svježom odlukom |
| 7 | Lajk + poruka, Zahtjevi, status u Pregledanim, istek + cron, zvonce, mailovi | `/api/requests*`, `/api/notifications*`, `/api/me/counts`, cron | dva naloga dođu do matcha, 21. lajk je odbijen, a odbijanje je tiho |
| 8 | Poruke (SSE + POST + polling), nepročitane | `/api/matches*` | poruke stižu za manje od 3 s, a bez matcha je 403 |
| 9 | Prijava, blokiranje, deaktivacija, Podešavanja, Kontrolna tabla, FAQ, Pomoć, Postman, finalni deploy | `/api/blocks*`, `/api/reports`, `/api/admin/reports*`, `/api/admin/users/:userId/deactivate` | cijeli tok radi na produkciji sa dva naloga |

## Komande (Faza 0 ih dodaje u package.json)

```bash
npm run dev          # lokalni server
npm run lint
npm run typecheck    # tsc --noEmit
npm run test         # vitest run
npm run db:migrate   # prisma migrate dev
npm run db:generate  # prisma generate
npm run db:seed      # samo lokalno / preview
npm run db:studio    # prisma studio
```

## Environment

`DATABASE_URL` (pooled), `DIRECT_URL`, `JWT_SECRET`, `APP_URL`, `EMAIL_PROVIDER` (console | resend), `RESEND_API_KEY`, `EMAIL_FROM`, `BLOB_READ_WRITE_TOKEN`, `ADMIN_EMAILS`, `CRON_SECRET`. Sve ide u `.env.example` bez vrijednosti.
