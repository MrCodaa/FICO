import { describe, expect, it } from "vitest";

import { DRAFT_VERSION, isDraftEmpty, makeDraft, mergeDraft, parseDraft } from "./draft";
import { emptyFormValues, type ProfileFormValues } from "./types";

const server: ProfileFormValues = {
  ...emptyFormValues,
  firstName: "Damir",
  countryCode: "BA",
  city: "Sarajevo",
  areas: ["ENGINEERING"],
};

describe("mergeDraft", () => {
  it("bez nacrta vraća server", () => {
    expect(mergeDraft(server, null)).toEqual(server);
  });

  it("prazno polje u nacrtu ne briše server vrijednost", () => {
    const stale = makeDraft("u1", 0, emptyFormValues, emptyFormValues, 1);
    expect(mergeDraft(server, stale)).toEqual(server);
    const cleared = makeDraft("u1", 0, server, { ...server, city: "", countryCode: "", areas: [] }, 1);
    expect(mergeDraft(server, cleared)).toEqual(server);
  });

  it("izmijenjeno neprazno polje iz nacrta pobjeđuje", () => {
    const draft = makeDraft("u1", 2, server, { ...server, intro: "Novi tekst", city: "Tuzla" }, 1);
    const merged = mergeDraft(server, draft);
    expect(merged.intro).toBe("Novi tekst");
    expect(merged.city).toBe("Tuzla");
    expect(merged.firstName).toBe("Damir");
  });

  it("nacrt ne pregazi polje koje se na serveru promijenilo od nastanka nacrta", () => {
    const oldServer = { ...server, city: "Mostar" };
    const draft = makeDraft("u1", 0, oldServer, { ...oldServer, city: "Zenica", intro: "Moj tekst" }, 1);
    const merged = mergeDraft(server, draft);
    expect(merged.city).toBe("Sarajevo");
    expect(merged.intro).toBe("Moj tekst");
  });
});

describe("parseDraft", () => {
  it("stari nacrt bez vremena i verzije se ignoriše", () => {
    expect(parseDraft({ userId: "u1", stepIndex: 1, values: emptyFormValues }, "u1")).toBeNull();
    expect(parseDraft({ version: DRAFT_VERSION, userId: "u1", base: server, values: server }, "u1")).toBeNull();
  });

  it("tuđi nacrt se ignoriše, ispravan se prihvata", () => {
    const draft = makeDraft("u1", 1, server, server, 5);
    expect(parseDraft(JSON.parse(JSON.stringify(draft)), "u2")).toBeNull();
    expect(parseDraft(JSON.parse(JSON.stringify(draft)), "u1")?.savedAt).toBe(5);
  });
});

describe("isDraftEmpty", () => {
  it("nacrt isti kao server se briše, izmijenjen ne", () => {
    expect(isDraftEmpty(server, { ...server })).toBe(true);
    expect(isDraftEmpty(server, { ...server, intro: "x" })).toBe(false);
  });

  it("poslije čuvanja (base = sačuvane vrijednosti) nacrt nestaje", () => {
    const edited = { ...server, intro: "x" };
    expect(isDraftEmpty(server, edited)).toBe(false);
    expect(isDraftEmpty(edited, edited)).toBe(true);
  });
});
