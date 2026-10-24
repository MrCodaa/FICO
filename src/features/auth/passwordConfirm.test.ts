import { describe, expect, it } from "vitest";

import { sr } from "@/content/sr";

import { resetPasswordFormSchema } from "./passwordConfirm";

describe("resetPasswordFormSchema", () => {
  it("prolazi kad su lozinke iste", () => {
    expect(resetPasswordFormSchema.safeParse({ password: "abcdefgh", confirmPassword: "abcdefgh" }).success).toBe(true);
  });

  it("odbija različite lozinke greškom ispod polja Ponovi lozinku", () => {
    const r = resetPasswordFormSchema.safeParse({ password: "abcdefgh", confirmPassword: "abcdefgx" });
    expect(r.success).toBe(false);
    if (!r.success) {
      const issue = r.error.issues.find((i) => i.path[0] === "confirmPassword");
      expect(issue?.message).toBe(sr.auth.errors.passwordMismatch);
    }
  });

  it("odbija prekratku lozinku", () => {
    expect(resetPasswordFormSchema.safeParse({ password: "abc", confirmPassword: "abc" }).success).toBe(false);
  });
});
