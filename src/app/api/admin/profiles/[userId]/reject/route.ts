import { NextResponse } from "next/server";
import { z } from "zod";
import "@/lib/zodErrorMap";
import { optionalSafeText } from "@/lib/sanitize";
import { withRoute } from "@/lib/http/withRoute";
import { container } from "@/lib/container";

const rejectSchema = z.object({
  reason: optionalSafeText(1000, { multiline: true }),
});

export const POST = withRoute(
  async ({ params, body }) => {
    await container.profileService.rejectProfile(params.userId!, body.reason);
    return new NextResponse(null, { status: 204 });
  },
  { guard: "admin", body: rejectSchema },
);
