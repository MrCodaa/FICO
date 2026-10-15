import { NextResponse } from "next/server";
import { z } from "zod";
import { withRoute } from "@/lib/http/withRoute";
import { container } from "@/lib/container";

const querySchema = z.object({
  status: z.enum(["OPEN", "RESOLVED", "DISMISSED"]),
  cursor: z.string().optional(),
});

export const GET = withRoute(
  async ({ query }) => {
    const result = await container.safetyService.listReports(query.status, query.cursor, 20);
    return NextResponse.json(result);
  },
  { guard: "admin", query: querySchema },
);
