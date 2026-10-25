# Baza, slike i sigurnost: kako je sve povezano i kako da pogledaš šta je unutra

Ovaj dokument je pisan običnim jezikom. Sve što piše je provjereno u kodu; gdje nešto nisam mogao da provjerim (jer zavisi od tvog Neon/Vercel naloga), tako i piše.

## 1. Koja je baza povezana

- Baza je **PostgreSQL na Neon-u** (neon.tech). Aplikacija sa njom priča preko **Prisma 7** i `@prisma/adapter-pg` (fajl `src/lib/db.ts`).
- Dvije adrese baze (obje su u tvom lokalnom `.env` fajlu, a imena su u `.env.example`):
  - `DATABASE_URL` je "pooled" adresa. Aplikacija je koristi za svaki upit dok radi.
  - `DIRECT_URL` je direktna adresa. Koristi se samo za migracije (promjene strukture baze), vidi `prisma.config.ts`.
- Konekcija ide preko SSL-a (Neon adrese traže `sslmode=require`). Nisam mogao da vidim tvoju stvarnu adresu jer ne čitam `.env`; provjeri da u njoj piše `sslmode=require`.
- **Kako se bira razvojna a kako produkciona baza:** to određuju vrijednosti `DATABASE_URL` i `DIRECT_URL`. Lokalno su u `.env` (razvojni Neon branch), a na Vercelu u Settings > Environment Variables (produkcioni branch). Isti kod, druge adrese. Zato razvoj nikad ne dira produkcione podatke dok god lokalni `.env` pokazuje na razvojni branch. U Neon konzoli se vide branchevi pod "Branches".

## 2. Kako da vidiš šta je u bazi

### Opcija A: Neon konzola (radi i za produkciju)

1. Otvori https://console.neon.tech i prijavi se.
2. Izaberi projekat (FICO) i gore izaberi **branch** (razvojni ili produkcioni). Pazi koji je izabran.
3. U lijevom meniju klikni **Tables**. Vidiš sve tabele i redove, kao tabelu u Excelu.
4. Za upite klikni **SQL Editor**. Primjer samo za čitanje: `SELECT email, "createdAt" FROM "User" ORDER BY "createdAt" DESC LIMIT 20;`

### Opcija B: Prisma Studio (lokalno)

1. U folderu projekta pokreni `npm run db:studio`.
2. Otvori adresu koju ispiše (obično http://localhost:5555).
3. Vidiš tabele i možeš da mijenjaš redove. Studio koristi adresu iz tvog `.env`, dakle **provjeri da je to razvojni branch** prije nego što išta mijenjaš.

### Upozorenja

- **Sa produkcijom budi oprezan.** Ne briši i ne mijenjaj redove ručno ako ne moraš. Za gledanje koristi samo `SELECT`.
- Šifre korisnika se **ne čuvaju kao šifre**, nego kao bcrypt hash (kolona `passwordHash`, nešto kao `$2b$12$...`). Iz njega se šifra ne može pročitati, ni ti ni ja je ne možemo vidjeti.
- Ne pokreći seed (`npm run db:seed`) nad produkcijom.

### Tabele i šta u kojoj piše

| Tabela | Šta sadrži |
| --- | --- |
| `User` | Nalog: email, bcrypt hash šifre, potvrda emaila, prihvaćena pravila, zadnja aktivnost, deaktivacija/pauza |
| `LoginAttempt` | Brojači pogrešnih prijava za zaključavanje (ključ je email ili IP). Koristi se i za ograničenje otpremanja slika (ključ `upload:<id>`) |
| `AuthToken` | Tokeni za potvrdu emaila i reset šifre (čuva se samo hash tokena, ne sam token) |
| `Profile` | Profil: ime, slika (samo link), grad, pitanja, status (nacrt, na pregledu, odobren, odbijen) |
| `Preference` | Šta korisnik traži kod co-foundera (filteri i važnost) |
| `Decision` | Odluke Razmisliću i Ne zanima me |
| `Request` | Lajk sa porukom (zahtjev), status i rok isteka |
| `Match` | Par korisnika koji su se prihvatili (otvara chat) |
| `Message` | Poruke u chatu između matcheva |
| `Notification` | Obavještenja (zvonce) |
| `Block` | Ko je koga blokirao |
| `Report` | Prijave profila adminu |

Napomena: slike nisu u bazi. U bazi je samo link na sliku (`Profile.photoUrl`) i otisci slike: `photoHash` (SHA-256 sačuvanog fajla) i `photoDHash` (perceptualni dHash, 16 hex). Služe za prepoznavanje tuđe slike: isti `photoHash` na profilu drugog (ne deaktiviranog) korisnika odbija upload; dHash na Hammingovom razmaku ≤ 6 dozvoljava upload, ali postavlja `photoFlaggedAt`/`photoFlagNote` (`<userId>|<ime>`) pa admin vidi upozorenje i linkove "Pretraži sliku". Zamjena slike prepisuje otiske i briše oznaku. Postojeći profili: `npm run db:backfill-photo-hash` (dry run) / `-- --write`, na DEV bazi. AI-generisane slike se ne prepoznaju automatski, admin ih provjerava ručno.

## 3. Kako je baza zaštićena

### Šta već postoji (provjereno u kodu)

- **SQL injection:** sav pristup bazi ide kroz Prisma, koja šalje parametrizovane upite. Pretražio sam cijeli `src` i `prisma` na `$queryRaw`, `$executeRaw` i `Unsafe`. Našao sam **jedno** mjesto: `src/features/requests/repository.ts` (zaključavanje reda pošiljaoca prije lajka). Koristi `$queryRaw` kao oznaku šablona (tagged template), pa se vrijednost šalje kao parametar, bez spajanja teksta. Nema nijedne konkatenacije, pa nije bilo šta da se popravlja. `$queryRawUnsafe` i `$executeRawUnsafe` se ne koriste nigdje.
- **Zod validacija** ulaza na API-ju (iste šeme kao forme).
- **bcrypt cost 12** za šifre (`src/lib/auth/password.ts`), a sesija je potpisan JWT u httpOnly cookie-ju, u produkciji sa `Secure`.
- **SSL** ka Neonu (vidi gore, provjeri `sslmode=require`).
- **Odvojene baze** za razvoj i produkciju (različiti branchevi).
- **Zaključavanje prijave** poslije više pogrešnih pokušaja (tabela `LoginAttempt`).
- **Transakcije i `SELECT ... FOR UPDATE`** za limit lajkova i operacije koje mijenjaju više redova.
- `.env` je u `.gitignore`, pa ne ide na GitHub. Ipak, `.gitignore` pokriva samo `.env` i `.env*.local`; fajlovi tipa `.env.production` nisu pokriveni, pa takve nemoj praviti u projektu (ili dodaj pravilo `.env.*` uz izuzetak za `.env.example`).

### Preporuke po prioritetu

1. **Promijeni lozinku baze (rotacija).** Razvojna adresa baze je jednom bila zalijepljena u chat. Neon konzola > Roles > Reset password, pa novu adresu stavi u lokalni `.env`. Ako je ista uloga ikad korištena za produkciju, promijeni i na Vercelu.
2. **Odvojena uloga baze sa najmanje prava** za aplikaciju (samo čitanje/pisanje redova, bez brisanja tabela), te posebna **read-only uloga** za pregled podataka. Migracije bi radile pod jačom ulogom (`DIRECT_URL`). Ovo se podešava u Neon konzoli (Roles) i SQL-om; nisam ovo mijenjao.
3. **Uključi rezervne kopije.** Neon ima obnavljanje na tačku u vremenu (point-in-time restore) i historiju; dužina zavisi od plana. Nisam mogao provjeriti koji plan imaš ni koliko dana historije je uključeno, pogledaj u Neon konzoli (Settings / Backup & Restore).
4. **Rotiraj `JWT_SECRET`** (nova nasumična vrijednost, bar 32 znaka) ako je ikad bila vidljiva. Posljedica: svi se moraju ponovo prijaviti. Isto vrijedi za `CRON_SECRET` i `RESEND_API_KEY`.
5. **Neon IP allowlist:** postoji u Neonu na nekim planovima, ali Vercel koristi promjenljive IP adrese, pa je uglavnom neupotrebljiv za produkciju bez dodatnog Vercel plana. Nisam mogao provjeriti da li ga tvoj plan podržava.
6. **GitHub secret scanning** uključi u repozitorijumu (Settings > Code security) da te upozori ako se tajna slučajno pojavi u kodu.
7. **Redovno `npm audit`** i ažuriranje paketa.
8. `.env` nikad u git (već je pokriveno, vidi gore).

## 4. Slike

### Gdje se čuvaju

- **Lokalno** (kad nema `BLOB_READ_WRITE_TOKEN`): u folderu `public/uploads/profiles/` u projektu (folder je u `.gitignore`). Možeš ga otvoriti direktno u Exploreru.
- **Produkcija:** Vercel Blob (javni store). Obavezan je `BLOB_READ_WRITE_TOKEN`; bez njega upload jasno pada (ne upisuje na disk). Postavka: `docs/storage-setup.md`.
- Kod: `src/lib/storage/*` (provider za lokalni disk i za Vercel Blob), ruta `src/app/api/profile/photo/route.ts`, pravila u `src/features/profile/service.ts`.
- U bazi se čuva samo link (`Profile.photoUrl`).

### Kako da ih vidiš

- Lokalno: folder `public/uploads/profiles/`.
- Produkcija: Vercel dashboard > projekat > **Storage** > tvoj Blob store > **Browse**.

### Imena fajlova

Ime je `profiles/<nasumični UUID>.<jpg|png|webp>`. UUID je kriptografski nasumičan (`crypto.randomUUID`), pa se ne može pogoditi. **Popravljeno:** ranije je ime sadržalo i `userId`; sada ne sadrži ništa o korisniku.

### Šta je provjereno / popravljeno

| Stavka | Stanje |
| --- | --- |
| Samo JPEG/PNG/WebP po magic bajtima (ne vjeruje se Content-Type zaglavlju; SVG/HTML/GIF se odbijaju) | Već je bilo, ima test |
| Ograničenje 4 MB na serveru | Već je bilo u servisu. **Dodato:** provjera veličine u ruti prije čitanja fajla u memoriju |
| Nasumično ime bez userId | **Popravljeno** (test) |
| `X-Content-Type-Options: nosniff` za `/uploads/*` | **Dodato** u `next.config.ts` (postojeći `Cache-Control` za `/app` je ostao netaknut) |
| Path traversal u `LocalStorageProvider` | Već je bilo (provjera da putanja ostane u folderu), ima test |
| Brisanje stare slike poslije zamjene | Već je bilo (briše se tek pošto je nova upisana), ima test |
| Ograničenje otpremanja: najviše 10 na sat po korisniku | **Dodato.** Bez migracije i bez nove biblioteke, koristi postojeću tabelu `LoginAttempt` (ključ `upload:<userId>`, fiksni prozor od sat vremena). Prekoračenje vraća 429 `TOO_MANY_REQUESTS`. Neispravni fajlovi ne troše limit. (Test je sa lažnim repozitorijumom; sam upit prema bazi nisam mogao pokrenuti jer ne diram bazu.) |
| EXIF/GPS metapodaci | Klijent (`resizeImage.ts`) crta sliku na canvas i izvozi je ponovo, što **briše** EXIF/GPS. Ali to je samo klijent, pa neko može poslati original direktno API-ju. **Dodato:** server sam briše metapodatke (EXIF/XMP/komentari iz JPEG, PNG i WebP) u `src/lib/storage/stripMetadata.ts`, sa testovima. Ako je fajl oštećen, ostaje kakav jeste (tip je ionako provjeren). Server i dalje prihvata sliku do 4 MB, ne samo smanjenu na 800 px (nema biblioteke za pravi resize na serveru) |

### Javni Blob URL: da li je prihvatljiv

Za sada da: slike profila se prikazuju običnim `<img>` i ionako ih vide prijavljeni korisnici. Rizik je da svako ko dobije link može da vidi sliku, bez prijave. Nasumično ime (nepogodivo) taj rizik jako smanjuje, ali ne potpuno: link koji procuri radi dok se slika ne obriše. Za **privatne** slike trebalo bi: privatan store (ili slike van javnog pristupa), zatim ruta u aplikaciji koja provjeri sesiju (i da li smije da vidi taj profil, npr. `visibleTo`) pa tek onda vrati sliku ili kratkotrajan potpisani link. To bi značilo promjenu načina prikaza svih slika; nije urađeno, samo opisano.

### Preporuka za slike

Povremeno proći kroz Blob i obrisati fajlove koje ne koristi nijedan profil (ako upload uspije a upis u bazu padne, ostane siroče). Ovo nisam automatizovao.
