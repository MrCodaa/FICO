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

const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0]);

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
    hideAge: false,
    ideaStatus: "EXPLORING",
    ideas: "Platforma za co-foundere na Balkanu.",
    hasCofounder: null,
    timing: "WITHIN_YEAR",
    areas: ["ENGINEERING"],
    interests: ["AI_ML"],
    equityExpectations: "50/50",
    freeTime: null,
    lifePath: "Odrasla u Sarajevu, studirala ETF.",
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
    getFileUrls: vi.fn().mockResolvedValue([]),
    consumeUploadSlot: vi.fn().mockResolvedValue(true),
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
      service.uploadPhoto("user-1", { buffer: Buffer.from("GIF89a-nije-slika"), contentType: "image/png", size: 10 }),
    ).rejects.toMatchObject({ code: "VALIDATION_ERROR" });
    expect(storage.put).not.toHaveBeenCalled();
  });

  it.each([
    ["SVG", "<svg xmlns=\"http://www.w3.org/2000/svg\"><script>alert(1)</script></svg>"],
    ["HTML preimenovan u .jpg", "<html><script>alert(1)</script></html>"],
    ["GIF", "GIF89a-x"],
    ["PDF", "%PDF-1.4"],
  ])("odbija %s čak i sa lažnim image/jpeg Content-Type", async (_n, content) => {
    const repo = createFakeRepo();
    const storage = createFakeStorage();
    const service = createProfileService({ repo, storage, clock: createFakeClock(), email: createFakeEmail() });
    await expect(
      service.uploadPhoto("user-1", { buffer: Buffer.from(content), contentType: "image/jpeg", size: content.length }),
    ).rejects.toMatchObject({ code: "VALIDATION_ERROR" });
    expect(storage.put).not.toHaveBeenCalled();
  });

  it("baca VALIDATION_ERROR za prevelik fajl", async () => {
    const repo = createFakeRepo();
    const storage = createFakeStorage();
    const service = createProfileService({ repo, storage, clock: createFakeClock(), email: createFakeEmail() });

    await expect(
      service.uploadPhoto("user-1", {
        buffer: PNG,
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
      buffer: PNG,
      contentType: "image/png",
      size: 10,
    });

    expect(url).toBe("https://blob.example/new.jpg");
    expect(storage.remove).toHaveBeenCalledWith("https://blob.example/old.jpg");
    expect(callOrder).toEqual(["repo.updateProfilePhoto", "storage.remove"]);
  });
});

describe("createProfileService.uploadPhoto zaštite", () => {
  const deps = (repo: ProfileRepository, storage: StorageProvider) => ({
    repo,
    storage,
    clock: createFakeClock(),
    email: createFakeEmail(),
  });

  it("ime fajla je nasumično i ne sadrži userId", async () => {
    const storage = createFakeStorage();
    const service = createProfileService(deps(createFakeRepo(), storage));
    await service.uploadPhoto("user-tajni-id", { buffer: PNG, contentType: "image/png", size: 10 });
    const key: string = storage.put.mock.calls[0]![0].key;
    expect(key).not.toContain("user-tajni-id");
    expect(key).toMatch(/^profiles\/[0-9a-f-]{36}\.png$/);
  });

  it("odbija upload kad je potrošen limit na sat", async () => {
    const storage = createFakeStorage();
    const repo = createFakeRepo({ consumeUploadSlot: vi.fn().mockResolvedValue(false) });
    const service = createProfileService(deps(repo, storage));
    await expect(
      service.uploadPhoto("user-1", { buffer: PNG, contentType: "image/png", size: 10 }),
    ).rejects.toMatchObject({ code: "TOO_MANY_REQUESTS" });
    expect(storage.put).not.toHaveBeenCalled();
  });

  it("neispravan fajl ne troši limit", async () => {
    const repo = createFakeRepo();
    const service = createProfileService(deps(repo, createFakeStorage()));
    await expect(
      service.uploadPhoto("user-1", { buffer: Buffer.from("<svg/>"), contentType: "image/png", size: 6 }),
    ).rejects.toMatchObject({ code: "VALIDATION_ERROR" });
    expect(repo.consumeUploadSlot).not.toHaveBeenCalled();
  });
});

describe("createProfileService.submitProfile", () => {
  it("baca PROFILE_INCOMPLETE kad nedostaje photoUrl", async () => {
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

  it("traži životni put, udio, ideju (kad je ima) i idealnog co-foundera", async () => {
    const repo = createFakeRepo({
      getProfileAndPreference: vi.fn().mockResolvedValue({
        profile: completeProfile({ ideaStatus: "COMMITTED", ideas: null, lifePath: " ", equityExpectations: null }),
        preference: null,
      }),
    });
    const service = createProfileService({
      repo,
      storage: createFakeStorage(),
      clock: createFakeClock(),
      email: createFakeEmail(),
    });

    await expect(service.submitProfile("user-1")).rejects.toMatchObject({
      code: "PROFILE_INCOMPLETE",
      fields: {
        ideas: expect.any(String),
        lifePath: expect.any(String),
        equityExpectations: expect.any(String),
        lookingFor: expect.any(String),
      },
    });
  });

  it("ne traži opis ideje kad je korisnik otvoren za ideje", async () => {
    const repo = createFakeRepo({
      getProfileAndPreference: vi.fn().mockResolvedValue({
        profile: completeProfile({ ideaStatus: "OPEN", ideas: null }),
        preference: createFakePreference({ lookingFor: "Tehnički co-founder" }),
      }),
      submitProfile: vi.fn().mockResolvedValue(true),
    });
    const service = createProfileService({
      repo,
      storage: createFakeStorage(),
      clock: createFakeClock(),
      email: createFakeEmail(),
    });

    await expect(service.submitProfile("user-1")).resolves.toBe("PENDING_REVIEW");
  });

  it("baca INVALID_STATUS kad repo vrati false za kompletan profil", async () => {
    const repo = createFakeRepo({
      getProfileAndPreference: vi.fn().mockResolvedValue({
        profile: completeProfile(),
        preference: createFakePreference({ lookingFor: "Tehnički co-founder" }),
      }),
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
      getProfileAndPreference: vi.fn().mockResolvedValue({
        profile: completeProfile(),
        preference: createFakePreference({ lookingFor: "Tehnički co-founder" }),
      }),
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

  it("prosljeđuje preference u ProfileView (admin vidi cijeli profil)", async () => {
    const preference = createFakePreference({ lookingFor: "Tražim CTO-a.", technical: "TECHNICAL" });
    const repo = createFakeRepo({
      listProfilesByStatus: vi
        .fn()
        .mockResolvedValue({ items: [{ ...completeProfile(), preference }], nextCursor: null }),
    });
    const service = createProfileService({
      repo,
      storage: createFakeStorage(),
      clock: createFakeClock(),
      email: createFakeEmail(),
    });

    const result = await service.listPendingProfiles("PENDING_REVIEW");

    expect(result.items[0]?.lookingFor).toBe("Tražim CTO-a.");
    expect(result.items[0]?.preference?.technical).toBe("TECHNICAL");
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

describe("admin prijava: email, razlog i mailovi poslije commita", () => {
  const make = (repoOverrides = {}) => {
    const email = createFakeEmail();
    const repo = createFakeRepo(repoOverrides);
    const service = createProfileService({ repo, storage: createFakeStorage(), clock: createFakeClock(), email });
    return { email, repo, service };
  };

  it("lista vraća email naloga i hideAge, a godine otkriva adminu", async () => {
    const { service } = make({
      listProfilesByStatus: vi.fn().mockResolvedValue({
        items: [{ ...completeProfile(), hideAge: true, birthDate: new Date("1990-01-01"), email: "ana@example.com" }],
        nextCursor: null,
      }),
    });
    const result = await service.listPendingProfiles("PENDING_REVIEW");
    expect(result.items[0]).toMatchObject({ email: "ana@example.com", hideAge: true });
    expect(result.items[0]?.age).not.toBeNull();
    expect(result.items[0]).not.toHaveProperty("birthDate");
  });

  it("odbijanje sa razlogom dužim od 1000 znakova ne dira bazu ni mail", async () => {
    const { email, repo, service } = make();
    await expect(service.rejectProfile("user-1", "x".repeat(1001))).rejects.toMatchObject({ code: "VALIDATION_ERROR" });
    expect(repo.rejectProfile).not.toHaveBeenCalled();
    expect(email.send).not.toHaveBeenCalled();
  });

  it("odbijanje bez razloga (undefined, prazan ili razmaci) upisuje null, a mail nema dio o razlogu", async () => {
    for (const reason of [undefined, "", "   "]) {
      const { email, repo, service } = make({ rejectProfile: vi.fn().mockResolvedValue({ email: "ana@example.com" }) });
      await service.rejectProfile("user-1", reason);
      expect(repo.rejectProfile).toHaveBeenCalledWith("user-1", null, expect.any(Date));
      const sent = email.send.mock.calls[0]![0] as { text: string };
      expect(sent.text).toContain("Tvoj profil nije odobren.");
      expect(sent.text).not.toContain("razloga");
      expect(sent.text).toContain("/app/profile");
    }
  });

  it("odbijanje upisuje trimovan razlog, pa šalje mail sa razlogom i linkom na ispravku", async () => {
    const order: string[] = [];
    const { email, repo, service } = make({
      rejectProfile: vi.fn().mockImplementation(async () => {
        order.push("repo");
        return { email: "ana@example.com" };
      }),
    });
    email.send.mockImplementation(async () => void order.push("mail"));
    await service.rejectProfile("user-1", "  Dodaj LinkedIn.  ");
    expect(repo.rejectProfile).toHaveBeenCalledWith("user-1", "Dodaj LinkedIn.", expect.any(Date));
    expect(order).toEqual(["repo", "mail"]);
    const sent = email.send.mock.calls[0]![0] as { text: string };
    expect(sent.text).toContain("Dodaj LinkedIn.");
    expect(sent.text).toContain("/app/profile");
  });

  it("odobravanje šalje mail sa linkom na aplikaciju", async () => {
    const { email, service } = make({ approveProfile: vi.fn().mockResolvedValue({ email: "ana@example.com" }) });
    await service.approveProfile("user-1");
    expect((email.send.mock.calls[0]![0] as { text: string }).text).toContain("/app");
  });

  it("dupli klik: druga obrada dobija INVALID_STATUS (409) i ne šalje drugi mail", async () => {
    const { email, service } = make({
      approveProfile: vi.fn().mockResolvedValueOnce({ email: "ana@example.com" }).mockResolvedValueOnce("INVALID_STATUS"),
    });
    await service.approveProfile("user-1");
    await expect(service.approveProfile("user-1")).rejects.toMatchObject({ code: "INVALID_STATUS" });
    expect(email.send).toHaveBeenCalledTimes(1);
  });

  it("greška providera ne obara odobravanje koje je već upisano", async () => {
    const { email, service } = make({ approveProfile: vi.fn().mockResolvedValue({ email: "ana@example.com" }) });
    email.send.mockRejectedValue(new Error("resend down"));
    vi.spyOn(console, "error").mockImplementation(() => {});
    await expect(service.approveProfile("user-1")).resolves.toBeUndefined();
  });
});
