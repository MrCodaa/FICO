import { beforeEach, describe, expect, it, vi } from "vitest";

const tx = {
  report: { create: vi.fn() },
  request: { findFirst: vi.fn() },
  decision: { upsert: vi.fn() },
};

vi.mock("@/lib/db", () => ({
  db: { $transaction: vi.fn(async (fn: (t: typeof tx) => unknown) => fn(tx)) },
}));

import { safetyRepository } from "./repository";

const NOW = new Date("2026-01-01T00:00:00Z");
const input = { reportedId: "b", reason: "SPAM" as const };

describe("safetyRepository.createReport", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    tx.report.create.mockResolvedValue({ id: "r1" });
  });

  it("upisuje prijavu i Decision NOT_INTERESTED za prijavljivača", async () => {
    tx.request.findFirst.mockResolvedValue(null);

    const result = await safetyRepository.createReport("a", input, NOW);

    expect(result).toEqual({ id: "r1" });
    expect(tx.decision.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId_targetId: { userId: "a", targetId: "b" } },
        create: { userId: "a", targetId: "b", type: "NOT_INTERESTED" },
      }),
    );
  });

  it("ne upisuje odluku kad između njih već postoji zahtjev", async () => {
    tx.request.findFirst.mockResolvedValue({ id: "req" });

    await safetyRepository.createReport("a", input, NOW);

    expect(tx.decision.upsert).not.toHaveBeenCalled();
  });
});
