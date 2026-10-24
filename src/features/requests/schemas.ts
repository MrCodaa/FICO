import { z } from "zod";
import "@/lib/zodErrorMap";
import { safeText } from "@/lib/sanitize";

export const createRequestSchema = z.object({
  receiverId: z.string().min(1),
  message: safeText(1, 500, { multiline: true }),
});

export type CreateRequestInput = z.infer<typeof createRequestSchema>;
