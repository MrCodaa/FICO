# Katalog naselja: izvori i provjera

Provjereno 25.10.2026. Katalog (`src/content/cities-data.ts`) sadrži samo jedinice lokalne samouprave (gradove i opštine/općine). Sela, naselja i gradske četvrti većih gradova (npr. Sarajevo Centar, Zemun, Skoplje Čair) ne ulaze. Provjera je rađena unos po unos prema spiskovima ispod.

| Država | Jedinica u katalogu | Zvanični broj | Izvor |
| --- | --- | --- | --- |
| Bosna i Hercegovina | 139 | FBiH 79 općina/gradova, RS 64 opštine/grada, Brčko Distrikt; Kupres i Trnovo postoje u oba entiteta pod istim imenom (jedan unos); Istočno Sarajevo je grad; Skender Vakuf = Kneževo (jedan unos) | Wikipedia "Municipalities of Bosnia and Herzegovina" (spisak iz zakona o lokalnoj samoupravi entiteta), uporedba sa zvaničnim entitetskim spiskovima |
| Srbija (bez Kosova) | 152 (145 jedinica + 7 prigradskih opština Beograda koje su posebna mjesta) | 145 gradova i opština (bez Kosova i Metohije); Beograd ima 17 gradskih opština | Wikipedia (sr) "Административна подела Србије", RZS |
| Srbija (Kosovo, privremeno) | 38 | 38 opština Kosova | Vidi SPORNO |
| Hrvatska | 552 | 128 gradova + 428 općina = 556 (4 imena se ponavljaju: Novigrad, Otok, Privlaka, Sveta Nedelja) | Wikipedia (en/hr) "List of cities and towns in Croatia" i "Municipalities of Croatia" (stanje 2021-2023) |
| Slovenija | 212 | 212 občina (12 mestnih) | Wikipedia (sl) "Seznam občin v Sloveniji" |
| Crna Gora | 25 | 25 opština (uključene Tuzi i Zeta) | Zakon o teritorijalnoj organizaciji Crne Gore |
| Makedonija | 71 | 80 opština, od toga 10 su gradske opštine Skoplja (u katalogu je jedinstveni "Skoplje") | Wikipedia "Municipalities of North Macedonia (Wikipedia naziv)" (reforma 2013) |

## Napomene

- Makedonija: Zajas, Oslomej, Drugovo i Vraneštica ukinute su 2013. (spojene u Kičevo); uklonjeni iz kataloga. Ime države se u katalogu ne koristi ni u jednom nazivu mjesta.
- Hrvatska: imena Novigrad, Otok, Privlaka i Sveta Nedelja postoje kao dvije jedinice, a u katalogu su jedan unos (ključ je ime).
- Slovenija: zvanično "Novo mesto" i "Loški Potok"; u katalogu "Novo Mesto" i "Loški potok" (ključevi se ne mijenjaju jer ih profili čuvaju; pretraga ne razlikuje velika slova).

## SPORNO

| Mjesto | Država u katalogu | Spor | Preporuka |
| --- | --- | --- | --- |
| 38 opština Kosova (Priština, Prizren, Peć, Đakovica, Severna Mitrovica, Zvečan, Zubin Potok, Leposavić, Gračanica, ...) | Srbija (privremena odluka) | Kosovo je proglasilo nezavisnost 2008. i dio država ga priznaje, a Srbija i BiH ne; Hrvatska, Slovenija, Crna Gora i Sjeverna Makedonija ga priznaju | Politička odluka vlasnika proizvoda; tehnički vratiti zasebnu državu (XK) |
| Istočno Sarajevo / Srpsko Sarajevo, Foča / Srbinje, Brod / Srpski Brod, Kneževo / Skender Vakuf | BiH | Dva zvanična oblika po entitetima | Odluka vlasnika: koristi se bosanska (predratna/federalna) upotreba, jedan unos po opštini, bez entiteta u prikazu |
| Kupres, Trnovo, Novi Grad | BiH | Isto ime u oba entiteta (Kupres i Trnovo) / više opština | Jedan unos po imenu |
| Brčko | BiH | Distrikt van oba entiteta | Zadržano kao zasebno |
| Neum | BiH | Jedini izlaz na more; sporne granice Klek / Mali Ston sa Hrvatskom | Ostaje u BiH |
| Kostel, Piran | Slovenija | Granični spor sa Hrvatskom (Piranski zaljev, Dragonja, Kupa) | Ostaju u Sloveniji |
| Konavle / Herceg Novi | Hrvatska / Crna Gora | Prevlaka riješena sporazumom | Bez promjene |
| Vukovar, Ilok | Hrvatska | Dunavska granična pitanja sa Srbijom | Ostaju u Hrvatskoj |
| Preševo, Bujanovac, Medveđa | Srbija | Albanska većina | Bez promjene |
| Gusinje, Plav, Rožaje, Ulcinj | Crna Gora | Albanska/bošnjačka većina | Bez promjene |

## Odluke vlasnika

- Kosovo: 38 opština ostaje pod Srbijom.
- BiH: gdje postoje dva oblika imena, koristi se bosanska/federalna upotreba. Preimenovano (staro -> novo; stari nazivi se mapiraju kroz `legacyCityNames` u `catalog.ts`, pa stari profili prolaze validaciju i prikazuju se novim imenom):
  - Brod -> Bosanski Brod
  - Kostajnica -> Bosanska Kostajnica
  - Kneževo -> Skender Vakuf (alias je spojen u jedan unos)
  - Kozarska Dubica -> Bosanska Dubica
  - Šamac -> Bosanski Šamac
  - Gradiška -> Bosanska Gradiška
  - Novi Grad -> Bosanski Novi
  - Ostaju: Foča, Istočno Sarajevo, Istočna Ilidža, Istočni Stari Grad, Istočno Novo Sarajevo, Istočni Mostar, Istočni Drvar, Novo Goražde, Petrovac, Srbac, Krupa na Uni, Jezero, Mrkonjić Grad, Šipovo (nemaju drugi poznat bosanski oblik; "Srbac" je i predratni naziv).
- Ostala sporna mjesta ostaju gdje jesu.
- Država MK se prikazuje kao "Makedonija" (kod MK nepromijenjen).
