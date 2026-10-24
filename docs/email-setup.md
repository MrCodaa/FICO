# Mejlovi: Resend, domen i blacklist

Aplikacija šalje mejlove preko **Resend**-a samo za: potvrdu emaila, reset lozinke i odobren/odbijen profil. Zahtjevi i matchevi nemaju mail, samo zvonce.

Lokalno (`EMAIL_PROVIDER=console` ili bez `RESEND_API_KEY`) mailovi se ispisuju u log servera i ništa ne treba podešavati.

## 1. Domen u Resendu (SPF i DKIM)

Bez verifikovanog domena Resend šalje samo na adresu vlasnika naloga (`onboarding@resend.dev`).

1. Prijavi se na https://resend.com i otvori **Domains**.
2. Klikni **Add Domain**, upiši domen (npr. `mail.tvojdomen.com`; poddomen je preporučen) i izaberi region.
3. Resend prikaže DNS zapise. Dodaj ih kod svog DNS provajdera (Cloudflare, Namecheap, GoDaddy...):
   - **DKIM**: TXT zapis (`resend._domainkey`) sa dugom javnom vrijednošću.
   - **SPF**: TXT zapis (`send`) sa vrijednošću `v=spf1 include:amazonses.com ~all`, i MX zapis (`send`) koji Resend navede.
   - Opciono **DMARC**: TXT `_dmarc` sa `v=DMARC1; p=none;`.
4. Vrijednosti kopiraj tačno onako kako ih Resend prikazuje. Neki provajderi sami dodaju domen na kraj imena, pa ga ne upisuj duplo.
5. Vrati se u Resend i klikni **Verify DNS Records**. Propagacija zna trajati od par minuta do nekoliko sati. Kad status postane **Verified**, domen je spreman.

## 2. API ključ

1. U Resendu: **API Keys** > **Create API Key**.
2. Dozvola **Sending access**, a domen izaberi onaj koji si verifikovao.
3. Kopiraj ključ (prikazuje se samo jednom) u env kao `RESEND_API_KEY`.
4. U env upiši i pošiljaoca: `EMAIL_FROM="FICO <noreply@mail.tvojdomen.com>"` (adresa mora biti na verifikovanom domenu).
5. `APP_URL` mora biti javni URL aplikacije jer ga mailovi koriste za linkove.

## 3. Webhook za blacklist neispravnih adresa

Kad mejl ne može da se isporuči (adresa ne postoji) ili ga primalac prijavi kao spam, Resend javlja našoj aplikaciji. Mi tada upišemo `User.emailBlockedAt`, više ne šaljemo mailove na tu adresu, a korisnik na Kontrolnoj tabli vidi crvenu karticu "Ne primaš mejlove!" sa dugmetom **Odblokiraj** (skida blokadu i šalje novi mejl za potvrdu).

1. U Resendu: **Webhooks** > **Add Webhook**.
2. **Endpoint URL**: `APP_URL/api/webhooks/resend` (npr. `https://tvojdomen.com/api/webhooks/resend`). Mora biti javno dostupan, pa lokalno koristi tunel (npr. ngrok) ako testiraš.
3. **Events** izaberi samo:
   - `email.bounced`
   - `email.complained`
4. Sačuvaj. Otvori webhook i kopiraj **Signing Secret** (počinje sa `whsec_`) u env kao `RESEND_WEBHOOK_SECRET`.
5. Redeploy da env varijabla stupi na snagu.

Napomene:

- Blokira samo trajni (hard, `Permanent`) bounce i prijava spama. Privremeni bounce (puna sanduče, privremena greška) se ignoriše.
- Zahtjevi bez ispravnog Svix potpisa dobijaju 401, a potpisi stariji od 5 minuta se odbijaju.
- Test: u Resendu pod webhookom klikni **Send test event** ili pošalji mejl na `bounced@resend.dev` (Resendova testna adresa koja uvijek vraća bounce).

## 4. Env varijable (sažetak)

| Varijabla | Šta je |
| --- | --- |
| `EMAIL_PROVIDER` | `console`, `resend` ili prazno (Resend ako postoji ključ) |
| `RESEND_API_KEY` | API ključ iz koraka 2 |
| `EMAIL_FROM` | pošiljalac na verifikovanom domenu |
| `RESEND_WEBHOOK_SECRET` | Signing Secret iz koraka 3 |
| `APP_URL` | javni URL aplikacije |

## 5. Migracija baze

Blacklist traži kolone `User.emailBlockedAt` i `User.emailBlockReason` (migracija `20261023120000_email_block`). Primijeni je na bazu prije deploya: `npm run db:migrate` lokalno na dev branchu, a na produkciji `npx prisma migrate deploy`.
