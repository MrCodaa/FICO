import { describe, expect, it } from "vitest";
import {
  isValidLinkedinUrl,
  normalizeUrlInput,
  isValidVideoUrl,
  isValidWebUrl,
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
