import { z } from "zod";

export const createRequestSchema = z.object({
  receiverId: z.string().min(1),
  message: z.string().trim().min(1).max(500),
});

export type CreateRequestInput = z.infer<typeof createRequestSchema>;
