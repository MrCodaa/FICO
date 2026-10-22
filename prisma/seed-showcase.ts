// Ručno napisani, potpuni profili za demo (MVP prezentacija). Seed ih uvijek
// kreira kao APPROVED, aktivne danas, pa ponovni seed vraća iste profile.
// Prvih 5 ("demo") su uzorni YC profili, a ostalih 10 ("novi") su kraći.

export interface ShowcaseProfile {
  first: string;
  last: string;
  gender: "MALE" | "FEMALE";
  age: number;
  country: string;
  city: string;
  tech: boolean;
  ideaStatus: "COMMITTED" | "EXPLORING" | "OPEN";
  timing: "ALREADY_FULL_TIME" | "READY_ON_MATCH" | "WITHIN_YEAR";
  areas: string[];
  interests: string[];
  intro: string;
  lifePath: string;
  freeTime: string;
  other: string;
  accomplishment: string;
  education: string;
  employment: string;
  ideas: string | null;
  equity: string;
  lookingFor: string;
  /** Kakvog co-foundera traži (PREFERRED); null = svejedno. */
  wantTech: boolean | null;
  /** Email je ime.prezime.<emailTag>@fico.test */
  emailTag: "demo" | "novi";
  photoUrl: string;
}

export const SHOWCASE_PROFILES: ShowcaseProfile[] = [
  {
    "first": "Adna",
    "last": "Selimović",
    "gender": "FEMALE",
    "age": 29,
    "country": "BA",
    "city": "Sarajevo",
    "tech": false,
    "ideaStatus": "COMMITTED",
    "timing": "ALREADY_FULL_TIME",
    "areas": [
      "SALES_MARKETING",
      "OPERATIONS"
    ],
    "interests": [
      "ECOMMERCE",
      "LOGISTIKA",
      "SAAS",
      "MARKETPLACE"
    ],
    "intro": "Gradim Paketić, softver koji malim online prodavcima u BiH i Srbiji na jednom mjestu daje dostavu, pouzeće i povrate. Prije toga sam pet godina vodila e-commerce u lancu sa 40 radnji i vidjela koliko male prodavce koštaju ručni rad i izgubljeni paketi. Od marta radim full-time. Imam 14 plaćenih korisnika na no-code verziji i listu čekanja od 120 prodavaca. Tražim tehničkog co-foundera da napravimo pravi proizvod i skaliramo u regionu.",
    "lifePath": "Odrasla sam u Visokom, u porodici koja ima malu tekstilnu radnju. Sa 16 godina sam sama napravila njihovu prvu online prodavnicu. Studirala sam ekonomiju u Sarajevu, a onda sam prošla put od asistentice do Head of E-commerce u velikom maloprodajnom lancu. Prošle godine sam dala otkaz da se posvetim Paketiću.",
    "freeTime": "Vikendom planinarim po Treskavici i Prenju, a zimi skijam na Bjelašnici. Čitam knjige o osnivačima (zadnja: Shoe Dog) i jednom mjesečno organizujem kafu za žene u tech-u u Sarajevu.",
    "other": "Imam 18 mjeseci ušteđevine za život, 25.000 KM od angel investitora i mjesto u programu Networks inkubatora. Sa tri dostavne službe sam već dogovorila API pristup.",
    "accomplishment": "Online kanal maloprodajnog lanca sam od nule dovela do 4,8 miliona KM godišnjeg prometa za tri godine, sa timom od šest ljudi. Usput sam smanjila povrate sa 19% na 7% kroz bolje opise proizvoda i provjeru adrese prije slanja.",
    "education": "Ekonomski fakultet u Sarajevu, smjer Marketing (prosjek 9,1). Završila sam i Google Digital Marketing sertifikat i Reforge program Growth Series.",
    "employment": "2019-2024: Head of E-commerce u regionalnom maloprodajnom lancu (prije toga e-commerce specijalistica i koordinatorica). Od 2024: osnivačica Paketića, full-time.",
    "ideas": "Paketić: jedan panel u koji mali online prodavac uveze narudžbe sa Shopify-a, WooCommerce-a ili Instagrama. Sistem automatski bira najjeftiniju dostavnu službu, štampa adresnice, prati pouzeće do uplate na račun i vodi povrate. Prodavci danas gube 6-10 sati sedmično na ručni rad i oko 3% prometa na izgubljeno pouzeće. Naplata je mjesečna pretplata plus mala provizija po paketu.",
    "equity": "Tehničkom co-founderu nudim 40-50%, zavisno od toga kad se pridruži, uz standardni vesting od 4 godine sa cliffom od godinu dana.",
    "lookingFor": "Tražim tehničkog co-foundera (full-stack, idealno Node/TypeScript ili Python) koji je već radio sa integracijama i plaćanjima i može sam postaviti prvu verziju proizvoda. Bitno mi je da voli razgovarati sa korisnicima, da brzo isporučuje i da je spreman preći na full-time u roku od tri mjeseca. Najbolje bi bilo da je u Sarajevu ili okolini, ali nije presudno.",
    "wantTech": true,
    "emailTag": "demo",
    "photoUrl": "https://randomuser.me/api/portraits/women/44.jpg"
  },
  {
    "first": "Marko",
    "last": "Lazarević",
    "gender": "MALE",
    "age": 33,
    "country": "RS",
    "city": "Beograd",
    "tech": false,
    "ideaStatus": "COMMITTED",
    "timing": "READY_ON_MATCH",
    "areas": [
      "SALES_MARKETING",
      "PRODUCT"
    ],
    "interests": [
      "SAAS",
      "ECOMMERCE",
      "AI_ML",
      "FINTECH"
    ],
    "intro": "Bivši direktor prodaje u SaaS kompaniji koja je prodata američkom kupcu 2023. Sada pravim AI alat koji malim firmama automatski knjiži ulazne fakture i izvode. Imam pisma namjere od 9 knjigovodstvenih agencija koje zajedno vode preko 1.400 firmi. Fali mi tehnički co-founder koji zna da pretvori prototip u pouzdan proizvod.",
    "lifePath": "Rođen sam u Čačku, a u Beograd sam došao na FON. Karijeru sam počeo kao SDR i hladne pozive sam zavolio više nego što bi trebalo. Bio sam prvi prodavac u startupu sa 5 ljudi i ostao sedam godina, dok nismo narasli na 120 zaposlenih i bili prodati. Poslije exita sam godinu dana bio angel i mentor, a onda sam shvatio da želim ponovo graditi.",
    "freeTime": "Trčim (Beogradski maraton tri godine zaredom), igram padel i kuham roštilj za prijatelje. Svake godine provedem dvije sedmice na Tari bez interneta.",
    "other": "Mogu sam finansirati prvih 12 mjeseci, a imam i dogovoren pre-seed razgovor sa dva regionalna fonda čim imamo tim. Govorim engleski i ruski.",
    "accomplishment": "Kao prvi prodavac i kasnije direktor prodaje doveo sam kompaniju od 0 do 6,5 miliona dolara godišnjeg prihoda i izgradio prodajni tim od 22 osobe u tri zemlje. Kompanija je 2023. prodata američkom strateškom kupcu.",
    "education": "Fakultet organizacionih nauka, Beograd, smjer Menadžment. Kasnije sam završio Stanford GSB Executive program iz prodaje i liderstva (online).",
    "employment": "2015-2023: prvi prodavac, pa VP of Sales u B2B SaaS kompaniji (exit 2023). 2023-2024: angel investitor i mentor u ICT Hub-u. Od 2024: radim na svojoj ideji.",
    "ideas": "Knjigovođe u regionu troše oko 60% vremena na ručno unošenje faktura i izvoda. Pravim alat koji iz PDF-a, slike ili e-fakture izvuče podatke, predloži konto po lokalnom kontnom planu i pošalje knjiženje direktno u programe koje agencije već koriste. Prvo tržište je Srbija (e-fakture su obavezne), pa BiH i Hrvatska. Prototip na GPT-u već tačno knjiži 82% faktura iz testnog skupa.",
    "equity": "50/50 uz vesting na 4 godine. Želim pravog partnera, ne zaposlenog sa udjelom.",
    "lookingFor": "Tražim tehničkog co-foundera sa iskustvom u backendu i radu sa LLM-ovima ili obradom dokumenata. Važno mi je da ima produktni osjećaj i da želi razumjeti korisnika, a ne samo tehnologiju. Ja preuzimam prodaju, investitore, finansije i prve klijente. Lokacija mi nije bitna dok god se možemo vidjeti jednom mjesečno.",
    "wantTech": true,
    "emailTag": "demo",
    "photoUrl": "https://randomuser.me/api/portraits/men/32.jpg"
  },
  {
    "first": "Jelena",
    "last": "Vasić",
    "gender": "FEMALE",
    "age": 31,
    "country": "HR",
    "city": "Zagreb",
    "tech": false,
    "ideaStatus": "EXPLORING",
    "timing": "READY_ON_MATCH",
    "areas": [
      "PRODUCT",
      "DESIGN"
    ],
    "interests": [
      "HEALTHTECH",
      "ECOMMERCE",
      "MOBILNE_APLIKACIJE"
    ],
    "intro": "Product lead sa osam godina iskustva u consumer aplikacijama. Zadnje tri godine sam vodila proizvod za aplikaciju za zdravlje sa 1,5 miliona korisnika u EU. Istražujem probleme u ljekarnama i zdravstvu u regionu i imam dvije validirane hipoteze. Tražim tehničkog partnera da zajedno izaberemo pravu i krenemo.",
    "lifePath": "Odrasla sam u Osijeku, a studirala psihologiju u Zagrebu. Tamo sam shvatila da me zanima kako ljudi koriste tehnologiju. Počela sam kao UX istraživačica u agenciji, a onda prešla u product u berlinskom startupu. Vratila sam se u Zagreb 2022. i otad radim remote. Želim graditi nešto ovdje, za ljude odavde.",
    "freeTime": "Bavim se keramikom i jogom, a ljeti jedrim po Kornatima. Pišem newsletter o product managementu koji prati 4.000 ljudi.",
    "other": "Uradila sam 45 intervjua sa ljekarnicima i pacijentima u Hrvatskoj i BiH, a zapisnici i zaključci su spremni da ih podijelim sa budućim co-founderom.",
    "accomplishment": "Vodila sam redizajn onboardinga u health aplikaciji koji je zadržavanje korisnika poslije 30 dana podigao sa 18% na 31%. To je bio najveći pojedinačni rast metrike u istoriji kompanije.",
    "education": "Filozofski fakultet u Zagrebu, magistra psihologije. Završila sam i Interaction Design Foundation program iz UX istraživanja.",
    "employment": "2016-2018: UX istraživačica u digitalnoj agenciji u Zagrebu. 2018-2021: Product Manager u startupu u Berlinu. 2021-danas: Product Lead u evropskoj health aplikaciji (remote).",
    "ideas": "Dvije ideje koje sam validirala: (1) aplikacija za hronične pacijente koja podsjeća na terapiju i automatski naručuje lijek u najbližoj ljekarni kad je pri kraju, i (2) B2B softver za nezavisne ljekarne koji predviđa nabavku i smanjuje lijekove kojima ističe rok. Za drugu ideju tri ljekarne su spremne platiti pilot.",
    "equity": "Ravnopravna podjela. Ako se pridružim nekome ko je već počeo, dogovaramo se prema fazi i doprinosu.",
    "lookingFor": "Tražim tehničkog co-foundera koji je gradio mobilne ili B2B web aplikacije i ne boji se regulative (GDPR, zdravstveni podaci). Volim ljude koji brzo testiraju, otvoreno kažu kad se ne slažu i cijene dobar dizajn. Ideja nije uslov. Ako imaš svoju u zdravstvu ili e-commerce-u, rado ću je čuti.",
    "wantTech": true,
    "emailTag": "demo",
    "photoUrl": "https://randomuser.me/api/portraits/women/65.jpg"
  },
  {
    "first": "Tarik",
    "last": "Bešlagić",
    "gender": "MALE",
    "age": 27,
    "country": "BA",
    "city": "Sarajevo",
    "tech": true,
    "ideaStatus": "OPEN",
    "timing": "READY_ON_MATCH",
    "areas": [
      "ENGINEERING",
      "PRODUCT"
    ],
    "interests": [
      "ECOMMERCE",
      "DEVELOPER_ALATI",
      "AI_ML",
      "FINTECH"
    ],
    "intro": "Senior full-stack inženjer (TypeScript, Go, Postgres) sa šest godina iskustva u plaćanjima i e-commerce-u. U zadnjoj firmi sam vodio tim koji obrađuje 200.000 transakcija dnevno. Spreman sam napustiti siguran posao zbog pravog co-foundera. Najbolje se dopunjujem sa nekim ko zna prodaju i ima jasan problem koji želi riješiti.",
    "lifePath": "Prvi računar sam dobio sa 12 godina i odmah počeo praviti igrice u Flash-u. Na ETF-u sam bio u timu koji je pobijedio na regionalnom hackathonu, pa sam još kao student dobio posao u holandskoj firmi. Radio sam iz Amsterdama dvije godine, a onda se vratio u Sarajevo jer mi je stalo da se ovdje gradi tech scena.",
    "freeTime": "Igram košarku dva puta sedmično, doprinosim open-source projektima i držim besplatne radionice programiranja za srednjoškolce u Sarajevu.",
    "other": "Mogu početi part-time odmah, a full-time kroz dva mjeseca. Imam dovoljno ušteđevine da prvu godinu radim bez plate.",
    "accomplishment": "Dizajnirao sam i vodio migraciju sistema za plaćanja sa monolita na mikroservise bez ijedne minute prekida. Vrijeme obrade transakcije smo smanjili sa 1,2 s na 180 ms, a troškove infrastrukture za 40%.",
    "education": "Elektrotehnički fakultet Sarajevo, smjer Računarstvo i informatika (master). Master rad o detekciji prevara u online plaćanjima.",
    "employment": "2018-2020: Software Engineer u holandskoj e-commerce kompaniji (Amsterdam). 2020-danas: Senior Engineer, pa Tech Lead u payment kompaniji (remote iz Sarajeva).",
    "ideas": "Nemam jednu konačnu ideju, ali me najviše privlače infrastruktura za plaćanja i e-commerce na Balkanu (Stripe i dalje ne radi u većini zemalja regiona) i AI alati za male firme. Otvoren sam za ideju co-foundera koji već poznaje svoje kupce.",
    "equity": "50/50 ako smo oboje full-time. Ako je ideja već validirana i ima prihode, otvoren sam za manji udio uz vesting.",
    "lookingFor": "Tražim poslovnog co-foundera koji duboko poznaje neko tržište, već je razgovarao sa kupcima i zna kako doći do prvih 100 korisnika. Cijenim iskrenost, brzinu i ljude koji se ne predaju poslije prvog odbijanja. Idealno je neko iz BiH ili regiona.",
    "wantTech": false,
    "emailTag": "demo",
    "photoUrl": "https://randomuser.me/api/portraits/men/46.jpg"
  },
  {
    "first": "Ena",
    "last": "Kurtović",
    "gender": "FEMALE",
    "age": 30,
    "country": "BA",
    "city": "Mostar",
    "tech": false,
    "ideaStatus": "COMMITTED",
    "timing": "ALREADY_FULL_TIME",
    "areas": [
      "OPERATIONS",
      "SALES_MARKETING"
    ],
    "interests": [
      "PUTOVANJA",
      "ECOMMERCE",
      "MARKETPLACE",
      "SAAS"
    ],
    "intro": "Osnivačica sam Hercegovina Experiences, platforme za lokalne ture i doživljaje u Hercegovini (vinarije, rafting, ture sa vodičima). Za 18 mjeseci smo prodali 9.400 rezervacija i imamo 85 partnera. Sada pravimo softver za lokalne pružaoce usluga širom Balkana, a za to mi treba tehnički co-founder.",
    "lifePath": "Rođena sam u Mostaru, a studirala sam turizam u Dubrovniku. Pet godina sam radila u hotelijerstvu u Dubrovniku i Beču, od recepcije do revenue menadžmenta. Vratila sam se kući 2022. jer sam vidjela da Hercegovina ima odlične doživljaje koje turisti ne mogu online rezervisati. Platformu sam pokrenula sa Webflow-om i Google Sheets-om.",
    "freeTime": "Rafting na Neretvi, degustacije vina sa partnerima (dio posla, ali ga volim) i učenje italijanskog. Zimi pišem vodiče o skrivenim mjestima Hercegovine.",
    "other": "Platforma je profitabilna od devetog mjeseca. Imam ponudu za seed investiciju od 150.000 € koja zavisi od toga da li nađem tehničkog co-foundera.",
    "accomplishment": "Bez investicije sam izgradila platformu sa 9.400 rezervacija i 310.000 € bruto prometa za 18 mjeseci, sa prosječnom ocjenom 4,9 od 2.100 recenzija.",
    "education": "Sveučilište u Dubrovniku, smjer Poslovna ekonomija u turizmu. Završila sam i Cornell eCornell sertifikat iz revenue menadžmenta.",
    "employment": "2016-2021: hotelijerstvo u Dubrovniku i Beču (recepcija, sales, revenue menadžment). 2022-danas: osnivačica i direktorica Hercegovina Experiences.",
    "ideas": "Pružaoci turističkih doživljaja na Balkanu (vinarije, rafting klubovi, vodiči) i dalje rezervacije primaju preko telefona i Instagrama. Pravimo SaaS koji im daje online kalendar, plaćanje, upravljanje kapacitetom i automatsku distribuciju na GetYourGuide, Airbnb Experiences i našu platformu. 40 naših partnera je spremno odmah preći na softver.",
    "equity": "Tehničkom co-founderu nudim 30-40%, uz vesting na 4 godine. Firma već ima prihod, a seed investicija je spremna.",
    "lookingFor": "Tražim tehničkog co-foundera koji je gradio marketplace, sistem za rezervacije ili integracije sa trećim stranama. Treba mi neko ko može sam postaviti arhitekturu i kasnije zaposliti tim. Volim ljude koji su pouzdani, organizovani i vole putovati. Najbolje je da je iz Hercegovine, Sarajeva ili Dalmacije, ali remote je OK.",
    "wantTech": true,
    "emailTag": "demo",
    "photoUrl": "https://randomuser.me/api/portraits/women/68.jpg"
  },
  {
    "first": "Lana",
    "last": "Hadžić",
    "gender": "FEMALE",
    "age": 27,
    "country": "BA",
    "city": "Sarajevo",
    "tech": false,
    "ideaStatus": "EXPLORING",
    "timing": "READY_ON_MATCH",
    "areas": [
      "SALES_MARKETING",
      "PRODUCT"
    ],
    "interests": [
      "ECOMMERCE",
      "MARKETPLACE",
      "LOGISTIKA"
    ],
    "intro": "Četiri godine vodim prodaju u e-commerce firmi koja dostavlja u cijeloj BiH. Znam kako se dolazi do prvih 1.000 kupaca i koliko košta svaki od njih. Tražim tehničkog partnera da zajedno napravimo nešto naše.",
    "lifePath": "Odrasla sam u Zenici, a studirala ekonomiju u Sarajevu. Prvi posao mi je bio na pozivnom centru i tu sam zavoljela prodaju. Brzo sam napredovala do vođe tima, a zadnje dvije godine vodim cijeli online kanal.",
    "freeTime": "Planinarim po Bjelašnici, čitam knjige o psihologiji i učim španski.",
    "other": "Mogu odmah preći na full-time čim nađemo pravu ideju i dogovorimo se.",
    "accomplishment": "Povećala sam online prodaju firme sa 30.000 KM na 400.000 KM mjesečno za dvije godine, uglavnom kroz performance marketing i bolji checkout.",
    "education": "Ekonomski fakultet u Sarajevu, smjer Marketing.",
    "employment": "Head of E-commerce u regionalnom maloprodajnom lancu.",
    "ideas": "Platforma za male online prodavce u regionu koja na jednom mjestu spaja dostavne službe, pouzeće i povrate. Danas svako to radi ručno u Excelu.",
    "equity": "50/50 ako oboje radimo full-time, uz vesting na 4 godine.",
    "lookingFor": "Tražim tehničkog co-foundera koji voli graditi brzo i nije ga strah razgovarati sa kupcima. Iskustvo sa plaćanjima i integracijama je veliki plus.",
    "wantTech": true,
    "emailTag": "novi",
    "photoUrl": "https://i.pravatar.cc/300?u=fico-novi-0"
  },
  {
    "first": "Kenan",
    "last": "Mehmedović",
    "gender": "MALE",
    "age": 31,
    "country": "BA",
    "city": "Mostar",
    "tech": false,
    "ideaStatus": "COMMITTED",
    "timing": "ALREADY_FULL_TIME",
    "areas": [
      "OPERATIONS",
      "SALES_MARKETING"
    ],
    "interests": [
      "PUTOVANJA",
      "MARKETPLACE",
      "SAAS"
    ],
    "intro": "Osnivač sam male turističke agencije u Mostaru sa 12 zaposlenih. Već godinu dana razvijam softver za upravljanje turama i shvatio sam da je to veći biznis od same agencije.",
    "lifePath": "Kao student sam radio kao vodič po Hercegovini, pa sam sa dvojicom prijatelja otvorio agenciju. Preživjeli smo pandemiju prelaskom na domaće goste. Sada želim da alat koji koristimo prodajem i drugima.",
    "freeTime": "Kajak na Neretvi, fudbal sa prijateljima i kuhanje za veliko društvo.",
    "other": "Imam ušteđevinu za 12 mjeseci rada i prve klijente koji su već pitali za softver.",
    "accomplishment": "Agenciju sam od nule doveo do 15.000 gostiju godišnje i 1,2 miliona KM prometa.",
    "education": "Fakultet za turizam i hotelijerstvo, Mostar.",
    "employment": "Osnivač i direktor turističke agencije.",
    "ideas": "SaaS za male turističke agencije i vodiče: rezervacije, raspored vodiča, online plaćanje i automatske poruke gostima na pet jezika. Imam pet agencija spremnih da plate pilot.",
    "equity": "Spreman sam dati 40-50% pravom tehničkom co-founderu, zavisno od posvećenosti.",
    "lookingFor": "Tražim tehničkog co-foundera koji može preuzeti cijeli razvoj. Idealno je neko iz BiH ili okoline, da se možemo viđati uživo.",
    "wantTech": true,
    "emailTag": "novi",
    "photoUrl": "https://i.pravatar.cc/300?u=fico-novi-1"
  },
  {
    "first": "Mia",
    "last": "Kovač",
    "gender": "FEMALE",
    "age": 29,
    "country": "HR",
    "city": "Zagreb",
    "tech": false,
    "ideaStatus": "EXPLORING",
    "timing": "WITHIN_YEAR",
    "areas": [
      "PRODUCT",
      "DESIGN"
    ],
    "interests": [
      "ECOMMERCE",
      "MOBILNE_APLIKACIJE",
      "HEALTHTECH"
    ],
    "intro": "Product designerica sa šest godina iskustva u fintech i e-commerce proizvodima. Najviše volim pretvarati složene stvari u jednostavna iskustva. Spremna sam da sljedeći proizvod gradim kao osnivačica.",
    "lifePath": "Završila sam dizajn na ALU u Zagrebu, a karijeru sam počela u agenciji radeći za velike brendove. Prešla sam u proizvod jer sam htjela vidjeti šta se desi poslije lansiranja. Zadnje tri godine radim u londonskom scale-upu, remote.",
    "freeTime": "Keramika, joga i duge vožnje biciklom uz more.",
    "other": "Mogu raditi na hrvatskom, engleskom i njemačkom.",
    "accomplishment": "Redizajn checkouta koji sam vodila podigao je konverziju za 23% kod 2 miliona korisnika mjesečno.",
    "education": "Akademija likovnih umjetnosti, Zagreb, smjer Dizajn vizualnih komunikacija.",
    "employment": "Senior Product Designer u fintech scale-upu (remote).",
    "ideas": "Aplikacija za ljude sa hroničnim bolestima koja prati terapiju i simptome i jednim klikom šalje izvještaj ljekaru.",
    "equity": "Ravnopravna podjela, uz jasno definisane uloge.",
    "lookingFor": "Tražim tehničkog co-foundera koji cijeni dobar dizajn i želi graditi proizvod koji ljudi vole koristiti.",
    "wantTech": true,
    "emailTag": "novi",
    "photoUrl": "https://i.pravatar.cc/300?u=fico-novi-2"
  },
  {
    "first": "Nemanja",
    "last": "Stojanović",
    "gender": "MALE",
    "age": 34,
    "country": "RS",
    "city": "Beograd",
    "tech": false,
    "ideaStatus": "COMMITTED",
    "timing": "READY_ON_MATCH",
    "areas": [
      "SALES_MARKETING",
      "OPERATIONS"
    ],
    "interests": [
      "LOGISTIKA",
      "SAAS",
      "ECOMMERCE"
    ],
    "intro": "Deset godina sam u B2B prodaji softvera, zadnjih pet kao direktor prodaje za region. Znam kako se prodaje firmama i kako se gradi prodajni tim od nule.",
    "lifePath": "Iz Kraljeva sam došao u Beograd na studije i ostao. Počeo sam kao prodavac telekom usluga, pa prešao u softver. Dva puta sam pomogao startupu da pređe sa 0 na 1 milion evra prihoda i sada to želim uraditi za svoju firmu.",
    "freeTime": "Trčim maratone, slušam podcaste o biznisu i igram tenis vikendom.",
    "other": "Imam mrežu od preko 300 direktora logističkih i distributivnih firmi u regionu.",
    "accomplishment": "Kao prvi prodavac u startupu doveo sam prihod sa 0 na 1,4 miliona evra godišnje za tri godine.",
    "education": "Fakultet organizacionih nauka, Beograd.",
    "employment": "Regionalni direktor prodaje u SaaS kompaniji za logistiku.",
    "ideas": "Softver za male distributere koji automatski planira rute dostave i prati vozače u realnom vremenu. Konkurencija je skupa i pravljena za velike igrače.",
    "equity": "50/50, sa vestingom. Bitnije mi je da oboje budemo full-time.",
    "lookingFor": "Tražim tehničkog co-foundera sa iskustvom u backendu i mapama ili optimizaciji ruta. Ja preuzimam prodaju, klijente i finansije.",
    "wantTech": true,
    "emailTag": "novi",
    "photoUrl": "https://i.pravatar.cc/300?u=fico-novi-3"
  },
  {
    "first": "Amra",
    "last": "Delić",
    "gender": "FEMALE",
    "age": 26,
    "country": "BA",
    "city": "Tuzla",
    "tech": false,
    "ideaStatus": "OPEN",
    "timing": "READY_ON_MATCH",
    "areas": [
      "PRODUCT",
      "OPERATIONS"
    ],
    "interests": [
      "EDTECH",
      "ECOMMERCE",
      "AI_ML"
    ],
    "intro": "Product managerica u IT firmi iz Tuzle koja radi za njemačke klijente. Dobra sam u organizaciji, razgovorima sa korisnicima i prioritetima. Otvorena sam za ideje, a bitnije mi je da radim sa pravom osobom.",
    "lifePath": "Studirala sam matematiku, ali sam shvatila da me više zanimaju ljudi nego formule. Krenula sam kao QA, pa prešla u product. Sada vodim dva proizvoda i tim od deset ljudi.",
    "freeTime": "Volontiram u udruženju koje uči djecu programiranju i obožavam društvene igre.",
    "other": "Najbolje radim u malom timu gdje svi imaju puno odgovornosti.",
    "accomplishment": "Kao PM sam lansirala proizvod koji je za godinu dana došao do 40.000 aktivnih korisnika u Njemačkoj.",
    "education": "Prirodno-matematički fakultet, Tuzla, smjer Matematika i informatika.",
    "employment": "Product Manager u IT kompaniji koja radi za DACH tržište.",
    "ideas": "Razmišljam o platformi za online kurseve sa AI tutorom na našem jeziku, ali sam otvorena za ideju budućeg co-foundera.",
    "equity": "Otvorena sam za razgovor, udio treba pratiti doprinos.",
    "lookingFor": "Tražim tehničku osobu koja ima ideju ili bar jaku želju da gradi. Važni su mi iskrenost i dobra komunikacija.",
    "wantTech": true,
    "emailTag": "novi",
    "photoUrl": "https://i.pravatar.cc/300?u=fico-novi-4"
  },
  {
    "first": "Luka",
    "last": "Perić",
    "gender": "MALE",
    "age": 28,
    "country": "ME",
    "city": "Podgorica",
    "tech": true,
    "ideaStatus": "EXPLORING",
    "timing": "WITHIN_YEAR",
    "areas": [
      "ENGINEERING",
      "PRODUCT"
    ],
    "interests": [
      "FINTECH",
      "ECOMMERCE",
      "DEVELOPER_ALATI"
    ],
    "intro": "Full-stack developer (TypeScript, Go) sa iskustvom u plaćanjima. Tražim co-foundera, tehničkog ili poslovnog, s kojim mogu brzo isporučivati i učiti.",
    "lifePath": "Programiranje sam naučio sam, praveći modove za igrice. Radio sam u dvije banke u Podgorici, pa prešao u remote rad za fintech iz Amsterdama. Spreman sam za nešto svoje.",
    "freeTime": "Ronjenje u Budvi, šah i pisanje tehničkog bloga.",
    "other": "Radim remote, pa mi lokacija co-foundera nije bitna.",
    "accomplishment": "Napravio sam open-source biblioteku za integraciju sa lokalnim bankama koja ima 2.000 zvjezdica na GitHubu.",
    "education": "Elektrotehnički fakultet, Podgorica.",
    "employment": "Senior Backend Engineer u fintech kompaniji (remote, Amsterdam).",
    "ideas": "Jednostavan payment gateway za male online prodavce na Zapadnom Balkanu, gdje Stripe još ne radi.",
    "equity": "50/50, vesting na 4 godine.",
    "lookingFor": "Tražim nekoga ko je jak u prodaji ili proizvodu, a dobro mi dođe i drugi inženjer sa istom energijom.",
    "wantTech": null,
    "emailTag": "novi",
    "photoUrl": "https://i.pravatar.cc/300?u=fico-novi-5"
  },
  {
    "first": "Sara",
    "last": "Nikolić",
    "gender": "FEMALE",
    "age": 30,
    "country": "RS",
    "city": "Novi Sad",
    "tech": false,
    "ideaStatus": "COMMITTED",
    "timing": "ALREADY_FULL_TIME",
    "areas": [
      "SALES_MARKETING",
      "PRODUCT"
    ],
    "interests": [
      "ECOMMERCE",
      "KLIMA_ODRZIVOST",
      "MARKETPLACE"
    ],
    "intro": "Već šest mjeseci full-time gradim marketplace za polovnu dječju opremu. Imam 3.000 korisnika i prve prihode, a fali mi tehnički partner da pređemo sa no-code rješenja na pravi proizvod.",
    "lifePath": "Radila sam u marketingu za velike FMCG brendove. Kad sam dobila dijete, vidjela sam koliko se opreme baca, i tu je nastala ideja. Dala sam otkaz i krenula, pa sada prvi put gradim nešto svoje.",
    "freeTime": "Vrijeme sa porodicom, šetnje po Fruškoj gori i dobra knjiga.",
    "other": "Imam malu angel investiciju od 30.000 € i mjesto u lokalnom inkubatoru.",
    "accomplishment": "Bez budžeta za reklame dovela sam marketplace do 3.000 korisnika i 800 prodaja za šest mjeseci.",
    "education": "Ekonomski fakultet, Subotica, smjer Marketing.",
    "employment": "Osnivačica marketplace-a (full-time), ranije Brand Manager u FMCG kompaniji.",
    "ideas": "Marketplace za polovnu dječju opremu sa provjerom kvaliteta i dostavom na kućnu adresu, prvo u Srbiji, a zatim u regionu.",
    "equity": "Tehničkom co-founderu nudim 35-45%, uz vesting.",
    "lookingFor": "Tražim tehničkog co-foundera koji može preuzeti cijeli proizvod. Iskustvo sa marketplace-ovima ili plaćanjima je veliki plus.",
    "wantTech": true,
    "emailTag": "novi",
    "photoUrl": "https://i.pravatar.cc/300?u=fico-novi-6"
  },
  {
    "first": "Edin",
    "last": "Karić",
    "gender": "MALE",
    "age": 33,
    "country": "BA",
    "city": "Banja Luka",
    "tech": false,
    "ideaStatus": "EXPLORING",
    "timing": "READY_ON_MATCH",
    "areas": [
      "OPERATIONS",
      "SALES_MARKETING"
    ],
    "interests": [
      "NEKRETNINE",
      "ECOMMERCE",
      "FINTECH"
    ],
    "intro": "Imam iskustvo u finansijama i operacijama: osam godina u banci, zadnje tri kao menadžer za mala i srednja preduzeća. Dobro poznajem kako lokalne firme posluju i gdje ih boli.",
    "lifePath": "Odrastao sam u Prijedoru, a studirao u Banjoj Luci. U banci sam prošao sve, od šaltera do kreditnog odbora. Shvatio sam da mi je zanimljivije graditi rješenja nego ih odobravati.",
    "freeTime": "Ribolov, planinski biciklizam i podcasti o investiranju.",
    "other": "Razumijem regulativu u BiH i imam dobre kontakte u bankama i računovodstvenim kućama.",
    "accomplishment": "Pokrenuo sam program kredita za startupe u banci, kroz koji je finansirano 40 firmi.",
    "education": "Ekonomski fakultet, Banja Luka, smjer Finansije i bankarstvo.",
    "employment": "Menadžer za MSP klijente u komercijalnoj banci.",
    "ideas": "Aplikacija za male firme koja povezuje račune iz više banaka, prati naplatu i šalje podsjetnike kupcima koji kasne sa plaćanjem.",
    "equity": "Ravnopravno, a otvoren sam i za razgovor ako je neko već počeo.",
    "lookingFor": "Tražim tehničkog co-foundera koji želi graditi B2B proizvod za lokalno tržište i ne treba mu sve servirano.",
    "wantTech": true,
    "emailTag": "novi",
    "photoUrl": "https://i.pravatar.cc/300?u=fico-novi-7"
  },
  {
    "first": "Ivana",
    "last": "Babić",
    "gender": "FEMALE",
    "age": 32,
    "country": "SI",
    "city": "Ljubljana",
    "tech": false,
    "ideaStatus": "OPEN",
    "timing": "WITHIN_YEAR",
    "areas": [
      "SALES_MARKETING",
      "PRODUCT"
    ],
    "interests": [
      "SAAS",
      "AI_ML",
      "ECOMMERCE"
    ],
    "intro": "Growth marketerka koja je radila za tri startupa koja su dobila investiciju. Znam postaviti analitiku, eksperimente i kanale rasta od nule. Sljedeći korak je da budem osnivačica.",
    "lifePath": "Rođena sam u Splitu, a živim u Ljubljani. Počela sam kao copywriterka, pa sam se zaljubila u podatke i rast. Radila sam u Berlinu dvije godine, a vratila sam se jer vjerujem u region.",
    "freeTime": "Penjanje, fotografija analognim aparatom i vikend putovanja.",
    "other": "Otvorena sam za bilo koju ideju gdje mogu odmah donijeti korisnike.",
    "accomplishment": "U zadnjem startupu sam vodila rast sa 2.000 na 60.000 plaćenih korisnika za 18 mjeseci.",
    "education": "Filozofski fakultet u Splitu, a zatim master iz digitalnog marketinga u Berlinu.",
    "employment": "Head of Growth u SaaS startupu.",
    "ideas": "Nemam svoju ideju, ali me najviše privlače B2B SaaS i AI alati za male firme. Rado ću se pridružiti dobroj ideji.",
    "equity": "Otvorena sam za razgovor, ali bih voljela da budemo ravnopravni partneri.",
    "lookingFor": "Tražim tehničkog co-foundera sa idejom ili jakim mišljenjem o problemu koji želi riješiti. Ja donosim rast i korisnike.",
    "wantTech": true,
    "emailTag": "novi",
    "photoUrl": "https://i.pravatar.cc/300?u=fico-novi-8"
  },
  {
    "first": "Haris",
    "last": "Omerović",
    "gender": "MALE",
    "age": 25,
    "country": "BA",
    "city": "Sarajevo",
    "tech": true,
    "ideaStatus": "OPEN",
    "timing": "READY_ON_MATCH",
    "areas": [
      "ENGINEERING",
      "DESIGN"
    ],
    "interests": [
      "ECOMMERCE",
      "MOBILNE_APLIKACIJE",
      "GAMING"
    ],
    "intro": "Mobile developer (React Native, Swift) koji je objavio tri aplikacije. Brzo učim i volim praviti stvari koje ljudi stvarno koriste. Tražim osnivača s kojim ću graditi dugoročno.",
    "lifePath": "Na ETF-u sam za vrijeme studija napravio aplikaciju za red vožnje sarajevskog tramvaja, koja je imala 50.000 preuzimanja. Poslije toga sam radio u agenciji, a sada sam freelance.",
    "freeTime": "Igram košarku, pravim male igre za zabavu i pratim dizajn zajednicu.",
    "other": "Mogu početi odmah i nemam problem sa dugim satima na početku.",
    "accomplishment": "Aplikacija koju sam sam napravio kao student imala je 50.000 preuzimanja bez ikakvog marketinga.",
    "education": "Elektrotehnički fakultet, Sarajevo, smjer Računarstvo i informatika.",
    "employment": "Freelance mobile developer za klijente iz EU.",
    "ideas": "Imam par ideja za aplikacije u e-commerce prostoru, ali sam otvoren da se pridružim nečijoj ideji.",
    "equity": "Fer podjela prema doprinosu, oko 50/50 ako smo oboje full-time.",
    "lookingFor": "Tražim poslovnog co-foundera sa idejom i iskustvom u prodaji, nekoga ko zna doći do korisnika.",
    "wantTech": false,
    "emailTag": "novi",
    "photoUrl": "https://i.pravatar.cc/300?u=fico-novi-9"
  }
];
