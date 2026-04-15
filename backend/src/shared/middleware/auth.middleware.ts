/**
 * Supabase JWT authentication middleware.
 *
 * Verifies the JWT signature locally (stateless — zero Supabase round-trips
 * per request). Looks up the authenticated person + their active roles from
 * PostgreSQL, then attaches `req.user` to the request context.
 */

import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { db } from "../db/client.js";
import { randomUUID } from "crypto";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AuthenticatedUser {
  id: string;
  supabase_uid: string;
  display_name: string;
  avatar_url: string | null;
  roles: string[];
}

/**
 * Minimal Bun-compatible request context passed between middleware and handlers.
 * Extend this interface to add more per-request state as the app grows.
 */
export interface RequestContext {
  request: Request;
  request_id: string;
  user?: AuthenticatedUser;
  url: URL;
  params: Record<string, string>;
}

type Handler = (ctx: RequestContext) => Promise<Response>;

interface SupabaseJwtPayload {
  sub: string; // Supabase user UUID
  email?: string;
  role?: string;
  iat?: number;
  exp?: number;
}

interface PersonRow {
  id: string;
  supabase_uid: string;
  display_name: string;
  avatar_url: string | null;
}

interface RoleRow {
  role_name: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function extractBearerToken(request: Request): string | null {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader) return null;
  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0]?.toLowerCase() !== "bearer") return null;
  return parts[1] ?? null;
}

function unauthorizedResponse(
  code: string,
  message: string,
  request_id: string,
  status = 401
): Response {
  return new Response(
    JSON.stringify({ code, message, request_id }),
    {
      status,
      headers: { "Content-Type": "application/json" },
    }
  );
}

// ── Middleware ────────────────────────────────────────────────────────────────

/**
 * Wraps a route handler with JWT authentication.
 *
 * Usage:
 * ```ts
 * export const handler = authMiddleware(req, async (ctx) => {
 *   const user = ctx.user!; // guaranteed after middleware
 *   return new Response(JSON.stringify(user));
 * });
 * ```
 */
export async function authMiddleware(
  ctx: RequestContext,
  handler: Handler
): Promise<Response> {
  const request_id = ctx.request_id;

  // 1. Extract Bearer token from Authorization header.
  const token = extractBearerToken(ctx.request);
  if (!token) {
    return unauthorizedResponse(
      "MISSING_TOKEN",
      "Authorization header with Bearer token is required.",
      request_id
    );
  }

  // 2. Verify JWT signature locally using JWT_SECRET (stateless).
  let payload: SupabaseJwtPayload;
  try {
    payload = jwt.verify(token, env.JWT_SECRET, {
      algorithms: ["HS256"],
    }) as SupabaseJwtPayload;
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      return unauthorizedResponse(
        "TOKEN_EXPIRED",
        "Your session has expired. Please sign in again.",
        request_id
      );
    }
    if (err instanceof jwt.JsonWebTokenError) {
      return unauthorizedResponse(
        "TOKEN_INVALID",
        "The provided token is invalid or has been tampered with.",
        request_id
      );
    }
    return unauthorizedResponse(
      "TOKEN_VERIFICATION_FAILED",
      "Token verification failed. Please sign in again.",
      request_id
    );
  }

  // 3. Extract `sub` (Supabase UID) from payload.
  const supabase_uid = payload.sub;
  if (!supabase_uid) {
    return unauthorizedResponse(
      "TOKEN_INVALID",
      "Token is missing the required subject claim.",
      request_id
    );
  }

  // 4. Lookup person record from `persons` table.
  let person: PersonRow | undefined;
  try {
    const { rows } = await db.query<PersonRow>(
      `SELECT id, supabase_uid, display_name, avatar_url
       FROM persons
       WHERE supabase_uid = $1
         AND deleted_at IS NULL
       LIMIT 1`,
      [supabase_uid]
    );
    person = rows[0];
  } catch (err) {
    console.error("[Auth] Database error during person lookup:", err);
    return new Response(
      JSON.stringify({
        code: "INTERNAL_ERROR",
        message: "An unexpected error occurred during authentication.",
        request_id,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  if (!person) {
    return unauthorizedResponse(
      "PERSON_NOT_FOUND",
      "No account found for the authenticated user. Contact an administrator.",
      request_id
    );
  }

  // 5. Lookup active roles from `person_roles` table.
  //    Active = rows where `valid_until IS NULL`.
  let roles: string[] = [];
  try {
    const { rows } = await db.query<RoleRow>(
      `SELECT role_name
       FROM person_roles
       WHERE person_id = $1
         AND valid_until IS NULL`,
      [person.id]
    );
    roles = rows.map((r) => r.role_name);
  } catch (err) {
    console.error("[Auth] Database error during role lookup:", err);
    // Roles are non-critical for auth itself — proceed with empty roles.
    // Downstream role middleware will deny access to protected routes.
    roles = [];
  }

  // 6. Attach user to context.
  ctx.user = {
    id: person.id,
    supabase_uid: person.supabase_uid,
    display_name: person.display_name,
    avatar_url: person.avatar_url,
    roles,
  };

  return handler(ctx);
}

/**
 * Create a new RequestContext from a raw Bun Request.
 */
export function createContext(request: Request, request_id?: string): RequestContext {
  return {
    request,
    request_id: request_id ?? randomUUID(),
    url: new URL(request.url),
    params: {},
  };
}
