import { describe, expect, it } from "vitest";
import { birthDateIssue } from "./age";

const NOW = new Date("2026-06-15T12:00:00Z");
const d = (s: string) => new Date(s);

describe("birthDateIssue", () => {
  it("prihvata tačno 18 godina na rođendan i starije", () => {
    expect(birthDateIssue(d("2008-06-15"), NOW)).toBeNull();
    expect(birthDateIssue(d("1990-01-01"), NOW)).toBeNull();
    expect(birthDateIssue(d("1900-01-01"), NOW)).toBeNull();
  });
  it("odbija dan prije 18. rođendana", () => {
    expect(birthDateIssue(d("2008-06-16"), NOW)).toBe("underage");
    expect(birthDateIssue(d("2015-03-03"), NOW)).toBe("underage");
  });
  it("odbija budućnost, prije 1900. i nevažeći datum", () => {
    expect(birthDateIssue(d("2030-01-01"), NOW)).toBe("out_of_range");
    expect(birthDateIssue(d("1899-12-31"), NOW)).toBe("out_of_range");
    expect(birthDateIssue(new Date("nije"), NOW)).toBe("invalid");
  });
});
