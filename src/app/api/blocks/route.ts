import { NextResponse } from "next/server";
import { withRoute } from "@/lib/http/withRoute";
import { container } from "@/lib/container";
import { createBlockSchema } from "@/features/safety/schemas";

export const POST = withRoute(
  async ({ ctx, body }) => {
    await container.safetyService.blockUser(ctx.userId!, body.userId);
    return new NextResponse(null, { status: 204 });
  },
  { guard: "approved", body: createBlockSchema },
);
