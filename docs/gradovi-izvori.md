# Katalog gradova: pravilo i izvori

Ažurirano 25.10.2026. Katalog (`src/content/cities-data.ts`) sadrži SAMO GRADOVE, po pravilu države ("gradovi u kojima se u toj državi tretiraju kao grad"). Bez gradskih dijelova, kvartova, naselja, sela i opština koje nisu gradovi.

| Država | Pravilo | Prije | Poslije | Izvor |
| --- | --- | --- | --- | --- |
| Bosna i Hercegovina | Sve opštine/općine i gradovi (opština = grad sa okolinom); bosanska imena | 139 | 139 | Wikipedia "Municipalities of Bosnia and Herzegovina", entitetski spiskovi |
| Srbija (bez Kosova) | Samo jedinice sa pravnim statusom grada: 27 gradova + Beograd | 152 | 28 | Zakon o teritorijalnoj organizaciji RS (izmjene 2018/2020), Wikipedia (sr/en) "Градови у Србији" |
| Srbija (Kosovo, posebna stavka) | Odluka vlasnika: svih 38 opština Kosova ostaje (opštinski centri se tretiraju kao gradovi); pravilo "pravni grad" se ne primjenjuje | 38 | 38 | Vidi SPORNO; `kosovoMunicipalities` u cities-data.ts |
| Hrvatska | Samo 128 pravnih gradova, bez općina | 552 | 128 | Wikipedia "List of cities and towns in Croatia" |
| Slovenija | Naselja sa statusom mesta (69), uključujući 12 mestnih občin | 212 | 69 | Wikipedia "List of towns in Slovenia" |
| Crna Gora | Svih 25 opština (opština = grad) | 25 | 25 | Zakon o teritorijalnoj organizaciji |
| Makedonija | Opštine koje se tretiraju kao gradovi; Skoplje jedan unos; provjereno da nema naselja ni ukinutih opština | 71 | 71 | Wikipedia "Municipalities of North Macedonia" |

Ukupno u izboru za RS je 66 (28 + 38 Kosovo).

## Napomene

- Srbija: uklonjeno 124 opština (npr. Ada, Aranđelovac, Smederevska Palanka, Inđija, Preševo, Bujanovac, Ćuprija, Paraćin), uključujući prigradske opštine Beograda (Mladenovac, Obrenovac, Lazarevac, Barajevo, Grocka, Sopot, Surčin). Priština je pravno srpski grad i vodi se u kosovskom bloku.
- Hrvatska: uklonjeno 424 općine (npr. Blato, Vela Luka, Ston, Orebić, Konavle, Gračac, Medulin, Okučani). Imena Novigrad, Otok i Sveta Nedelja su jedan unos (ključ je ime).
- Slovenija: uklonjeno 144 občine koje nisu mesta (npr. Bohinj, Kranjska Gora, Brda, Ankaran, Kostel). Ključevi se nisu mijenjali: "Novo Mesto" (zvanično Novo mesto), "Lenart" (mesto Lenart v Slovenskih goricah) i "Šempeter-Vrtojba" (mesto Šempeter pri Gorici); novi unos je "Višnja Gora".
- Makedonija: Zajas, Oslomej, Drugovo i Vraneštica ukinute su 2013. (spojene u Kičevo); nisu u katalogu.

## Stari profili (uklonjeni gradovi)

Profili čuvaju grad kao tekst, pa uklonjeni gradovi ne smiju srušiti prikaz ni validaciju:
- Prigradske opštine Beograda se mapiraju na "Beograd" kroz `legacyCityNames.RS` (prikaz i validacija; pri izmjeni profila upisuje se Beograd).
- Svi ostali uklonjeni gradovi su u `removedCitiesByCountry` (cities-data.ts). `findCatalogCity(value, country, true)` ih prihvata i vraća nepromijenjene (koristi Zod šema profila), a `normalizeCityName` ih ne dira. Ne nude se u izboru ni u autocomplete-u. Uklonjeni grad iz druge države se i dalje odbija.
- Testovi: `catalog.test.ts` i `cities-search.test.ts`.

## SPORNO

| Mjesto | Država u katalogu | Spor | Preporuka |
| --- | --- | --- | --- |
| 38 opština Kosova (Priština, Prizren, Peć, Đakovica, Severna Mitrovica, Zvečan, Zubin Potok, Leposavić, Gračanica, ...) | Srbija (privremena odluka) | Kosovo je proglasilo nezavisnost 2008. i dio država ga priznaje, a Srbija i BiH ne; Hrvatska, Slovenija, Crna Gora i Sjeverna Makedonija ga priznaju | Politička odluka vlasnika proizvoda; tehnički vratiti zasebnu državu (XK) |
| Istočno Sarajevo / Srpsko Sarajevo, Foča / Srbinje, Brod / Srpski Brod, Kneževo / Skender Vakuf | BiH | Dva zvanična oblika po entitetima | Odluka vlasnika: koristi se bosanska (predratna/federalna) upotreba, jedan unos po opštini, bez entiteta u prikazu |
| Kupres, Trnovo, Novi Grad | BiH | Isto ime u oba entiteta (Kupres i Trnovo) / više opština | Jedan unos po imenu |
| Brčko | BiH | Distrikt van oba entiteta | Zadržano kao zasebno |
| Neum | BiH | Jedini izlaz na more; sporne granice Klek / Mali Ston sa Hrvatskom | Ostaje u BiH |
| Kostel, Piran | Slovenija | Granični spor sa Hrvatskom (Piranski zaljev, Dragonja, Kupa) | Piran ostaje (mesto); Kostel uklonjen (nije mesto), tolerisan u starim profilima |
| Konavle / Herceg Novi | Hrvatska / Crna Gora | Prevlaka riješena sporazumom | Konavle uklonjene (općina); Herceg Novi ostaje |
| Vukovar, Ilok | Hrvatska | Dunavska granična pitanja sa Srbijom | Ostaju u Hrvatskoj |
| Preševo, Bujanovac, Medveđa | Srbija | Albanska većina; nisu pravni gradovi | Uklonjeni po pravilu (tolerišu se u starim profilima) |
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
