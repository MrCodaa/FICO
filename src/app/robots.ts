import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/siteUrl";
import { DISALLOWED_PATHS } from "@/lib/seo/publicPages";

// Admin adresa (ADMIN_PATH) se ovdje namjerno NE pominje: robots.txt je javan, a panel štiti
// 404 za nepoznate, a proxy.ts šalje X-Robots-Tag: noindex.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: [...DISALLOWED_PATHS] }],
    sitemap: `${getSiteUrl()}/sitemap.xml`,
  };
}
