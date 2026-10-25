/** Javni osnovni URL sajta iz APP_URL (bez završne kose crte); lokalno se vraća na localhost. */
export function getSiteUrl(env: Record<string, string | undefined> = process.env): string {
  const raw = env.APP_URL?.trim();
  if (raw) {
    try {
      return new URL(raw).origin;
    } catch {
      // neispravan APP_URL: padamo na lokalnu adresu umjesto da srušimo build
    }
  }
  return "http://localhost:3000";
}
