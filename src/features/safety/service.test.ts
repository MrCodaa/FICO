import { describe, expect, it, vi } from "vitest";
import type { Clock } from "@/lib/clock";
import { createSafetyService } from "./service";
import type { SafetyRepository } from "./repository";
import type { EmailService } from "@/lib/email";

const NOW = new Date("2026-01-01T00:00:00Z");

function createFakeClock(now: Date = NOW): Clock {
  return { now: () => now };
}

function createFakeEmail(): EmailService {
  return { send: vi.fn().mockResolvedValue(undefined) };
}

function createFakeRepo(overrides: Partial<SafetyRepository> = {}): SafetyRepository {
  return {
    createBlock: vi.fn().mockResolvedValue(undefined),
    deleteBlock: vi.fn().mockResolvedValue(undefined),
    createReport: vi.fn().mockResolvedValue({ id: "report-1" }),
    listReports: vi.fn().mockResolvedValue({ items: [], nextCursor: null }),
    countOpenReports: vi.fn().mockResolvedValue(3),
    resolveReport: vi.fn().mockResolvedValue({ reportedId: "reported-1" }),
    deactivateUser: vi.fn().mockResolvedValue({ email: "reported@example.com" }),
    ...overrides,
  };
}

describe("createSafetyService.blockUser", () => {
  it("poziva repo.createBlock sa blokerId, blockedId i trenutnim vremenom", async () => {
    const repo = createFakeRepo();
    const service = createSafetyService({ repo, clock: createFakeClock(), email: createFakeEmail() });

    await service.blockUser("blocker-1", "blocked-1");

    expect(repo.createBlock).toHaveBeenCalledWith("blocker-1", "blocked-1", NOW);
  });
});

describe("createSafetyService.unblockUser", () => {
  it("poziva repo.deleteBlock sa tačnim argumentima", async () => {
    const repo = createFakeRepo();
    const service = createSafetyService({ repo, clock: createFakeClock(), email: createFakeEmail() });

    await service.unblockUser("blocker-1", "blocked-1");

    expect(repo.deleteBlock).toHaveBeenCalledWith("blocker-1", "blocked-1");
  });
});

describe("createSafetyService.createReport", () => {
  it("prosljeđuje input repo-u zajedno sa trenutnim vremenom", async () => {
    const repo = createFakeRepo();
    const service = createSafetyService({ repo, clock: createFakeClock(), email: createFakeEmail() });
    const input = { reportedId: "reported-1", reason: "SPAM" as const, details: "opis" };

    const result = await service.createReport("reporter-1", input);

    expect(repo.createReport).toHaveBeenCalledWith("reporter-1", input, NOW);
    expect(result).toEqual({ id: "report-1" });
  });
});

describe("createSafetyService.listReports", () => {
  it("prosljeđuje status/cursor/limit i mapira stavke preko mapper-a", async () => {
    const repo = createFakeRepo({
      listReports: vi.fn().mockResolvedValue({
        items: [
          {
            id: "report-1",
            reporterId: "reporter-1",
            reportedId: "reported-1",
            reportedProfile: null,
            reportedPreference: null,
            reportedEmail: "reported@example.com",
            reportedDeactivated: false,
            reporterEmail: "reporter@example.com",
            reporterName: "Ana Anić",
            previousReports: 2,
            reason: "SPAM",
            details: null,
            status: "OPEN",
            createdAt: NOW,
          },
        ],
        nextCursor: "report-1",
      }),
    });
    const service = createSafetyService({ repo, clock: createFakeClock(), email: createFakeEmail() });

    const result = await service.listReports("OPEN", "cursor-1", 10);

    expect(repo.listReports).toHaveBeenCalledWith("OPEN", "cursor-1", 10);
    expect(result).toEqual({
      items: [
        {
          id: "report-1",
          reportedId: "reported-1",
          reportedProfile: null,
          reportedAdminProfile: null,
          reportedEmail: "reported@example.com",
          reportedDeactivated: false,
          reporter: { id: "reporter-1", name: "Ana Anić", email: "reporter@example.com" },
          previousReports: 2,
          reason: "SPAM",
          details: null,
          status: "OPEN",
          createdAt: NOW,
        },
      ],
      nextCursor: "report-1",
    });
  });
});

describe("createSafetyService.countOpenReports", () => {
  it("vraća broj otvorenih prijava", async () => {
    const service = createSafetyService({ repo: createFakeRepo(), clock: createFakeClock(), email: createFakeEmail() });

    await expect(service.countOpenReports()).resolves.toEqual({ open: 3 });
  });
});

describe("createSafetyService.resolveReport", () => {
  it("baca ApiError NOT_FOUND kad repo vrati null", async () => {
    const repo = createFakeRepo({ resolveReport: vi.fn().mockResolvedValue(null) });
    const service = createSafetyService({ repo, clock: createFakeClock(), email: createFakeEmail() });

    await expect(service.resolveReport("report-1", "RESOLVED")).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(repo.deactivateUser).not.toHaveBeenCalled();
  });

  it("ne poziva deactivateUser kad deactivateUser nije traženo", async () => {
    const repo = createFakeRepo({ resolveReport: vi.fn().mockResolvedValue({ reportedId: "reported-1" }) });
    const service = createSafetyService({ repo, clock: createFakeClock(), email: createFakeEmail() });

    await service.resolveReport("report-1", "RESOLVED");

    expect(repo.deactivateUser).not.toHaveBeenCalled();
  });

  it("poziva repo.deactivateUser sa reportedId kad je deactivateUser: true", async () => {
    const repo = createFakeRepo({ resolveReport: vi.fn().mockResolvedValue({ reportedId: "reported-1" }) });
    const service = createSafetyService({ repo, clock: createFakeClock(), email: createFakeEmail() });

    await service.resolveReport("report-1", "RESOLVED", true);

    expect(repo.deactivateUser).toHaveBeenCalledWith("reported-1", NOW);
  });
});

describe("createSafetyService.deactivateUser", () => {
  it("poziva repo.deactivateUser sa userId i trenutnim vremenom", async () => {
    const repo = createFakeRepo();
    const service = createSafetyService({ repo, clock: createFakeClock(), email: createFakeEmail() });

    await service.deactivateUser("user-1");

    expect(repo.deactivateUser).toHaveBeenCalledWith("user-1", NOW);
  });
});

describe("createSafetyService: mejl o deaktivaciji", () => {
  it("šalje neutralan mejl pri admin deaktivaciji", async () => {
    const repo = createFakeRepo();
    const email = createFakeEmail();
    const service = createSafetyService({ repo, clock: createFakeClock(), email });

    await service.deactivateUser("user-1");

    expect(email.send).toHaveBeenCalledTimes(1);
    const msg = vi.mocked(email.send).mock.calls[0]![0];
    expect(msg.to).toBe("reported@example.com");
    expect(msg.subject).toBe("Tvoj FICO nalog je deaktiviran");
    expect(msg.text).toContain("/pomoc");
    expect(vi.mocked(email.send).mock.calls[0]![1]).toBeUndefined();
  });

  it("šalje mejl i kad se deaktivira preko rješavanja prijave", async () => {
    const email = createFakeEmail();
    const service = createSafetyService({ repo: createFakeRepo(), clock: createFakeClock(), email });

    await service.resolveReport("report-1", "RESOLVED", true);

    expect(email.send).toHaveBeenCalledTimes(1);
  });

  it("ne šalje mejl kad je nalog već bio deaktiviran", async () => {
    const repo = createFakeRepo({ deactivateUser: vi.fn().mockResolvedValue(null) });
    const email = createFakeEmail();
    const service = createSafetyService({ repo, clock: createFakeClock(), email });

    await service.deactivateUser("user-1");
    await service.deactivateUser("user-1");

    expect(email.send).not.toHaveBeenCalled();
  });

  it("ne šalje mejl kad prijava nije praćena deaktivacijom", async () => {
    const email = createFakeEmail();
    const service = createSafetyService({ repo: createFakeRepo(), clock: createFakeClock(), email });

    await service.resolveReport("report-1", "DISMISSED");
    await service.resolveReport("report-1", "RESOLVED");

    expect(email.send).not.toHaveBeenCalled();
  });

  it("ne ruši tok kad slanje pukne", async () => {
    const repo = createFakeRepo();
    const email: EmailService = { send: vi.fn().mockRejectedValue(new Error("smtp down")) };
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const service = createSafetyService({ repo, clock: createFakeClock(), email });

    await expect(service.deactivateUser("user-1")).resolves.toBeUndefined();
    expect(repo.deactivateUser).toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});
