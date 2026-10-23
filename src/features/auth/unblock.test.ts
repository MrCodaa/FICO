import { describe, expect, it, vi } from "vitest";

import { createAuthService } from "./service";
import type { AuthRepository } from "./repository";

function setup(blockedAt: Date | null) {
  const repo = {
    findMeById: vi.fn().mockResolvedValue({
      id: "u1",
      email: "ana@example.com",
      emailVerifiedAt: null,
      agreementAcceptedAt: null,
      profileStatus: "DRAFT",
      emailBlockedAt: blockedAt,
    }),
    clearEmailBlock: vi.fn().mockResolvedValue(undefined),
    createAuthToken: vi.fn().mockResolvedValue(undefined),
  } as unknown as AuthRepository;
  const email = { send: vi.fn().mockResolvedValue(undefined) };
  const service = createAuthService({
    repo,
    email,
    clock: { now: () => new Date("2026-10-23T12:00:00Z") },
  } as never);
  return { repo, email, service };
}

describe("createAuthService.unblockEmail", () => {
  it("skida blokadu pa šalje novi mejl za potvrdu", async () => {
    const { repo, email, service } = setup(new Date("2026-10-22T00:00:00Z"));
    const order: string[] = [];
    (repo.clearEmailBlock as ReturnType<typeof vi.fn>).mockImplementation(async () => void order.push("clear"));
    email.send.mockImplementation(async () => void order.push("send"));

    await service.unblockEmail("u1");

    expect(repo.clearEmailBlock).toHaveBeenCalledWith("u1");
    expect(email.send).toHaveBeenCalledWith(expect.objectContaining({ to: "ana@example.com" }));
    expect(order).toEqual(["clear", "send"]);
  });

  it("ne radi ništa ako adresa nije blokirana", async () => {
    const { repo, email, service } = setup(null);
    await service.unblockEmail("u1");
    expect(repo.clearEmailBlock).not.toHaveBeenCalled();
    expect(email.send).not.toHaveBeenCalled();
  });
});

describe("toMe", () => {
  it("emailBlocked prati emailBlockedAt", async () => {
    const { service } = setup(new Date());
    await expect(service.me("u1")).resolves.toMatchObject({ emailBlocked: true });
  });
});
