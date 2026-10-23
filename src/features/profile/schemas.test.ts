import { describe, expect, it } from "vitest";

import { profileDraftSchema } from "./schemas";

describe("profileDraftSchema", () => {
  it("prima null za polja koja korisnik još nije popunio", () => {
    const result = profileDraftSchema.safeParse({
      firstName: null,
      countryCode: null,
      city: null,
      isTechnical: null,
      gender: null,
      birthDate: null,
    });
    expect(result.success).toBe(true);
  });

  it("odbija null za polja koja u bazi nisu nullable", () => {
    expect(profileDraftSchema.safeParse({ noLinkedin: null }).success).toBe(false);
    expect(profileDraftSchema.safeParse({ areas: null }).success).toBe(false);
    expect(profileDraftSchema.safeParse({ interests: null }).success).toBe(false);
  });

  it("dopunjuje https:// linkovima bez protokola", () => {
    const result = profileDraftSchema.parse({
      linkedinUrl: "linkedin.com/in/petar",
      twitterUrl: "www.x.com/petar",
      instagramUrl: "https://instagram.com/petar",
    });
    expect(result.linkedinUrl).toBe("https://linkedin.com/in/petar");
    expect(result.twitterUrl).toBe("https://www.x.com/petar");
    expect(result.instagramUrl).toBe("https://instagram.com/petar");
  });

  it.each(["moj profil", "asdfgh", "a.b", "localhost:3000", "javascript:alert(1)", "ftp://linkedin.com/x"])(
    "odbija %s kao link",
    (value) => {
      expect(profileDraftSchema.safeParse({ linkedinUrl: value }).success).toBe(false);
      expect(profileDraftSchema.safeParse({ videoUrl: value }).success).toBe(false);
      expect(profileDraftSchema.safeParse({ schedulingUrl: value }).success).toBe(false);
    },
  );

  it("traži da LinkedIn, X i Instagram vode na svoj sajt", () => {
    expect(profileDraftSchema.safeParse({ linkedinUrl: "youtube.com/watch?v=1" }).success).toBe(false);
    expect(profileDraftSchema.safeParse({ linkedinUrl: "evil-linkedin.com/x" }).success).toBe(false);
    expect(profileDraftSchema.safeParse({ linkedinUrl: "https://rs.linkedin.com/in/petar" }).success).toBe(true);
    expect(profileDraftSchema.safeParse({ twitterUrl: "twitter.com/petar" }).success).toBe(true);
    expect(profileDraftSchema.safeParse({ twitterUrl: "instagram.com/petar" }).success).toBe(false);
    expect(profileDraftSchema.safeParse({ instagramUrl: "x.com/petar" }).success).toBe(false);
  });

  it("video i link za zakazivanje primaju bilo koji pravi sajt", () => {
    expect(profileDraftSchema.safeParse({ videoUrl: "youtu.be/abc" }).success).toBe(true);
    expect(profileDraftSchema.safeParse({ schedulingUrl: "calendly.com/petar" }).success).toBe(true);
  });
});
