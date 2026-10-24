import { beforeEach, describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";

const findUnique = vi.fn();
const getSessionPayload = vi.fn();

vi.mock("@/lib/db", () => ({ db: { user: { findUnique } } }));
const getAdminPayload = vi.fn();
vi.mock("@/lib/auth/session", () => ({ getSessionPayload, getAdminPayload }));

const { guards } = await import("./guards");

const req = {} as NextRequest;
const NOW = new Date("2026-01-01T00:00:00Z");

function userRow(overrides: Record<string, unknown> = {}) {
  return {
    email: "a@b.com",
    tokenVersion: 0,
    deactivatedAt: null,
    emailVerifiedAt: NOW,
    agreementAcceptedAt: NOW,
    profile: { status: "APPROVED" },
    ...overrides,
  };
}

beforeEach(() => {
  findUnique.mockReset();
  getSessionPayload.mockReset();
  getSessionPayload.mockResolvedValue({ sub: "user-1", tv: 0 });
  findUnique.mockResolvedValue(userRow());
});

describe("guards", () => {
  it("auth: bez sesije je UNAUTHENTICATED, a sa zastarjelim tokenVersion takođe", async () => {
    getSessionPayload.mockResolvedValue(null);
    await expect(guards.auth(req)).rejects.toMatchObject({ code: "UNAUTHENTICATED" });

    getSessionPayload.mockResolvedValue({ sub: "user-1", tv: 0 });
    findUnique.mockResolvedValue(userRow({ tokenVersion: 1 }));
    await expect(guards.auth(req)).rejects.toMatchObject({ code: "UNAUTHENTICATED" });
  });

  it("auth: deaktiviran nalog ne prolazi", async () => {
    findUnique.mockResolvedValue(userRow({ deactivatedAt: NOW }));
    await expect(guards.auth(req)).rejects.toMatchObject({ code: "UNAUTHENTICATED" });
  });

  it("verified/onboarded/approved: nepotvrđen email je EMAIL_NOT_VERIFIED", async () => {
    findUnique.mockResolvedValue(userRow({ emailVerifiedAt: null }));
    for (const name of ["verified", "onboarded", "approved"] as const) {
      await expect(guards[name](req), name).rejects.toMatchObject({ code: "EMAIL_NOT_VERIFIED" });
    }
  });

  it("onboarded/approved: bez prihvaćenih pravila je AGREEMENT_REQUIRED", async () => {
    findUnique.mockResolvedValue(userRow({ agreementAcceptedAt: null }));
    await expect(guards.verified(req)).resolves.toEqual({ userId: "user-1" });
    for (const name of ["onboarded", "approved"] as const) {
      await expect(guards[name](req), name).rejects.toMatchObject({ code: "AGREEMENT_REQUIRED" });
    }
  });

  it("approved: profil koji nije APPROVED je PROFILE_NOT_APPROVED, ali onboarded prolazi", async () => {
    for (const status of ["DRAFT", "PENDING_REVIEW", "REJECTED"]) {
      findUnique.mockResolvedValue(userRow({ profile: { status } }));
      await expect(guards.approved(req), status).rejects.toMatchObject({ code: "PROFILE_NOT_APPROVED" });
      await expect(guards.onboarded(req), status).resolves.toEqual({ userId: "user-1" });
    }
  });

  it("approved: odobren profil prolazi", async () => {
    await expect(guards.approved(req)).resolves.toEqual({ userId: "user-1" });
  });
});

describe("guards.admin", () => {
  it("čita samo admin sesiju, ne korisničku", async () => {
    const getAdminPayload = (await import("@/lib/auth/session")).getAdminPayload as unknown as ReturnType<typeof vi.fn>;
    getAdminPayload.mockResolvedValue(null);
    getSessionPayload.mockResolvedValue({ sub: "user-1", tv: 0 });
    process.env.ADMIN_EMAILS = "a@b.com";
    await expect(guards.admin(req)).rejects.toMatchObject({ code: "UNAUTHENTICATED" });

    getAdminPayload.mockResolvedValue({ sub: "user-1", tv: 0 });
    await expect(guards.admin(req)).resolves.toEqual({ userId: "user-1" });
  });
});
