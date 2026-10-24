# Slike profila: podešavanje skladišta

Aplikacija čuva slike profila na **Vercel Blob**-u. Lokalno (bez tokena) automatski upisuje u `public/uploads/` i tu ništa ne treba podešavati. Token ti treba samo za Vercel (produkcija/preview), ili ako lokalno želiš da testiraš pravi Blob.

U produkciji bez `BLOB_READ_WRITE_TOKEN` upload slike jasno pada sa greškom (ne vraća se tiho na disk).

## Pravljenje Blob store-a

1. Prijavi se na https://vercel.com i otvori svoj projekat (FICO).
2. Gore izaberi tab **Storage**.
3. Klikni **Create Database** (ili **Create**) i izaberi **Blob**.
4. Daj ime (npr. `fico-photos`) i izaberi region najbliži bazi (npr. Frankfurt, `fra1`).
5. Pristup izaberi **Public**. Slike profila moraju imati javni URL da bi se prikazivale u `<img>`.
6. Klikni **Create**, pa **Connect Project** i odaberi FICO projekat za sva okruženja (Production, Preview, Development). Vercel tada sam dodaje `BLOB_READ_WRITE_TOKEN` u env varijable projekta.

## Token za lokalni rad (opciono)

1. U projektu: **Storage** > tvoj Blob store > tab sa env varijablama (ili **Settings**) i kopiraj vrijednost `BLOB_READ_WRITE_TOKEN`.
2. Zalijepi je u svoj lokalni env fajl kao varijablu `BLOB_READ_WRITE_TOKEN` (vrijednost počinje sa `vercel_blob_rw_`).
3. Restartuj `npm run dev`. Od tada lokalni upload ide na pravi Blob.

Token je tajna: ne commituj env fajl i ne dijeli token.

## Provjera

1. Ako je token dodat tek sada, napravi novi deploy (Deployments > Redeploy) da env varijabla stupi na snagu.
2. U aplikaciji: Uredi profil > Osnovno > Promijeni sliku. Slika se prikaže, a u Vercelu pod Storage > Blob vidiš fajl u `profiles/<id>/`.

## Pravila slike

JPEG, PNG ili WebP, do 4 MB. Klijent je smanjuje na 800 px, a server provjerava stvarni tip po sadržaju fajla i veličinu. Stara slika se briše tek pošto je nova upisana.
