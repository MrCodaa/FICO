import { NextResponse } from "next/server";
import { withRoute } from "@/lib/http/withRoute";
import { container } from "@/lib/container";
import { resolveReportSchema } from "@/features/safety/schemas";

export const POST = withRoute(
  async ({ params, body }) => {
    await container.safetyService.resolveReport(params.id!, body.status, body.deactivateUser);
    return new NextResponse(null, { status: 204 });
  },
  { guard: "admin", body: resolveReportSchema },
);
