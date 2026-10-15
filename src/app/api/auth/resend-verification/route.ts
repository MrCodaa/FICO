import { NextResponse } from "next/server";
import { withRoute } from "@/lib/http/withRoute";
import { container } from "@/lib/container";

export const POST = withRoute(
  async ({ ctx }) => {
    await container.authService.resendVerification(ctx.userId!);
    return new NextResponse(null, { status: 204 });
  },
  { guard: "auth" },
);
