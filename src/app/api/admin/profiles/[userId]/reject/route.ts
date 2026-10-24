import { NextResponse } from "next/server";
import { z } from "zod";
import "@/lib/zodErrorMap";
import { withRoute } from "@/lib/http/withRoute";
import { container } from "@/lib/container";

const rejectSchema = z.object({
  reason: z.string().trim().min(1).max(1000),
});

export const POST = withRoute(
  async ({ params, body }) => {
    await container.profileService.rejectProfile(params.userId!, body.reason);
    return new NextResponse(null, { status: 204 });
  },
  { guard: "admin", body: rejectSchema },
);
