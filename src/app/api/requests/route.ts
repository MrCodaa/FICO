import { NextResponse } from "next/server";
import { withRoute } from "@/lib/http/withRoute";
import { container } from "@/lib/container";
import { createRequestSchema } from "@/features/requests/schemas";

export const POST = withRoute(
  async ({ ctx, body }) => {
    const request = await container.requestService.sendRequest(ctx.userId!, body);
    return NextResponse.json({ request }, { status: 201 });
  },
  { guard: "approved", body: createRequestSchema },
);
