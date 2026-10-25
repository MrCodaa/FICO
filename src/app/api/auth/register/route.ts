import { NextResponse } from "next/server";
import { withRoute } from "@/lib/http/withRoute";
import { getClientIp } from "@/lib/http/clientIp";
import { container } from "@/lib/container";
import { registerSchema } from "@/features/auth/schemas";
import { SESSION_COOKIE_NAME, sessionCookieOptions } from "@/lib/auth/session";

export const POST = withRoute(
  async ({ req, body }) => {
    const { me, sessionToken } = await container.authService.register(body, getClientIp(req.headers));
    const response = NextResponse.json(me, { status: 201 });
    response.cookies.set(SESSION_COOKIE_NAME, sessionToken, sessionCookieOptions());
    return response;
  },
  { guard: "public", body: registerSchema },
);
