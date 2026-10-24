import { z } from "zod";
import "@/lib/zodErrorMap";

export const sendMessageSchema = z.object({
  body: z.string().trim().min(1).max(2000),
});

export type SendMessageInput = z.infer<typeof sendMessageSchema>;
