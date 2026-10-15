import { NextResponse } from "next/server";
import { withRoute } from "@/lib/http/withRoute";
import { container } from "@/lib/container";

export const GET = withRoute(
  async ({ ctx }) => {
    const counts = await container.notificationService.getCounts(ctx.userId!);
    return NextResponse.json(counts);
  },
  { guard: "auth" },
);
