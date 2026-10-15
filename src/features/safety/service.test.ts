import { describe, expect, it, vi } from "vitest";
import type { Clock } from "@/lib/clock";
import { createSafetyService } from "./service";
import type { SafetyRepository } from "./repository";

const NOW = new Date("2026-01-01T00:00:00Z");

function createFakeClock(now: Date = NOW): Clock {
  return { now: () => now };
}

function createFakeRepo(overrides: Partial<SafetyRepository> = {}): SafetyRepository {
  return {
    createBlock: vi.fn().mockResolvedValue(undefined),
    deleteBlock: vi.fn().mockResolvedValue(undefined),
    createReport: vi.fn().mockResolvedValue({ id: "report-1" }),
    listReports: vi.fn().mockResolvedValue({ items: [], nextCursor: null }),
    resolveReport: vi.fn().mockResolvedValue({ reportedId: "reported-1" }),
    deactivateUser: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe("createSafetyService.blockUser", () => {
  it("poziva repo.createBlock sa blokerId, blockedId i trenutnim vremenom", async () => {
    const repo = createFakeRepo();
    const service = createSafetyService({ repo, clock: createFakeClock() });

    await service.blockUser("blocker-1", "blocked-1");

    expect(repo.createBlock).toHaveBeenCalledWith("blocker-1", "blocked-1", NOW);
  });
});

describe("createSafetyService.unblockUser", () => {
  it("poziva repo.deleteBlock sa tačnim argumentima", async () => {
    const repo = createFakeRepo();
    const service = createSafetyService({ repo, clock: createFakeClock() });

    await service.unblockUser("blocker-1", "blocked-1");

    expect(repo.deleteBlock).toHaveBeenCalledWith("blocker-1", "blocked-1");
  });
});

describe("createSafetyService.createReport", () => {
  it("prosljeđuje input repo-u zajedno sa trenutnim vremenom", async () => {
    const repo = createFakeRepo();
    const service = createSafetyService({ repo, clock: createFakeClock() });
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
            reason: "SPAM",
            details: null,
            status: "OPEN",
            createdAt: NOW,
          },
        ],
        nextCursor: "report-1",
      }),
    });
    const service = createSafetyService({ repo, clock: createFakeClock() });

    const result = await service.listReports("OPEN", "cursor-1", 10);

    expect(repo.listReports).toHaveBeenCalledWith("OPEN", "cursor-1", 10);
    expect(result).toEqual({
      items: [
        {
          id: "report-1",
          reportedId: "reported-1",
          reportedProfile: null,
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

describe("createSafetyService.resolveReport", () => {
  it("baca ApiError NOT_FOUND kad repo vrati null", async () => {
    const repo = createFakeRepo({ resolveReport: vi.fn().mockResolvedValue(null) });
    const service = createSafetyService({ repo, clock: createFakeClock() });

    await expect(service.resolveReport("report-1", "RESOLVED")).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(repo.deactivateUser).not.toHaveBeenCalled();
  });

  it("ne poziva deactivateUser kad deactivateUser nije traženo", async () => {
    const repo = createFakeRepo({ resolveReport: vi.fn().mockResolvedValue({ reportedId: "reported-1" }) });
    const service = createSafetyService({ repo, clock: createFakeClock() });

    await service.resolveReport("report-1", "RESOLVED");

    expect(repo.deactivateUser).not.toHaveBeenCalled();
  });

  it("poziva repo.deactivateUser sa reportedId kad je deactivateUser: true", async () => {
    const repo = createFakeRepo({ resolveReport: vi.fn().mockResolvedValue({ reportedId: "reported-1" }) });
    const service = createSafetyService({ repo, clock: createFakeClock() });

    await service.resolveReport("report-1", "RESOLVED", true);

    expect(repo.deactivateUser).toHaveBeenCalledWith("reported-1", NOW);
  });
});

describe("createSafetyService.deactivateUser", () => {
  it("poziva repo.deactivateUser sa userId i trenutnim vremenom", async () => {
    const repo = createFakeRepo();
    const service = createSafetyService({ repo, clock: createFakeClock() });

    await service.deactivateUser("user-1");

    expect(repo.deactivateUser).toHaveBeenCalledWith("user-1", NOW);
  });
});
