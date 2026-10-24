import { z } from "zod";
import "@/lib/zodErrorMap";

export const createBlockSchema = z.object({
  userId: z.string().min(1),
});

export const createReportSchema = z.object({
  reportedId: z.string().min(1),
  reason: z.enum(["SPAM", "SELLING_SERVICES", "HIRING", "HARASSMENT", "FAKE_PROFILE", "OTHER"]),
  details: z.string().trim().max(1000).optional(),
});

export const resolveReportSchema = z.object({
  status: z.enum(["RESOLVED", "DISMISSED"]),
  deactivateUser: z.boolean().optional(),
});

export type CreateBlockInput = z.infer<typeof createBlockSchema>;
export type CreateReportInput = z.infer<typeof createReportSchema>;
export type ResolveReportInput = z.infer<typeof resolveReportSchema>;
