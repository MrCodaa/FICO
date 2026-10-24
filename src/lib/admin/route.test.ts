import { describe, expect, it } from "vitest";

import { decideAdminRoute } from "./route";

const P = "/upravljanje-k7x2q";
const run = (pathname: string, hasAdminCookie = false, adminPath: string | null = P) =>
  decideAdminRoute({ pathname, adminPath, hasAdminCookie });

describe("decideAdminRoute", () => {
  it("/admin i /admin/** su uvijek 404", () => {
    for (const cookie of [false, true]) {
      expect(run("/admin", cookie)).toEqual({ action: "notFound", api: false });
      expect(run("/admin/prijava", cookie)).toEqual({ action: "notFound", api: false });
    }
    expect(run("/admin", true, null)).toEqual({ action: "notFound", api: false });
  });

  it("interni put i interni API su 404 pri direktnom pristupu", () => {
    expect(run("/sys-panel", true)).toEqual({ action: "notFound", api: false });
    expect(run("/sys-panel/prijave", true)).toEqual({ action: "notFound", api: false });
    expect(run("/api/admin/login", true)).toEqual({ action: "notFound", api: true });
    expect(run("/api/admin/profiles", true)).toEqual({ action: "notFound", api: true });
  });

  it("tačan ADMIN_PATH ide na interni korijen i bez kolačića (forma za prijavu)", () => {
    expect(run(P)).toEqual({ action: "rewrite", to: "/sys-panel" });
    expect(run(`${P}/`)).toEqual({ action: "rewrite", to: "/sys-panel" });
  });

  it("ostale stranice bez kolačića su 404, sa kolačićem rewrite", () => {
    expect(run(`${P}/prijave`)).toEqual({ action: "notFound", api: false });
    expect(run(`${P}/prijave`, true)).toEqual({ action: "rewrite", to: "/sys-panel/prijave" });
  });

  it("API: login i logout rade bez kolačića, ostalo traži kolačić", () => {
    expect(run(`${P}/api/login`)).toEqual({ action: "rewrite", to: "/api/admin/login" });
    expect(run(`${P}/api/logout`)).toEqual({ action: "rewrite", to: "/api/admin/logout" });
    expect(run(`${P}/api/profiles`)).toEqual({ action: "notFound", api: true });
    expect(run(`${P}/api/profiles`, true)).toEqual({ action: "rewrite", to: "/api/admin/profiles" });
    expect(run(`${P}/api/reports/abc/resolve`, true)).toEqual({
      action: "rewrite",
      to: "/api/admin/reports/abc/resolve",
    });
    expect(run(`${P}/api`, true)).toEqual({ action: "notFound", api: true });
  });

  it("slične adrese nisu admin (granica segmenta)", () => {
    expect(run(`${P}x`)).toEqual({ action: "next" });
    expect(run("/prijava")).toEqual({ action: "next" });
    expect(run("/api/me")).toEqual({ action: "next" });
  });

  it("bez ADMIN_PATH nema nijedne javne admin rute", () => {
    expect(run(P, true, null)).toEqual({ action: "next" });
    expect(run("/upravljanje", true, null)).toEqual({ action: "next" });
  });
});
