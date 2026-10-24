import { describe, expect, it } from "vitest";

import { profileDraftSchema } from "./schemas";

describe("profileDraftSchema", () => {
  it("prima null za polja koja korisnik još nije popunio", () => {
    const result = profileDraftSchema.safeParse({
      firstName: null,
      lastName: null,
      countryCode: null,
      city: null,
      intro: null,
      isTechnical: null,
      gender: null,
      birthDate: null,
      linkedinUrl: null,
    });
    expect(result.success).toBe(true);
  });

  it("odbija null za polja koja u bazi nisu nullable", () => {
    expect(profileDraftSchema.safeParse({ noLinkedin: null }).success).toBe(false);
    expect(profileDraftSchema.safeParse({ areas: null }).success).toBe(false);
    expect(profileDraftSchema.safeParse({ interests: null }).success).toBe(false);
  });

  it("i dalje validira popunjena polja", () => {
    expect(profileDraftSchema.safeParse({ linkedinUrl: "asdfgh" }).success).toBe(false);
    expect(profileDraftSchema.safeParse({ gender: "NESTO" }).success).toBe(false);
  });
});
