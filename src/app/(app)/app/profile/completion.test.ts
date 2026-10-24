import { describe, expect, it } from "vitest";

import { interestCodes } from "@/content/catalog";

import { missingFields, stepCompletion } from "./completion";
import { emptyFormValues, type ProfileFormValues } from "./types";

const full: ProfileFormValues = {
  ...emptyFormValues,
  firstName: "Amir",
  lastName: "Hadžić",
  photoUrl: "https://example.com/a.jpg",
  noLinkedin: true,
  countryCode: "BA",
  city: "Sarajevo",
  intro: "Pravim proizvode.",
  accomplishment: "Pokrenuo sam firmu.",
  education: "ETF Sarajevo",
  employment: "Softverski inženjer",
  isTechnical: "true",
  gender: "MALE",
  birthDate: "1994-05-12",
  ideaStatus: "OPEN",
  timing: "READY_ON_MATCH",
  areas: ["ENGINEERING"],
  interests: [interestCodes[0]!],
  equityExpectations: "50/50",
  lifePath: "Odrastao u Sarajevu.",
  lookingFor: "Biznis co-founder.",
};

describe("stepCompletion", () => {
  it("popunjen profil: svi koraci završeni", () => {
    const values = full;
    expect(stepCompletion(values)).toEqual({ basic: true, more: true, preference: true, preview: true });
  });

  it("prazan profil: ništa nije završeno", () => {
    expect(stepCompletion(emptyFormValues)).toEqual({ basic: false, more: false, preference: false, preview: false });
  });

  it("djelimičan: samo kompletni koraci", () => {
    const values = { ...full, lookingFor: "" };
    expect(stepCompletion(values)).toEqual({ basic: true, more: true, preference: false, preview: false });
  });

  it("obavezno polje prazno vraća korak na nezavršen", () => {
    const values = full;
    expect(stepCompletion({ ...values, firstName: "" }).basic).toBe(false);
    expect(stepCompletion({ ...values, lifePath: "" })).toMatchObject({ basic: true, more: false, preview: false });
    expect(stepCompletion({ ...values, firstName: "", lifePath: "" }).more).toBe(false);
  });

  it("bez slike Osnovno nema kvačicu, a Fali navodi sliku", () => {
    const values = { ...full, photoUrl: "" };
    expect(stepCompletion(values).basic).toBe(false);
    expect(missingFields(values, "basic")).toEqual(["Slika profila"]);
    expect(missingFields(full, "basic")).toEqual([]);
  });

  it("Fali navodi obavezna polja koraka Više o tebi", () => {
    expect(missingFields({ ...full, lifePath: "", equityExpectations: "" }, "more")).toEqual([
      "Očekivanja oko equity-ja",
      "Tvoj životni put (ukratko)",
    ]);
  });
});
