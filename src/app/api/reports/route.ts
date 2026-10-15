import { NextResponse } from "next/server";
import { withRoute } from "@/lib/http/withRoute";
import { container } from "@/lib/container";
import { createReportSchema } from "@/features/safety/schemas";

export const POST = withRoute(
  async ({ ctx, body }) => {
    const report = await container.safetyService.createReport(ctx.userId!, body);
    return NextResponse.json(report, { status: 201 });
  },
  { guard: "approved", body: createReportSchema },
);
