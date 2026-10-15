import { z } from "zod";

export const decisionBodySchema = z.object({
  type: z.enum(["THINKING", "NOT_INTERESTED"]),
});

export type DecisionBodyInput = z.infer<typeof decisionBodySchema>;
