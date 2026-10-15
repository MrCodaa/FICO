import { NextResponse } from "next/server";
import { withRoute } from "@/lib/http/withRoute";
import { container } from "@/lib/container";

export const GET = withRoute(
  async ({ ctx }) => {
    const me = await container.authService.me(ctx.userId!);
    return NextResponse.json(me, { status: 200 });
  },
  { guard: "auth" },
);
