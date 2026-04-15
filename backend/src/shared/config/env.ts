/**
 * Environment variable validation and export.
 * Fails fast at startup if any REQUIRED variable is missing.
 * Optional variables disable features gracefully — no crash.
 */

const REQUIRED_VARS = [
  "DATABASE_URL",
  "JWT_SECRET",
  "SUPABASE_URL",
  "CLOUDFLARE_ACCOUNT_ID",
  "CLOUDFLARE_API_TOKEN",
  "OPS_WEBHOOK_SECRET",
] as const;

type RequiredVar = (typeof REQUIRED_VARS)[number];

function requireVar(name: RequiredVar): string {
  const value = process.env[name];
  if (!value || value.trim() === "") {
    throw new Error(
      `[ENV] REQUIRED environment variable "${name}" is missing or empty. ` +
        `Set it in your .env file or system environment before starting the server.`
    );
  }
  return value.trim();
}

function optionalVar(name: string): string | undefined {
  const value = process.env[name];
  if (!value || value.trim() === "") return undefined;
  return value.trim();
}

// Validate all required vars at module load time — fail fast.
const missing: string[] = [];
for (const varName of REQUIRED_VARS) {
  if (!process.env[varName] || process.env[varName]!.trim() === "") {
    missing.push(varName);
  }
}

if (missing.length > 0) {
  throw new Error(
    `[ENV] Server startup aborted. The following REQUIRED environment variables are missing:\n` +
      missing.map((v) => `  - ${v}`).join("\n") +
      `\n\nProvide them via .env file or system environment.`
  );
}

/**
 * Typed environment configuration.
 *
 * Required vars are guaranteed non-empty strings.
 * Optional vars may be undefined — always check before use.
 *
 * Special rule: OPTIONAL_TELEGRAM_BOT_TOKEN is optional at startup,
 * but the Crisis Protocol endpoint (POST /brand-health/crisis) MUST
 * check `env.OPTIONAL_TELEGRAM_BOT_TOKEN` and return 503 if missing.
 */
export const env = {
  // ── Required ──────────────────────────────────────────────────────────────
  DATABASE_URL: requireVar("DATABASE_URL"),
  JWT_SECRET: requireVar("JWT_SECRET"),
  SUPABASE_URL: requireVar("SUPABASE_URL"),
  CLOUDFLARE_ACCOUNT_ID: requireVar("CLOUDFLARE_ACCOUNT_ID"),
  CLOUDFLARE_API_TOKEN: requireVar("CLOUDFLARE_API_TOKEN"),
  OPS_WEBHOOK_SECRET: requireVar("OPS_WEBHOOK_SECRET"),

  // ── Optional — feature flags ───────────────────────────────────────────────
  // Telegram: gracefully disabled when missing.
  // EXCEPTION: POST /brand-health/crisis returns 503 if this is missing.
  OPTIONAL_TELEGRAM_BOT_TOKEN: optionalVar("OPTIONAL_TELEGRAM_BOT_TOKEN"),
  OPTIONAL_TELEGRAM_CHAT_ID: optionalVar("OPTIONAL_TELEGRAM_CHAT_ID"),

  // Email: gracefully disabled when missing.
  OPTIONAL_SMTP_HOST: optionalVar("OPTIONAL_SMTP_HOST"),
  OPTIONAL_SMTP_PORT: optionalVar("OPTIONAL_SMTP_PORT"),
  OPTIONAL_SMTP_USER: optionalVar("OPTIONAL_SMTP_USER"),
  OPTIONAL_SMTP_PASS: optionalVar("OPTIONAL_SMTP_PASS"),
  OPTIONAL_SMTP_FROM: optionalVar("OPTIONAL_SMTP_FROM"),

  // Cloudflare Stream watermark — optional feature.
  CLOUDFLARE_STREAM_WATERMARK_UID: optionalVar(
    "CLOUDFLARE_STREAM_WATERMARK_UID"
  ),

  // ── Runtime ───────────────────────────────────────────────────────────────
  NODE_ENV: (process.env["NODE_ENV"] ?? "development") as
    | "development"
    | "production"
    | "test",
  PORT: parseInt(process.env["PORT"] ?? "3000", 10),
} as const;

export type Env = typeof env;
