import { describe, expect, it } from "vitest";
import { getClientIp } from "./clientIp";

const h = (init: Record<string, string>) => new Headers(init);

describe("getClientIp", () => {
  it("uzima prvi element x-forwarded-for", () => {
    expect(getClientIp(h({ "x-forwarded-for": "1.2.3.4, 10.0.0.1" }))).toBe("1.2.3.4");
  });
  it("pada na x-real-ip, pa na unknown", () => {
    expect(getClientIp(h({ "x-real-ip": "5.6.7.8" }))).toBe("5.6.7.8");
    expect(getClientIp(h({}))).toBe("unknown");
  });
});
