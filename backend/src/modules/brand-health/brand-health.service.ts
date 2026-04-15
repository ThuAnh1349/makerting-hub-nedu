/**
 * Brand Health service.
 *
 * getBrandHealth    — retrieve recent brand health entries
 * upsertBrandHealth — upsert a weekly brand health record
 * activateCrisis    — activate the crisis protocol (requires Telegram)
 */

import { db } from "../../shared/db/client.js";
import {
  BadRequestError,
  ConflictError,
  ServiceUnavailableError,
} from "../../shared/middleware/error.handler.js";
import { createNotification } from "../notification/notification.service.js";
import {
  sendMessage,
  isConfigured,
} from "../../integrations/telegram/bot.client.js";
import type { BrandHealthEntry, CrisisProtocol } from "./brand-health.types.js";
import type { UpsertBrandHealthInput, ActivateCrisisInput } from "./brand-health.schema.js";

// ── Row shapes ─────────────────────────────────────────────────────────────────

interface BrandHealthRow {
  id: string;
  week_start: string;
  nps_score: string | null;
  share_of_voice_pct: string | null;
  brand_mentions: string | null;
  sentiment_positive: string | null;
  sentiment_neutral: string | null;
  sentiment_negative: string | null;
  negative_topics: string; // JSON string from DB
  data_source: string;
  recorded_by_name: string;
  created_at: string;
}

interface CrisisRow {
  id: string;
  title: string;
  description: string | null;
  activated_by_name: string;
  steps_status: string; // JSON string
  is_resolved: boolean;
  resolved_at: string | null;
  created_at: string;
}

interface LeaderRow {
  person_id: string;
  telegram_chat_id: string | null;
}

// ── Mappers ────────────────────────────────────────────────────────────────────

function mapBrandHealthRow(row: BrandHealthRow): BrandHealthEntry {
  return {
    id: row.id,
    week_start: row.week_start,
    nps_score: row.nps_score !== null ? Number(row.nps_score) : null,
    share_of_voice_pct:
      row.share_of_voice_pct !== null ? Number(row.share_of_voice_pct) : null,
    brand_mentions: row.brand_mentions !== null ? Number(row.brand_mentions) : null,
    sentiment_positive:
      row.sentiment_positive !== null ? Number(row.sentiment_positive) : null,
    sentiment_neutral:
      row.sentiment_neutral !== null ? Number(row.sentiment_neutral) : null,
    sentiment_negative:
      row.sentiment_negative !== null ? Number(row.sentiment_negative) : null,
    negative_topics:
      typeof row.negative_topics === "string"
        ? (JSON.parse(row.negative_topics) as Array<{ topic: string; mention_count: number }>)
        : (row.negative_topics as unknown as Array<{ topic: string; mention_count: number }>),
    data_source: row.data_source as BrandHealthEntry["data_source"],
    recorded_by_name: row.recorded_by_name,
    created_at: new Date(row.created_at).toISOString(),
  };
}

function mapCrisisRow(row: CrisisRow): CrisisProtocol {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    activated_by_name: row.activated_by_name,
    steps_status:
      typeof row.steps_status === "string"
        ? (JSON.parse(row.steps_status) as CrisisProtocol["steps_status"])
        : (row.steps_status as unknown as CrisisProtocol["steps_status"]),
    is_resolved: row.is_resolved,
    resolved_at: row.resolved_at ? new Date(row.resolved_at).toISOString() : null,
    created_at: new Date(row.created_at).toISOString(),
  };
}

// ── Helpers ────────────────────────────────────────────────────────────────────

async function getMarketingLeaders(): Promise<LeaderRow[]> {
  const { rows } = await db.query<LeaderRow>(
    `SELECT pr.person_id, p.telegram_chat_id
     FROM person_roles pr
     JOIN persons p ON p.id = pr.person_id
     WHERE pr.role_name = 'marketing_leader'
       AND pr.valid_until IS NULL
       AND p.deleted_at IS NULL`
  );
  return rows;
}

// ── getBrandHealth ─────────────────────────────────────────────────────────────

/**
 * Return the last N weeks of brand health entries, newest first.
 */
export async function getBrandHealth(weeks: number): Promise<BrandHealthEntry[]> {
  const { rows } = await db.query<BrandHealthRow>(
    `SELECT
       bhe.id,
       bhe.week_start::text,
       bhe.nps_score,
       bhe.share_of_voice_pct,
       bhe.brand_mentions,
       bhe.sentiment_positive,
       bhe.sentiment_neutral,
       bhe.sentiment_negative,
       bhe.negative_topics,
       bhe.data_source,
       p.display_name AS recorded_by_name,
       bhe.created_at
     FROM brand_health_entries bhe
     JOIN persons p ON p.id = bhe.recorded_by_id
     ORDER BY bhe.week_start DESC
     LIMIT $1`,
    [weeks]
  );

  return rows.map(mapBrandHealthRow);
}

// ── upsertBrandHealth ──────────────────────────────────────────────────────────

/**
 * Upsert a weekly brand health record.
 *
 * Validates that week_start is a Monday.
 * If nps_score < 30, fires SLA alert notifications to all marketing_leaders.
 */
export async function upsertBrandHealth(
  data: UpsertBrandHealthInput,
  recordedById: string
): Promise<BrandHealthEntry> {
  const { week_start } = data;

  // Validate Monday (belt-and-suspenders — schema also validates this,
  // but service is the enforcement layer).
  const weekDate = new Date(week_start);
  if (weekDate.getDay() !== 1) {
    throw new BadRequestError("INVALID_WEEK_START");
  }

  const { rows } = await db.query<{ id: string }>(
    `INSERT INTO brand_health_entries (
       week_start, nps_score, share_of_voice_pct, brand_mentions,
       sentiment_positive, sentiment_neutral, sentiment_negative,
       negative_topics, data_source, recorded_by_id, updated_at
     )
     VALUES ($1::date, $2, $3, $4, $5, $6, $7, $8::jsonb, $9, $10, NOW())
     ON CONFLICT (week_start)
     DO UPDATE SET
       nps_score           = EXCLUDED.nps_score,
       share_of_voice_pct  = EXCLUDED.share_of_voice_pct,
       brand_mentions      = EXCLUDED.brand_mentions,
       sentiment_positive  = EXCLUDED.sentiment_positive,
       sentiment_neutral   = EXCLUDED.sentiment_neutral,
       sentiment_negative  = EXCLUDED.sentiment_negative,
       negative_topics     = EXCLUDED.negative_topics,
       data_source         = EXCLUDED.data_source,
       recorded_by_id      = EXCLUDED.recorded_by_id,
       updated_at          = NOW()
     RETURNING id`,
    [
      week_start,
      data.nps_score ?? null,
      data.share_of_voice_pct ?? null,
      data.brand_mentions ?? null,
      data.sentiment_positive ?? null,
      data.sentiment_neutral ?? null,
      data.sentiment_negative ?? null,
      JSON.stringify(data.negative_topics ?? []),
      data.data_source,
      recordedById,
    ]
  );

  const entryId = rows[0]!.id;

  // Fire SLA alert if NPS is critically low.
  if (data.nps_score !== null && data.nps_score !== undefined && data.nps_score < 30) {
    const leaders = await getMarketingLeaders();
    await Promise.allSettled(
      leaders.map((leader) =>
        createNotification(
          leader.person_id,
          "sla_alert",
          "alert",
          "Brand Health Alert: Low NPS Score",
          `NPS score of ${data.nps_score} recorded for week starting ${week_start}. Immediate attention required.`,
          undefined,
          entryId
        )
      )
    );
  }

  // Fetch and return the full entry.
  const { rows: fullRows } = await db.query<BrandHealthRow>(
    `SELECT
       bhe.id,
       bhe.week_start::text,
       bhe.nps_score,
       bhe.share_of_voice_pct,
       bhe.brand_mentions,
       bhe.sentiment_positive,
       bhe.sentiment_neutral,
       bhe.sentiment_negative,
       bhe.negative_topics,
       bhe.data_source,
       p.display_name AS recorded_by_name,
       bhe.created_at
     FROM brand_health_entries bhe
     JOIN persons p ON p.id = bhe.recorded_by_id
     WHERE bhe.id = $1`,
    [entryId]
  );

  return mapBrandHealthRow(fullRows[0]!);
}

// ── activateCrisis ────────────────────────────────────────────────────────────

/**
 * Activate the brand crisis protocol.
 *
 * Pre-conditions:
 *   - No active crisis exists (is_resolved = false)
 *   - Telegram must be configured
 *
 * On success:
 *   - Inserts a crisis_protocol row
 *   - Sends Telegram message to all marketing_leaders
 *   - Creates in-app notification for all marketing_leaders
 */
export async function activateCrisis(
  input: ActivateCrisisInput,
  activatedById: string
): Promise<CrisisProtocol> {
  // Check for existing active crisis.
  const { rows: activeRows } = await db.query<{ id: string }>(
    `SELECT id FROM crisis_protocols WHERE is_resolved = false LIMIT 1`
  );
  if (activeRows.length > 0) {
    throw new ConflictError("CRISIS_ALREADY_ACTIVE");
  }

  // Telegram must be configured for crisis protocol.
  if (!isConfigured()) {
    throw new ServiceUnavailableError("TELEGRAM_NOT_CONFIGURED");
  }

  // Insert the crisis record.
  const defaultSteps = [
    { step: 1, label: "Acknowledge crisis", completed: false, completed_at: null },
    { step: 2, label: "Notify stakeholders", completed: false, completed_at: null },
    { step: 3, label: "Assess impact", completed: false, completed_at: null },
    { step: 4, label: "Deploy response plan", completed: false, completed_at: null },
    { step: 5, label: "Monitor and report", completed: false, completed_at: null },
    { step: 6, label: "Post-crisis review", completed: false, completed_at: null },
  ];

  const { rows: insertRows } = await db.query<{ id: string }>(
    `INSERT INTO crisis_protocols (
       title, description, activated_by_id, steps_status,
       is_resolved, created_at
     )
     VALUES ($1, $2, $3, $4::jsonb, false, NOW())
     RETURNING id`,
    [input.title, input.description ?? null, activatedById, JSON.stringify(defaultSteps)]
  );

  const crisisId = insertRows[0]!.id;

  // Notify all marketing leaders.
  const leaders = await getMarketingLeaders();

  const telegramMessage =
    `<b>🚨 CRISIS PROTOCOL ACTIVATED</b>\n\n` +
    `<b>Title:</b> ${input.title}\n` +
    (input.description ? `<b>Description:</b> ${input.description}\n` : "") +
    `\nImmediate action required. Login to the Marketing Hub for details.`;

  // Send Telegram + in-app notifications concurrently (non-fatal failures).
  await Promise.allSettled([
    ...leaders.map((leader) =>
      sendMessage(leader.telegram_chat_id ?? undefined, telegramMessage)
    ),
    ...leaders.map((leader) =>
      createNotification(
        leader.person_id,
        "crisis_activated",
        "alert",
        `Crisis Protocol Activated: ${input.title}`,
        input.description ??
          "A brand crisis protocol has been activated. Immediate action required.",
        undefined,
        crisisId
      )
    ),
  ]);

  // Fetch and return the full crisis record.
  const { rows: crisisRows } = await db.query<CrisisRow>(
    `SELECT
       cp.id,
       cp.title,
       cp.description,
       p.display_name AS activated_by_name,
       cp.steps_status,
       cp.is_resolved,
       cp.resolved_at,
       cp.created_at
     FROM crisis_protocols cp
     JOIN persons p ON p.id = cp.activated_by_id
     WHERE cp.id = $1`,
    [crisisId]
  );

  return mapCrisisRow(crisisRows[0]!);
}
