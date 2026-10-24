/** IP klijenta iz proxy zaglavlja (prvi element x-forwarded-for, pa x-real-ip), inače "unknown". */
export function getClientIp(headers: { get(name: string): string | null }): string {
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  if (forwarded) return forwarded;
  const real = headers.get("x-real-ip")?.trim();
  return real || "unknown";
}
