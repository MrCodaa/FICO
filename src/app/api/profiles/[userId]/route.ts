import { NextResponse } from "next/server";
import { withRoute } from "@/lib/http/withRoute";
import { container } from "@/lib/container";

export const GET = withRoute(
  async ({ ctx, params }) => {
    const result = await container.discoverService.getProfile(ctx.userId!, params.userId!);
    return NextResponse.json(result);
  },
  { guard: "approved" },
);
