import { describe, expect, it } from "vitest";
import { createPerson } from "../test-helpers";
import { interestsCriterion } from "./interests";

const now = new Date("2026-10-15T00:00:00.000Z");

describe("interestsCriterion", () => {
  it("računa zajednička / min(broj A, broj B)", () => {
    const viewer = createPerson({ interests: ["ai", "fintech", "climate"] });
    const candidate = createPerson({ interests: ["ai", "fintech"] });
    const evaluation = interestsCriterion.evaluate(viewer, candidate, now);
    expect(evaluation.score).toBe(1);
    expect(evaluation.reason).toContain("ai");
  });

  it("vraća 0 bez preklapanja", () => {
    const viewer = createPerson({ interests: ["ai"] });
    const candidate = createPerson({ interests: ["sports"] });
    expect(interestsCriterion.evaluate(viewer, candidate, now).score).toBe(0);
  });

  it("vraća 0 ako jedna strana nema interesovanja", () => {
    const viewer = createPerson({ interests: [] });
    const candidate = createPerson({ interests: ["ai"] });
    expect(interestsCriterion.evaluate(viewer, candidate, now).score).toBe(0);
  });
});
