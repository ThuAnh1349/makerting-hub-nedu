/**
 * Lead repository — all database access for the Lead module.
 *
 * All queries build parameterised SQL manually (no ORM).
 * RLS is enforced at the query layer (not Postgres RLS):
 *   - staff/marketing_staff: only see leads assigned to them
 *   - co_leader/marketing_leader/admin/super_admin: see all leads
 */

import { db } from "../../shared/db/client.js";
import type {
  Lead,
  LeadFilters,
  LeadListResult,
  LeadStatus,
  LeadActionType,
  LeadActionEvent,
} from "./lead.types.js";

// ── Role check ────────────────────────────────────────────────────────────────

function isLeader(roles: string[]): boolean {
  return roles.some((r) =>
    ["co_leader", "marketing_leader", "admin", "super_admin"].includes(r)
  );
}

// ── Row shapes ─────────────────────────────────────────────────────────────────

interface LeadRow {
  id: string;
  full_name: string;
  phone_number: string;
  message_preview: string | null;
  channel_code: string;
  channel_label: string;
  channel_color_hex: string;
  utm_source: string;
  utm_medium: string | null;
  utm_campaign: string | null;
  current_status: string;
  return_reason: string | null;
  assigned_to_id: string | null;
  assigned_to_name: string | null;
  assigned_to_avatar: string | null;
  minutes_waiting: string;
  sla_overdue: boolean;
  ops_synced_at: string;
  last_action_at: string | null;
}

interface LeadActionRow {
  event_type: string;
  actor_name: string | null;
  payload: Record<string, unknown> | null;
  created_at: string;
}

interface CountRow {
  count: string;
}

// ── Shared SELECT fragment ────────────────────────────────────────────────────

const LEAD_SELECT = `
  l.id,
  l.full_name,
  l.phone_number,
  l.message_preview,
  c.code       AS channel_code,
  c.label      AS channel_label,
  c.color_hex  AS channel_color_hex,
  l.utm_source,
  l.utm_medium,
  l.utm_campaign,
  l.current_status,
  l.return_reason,
  p.id         AS assigned_to_id,
  p.display_name AS assigned_to_name,
  p.avatar_url AS assigned_to_avatar,
  EXTRACT(EPOCH FROM (NOW() - l.ops_synced_at)) / 60 AS minutes_waiting,
  (l.ops_synced_at < NOW() - INTERVAL '15 minutes') AS sla_overdue,
  l.ops_synced_at,
  l.last_action_at
`;

const LEAD_JOINS = `
  FROM leads l
  JOIN channels c ON c.code = l.channel_code
  LEFT JOIN persons p ON p.id = l.assigned_to
`;

function mapLeadRow(row: LeadRow): Lead {
  return {
    id: row.id,
    full_name: row.full_name,
    phone_number: row.phone_number,
    message_preview: row.message_preview,
    channel: {
      code: row.channel_code,
      label: row.channel_label,
      color_hex: row.channel_color_hex,
    },
    utm_source: row.utm_source,
    utm_medium: row.utm_medium,
    utm_campaign: row.utm_campaign,
    current_status: row.current_status as LeadStatus,
    return_reason: row.return_reason,
    assigned_to:
      row.assigned_to_id !== null
        ? {
            id: row.assigned_to_id,
            display_name: row.assigned_to_name ?? "",
            avatar_url: row.assigned_to_avatar,
          }
        : null,
    minutes_waiting: Math.round(parseFloat(row.minutes_waiting)),
    sla_overdue: row.sla_overdue,
    ops_synced_at: new Date(row.ops_synced_at).toISOString(),
    last_action_at: row.last_action_at
      ? new Date(row.last_action_at).toISOString()
      : null,
  };
}

// ── findLeads ─────────────────────────────────────────────────────────────────

export async function findLeads(
  userId: string,
  roles: string[],
  filters: LeadFilters
): Promise<LeadListResult> {
  const leader = isLeader(roles);
  const page = Math.max(1, filters.page ?? 1);
  const perPage = Math.min(100, Math.max(1, filters.per_page ?? 20));
  const offset = (page - 1) * perPage;

  const params: unknown[] = [];
  const conditions: string[] = [];

  // RLS filter
  if (!leader) {
    params.push(userId);
    conditions.push(`l.assigned_to = $${params.length}`);
  }

  if (filters.status && filters.status.length > 0) {
    params.push(filters.status);
    conditions.push(`l.current_status = ANY($${params.length}::text[])`);
  }

  if (filters.channel_code) {
    params.push(filters.channel_code);
    conditions.push(`l.channel_code = $${params.length}`);
  }

  if (filters.assigned_to && leader) {
    params.push(filters.assigned_to);
    conditions.push(`l.assigned_to = $${params.length}`);
  }

  if (filters.sla_overdue_only) {
    conditions.push(`l.ops_synced_at < NOW() - INTERVAL '15 minutes'`);
    conditions.push(`l.current_status = 'new'`);
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  // Count query
  const countSql = `
    SELECT COUNT(*) AS count
    ${LEAD_JOINS}
    ${whereClause}
  `;
  const countResult = await db.query<CountRow>(countSql, params);
  const total = parseInt(countResult.rows[0]?.count ?? "0", 10);

  // Data query
  params.push(perPage);
  const limitIdx = params.length;
  params.push(offset);
  const offsetIdx = params.length;

  const dataSql = `
    SELECT ${LEAD_SELECT}
    ${LEAD_JOINS}
    ${whereClause}
    ORDER BY l.ops_synced_at DESC
    LIMIT $${limitIdx} OFFSET $${offsetIdx}
  `;
  const dataResult = await db.query<LeadRow>(dataSql, params);

  return {
    data: dataResult.rows.map(mapLeadRow),
    pagination: {
      page,
      per_page: perPage,
      total,
      total_pages: Math.ceil(total / perPage),
    },
  };
}

// ── findLeadById ──────────────────────────────────────────────────────────────

export async function findLeadById(
  leadId: string,
  userId: string,
  roles: string[]
): Promise<Lead | null> {
  const leader = isLeader(roles);

  const params: unknown[] = [leadId];
  const extraCondition = leader ? "" : `AND l.assigned_to = $2`;
  if (!leader) params.push(userId);

  const sql = `
    SELECT ${LEAD_SELECT}
    ${LEAD_JOINS}
    WHERE l.id = $1
    ${extraCondition}
    LIMIT 1
  `;

  const { rows } = await db.query<LeadRow>(sql, params);
  if (rows.length === 0) return null;

  const lead = mapLeadRow(rows[0]!);

  // Fetch action history
  const historySql = `
    SELECT
      la.action       AS event_type,
      p.display_name  AS actor_name,
      la.metadata     AS payload,
      la.created_at
    FROM lead_actions la
    LEFT JOIN persons p ON p.id = la.actor_person_id
    WHERE la.lead_id = $1
    ORDER BY la.created_at DESC
    LIMIT 100
  `;
  const historyResult = await db.query<LeadActionRow>(historySql, [leadId]);

  lead.action_history = historyResult.rows.map((row) => ({
    event_type: row.event_type as LeadActionType,
    actor_name: row.actor_name,
    payload: row.payload ?? {},
    created_at: new Date(row.created_at).toISOString(),
  })) as LeadActionEvent[];

  return lead;
}

// ── updateLeadStatus ──────────────────────────────────────────────────────────

export async function updateLeadStatus(
  leadId: string,
  newStatus: LeadStatus,
  returnReason?: string | null
): Promise<void> {
  await db.query(
    `UPDATE leads
     SET current_status = $2,
         return_reason  = $3,
         last_action_at = NOW()
     WHERE id = $1`,
    [leadId, newStatus, returnReason ?? null]
  );
}

// ── getLeadCurrentStatus ──────────────────────────────────────────────────────

export async function getLeadCurrentStatus(
  leadId: string
): Promise<{ current_status: LeadStatus; assigned_to: string | null } | null> {
  const { rows } = await db.query<{
    current_status: string;
    assigned_to: string | null;
  }>(
    `SELECT current_status, assigned_to FROM leads WHERE id = $1 LIMIT 1`,
    [leadId]
  );
  if (rows.length === 0) return null;
  return {
    current_status: rows[0]!.current_status as LeadStatus,
    assigned_to: rows[0]!.assigned_to,
  };
}

// ── insertLead ────────────────────────────────────────────────────────────────

export interface InsertLeadData {
  ops_lead_id: string;
  full_name: string;
  phone_number: string;
  channel_code: string;
  utm_source: string;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  assigned_to?: string | null;
  message_preview?: string | null;
}

export async function insertLead(data: InsertLeadData): Promise<string> {
  const { rows } = await db.query<{ id: string }>(
    `INSERT INTO leads (
       ops_lead_id, full_name, phone_number, channel_code,
       utm_source, utm_medium, utm_campaign,
       assigned_to, message_preview,
       current_status, ops_synced_at
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'new', NOW())
     ON CONFLICT (ops_lead_id)
     DO UPDATE SET
       full_name     = EXCLUDED.full_name,
       phone_number  = EXCLUDED.phone_number,
       channel_code  = EXCLUDED.channel_code,
       utm_source    = EXCLUDED.utm_source,
       utm_medium    = EXCLUDED.utm_medium,
       utm_campaign  = EXCLUDED.utm_campaign,
       assigned_to   = EXCLUDED.assigned_to,
       ops_synced_at = NOW()
     RETURNING id`,
    [
      data.ops_lead_id,
      data.full_name,
      data.phone_number,
      data.channel_code,
      data.utm_source,
      data.utm_medium ?? null,
      data.utm_campaign ?? null,
      data.assigned_to ?? null,
      data.message_preview ?? null,
    ]
  );

  return rows[0]!.id;
}

// ── findLeadByOpsId ───────────────────────────────────────────────────────────

export async function findLeadByOpsId(
  opsLeadId: string
): Promise<{ id: string; assigned_to: string | null } | null> {
  const { rows } = await db.query<{ id: string; assigned_to: string | null }>(
    `SELECT id, assigned_to FROM leads WHERE ops_lead_id = $1 LIMIT 1`,
    [opsLeadId]
  );
  return rows[0] ?? null;
}

// ── insertLeadAction ──────────────────────────────────────────────────────────

export interface InsertLeadActionData {
  lead_id: string;
  actor_person_id: string;
  action: LeadActionType;
  previous_status?: LeadStatus | null;
  new_status?: LeadStatus | null;
  notes?: string | null;
  metadata?: Record<string, unknown> | null;
}

export async function insertLeadAction(
  data: InsertLeadActionData
): Promise<void> {
  await db.query(
    `INSERT INTO lead_actions (
       lead_id, actor_person_id, action,
       previous_status, new_status, notes, metadata, created_at
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
    [
      data.lead_id,
      data.actor_person_id,
      data.action,
      data.previous_status ?? null,
      data.new_status ?? null,
      data.notes ?? null,
      data.metadata ? JSON.stringify(data.metadata) : null,
    ]
  );
}
