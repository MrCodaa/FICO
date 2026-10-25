import { describe, expect, it } from "vitest";

import { interestCodes } from "@/content/catalog";

import { missingFields, stepCompletion, visibleMissingFields, type StepKey } from "./completion";
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
  it("popunjen nacrt: tri koraka završena, Pregled nema kvačicu", () => {
    expect(stepCompletion(full)).toEqual({ basic: true, more: true, preference: true, preview: false });
    expect(stepCompletion(full, "DRAFT").preview).toBe(false);
    expect(stepCompletion(full, "REJECTED").preview).toBe(false);
  });

  it("Pregled dobija kvačicu kad je profil poslat ili odobren", () => {
    expect(stepCompletion(full, "PENDING_REVIEW").preview).toBe(true);
    expect(stepCompletion(full, "APPROVED").preview).toBe(true);
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

describe("visibleMissingFields", () => {
  const none = new Set<StepKey>();

  it("na praznom profilu napomena se ne vidi dok korisnik nije pokušao sačuvati", () => {
    expect(visibleMissingFields(emptyFormValues, "basic", none)).toEqual([]);
    expect(visibleMissingFields(emptyFormValues, "more", new Set<StepKey>(["basic"]))).toEqual([]);
  });

  it("nakon pokušaja čuvanja prikazuje polja koja fale u tom koraku", () => {
    const shown = visibleMissingFields(emptyFormValues, "basic", new Set<StepKey>(["basic"]));
    expect(shown).toEqual(missingFields(emptyFormValues, "basic"));
    expect(shown.length).toBeGreaterThan(0);
  });

  it("nestaje čim se polja popune", () => {
    expect(visibleMissingFields(full, "basic", new Set<StepKey>(["basic"]))).toEqual([]);
  });

  it("slanje cijelog profila otkriva napomene u svim koracima", () => {
    const all = new Set<StepKey>(["basic", "more", "preference", "preview"]);
    expect(visibleMissingFields(emptyFormValues, "more", all).length).toBeGreaterThan(0);
  });
});
