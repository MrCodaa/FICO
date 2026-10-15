import { NextResponse } from "next/server";
import { z } from "zod";
import { withRoute } from "@/lib/http/withRoute";
import { container } from "@/lib/container";

const querySchema = z.object({ cursor: z.string().optional() });

export const GET = withRoute(
  async ({ ctx, query }) => {
    const result = await container.requestService.listSent(ctx.userId!, query.cursor);
    return NextResponse.json(result);
  },
  { guard: "approved", query: querySchema },
);
