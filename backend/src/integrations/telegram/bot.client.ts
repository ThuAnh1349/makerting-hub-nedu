/**
 * Telegram Bot client.
 *
 * Gracefully disabled when `OPTIONAL_TELEGRAM_BOT_TOKEN` is not set.
 * All public functions are safe to call regardless — they silently
 * no-op when the bot is unconfigured.
 *
 * IMPORTANT — Crisis Protocol exception:
 *   POST /brand-health/crisis REQUIRES Telegram. That endpoint must call
 *   `isConfigured()` and return HTTP 503 if this module is disabled.
 */

import { env } from "../../shared/config/env.js";

// ── State ──────────────────────────────────────────────────────────────────────

const BOT_TOKEN = env.OPTIONAL_TELEGRAM_BOT_TOKEN;
const DEFAULT_CHAT_ID = env.OPTIONAL_TELEGRAM_CHAT_ID;

const TELEGRAM_API_BASE = BOT_TOKEN
  ? `https://api.telegram.org/bot${BOT_TOKEN}`
  : null;

if (BOT_TOKEN) {
  console.log("[Telegram] Bot client initialised.");
} else {
  console.warn(
    "[Telegram] OPTIONAL_TELEGRAM_BOT_TOKEN is not set. " +
      "Telegram notifications are disabled. " +
      "POST /brand-health/crisis will return 503 until the token is configured."
  );
}

// ── Types ─────────────────────────────────────────────────────────────────────

export type TelegramParseMode = "HTML" | "Markdown" | "MarkdownV2";

export interface SendMessageOptions {
  /** Parse mode for message formatting. Defaults to "HTML". */
  parse_mode?: TelegramParseMode;
  /** Disable link preview below the message. */
  disable_web_page_preview?: boolean;
  /** Send silently — user receives no notification sound. */
  disable_notification?: boolean;
  /** Reply to a specific message ID. */
  reply_to_message_id?: number;
}

interface TelegramApiResponse {
  ok: boolean;
  result?: unknown;
  error_code?: number;
  description?: string;
}

// ── Internal helpers ──────────────────────────────────────────────────────────

async function callTelegramApi(
  method: string,
  body: Record<string, unknown>
): Promise<TelegramApiResponse> {
  if (!TELEGRAM_API_BASE) {
    throw new Error("[Telegram] Bot is not configured.");
  }

  let response: globalThis.Response;
  try {
    response = await fetch(`${TELEGRAM_API_BASE}/${method}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch (networkErr) {
    throw new Error(
      `[Telegram] Network error calling ${method}: ${
        networkErr instanceof Error ? networkErr.message : String(networkErr)
      }`
    );
  }

  const data = (await response.json()) as TelegramApiResponse;

  if (!data.ok) {
    throw new Error(
      `[Telegram] API error on ${method}: [${data.error_code}] ${data.description}`
    );
  }

  return data;
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Returns `true` if the Telegram bot is configured and ready to send messages.
 *
 * Use this check in the Crisis Protocol endpoint:
 * ```ts
 * if (!isConfigured()) {
 *   return new Response(JSON.stringify({ code: 'SERVICE_UNAVAILABLE', ... }), { status: 503 });
 * }
 * ```
 */
export function isConfigured(): boolean {
  return BOT_TOKEN !== undefined && BOT_TOKEN.trim() !== "";
}

/**
 * Send a text message to a Telegram chat.
 *
 * No-op (returns immediately without error) if the bot is not configured.
 * Supports HTML formatting by default.
 *
 * @param chatId  Telegram chat ID or username. Falls back to
 *                `OPTIONAL_TELEGRAM_CHAT_ID` env var if not provided.
 * @param text    Message text (HTML tags allowed with default parse_mode).
 * @param options Additional Telegram message options.
 *
 * @example
 * // Ops alert
 * await sendMessage(
 *   env.OPTIONAL_TELEGRAM_CHAT_ID!,
 *   '<b>CRISIS ALERT</b>\n\nBrand health score dropped below threshold.'
 * );
 */
export async function sendMessage(
  chatId: string | number | undefined,
  text: string,
  options: SendMessageOptions = {}
): Promise<void> {
  if (!isConfigured()) {
    // Silently no-op — caller must check isConfigured() if they need guarantees.
    return;
  }

  const resolvedChatId = chatId ?? DEFAULT_CHAT_ID;
  if (!resolvedChatId) {
    console.warn(
      "[Telegram] sendMessage called but no chatId provided and " +
        "OPTIONAL_TELEGRAM_CHAT_ID is not set. Message skipped."
    );
    return;
  }

  try {
    await callTelegramApi("sendMessage", {
      chat_id: resolvedChatId,
      text,
      parse_mode: options.parse_mode ?? "HTML",
      disable_web_page_preview: options.disable_web_page_preview ?? false,
      disable_notification: options.disable_notification ?? false,
      ...(options.reply_to_message_id !== undefined
        ? { reply_to_message_id: options.reply_to_message_id }
        : {}),
    });
  } catch (err) {
    // Log but do NOT rethrow — notification failures must not crash business logic.
    console.error(
      "[Telegram] Failed to send message:",
      err instanceof Error ? err.message : err
    );
  }
}

/**
 * Send a message to the default ops chat configured via
 * `OPTIONAL_TELEGRAM_CHAT_ID`. Convenience wrapper for internal alerts.
 *
 * @example
 * await sendOpsAlert('<b>Payment failed</b>\nOrder #123 could not be processed.');
 */
export async function sendOpsAlert(
  text: string,
  options?: SendMessageOptions
): Promise<void> {
  return sendMessage(DEFAULT_CHAT_ID, text, options);
}

/**
 * Send a photo to a Telegram chat.
 *
 * No-op if the bot is not configured.
 *
 * @param chatId  Target chat ID
 * @param photoUrl  Public URL of the image
 * @param caption  Optional caption (HTML supported)
 */
export async function sendPhoto(
  chatId: string | number,
  photoUrl: string,
  caption?: string
): Promise<void> {
  if (!isConfigured()) return;

  try {
    await callTelegramApi("sendPhoto", {
      chat_id: chatId,
      photo: photoUrl,
      ...(caption ? { caption, parse_mode: "HTML" } : {}),
    });
  } catch (err) {
    console.error(
      "[Telegram] Failed to send photo:",
      err instanceof Error ? err.message : err
    );
  }
}
