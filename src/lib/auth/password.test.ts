import bcrypt from "bcrypt";
import { describe, expect, it } from "vitest";
import { hashPassword, resolveBcryptCost, verifyPassword } from "./password";

describe("bcrypt cost", () => {
  it("u testu je nizak, a bez env-a 12", () => {
    expect(resolveBcryptCost({ NODE_ENV: "test", BCRYPT_COST: "4" })).toBe(4);
    expect(resolveBcryptCost({ NODE_ENV: "test" })).toBe(12);
    expect(resolveBcryptCost({ NODE_ENV: "development", BCRYPT_COST: "abc" })).toBe(12);
  });

  it("u produkciji je najmanje 12", () => {
    expect(resolveBcryptCost({ NODE_ENV: "production", BCRYPT_COST: "4" })).toBe(12);
    expect(resolveBcryptCost({ NODE_ENV: "production" })).toBe(12);
    expect(resolveBcryptCost({ NODE_ENV: "production", BCRYPT_COST: "14" })).toBe(14);
  });

  it("stari hash cost 12 se i dalje provjerava", async () => {
    const old = await bcrypt.hash("stara-lozinka", 12);
    expect(await verifyPassword("stara-lozinka", old)).toBe(true);
    expect(await verifyPassword("pogresna", old)).toBe(false);
  });

  it("novi hash koristi cost iz okruženja", async () => {
    const h = await hashPassword("nova-lozinka");
    expect(h.startsWith("$2b$04$")).toBe(true);
    expect(await verifyPassword("nova-lozinka", h)).toBe(true);
  });
});
