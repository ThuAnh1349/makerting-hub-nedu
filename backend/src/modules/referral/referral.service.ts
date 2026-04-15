/**
 * Referral service.
 *
 * getAmbassadors    — list ambassadors ordered by total_referrals DESC
 * getReferralLeads  — paginated leads where utm_source = 'referral'
 */

import { db } from "../../shared/db/client.js";
import type {
  Ambassador,
  AmbassadorListResult,
  ReferralLead,
  ReferralLeadListResult,
} from "./referral.types.js";

// ── Constants ──────────────────────────────────────────────────────────────────

const REFERRAL_BASE_URL = "https://nedu.nhi.sg";

// ── Row shapes ─────────────────────────────────────────────────────────────────

interface AmbassadorRow {
  id: string;
  display_name: string;
  referral_code: string;
  total_referrals: string;
  converted_referrals: string;
  is_active: boolean;
}

interface ReferralLeadRow {
  id: string;
  full_name: string;
  phone_number: string;
  current_status: string;
  channel_code: string;
  channel_label: string;
  channel_color_hex: string;
  utm_campaign: string | null;
  ambassador_display_name: string | null;
  ops_synced_at: string;
}

interface CountRow {
  count: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function buildReferralLink(ambassadorId: string): string {
  return `${REFERRAL_BASE_URL}/?utm_source=referral&utm_campaign=ambassador-${ambassadorId}`;
}

function mapAmbassadorRow(row: AmbassadorRow): Ambassador {
  return {
    id: row.id,
    display_name: row.display_name,
    referral_code: row.referral_code,
    referral_link: buildReferralLink(row.id),
    total_referrals: parseInt(row.total_referrals, 10),
    converted_referrals: parseInt(row.converted_referrals, 10),
    is_active: row.is_active,
  };
}

function mapReferralLeadRow(row: ReferralLeadRow): ReferralLead {
  return {
    id: row.id,
    full_name: row.full_name,
    phone_number: row.phone_number,
    current_status: row.current_status,
    channel: {
      code: row.channel_code,
      label: row.channel_label,
      color_hex: row.channel_color_hex,
    },
    utm_campaign: row.utm_campaign,
    ambassador_display_name: row.ambassador_display_name,
    ops_synced_at: new Date(row.ops_synced_at).toISOString(),
  };
}

// ── getAmbassadors ─────────────────────────────────────────────────────────────

/**
 * Return ambassadors ordered by total_referrals descending.
 *
 * @param limit      Maximum number of results to return.
 * @param activeOnly When true, only returns ambassadors where is_active = true.
 */
export async function getAmbassadors(
  limit: number,
  activeOnly: boolean
): Promise<AmbassadorListResult> {
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (activeOnly) {
    conditions.push(`a.is_active = true`);
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  params.push(limit);

  const { rows } = await db.query<AmbassadorRow>(
    `SELECT
       a.id,
       a.display_name,
       a.referral_code,
       a.total_referrals,
       a.converted_referrals,
       a.is_active
     FROM ambassadors a
     ${whereClause}
     ORDER BY a.total_referrals DESC
     LIMIT $${params.length}`,
    params
  );

  return {
    data: rows.map(mapAmbassadorRow),
    meta: {
      total: rows.length,
      active_only: activeOnly,
    },
  };
}

// ── getReferralLeads ───────────────────────────────────────────────────────────

/**
 * Return paginated leads where utm_source = 'referral'.
 * Optionally filter by ambassadorId (matches utm_campaign = 'ambassador-{id}').
 * Joins ambassadors to resolve ambassador display name.
 *
 * @param ambassadorId Optional ambassador ID to filter by.
 * @param page         1-based page number.
 * @param perPage      Results per page (max 100).
 */
export async function getReferralLeads(
  ambassadorId: string | undefined,
  page: number,
  perPage: number
): Promise<ReferralLeadListResult> {
  page = Math.max(1, page);
  perPage = Math.min(100, Math.max(1, perPage));
  const offset = (page - 1) * perPage;

  const conditions: string[] = [`l.utm_source = 'referral'`];
  const params: unknown[] = [];

  if (ambassadorId) {
    params.push(`ambassador-${ambassadorId}`);
    conditions.push(`l.utm_campaign = $${params.length}`);
  }

  const whereClause = `WHERE ${conditions.join(" AND ")}`;

  const [countResult, dataResult] = await Promise.all([
    db.query<CountRow>(
      `SELECT COUNT(*) AS count
       FROM leads l
       ${whereClause}`,
      params
    ),
    db.query<ReferralLeadRow>(
      `SELECT
         l.id,
         l.full_name,
         l.phone_number,
         l.current_status,
         mc.code         AS channel_code,
         mc.label        AS channel_label,
         mc.color        AS channel_color_hex,
         l.utm_campaign,
         a.display_name  AS ambassador_display_name,
         l.ops_synced_at
       FROM leads l
       JOIN marketing_channels mc ON mc.id = l.channel_id
       LEFT JOIN ambassadors a
         ON l.utm_campaign = CONCAT('ambassador-', a.id::text)
       ${whereClause}
       ORDER BY l.ops_synced_at DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, perPage, offset]
    ),
  ]);

  const total = parseInt(countResult.rows[0]?.count ?? "0", 10);

  return {
    data: dataResult.rows.map(mapReferralLeadRow),
    meta: {
      total,
      page,
      per_page: perPage,
      has_next: page * perPage < total,
    },
  };
}
