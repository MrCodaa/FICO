import { NextResponse } from "next/server";
import { withRoute } from "@/lib/http/withRoute";
import { getClientIp } from "@/lib/http/clientIp";
import { container } from "@/lib/container";
import { forgotPasswordSchema } from "@/features/auth/schemas";

export const POST = withRoute(
  async ({ req, body }) => {
    await container.authService.forgotPassword(body, getClientIp(req.headers));
    return new NextResponse(null, { status: 204 });
  },
  { guard: "public", body: forgotPasswordSchema },
);
