// Seed: ~40 realističnih profila za Discover/matching testiranje (Faza 6).
//
// Idempotentnost: svi seed nalozi koriste domen "@fico.test". Na početku
// brišemo sve User zapise s tim domenom — onDelete: Cascade na svim vezanim
// modelima (Profile, Preference, Decision, Request, Match, Message,
// Notification, Block, Report) počisti ostatak, pa je sigurno vrtjeti
// `npm run db:seed` više puta zaredom bez duplikata ili unique-constraint grešaka.
//
// Podaci su generisani deterministički (seeded PRNG) da bi ponovljeni seed
// davao isti skup profila — korisno za ručno testiranje (isti profil #i
// uvijek izgleda isto) i za snapshot-stil provjere.

import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import {
  Area,
  Gender,
  IdeaPreference,
  IdeaStatus,
  Importance,
  LocationScope,
  ProfileStatus,
  TechnicalPreference,
  Timing,
} from "../src/generated/prisma/enums";
import { hashPassword } from "../src/lib/auth/password";
import { citiesByCountry, countryCodes, interestCodes } from "../src/content/catalog";

const SEED_DOMAIN = "fico.test";
const SEED_PASSWORD = "Seed123!";
const PROFILE_COUNT = 40;

// ─────────────────────────── Seeded RNG (mulberry32) ───────────────────────────
// Determinizam: isti seed → isti niz "nasumičnih" vrijednosti na svakom pokretanju.
function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rng = mulberry32(20261015);

function randInt(min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}

function pick<T>(arr: readonly T[]): T {
  const item = arr[randInt(0, arr.length - 1)];
  if (item === undefined) throw new Error("pick: prazan niz");
  return item;
}

function chance(probability: number): boolean {
  return rng() < probability;
}

/** Vraća `count` jedinstvenih elemenata iz `arr`, redoslijed izmiješan. */
function pickMany<T>(arr: readonly T[], count: number): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = randInt(0, i);
    const tmp = copy[i];
    const other = copy[j];
    if (tmp === undefined || other === undefined) continue;
    copy[i] = other;
    copy[j] = tmp;
  }
  return copy.slice(0, Math.min(count, copy.length));
}

function daysAgo(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}

function yearsAgo(years: number, dayOffset: number): Date {
  const d = new Date();
  d.setFullYear(d.getFullYear() - years);
  d.setDate(d.getDate() - dayOffset);
  return d;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/č/g, "c")
    .replace(/ć/g, "c")
    .replace(/š/g, "s")
    .replace(/ž/g, "z")
    .replace(/đ/g, "dj")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// ───────────────────────────────── Fixture podaci ─────────────────────────────────

const MALE_NAMES = [
  "Amar", "Haris", "Emir", "Nikola", "Marko", "Stefan", "Dejan", "Luka",
  "Ivan", "Filip", "Mihajlo", "Dino", "Adnan", "Tarik", "Vuk", "Aleksandar",
  "Goran", "Edin", "Senad", "Igor",
] as const;

const FEMALE_NAMES = [
  "Amina", "Lejla", "Jovana", "Ana", "Maja", "Ines", "Tijana", "Milica",
  "Sara", "Ema", "Nina", "Elma", "Dunja", "Teodora", "Vanja", "Iva",
  "Selma", "Mirjana", "Jelena", "Katarina",
] as const;

const LAST_NAMES = [
  "Hodžić", "Begić", "Marković", "Petrović", "Ilić", "Kovačević", "Jovanović",
  "Nikolić", "Simić", "Đorđević", "Hajdarević", "Softić", "Vuković",
  "Stanković", "Pavlović", "Radović", "Mujić", "Kurtović", "Bešić", "Alić",
] as const;

const HEARD_FROM_OPTIONS = [
  "Preporuka prijatelja", "LinkedIn", "Facebook grupa za startupe", "Konferencija",
  "Startup Weekend", "Twitter/X",
] as const;

const EQUITY_OPTIONS = ["10-15%", "15-20%", "20-30%", "Dijelimo pola-pola", "Otvoreno za razgovor"] as const;

const FREE_TIME_OPTIONS = [
  "Planinarenje i fotografija", "Čitanje i šah", "Trčanje i podcasti o tehnologiji",
  "Kuhanje i putovanja", "Gitara i muzika", "Rolanje i video igre",
] as const;

const LIFE_PATH_OPTIONS = [
  "Prešao sam iz korporacije u startup svijet prije par godina i ne žalim.",
  "Studirao sam informatiku, radio u par agencija, sada tražim nešto svoje.",
  "Pokrenula sam i zatvorila jedan startup — učim iz grešaka i idem dalje.",
  "Dugo sam freelance radio, sada želim nešto dugoročnije sa timom.",
] as const;

const OTHER_NOTES = [
  "Najviše mi je bitna otvorena komunikacija i jasna podjela odgovornosti.",
  "Tražim nekog ko je spreman na honorarni commitment prvih par mjeseci.",
  "Preselio bih se za pravu priliku i pravog co-foundera.",
  "Imam malu ušteđevinu koju sam spreman uložiti u zajednički projekat.",
] as const;

const LOOKING_FOR_OPTIONS = [
  "Tražim tehničkog co-foundera koji može samostalno voditi razvoj proizvoda.",
  "Tražim poslovnog co-foundera sa iskustvom u prodaji i razvoju biznisa.",
  "Tražim nekoga posvećenog, sa sličnom vizijom i spremnog na puno radno vrijeme.",
  "Otvoren/a sam za razgovor — bitnija mi je hemija i komplementarne vještine od CV-a.",
] as const;

function introFor(isTechnical: boolean, areas: Area[]): string {
  const roleText = isTechnical
    ? "Softverski inženjer sa fokusom na backend i infrastrukturu."
    : "Fokusiran/a na proizvod, prodaju i rast korisničke baze.";
  const areaText = areas.includes(Area.ENGINEERING)
    ? " Posljednjih godina radim na skalabilnim web aplikacijama."
    : areas.includes(Area.SALES_MARKETING)
      ? " Volim graditi odnose s klijentima i validirati tržište."
      : " Uživam u oblikovanju proizvoda od ideje do lansiranja.";
  return `${roleText}${areaText} Tražim co-foundera s kojim mogu dugoročno graditi nešto ozbiljno.`;
}

function accomplishmentFor(i: number): string {
  const options = [
    "Lansirao/la sam proizvod koji je prešao 10.000 korisnika u prvoj godini.",
    "Vodio/la sam tim od 8 ljudi kroz rebrand i migraciju cijele platforme.",
    "Pomogao/la sam firmi da poveća prihod za 40% kroz novu prodajnu strategiju.",
    "Samostalno sam razvio/la MVP koji je privukao prvu rundu angel investicija.",
    "Osvojio/la sam regionalni hackathon sa timom koji sam okupio/la za 48h.",
  ];
  return options[i % options.length] ?? options[0]!;
}

function educationFor(i: number): string {
  const options = [
    "Elektrotehnički fakultet, smjer Računarstvo i informatika.",
    "Ekonomski fakultet, smjer Menadžment i poduzetništvo.",
    "Fakultet za informacijske tehnologije, samostalno učenje poslije.",
    "Prirodno-matematički fakultet, smjer Informatika.",
    "Fakultet političkih nauka, kasnije prekvalifikacija u tech industriju.",
  ];
  return options[i % options.length] ?? options[0]!;
}

function employmentFor(isTechnical: boolean, i: number): string {
  const technical = [
    "Senior Software Engineer u regionalnoj IT kompaniji, 5+ godina iskustva.",
    "Freelance full-stack developer za klijente iz EU i SAD-a.",
    "Tech Lead u produktnom timu srednje velike firme.",
  ];
  const nonTechnical = [
    "Product Manager u scale-up kompaniji posljednje 3 godine.",
    "Voditelj/ica prodaje u B2B SaaS firmi.",
    "Marketing menadžer/ica u e-commerce kompaniji.",
  ];
  const pool = isTechnical ? technical : nonTechnical;
  return pool[i % pool.length] ?? pool[0]!;
}

// ──────────────────────────────── Glavna logika ────────────────────────────────

// Pomak aktivnosti (u danima) — spektar od "danas" do "40+ dana", korišten
// ciklično kroz 40 profila da matching algoritam ima šta da računa za
// activityMultiplier.
const ACTIVITY_OFFSETS_DAYS = [
  0, 1, 2, 3, 4, 6, 8, 10, 10, 12, 15, 18, 20, 22, 25, 28, 32, 35, 38, 41, 45, 50, 55, 60, 70, 80, 95,
] as const;

async function main(): Promise<void> {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const db = new PrismaClient({ adapter });

  console.log(`Seed: brišem postojeće @${SEED_DOMAIN} naloge (idempotentno ponavljanje)...`);
  const deleted = await db.user.deleteMany({ where: { email: { endsWith: `@${SEED_DOMAIN}` } } });
  console.log(`Seed: obrišeno ${deleted.count} postojećih seed naloga.`);

  const sharedPasswordHash = await hashPassword(SEED_PASSWORD);

  // Status raspodjela: indeksi 0-2 PENDING_REVIEW, 3 DRAFT, 4 REJECTED, 5-39 APPROVED.
  // = 35 APPROVED + 3 PENDING_REVIEW + 1 DRAFT + 1 REJECTED = 40 ukupno.
  function statusFor(index: number): ProfileStatus {
    if (index < 3) return ProfileStatus.PENDING_REVIEW;
    if (index === 3) return ProfileStatus.DRAFT;
    if (index === 4) return ProfileStatus.REJECTED;
    return ProfileStatus.APPROVED;
  }

  const usedEmails = new Set<string>();
  const createdUsers: { id: string; index: number }[] = [];

  for (let i = 0; i < PROFILE_COUNT; i++) {
    const gender: Gender = chance(0.46) ? Gender.MALE : chance(0.92) ? Gender.FEMALE : Gender.OTHER;
    const firstName = gender === Gender.FEMALE ? pick(FEMALE_NAMES) : pick(MALE_NAMES);
    const lastName = pick(LAST_NAMES);

    const emailBase = `${slugify(firstName)}.${slugify(lastName)}`;
    let email = `${emailBase}@${SEED_DOMAIN}`;
    let suffix = 1;
    while (usedEmails.has(email)) {
      email = `${emailBase}${suffix}@${SEED_DOMAIN}`;
      suffix++;
    }
    usedEmails.add(email);

    const isTechnical = chance(0.5);
    const status = statusFor(i);
    const activityOffset = ACTIVITY_OFFSETS_DAYS[i % ACTIVITY_OFFSETS_DAYS.length] ?? 0;

    const countryCode = pick(countryCodes);
    const cities = citiesByCountry[countryCode] ?? [];
    const city = cities.length > 0 ? pick(cities) : "Sarajevo";

    const ideaStatus = pick([IdeaStatus.COMMITTED, IdeaStatus.EXPLORING, IdeaStatus.OPEN]);
    const timing = pick([Timing.ALREADY_FULL_TIME, Timing.READY_ON_MATCH, Timing.WITHIN_YEAR, Timing.NO_PLANS]);
    const areas = pickMany(
      [Area.PRODUCT, Area.ENGINEERING, Area.DESIGN, Area.SALES_MARKETING, Area.OPERATIONS],
      randInt(1, 3),
    );
    const interests = pickMany(interestCodes, randInt(2, 5));

    const hasLinkedin = chance(0.7);
    const birthDate = yearsAgo(randInt(22, 45), randInt(0, 364));

    // Opciona polja — svako nezavisno ispunjeno s ~40% šansom.
    const videoUrl = chance(0.3) ? `https://www.youtube.com/watch?v=seed-intro-${i}` : null;
    const schedulingUrl = chance(0.35) ? `https://cal.com/seed-${slugify(firstName)}-${i}` : null;
    const twitterUrl = chance(0.3) ? `https://x.com/seed_${slugify(firstName)}${i}` : null;
    const instagramUrl = chance(0.25) ? `https://instagram.com/seed_${slugify(firstName)}${i}` : null;
    const heardFrom = chance(0.5) ? pick(HEARD_FROM_OPTIONS) : null;
    const ideas = chance(0.45) ? "Radim na konceptu koji spaja AI alate i lokalno tržište usluga." : null;
    const hasCofounder = chance(0.5) ? chance(0.3) : null;
    const equityExpectations = chance(0.4) ? pick(EQUITY_OPTIONS) : null;
    const freeTime = chance(0.4) ? pick(FREE_TIME_OPTIONS) : null;
    const lifePath = chance(0.35) ? pick(LIFE_PATH_OPTIONS) : null;
    const other = chance(0.3) ? pick(OTHER_NOTES) : null;

    const isSubmitted = status !== ProfileStatus.DRAFT;
    const isReviewed = status === ProfileStatus.APPROVED || status === ProfileStatus.REJECTED;

    const user = await db.user.create({
      data: {
        email,
        passwordHash: sharedPasswordHash,
        emailVerifiedAt: new Date(),
        agreementAcceptedAt: new Date(),
        lastActiveAt: daysAgo(activityOffset),
        profile: {
          create: {
            status,
            rejectionReason: status === ProfileStatus.REJECTED ? "Profil ne ispunjava smjernice zajednice (test podatak)." : null,
            submittedAt: isSubmitted ? daysAgo(activityOffset + randInt(1, 5)) : null,
            reviewedAt: isReviewed ? daysAgo(activityOffset) : null,

            firstName,
            lastName,
            photoUrl: `https://i.pravatar.cc/300?u=seed-${i}`,
            linkedinUrl: hasLinkedin ? `https://www.linkedin.com/in/seed-${slugify(firstName)}-${slugify(lastName)}-${i}` : null,
            noLinkedin: !hasLinkedin,
            countryCode,
            city,
            intro: introFor(isTechnical, areas),
            videoUrl,
            accomplishment: accomplishmentFor(i),
            education: educationFor(i),
            employment: employmentFor(isTechnical, i),
            isTechnical,
            gender,
            birthDate,
            schedulingUrl,
            twitterUrl,
            instagramUrl,
            heardFrom,

            ideaStatus,
            ideas,
            hasCofounder,
            timing,
            areas,
            interests,
            equityExpectations,
            freeTime,
            lifePath,
            other,
          },
        },
      },
      select: { id: true },
    });

    createdUsers.push({ id: user.id, index: i });

    // Preference: prvih 15 profila (indeksi 0-14) ostaje potpuno "bez preference"
    // (sva polja null) — testira fallback kad korisnik nije ništa podesio.
    // Ostalih 25 (indeksi 15-39) ima miks REQUIRED/PREFERRED po raznim poljima.
    const hasAnyPreference = i >= 15;

    if (!hasAnyPreference) {
      await db.preference.create({
        data: { userId: user.id },
      });
    } else {
      // Ciklički mijenjamo koja su polja REQUIRED, koja PREFERRED, koja izostavljena,
      // da dobijemo realnu varijaciju (neki profili isključuju kandidate, neki samo blago preferiraju).
      const variant = i % 5;

      const technical = chance(0.6) ? pick([TechnicalPreference.TECHNICAL, TechnicalPreference.NON_TECHNICAL]) : null;
      const technicalImportance = technical ? (variant === 0 ? Importance.REQUIRED : Importance.PREFERRED) : null;

      const idea = chance(0.5) ? pick([IdeaPreference.HAS_IDEA, IdeaPreference.OPEN_TO_IDEAS]) : null;
      const ideaImportance = idea ? (variant === 1 ? Importance.REQUIRED : Importance.PREFERRED) : null;

      const location = chance(0.55) ? pick([LocationScope.SAME_CITY, LocationScope.SAME_COUNTRY, LocationScope.SAME_REGION]) : null;
      const locationImportance = location ? (variant === 2 ? Importance.REQUIRED : Importance.PREFERRED) : null;

      const wantedAreas = chance(0.5)
        ? pickMany([Area.PRODUCT, Area.ENGINEERING, Area.DESIGN, Area.SALES_MARKETING, Area.OPERATIONS], randInt(1, 2))
        : [];
      const areasImportance = wantedAreas.length > 0 ? (variant === 3 ? Importance.REQUIRED : Importance.PREFERRED) : null;

      const hasAgeRange = chance(0.5);
      const ageMin = hasAgeRange ? randInt(22, 30) : null;
      const ageMax = hasAgeRange ? randInt((ageMin ?? 30) + 3, 45) : null;
      const ageImportance = hasAgeRange ? (variant === 4 ? Importance.REQUIRED : Importance.PREFERRED) : null;

      const interestsImportance = chance(0.4) ? pick([Importance.REQUIRED, Importance.PREFERRED]) : null;
      const timingImportance = chance(0.4) ? pick([Importance.REQUIRED, Importance.PREFERRED]) : null;

      await db.preference.create({
        data: {
          userId: user.id,
          lookingFor: chance(0.6) ? pick(LOOKING_FOR_OPTIONS) : null,
          idea,
          ideaImportance,
          technical,
          technicalImportance,
          timingImportance,
          location,
          locationImportance,
          ageMin,
          ageMax,
          ageImportance,
          wantedAreas,
          areasImportance,
          interestsImportance,
          alertOnNewMatch: chance(0.5),
        },
      });
    }
  }

  console.log(`Seed: kreirano ${createdUsers.length} profila.`);

  // ─────────────────────── Bonus: Decision i Request zapisi ───────────────────────
  // Nekoliko ručno postavljenih veza da Discover isključivanje ima šta da testira.
  function userAt(index: number): string {
    const found = createdUsers.find((u) => u.index === index);
    if (!found) throw new Error(`Seed: nema kreiranog korisnika na indexu ${index}`);
    return found.id;
  }

  await db.decision.createMany({
    data: [
      { userId: userAt(5), targetId: userAt(16), type: "THINKING" },
      { userId: userAt(6), targetId: userAt(17), type: "NOT_INTERESTED" },
      { userId: userAt(7), targetId: userAt(18), type: "THINKING" },
    ],
  });

  const now = new Date();
  const in14Days = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

  await db.request.createMany({
    data: [
      {
        senderId: userAt(8),
        receiverId: userAt(19),
        message: "Zdravo! Pročitao/la sam tvoj profil i mislim da bismo mogli dobro saradjivati. Javi se!",
        status: "PENDING",
        expiresAt: in14Days,
      },
      {
        senderId: userAt(9),
        receiverId: userAt(20),
        message: "Hej, tražim tehničkog co-foundera i tvoj profil mi se učinio kao odličan fit. Hoćemo li na kratki poziv?",
        status: "PENDING",
        expiresAt: in14Days,
      },
    ],
  });

  console.log("Seed: dodano 3 Decision i 2 Request zapisa za testiranje Discover isključivanja.");

  await db.$disconnect();
  console.log("Seed: gotovo.");
}

main().catch(async (error: unknown) => {
  console.error("Seed: greška:", error);
  process.exitCode = 1;
});
