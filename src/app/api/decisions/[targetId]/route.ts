import { NextResponse } from "next/server";
import { withRoute } from "@/lib/http/withRoute";
import { container } from "@/lib/container";
import { decisionBodySchema } from "@/features/discover/schemas";

export const PUT = withRoute(
  async ({ ctx, params, body }) => {
    const decision = await container.discoverService.setDecision(ctx.userId!, params.targetId!, body.type);
    return NextResponse.json({ decision });
  },
  { guard: "approved", body: decisionBodySchema },
);

export const DELETE = withRoute(
  async ({ ctx, params }) => {
    await container.discoverService.clearDecision(ctx.userId!, params.targetId!);
    return new NextResponse(null, { status: 204 });
  },
  { guard: "approved" },
);
