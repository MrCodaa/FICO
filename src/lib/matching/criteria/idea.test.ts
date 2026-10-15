import { describe, expect, it } from "vitest";
import { createPerson } from "../test-helpers";
import { ideaCriterion } from "./idea";

const now = new Date("2026-10-15T00:00:00.000Z");

describe("ideaCriterion", () => {
  it("HAS_IDEA i COMMITTED daju 1", () => {
    const viewer = createPerson({}, { idea: "HAS_IDEA" });
    const candidate = createPerson({ ideaStatus: "COMMITTED" });
    expect(ideaCriterion.evaluate(viewer, candidate, now).score).toBe(1);
  });

  it("OPEN_TO_IDEAS i OPEN daju 1", () => {
    const viewer = createPerson({}, { idea: "OPEN_TO_IDEAS" });
    const candidate = createPerson({ ideaStatus: "OPEN" });
    expect(ideaCriterion.evaluate(viewer, candidate, now).score).toBe(1);
  });

  it("EXPLORING daje 0.5 bez obzira na preferencu", () => {
    const viewer = createPerson({}, { idea: "HAS_IDEA" });
    const candidate = createPerson({ ideaStatus: "EXPLORING" });
    expect(ideaCriterion.evaluate(viewer, candidate, now).score).toBe(0.5);
  });

  it("neuklapanje daje 0", () => {
    const viewer = createPerson({}, { idea: "HAS_IDEA" });
    const candidate = createPerson({ ideaStatus: "OPEN" });
    expect(ideaCriterion.evaluate(viewer, candidate, now).score).toBe(0);
  });
});
