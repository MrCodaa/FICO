import { NextResponse } from "next/server";
import { withRoute } from "@/lib/http/withRoute";
import { container } from "@/lib/container";
import { loginSchema } from "@/features/auth/schemas";
import { SESSION_COOKIE_NAME, sessionCookieOptions } from "@/lib/auth/session";

export const POST = withRoute(
  async ({ body }) => {
    const { me, sessionToken } = await container.authService.login(body);
    const response = NextResponse.json(me, { status: 200 });
    response.cookies.set(SESSION_COOKIE_NAME, sessionToken, sessionCookieOptions());
    return response;
  },
  { guard: "public", body: loginSchema },
);
