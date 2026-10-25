import { renderBrandImage } from "@/lib/seo/brandImage";

export const alt = "FICO — Find Co-Founder za Balkan";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return renderBrandImage(size.width, size.height);
}
