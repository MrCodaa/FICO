import { beforeEach, describe, expect, it, vi } from "vitest";

const findUnique = vi.fn();
vi.mock("@/lib/db", () => ({ db: { user: { findUnique } } }));

const { checkAdminSession } = await import("./adminAccess");

const payload = { sub: "u1", tv: 0 };

beforeEach(() => {
  findUnique.mockReset();
  process.env.ADMIN_EMAILS = "Admin@fico.ba, drugi@fico.ba";
  findUnique.mockResolvedValue({ email: "admin@fico.ba", tokenVersion: 0, deactivatedAt: null });
});

describe("checkAdminSession", () => {
  it("admin email prolazi", async () => {
    expect(await checkAdminSession(payload)).toEqual({ status: "ok", userId: "u1", email: "admin@fico.ba" });
  });

  it("ne-admin je forbidden", async () => {
    findUnique.mockResolvedValue({ email: "user@x.com", tokenVersion: 0, deactivatedAt: null });
    expect(await checkAdminSession(payload)).toEqual({ status: "forbidden" });
  });

  it("bez sesije je no-session i ne gleda bazu", async () => {
    expect(await checkAdminSession(null)).toEqual({ status: "no-session" });
    expect(findUnique).not.toHaveBeenCalled();
  });

  it("deaktiviran admin je no-session", async () => {
    findUnique.mockResolvedValue({ email: "admin@fico.ba", tokenVersion: 0, deactivatedAt: new Date() });
    expect(await checkAdminSession(payload)).toEqual({ status: "no-session" });
  });

  it("pogrešan tokenVersion je no-session", async () => {
    findUnique.mockResolvedValue({ email: "admin@fico.ba", tokenVersion: 1, deactivatedAt: null });
    expect(await checkAdminSession(payload)).toEqual({ status: "no-session" });
  });

  it("nepostojeći korisnik je no-session", async () => {
    findUnique.mockResolvedValue(null);
    expect(await checkAdminSession(payload)).toEqual({ status: "no-session" });
  });
});
