import { NextResponse } from "next/server";
import { withRoute } from "@/lib/http/withRoute";
import { container } from "@/lib/container";

export const POST = withRoute(
  async ({ ctx, params }) => {
    await container.requestService.declineRequest(ctx.userId!, params.id!);
    return new NextResponse(null, { status: 204 });
  },
  { guard: "approved" },
);
