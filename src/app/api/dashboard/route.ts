import { NextResponse } from "next/server";
import { withRoute } from "@/lib/http/withRoute";
import { container } from "@/lib/container";

export const GET = withRoute(
  async ({ ctx }) => NextResponse.json(await container.dashboardService.getDashboard(ctx.userId!)),
  { guard: "onboarded" },
);
