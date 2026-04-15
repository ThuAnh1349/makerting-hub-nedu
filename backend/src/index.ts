/**
 * Nedu Marketing Hub API — Main Server Entry Point
 *
 * Bun HTTP server with:
 *   - CORS (allow all origins — internal portal only)
 *   - request_id (UUID) attached to every request
 *   - Centralised error catching → structured 500 responses
 *   - GET /health — unauthenticated liveness probe
 *   - All marketing module routes namespaced under /api/v1/marketing/
 */

import { randomUUID } from "crypto";
import { env } from "./shared/config/env.js";
import { handleError } from "./shared/middleware/error.handler.js";
import { authMiddleware, createContext } from "./shared/middleware/auth.middleware.js";
import type { RequestContext } from "./shared/middleware/auth.middleware.js";
import { db } from "./shared/db/client.js";
import { todayRoutes } from "./modules/today/today.routes.js";
import { leadRoutes } from "./modules/lead/lead.routes.js";
import { notificationRoutes } from "./modules/notification/notification.routes.js";
import { postRoutes } from "./modules/post/post.routes.js";
import { calendarRoutes } from "./modules/calendar/calendar.routes.js";
import { channelsRoutes } from "./modules/system/channels.routes.js";
import { docsRoutes } from "./modules/system/docs.routes.js";
import { analyticsRoutes } from "./modules/analytics/analytics.routes.js";
import { brandHealthRoutes } from "./modules/brand-health/brand-health.routes.js";
import { budgetRoutes } from "./modules/budget/budget.routes.js";
import { campaignRoutes } from "./modules/campaign/campaign.routes.js";
import { briefRoutes } from "./modules/brief/brief.routes.js";
import { storyRoutes } from "./modules/story/story.routes.js";
import { referralRoutes } from "./modules/referral/referral.routes.js";

// ── CORS headers ───────────────────────────────────────────────────────────────

/**
 * CORS headers for the internal marketing portal.
 * Opens all origins — restrict to specific domains before going public.
 */
const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Request-ID, X-Webhook-Secret",
  "Access-Control-Max-Age": "86400",
};

function withCors(response: Response): Response {
  const headers = new Headers(response.headers);
  for (const [key, value] of Object.entries(CORS_HEADERS)) {
    headers.set(key, value);
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...CORS_HEADERS,
    },
  });
}

// ── Route registry ────────────────────────────────────────────────────────────

type RouteHandler = (ctx: RequestContext) => Promise<Response>;

interface Route {
  method: string;
  pattern: RegExp;
  handler: RouteHandler;
  /** Whether this route requires a valid JWT. */
  authenticated: boolean;
}

const routes: Route[] = [];

function addRoute(
  method: string,
  path: string,
  handler: RouteHandler,
  authenticated = true
): void {
  // Convert express-like :param segments to named capture groups.
  const regexStr = path
    .replace(/\//g, "\\/")
    .replace(/:([a-zA-Z_]+)/g, "(?<$1>[^/]+)");
  routes.push({
    method: method.toUpperCase(),
    pattern: new RegExp(`^${regexStr}$`),
    handler,
    authenticated,
  });
}

function matchRoute(
  method: string,
  pathname: string
): { route: Route; params: Record<string, string> } | null {
  for (const route of routes) {
    if (route.method !== method.toUpperCase()) continue;
    const match = route.pattern.exec(pathname);
    if (match) {
      return {
        route,
        params: (match.groups as Record<string, string>) ?? {},
      };
    }
  }
  return null;
}

// ── Health check ──────────────────────────────────────────────────────────────

addRoute(
  "GET",
  "/health",
  async (_ctx) =>
    jsonResponse({
      status: "ok",
      timestamp: new Date().toISOString(),
      version: "1.0.0",
      environment: env.NODE_ENV,
    }),
  false // no auth required
);

// ── Module stubs for routes not yet implemented in Sprint 2 ──────────────────
// Only routes NOT covered by the real module dispatchers remain here as stubs.

const SPRINT2_STUB = (moduleName: string): RouteHandler =>
  async (ctx) =>
    jsonResponse({
      status: "stub",
      message: `${moduleName} — full implementation ships in a future sprint.`,
      request_id: ctx.request_id,
    });

// ── Content / Posts ───────────────────────────────────────────────────────────
addRoute("GET",    "/api/v1/marketing/posts",             SPRINT2_STUB("GET /posts"));
addRoute("POST",   "/api/v1/marketing/posts",             SPRINT2_STUB("POST /posts"));
addRoute("GET",    "/api/v1/marketing/posts/:id",         SPRINT2_STUB("GET /posts/:id"));
addRoute("PATCH",  "/api/v1/marketing/posts/:id",         SPRINT2_STUB("PATCH /posts/:id"));
addRoute("DELETE", "/api/v1/marketing/posts/:id",         SPRINT2_STUB("DELETE /posts/:id"));
addRoute("POST",   "/api/v1/marketing/posts/:id/submit",  SPRINT2_STUB("POST /posts/:id/submit"));
addRoute("POST",   "/api/v1/marketing/posts/:id/approve", SPRINT2_STUB("POST /posts/:id/approve"));
addRoute("POST",   "/api/v1/marketing/posts/:id/reject",  SPRINT2_STUB("POST /posts/:id/reject"));

// ── Creative Briefs ───────────────────────────────────────────────────────────
addRoute("GET",    "/api/v1/marketing/briefs",            SPRINT2_STUB("GET /briefs"));
addRoute("POST",   "/api/v1/marketing/briefs",            SPRINT2_STUB("POST /briefs"));
addRoute("GET",    "/api/v1/marketing/briefs/:id",        SPRINT2_STUB("GET /briefs/:id"));
addRoute("PATCH",  "/api/v1/marketing/briefs/:id",        SPRINT2_STUB("PATCH /briefs/:id"));
addRoute("DELETE", "/api/v1/marketing/briefs/:id",        SPRINT2_STUB("DELETE /briefs/:id"));

// ── Video / Cloudflare Stream ─────────────────────────────────────────────────
addRoute("POST",   "/api/v1/marketing/videos/upload",         SPRINT2_STUB("POST /videos/upload"));
addRoute("POST",   "/api/v1/marketing/videos/direct-upload",  SPRINT2_STUB("POST /videos/direct-upload"));
addRoute("GET",    "/api/v1/marketing/videos/:uid/status",    SPRINT2_STUB("GET /videos/:uid/status"));
addRoute("DELETE", "/api/v1/marketing/videos/:uid",           SPRINT2_STUB("DELETE /videos/:uid"));

// ── Brand Health / Crisis Protocol ───────────────────────────────────────────
addRoute("GET",    "/api/v1/marketing/brand-health",          SPRINT2_STUB("GET /brand-health"));
addRoute("POST",   "/api/v1/marketing/brand-health/crisis",   SPRINT2_STUB("POST /brand-health/crisis"));

// ── Notifications — handled by notificationRoutes() dispatcher ────────────────
// (registered as stubs for route-table completeness; dispatcher takes priority)
addRoute("GET",    "/api/v1/marketing/notifications",          SPRINT2_STUB("GET /notifications (dispatcher handles)"));
addRoute("PATCH",  "/api/v1/marketing/notifications/:id/read", SPRINT2_STUB("PATCH /notifications/:id/read (dispatcher handles)"));

// ── Persons / Users ───────────────────────────────────────────────────────────
addRoute("GET",    "/api/v1/marketing/persons/me",            async (ctx) =>
  jsonResponse({ user: ctx.user, request_id: ctx.request_id })
);
addRoute("GET",    "/api/v1/marketing/persons",               SPRINT2_STUB("GET /persons"));
addRoute("PATCH",  "/api/v1/marketing/persons/:id",           SPRINT2_STUB("PATCH /persons/:id"));

// ── Today / Dashboard ─────────────────────────────────────────────────────────
addRoute("GET",    "/api/v1/marketing/today/summary",          SPRINT2_STUB("GET /today/summary (dispatcher handles)"));

// ── Leads — handled by leadRoutes() dispatcher ────────────────────────────────
// Stubs register the URL structure; the dispatcher runs before hitting these.
addRoute("GET",    "/api/v1/marketing/leads",                  SPRINT2_STUB("GET /leads (dispatcher handles)"));
addRoute("GET",    "/api/v1/marketing/leads/:id",              SPRINT2_STUB("GET /leads/:id (dispatcher handles)"));
addRoute("POST",   "/api/v1/marketing/leads/:id/actions",      SPRINT2_STUB("POST /leads/:id/actions (dispatcher handles)"));

// ── Webhook receivers (no auth — HMAC only) ───────────────────────────────────
// POST /api/v1/marketing/leads/sync is handled by leadRoutes() before auth.
addRoute("POST",   "/api/v1/webhooks/ops",                     SPRINT2_STUB("POST /webhooks/ops"), false);

// ── Request dispatcher ────────────────────────────────────────────────────────

async function dispatch(request: Request): Promise<Response> {
  // Handle CORS preflight.
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  const request_id =
    request.headers.get("X-Request-ID") ?? randomUUID();

  const url = new URL(request.url);
  const ctx = createContext(request, request_id);

  try {
    // ── Sprint 2 module dispatchers ────────────────────────────────────────
    // These run BEFORE the route table so they fully own their URL prefixes.
    // The webhook route runs without auth; all others require a valid JWT.

    // POST /api/v1/marketing/leads/sync — webhook, no auth, read raw body first.
    if (
      request.method === "POST" &&
      url.pathname === "/api/v1/marketing/leads/sync"
    ) {
      const rawBody = new Uint8Array(await request.arrayBuffer());
      const webhookCtx = createContext(
        new Request(request.url, {
          method: request.method,
          headers: request.headers,
          body: rawBody,
        }),
        request_id
      );
      const res = await leadRoutes(request, webhookCtx, rawBody);
      if (res) return res;
    }

    // Today module — authenticated.
    if (url.pathname.startsWith("/api/v1/marketing/today/")) {
      return await authMiddleware(ctx, async (authedCtx) => {
        const res = await todayRoutes(request, authedCtx);
        if (res) return res;
        return jsonResponse(
          { code: "NOT_FOUND", message: `No route found for ${request.method} ${url.pathname}`, request_id },
          404
        );
      });
    }

    // Lead module — authenticated (except /sync handled above).
    if (url.pathname.startsWith("/api/v1/marketing/leads")) {
      return await authMiddleware(ctx, async (authedCtx) => {
        const res = await leadRoutes(request, authedCtx, undefined);
        if (res) return res;
        return jsonResponse(
          { code: "NOT_FOUND", message: `No route found for ${request.method} ${url.pathname}`, request_id },
          404
        );
      });
    }

    // Notification module — authenticated.
    if (url.pathname.startsWith("/api/v1/marketing/notifications")) {
      return await authMiddleware(ctx, async (authedCtx) => {
        const res = await notificationRoutes(request, authedCtx);
        if (res) return res;
        return jsonResponse(
          { code: "NOT_FOUND", message: `No route found for ${request.method} ${url.pathname}`, request_id },
          404
        );
      });
    }

    // Post module — authenticated.
    if (url.pathname.startsWith("/api/v1/marketing/posts")) {
      return await authMiddleware(ctx, async (authedCtx) => {
        const res = await postRoutes(request, authedCtx);
        if (res) return res;
        return jsonResponse(
          { code: "NOT_FOUND", message: `No route found for ${request.method} ${url.pathname}`, request_id },
          404
        );
      });
    }

    // Calendar module — authenticated.
    if (url.pathname === "/api/v1/marketing/calendar") {
      return await authMiddleware(ctx, async (authedCtx) => {
        const res = await calendarRoutes(request, authedCtx);
        if (res) return res;
        return jsonResponse(
          { code: "NOT_FOUND", message: `No route found for ${request.method} ${url.pathname}`, request_id },
          404
        );
      });
    }

    // System — channels & docs — authenticated.
    if (url.pathname === "/api/v1/marketing/channels") {
      return await authMiddleware(ctx, async (authedCtx) => {
        const res = await channelsRoutes(request, authedCtx);
        if (res) return res;
        return jsonResponse({ code: "NOT_FOUND", message: "Not found", request_id }, 404);
      });
    }
    if (url.pathname === "/api/v1/marketing/docs") {
      return await authMiddleware(ctx, async (authedCtx) => {
        const res = await docsRoutes(request, authedCtx);
        if (res) return res;
        return jsonResponse({ code: "NOT_FOUND", message: "Not found", request_id }, 404);
      });
    }

    // Analytics module
    if (url.pathname.startsWith("/api/v1/marketing/analytics")) {
      return await authMiddleware(ctx, async (authedCtx) => {
        const res = await analyticsRoutes(req, authedCtx)
        if (res) return res
        return jsonResponse({ code: "NOT_FOUND", message: "Not found", request_id }, 404)
      })
    }

    // Brand Health module
    if (url.pathname.startsWith("/api/v1/marketing/brand-health")) {
      return await authMiddleware(ctx, async (authedCtx) => {
        const res = await brandHealthRoutes(req, authedCtx)
        if (res) return res
        return jsonResponse({ code: "NOT_FOUND", message: "Not found", request_id }, 404)
      })
    }

    // Budget module
    if (url.pathname.startsWith("/api/v1/marketing/budget")) {
      return await authMiddleware(ctx, async (authedCtx) => {
        const res = await budgetRoutes(req, authedCtx)
        if (res) return res
        return jsonResponse({ code: "NOT_FOUND", message: "Not found", request_id }, 404)
      })
    }

    // Campaign module
    if (url.pathname.startsWith("/api/v1/marketing/campaigns")) {
      return await authMiddleware(ctx, async (authedCtx) => {
        const res = await campaignRoutes(req, authedCtx)
        if (res) return res
        return jsonResponse({ code: "NOT_FOUND", message: "Not found", request_id }, 404)
      })
    }

    // Brief module
    if (url.pathname.startsWith("/api/v1/marketing/briefs")) {
      return await authMiddleware(ctx, async (authedCtx) => {
        const res = await briefRoutes(req, authedCtx)
        if (res) return res
        return jsonResponse({ code: "NOT_FOUND", message: "Not found", request_id }, 404)
      })
    }

    // Story module
    if (url.pathname.startsWith("/api/v1/marketing/stories")) {
      return await authMiddleware(ctx, async (authedCtx) => {
        const res = await storyRoutes(req, authedCtx)
        if (res) return res
        return jsonResponse({ code: "NOT_FOUND", message: "Not found", request_id }, 404)
      })
    }

    // Referral module
    if (url.pathname.startsWith("/api/v1/marketing/referral")) {
      return await authMiddleware(ctx, async (authedCtx) => {
        const res = await referralRoutes(req, authedCtx)
        if (res) return res
        return jsonResponse({ code: "NOT_FOUND", message: "Not found", request_id }, 404)
      })
    }

    // ── Fallback: legacy route table ──────────────────────────────────────
    const matched = matchRoute(request.method, url.pathname);

    if (!matched) {
      return jsonResponse(
        {
          code: "NOT_FOUND",
          message: `No route found for ${request.method} ${url.pathname}`,
          request_id,
        },
        404
      );
    }

    ctx.params = matched.params;

    if (matched.route.authenticated) {
      return await authMiddleware(ctx, matched.route.handler);
    }
    return await matched.route.handler(ctx);
  } catch (err) {
    return handleError(err, request_id);
  }
}

// ── Graceful shutdown ─────────────────────────────────────────────────────────

async function gracefulShutdown(signal: string): Promise<void> {
  console.log(`\n[Server] Received ${signal}. Shutting down gracefully...`);
  await db.end();
  console.log("[Server] Shutdown complete.");
  process.exit(0);
}

process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));

// ── Start server ──────────────────────────────────────────────────────────────

const server = Bun.serve({
  port: env.PORT,
  hostname: "0.0.0.0",

  fetch: async (request) => {
    try {
      const response = await dispatch(request);
      return withCors(response);
    } catch (unexpectedErr) {
      // Last-resort catch — should not be reached because dispatch() catches internally.
      const request_id = request.headers.get("X-Request-ID") ?? randomUUID();
      console.error("[Server] Unhandled top-level error:", unexpectedErr);
      return withCors(handleError(unexpectedErr, request_id));
    }
  },

  error(err) {
    // Bun-level socket or server errors (not HTTP errors).
    console.error("[Server] Bun server error:", err.message);
    return new Response(
      JSON.stringify({
        code: "SERVER_ERROR",
        message: "Internal server error.",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          ...CORS_HEADERS,
        },
      }
    );
  },
});

console.log(
  `[Server] Nedu Marketing Hub API running on http://${server.hostname}:${server.port} ` +
    `| env: ${env.NODE_ENV}`
);
console.log(`[Server] Health check: GET http://localhost:${server.port}/health`);

export default server;
