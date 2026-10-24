import { SignJWT } from "jose";
import { describe, expect, it, vi } from "vitest";
import { ADMIN_TTL_SECONDS, signAdminToken, signSessionToken, verifyAdminToken, verifySessionToken } from "./jwt";

process.env.JWT_SECRET ??= "test-secret-for-vitest";

const payload = { sub: "u1", tv: 2 };

describe("jwt tipovi tokena", () => {
  it("korisnički token važi samo kao korisnički", async () => {
    const token = await signSessionToken(payload);
    expect(await verifySessionToken(token)).toEqual(payload);
    expect(await verifyAdminToken(token)).toBeNull();
  });

  it("admin token važi samo kao admin", async () => {
    const token = await signAdminToken(payload);
    expect(await verifyAdminToken(token)).toEqual(payload);
    expect(await verifySessionToken(token)).toBeNull();
  });

  it("token bez typ claim-a ne važi ni kao jedan", async () => {
    const token = await new SignJWT({ sub: "u1", tv: 0 })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("1h")
      .sign(new TextEncoder().encode(process.env.JWT_SECRET));
    expect(await verifyAdminToken(token)).toBeNull();
    expect(await verifySessionToken(token)).toBeNull();
  });

  it("admin token ističe poslije 2 sata", async () => {
    expect(ADMIN_TTL_SECONDS).toBe(7200);
    vi.useFakeTimers();
    try {
      vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
      const token = await signAdminToken(payload);
      vi.setSystemTime(new Date("2026-01-01T01:59:00Z"));
      expect(await verifyAdminToken(token)).toEqual(payload);
      vi.setSystemTime(new Date("2026-01-01T02:00:05Z"));
      expect(await verifyAdminToken(token)).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });
});
