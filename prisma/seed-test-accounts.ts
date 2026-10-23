// 10 test naloga za ručno testiranje sa više korisnika: test1@fico.test … test10@fico.test.
//
// Svi imaju istu lozinku (TEST_ACCOUNT_PASSWORD), potvrđen email, prihvaćena pravila i
// ODOBREN profil sa punim, raznovrsnim podacima + Preference. Koristi ih i razvojna
// stranica /dev/login (radi samo uz NODE_ENV=development).
//
// Nalozi koriste domen "@fico.test", pa ih seed.ts briše i pravi iznova zajedno sa ostalim
// seed nalozima (idempotentno). Ovaj fajl sam ništa ne pokreće.

import type { PrismaClient } from "../src/generated/prisma/client";
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
import {
  EQUITY_OPTIONS,
  FREE_TIME_OPTIONS,
  IDEAS_OPTIONS,
  LIFE_PATH_OPTIONS,
  LOOKING_FOR_OPTIONS,
  OTHER_NOTES,
  textAt,
} from "./seed-texts";

export const TEST_ACCOUNT_COUNT = 10;
export const TEST_ACCOUNT_PASSWORD = "Test12345!";

export function testAccountEmail(n: number): string {
  return `test${n}@fico.test`;
}

interface TestProfile {
  first: string;
  last: string;
  gender: Gender;
  age: number;
  country: string;
  city: string;
  technical: boolean;
  ideaStatus: IdeaStatus;
  timing: Timing;
  areas: Area[];
  interests: string[];
  // Preference (null = bez preference)
  wantTech: TechnicalPreference | null;
  wantIdea: IdeaPreference | null;
  location: LocationScope | null;
  wantedAreas: Area[];
}

const PROFILES: readonly TestProfile[] = [
  { first: "Tarik", last: "Test", gender: Gender.MALE, age: 29, country: "BA", city: "Sarajevo", technical: true, ideaStatus: IdeaStatus.COMMITTED, timing: Timing.ALREADY_FULL_TIME, areas: [Area.ENGINEERING, Area.PRODUCT], interests: ["AI_ML", "SAAS", "DEVELOPER_ALATI"], wantTech: TechnicalPreference.NON_TECHNICAL, wantIdea: null, location: LocationScope.SAME_COUNTRY, wantedAreas: [Area.SALES_MARKETING] },
  { first: "Ana", last: "Test", gender: Gender.FEMALE, age: 27, country: "RS", city: "Beograd", technical: false, ideaStatus: IdeaStatus.OPEN, timing: Timing.READY_ON_MATCH, areas: [Area.SALES_MARKETING, Area.OPERATIONS], interests: ["FINTECH", "MARKETPLACE", "ECOMMERCE"], wantTech: TechnicalPreference.TECHNICAL, wantIdea: IdeaPreference.HAS_IDEA, location: null, wantedAreas: [Area.ENGINEERING] },
  { first: "Marko", last: "Test", gender: Gender.MALE, age: 34, country: "HR", city: "Zagreb", technical: true, ideaStatus: IdeaStatus.EXPLORING, timing: Timing.WITHIN_YEAR, areas: [Area.ENGINEERING], interests: ["HEALTHTECH", "AI_ML", "HARDVER"], wantTech: null, wantIdea: IdeaPreference.OPEN_TO_IDEAS, location: LocationScope.SAME_REGION, wantedAreas: [Area.PRODUCT, Area.DESIGN] },
  { first: "Lejla", last: "Test", gender: Gender.FEMALE, age: 31, country: "BA", city: "Banja Luka", technical: false, ideaStatus: IdeaStatus.COMMITTED, timing: Timing.ALREADY_FULL_TIME, areas: [Area.PRODUCT, Area.DESIGN], interests: ["EDTECH", "MOBILNE_APLIKACIJE", "MEDIJI_ZABAVA"], wantTech: TechnicalPreference.TECHNICAL, wantIdea: null, location: LocationScope.SAME_COUNTRY, wantedAreas: [Area.ENGINEERING] },
  { first: "Nikola", last: "Test", gender: Gender.MALE, age: 25, country: "RS", city: "Novi Sad", technical: true, ideaStatus: IdeaStatus.OPEN, timing: Timing.READY_ON_MATCH, areas: [Area.ENGINEERING, Area.DESIGN], interests: ["GAMING", "WEB3", "CYBERSECURITY"], wantTech: null, wantIdea: IdeaPreference.HAS_IDEA, location: null, wantedAreas: [] },
  { first: "Ines", last: "Test", gender: Gender.FEMALE, age: 38, country: "SI", city: "Ljubljana", technical: false, ideaStatus: IdeaStatus.EXPLORING, timing: Timing.WITHIN_YEAR, areas: [Area.OPERATIONS, Area.SALES_MARKETING], interests: ["LOGISTIKA", "KLIMA_ODRZIVOST", "PUTOVANJA"], wantTech: TechnicalPreference.TECHNICAL, wantIdea: null, location: LocationScope.SAME_REGION, wantedAreas: [Area.ENGINEERING, Area.PRODUCT] },
  { first: "Emir", last: "Test", gender: Gender.MALE, age: 41, country: "ME", city: "Podgorica", technical: false, ideaStatus: IdeaStatus.COMMITTED, timing: Timing.NO_PLANS, areas: [Area.SALES_MARKETING], interests: ["NEKRETNINE", "PUTOVANJA", "FINTECH"], wantTech: TechnicalPreference.TECHNICAL, wantIdea: IdeaPreference.OPEN_TO_IDEAS, location: LocationScope.SAME_COUNTRY, wantedAreas: [Area.ENGINEERING] },
  { first: "Maja", last: "Test", gender: Gender.FEMALE, age: 26, country: "HR", city: "Split", technical: true, ideaStatus: IdeaStatus.OPEN, timing: Timing.ALREADY_FULL_TIME, areas: [Area.ENGINEERING, Area.PRODUCT], interests: ["AI_ML", "EDTECH", "SAAS"], wantTech: TechnicalPreference.NON_TECHNICAL, wantIdea: null, location: null, wantedAreas: [Area.SALES_MARKETING, Area.OPERATIONS] },
  { first: "Dino", last: "Test", gender: Gender.MALE, age: 32, country: "BA", city: "Mostar", technical: true, ideaStatus: IdeaStatus.EXPLORING, timing: Timing.READY_ON_MATCH, areas: [Area.ENGINEERING, Area.OPERATIONS], interests: ["HARDVER", "KLIMA_ODRZIVOST", "LOGISTIKA"], wantTech: null, wantIdea: null, location: LocationScope.SAME_CITY, wantedAreas: [Area.DESIGN] },
  { first: "Jovana", last: "Test", gender: Gender.FEMALE, age: 35, country: "MK", city: "Skopje", technical: false, ideaStatus: IdeaStatus.COMMITTED, timing: Timing.WITHIN_YEAR, areas: [Area.DESIGN, Area.PRODUCT, Area.SALES_MARKETING], interests: ["MEDIJI_ZABAVA", "ECOMMERCE", "MOBILNE_APLIKACIJE"], wantTech: TechnicalPreference.TECHNICAL, wantIdea: IdeaPreference.OPEN_TO_IDEAS, location: LocationScope.SAME_REGION, wantedAreas: [Area.ENGINEERING] },
];

function slug(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

function daysAgo(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}

/** Pravi (ne briše) 10 test naloga. Pozovi poslije brisanja starih @fico.test naloga. */
export async function createTestAccounts(db: PrismaClient, passwordHash: string): Promise<void> {
  for (let n = 1; n <= TEST_ACCOUNT_COUNT; n++) {
    const p = PROFILES[n - 1];
    if (!p) throw new Error(`Seed: nema podataka za test nalog ${n}`);
    const i = n + 100; // pomak da se tekstovi razlikuju od običnih seed profila
    const birthDate = new Date();
    birthDate.setFullYear(birthDate.getFullYear() - p.age);
    birthDate.setMonth((n * 3) % 12);

    await db.user.create({
      data: {
        email: testAccountEmail(n),
        passwordHash,
        emailVerifiedAt: new Date(),
        agreementAcceptedAt: new Date(),
        lastActiveAt: new Date(),
        profile: {
          create: {
            status: ProfileStatus.APPROVED,
            submittedAt: daysAgo(3),
            reviewedAt: daysAgo(2),
            firstName: p.first,
            lastName: `${p.last}${n}`,
            photoUrl: `https://i.pravatar.cc/300?u=test-account-${n}`,
            linkedinUrl: n % 4 === 0 ? null : `https://www.linkedin.com/in/${slug(p.first)}-test-${n}`,
            noLinkedin: n % 4 === 0,
            countryCode: p.country,
            city: p.city,
            intro: `${p.technical ? "Tehnički" : "Poslovni"} osnivač iz grada ${p.city}. Ovo je test nalog broj ${n}: služi za provjeru toka Otkrij profile, zahtjeva i poruka.`,
            accomplishment: `Samostalno sam pokrenuo/la i vodio/la projekat koji je do sada imao preko ${n * 500} korisnika.`,
            education: p.technical ? "Fakultet informatike i računarstva." : "Ekonomski fakultet, smjer menadžment.",
            employment: p.technical ? "Software engineer u regionalnoj firmi." : "Voditelj/ica razvoja poslovanja u startupu.",
            isTechnical: p.technical,
            gender: p.gender,
            birthDate,
            schedulingUrl: n % 3 === 0 ? `https://cal.com/test-${n}` : null,
            twitterUrl: n % 2 === 0 ? `https://x.com/test_${n}` : null,
            heardFrom: n % 2 === 0 ? "Preporuka prijatelja" : null,
            ideaStatus: p.ideaStatus,
            ideas: p.ideaStatus === IdeaStatus.OPEN && n % 2 === 1 ? null : textAt(IDEAS_OPTIONS, i),
            hasCofounder: false,
            timing: p.timing,
            areas: p.areas,
            interests: p.interests,
            equityExpectations: textAt(EQUITY_OPTIONS, i, 1),
            freeTime: textAt(FREE_TIME_OPTIONS, i, 2),
            lifePath: textAt(LIFE_PATH_OPTIONS, i, 3),
            other: textAt(OTHER_NOTES, i, 4),
          },
        },
        preference: {
          create: {
            lookingFor: textAt(LOOKING_FOR_OPTIONS, i, 5),
            technical: p.wantTech,
            technicalImportance: p.wantTech ? Importance.PREFERRED : null,
            idea: p.wantIdea,
            ideaImportance: p.wantIdea ? Importance.PREFERRED : null,
            location: p.location,
            locationImportance: p.location ? Importance.PREFERRED : null,
            ageMin: 22,
            ageMax: 50,
            ageImportance: Importance.PREFERRED,
            wantedAreas: p.wantedAreas,
            areasImportance: p.wantedAreas.length > 0 ? Importance.PREFERRED : null,
            interestsImportance: Importance.PREFERRED,
            timingImportance: Importance.PREFERRED,
          },
        },
      },
    });
  }
}
