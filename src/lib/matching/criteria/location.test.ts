import { describe, expect, it } from "vitest";
import { createPerson } from "../test-helpers";
import { locationCriterion } from "./location";

const now = new Date("2026-10-15T00:00:00.000Z");

describe("locationCriterion", () => {
  it("SAME_CITY: isti grad daje 1", () => {
    const viewer = createPerson({ countryCode: "BA", city: "Sarajevo" }, { location: "SAME_CITY" });
    const candidate = createPerson({ countryCode: "BA", city: "Sarajevo" });
    expect(locationCriterion.evaluate(viewer, candidate, now).score).toBe(1);
  });

  it("SAME_CITY: ista država, drugi grad daje 0.5", () => {
    const viewer = createPerson({ countryCode: "BA", city: "Sarajevo" }, { location: "SAME_CITY" });
    const candidate = createPerson({ countryCode: "BA", city: "Mostar" });
    expect(locationCriterion.evaluate(viewer, candidate, now).score).toBe(0.5);
  });

  it("SAME_COUNTRY: ista država daje 1", () => {
    const viewer = createPerson({ countryCode: "RS" }, { location: "SAME_COUNTRY" });
    const candidate = createPerson({ countryCode: "RS" });
    expect(locationCriterion.evaluate(viewer, candidate, now).score).toBe(1);
  });

  it("sačuvani SAME_REGION se tretira kao bez preference (Bilo gdje)", () => {
    const viewer = createPerson({ countryCode: "BA" }, { location: "SAME_REGION" });
    expect(locationCriterion.hasPreference(viewer)).toBe(false);
  });

  it("nedostatak podataka daje 0", () => {
    const viewer = createPerson({ countryCode: "BA" }, { location: "SAME_COUNTRY" });
    const candidate = createPerson({ countryCode: null });
    expect(locationCriterion.evaluate(viewer, candidate, now).score).toBe(0);
  });
});
