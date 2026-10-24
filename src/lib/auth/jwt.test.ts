import { SignJWT } from "jose";
import { describe, expect, it, vi } from "vitest";
import { ADMIN_IDLE_SECONDS, ADMIN_TTL_SECONDS, refreshAdminToken, signAdminToken, signSessionToken, verifyAdminToken, verifySessionToken } from "./jwt";

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

  it("admin token ističe poslije 2 sata, uz osvježavanje aktivnosti", async () => {
    expect(ADMIN_TTL_SECONDS).toBe(7200);
    vi.useFakeTimers();
    try {
      vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
      let token = await signAdminToken(payload);
      // Admin radi stalno: svakih 10 minuta proxy osvježi token.
      for (let minute = 10; minute <= 110; minute += 10) {
        vi.setSystemTime(new Date(Date.UTC(2026, 0, 1, 0, minute)));
        expect(await verifyAdminToken(token)).toEqual(payload);
        token = (await refreshAdminToken(token))!;
        expect(token).not.toBeNull();
      }
      vi.setSystemTime(new Date("2026-01-01T02:00:05Z"));
      expect(await verifyAdminToken(token)).toBeNull(); // apsolutni rok se ne produžava
    } finally {
      vi.useRealTimers();
    }
  });

  it("admin token se gasi nakon 15 minuta neaktivnosti", async () => {
    expect(ADMIN_IDLE_SECONDS).toBe(900);
    vi.useFakeTimers();
    try {
      vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
      const token = await signAdminToken(payload);
      vi.setSystemTime(new Date("2026-01-01T00:14:00Z"));
      expect(await verifyAdminToken(token)).toEqual(payload);
      vi.setSystemTime(new Date("2026-01-01T00:16:00Z"));
      expect(await verifyAdminToken(token)).toBeNull();
      expect(await refreshAdminToken(token)).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  it("osvježavanje se ne radi češće od jednom u minuti", async () => {
    vi.useFakeTimers();
    try {
      vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
      const token = await signAdminToken(payload);
      vi.setSystemTime(new Date("2026-01-01T00:00:30Z"));
      expect(await refreshAdminToken(token)).toBeNull();
      vi.setSystemTime(new Date("2026-01-01T00:01:10Z"));
      expect(await refreshAdminToken(token)).not.toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  it("korisnički token se ne može osvježiti kao admin", async () => {
    expect(await refreshAdminToken(await signSessionToken(payload))).toBeNull();
  });
});
