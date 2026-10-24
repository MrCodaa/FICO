import { NextResponse } from "next/server";
import { withRoute } from "@/lib/http/withRoute";
import { getClientIp } from "@/lib/http/clientIp";
import { container } from "@/lib/container";
import { loginSchema } from "@/features/auth/schemas";
import { ApiError } from "@/lib/errors";
import { sr } from "@/content/sr";
import { signAdminToken } from "@/lib/auth/jwt";
import { ADMIN_COOKIE_NAME, adminCookieOptions } from "@/lib/auth/session";

// Isti login servis (i isto zaključavanje) kao /api/auth/login, ali postavlja
// SAMO admin kolačić, nikad korisničku sesiju. Ne-admin dobija istu grešku kao
// pogrešna lozinka i ostaje bez kolačića.
export const POST = withRoute(
  async ({ req, body }) => {
    const { me, tokenVersion } = await container.authService.login(body, getClientIp(req.headers));
    if (!me.isAdmin) throw new ApiError("INVALID_CREDENTIALS", sr.auth.errors.invalidCredentials);
    const adminToken = await signAdminToken({ sub: me.id, tv: tokenVersion });
    const response = NextResponse.json({ ok: true }, { status: 200 });
    response.cookies.set(ADMIN_COOKIE_NAME, adminToken, adminCookieOptions());
    return response;
  },
  { guard: "public", body: loginSchema },
);
