import { z } from "zod";
import "@/lib/zodErrorMap";
import { safeText } from "@/lib/sanitize";

export const sendMessageSchema = z.object({
  body: safeText(1, 2000, { multiline: true }),
});

export type SendMessageInput = z.infer<typeof sendMessageSchema>;
