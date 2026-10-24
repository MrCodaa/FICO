import { describe, expect, it } from "vitest";
import { isAcceptablePhoto, PHOTO_MAX_BYTES } from "./photoCheck";

describe("isAcceptablePhoto", () => {
  it.each([
    ["a.jpg", "image/jpeg"],
    ["A.JPEG", "image/jpeg"],
    ["a.png", "image/png"],
    ["a.webp", "image/webp"],
  ])("prihvata %s", (name, type) => expect(isAcceptablePhoto({ name, type, size: 1000 })).toBe(true));
  it.each([
    ["a.svg", "image/svg+xml"],
    ["a.gif", "image/gif"],
    ["a.html", "text/html"],
    ["a.jpg", "text/html"],
    ["a.jpg", ""],
    ["a.html", "image/jpeg"],
    ["bez-ekstenzije", "image/png"],
    ["a.jpg.exe", "image/jpeg"],
  ])("odbija %s (%s)", (name, type) => expect(isAcceptablePhoto({ name, type, size: 1000 })).toBe(false));
  it("odbija preko 4 MB i prazan fajl", () => {
    expect(isAcceptablePhoto({ name: "a.jpg", type: "image/jpeg", size: PHOTO_MAX_BYTES + 1 })).toBe(false);
    expect(isAcceptablePhoto({ name: "a.jpg", type: "image/jpeg", size: PHOTO_MAX_BYTES })).toBe(true);
    expect(isAcceptablePhoto({ name: "a.jpg", type: "image/jpeg", size: 0 })).toBe(false);
  });
});
