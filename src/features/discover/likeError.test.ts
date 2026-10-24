import { describe, expect, it } from "vitest";
import { sr } from "@/content/sr";
import { ApiClientError } from "@/lib/http/apiClient";
import { likeErrorMessage } from "./likeError";

describe("likeErrorMessage", () => {
  it("prikazuje poruku validacije polja message", () => {
    const err = new ApiClientError(400, "VALIDATION_ERROR", "Neispravni podaci.", {
      message: sr.validation.noHtml,
    });
    expect(likeErrorMessage(err)).toBe(sr.validation.noHtml);
  });

  it("mapira limit i postojeći zahtjev", () => {
    expect(likeErrorMessage(new ApiClientError(429, "LIKE_LIMIT_REACHED"))).toBe(sr.requests.like.limitReached);
    expect(likeErrorMessage(new ApiClientError(409, "REQUEST_EXISTS"))).toBe(sr.requests.like.alreadyExists);
  });

  it("za ostalo vraća opštu poruku", () => {
    expect(likeErrorMessage(new ApiClientError(400, "VALIDATION_ERROR", "x", {}))).toBe(sr.requests.like.generic);
    expect(likeErrorMessage(new Error("x"))).toBe(sr.requests.like.generic);
  });
});
