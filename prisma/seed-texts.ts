// Tekstovi za seed profile: svaki profil dobija pune YC sekcije (Životna priča,
// Slobodno vrijeme, Ostalo, Potencijalne ideje, Idealan co-founder, udio).
// Koriste ga prisma/seed.ts i jednokratna dopuna postojećih seed profila.

export const IDEAS_OPTIONS = [
  "Marketplace za majstore i kućne popravke u regionu: korisnik opiše problem, dobije tri ponude u roku od sat vremena, a plaćanje ide preko platforme tek kad je posao gotov.",
  "AI asistent za računovođe koji automatski knjiži izvode iz banke i fakture po lokalnim propisima (BiH, Srbija, Hrvatska). Razgovarao/la sam sa 20 knjigovođa i svi gube 30% vremena na ručno knjiženje.",
  "Platforma za rezervaciju termina u malim salonima, ordinacijama i teretanama, sa podsjetnicima preko Vibera. Većina ih i dalje vodi raspored u svesci.",
  "B2B SaaS za praćenje voznog parka i potrošnje goriva za male transportne firme. Imam prva tri zainteresovana klijenta iz porodičnog biznisa.",
  "Aplikacija za učenje programiranja na našem jeziku, sa mentorima iz industrije i garancijom prakse u partnerskim firmama.",
  "Alat koji restoranima predviđa nabavku na osnovu prodaje i vremenske prognoze, da smanje bacanje hrane i trošak namirnica.",
  "Platforma koja povezuje dijasporu sa provjerenim izvođačima za gradnju i renoviranje kuća u domovini, uz video izvještaje i plaćanje po fazama.",
  "Digitalna klinika za mentalno zdravlje sa psiholozima koji govore naš jezik, dostupna i dijaspori po pristupačnoj cijeni.",
] as const;

export const LIFE_PATH_OPTIONS = [
  "Odrastao/la sam u manjem gradu i rano počeo/la da radim u porodičnoj radnji. Tu sam naučio/la kako se razgovara sa kupcima. Poslije fakulteta sam pet godina radio/la u korporaciji, a sada želim graditi nešto svoje.",
  "Programiranjem sam počeo/la u srednjoj školi, praveći sajtove za lokalne firme. Studirao/la sam informatiku, radio/la u par agencija i u jednom startupu koji je prodat, i sad tražim sljedeći veliki izazov.",
  "Prvi startup sam pokrenuo/la sa 24 godine i zatvorio/la ga poslije dvije godine. Naučio/la sam koliko je važno rano razgovarati sa korisnicima. Od tada radim kao product manager i skupljam iskustvo za drugi pokušaj.",
  "Nekoliko godina sam živio/la i radio/la u Njemačkoj, a onda sam se vratio/la jer vjerujem da se odavde može graditi globalni proizvod. Dugo sam radio/la freelance i sada želim dugoročni projekat sa timom.",
  "Završio/la sam ekonomiju, a onda sam se kroz bootcamp prekvalifikovao/la u tech. Ta kombinacija mi pomaže da razumijem i biznis i tehničku stranu, pa se dobro snalazim kao most između njih.",
  "Odrastao/la sam između Sarajeva i Beča. Radio/la sam u prodaji za velike B2B klijente, a zadnje dvije godine vodim mali tim. Sada želim graditi proizvod od nule umjesto da prodajem tuđi.",
] as const;

export const FREE_TIME_OPTIONS = [
  "Planinarenje po Dinaridima i fotografija. Vikendom obično nisam u gradu.",
  "Čitam (najviše biografije osnivača) i igram šah online.",
  "Trčim polumaratone i slušam podcaste o tehnologiji i biznisu.",
  "Kuham za prijatelje i putujem kad god uhvatim jeftinu kartu.",
  "Sviram gitaru u amaterskom bendu i idem na koncerte.",
  "Volontiram kao mentor/ica na lokalnim hackathonima i igram košarku.",
] as const;

export const OTHER_NOTES = [
  "Najvažnija mi je otvorena komunikacija i jasna podjela odgovornosti od prvog dana.",
  "Prvih par mjeseci mogu raditi honorarno, a full-time čim validiramo ideju.",
  "Preselio/la bih se za pravu priliku i pravog co-foundera.",
  "Imam malu ušteđevinu koju sam spreman/na uložiti u zajednički projekat.",
  "Govorim engleski i njemački, pa mi je lako raditi sa klijentima iz EU.",
] as const;

export const EQUITY_OPTIONS = [
  "Dijelimo pola-pola, uz vesting na 4 godine i cliff od godinu dana.",
  "Ravnopravna podjela među osnivačima, a bitno mi je da svi budu jednako posvećeni.",
  "Otvoren/a sam za razgovor. Udio treba da odražava doprinos i rizik koji svako preuzima.",
  "Između 30% i 50%, zavisno od toga ko donosi ideju i prve klijente.",
  "50/50 ako oboje radimo full-time. Ako neko radi honorarno, dogovaramo se drugačije.",
] as const;

export const LOOKING_FOR_OPTIONS = [
  "Tražim tehničkog co-foundera koji može samostalno voditi razvoj proizvoda i voli brzo isporučivati. Bitno mi je da razmišlja o korisnicima, a ne samo o kodu.",
  "Tražim poslovnog co-foundera sa iskustvom u prodaji i razvoju biznisa, nekoga ko ne bježi od hladnih poziva i pregovora.",
  "Tražim posvećenu osobu sa sličnom vizijom, spremnu da radi puno radno vrijeme čim pokažemo prve rezultate.",
  "Otvoren/a sam za razgovor. Bitnije su mi hemija i komplementarne vještine od savršenog CV-a.",
  "Tražim nekoga ko dobro poznaje dizajn i proizvod, da zajedno pravimo nešto što ljudi zaista vole koristiti.",
] as const;

/** Deterministički izbor po indeksu profila: isti profil uvijek dobija isti tekst. */
export function textAt<T>(options: readonly T[], index: number, salt = 0): T {
  const item = options[(index * 7 + salt) % options.length];
  if (item === undefined) throw new Error("textAt: prazan niz");
  return item;
}
