import { describe, expect, it } from "vitest";
import { createPerson } from "./test-helpers";
import { activityMultiplier, evaluateMatch } from "./score";

const now = new Date("2026-10-15T00:00:00.000Z");
const DAY_MS = 24 * 60 * 60 * 1000;

describe("activityMultiplier", () => {
  it("vraća 1.0 tačno na 7 dana", () => {
    expect(activityMultiplier(new Date(now.getTime() - 7 * DAY_MS), now)).toBe(1.0);
  });

  it("vraća 0.9 odmah nakon 7 dana i tačno na 30 dana", () => {
    expect(activityMultiplier(new Date(now.getTime() - (7 * DAY_MS + 1)), now)).toBe(0.9);
    expect(activityMultiplier(new Date(now.getTime() - 30 * DAY_MS), now)).toBe(0.9);
  });

  it("vraća 0.75 nakon 30 dana", () => {
    expect(activityMultiplier(new Date(now.getTime() - (30 * DAY_MS + 1)), now)).toBe(0.75);
  });
});

describe("evaluateMatch - required uslovi", () => {
  it("requiredSatisfied je false kad A→B prolazi ali B→A ne", () => {
    const viewer = createPerson({}, { technical: "TECHNICAL", technicalImportance: "REQUIRED" });
    const candidate = createPerson(
      { isTechnical: true },
      { technical: "NON_TECHNICAL", technicalImportance: "REQUIRED" },
    );
    const result = evaluateMatch(viewer, candidate, now);
    expect(result.requiredSatisfied).toBe(false);
  });

  it("requiredSatisfied je false kad B→A prolazi ali A→B ne", () => {
    const viewer = createPerson(
      { isTechnical: true },
      { technical: "NON_TECHNICAL", technicalImportance: "REQUIRED" },
    );
    const candidate = createPerson({}, { technical: "TECHNICAL", technicalImportance: "REQUIRED" });
    const result = evaluateMatch(viewer, candidate, now);
    expect(result.requiredSatisfied).toBe(false);
  });

  it("requiredSatisfied je true kad su obje strane zadovoljene", () => {
    const viewer = createPerson(
      { isTechnical: false },
      { technical: "TECHNICAL", technicalImportance: "REQUIRED" },
    );
    const candidate = createPerson({ isTechnical: true }, {});
    const result = evaluateMatch(viewer, candidate, now);
    expect(result.requiredSatisfied).toBe(true);
  });
});

describe("evaluateMatch - fallback bez preferenci", () => {
  it("koristi preklapanje oblasti i interesa kad nijedna preferenca nije postavljena", () => {
    const viewer = createPerson({ areas: ["ENGINEERING", "DESIGN"], lastActiveAt: now });
    const candidate = createPerson({
      areas: ["ENGINEERING", "SALES_MARKETING", "OPERATIONS"],
      lastActiveAt: now,
    });
    const result = evaluateMatch(viewer, candidate, now);
    // areasOverlap = 1/min(2,3) = 0.5 u oba smjera, interestsOverlap = 0 (nema interesa)
    // fit = (3*0.5 + 2*0)/5 = 0.3, score = (0.3+0.3)/2 * 1.0
    expect(result.score).toBeCloseTo(0.3, 5);
    expect(result.requiredSatisfied).toBe(true);
  });
});

describe("evaluateMatch - razlozi", () => {
  it("vraća najviše 3 razloga i kad se poklapa mnogo kriterijuma", () => {
    const viewer = createPerson(
      {
        timing: "READY_ON_MATCH",
        interests: ["ai", "vr"],
      },
      {
        technical: "TECHNICAL",
        wantedAreas: ["ENGINEERING"],
        idea: "HAS_IDEA",
        location: "SAME_COUNTRY",
        ageMin: 25,
        ageMax: 35,
      },
    );
    const candidate = createPerson({
      isTechnical: true,
      areas: ["ENGINEERING", "DESIGN"],
      ideaStatus: "COMMITTED",
      timing: "READY_ON_MATCH",
      countryCode: "BA",
      interests: ["ai", "vr"],
      birthDate: new Date(now.getFullYear() - 30, now.getMonth(), now.getDate()),
    });
    const viewerWithCountry = { ...viewer, profile: { ...viewer.profile, countryCode: "BA" } };

    const result = evaluateMatch(viewerWithCountry, candidate, now);
    expect(result.reasons.length).toBeLessThanOrEqual(3);
    expect(result.reasons.length).toBe(3);
  });
});
