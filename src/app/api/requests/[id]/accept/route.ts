import { NextResponse } from "next/server";
import { withRoute } from "@/lib/http/withRoute";
import { container } from "@/lib/container";

export const POST = withRoute(
  async ({ ctx, params }) => {
    const result = await container.requestService.acceptRequest(ctx.userId!, params.id!);
    return NextResponse.json(result);
  },
  { guard: "approved" },
);
