import { describe, expect, it, vi } from "vitest";

import { createDashboardService } from "./service";

function setup(status: "APPROVED" | "PENDING_REVIEW") {
  const discover = { getQueueStats: vi.fn().mockResolvedValue({ queueCount: 12, thinkingCount: 3 }) };
  const notifications = { getCounts: vi.fn().mockResolvedValue({ notifications: 1, requests: 2, messages: 5 }) };
  const repo = {
    getProfileStatus: vi.fn().mockResolvedValue({ status, rejectionReason: null }),
    countMatches: vi.fn().mockResolvedValue(2),
  };
  return { discover, repo, service: createDashboardService({ repo, discover, notifications }) };
}

describe("createDashboardService", () => {
  it("odobren profil dobija brojače reda, sačuvanih, zahtjeva i poruka", async () => {
    const { service } = setup("APPROVED");
    await expect(service.getDashboard("u1")).resolves.toEqual({
      profileStatus: "APPROVED",
      rejectionReason: null,
      queueCount: 12,
      thinkingCount: 3,
      newRequests: 2,
      unreadMessages: 5,
      matchCount: 2,
    });
  });

  it("matchCount prati broj matcheva (0 = bez kartice, >0 = kartica)", async () => {
    const { service, repo } = setup("APPROVED");
    repo.countMatches.mockResolvedValue(0);
    await expect(service.getDashboard("u1")).resolves.toMatchObject({ matchCount: 0 });
    repo.countMatches.mockResolvedValue(3);
    await expect(service.getDashboard("u1")).resolves.toMatchObject({ matchCount: 3 });
  });

  it("neodobren profil ne računa red kandidata", async () => {
    const { service, discover } = setup("PENDING_REVIEW");
    await expect(service.getDashboard("u1")).resolves.toMatchObject({ profileStatus: "PENDING_REVIEW", queueCount: 0 });
    expect(discover.getQueueStats).not.toHaveBeenCalled();
  });
});
