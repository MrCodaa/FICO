import { z } from "zod";
import "@/lib/zodErrorMap";

import { sr } from "@/content/sr";

/** Polja forme: lozinka + ponovljena lozinka. API ugovor se ne mijenja (confirmPassword se ne šalje). */
export const passwordWithConfirmShape = {
  password: z.string().min(8, { error: () => sr.validation.password }),
  confirmPassword: z.string(),
};

/** Refine za formu: lozinke moraju biti iste; greška ide ispod polja "Ponovi lozinku". */
export function refinePasswordsMatch(data: { password: string; confirmPassword: string }, ctx: z.RefinementCtx) {
  if (data.password !== data.confirmPassword) {
    ctx.addIssue({ code: "custom", path: ["confirmPassword"], message: sr.auth.errors.passwordMismatch });
  }
}

export const resetPasswordFormSchema = z.object(passwordWithConfirmShape).superRefine(refinePasswordsMatch);
