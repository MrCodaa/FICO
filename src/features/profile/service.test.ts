import { describe, expect, it, vi } from "vitest";
import type { Clock } from "@/lib/clock";
import type { StorageProvider } from "@/lib/storage";
import { createProfileService } from "./service";
import type { PreferenceRecord, ProfileRecord, ProfileRepository } from "./repository";

const NOW = new Date("2026-01-01T00:00:00Z");

function createFakeClock(now: Date = NOW): Clock {
  return { now: () => now };
}

function createFakeStorage(): StorageProvider & {
  put: ReturnType<typeof vi.fn>;
  remove: ReturnType<typeof vi.fn>;
} {
  return {
    put: vi.fn().mockResolvedValue({ url: "https://blob.example/new.jpg" }),
    remove: vi.fn().mockResolvedValue(undefined),
  };
}

function completeProfile(overrides: Partial<ProfileRecord> = {}): ProfileRecord {
  return {
    userId: "user-1",
    status: "DRAFT",
    rejectionReason: null,
    firstName: "Ana",
    lastName: "Anić",
    photoUrl: "https://blob.example/old.jpg",
    linkedinUrl: "https://linkedin.com/in/ana",
    noLinkedin: false,
    countryCode: "BA",
    city: "Sarajevo",
    intro: "Kratko o meni.",
    videoUrl: null,
    accomplishment: "Pokrenula sam proizvod.",
    education: "Fakultet elektrotehnike.",
    employment: "Software Engineer",
    isTechnical: true,
    gender: "FEMALE",
    birthDate: new Date("1995-05-05"),
    schedulingUrl: null,
    twitterUrl: null,
    instagramUrl: null,
    heardFrom: null,
    ideaStatus: "EXPLORING",
    ideas: null,
    hasCofounder: null,
    timing: "WITHIN_YEAR",
    areas: ["ENGINEERING"],
    interests: ["AI_ML"],
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

function createFakePreference(overrides: Partial<PreferenceRecord> = {}): PreferenceRecord {
  return {
    userId: "user-1",
    lookingFor: null,
    idea: null,
    ideaImportance: null,
    technical: null,
    technicalImportance: null,
    timingImportance: null,
    location: null,
    locationImportance: null,
    ageMin: null,
    ageMax: null,
    ageImportance: null,
    wantedAreas: [],
    areasImportance: null,
    interestsImportance: null,
    alertOnNewMatch: false,
    updatedAt: NOW,
    ...overrides,
  };
}

function createFakeRepo(overrides: Partial<ProfileRepository> = {}): ProfileRepository {
  return {
    getProfileAndPreference: vi.fn().mockResolvedValue({ profile: null, preference: null }),
    updateProfileDraft: vi.fn().mockResolvedValue(completeProfile()),
    updatePreferenceDraft: vi.fn().mockResolvedValue(createFakePreference()),
    updateProfilePhoto: vi.fn().mockResolvedValue({ oldPhotoUrl: null }),
    submitProfile: vi.fn().mockResolvedValue(true),
    ...overrides,
  };
}

describe("createProfileService.uploadPhoto", () => {
  it("baca VALIDATION_ERROR za nevalidan content type", async () => {
    const repo = createFakeRepo();
    const storage = createFakeStorage();
    const service = createProfileService({ repo, storage, clock: createFakeClock() });

    await expect(
      service.uploadPhoto("user-1", { buffer: Buffer.from("x"), contentType: "image/gif", size: 10 }),
    ).rejects.toMatchObject({ code: "VALIDATION_ERROR" });
    expect(storage.put).not.toHaveBeenCalled();
  });

  it("baca VALIDATION_ERROR za prevelik fajl", async () => {
    const repo = createFakeRepo();
    const storage = createFakeStorage();
    const service = createProfileService({ repo, storage, clock: createFakeClock() });

    await expect(
      service.uploadPhoto("user-1", {
        buffer: Buffer.from("x"),
        contentType: "image/png",
        size: 4 * 1024 * 1024 + 1,
      }),
    ).rejects.toMatchObject({ code: "VALIDATION_ERROR" });
    expect(storage.put).not.toHaveBeenCalled();
  });

  it("briše staru sliku tek nakon repo.updateProfilePhoto", async () => {
    const callOrder: string[] = [];
    const repo = createFakeRepo({
      updateProfilePhoto: vi.fn().mockImplementation(async () => {
        callOrder.push("repo.updateProfilePhoto");
        return { oldPhotoUrl: "https://blob.example/old.jpg" };
      }),
    });
    const storage = createFakeStorage();
    storage.remove.mockImplementation(async () => {
      callOrder.push("storage.remove");
    });
    const service = createProfileService({ repo, storage, clock: createFakeClock() });

    const url = await service.uploadPhoto("user-1", {
      buffer: Buffer.from("x"),
      contentType: "image/png",
      size: 10,
    });

    expect(url).toBe("https://blob.example/new.jpg");
    expect(storage.remove).toHaveBeenCalledWith("https://blob.example/old.jpg");
    expect(callOrder).toEqual(["repo.updateProfilePhoto", "storage.remove"]);
  });
});

describe("createProfileService.submitProfile", () => {
  it("baca PROFILE_INCOMPLETE kad nedostaje photoUrl", async () => {
    const repo = createFakeRepo({
      getProfileAndPreference: vi
        .fn()
        .mockResolvedValue({ profile: completeProfile({ photoUrl: null }), preference: null }),
    });
    const service = createProfileService({ repo, storage: createFakeStorage(), clock: createFakeClock() });

    await expect(service.submitProfile("user-1")).rejects.toMatchObject({ code: "PROFILE_INCOMPLETE" });
    expect(repo.submitProfile).not.toHaveBeenCalled();
  });

  it("baca PROFILE_INCOMPLETE sa poljem u fields kad profil nije kompletan", async () => {
    const repo = createFakeRepo({
      getProfileAndPreference: vi
        .fn()
        .mockResolvedValue({ profile: completeProfile({ intro: null }), preference: null }),
    });
    const service = createProfileService({ repo, storage: createFakeStorage(), clock: createFakeClock() });

    await expect(service.submitProfile("user-1")).rejects.toMatchObject({
      code: "PROFILE_INCOMPLETE",
      fields: { intro: expect.any(String) },
    });
    expect(repo.submitProfile).not.toHaveBeenCalled();
  });

  it("baca INVALID_STATUS kad repo vrati false za kompletan profil", async () => {
    const repo = createFakeRepo({
      getProfileAndPreference: vi.fn().mockResolvedValue({ profile: completeProfile(), preference: null }),
      submitProfile: vi.fn().mockResolvedValue(false),
    });
    const service = createProfileService({ repo, storage: createFakeStorage(), clock: createFakeClock() });

    await expect(service.submitProfile("user-1")).rejects.toMatchObject({ code: "INVALID_STATUS" });
  });

  it("vraća PENDING_REVIEW kad je profil kompletan i repo uspije", async () => {
    const repo = createFakeRepo({
      getProfileAndPreference: vi.fn().mockResolvedValue({ profile: completeProfile(), preference: null }),
      submitProfile: vi.fn().mockResolvedValue(true),
    });
    const service = createProfileService({ repo, storage: createFakeStorage(), clock: createFakeClock() });

    const status = await service.submitProfile("user-1");

    expect(status).toBe("PENDING_REVIEW");
    expect(repo.submitProfile).toHaveBeenCalledWith("user-1", NOW);
  });
});

describe("createProfileService.updateProfile", () => {
  it("poziva repo.updateProfileDraft sa tačnim argumentima", async () => {
    const repo = createFakeRepo();
    const service = createProfileService({ repo, storage: createFakeStorage(), clock: createFakeClock() });

    await service.updateProfile("user-1", { firstName: "Ana" });

    expect(repo.updateProfileDraft).toHaveBeenCalledWith("user-1", { firstName: "Ana" });
  });

  it("propušta ApiError iz repo-a (PROFILE_LOCKED)", async () => {
    const { ApiError } = await import("@/lib/errors");
    const repo = createFakeRepo({
      updateProfileDraft: vi.fn().mockRejectedValue(new ApiError("PROFILE_LOCKED", "Profil je zaključan.")),
    });
    const service = createProfileService({ repo, storage: createFakeStorage(), clock: createFakeClock() });

    await expect(service.updateProfile("user-1", { firstName: "Ana" })).rejects.toMatchObject({
      code: "PROFILE_LOCKED",
    });
  });
});

describe("createProfileService.updatePreference", () => {
  it("poziva repo.updatePreferenceDraft sa tačnim argumentima", async () => {
    const repo = createFakeRepo();
    const service = createProfileService({ repo, storage: createFakeStorage(), clock: createFakeClock() });

    await service.updatePreference("user-1", { lookingFor: "Tehnički co-founder" });

    expect(repo.updatePreferenceDraft).toHaveBeenCalledWith("user-1", { lookingFor: "Tehnički co-founder" });
  });

  it("propušta ApiError iz repo-a (PROFILE_LOCKED)", async () => {
    const { ApiError } = await import("@/lib/errors");
    const repo = createFakeRepo({
      updatePreferenceDraft: vi.fn().mockRejectedValue(new ApiError("PROFILE_LOCKED", "Profil je zaključan.")),
    });
    const service = createProfileService({ repo, storage: createFakeStorage(), clock: createFakeClock() });

    await expect(service.updatePreference("user-1", { lookingFor: "x" })).rejects.toMatchObject({
      code: "PROFILE_LOCKED",
    });
  });
});
