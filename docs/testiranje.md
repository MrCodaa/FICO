# Testiranje: test nalozi i lokalno pokretanje

Za ručno testiranje sa više korisnika postoji **10 gotovih naloga**. Svi imaju potvrđen email,
prihvaćena pravila i ODOBREN profil, pa se prijavljuješ odmah, bez registracije.

**Lozinka za sve: `Test12345!`**

| Nalog | Ime | Grad | Tehnički | Ideja |
| --- | --- | --- | --- | --- |
| `test1@fico.test` | Tarik | Sarajevo (BA) | da | ima ideju |
| `test2@fico.test` | Ana | Beograd (RS) | ne | otvorena |
| `test3@fico.test` | Marko | Zagreb (HR) | da | istražuje |
| `test4@fico.test` | Lejla | Banja Luka (BA) | ne | ima ideju |
| `test5@fico.test` | Nikola | Novi Sad (RS) | da | otvoren |
| `test6@fico.test` | Ines | Ljubljana (SI) | ne | istražuje |
| `test7@fico.test` | Emir | Podgorica (ME) | ne | ima ideju |
| `test8@fico.test` | Maja | Split (HR) | da | otvorena |
| `test9@fico.test` | Dino | Mostar (BA) | da | istražuje |
| `test10@fico.test` | Jovana | Skopje (MK) | ne | ima ideju |

Uz njih seed pravi ~40 + 15 demo profila (da Otkrij profile ima koga da prikaže), nekoliko
odluka i zahtjeva za testiranje isključivanja, i jedan gotov match.

Nalozi su samo za razvoj. Domen `@fico.test` ne postoji, pa mejl ne može stići na njega.

## Brza prijava: `/dev/login`

Kad radi `npm run dev`, otvori `http://localhost:3000/dev/login` i jednim klikom se prijavi kao
bilo koji od 10 naloga. Stranica vraća 404 svuda osim u `NODE_ENV=development`, pa na produkciji
ne postoji. Možeš testirati dva naloga istovremeno: jedan u običnom prozoru, drugi u
incognito prozoru.

## Prvo pokretanje (nova mašina)

1. `git pull`, pa `npm install`.
2. Napravi **svoju razvojnu bazu**. Seed briše i pravi naloge, pa ga NIKAD ne pokreći nad
   produkcijskom bazom. Najlakše: Neon → Branches → Create branch `dev` (kopija produkcije).
3. Kopiraj `.env.example` u `.env` i popuni (`.env` nije u gitu, tajne se ne dijele preko repoa):
   - `DATABASE_URL` = pooled connection string tog dev brancha (host ima `-pooler`)
   - `DIRECT_URL` = direct connection string (bez `-pooler`)
   - `JWT_SECRET` = bilo koji nasumičan niz od 32+ znakova
   - `APP_URL=http://localhost:3000`
   - `EMAIL_PROVIDER=console` (mejlovi se ispisuju u terminal, bez Resenda)
   - `ADMIN_EMAILS` = mejl admina (za `/admin`)
4. `npm run db:generate`, `npm run db:migrate`, `npm run db:seed`.
5. `npm run dev`, pa `http://localhost:3000/dev/login`.

Ako je dev baza kopija produkcije, seed će obrisati sve `@fico.test` naloge i napraviti ih iznova.
To je normalno (seed je idempotentan).

## Pravi tok (registracija → admin)

1. `/registracija`: ime, prezime, email, lozinka, LinkedIn. Mejl za potvrdu se ispiše u terminalu
   gdje radi `npm run dev` (link `/potvrda-emaila?token=...`, nalazi se iznad rečenice
   "Ako nisi ti napravio/la nalog").
2. Prijava, pa pravila platforme (6 potvrda), pa profil u 4 koraka sa slikom, pa
   "Pošalji na pregled". Dok admin ne odobri, aplikacija je zaključana.
3. Admin: `/admin/prijava` sa nalogom čiji je mejl u `ADMIN_EMAILS`. Tu vidiš cijelu prijavu i
   biraš Odobri ili Odbij (razlog je obavezan, korisnik ga dobija mejlom i u zvoncu).
   Da test nalog bude admin, dodaj ga u `ADMIN_EMAILS`, npr. `test1@fico.test`, pa restartuj server.
4. Zaboravljena lozinka: link na stranici prijave; link za reset se takođe ispiše u terminalu.

## Slike

Bez `BLOB_READ_WRITE_TOKEN` slike idu u `public/uploads/` (nije u gitu). Za produkciju vidi
`docs/storage-setup.md`. Mejlovi i blacklist: `docs/email-setup.md`.
