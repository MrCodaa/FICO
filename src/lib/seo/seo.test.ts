import { describe, expect, it } from "vitest";
import robots from "@/app/robots";
import sitemap from "@/app/sitemap";
import { getSiteUrl } from "@/lib/siteUrl";
import { isValidAdminPath } from "@/lib/admin/path";
import { DISALLOWED_PATHS, PUBLIC_PATHS } from "./publicPages";

describe("getSiteUrl", () => {
  it("koristi origin iz APP_URL, bez završne kose crte", () => {
    expect(getSiteUrl({ APP_URL: "https://fico.example/" })).toBe("https://fico.example");
  });
  it("pada na localhost kad je APP_URL prazan ili neispravan", () => {
    expect(getSiteUrl({})).toBe("http://localhost:3000");
    expect(getSiteUrl({ APP_URL: "nije url" })).toBe("http://localhost:3000");
  });
});

describe("robots i sitemap", () => {
  it("robots zabranjuje interne putanje i ne spominje admin adresu", () => {
    const prev = process.env.ADMIN_PATH;
    process.env.ADMIN_PATH = "/tajni-panel-xyz";
    try {
      const r = robots();
      const text = JSON.stringify(r);
      expect(text).not.toContain("tajni-panel-xyz");
      expect(text).not.toContain("upravljanje");
      expect(r.rules).toEqual([{ userAgent: "*", allow: "/", disallow: [...DISALLOWED_PATHS] }]);
      expect(r.sitemap).toMatch(/\/sitemap\.xml$/);
    } finally {
      if (prev === undefined) delete process.env.ADMIN_PATH;
      else process.env.ADMIN_PATH = prev;
    }
  });
  it("sitemap sadrži samo javne stranice", () => {
    const urls = sitemap().map((e) => new URL(e.url).pathname);
    expect(urls.sort()).toEqual(["/", ...PUBLIC_PATHS.filter((p) => p !== "/")].sort());
    for (const bad of DISALLOWED_PATHS) expect(urls.some((u) => u.startsWith(bad))).toBe(false);
  });
  it("ADMIN_PATH ne može zauzeti javnu stranicu iz sitemapa", () => {
    for (const p of PUBLIC_PATHS) if (p !== "/") expect(isValidAdminPath(p)).toBe(false);
  });
});
