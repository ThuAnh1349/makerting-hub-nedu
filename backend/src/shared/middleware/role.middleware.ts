/**
 * Role-based access control middleware.
 *
 * Use after `authMiddleware` — requires `ctx.user` to be populated.
 * Returns 403 if the authenticated user does not hold at least one
 * of the `allowedRoles`.
 */

import type { RequestContext } from "./auth.middleware.js";

type Handler = (ctx: RequestContext) => Promise<Response>;

/**
 * Returns a middleware guard that enforces role membership.
 *
 * @param allowedRoles - At least one of these roles must be present in
 *                       `ctx.user.roles` for the request to proceed.
 *
 * Usage:
 * ```ts
 * const adminOnly = requireRoles(["admin", "super_admin"]);
 *
 * export async function handleRoute(ctx: RequestContext): Promise<Response> {
 *   return adminOnly(ctx, async (ctx) => {
 *     // ctx.user is guaranteed and has the required role here
 *     return new Response("OK");
 *   });
 * }
 * ```
 */
export function requireRoles(allowedRoles: string[]) {
  if (allowedRoles.length === 0) {
    throw new Error(
      "[requireRoles] allowedRoles must contain at least one role name."
    );
  }

  return async function roleGuard(
    ctx: RequestContext,
    handler: Handler
  ): Promise<Response> {
    // Auth middleware must run before this guard.
    if (!ctx.user) {
      return new Response(
        JSON.stringify({
          code: "UNAUTHENTICATED",
          message:
            "requireRoles guard invoked without a prior auth check. " +
            "Ensure authMiddleware runs before requireRoles.",
          request_id: ctx.request_id,
        }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const userRoles = new Set(ctx.user.roles);
    const hasRequiredRole = allowedRoles.some((role) => userRoles.has(role));

    if (!hasRequiredRole) {
      return new Response(
        JSON.stringify({
          code: "INSUFFICIENT_ROLE",
          message: `Access denied. This resource requires one of the following roles: ${allowedRoles.join(", ")}.`,
          required_roles: allowedRoles,
          your_roles: ctx.user.roles,
          request_id: ctx.request_id,
        }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    return handler(ctx);
  };
}

// ── Pre-built role guards for common permission tiers ─────────────────────────

/** Only users with the `admin` or `super_admin` role. */
export const requireAdmin = requireRoles(["admin", "super_admin"]);

/** Content creators and above. */
export const requireContentCreator = requireRoles([
  "content_creator",
  "content_manager",
  "admin",
  "super_admin",
]);

/** Marketing managers and above. */
export const requireMarketingManager = requireRoles([
  "marketing_manager",
  "admin",
  "super_admin",
]);

/** Operations team and above. */
export const requireOps = requireRoles([
  "ops",
  "ops_manager",
  "admin",
  "super_admin",
]);
