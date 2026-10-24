import { describe, expect, it } from "vitest";

import { adminApi, adminHref, isValidAdminPath, parseAdminPath } from "./path";

describe("isValidAdminPath", () => {
  it.each(["/upravljanje", "/upravljanje-k7x2q", "/a", "/x1-2"])("prihvata %s", (v) => {
    expect(isValidAdminPath(v)).toBe(true);
  });
  it.each(["", "/", "upravljanje", "/Upravljanje", "/a b", "/a/b", "/a_b", "/" + "a".repeat(60), "/ć"])(
    "odbija %j",
    (v) => {
      expect(isValidAdminPath(v)).toBe(false);
    },
  );
  it("dozvoljava najviše 60 znakova", () => {
    expect(isValidAdminPath("/" + "a".repeat(59))).toBe(true);
  });
  it.each(["/admin", "/api", "/prijava", "/app", "/sys-panel", "/faq"])("odbija rezervisan %s", (v) => {
    expect(isValidAdminPath(v)).toBe(false);
  });
});

describe("parseAdminPath", () => {
  it("koristi postavljenu ispravnu vrijednost", () => {
    expect(parseAdminPath("/moj-panel", "production")).toBe("/moj-panel");
    expect(parseAdminPath(" /moj-panel ", "development")).toBe("/moj-panel");
  });
  it("u razvoju bez vrijednosti daje /upravljanje", () => {
    expect(parseAdminPath(undefined, "development")).toBe("/upravljanje");
    expect(parseAdminPath("", "development")).toBe("/upravljanje");
  });
  it("u produkciji i testu bez vrijednosti gasi admin", () => {
    expect(parseAdminPath(undefined, "production")).toBeNull();
    expect(parseAdminPath("  ", "production")).toBeNull();
    expect(parseAdminPath(undefined, "test")).toBeNull();
  });
  it("nevažeća vrijednost gasi admin, bez vraćanja na zadano", () => {
    expect(parseAdminPath("/admin", "development")).toBeNull();
    expect(parseAdminPath("Admin Panel", "production")).toBeNull();
  });
});

describe("adminHref / adminApi", () => {
  it("dodaje prefiks", () => {
    expect(adminHref("/x")).toBe("/x");
    expect(adminHref("/x", "/prijave")).toBe("/x/prijave");
    expect(adminApi("/x", "/profiles")).toBe("/x/api/profiles");
    expect(adminApi("/x")).toBe("/x/api");
  });
});
