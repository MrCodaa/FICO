import { parseAdminPath } from "./path";

/** Samo za server: trenutni ADMIN_PATH ili null (admin ugašen). */
export function getAdminPath(): string | null {
  return parseAdminPath(process.env.ADMIN_PATH, process.env.NODE_ENV);
}
