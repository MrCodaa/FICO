import { NextResponse, type NextRequest } from "next/server";

import { getAdminPath } from "@/lib/admin/config";
import { decideAdminRoute } from "@/lib/admin/route";
import { refreshAdminToken } from "@/lib/auth/jwt";
import { ADMIN_COOKIE_NAME, adminCookieOptions } from "@/lib/auth/session";

function hardenAdmin(response: NextResponse): NextResponse {
  response.headers.set("Cache-Control", "no-store");
  response.headers.set("X-Robots-Tag", "noindex, nofollow");
  return response;
}

export async function proxy(req: NextRequest) {
  const adminToken = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
  const decision = decideAdminRoute({
    pathname: req.nextUrl.pathname,
    adminPath: getAdminPath(),
    hasAdminCookie: Boolean(adminToken),
  });

  if (decision.action === "next") return NextResponse.next();

  if (decision.action === "notFound") {
    // Stranice: rewrite na nepostojeću rutu daje isti 404 (app/not-found.tsx) kao bilo koja
    // nepoznata adresa, bez ikakvih dodatnih zaglavlja. API: prazan 404.
    return decision.api
      ? hardenAdmin(new NextResponse(null, { status: 404 }))
      : NextResponse.rewrite(new URL("/__nije-pronadjeno", req.url));
  }

  const url = req.nextUrl.clone();
  url.pathname = decision.to;
  const response = hardenAdmin(NextResponse.rewrite(url));
  // Klizni rok neaktivnosti: dok admin radi, `last` u tokenu se povremeno osvježava.
  if (adminToken && !url.pathname.endsWith("/logout")) {
    const refreshed = await refreshAdminToken(adminToken);
    if (refreshed) response.cookies.set(ADMIN_COOKIE_NAME, refreshed, adminCookieOptions());
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
