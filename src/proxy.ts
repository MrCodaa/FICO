import { NextResponse, type NextRequest } from "next/server";

import { getAdminPath } from "@/lib/admin/config";
import { decideAdminRoute } from "@/lib/admin/route";
import { ADMIN_COOKIE_NAME } from "@/lib/auth/session";

function hardenAdmin(response: NextResponse): NextResponse {
  response.headers.set("Cache-Control", "no-store");
  response.headers.set("X-Robots-Tag", "noindex, nofollow");
  return response;
}

export function proxy(req: NextRequest) {
  const decision = decideAdminRoute({
    pathname: req.nextUrl.pathname,
    adminPath: getAdminPath(),
    hasAdminCookie: Boolean(req.cookies.get(ADMIN_COOKIE_NAME)?.value),
  });

  if (decision.action === "next") return NextResponse.next();

  if (decision.action === "notFound") {
    // Stranice: rewrite na nepostojeću rutu daje standardni 404. API: prazan 404.
    return hardenAdmin(
      decision.api
        ? new NextResponse(null, { status: 404 })
        : NextResponse.rewrite(new URL("/__nije-pronadjeno", req.url)),
    );
  }

  const url = req.nextUrl.clone();
  url.pathname = decision.to;
  return hardenAdmin(NextResponse.rewrite(url));
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
