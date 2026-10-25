import { describe, expect, it } from "vitest";
import { profileDraftSchema, profileSubmitSchema } from "./schemas";

function birthDateMessages(birthDate: unknown): string[] {
  const result = profileSubmitSchema.safeParse({ birthDate });
  if (result.success) return [];
  return result.error.issues.filter((i) => i.path[0] === "birthDate").map((i) => i.message);
}

function yearsAgo(years: number, dayOffset = 0): string {
  const d = new Date();
  d.setUTCFullYear(d.getUTCFullYear() - years);
  d.setUTCDate(d.getUTCDate() + dayOffset);
  return d.toISOString().slice(0, 10);
}

describe("datum rođenja pri slanju profila", () => {
  it("prihvata tačno 18 godina i starije", () => {
    expect(birthDateMessages(yearsAgo(18))).toEqual([]);
    expect(birthDateMessages(yearsAgo(40))).toEqual([]);
  });
  it("odbija maloljetne sa porukom o 18 godina", () => {
    expect(birthDateMessages(yearsAgo(18, 1))).toEqual(["Greška: moraš imati najmanje 18 godina."]);
    expect(birthDateMessages(yearsAgo(10))).toEqual(["Greška: moraš imati najmanje 18 godina."]);
  });
  it("odbija budućnost i datum prije 1900.", () => {
    expect(birthDateMessages("2999-01-01")).toEqual(["Greška: unesi ispravan datum."]);
    expect(birthDateMessages("1899-12-31")).toEqual(["Greška: unesi ispravan datum."]);
  });
  it("odbija null", () => {
    expect(birthDateMessages(null).length).toBeGreaterThan(0);
  });
});

describe("nacrt profila", () => {
  it("dozvoljava null i nedovršen datum (autosave)", () => {
    expect(profileDraftSchema.safeParse({ birthDate: null }).success).toBe(true);
    expect(profileDraftSchema.safeParse({ birthDate: "0020-06-15" }).success).toBe(true);
  });
});
