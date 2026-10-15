// Kodovi grešaka i HTTP statusi iz docs/api.md.
export const ERROR_STATUS = {
  VALIDATION_ERROR: 400,
  TOKEN_INVALID: 400,
  PROFILE_INCOMPLETE: 400,

  UNAUTHENTICATED: 401,
  INVALID_CREDENTIALS: 401,

  FORBIDDEN: 403,
  EMAIL_NOT_VERIFIED: 403,
  AGREEMENT_REQUIRED: 403,
  PROFILE_NOT_APPROVED: 403,
  NOT_A_MATCH: 403,

  NOT_FOUND: 404,

  EMAIL_TAKEN: 409,
  PROFILE_LOCKED: 409,
  INVALID_STATUS: 409,
  REQUEST_EXISTS: 409,
  REQUEST_NOT_PENDING: 409,

  LIKE_LIMIT_REACHED: 429,
  TOO_MANY_REQUESTS: 429,
} as const;

export type ErrorCode = keyof typeof ERROR_STATUS;

export class ApiError extends Error {
  readonly code: ErrorCode;
  readonly status: number;
  readonly fields?: Record<string, string>;

  constructor(code: ErrorCode, message: string, fields?: Record<string, string>) {
    super(message);
    this.code = code;
    this.status = ERROR_STATUS[code];
    this.fields = fields;
  }
}
