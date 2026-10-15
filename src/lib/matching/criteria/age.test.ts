import { describe, expect, it } from "vitest";
import { createPerson } from "../test-helpers";
import { ageCriterion } from "./age";

const now = new Date("2026-10-15T00:00:00.000Z");

function birthDateForAge(age: number): Date {
  return new Date(now.getFullYear() - age, now.getMonth(), now.getDate());
}

describe("ageCriterion", () => {
  it("vraća 1 kad je starost u rasponu", () => {
    const viewer = createPerson({}, { ageMin: 25, ageMax: 35 });
    const candidate = createPerson({ birthDate: birthDateForAge(30) });
    expect(ageCriterion.evaluate(viewer, candidate, now).score).toBe(1);
  });

  it("opada linearno do 0 na 5 godina van raspona", () => {
    const viewer = createPerson({}, { ageMin: 25, ageMax: 35 });
    const candidate = createPerson({ birthDate: birthDateForAge(37) });
    expect(ageCriterion.evaluate(viewer, candidate, now).score).toBeCloseTo(0.6, 5);
  });

  it("vraća 0 kad je 5+ godina van raspona", () => {
    const viewer = createPerson({}, { ageMin: 25, ageMax: 35 });
    const candidate = createPerson({ birthDate: birthDateForAge(41) });
    expect(ageCriterion.evaluate(viewer, candidate, now).score).toBe(0);
  });

  it("vraća 0 kad nedostaje birthDate", () => {
    const viewer = createPerson({}, { ageMin: 25, ageMax: 35 });
    const candidate = createPerson({ birthDate: null });
    expect(ageCriterion.evaluate(viewer, candidate, now).score).toBe(0);
  });
});
