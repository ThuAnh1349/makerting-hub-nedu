/**
 * Centralised error handler.
 *
 * Converts thrown errors into standard JSON ErrorResponse objects.
 * Never leaks internal stack traces to clients in production.
 */

import { ZodError, ZodIssue } from "zod";

// ── Response shape ─────────────────────────────────────────────────────────────

export interface ErrorResponse {
  code: string;
  message: string;
  details?: object;
  request_id: string;
}

export interface ZodViolation {
  field: string;
  message: string;
  received?: unknown;
}

// ── Known application error ───────────────────────────────────────────────────

/**
 * Throw this anywhere in the application to produce a structured HTTP error
 * without an unhandled exception trace.
 *
 * @example
 * throw new AppError("LEAD_NOT_FOUND", "Lead with that ID does not exist.", 404);
 */
export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly details?: object;

  constructor(
    code: string,
    message: string,
    statusCode = 500,
    details?: object
  ) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

// ── Specific well-known application errors ────────────────────────────────────

export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    super(
      "NOT_FOUND",
      id
        ? `${resource} with id "${id}" was not found.`
        : `${resource} was not found.`,
      404
    );
  }
}

export class ConflictError extends AppError {
  constructor(message: string, details?: object) {
    super("CONFLICT", message, 409, details);
  }
}

export class BadRequestError extends AppError {
  constructor(message: string, details?: object) {
    super("BAD_REQUEST", message, 400, details);
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(service: string, reason?: string) {
    super(
      "SERVICE_UNAVAILABLE",
      reason
        ? `${service} is currently unavailable: ${reason}`
        : `${service} is currently unavailable.`,
      503
    );
  }
}

// ── Zod violation formatter ───────────────────────────────────────────────────

function formatZodViolations(issues: ZodIssue[]): ZodViolation[] {
  return issues.map((issue) => ({
    field: issue.path.join(".") || "root",
    message: issue.message,
    received:
      "received" in issue
        ? (issue as ZodIssue & { received?: unknown }).received
        : undefined,
  }));
}

// ── Main handler ──────────────────────────────────────────────────────────────

/**
 * Convert any thrown error into a standard HTTP Response.
 *
 * Priority:
 *   1. ZodError → 422 Unprocessable Entity with field-level violations
 *   2. AppError → mapped to its `statusCode` and `code`
 *   3. Everything else → 500 Internal Server Error
 *
 * @param err        The caught error (unknown type — we handle all shapes)
 * @param request_id The UUID attached to this request for traceability
 */
export function handleError(err: unknown, request_id: string): Response {
  // ── 1. Zod validation failure ──────────────────────────────────────────────
  if (err instanceof ZodError) {
    const violations = formatZodViolations(err.issues);
    const body: ErrorResponse = {
      code: "VALIDATION_ERROR",
      message: `Request validation failed with ${violations.length} violation(s).`,
      details: { violations },
      request_id,
    };
    return new Response(JSON.stringify(body), {
      status: 422,
      headers: { "Content-Type": "application/json" },
    });
  }

  // ── 2. Known application errors ────────────────────────────────────────────
  if (err instanceof AppError) {
    const body: ErrorResponse = {
      code: err.code,
      message: err.message,
      request_id,
      ...(err.details !== undefined ? { details: err.details } : {}),
    };
    return new Response(JSON.stringify(body), {
      status: err.statusCode,
      headers: { "Content-Type": "application/json" },
    });
  }

  // ── 3. Generic / unexpected errors ────────────────────────────────────────
  const isDev = process.env["NODE_ENV"] !== "production";
  const internalMessage = err instanceof Error ? err.message : String(err);

  // Always log to server console for observability.
  console.error(
    `[ErrorHandler] Unhandled error [request_id=${request_id}]:`,
    err
  );

  const body: ErrorResponse = {
    code: "INTERNAL_SERVER_ERROR",
    message: "An unexpected error occurred. Please try again later.",
    request_id,
    ...(isDev
      ? { details: { internal_message: internalMessage } }
      : {}),
  };

  return new Response(JSON.stringify(body), {
    status: 500,
    headers: { "Content-Type": "application/json" },
  });
}
