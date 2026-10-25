// NACRT: Politika privatnosti i Uslovi korištenja su polazni tekstovi, ne pravni savjet.
// Prije lansiranja ih mora pregledati pravnik (zakon o zaštiti ličnih podataka / GDPR, mjerodavno
// pravo, rokovi čuvanja označeni sa [ROK], te marker [DRŽAVA] u Uslovima).
import { sr } from "@/content/sr";

/** Politika privatnosti. Kontakt email je u jednoj konstanti: `sr.supportEmail`. */

export type PolicyTable = {
  caption: string;
  headers: readonly string[];
  rows: readonly (readonly string[])[];
};

export type PolicySection = {
  id: string;
  title: string;
  paragraphs?: readonly string[];
  list?: readonly string[];
  table?: PolicyTable;
  after?: readonly string[];
};

const email = sr.supportEmail;

export const privacy = {
  title: "Politika privatnosti",
  updated: "Zadnje ažuriranje: oktobar 2026.",
  intro: [
    "Ova politika objašnjava koje podatke FICO („mi“, „nas“) prikuplja o tebi, zašto ih koristimo, s kim ih dijelimo i kakve izbore imaš. Važi za sajt i aplikaciju FICO, platformu za pronalazak co-foundera na Balkanu.",
    "Korištenjem FICO-a potvrđuješ da si pročitao ovu politiku. Ako se s nečim ne slažeš, molimo te da ne koristiš platformu.",
  ],
  definitionsTitle: "Osnovni pojmovi",
  definitions: [
    "„Platforma“ je FICO sajt i aplikacija.",
    "„Član“ je osoba koja je napravila nalog i čiji je profil odobren.",
    "„Lični podaci“ su svi podaci koji se odnose na tebe ili po kojima se možeš prepoznati.",
    "„Zahtjev“ je poruka koju pošalješ drugom članu kad izabereš Sviđa mi se.",
  ],
  sections: [
    {
      id: "podaci-koje-prikupljamo",
      title: "1. Podaci koje prikupljamo",
      paragraphs: ["Prikupljamo samo ono što je potrebno da platforma radi."],
      list: [
        "Podaci naloga: email adresa i lozinka. Lozinku nikad ne čuvamo u čitljivom obliku, nego samo kao bcrypt hash.",
        "Podaci profila: ime, slika, grad i država, datum rođenja (iz kojeg računamo starost i provjeravamo da imaš najmanje 18 godina), pol, obrazovanje, iskustvo, LinkedIn, video predstavljanje, interesi i preference za co-foundera, te ostali odgovori koje sam upišeš.",
        "Fotografija: sliku koju otpremiš čuvamo u našem skladištu slika. Uz nju čuvamo i otisak (hash) slike, koji služi samo da otkrijemo ponovno otpremanje iste slike na više naloga (zaštita od lažnih i duplih naloga). Iz otiska se slika ne može rekonstruisati.",
        "Poruke: poruke koje šalješ uz zahtjeve i poruke u chatu s članovima s kojima imaš match.",
        "Prijave i blokiranja: prijave profila koje pošalješ ili primiš (sa razlogom i opisom) i spisak korisnika koje si blokirao/la.",
        "Tehnički podaci: IP adresa, podaci o uređaju i pregledaču, zapisi o radu servera (logovi) i vrijeme zadnje aktivnosti.",
        "Kolačići: koristimo samo neophodni kolačić sesije fico_session, koji te drži prijavljenim. Ne koristimo reklamne ni analitičke kolačiće.",
      ],
    },
    {
      id: "kako-koristimo-podatke",
      title: "2. Kako koristimo podatke",
      list: [
        "Za rad platforme: pravljenje naloga, prijava, prikaz profila i slanje zahtjeva i poruka.",
        "Za ručno odobravanje profila: naš tim pregleda profil prije nego što postane vidljiv drugima.",
        "Za preporuke: poklapanje profila računamo na zahtjev, u memoriji, na osnovu podataka koje si upisao i preferenci koje si postavio. Ne pravimo odluke koje te pravno ili značajno pogađaju samo automatski.",
        "Za obavještenja i emailove: potvrda emaila, reset lozinke, odobren ili odbijen profil, novi zahtjev i novi match.",
        "Za sigurnost: sprečavanje zloupotrebe, obrada prijava i blokada, zaštita od neovlaštenog pristupa.",
        "Za ispunjavanje zakonskih obaveza i zaštitu naših prava.",
      ],
    },
    {
      id: "dijeljenje",
      title: "3. Dijeljenje podataka",
      paragraphs: [
        "Tvoj profil vide samo odobreni članovi platforme, ne javni internet. Poruku uz zahtjev vidi samo osoba kojoj je poslata, a chat vide samo članovi tog matcha.",
        "Ne prodajemo lične podatke i ne dijelimo ih radi oglašavanja.",
        "Za rad platforme koristimo pružaoce usluga koji podatke obrađuju u naše ime: Vercel (hosting), Neon (baza podataka), Vercel Blob (čuvanje slika) i Resend (slanje emailova). Mogu doći do podataka samo koliko je potrebno za uslugu.",
        "Podatke možemo otkriti i kad to zahtijeva zakon, sudski nalog ili nadležni organ, ili kad je neophodno da zaštitimo sigurnost korisnika.",
      ],
      table: {
        caption: "Pregled podataka, izvora, svrhe i ko ih vidi",
        headers: ["Kategorija podataka", "Izvor", "Svrha", "Ko ih vidi"],
        rows: [
          [
            "Email i hash lozinke",
            "Ti, pri registraciji",
            "Nalog, prijava, obavještenja",
            "Samo mi (lozinka nikad u čitljivom obliku)",
          ],
          [
            "Profil (ime, slika, lokacija, obrazovanje, iskustvo, interesi)",
            "Ti, pri popunjavanju profila",
            "Prikaz kandidata, poklapanje",
            "Odobreni članovi i naš tim",
          ],
          [
            "Datum rođenja i pol",
            "Ti, pri popunjavanju profila",
            "Provjera punoljetstva, prikaz starosti (možeš je sakriti), poklapanje po preferencama",
            "Naš tim; članovi vide samo starost, ako je nisi sakrio/la",
          ],
          [
            "Otisak (hash) slike",
            "Automatski, pri otpremanju slike",
            "Otkrivanje duplih i lažnih naloga",
            "Samo naš sistem i tim",
          ],
          [
            "LinkedIn i video",
            "Ti, na profilu",
            "Prikaz profila",
            "Odobreni članovi i naš tim",
          ],
          [
            "Preference za co-foundera",
            "Ti, u filterima",
            "Poklapanje i razlozi poklapanja",
            "Samo ti i naš sistem",
          ],
          [
            "Poruka uz zahtjev",
            "Ti, pri slanju zahtjeva",
            "Upoznavanje",
            "Primalac, a poslije matcha i u chatu",
          ],
          [
            "Poruke u chatu",
            "Ti i tvoj match",
            "Komunikacija članova",
            "Samo članovi matcha",
          ],
          [
            "Prijave i blokade",
            "Ti ili drugi članovi",
            "Sigurnost platforme",
            "Naš tim (blokadu vidi sistem)",
          ],
          [
            "IP, uređaj, logovi, zadnja aktivnost",
            "Automatski",
            "Sigurnost, rad i poboljšanje platforme",
            "Samo naš tim i pružaoci hostinga",
          ],
        ],
      },
    },
    {
      id: "izbori-i-brisanje",
      title: "4. Tvoji izbori i brisanje",
      list: [
        "Profil možeš u svakom trenutku urediti u aplikaciji. Izmjene poslije odobrenja odmah su vidljive.",
        "Nalog možeš deaktivirati u Podešavanjima, čime nestaješ iz pretrage drugih članova.",
        "Nalog možeš trajno obrisati u Podešavanjima. Brisanjem se uklanjaju profil, slika, zahtjevi, poruke i obavještenja vezani za nalog.",
        "Ako ne možeš sam/a da obrišeš nalog, brisanje podataka možeš zatražiti emailom. Nakon provjere identiteta brišemo ili anonimiziramo podatke, osim onih koje moramo zadržati zbog zakona ili sigurnosti.",
        "Možeš blokirati druge članove i prijaviti profil koji krši pravila.",
      ],
      after: [`Zahtjeve šalji na ${email}. Odgovaramo u razumnom roku.`],
    },
    {
      id: "rokovi-cuvanja",
      title: "5. Rokovi čuvanja",
      paragraphs: ["Podatke čuvamo samo koliko je potrebno za svrhu zbog koje su prikupljeni."],
      list: [
        "Nalog i profil: dok je nalog aktivan. Po brisanju naloga profil, slika, zahtjevi i poruke brišu se iz baze, a slika i iz skladišta.",
        "Rezervne kopije baze: brišu se nakon isteka roka rezervnih kopija kod pružaoca, [ROK] dana.",
        "Tokeni za potvrdu emaila i reset lozinke: ističu automatski (u roku od 24 sata), a čuvamo samo njihov hash.",
        "Zapisi o pokušajima prijave i ograničenjima učestalosti: do 24 sata, zbog zaštite od zloupotrebe.",
        "Prijave i blokiranja: dok traje obrada prijave i dok je nalog aktivan, a duže samo ako je to potrebno zbog sigurnosti ili zakona, [ROK].",
        "Tehnički logovi servera: kratko, prema podešavanju pružaoca hostinga, [ROK].",
      ],
    },
    {
      id: "prava",
      title: "6. Tvoja prava",
      paragraphs: [
        "Prema Opštoj uredbi EU o zaštiti podataka (GDPR) i zakonima o zaštiti ličnih podataka u zemljama regije imaš pravo da:",
      ],
      list: [
        "pristupiš svojim podacima i dobiješ njihovu kopiju (većinu vidiš u svom profilu, a kopiju možeš zatražiti emailom),",
        "ispraviš netačne ili nepotpune podatke,",
        "zatražiš brisanje podataka (nalog možeš obrisati i sam/a u Podešavanjima),",
        "zatražiš ograničenje obrade,",
        "dobiješ podatke u uobičajenom, prenosivom obliku,",
        "uložiš prigovor na obradu,",
        "podneseš pritužbu nadležnom organu za zaštitu podataka u svojoj zemlji.",
      ],
      after: [`Da ostvariš neko pravo, piši nam na ${email}.`],
    },
    {
      id: "djeca",
      title: "7. Djeca",
      paragraphs: [
        "FICO je namijenjen osobama starijim od 18 godina. Svjesno ne prikupljamo podatke maloljetnika. Ako saznamo da je maloljetna osoba napravila nalog, obrisaćemo ga. Ako smatraš da se to desilo, javi nam se.",
      ],
    },
    {
      id: "drugi-sajtovi",
      title: "8. Linkovi ka drugim sajtovima",
      paragraphs: [
        "Profili mogu sadržati linkove ka sajtovima koje ne kontrolišemo, na primjer LinkedIn ili video platforme. Za njihovu politiku privatnosti i sadržaj nismo odgovorni, pa te savjetujemo da je pročitaš prije korištenja.",
      ],
    },
    {
      id: "sigurnost",
      title: "9. Sigurnost",
      paragraphs: [
        "Primjenjujemo razumne tehničke i organizacione mjere: lozinke se čuvaju kao bcrypt hash, veza je šifrovana (HTTPS), kolačić sesije je httpOnly i Secure, a pristup podacima imaju samo ovlaštene osobe. Nijedan sistem nije potpuno siguran, pa ne možemo garantovati apsolutnu zaštitu. Preporučujemo jaku i jedinstvenu lozinku.",
      ],
    },
    {
      id: "medjunarodni-transfer",
      title: "10. Međunarodni transfer podataka",
      paragraphs: [
        "Naši pružaoci usluga mogu imati servere van tvoje zemlje, uključujući zemlje van Evropskog ekonomskog prostora. Kad se podaci prenose, oslanjamo se na odgovarajuće zaštitne mjere, kao što su standardne ugovorne klauzule.",
      ],
    },
    {
      id: "izmjene-politike",
      title: "11. Izmjene politike",
      paragraphs: [
        "Ovu politiku možemo povremeno mijenjati. Datum zadnjeg ažuriranja je na vrhu stranice. O bitnim izmjenama obavijestićemo te u aplikaciji ili emailom. Nastavak korištenja nakon izmjena znači da ih prihvataš.",
      ],
    },
    {
      id: "kontakt",
      title: "12. Pitanja i kontakt",
      paragraphs: [
        `Imaš pitanje o ovoj politici ili o svojim podacima? Piši nam na ${email}.`,
      ],
    },
  ] as readonly PolicySection[],
} as const;

/** Uslovi korištenja. Pravila ponašanja se uzimaju iz `sr.agreement.items` (isto što korisnik potvrđuje pri prvom ulasku). */
export const terms = {
  title: "Uslovi korištenja",
  updated: "Zadnje ažuriranje: oktobar 2026.",
  intro: [
    "Ovi uslovi uređuju korištenje sajta i aplikacije FICO, platforme za pronalazak co-foundera na Balkanu. Pravljenjem naloga i korištenjem platforme prihvataš ove uslove.",
    "Uslovi se čitaju zajedno sa Politikom privatnosti. Ako se ne slažeš s nečim, molimo te da ne koristiš platformu.",
  ],
  sections: [
    {
      id: "ko-moze-koristiti",
      title: "1. Ko može koristiti FICO",
      list: [
        "FICO mogu koristiti samo osobe koje imaju najmanje 18 godina. Pri pravljenju profila unosiš datum rođenja, a profil osobe mlađe od 18 godina ne može biti poslat na pregled.",
        "Moraš dati tačne podatke o sebi i imati samo jedan nalog. Lažno predstavljanje nije dozvoljeno.",
        "Odgovoran/na si za čuvanje svoje lozinke i za sve što se radi preko tvog naloga.",
      ],
    },
    {
      id: "pravila-ponasanja",
      title: "2. Pravila ponašanja",
      paragraphs: ["Pri prvom ulasku potvrđuješ sljedeća pravila i obavezuješ se da ćeš ih poštovati:"],
      list: sr.agreement.items,
      after: ["Kršenje ovih pravila može dovesti do uklanjanja sadržaja, ograničenja ili deaktivacije naloga."],
    },
    {
      id: "sadrzaj-korisnika",
      title: "3. Sadržaj koji postavljaš",
      list: [
        "Sadržaj profila, poruke uz zahtjeve i poruke u chatu ostaju tvoji. Daješ nam pravo da ih čuvamo i prikazujemo drugim članovima onoliko koliko je potrebno da platforma radi.",
        "Odgovoran/na si za sadržaj koji postaviš. Ne smiješ postavljati sadržaj koji je nezakonit, uvredljiv, prijeteći, obmanjujući, ili koji krši tuđa prava (uključujući autorska prava i privatnost).",
        "Slika profila mora prikazivati tebe. Ne smiješ otpremati tuđe fotografije.",
        "Možemo ukloniti ili zatražiti izmjenu sadržaja koji krši ove uslove.",
      ],
    },
    {
      id: "ponasanje-admina",
      title: "4. Pregled profila i uloga administratora",
      list: [
        "Svaki profil naš tim pregleda ručno prije nego što postane vidljiv drugima. Možemo odobriti profil ili ga odbiti uz razlog, a ti ga tada možeš ispraviti i poslati ponovo.",
        "Izmjene profila poslije odobrenja važe odmah, a mi zadržavamo pravo da ih naknadno provjerimo.",
        "Nalog možemo deaktivirati ako krši ove uslove ili pravila platforme, posebno poslije prijava drugih članova. O deaktivaciji ćeš biti obaviješten/a emailom, a možeš nam se obratiti preko stranice Pomoć.",
        "Ne garantujemo da će tvoj profil biti odobren niti da ćeš pronaći co-foundera.",
      ],
    },
    {
      id: "odgovornost",
      title: "5. Dogovori između korisnika i odricanje od odgovornosti",
      paragraphs: [
        "FICO je alat za upoznavanje. Nismo strana u dogovorima, partnerstvima, ugovorima ni osnivanju kompanija koje članovi međusobno dogovore, i ne provjeravamo tačnost svega što članovi navode o sebi.",
        "Sam/a procjenjuješ s kim ćeš sarađivati. Prije bilo kakvog dogovora o udjelu, novcu ili radu preporučujemo da provjeriš osobu i da se dogovor zapiše, po potrebi uz pravnu pomoć.",
        "Platforma se pruža „kakva jeste“, bez garancije neprekidnog rada. U granicama koje dozvoljava zakon, ne odgovaramo za štetu nastalu iz odnosa među članovima, niti za gubitak podataka ili prekide u radu.",
      ],
    },
    {
      id: "prijava-zloupotrebe",
      title: "6. Prijava zloupotrebe i blokiranje",
      list: [
        "Svaki profil možeš prijaviti dugmetom „Prijavi profil“, a korisnika blokirati. Blokiran korisnik ne može da te vidi niti da ti piše.",
        "Prijave pregleda naš tim. Zloupotrebu možeš prijaviti i emailom.",
        `Za prijave, pitanja i sve u vezi sa ovim uslovima piši nam na ${email}.`,
      ],
    },
    {
      id: "izmjene-uslova",
      title: "7. Izmjene uslova",
      paragraphs: [
        "Ove uslove možemo povremeno mijenjati. Datum zadnjeg ažuriranja je na vrhu stranice. O bitnim izmjenama obavijestićemo te u aplikaciji ili emailom. Nastavak korištenja nakon izmjena znači da ih prihvataš.",
      ],
    },
    {
      id: "mjerodavno-pravo",
      title: "8. Mjerodavno pravo",
      paragraphs: [
        "Na ove uslove primjenjuje se pravo države [DRŽAVA]. Za sporove koji iz njih proizađu nadležan je sud u [DRŽAVA], osim ako obavezni propisi o zaštiti potrošača ne određuju drugačije.",
      ],
    },
  ] as readonly PolicySection[],
} as const;
