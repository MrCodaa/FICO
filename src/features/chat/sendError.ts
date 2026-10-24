import { sr } from "@/content/sr";
import { ApiClientError } from "@/lib/http/apiClient";

/** Poruka korisniku kad slanje chat poruke ne uspije (npr. markup u tekstu). */
export function sendErrorMessage(error: unknown): string {
  if (error instanceof ApiClientError && error.code === "VALIDATION_ERROR") {
    const field = error.fields?.body;
    if (typeof field === "string" && field) return field;
  }
  return sr.chat.sendError;
}
