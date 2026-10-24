// Klijentski fetch za naš REST API: jedan oblik greške za sve stranice
// ({ error: { code, message, fields } } iz docs/api.md).

export class ApiClientError extends Error {
  status: number;
  code: string;
  fields?: Record<string, unknown>;

  constructor(status: number, code: string, message?: string, fields?: Record<string, unknown>) {
    super(message ?? code);
    this.status = status;
    this.code = code;
    this.fields = fields;
  }
}

export async function apiFetch<T>(url: string, init?: RequestInit & { json?: unknown }): Promise<T> {
  const { json, ...rest } = init ?? {};
  const res = await fetch(url, {
    credentials: "include",
    ...rest,
    ...(json !== undefined
      ? { body: JSON.stringify(json), headers: { "Content-Type": "application/json", ...rest.headers } }
      : {}),
  });
  if (res.status === 204) return undefined as T;
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const error = (body as { error?: { code?: string; message?: string; fields?: Record<string, unknown> } }).error;
    throw new ApiClientError(res.status, error?.code ?? "UNKNOWN", error?.message, error?.fields);
  }
  return body as T;
}

export interface Me {
  id: string;
  email: string;
  emailVerified: boolean;
  agreementAccepted: boolean;
  profileStatus: string;
  isAdmin: boolean;
  emailBlocked?: boolean;
}

/** null = nije prijavljen (401). Ključ upita je uvijek ["me"]. */
export async function fetchMe(): Promise<Me | null> {
  try {
    return await apiFetch<Me>("/api/me");
  } catch (err) {
    if (err instanceof ApiClientError && err.status === 401) return null;
    throw err;
  }
}

export interface Counts {
  notifications: number;
  requests: number;
  messages: number;
}

export const fetchCounts = () => apiFetch<Counts>("/api/me/counts");

export const logout = () => apiFetch<void>("/api/auth/logout", { method: "POST" });
