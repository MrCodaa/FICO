import { describe, expect, it } from "vitest";

import {
  activeLabel,
  areasSummary,
  idealSummary,
  plainText,
  selfSummary,
  wantedAreasSummary,
} from "./summary";

describe("selfSummary", () => {
  it("sastavlja rečenicu iz tehničkog profila, timinga i ideje", () => {
    const parts = selfSummary({ gender: "MALE", isTechnical: true, timing: "ALREADY_FULL_TIME", ideaStatus: "COMMITTED" });
    expect(plainText(parts)).toBe("Ja sam tehnički, spreman odmah, i imam ideju.");
    expect(parts?.filter((p) => p.bold).map((p) => p.text)).toEqual(["tehnički", "odmah", "imam ideju"]);
  });

  it("koristi žensku formu i neodređenu kad pol nije poznat", () => {
    expect(plainText(selfSummary({ gender: "FEMALE", isTechnical: false, timing: "WITHIN_YEAR", ideaStatus: "EXPLORING" }))).toBe(
      "Ja sam netehnička, spremna u narednih godinu dana, i imam ideje ali sam otvorena.",
    );
    expect(plainText(selfSummary({ gender: null, isTechnical: true, timing: "READY_ON_MATCH", ideaStatus: null }))).toBe(
      "Ja sam tehnički, spreman/na kad nađem co-foundera.",
    );
  });

  it("izostavlja timing NO_PLANS i vraća null bez podataka", () => {
    expect(plainText(selfSummary({ isTechnical: null, timing: "NO_PLANS", ideaStatus: "OPEN" }))).toBe("Nemam ideju.");
    expect(selfSummary({ isTechnical: null, timing: null, ideaStatus: null })).toBeNull();
  });
});

describe("areasSummary", () => {
  it("nabraja oblasti sa 'i' pred posljednjom", () => {
    expect(plainText(areasSummary({ gender: "MALE", areas: ["PRODUCT", "ENGINEERING", "OPERATIONS"] }))).toBe(
      "Spreman sam da preuzmem Product, Engineering i Operations.",
    );
    expect(areasSummary({ areas: [] })).toBeNull();
  });
});

describe("idealSummary", () => {
  const owner = { timing: "ALREADY_FULL_TIME", city: "Beograd", countryCode: "RS" };

  it("opisuje preference vlasnika", () => {
    const parts = idealSummary(
      { technical: "TECHNICAL", idea: null, timingImportance: null, location: "SAME_COUNTRY", interestsImportance: "PREFERRED" },
      owner,
    );
    expect(plainText(parts)).toBe("Idealno, moj co-founder je tehnički, u mojoj zemlji (Srbija) i dijeli moje interese.");
  });

  it("uključuje ideju, timing i grad", () => {
    expect(
      plainText(
        idealSummary(
          { technical: null, idea: "HAS_IDEA", timingImportance: "REQUIRED", location: "SAME_CITY", interestsImportance: null },
          owner,
        ),
      ),
    ).toBe("Idealno, moj co-founder je posvećen konkretnoj ideji, spreman odmah i u mom gradu (Beograd).");
  });

  it("vraća null bez ijedne preference", () => {
    expect(
      idealSummary({ technical: null, idea: null, timingImportance: null, location: null, interestsImportance: null }, owner),
    ).toBeNull();
  });
});

describe("wantedAreasSummary", () => {
  it("nabraja tražene oblasti", () => {
    expect(plainText(wantedAreasSummary(["ENGINEERING", "DESIGN"]))).toBe(
      "Želim co-foundera koji će preuzeti Engineering i Design.",
    );
    expect(wantedAreasSummary([])).toBeNull();
  });
});

describe("activeLabel", () => {
  const now = new Date("2026-10-16T12:00:00Z");
  it("računa dane od zadnje aktivnosti", () => {
    expect(activeLabel(new Date("2026-10-16T08:00:00Z"), now, "MALE")).toBe("Aktivan danas");
    expect(activeLabel(new Date("2026-10-15T08:00:00Z"), now, "FEMALE")).toBe("Aktivna prije 1 dan");
    expect(activeLabel("2026-09-27T12:00:00Z", now, null)).toBe("Aktivan/na prije 19 dana");
  });
});
