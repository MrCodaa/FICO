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
        "Podaci profila: ime, slika, grad i država, obrazovanje, iskustvo, LinkedIn, video predstavljanje, interesi i preference za co-foundera, te ostali odgovori koje sam upišeš.",
        "Poruke: poruke koje šalješ uz zahtjeve i poruke u chatu s članovima s kojima imaš match.",
        "Prijave i blokade: prijave profila koje pošalješ ili primiš i spisak blokiranih korisnika.",
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
        "Brisanje naloga i podataka možeš zatražiti emailom. Nakon provjere identiteta brišemo ili anonimiziramo podatke, osim onih koje moramo zadržati zbog zakona ili sigurnosti.",
        "Možeš blokirati druge članove i prijaviti profil koji krši pravila.",
      ],
      after: [`Zahtjeve šalji na ${email}. Odgovaramo u razumnom roku.`],
    },
    {
      id: "prava",
      title: "5. Tvoja prava",
      paragraphs: [
        "Prema Opštoj uredbi EU o zaštiti podataka (GDPR) i zakonima o zaštiti ličnih podataka u zemljama regije imaš pravo da:",
      ],
      list: [
        "pristupiš svojim podacima i dobiješ njihovu kopiju,",
        "ispraviš netačne ili nepotpune podatke,",
        "zatražiš brisanje podataka,",
        "zatražiš ograničenje obrade,",
        "dobiješ podatke u uobičajenom, prenosivom obliku,",
        "uložiš prigovor na obradu,",
        "podneseš pritužbu nadležnom organu za zaštitu podataka u svojoj zemlji.",
      ],
      after: [`Da ostvariš neko pravo, piši nam na ${email}.`],
    },
    {
      id: "djeca",
      title: "6. Djeca",
      paragraphs: [
        "FICO je namijenjen osobama starijim od 18 godina. Svjesno ne prikupljamo podatke maloljetnika. Ako saznamo da je maloljetna osoba napravila nalog, obrisaćemo ga. Ako smatraš da se to desilo, javi nam se.",
      ],
    },
    {
      id: "drugi-sajtovi",
      title: "7. Linkovi ka drugim sajtovima",
      paragraphs: [
        "Profili mogu sadržati linkove ka sajtovima koje ne kontrolišemo, na primjer LinkedIn ili video platforme. Za njihovu politiku privatnosti i sadržaj nismo odgovorni, pa te savjetujemo da je pročitaš prije korištenja.",
      ],
    },
    {
      id: "sigurnost",
      title: "8. Sigurnost",
      paragraphs: [
        "Primjenjujemo razumne tehničke i organizacione mjere: lozinke se čuvaju kao bcrypt hash, veza je šifrovana (HTTPS), kolačić sesije je httpOnly i Secure, a pristup podacima imaju samo ovlaštene osobe. Nijedan sistem nije potpuno siguran, pa ne možemo garantovati apsolutnu zaštitu. Preporučujemo jaku i jedinstvenu lozinku.",
      ],
    },
    {
      id: "medjunarodni-transfer",
      title: "9. Međunarodni transfer podataka",
      paragraphs: [
        "Naši pružaoci usluga mogu imati servere van tvoje zemlje, uključujući zemlje van Evropskog ekonomskog prostora. Kad se podaci prenose, oslanjamo se na odgovarajuće zaštitne mjere, kao što su standardne ugovorne klauzule.",
      ],
    },
    {
      id: "izmjene-politike",
      title: "10. Izmjene politike",
      paragraphs: [
        "Ovu politiku možemo povremeno mijenjati. Datum zadnjeg ažuriranja je na vrhu stranice. O bitnim izmjenama obavijestićemo te u aplikaciji ili emailom. Nastavak korištenja nakon izmjena znači da ih prihvataš.",
      ],
    },
    {
      id: "kontakt",
      title: "11. Pitanja i kontakt",
      paragraphs: [
        `Imaš pitanje o ovoj politici ili o svojim podacima? Piši nam na ${email}.`,
      ],
    },
  ] as readonly PolicySection[],
} as const;
