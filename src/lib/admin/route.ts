// Odluka proxy-ja za admin adrese kao čista funkcija (testira se bez Next-a).
import { INTERNAL_ADMIN_API_PREFIX, INTERNAL_ADMIN_PREFIX } from "./path";

export type AdminRouteDecision =
  | { action: "next" }
  | { action: "notFound"; api: boolean }
  | { action: "rewrite"; to: string };

const under = (pathname: string, prefix: string) => pathname === prefix || pathname.startsWith(`${prefix}/`);

// API rute koje rade i bez admin kolačića (prijava; odjava čisti istekli kolačić).
const COOKIELESS_API = new Set(["/login", "/logout"]);

export function decideAdminRoute(input: {
  pathname: string;
  adminPath: string | null;
  hasAdminCookie: boolean;
}): AdminRouteDecision {
  const { adminPath, hasAdminCookie } = input;
  const pathname = input.pathname.length > 1 ? input.pathname.replace(/\/+$/, "") : input.pathname;

  // Interne i "očigledne" adrese nikad nisu javne.
  if (under(pathname, "/admin") || under(pathname, INTERNAL_ADMIN_PREFIX)) return { action: "notFound", api: false };
  if (under(pathname, INTERNAL_ADMIN_API_PREFIX)) return { action: "notFound", api: true };

  if (!adminPath || !under(pathname, adminPath)) return { action: "next" };

  const rest = pathname.slice(adminPath.length); // "" ili "/..."
  // Tačan ADMIN_PATH: forma za prijavu (bez sesije) ili panel (sa sesijom); odlučuje stranica.
  if (rest === "") return { action: "rewrite", to: INTERNAL_ADMIN_PREFIX };

  if (under(rest, "/api")) {
    const apiRest = rest.slice("/api".length);
    if (apiRest === "") return { action: "notFound", api: true };
    if (!hasAdminCookie && !COOKIELESS_API.has(apiRest)) return { action: "notFound", api: true };
    return { action: "rewrite", to: `${INTERNAL_ADMIN_API_PREFIX}${apiRest}` };
  }

  // Ostale stranice bez admin kolačića: običan 404, bez preusmjeravanja.
  if (!hasAdminCookie) return { action: "notFound", api: false };
  return { action: "rewrite", to: `${INTERNAL_ADMIN_PREFIX}${rest}` };
}
