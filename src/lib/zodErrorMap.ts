import { z } from "zod";
import { sr } from "@/content/sr";

/** Poruka za zod problem koji nema svoju poruku; undefined = ostavi zodovu podrazumijevanu. */
export function srZodMessage(issue: z.core.$ZodRawIssue): string | undefined {
  const v = sr.validation;
  switch (issue.code) {
    case "invalid_type":
      if (issue.input === undefined || issue.input === null) return v.required;
      if (issue.expected === "number" || issue.expected === "int") return v.notNumber;
      return v.invalid;
    case "too_small": {
      const n = Number(issue.minimum);
      if (issue.origin === "string") {
        if (n <= 1) return v.required;
        return v.stringMin(n);
      }
      if (issue.origin === "array" || issue.origin === "set") {
        if (issue.exact) return v.arrayExact(n);
        return v.arrayMin(n);
      }
      if (issue.origin === "number" || issue.origin === "int") return v.numberMin(n);
      return v.invalid;
    }
    case "too_big": {
      const n = Number(issue.maximum);
      if (issue.origin === "string") return issue.exact ? v.stringExact(n) : v.stringMax(n);
      if (issue.origin === "array" || issue.origin === "set") return issue.exact ? v.arrayExact(n) : v.arrayMax(n);
      if (issue.origin === "number" || issue.origin === "int") return v.numberMax(n);
      return v.invalid;
    }
    case "invalid_format":
      if (issue.format === "email") return v.email;
      if (issue.format === "url") return v.url;
      return v.invalid;
    case "invalid_value":
      return v.option;
    case "not_multiple_of":
      return v.notInteger;
    case "custom":
      return v.invalid;
    default:
      return v.invalid;
  }
}

let installed = false;

/** Postavlja globalni zod error map (jednom). Uvozi se iz svih modula sa šemama, pa radi i na serveru i na klijentu. */
export function installZodErrorMap() {
  if (installed) return;
  installed = true;
  z.config({ customError: srZodMessage });
}

installZodErrorMap();
