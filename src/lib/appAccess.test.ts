import { describe, expect, it } from "vitest";
import { isAppUnlocked, isOpenBeforeApproval } from "./appAccess";

describe("isAppUnlocked", () => {
  it("otključava samo odobren profil", () => {
    expect(isAppUnlocked("APPROVED")).toBe(true);
    for (const status of ["DRAFT", "PENDING_REVIEW", "REJECTED", undefined]) {
      expect(isAppUnlocked(status)).toBe(false);
    }
  });
});

describe("isOpenBeforeApproval", () => {
  it("dozvoljava Kontrolnu tablu, Uredi profil i informativne stranice", () => {
    for (const path of ["/app", "/app/", "/app/profile", "/app/faq", "/app/help", "/app/privacy", "/app/about"]) {
      expect(isOpenBeforeApproval(path), path).toBe(true);
    }
  });

  it("zaključava sve ostalo", () => {
    for (const path of [
      "/app/discover",
      "/app/revisit/liked",
      "/app/requests",
      "/app/messages",
      "/app/settings",
      "/app/profiles/abc",
      "/app/profilex",
    ]) {
      expect(isOpenBeforeApproval(path), path).toBe(false);
    }
  });
});
