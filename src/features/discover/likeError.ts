import { sr } from "@/content/sr";
import { ApiClientError } from "@/lib/http/apiClient";

/** Poruka korisniku kad slanje lajka ne uspije; greška validacije poruke prikazuje svoj tekst. */
export function likeErrorMessage(error: unknown): string {
  if (error instanceof ApiClientError) {
    if (error.code === "LIKE_LIMIT_REACHED") return sr.requests.like.limitReached;
    if (error.code === "REQUEST_EXISTS") return sr.requests.like.alreadyExists;
    if (error.code === "VALIDATION_ERROR") {
      const field = error.fields?.message;
      if (typeof field === "string" && field) return field;
    }
  }
  return sr.requests.like.generic;
}
