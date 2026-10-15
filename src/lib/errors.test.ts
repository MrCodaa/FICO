import { describe, expect, it } from "vitest";
import { ApiError } from "@/lib/errors";

describe("ApiError", () => {
  it("izvodi HTTP status iz koda greške", () => {
    const error = new ApiError("EMAIL_TAKEN", "Email je zauzet.");
    expect(error.status).toBe(409);
    expect(error.code).toBe("EMAIL_TAKEN");
  });

  it("nosi fields za VALIDATION_ERROR", () => {
    const error = new ApiError("VALIDATION_ERROR", "Neispravno.", { email: "Obavezno polje" });
    expect(error.status).toBe(400);
    expect(error.fields?.email).toBe("Obavezno polje");
  });
});
