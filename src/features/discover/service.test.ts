import { describe, expect, it, vi } from "vitest";
import type { Clock } from "@/lib/clock";
import type { MatchPerson, MatchPreference, MatchProfile } from "@/lib/matching/types";
import type { ProfileRecord } from "@/features/profile/repository";
import type { CandidateRow, DiscoverRepository } from "./repository";
import { createDiscoverService } from "./service";

const evaluateMatchMock = vi.fn();

vi.mock("@/lib/matching/score", () => ({
  evaluateMatch: (...args: unknown[]) => evaluateMatchMock(...args),
}));

const NOW = new Date("2026-01-01T00:00:00Z");

function createFakeClock(now: Date = NOW): Clock {
  return { now: () => now };
}

function fakeMatchProfile(overrides: Partial<MatchProfile> = {}): MatchProfile {
  return {
    userId: "target",
    isTechnical: null,
    areas: [],
    ideaStatus: null,
    timing: null,
    countryCode: null,
    city: null,
    interests: [],
    birthDate: null,
    lastActiveAt: NOW,
    ...overrides,
  };
}

function fakeMatchPreference(overrides: Partial<MatchPreference> = {}): MatchPreference {
  return {
    technical: null,
    technicalImportance: null,
    wantedAreas: [],
    areasImportance: null,
    idea: null,
    ideaImportance: null,
    timingImportance: null,
    location: null,
    locationImportance: null,
    ageMin: null,
    ageMax: null,
    ageImportance: null,
    interestsImportance: null,
    ...overrides,
  };
}

function fakePerson(overrides: Partial<MatchProfile> = {}): MatchPerson {
  return { profile: fakeMatchProfile(overrides), preference: fakeMatchPreference() };
}

function fakeProfile(overrides: Partial<ProfileRecord> = {}): ProfileRecord {
  return {
    userId: "target",
    status: "APPROVED",
    rejectionReason: null,
    firstName: "Ana",
    lastName: "Anić",
    photoUrl: null,
    linkedinUrl: null,
    noLinkedin: false,
    countryCode: "BA",
    city: "Sarajevo",
    intro: null,
    videoUrl: null,
    accomplishment: null,
    education: null,
    employment: null,
    isTechnical: null,
    gender: null,
    birthDate: null,
    schedulingUrl: null,
    twitterUrl: null,
    instagramUrl: null,
    heardFrom: null,
    hideAge: false,
    ideaStatus: null,
    ideas: null,
    hasCofounder: null,
    timing: null,
    areas: [],
    interests: [],
    equityExpectations: null,
    freeTime: null,
    lifePath: null,
    other: null,
    submittedAt: null,
    reviewedAt: null,
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

function createFakeRepo(overrides: Partial<DiscoverRepository> = {}): DiscoverRepository {
  return {
    getViewerPerson: vi.fn().mockResolvedValue(fakePerson({ userId: "viewer" })),
    getExcludedUserIds: vi.fn().mockResolvedValue([]),
    deleteAllNotInterested: vi.fn().mockResolvedValue(4),
    getRelation: vi.fn().mockResolvedValue({ decision: null, sent: null, received: null, matchId: null }),
    listCandidates: vi.fn().mockResolvedValue([]),
    getCandidateById: vi.fn().mockResolvedValue(null),
    getLikesRemaining: vi.fn().mockResolvedValue(20),
    upsertDecision: vi.fn().mockResolvedValue(undefined),
    deleteDecision: vi.fn().mockResolvedValue(undefined),
    listDecisions: vi.fn().mockResolvedValue({ items: [], nextCursor: null }),
    ...overrides,
  };
}

describe("createDiscoverService.getNext", () => {
  it("baca NOT_FOUND kad viewer nema profil", async () => {
    const repo = createFakeRepo({ getViewerPerson: vi.fn().mockResolvedValue(null) });
    const service = createDiscoverService({ repo, clock: createFakeClock() });

    await expect(service.getNext("viewer")).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("vraća candidate i match null kad nema kandidata", async () => {
    const repo = createFakeRepo({ listCandidates: vi.fn().mockResolvedValue([]), getLikesRemaining: vi.fn().mockResolvedValue(17) });
    const service = createDiscoverService({ repo, clock: createFakeClock() });

    const result = await service.getNext("viewer");

    expect(result).toEqual({ candidate: null, match: null, likesRemaining: 17 });
  });

  it("vraća najbolje rangiranog kandidata po score-u", async () => {
    const rows: CandidateRow[] = [
      { person: fakePerson({ userId: "cand-low" }), profile: fakeProfile({ userId: "cand-low", firstName: "Low" }), preference: null, lastActiveAt: new Date() },
      { person: fakePerson({ userId: "cand-high" }), profile: fakeProfile({ userId: "cand-high", firstName: "High" }), preference: null, lastActiveAt: new Date() },
    ];
    evaluateMatchMock.mockImplementation((_viewer: MatchPerson, candidate: MatchPerson) => {
      const score = candidate.profile.userId === "cand-high" ? 0.9 : 0.2;
      return { score, reasons: [`reason-${candidate.profile.userId}`], requiredSatisfied: true };
    });
    const repo = createFakeRepo({ listCandidates: vi.fn().mockResolvedValue(rows) });
    const service = createDiscoverService({ repo, clock: createFakeClock() });

    const result = await service.getNext("viewer");

    expect(result.candidate?.userId).toBe("cand-high");
    expect(result.match).toEqual({ score: 0.9, reasons: ["reason-cand-high"] });
  });

  it("isključuje kandidata koji ne zadovoljava requiredSatisfied bez obzira na score", async () => {
    const rows: CandidateRow[] = [
      {
        person: fakePerson({ userId: "cand-unmet" }),
        profile: fakeProfile({ userId: "cand-unmet", firstName: "Unmet" }),
        preference: null,
        lastActiveAt: new Date(),
      },
      { person: fakePerson({ userId: "cand-ok" }), profile: fakeProfile({ userId: "cand-ok", firstName: "Ok" }), preference: null, lastActiveAt: new Date() },
    ];
    evaluateMatchMock.mockImplementation((_viewer: MatchPerson, candidate: MatchPerson) => {
      if (candidate.profile.userId === "cand-unmet") {
        return { score: 0.99, reasons: [], requiredSatisfied: false };
      }
      return { score: 0.1, reasons: [], requiredSatisfied: true };
    });
    const repo = createFakeRepo({ listCandidates: vi.fn().mockResolvedValue(rows) });
    const service = createDiscoverService({ repo, clock: createFakeClock() });

    const result = await service.getNext("viewer");

    expect(result.candidate?.userId).toBe("cand-ok");
  });
});

describe("createDiscoverService.getProfile", () => {
  it("baca NOT_FOUND kad kandidat nije vidljiv", async () => {
    const repo = createFakeRepo({ getCandidateById: vi.fn().mockResolvedValue(null) });
    const service = createDiscoverService({ repo, clock: createFakeClock() });

    await expect(service.getProfile("viewer", "target")).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("vraća profil i match za vidljivog kandidata", async () => {
    evaluateMatchMock.mockReturnValue({ score: 0.5, reasons: ["r1"], requiredSatisfied: true });
    const repo = createFakeRepo({
      getCandidateById: vi
        .fn()
        .mockResolvedValue({ person: fakePerson({ userId: "target" }), profile: fakeProfile({ userId: "target" }), preference: null, lastActiveAt: new Date() }),
    });
    const service = createDiscoverService({ repo, clock: createFakeClock() });

    const result = await service.getProfile("viewer", "target");

    expect(result.profile.userId).toBe("target");
    expect(result.match).toEqual({ score: 0.5, reasons: ["r1"] });
  });
});

describe("createDiscoverService.setDecision / clearDecision", () => {
  it("poziva repo.upsertDecision sa tačnim argumentima", async () => {
    const repo = createFakeRepo();
    const service = createDiscoverService({ repo, clock: createFakeClock() });

    const result = await service.setDecision("viewer", "target", "THINKING");

    expect(repo.upsertDecision).toHaveBeenCalledWith("viewer", "target", "THINKING", NOW);
    expect(result).toEqual({ type: "THINKING" });
  });

  it("poziva repo.deleteDecision sa tačnim argumentima", async () => {
    const repo = createFakeRepo();
    const service = createDiscoverService({ repo, clock: createFakeClock() });

    await service.clearDecision("viewer", "target");

    expect(repo.deleteDecision).toHaveBeenCalledWith("viewer", "target");
  });
});

describe("createDiscoverService.listDecisions", () => {
  it("mapira profile u ProfileCard i prosljeđuje nextCursor", async () => {
    evaluateMatchMock.mockReturnValue({ score: 0.7, reasons: ["r"], requiredSatisfied: true });
    const decidedAt = new Date("2026-01-05T00:00:00Z");
    const repo = createFakeRepo({
      listDecisions: vi.fn().mockResolvedValue({
        items: [
          {
            profile: fakeProfile({ userId: "target", firstName: "Mara", birthDate: new Date("1996-01-01") }),
            person: fakePerson({ userId: "target" }),
            decidedAt,
          },
        ],
        nextCursor: "target",
      }),
    });
    const service = createDiscoverService({ repo, clock: createFakeClock() });

    const result = await service.listDecisions("viewer", "THINKING", undefined, 20);

    expect(repo.listDecisions).toHaveBeenCalledWith("viewer", "THINKING", undefined, 20);
    expect(result.nextCursor).toBe("target");
    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.profile).toMatchObject({ userId: "target", firstName: "Mara", age: 30 });
    expect(result.items[0]?.decidedAt).toBe(decidedAt);
    expect(result.items[0]?.match).toEqual({ score: 0.7, reasons: ["r"] });
  });

  it("resetNotInterested vraća broj obrisanih odluka", async () => {
    const repo = createFakeRepo();
    const service = createDiscoverService({ repo, clock: createFakeClock() });
    await expect(service.resetNotInterested("viewer")).resolves.toEqual({ deleted: 4 });
    expect(repo.deleteAllNotInterested).toHaveBeenCalledWith("viewer");
  });
});
