import { z } from "zod";
import "@/lib/zodErrorMap";
import { sr } from "@/content/sr";
import { safeText } from "@/lib/sanitize";
import { linkedinUrlSchema } from "@/features/profile/urlSchemas";

export const registerSchema = z
  .object({
    firstName: safeText(1, 100),
    lastName: safeText(1, 100),
    email: z.string().trim().toLowerCase().email(),
    password: z.string().min(8, { error: () => sr.validation.password }),
    linkedinUrl: linkedinUrlSchema,
    noLinkedin: z.boolean().default(false),
  })
  .superRefine((data, ctx) => {
    if (!data.noLinkedin && !data.linkedinUrl) {
      ctx.addIssue({ code: "custom", path: ["linkedinUrl"], message: sr.profile.errors.linkedinRequired });
    }
  })
  // "Nemam LinkedIn" poništava eventualno upisan link.
  .transform((data) => ({ ...data, linkedinUrl: data.noLinkedin ? null : (data.linkedinUrl ?? null) }));

// Prijava ne provjerava dužinu lozinke (to je pravilo registracije).
export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
});

export const verifyEmailSchema = z.object({
  token: z.string().min(1),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8, { error: () => sr.validation.password }),
});

export const agreementSchema = z.object({
  confirmations: z.array(z.literal(true)).length(6),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type AgreementInput = z.infer<typeof agreementSchema>;
