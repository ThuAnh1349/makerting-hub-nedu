/**
 * Email client using nodemailer.
 *
 * Gracefully disabled when `OPTIONAL_SMTP_HOST` is not set.
 * All public functions are safe to call regardless — they silently
 * no-op when the SMTP transport is unconfigured.
 */

import nodemailer from "nodemailer";
import type { Transporter, SendMailOptions } from "nodemailer";
import { env } from "../../shared/config/env.js";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface SendEmailOptions {
  /** Recipient email address or array of addresses. */
  to: string | string[];
  /** Email subject line. */
  subject: string;
  /** HTML body of the email. */
  html: string;
  /** Plain-text fallback body. Auto-stripped from HTML if not provided. */
  text?: string;
  /** From address. Defaults to `OPTIONAL_SMTP_FROM` env var or a sensible default. */
  from?: string;
  /** Optional CC recipients. */
  cc?: string | string[];
  /** Optional BCC recipients. */
  bcc?: string | string[];
  /** Optional Reply-To address. */
  replyTo?: string;
}

export interface EmailResult {
  messageId: string;
  accepted: string[];
  rejected: string[];
}

// ── Initialisation ────────────────────────────────────────────────────────────

let transporter: Transporter | null = null;

const DEFAULT_FROM =
  env.OPTIONAL_SMTP_FROM ?? "Nedu Marketing Hub <noreply@nedu.vn>";

if (env.OPTIONAL_SMTP_HOST) {
  const smtpPort = parseInt(env.OPTIONAL_SMTP_PORT ?? "587", 10);
  const isSecure = smtpPort === 465; // true for SSL, false for STARTTLS

  transporter = nodemailer.createTransport({
    host: env.OPTIONAL_SMTP_HOST,
    port: smtpPort,
    secure: isSecure,
    auth:
      env.OPTIONAL_SMTP_USER && env.OPTIONAL_SMTP_PASS
        ? {
            user: env.OPTIONAL_SMTP_USER,
            pass: env.OPTIONAL_SMTP_PASS,
          }
        : undefined,
    // Increase defaults for bulk marketing sends.
    pool: true,
    maxConnections: 5,
    maxMessages: 100,
    rateDelta: 1000,
    rateLimit: 10,
  });

  // Verify the connection at startup so misconfiguration is caught early.
  transporter.verify((err) => {
    if (err) {
      console.error(
        "[Email] SMTP connection verification failed:",
        err.message
      );
      // Non-fatal — email is optional. Server continues.
    } else {
      console.log(
        `[Email] SMTP transport ready on ${env.OPTIONAL_SMTP_HOST}:${smtpPort}.`
      );
    }
  });
} else {
  console.warn(
    "[Email] OPTIONAL_SMTP_HOST is not set. Email notifications are disabled."
  );
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Returns `true` if the email transport is configured and ready to send.
 */
export function isConfigured(): boolean {
  return transporter !== null;
}

/**
 * Send an email via the configured SMTP transport.
 *
 * No-op (returns immediately without error) if SMTP is not configured.
 * Errors from the SMTP server are caught and logged — they do NOT propagate
 * to prevent email failures from crashing core business operations.
 *
 * @example
 * await sendEmail({
 *   to: "student@example.com",
 *   subject: "Your enrollment is confirmed",
 *   html: "<h1>Welcome!</h1><p>Your course starts Monday.</p>",
 * });
 */
export async function sendEmail(options: SendEmailOptions): Promise<void> {
  if (!transporter) {
    // Silently no-op — caller can check isConfigured() for stricter guarantees.
    return;
  }

  const mailOptions: SendMailOptions = {
    from: options.from ?? DEFAULT_FROM,
    to: Array.isArray(options.to) ? options.to.join(", ") : options.to,
    subject: options.subject,
    html: options.html,
    ...(options.text ? { text: options.text } : {}),
    ...(options.cc
      ? { cc: Array.isArray(options.cc) ? options.cc.join(", ") : options.cc }
      : {}),
    ...(options.bcc
      ? {
          bcc: Array.isArray(options.bcc)
            ? options.bcc.join(", ")
            : options.bcc,
        }
      : {}),
    ...(options.replyTo ? { replyTo: options.replyTo } : {}),
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(
      `[Email] Message sent to ${mailOptions.to} | messageId: ${info.messageId}`
    );
  } catch (err) {
    // Log but do NOT rethrow — email failures are non-fatal.
    console.error(
      "[Email] Failed to send email:",
      err instanceof Error ? err.message : err,
      { to: options.to, subject: options.subject }
    );
  }
}

/**
 * Send an email and return the full result including accepted/rejected lists.
 * Unlike `sendEmail`, this DOES throw on error — use when delivery confirmation
 * is required (e.g. for transactional emails where you log the outcome).
 *
 * @throws Error if SMTP is not configured or delivery fails
 */
export async function sendEmailWithResult(
  options: SendEmailOptions
): Promise<EmailResult> {
  if (!transporter) {
    throw new Error(
      "[Email] Cannot send email: SMTP transport is not configured. " +
        "Set OPTIONAL_SMTP_HOST to enable email."
    );
  }

  const mailOptions: SendMailOptions = {
    from: options.from ?? DEFAULT_FROM,
    to: Array.isArray(options.to) ? options.to.join(", ") : options.to,
    subject: options.subject,
    html: options.html,
    ...(options.text ? { text: options.text } : {}),
    ...(options.cc
      ? { cc: Array.isArray(options.cc) ? options.cc.join(", ") : options.cc }
      : {}),
    ...(options.bcc
      ? {
          bcc: Array.isArray(options.bcc)
            ? options.bcc.join(", ")
            : options.bcc,
        }
      : {}),
    ...(options.replyTo ? { replyTo: options.replyTo } : {}),
  };

  const info = await transporter.sendMail(mailOptions);

  return {
    messageId: info.messageId as string,
    accepted: (info.accepted as string[]) ?? [],
    rejected: (info.rejected as string[]) ?? [],
  };
}

/**
 * Close the SMTP connection pool. Call on graceful process shutdown.
 */
export function closeTransport(): void {
  if (transporter) {
    transporter.close();
    transporter = null;
    console.log("[Email] SMTP transport closed.");
  }
}
