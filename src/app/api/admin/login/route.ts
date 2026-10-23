import { NextResponse } from "next/server";
import { withRoute } from "@/lib/http/withRoute";
import { container } from "@/lib/container";
import { loginSchema } from "@/features/auth/schemas";
import { ApiError } from "@/lib/errors";
import { sr } from "@/content/sr";
import { SESSION_COOKIE_NAME, sessionCookieOptions } from "@/lib/auth/session";

// Isti login servis kao /api/auth/login, ali sesija se postavlja samo adminu.
// Ne-admin dobija istu grešku kao pogrešna lozinka i ostaje bez kolačića.
export const POST = withRoute(
  async ({ body }) => {
    const { me, sessionToken } = await container.authService.login(body);
    if (!me.isAdmin) throw new ApiError("INVALID_CREDENTIALS", sr.auth.errors.invalidCredentials);
    const response = NextResponse.json({ ok: true }, { status: 200 });
    response.cookies.set(SESSION_COOKIE_NAME, sessionToken, sessionCookieOptions());
    return response;
  },
  { guard: "public", body: loginSchema },
);
