import { describe, expect, it } from "vitest";
import { cleanText, containsMarkup, optionalSafeText, safeText } from "./sanitize";
import { sendMessageSchema } from "@/features/chat/schemas";
import { createRequestSchema } from "@/features/requests/schemas";
import { createReportSchema } from "@/features/safety/schemas";
import { registerSchema } from "@/features/auth/schemas";
import { profileDraftSchema } from "@/features/profile/schemas";

const ZW = String.fromCharCode(0x200b);
const RLO = String.fromCharCode(0x202e);
const NUL = String.fromCharCode(0);
const BEL = String.fromCharCode(7);

const attacks = [
  "<script>alert(1)</script>",
  "<img src=x onerror=alert(1)>",
  "<svg/onload=alert(1)>",
  "<!-- komentar -->",
  "<?php echo 1 ?>",
  "</div>",
  '<a href="javascript:alert(1)">klik</a>',
  "javascript:alert(1)",
  "JaVaScRiPt : alert(1)",
  "vbscript:msgbox(1)",
  "data:text/html;base64,PHNjcmlwdD4=",
  'x" onmouseover="alert(1)',
  "autofocus onfocus=alert(1)",
  "&lt;script&gt;alert(1)&lt;/script&gt;",
  "&#60;script>alert(1)",
];

const legit = [
  "Volim da radim sa ljudima & timovima",
  "To je moj \"najveći\" uspjeh, i don't mind",
  "Ja <3 startupe",
  "Ako je a < b i c > d, onda ok",
  "Prihod < 5000 eura",
  "x<5",
  "O'Brien-Šćepanović",
  "Čekam odgovor: hvala!",
  "Moj data: 5 projekata",
  "Radim online = ne u kancelariji",
  "Prvi red\nDrugi red",
  "JavaScript i TypeScript",
];

describe("containsMarkup", () => {
  it.each(attacks)("odbija %j", (t) => expect(containsMarkup(cleanText(t, { multiline: true }))).toBe(true));
  it.each(legit)("propušta %j", (t) => expect(containsMarkup(cleanText(t, { multiline: true }))).toBe(false));
});

describe("cleanText", () => {
  it("uklanja zero-width i bidi override znakove", () => {
    expect(cleanText(`Ana${ZW}${RLO}Anić`)).toBe("AnaAnić");
    expect(cleanText(`abc${RLO}fdp.exe`)).toBe("abcfdp.exe");
  });
  it("skriveni znakovi ne mogu razbiti detekciju", () => {
    expect(containsMarkup(cleanText(`<${ZW}script>alert(1)`))).toBe(true);
    expect(containsMarkup(cleanText(`java${ZW}script:alert(1)`))).toBe(true);
  });
  it("uklanja kontrolne znakove i NFC normalizuje", () => {
    expect(cleanText(`a${NUL}b${BEL}c`)).toBe("abc");
    expect(cleanText("c" + String.fromCharCode(0x30c))).toBe(String.fromCharCode(0x10d));
  });
  it("jednorednja polja gase nove redove, višerednja ih čuvaju", () => {
    expect(cleanText("a\nb")).toBe("a b");
    expect(cleanText("a\r\nb\n\n\n\nc", { multiline: true })).toBe("a\nb\n\nc");
  });
  it("trimuje", () => expect(cleanText("  zdravo  ")).toBe("zdravo"));
});

describe("safeText / optionalSafeText", () => {
  it("poštuje min i max nakon čišćenja", () => {
    expect(safeText(1, 5).safeParse(`  ${ZW} `).success).toBe(false);
    expect(safeText(1, 5).safeParse("123456").success).toBe(false);
    expect(safeText(1, 5).parse(" abc ")).toBe("abc");
  });
  it("poruka je prijatna", () => {
    const r = safeText(1, 50).safeParse("<script>alert(1)</script>");
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues[0]?.message).toBe("Greška: tekst ne smije sadržati HTML ili skripte.");
  });
  it("optional prima undefined, null i prazan tekst", () => {
    const s = optionalSafeText(10);
    expect(s.parse(undefined)).toBeUndefined();
    expect(s.parse(null)).toBeNull();
    expect(s.parse("")).toBe("");
  });
});

describe("šeme koriste zajednički filter", () => {
  it.each(attacks)("chat poruka odbija %j", (t) => expect(sendMessageSchema.safeParse({ body: t }).success).toBe(false));
  it("chat poruka propušta običan tekst", () => {
    expect(sendMessageSchema.parse({ body: "  Zdravo, kako si? <3 " }).body).toBe("Zdravo, kako si? <3");
  });
  it("poruka uz lajk", () => {
    expect(createRequestSchema.safeParse({ receiverId: "u1", message: "<img src=x onerror=alert(1)>" }).success).toBe(false);
    expect(createRequestSchema.safeParse({ receiverId: "u1", message: "Hajde da pričamo" }).success).toBe(true);
  });
  it("razlog prijave", () => {
    expect(createReportSchema.safeParse({ reportedId: "u1", reason: "SPAM", details: "javascript:alert(1)" }).success).toBe(false);
    expect(createReportSchema.safeParse({ reportedId: "u1", reason: "SPAM" }).success).toBe(true);
  });
  it("registracija (ime)", () => {
    const base = { lastName: "Anić", email: "a@b.com", password: "12345678", noLinkedin: true };
    expect(registerSchema.safeParse({ ...base, firstName: "<script>x</script>" }).success).toBe(false);
    expect(registerSchema.safeParse({ ...base, firstName: "Ana" }).success).toBe(true);
  });
  it("profil: svako tekstualno polje", () => {
    const fields = ["firstName", "lastName", "intro", "accomplishment", "education", "employment", "heardFrom", "ideas", "equityExpectations", "freeTime", "lifePath", "other"];
    for (const field of fields) {
      expect(profileDraftSchema.safeParse({ [field]: "<script>alert(1)</script>" }).success, field).toBe(false);
      expect(profileDraftSchema.safeParse({ [field]: "Običan tekst" }).success, field).toBe(true);
    }
  });
});
