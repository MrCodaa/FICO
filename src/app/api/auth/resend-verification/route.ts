import { NextResponse } from "next/server";
import { withRoute } from "@/lib/http/withRoute";
import { getClientIp } from "@/lib/http/clientIp";
import { container } from "@/lib/container";

export const POST = withRoute(
  async ({ req, ctx }) => {
    await container.authService.resendVerification(ctx.userId!, getClientIp(req.headers));
    return new NextResponse(null, { status: 204 });
  },
  { guard: "auth" },
);
