import { describe, expect, it } from "vitest";
import { z } from "zod";
import { sr } from "@/content/sr";
import "@/lib/zodErrorMap";
import { registerSchema, loginSchema } from "@/features/auth/schemas";

function firstMessage(schema: z.ZodType, value: unknown): string | undefined {
  const r = schema.safeParse(value);
  return r.success ? undefined : r.error.issues[0]?.message;
}

describe("zod poruke na srpskom", () => {
  it("kratka lozinka", () => {
    const r = registerSchema.safeParse({
      firstName: "A",
      lastName: "B",
      email: "a@b.com",
      password: "kratka",
      noLinkedin: true,
    });
    expect(r.success).toBe(false);
    if (!r.success) {
      const msg = r.error.issues.find((i) => i.path[0] === "password")?.message;
      expect(msg).toBe(sr.validation.password);
      expect(msg).not.toMatch(/Too small/);
    }
  });

  it("prazno obavezno polje", () => {
    expect(firstMessage(z.object({ a: z.string() }), {})).toBe(sr.validation.required);
    expect(firstMessage(z.string().min(1), "")).toBe(sr.validation.required);
  });

  it("los email", () => {
    expect(firstMessage(loginSchema, { email: "nije-email", password: "x" })).toBe(sr.validation.email);
  });

  it("min/max znakova i nizovi", () => {
    expect(firstMessage(z.string().min(3), "ab")).toBe(sr.validation.stringMin(3));
    expect(firstMessage(z.string().max(2), "abc")).toBe(sr.validation.stringMax(2));
    expect(firstMessage(z.array(z.string()).min(1), [])).toBe(sr.validation.arrayMin(1));
  });
});
