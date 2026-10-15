import { NextResponse } from "next/server";
import { z } from "zod";
import { withRoute } from "@/lib/http/withRoute";
import { container } from "@/lib/container";

const querySchema = z.object({
  type: z.enum(["THINKING", "NOT_INTERESTED"]),
  cursor: z.string().optional(),
});

export const GET = withRoute(
  async ({ ctx, query }) => {
    const result = await container.discoverService.listDecisions(ctx.userId!, query.type, query.cursor, 20);
    return NextResponse.json(result);
  },
  { guard: "approved", query: querySchema },
);
