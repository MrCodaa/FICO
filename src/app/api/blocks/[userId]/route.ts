import { NextResponse } from "next/server";
import { withRoute } from "@/lib/http/withRoute";
import { container } from "@/lib/container";

export const DELETE = withRoute(
  async ({ ctx, params }) => {
    await container.safetyService.unblockUser(ctx.userId!, params.userId!);
    return new NextResponse(null, { status: 204 });
  },
  { guard: "approved" },
);
