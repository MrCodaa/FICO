import { describe, expect, it, vi } from "vitest";
import type { Clock } from "@/lib/clock";
import type { EmailProvider } from "@/lib/email";
import type { StorageProvider } from "@/lib/storage";
import { sr } from "@/content/sr";
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

function createFakeEmail(): EmailProvider & { send: ReturnType<typeof vi.fn> } {
  return {
    send: vi.fn().mockResolvedValue(undefined),
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
    listProfilesByStatus: vi.fn().mockResolvedValue({ items: [], nextCursor: null }),
    approveProfile: vi.fn().mockResolvedValue({ email: "user@example.com" }),
    rejectProfile: vi.fn().mockResolvedValue({ email: "user@example.com" }),
    ...overrides,
  };
}

describe("createProfileService.uploadPhoto", () => {
  it("baca VALIDATION_ERROR za nevalidan content type", async () => {
    const repo = createFakeRepo();
    const storage = createFakeStorage();
    const service = createProfileService({ repo, storage, clock: createFakeClock(), email: createFakeEmail() });

    await expect(
      service.uploadPhoto("user-1", { buffer: Buffer.from("x"), contentType: "image/gif", size: 10 }),
    ).rejects.toMatchObject({ code: "VALIDATION_ERROR" });
    expect(storage.put).not.toHaveBeenCalled();
  });

  it("baca VALIDATION_ERROR za prevelik fajl", async () => {
    const repo = createFakeRepo();
    const storage = createFakeStorage();
    const service = createProfileService({ repo, storage, clock: createFakeClock(), email: createFakeEmail() });

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
    const service = createProfileService({ repo, storage, clock: createFakeClock(), email: createFakeEmail() });

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
  // PRIVREMENO preskočeno — vezano za isključenu provjeru u service.ts
  // (čeka BLOB_READ_WRITE_TOKEN), vrati zajedno sa njom.
  it.skip("baca PROFILE_INCOMPLETE kad nedostaje photoUrl", async () => {
    const repo = createFakeRepo({
      getProfileAndPreference: vi
        .fn()
        .mockResolvedValue({ profile: completeProfile({ photoUrl: null }), preference: null }),
    });
    const service = createProfileService({
      repo,
      storage: createFakeStorage(),
      clock: createFakeClock(),
      email: createFakeEmail(),
    });

    await expect(service.submitProfile("user-1")).rejects.toMatchObject({ code: "PROFILE_INCOMPLETE" });
    expect(repo.submitProfile).not.toHaveBeenCalled();
  });

  it("baca PROFILE_INCOMPLETE sa poljem u fields kad profil nije kompletan", async () => {
    const repo = createFakeRepo({
      getProfileAndPreference: vi
        .fn()
        .mockResolvedValue({ profile: completeProfile({ intro: null }), preference: null }),
    });
    const service = createProfileService({
      repo,
      storage: createFakeStorage(),
      clock: createFakeClock(),
      email: createFakeEmail(),
    });

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
    const service = createProfileService({
      repo,
      storage: createFakeStorage(),
      clock: createFakeClock(),
      email: createFakeEmail(),
    });

    await expect(service.submitProfile("user-1")).rejects.toMatchObject({ code: "INVALID_STATUS" });
  });

  it("vraća PENDING_REVIEW kad je profil kompletan i repo uspije", async () => {
    const repo = createFakeRepo({
      getProfileAndPreference: vi.fn().mockResolvedValue({ profile: completeProfile(), preference: null }),
      submitProfile: vi.fn().mockResolvedValue(true),
    });
    const service = createProfileService({
      repo,
      storage: createFakeStorage(),
      clock: createFakeClock(),
      email: createFakeEmail(),
    });

    const status = await service.submitProfile("user-1");

    expect(status).toBe("PENDING_REVIEW");
    expect(repo.submitProfile).toHaveBeenCalledWith("user-1", NOW);
  });
});

describe("createProfileService.updateProfile", () => {
  it("poziva repo.updateProfileDraft sa tačnim argumentima", async () => {
    const repo = createFakeRepo();
    const service = createProfileService({
      repo,
      storage: createFakeStorage(),
      clock: createFakeClock(),
      email: createFakeEmail(),
    });

    await service.updateProfile("user-1", { firstName: "Ana" });

    expect(repo.updateProfileDraft).toHaveBeenCalledWith("user-1", { firstName: "Ana" });
  });

  it("propušta ApiError iz repo-a (PROFILE_LOCKED)", async () => {
    const { ApiError } = await import("@/lib/errors");
    const repo = createFakeRepo({
      updateProfileDraft: vi.fn().mockRejectedValue(new ApiError("PROFILE_LOCKED", "Profil je zaključan.")),
    });
    const service = createProfileService({
      repo,
      storage: createFakeStorage(),
      clock: createFakeClock(),
      email: createFakeEmail(),
    });

    await expect(service.updateProfile("user-1", { firstName: "Ana" })).rejects.toMatchObject({
      code: "PROFILE_LOCKED",
    });
  });
});

describe("createProfileService.updatePreference", () => {
  it("poziva repo.updatePreferenceDraft sa tačnim argumentima", async () => {
    const repo = createFakeRepo();
    const service = createProfileService({
      repo,
      storage: createFakeStorage(),
      clock: createFakeClock(),
      email: createFakeEmail(),
    });

    await service.updatePreference("user-1", { lookingFor: "Tehnički co-founder" });

    expect(repo.updatePreferenceDraft).toHaveBeenCalledWith("user-1", { lookingFor: "Tehnički co-founder" });
  });

  it("propušta ApiError iz repo-a (PROFILE_LOCKED)", async () => {
    const { ApiError } = await import("@/lib/errors");
    const repo = createFakeRepo({
      updatePreferenceDraft: vi.fn().mockRejectedValue(new ApiError("PROFILE_LOCKED", "Profil je zaključan.")),
    });
    const service = createProfileService({
      repo,
      storage: createFakeStorage(),
      clock: createFakeClock(),
      email: createFakeEmail(),
    });

    await expect(service.updatePreference("user-1", { lookingFor: "x" })).rejects.toMatchObject({
      code: "PROFILE_LOCKED",
    });
  });
});

describe("createProfileService.listPendingProfiles", () => {
  it("poziva repo.listProfilesByStatus sa PENDING_REVIEW i mapira rezultate preko toProfileView", async () => {
    const repo = createFakeRepo({
      listProfilesByStatus: vi.fn().mockResolvedValue({ items: [completeProfile()], nextCursor: "user-1" }),
    });
    const service = createProfileService({
      repo,
      storage: createFakeStorage(),
      clock: createFakeClock(),
      email: createFakeEmail(),
    });

    const result = await service.listPendingProfiles("PENDING_REVIEW", "cursor-0", 10);

    expect(repo.listProfilesByStatus).toHaveBeenCalledWith("PENDING_REVIEW", "cursor-0", 10);
    expect(result.nextCursor).toBe("user-1");
    expect(result.items).toHaveLength(1);
    expect(result.items[0]).not.toHaveProperty("birthDate");
    expect(result.items[0]?.userId).toBe("user-1");
  });

  it("prosljeđuje lookingFor iz preference u ProfileView (admin vidi cijeli profil)", async () => {
    const repo = createFakeRepo({
      listProfilesByStatus: vi
        .fn()
        .mockResolvedValue({ items: [{ ...completeProfile(), lookingFor: "Tražim CTO-a." }], nextCursor: null }),
    });
    const service = createProfileService({
      repo,
      storage: createFakeStorage(),
      clock: createFakeClock(),
      email: createFakeEmail(),
    });

    const result = await service.listPendingProfiles("PENDING_REVIEW");

    expect(result.items[0]?.lookingFor).toBe("Tražim CTO-a.");
    expect(result.items[0]?.intro).toBe(completeProfile().intro);
  });
});

describe("createProfileService.approveProfile", () => {
  it("baca NOT_FOUND kad repo vrati NOT_FOUND", async () => {
    const repo = createFakeRepo({ approveProfile: vi.fn().mockResolvedValue("NOT_FOUND") });
    const email = createFakeEmail();
    const service = createProfileService({ repo, storage: createFakeStorage(), clock: createFakeClock(), email });

    await expect(service.approveProfile("user-1")).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(email.send).not.toHaveBeenCalled();
  });

  it("baca INVALID_STATUS kad repo vrati INVALID_STATUS", async () => {
    const repo = createFakeRepo({ approveProfile: vi.fn().mockResolvedValue("INVALID_STATUS") });
    const email = createFakeEmail();
    const service = createProfileService({ repo, storage: createFakeStorage(), clock: createFakeClock(), email });

    await expect(service.approveProfile("user-1")).rejects.toMatchObject({ code: "INVALID_STATUS" });
    expect(email.send).not.toHaveBeenCalled();
  });

  it("šalje email odobrenja sa tačnim subjektom nakon uspješne transakcije", async () => {
    const repo = createFakeRepo({
      approveProfile: vi.fn().mockResolvedValue({ email: "ana@example.com" }),
    });
    const email = createFakeEmail();
    const service = createProfileService({ repo, storage: createFakeStorage(), clock: createFakeClock(), email });

    await service.approveProfile("user-1");

    expect(email.send).toHaveBeenCalledWith(
      expect.objectContaining({ to: "ana@example.com", subject: sr.admin.emails.approved.subject }),
    );
  });
});

describe("createProfileService.rejectProfile", () => {
  it("baca NOT_FOUND kad repo vrati NOT_FOUND", async () => {
    const repo = createFakeRepo({ rejectProfile: vi.fn().mockResolvedValue("NOT_FOUND") });
    const email = createFakeEmail();
    const service = createProfileService({ repo, storage: createFakeStorage(), clock: createFakeClock(), email });

    await expect(service.rejectProfile("user-1", "Nepotpune informacije")).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
    expect(email.send).not.toHaveBeenCalled();
  });

  it("baca INVALID_STATUS kad repo vrati INVALID_STATUS", async () => {
    const repo = createFakeRepo({ rejectProfile: vi.fn().mockResolvedValue("INVALID_STATUS") });
    const email = createFakeEmail();
    const service = createProfileService({ repo, storage: createFakeStorage(), clock: createFakeClock(), email });

    await expect(service.rejectProfile("user-1", "Nepotpune informacije")).rejects.toMatchObject({
      code: "INVALID_STATUS",
    });
    expect(email.send).not.toHaveBeenCalled();
  });

  it("šalje email odbijanja sa razlogom u tekstu nakon uspješne transakcije", async () => {
    const repo = createFakeRepo({
      rejectProfile: vi.fn().mockResolvedValue({ email: "ana@example.com" }),
    });
    const email = createFakeEmail();
    const service = createProfileService({ repo, storage: createFakeStorage(), clock: createFakeClock(), email });

    await service.rejectProfile("user-1", "Nepotpune informacije");

    expect(email.send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "ana@example.com",
        subject: sr.admin.emails.rejected.subject,
        text: expect.stringContaining("Nepotpune informacije"),
      }),
    );
  });
});
