import { describe, expect, it } from "vitest";
import {
  isValidLinkedinUrl,
  EXTERNAL_LINK_REL,
  VIDEO_URL_MAX,
  normalizeUrlInput,
  safeExternalHref,
  isValidVideoUrl,
  isValidWebUrl,
  isValidTwitterUrl,
  isValidInstagramUrl,
  isValidSchedulingUrl,
  twitterUrlSchema,
  instagramUrlSchema,
  schedulingUrlSchema,
  linkedinUrlSchema,
  videoUrlSchema,
  webUrlSchema,
} from "./urlSchemas";

describe("isValidWebUrl", () => {
  it.each(["https://primjer.com", "https://www.github.com/damir", "https://sub.domen.co.rs/a?b=1", "https://moj-sajt.io", "primjer.com", "www.primjer.com/", "http://primjer.com"])(
    "prihvata %s",
    (u) => expect(isValidWebUrl(u)).toBe(true),
  );
  it.each([
    "https://localhost",
    "http://localhost",
    "https://asdf",
    "abc",
    "https://primjer",
    "https://a.b",
    "https://user:pw@primjer.com",
    "javascript:alert(1)",
    "https://exa mple.com",
    "https://primjer.c0m",
    "https://127.0.0.1",
    "https://primjer.com:8443",
    "https://-bad.com",
    "",
    "nesto",
  ])("odbija %s", (u) => expect(isValidWebUrl(u)).toBe(false));
});

describe("isValidLinkedinUrl", () => {
  it.each([
    "https://linkedin.com/in/damir",
    "https://www.linkedin.com/in/damir-velovic-123/",
    "https://rs.linkedin.com/in/damir",
    "https://www.linkedin.com/pub/damir/1/2/3",
    "www.linkedin.com/in/velovicd",
    "linkedin.com/in/velovicd",
    "http://www.linkedin.com/in/damir",
    "www.linkedin.com/in/velovicd/",
    "https://www.linkedin.com/in/velovicd?trk=public_profile#x",
    "  www.linkedin.com/in/velovicd  ",
    "www.linkedin.com/in/velovicd​",
    "m.linkedin.com/in/damir",
    "rs.linkedin.com/in/damir",
    "LinkedIn.com/in/ABC",
    "HTTPS://WWW.LINKEDIN.COM/in/ABC",
  ])("prihvata %s", (u) => expect(isValidLinkedinUrl(u)).toBe(true));
  it.each([
    "https://linkedin.com",
    "https://www.linkedin.com/company/acme",
    "https://www.linkedin.com/in/",
    "https://notlinkedin.com/in/damir",
    "https://linkedin.com.evil.com/in/damir",
    "https://facebook.com/in/damir",
    "linkedin.com.evil.com/in/damir",
    "www.linkedin.com/company/x",
    "https://linkedin.com/company/x",
    "linkedin.com",
    "https://evil.com/?u=linkedin.com/in/damir",
  ])("odbija %s", (u) => expect(isValidLinkedinUrl(u)).toBe(false));
});

describe("isValidVideoUrl", () => {
  it.each([
    "https://www.youtube.com/watch?v=abc",
    "https://youtu.be/abc",
    "https://m.youtube.com/watch?v=abc",
    "https://vimeo.com/123",
    "https://www.loom.com/share/abc",
    "https://drive.google.com/file/d/abc/view",
    "https://firma.sharepoint.com/:v:/s/x",
    "https://us02web.zoom.us/rec/share/abc",
    "https://fb.watch/abc",
    "https://www.tiktok.com/@a/video/1",
    "youtube.com/watch?v=abc",
    "http://youtu.be/abc",
    "www.youtube.com/watch?v=abc",
  ])("prihvata %s", (u) => expect(isValidVideoUrl(u)).toBe(true));
  it.each([
    "https://primjer.com/video.mp4",
    "https://youtube.com.evil.com/watch",
    "https://evilyoutube.com/watch",
    "https://youtube.com.evil.com/x",
    "abc",
    "javascript:alert(1)",
  ])("odbija %s", (u) => expect(isValidVideoUrl(u)).toBe(false));
});

describe("normalizeUrlInput", () => {
  it.each([
    ["www.linkedin.com/in/velovicd", "https://www.linkedin.com/in/velovicd"],
    ["  http://primjer.com/a  ", "https://primjer.com/a"],
    ["HTTP://Primjer.com", "https://Primjer.com"],
    ["https://primjer.com", "https://primjer.com"],
    ["javascript:alert(1)", "javascript:alert(1)"],
    ["", ""],
  ])("%j -> %j", (i, o) => expect(normalizeUrlInput(i)).toBe(o));
});

describe("zod sheme", () => {
  it("cuva normalizovan https URL", () => {
    expect(linkedinUrlSchema.parse("www.linkedin.com/in/velovicd")).toBe("https://www.linkedin.com/in/velovicd");
    expect(webUrlSchema.parse(" http://primjer.com/x ")).toBe("https://primjer.com/x");
  });
  it("prazan string postaje null", () => {
    expect(webUrlSchema.parse("")).toBeNull();
    expect(linkedinUrlSchema.parse("   ")).toBeNull();
  });
  it("undefined/null prolaze", () => {
    expect(videoUrlSchema.parse(undefined)).toBeUndefined();
    expect(videoUrlSchema.parse(null)).toBeNull();
  });
  it("neispravan unos vraća poruku", () => {
    const r = linkedinUrlSchema.safeParse("https://primjer.com");
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues[0]?.message.startsWith("Greška:")).toBe(true);
  });
  it.each(["javascript:alert(1)", "https://asdf", "abc", "http://localhost"])("web sema odbija %s", (u) =>
    expect(webUrlSchema.safeParse(u).success).toBe(false),
  );
});

describe("napadacki URL-ovi", () => {
  const attacks = [
    "https://youtube.com@evil.com/watch",
    "https://youtube.com:pw@evil.com/",
    "youtube.com@evil.com",
    "https://youtube.com\@evil.com",
    "https://youtube.com.evil.com/watch",
    "https://evil.com/youtube.com",
    "https://youtu.be.evil.com/x",
    "https://notyoutube.com/x",
    "javascript:alert(1)",
    "JaVaScRiPt:alert(1)",
    "java\tscript:alert(1)",
    "data:text/html,<script>alert(1)</script>",
    "vbscript:msgbox(1)",
    "file:///etc/passwd",
    "ftp://youtube.com/x",
    "https://youtube.com:8443/x",
    "https://127.0.0.1/x",
    "https://youtube.com/x y",
  ];
  it.each(attacks)("video odbija %j", (u) => expect(isValidVideoUrl(u)).toBe(false));
  it.each(["https://youtube.com@evil.com/x", "javascript:alert(1)", "data:text/html,x", "https://a.com\@b.com"])(
    "web odbija %j",
    (u) => expect(isValidWebUrl(u)).toBe(false),
  );
  it("normalizuje http u https", () => {
    expect(videoUrlSchema.parse("http://youtu.be/abc")).toBe("https://youtu.be/abc");
  });
  it("video link duži od maksimuma se odbija", () => {
    const long = "https://www.youtube.com/watch?v=" + "a".repeat(VIDEO_URL_MAX);
    expect(videoUrlSchema.safeParse(long).success).toBe(false);
  });
  it("linkedin ostaje strog", () => {
    for (const u of ["https://linkedin.com@evil.com/in/x", "https://evil.com/in/x", "https://linkedin.com.evil.com/in/x", "javascript:alert(1)"]) {
      expect(isValidLinkedinUrl(u)).toBe(false);
    }
  });
  it("safeExternalHref propušta samo https", () => {
    expect(safeExternalHref("javascript:alert(1)")).toBeUndefined();
    expect(safeExternalHref("data:text/html,x")).toBeUndefined();
    expect(safeExternalHref(null)).toBeUndefined();
    expect(safeExternalHref("https://youtu.be/abc")).toBe("https://youtu.be/abc");
    expect(EXTERNAL_LINK_REL).toContain("nofollow");
  });
});

describe("strogi linkovi (Twitter/X, Instagram, zakazivanje)", () => {
  it.each(["x.com/jack", "https://twitter.com/jack", "http://www.twitter.com/jack/", "https://x.com/jack/status/123"])("Twitter prihvata %s", (u) =>
    expect(isValidTwitterUrl(u)).toBe(true),
  );
  it.each([
    "https://evil.com/x",
    "https://twitter.com.evil.com/jack",
    "https://eviltwitter.com/jack",
    "https://evil.com/twitter.com/jack",
    "https://twitter.com@evil.com/jack",
    "https://twitter.com:8080/jack",
    "javascript:alert(1)",
    "https://twitter.com/ja ck",
    "https://twitter.com",
    "https://twitter.com/predugackokorisnickoime",
    "https://instagram.com/jack",
  ])("Twitter odbija %s", (u) => expect(isValidTwitterUrl(u)).toBe(false));

  it.each(["instagram.com/instagram", "https://www.instagram.com/some.user_1/"])("Instagram prihvata %s", (u) =>
    expect(isValidInstagramUrl(u)).toBe(true),
  );
  it.each([
    "https://evil.com/instagram.com/x",
    "https://instagram.com.evil.com/x",
    "https://instagram.com@evil.com/x",
    "https://instagram.com:81/x",
    "https://instagram.com/",
    "https://x.com/jack",
    "javascript:alert(1)",
    "https://instagram.com/a b",
  ])("Instagram odbija %s", (u) => expect(isValidInstagramUrl(u)).toBe(false));

  it.each(["calendly.com/neko/30min", "https://cal.com/neko", "https://calendar.app.google/abc123", "https://meetings.hubspot.com/neko"])(
    "zakazivanje prihvata %s",
    (u) => expect(isValidSchedulingUrl(u)).toBe(true),
  );
  it.each([
    "https://evil.com/calendly.com/neko",
    "https://calendly.com.evil.com/neko",
    "https://evilcal.com/neko",
    "https://calendly.com@evil.com/neko",
    "https://calendly.com:444/neko",
    "https://calendly.com",
    "https://tally.so/r/abc",
    "javascript:alert(1)",
    "https://calendly.com/ne ko",
  ])("zakazivanje odbija %s", (u) => expect(isValidSchedulingUrl(u)).toBe(false));

  it("odbija linkove duže od 300 znakova", () => {
    expect(isValidSchedulingUrl(`https://cal.com/${"a".repeat(300)}`)).toBe(false);
  });
  it("šeme: http se normalizuje, strani domen pada", () => {
    expect(twitterUrlSchema.safeParse("http://x.com/jack").data).toBe("https://x.com/jack");
    expect(twitterUrlSchema.safeParse("https://evil.com/x").success).toBe(false);
    expect(instagramUrlSchema.safeParse("").data).toBeNull();
    expect(schedulingUrlSchema.safeParse("https://evil.com/x").success).toBe(false);
  });
});
