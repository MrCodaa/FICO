import { describe, expect, it } from "vitest";
import { sr } from "@/content/sr";
import { ApiClientError } from "@/lib/http/apiClient";
import { sendErrorMessage } from "./sendError";

describe("sendErrorMessage", () => {
  it("prikazuje poruku validacije polja body", () => {
    const err = new ApiClientError(400, "VALIDATION_ERROR", "Neispravni podaci.", { body: sr.validation.noHtml });
    expect(sendErrorMessage(err)).toBe(sr.validation.noHtml);
  });

  it("za ostale greške vraća opštu poruku", () => {
    expect(sendErrorMessage(new ApiClientError(403, "FORBIDDEN"))).toBe(sr.chat.sendError);
    expect(sendErrorMessage(new Error("x"))).toBe(sr.chat.sendError);
  });
});
