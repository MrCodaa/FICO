import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/siteUrl";
import { PUBLIC_PATHS } from "@/lib/seo/publicPages";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getSiteUrl();
  return PUBLIC_PATHS.map((path) => ({ url: path === "/" ? base : `${base}${path}` }));
}
