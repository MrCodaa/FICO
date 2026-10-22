// Gradovi i opštine/općine po državi. Latinica. Sortira se i čisti od duplikata u catalog.ts.
//
// Kriterijum: samo administrativni gradovi i opštine/općine (zvanična imena jedinica lokalne
// samouprave). Bez sela, naselja, turističkih mjesta i gradskih djelova/kvartova
// (npr. Novi Beograd, Zemun, Dobrinja, Gazi Baba, Futog, Petrovaradin, Risan, Bečići).
// Korisnik ne može dodati svoj grad: izbor je samo sa ovog spiska.

export const rawCitiesByCountry: Record<string, string[]> = {
  BA: [
    // Federacija BiH
    "Banovići", "Bihać", "Bosanska Krupa", "Bosansko Grahovo", "Bosanski Petrovac", "Breza", "Bugojno", "Busovača",
    "Bužim", "Cazin", "Čapljina", "Čelić", "Čitluk", "Doboj Istok", "Doboj Jug", "Dobretići", "Domaljevac-Šamac",
    "Donji Vakuf", "Drvar", "Foča-Ustikolina", "Fojnica", "Goražde", "Gornji Vakuf-Uskoplje", "Gračanica", "Gradačac",
    "Grude", "Hadžići", "Ilidža", "Ilijaš", "Jablanica", "Jajce", "Kakanj", "Kalesija", "Kiseljak", "Kladanj", "Ključ",
    "Konjic", "Kreševo", "Kupres", "Livno", "Lukavac", "Ljubuški", "Maglaj", "Mostar", "Neum", "Novi Travnik", "Odžak",
    "Olovo", "Orašje", "Pale-Prača", "Posušje", "Prozor-Rama", "Ravno", "Sanski Most", "Sapna", "Sarajevo",
    "Srebrenik", "Stolac", "Teočak", "Tešanj", "Tomislavgrad", "Travnik", "Trnovo",
    "Tuzla", "Usora", "Velika Kladuša", "Vareš", "Visoko", "Vitez", "Vogošća", "Zavidovići", "Zenica", "Žepče",
    "Živinice", "Glamoč", "Široki Brijeg",
    // Republika Srpska
    "Banja Luka", "Berkovići", "Bijeljina", "Bileća", "Bratunac", "Brod", "Čajniče", "Čelinac", "Derventa",
    "Donji Žabar", "Doboj", "Foča", "Gacko", "Gradiška", "Han Pijesak", "Istočna Ilidža", "Istočni Mostar",
    "Istočno Novo Sarajevo", "Istočni Stari Grad", "Jezero", "Kalinovik", "Kneževo", "Kostajnica",
    "Kotor Varoš", "Kozarska Dubica", "Krupa na Uni", "Laktaši", "Lopare", "Ljubinje", "Milići", "Modriča",
    "Mrkonjić Grad", "Nevesinje", "Novi Grad", "Novo Goražde", "Osmaci", "Oštra Luka", "Pale", "Pelagićevo",
    "Petrovac", "Petrovo", "Prijedor", "Prnjavor", "Ribnik", "Rogatica", "Rudo", "Sokolac", "Srbac", "Srebrenica",
    "Stanari", "Šamac", "Šekovići", "Šipovo", "Teslić", "Trebinje", "Ugljevik", "Višegrad",
    "Vlasenica", "Vukosavlje", "Zvornik", "Skender Vakuf",
    // Distrikt Brčko
    "Brčko",
  ],
  RS: [
    // Gradovi
    "Aranđelovac", "Bor", "Čačak", "Jagodina", "Kikinda", "Kragujevac", "Kraljevo", "Kruševac", "Leskovac",
    "Loznica", "Niš", "Novi Pazar", "Novi Sad", "Pančevo", "Pirot", "Požarevac", "Prokuplje", "Smederevo",
    "Sombor", "Sremska Mitrovica", "Subotica", "Šabac", "Užice", "Valjevo", "Vranje", "Vršac", "Zaječar",
    "Zrenjanin", "Beograd",
    // Opštine
    "Ada", "Aleksandrovac", "Aleksinac", "Alibunar", "Apatin", "Arilje", "Babušnica", "Bajina Bašta", "Batočina",
    "Bač", "Bačka Palanka", "Bačka Topola", "Bački Petrovac", "Bečej", "Bela Crkva", "Bela Palanka", "Beočin",
    "Blace", "Bogatić", "Bojnik", "Boljevac", "Bosilegrad", "Brus", "Bujanovac", "Crna Trava", "Čajetina", "Čoka",
    "Ćićevac", "Ćuprija", "Despotovac", "Dimitrovgrad", "Doljevac", "Gadžin Han", "Golubac", "Gornji Milanovac",
    "Inđija", "Irig", "Ivanjica", "Kanjiža", "Kladovo", "Knić", "Knjaževac", "Koceljeva", "Kosjerić", "Kovačica",
    "Kovin", "Krupanj", "Kučevo", "Kula", "Kuršumlija", "Lajkovac", "Lapovo", "Lebane", "Ljig", "Ljubovija",
    "Lučani", "Majdanpek", "Mali Iđoš", "Mali Zvornik", "Malo Crniće", "Medveđa", "Merošina", "Mionica",
    "Negotin", "Nova Crnja", "Nova Varoš", "Novi Bečej", "Novi Kneževac", "Odžaci", "Opovo", "Osečina",
    "Paraćin", "Pećinci", "Petrovac na Mlavi", "Plandište", "Požega", "Preševo", "Priboj", "Prijepolje", "Rača",
    "Raška", "Ražanj", "Rekovac", "Ruma", "Senta", "Sečanj", "Sjenica", "Smederevska Palanka", "Sokobanja",
    "Srbobran", "Sremski Karlovci", "Stara Pazova", "Surdulica", "Svilajnac", "Svrljig", "Šid", "Temerin",
    "Titel", "Topola", "Trgovište", "Trstenik", "Tutin", "Ub", "Varvarin", "Velika Plana", "Veliko Gradište",
    "Vladičin Han", "Vladimirci", "Vlasotince", "Vrbas", "Vrnjačka Banja", "Žabalj", "Žabari", "Žagubica",
    "Žitište", "Žitorađa",
  ],
  HR: [
    // Gradovi
    "Bakar", "Beli Manastir", "Belišće", "Benkovac", "Biograd na Moru", "Bjelovar", "Buje", "Buzet", "Čabar",
    "Čakovec", "Čazma", "Cres", "Crikvenica", "Daruvar", "Delnice", "Donja Stubica", "Donji Miholjac",
    "Drniš", "Dubrovnik", "Duga Resa", "Dugo Selo", "Đakovo", "Đurđevac", "Garešnica", "Glina", "Gospić",
    "Grubišno Polje", "Hrvatska Kostajnica", "Hvar", "Ilok", "Imotski", "Ivanec", "Ivanić-Grad", "Jastrebarsko",
    "Karlovac", "Kastav", "Kaštela", "Klanjec", "Knin", "Komiža", "Koprivnica", "Korčula", "Kraljevica", "Krapina",
    "Križevci", "Krk", "Kutina", "Kutjevo", "Labin", "Lepoglava", "Lipik", "Ludbreg", "Makarska", "Mali Lošinj",
    "Metković", "Mursko Središće", "Našice", "Nin", "Nova Gradiška", "Novalja", "Novi Marof", "Novigrad",
    "Novska", "Obrovac", "Ogulin", "Omiš", "Opatija", "Opuzen", "Orahovica", "Oroslavje", "Osijek", "Otočac",
    "Ozalj", "Pag", "Pakrac", "Pazin", "Petrinja", "Pleternica", "Ploče", "Poreč", "Pregrada", "Prelog", "Pula",
    "Rab", "Rijeka", "Rovinj", "Samobor", "Senj", "Sinj", "Sisak", "Skradin", "Slatina", "Slavonski Brod", "Slunj",
    "Solin", "Split", "Stari Grad", "Supetar", "Sveta Nedelja", "Sveti Ivan Zelina", "Trilj", "Trogir", "Umag",
    "Valpovo", "Varaždin", "Varaždinske Toplice", "Velika Gorica", "Vinkovci", "Virovitica", "Vis", "Vodice",
    "Vrbovec", "Vrbovsko", "Vrgorac", "Vrlika", "Vukovar", "Zabok", "Zadar", "Zagreb", "Zaprešić", "Zlatar",
    "Šibenik", "Županja", "Popovača", "Blato", "Vela Luka", "Ston", "Orebić",
    // Općine (odabrane, sjedišta)
    "Bale", "Fažana", "Gračac", "Konavle", "Ližnjan", "Marija Bistrica", "Medulin",
    "Nedelišće", "Pitomača", "Plitvička Jezera", "Primošten", "Raša", "Tisno", "Udbina", "Vrsar",
    "Župa Dubrovačka", "Hrvace", "Otok", "Cernik", "Nova Kapela", "Pićan", "Murter-Kornati",
  ],
  ME: [
    // 25 opština
    "Andrijevica", "Bar", "Berane", "Bijelo Polje", "Budva", "Cetinje", "Danilovgrad", "Gusinje", "Herceg Novi",
    "Kolašin", "Kotor", "Mojkovac", "Nikšić", "Petnjica", "Plav", "Pljevlja", "Plužine", "Podgorica", "Rožaje",
    "Šavnik", "Tivat", "Tuzi", "Ulcinj", "Zeta", "Žabljak",
  ],
  MK: [
    // Skoplje je jedan grad; njegove gradske opštine (Čair, Karpoš, Centar, Aerodrom, Gazi Baba, ...) nisu posebno navedene.
    "Skoplje",
    "Aračinovo", "Berovo", "Bitola", "Bogdanci", "Bogovinje", "Bosilovo", "Brvenica", "Čaška", "Centar Župa",
    "Čučer-Sandevo", "Debar", "Debarca", "Delčevo", "Demir Hisar", "Demir Kapija", "Dojran", "Dolneni", "Drugovo",
    "Gevgelija", "Gostivar", "Gradsko", "Ilinden", "Jegunovce", "Karbinci", "Kavadarci", "Kičevo", "Kočani",
    "Konče", "Kratovo", "Kriva Palanka", "Krivogaštani", "Kruševo", "Kumanovo", "Lipkovo", "Lozovo",
    "Makedonska Kamenica", "Makedonski Brod", "Mavrovo i Rostuša", "Mogila", "Negotino", "Novaci", "Novo Selo",
    "Ohrid", "Oslomej", "Pehčevo", "Petrovec", "Plasnica", "Prilep", "Probištip", "Radoviš", "Rankovce", "Resen",
    "Rosoman", "Sopište", "Staro Nagoričane", "Strumica", "Struga", "Studeničani", "Sveti Nikole", "Tearce",
    "Tetovo", "Valandovo", "Vasilevo", "Veles", "Vevčani", "Vinica", "Vrapčište", "Zajas", "Zelenikovo", "Zrnovci",
    "Štip", "Želino",
  ],
  SI: [
    "Ajdovščina", "Ankaran", "Beltinci", "Bistrica ob Sotli", "Bled", "Bohinj", "Borovnica", "Bovec", "Brežice",
    "Brezovica", "Celje", "Cerklje na Gorenjskem", "Cerknica", "Cerkno", "Črna na Koroškem", "Črnomelj",
    "Divača", "Dobrepolje", "Dol pri Ljubljani", "Domžale", "Dornava", "Dravograd", "Gorišnica", "Gorje",
    "Gornja Radgona", "Grosuplje", "Hajdina", "Hoče-Slivnica", "Horjul", "Hrastnik", "Hrpelje-Kozina", "Idrija",
    "Ilirska Bistrica", "Izola", "Jesenice", "Jezersko", "Juršinci", "Kamnik", "Kidričevo", "Kobarid", "Kočevje",
    "Komenda", "Koper", "Kozje", "Kranj", "Kranjska Gora", "Krško", "Laško", "Lenart", "Lendava", "Litija",
    "Ljubljana", "Ljubno", "Ljutomer", "Logatec", "Lukovica", "Majšperk", "Maribor", "Markovci", "Medvode",
    "Mengeš", "Metlika", "Mežica", "Miren-Kostanjevica", "Mirna", "Mislinja", "Moravče", "Mozirje",
    "Murska Sobota", "Muta", "Naklo", "Nova Gorica", "Novo Mesto", "Ormož", "Pesnica", "Piran", "Podčetrtek",
    "Poljčane", "Postojna", "Preddvor", "Prevalje", "Ptuj", "Rače-Fram", "Radeče", "Radenci", "Radovljica",
    "Ravne na Koroškem", "Renče-Vogrsko", "Ribnica", "Rogaška Slatina", "Ruše", "Sevnica", "Sežana",
    "Slovenj Gradec", "Slovenska Bistrica", "Slovenske Konjice", "Starše", "Šempeter-Vrtojba", "Šenčur",
    "Šentilj", "Šentjur", "Škofja Loka", "Šmarje pri Jelšah", "Šoštanj", "Tolmin", "Trbovlje", "Trebnje",
    "Trzin", "Tržič", "Turnišče", "Velenje", "Velike Lašče", "Videm", "Vipava", "Vitanje", "Vodice", "Vrhnika",
    "Zagorje ob Savi", "Zreče", "Žalec", "Žiri", "Žirovnica",
  ],
  XK: [
    "Priština", "Prizren", "Peć", "Gnjilane", "Mitrovica", "Severna Mitrovica", "Uroševac", "Đakovica",
    "Vučitrn", "Podujevo", "Kosovo Polje", "Obilić", "Glogovac", "Lipljan", "Suva Reka", "Dečani", "Istok",
    "Klina", "Srbica", "Vitina", "Kamenica", "Štimlje", "Kačanik", "Elez Han", "Novo Brdo", "Gračanica",
    "Ranilug", "Parteš", "Klokot", "Štrpce", "Zvečan", "Zubin Potok", "Leposavić", "Junik", "Mališevo",
    "Dragaš", "Mamuša", "Orahovac",
  ],
  AL: [
    // 61 opština (zvanična albanska imena)
    "Belsh", "Berat", "Bulqizë", "Cërrik", "Delvinë", "Devoll", "Dibër", "Dimal", "Divjakë", "Dropull",
    "Durrës", "Elbasan", "Fier", "Finiq", "Fushë-Arrëz", "Gjirokastër", "Gramsh", "Has", "Himarë", "Kamëz",
    "Kavajë", "Klos", "Kolonjë", "Konispol", "Korçë", "Krujë", "Kuçovë", "Kukës", "Kurbin", "Lezhë", "Libohovë",
    "Librazhd", "Lushnjë", "Malësi e Madhe", "Maliq", "Mallakastër", "Mat", "Memaliaj", "Mirditë", "Patos",
    "Peqin", "Përmet", "Pogradec", "Poliçan", "Prrenjas", "Pukë", "Pustec", "Roskovec", "Rrogozhinë", "Ura Vajgurore", "Sarandë",
    "Selenicë", "Shijak", "Shkodër", "Skrapar", "Tepelenë", "Tiranë", "Tropojë", "Vau i Dejës", "Vlorë", "Vorë",
  ],
};
