import { db } from '../../shared/db/client.js'
import { auditBriefStatus } from '../../shared/utils/audit.js'
import { createNotification } from '../notification/notification.service.js'
import { ConflictError, NotFoundError } from '../../shared/middleware/error.handler.js'
import type { Brief, BriefFilters, BriefListResult, BriefStatus } from './brief.types.js'
import type { BriefActionInput, CreateBriefInput } from './brief.schema.js'

const BRIEF_TYPE_LABELS: Record<string, string> = {
  design: 'Thiết kế',
  video_editing: 'Dựng video',
}

const PHASE_ORDER: BriefStatus[] = ['submitted', 'in_progress', 'review', 'completed']

// Valid transitions map
const TRANSITIONS: Record<BriefStatus, BriefStatus[]> = {
  submitted: ['in_progress', 'cancelled'],
  in_progress: ['review', 'cancelled'],
  review: ['completed', 'in_progress', 'cancelled'],
  completed: [],
  cancelled: [],
}

function buildBriefFromRow(row: Record<string, unknown>): Brief {
  return {
    id: row.id as string,
    brief_type_code: row.brief_type_code as 'design' | 'video_editing',
    brief_type_label: BRIEF_TYPE_LABELS[row.brief_type_code as string] ?? row.brief_type_code as string,
    title: row.title as string,
    description: row.description as string,
    size_format: row.size_format as string | null,
    deadline: (row.deadline as Date).toISOString(),
    current_status: row.current_status as BriefStatus,
    deliverable_url: row.deliverable_url as string | null,
    requested_by: {
      id: row.req_id as string,
      display_name: row.req_name as string,
      avatar_url: row.req_avatar as string | null,
    },
    assigned_to: row.asgn_id ? {
      id: row.asgn_id as string,
      display_name: row.asgn_name as string,
      avatar_url: row.asgn_avatar as string | null,
    } : null,
    post_id: row.post_id as string | null,
    created_at: (row.created_at as Date).toISOString(),
  }
}

const BASE_QUERY = `
  SELECT
    b.*,
    p_req.id   AS req_id,   p_req.display_name  AS req_name,   p_req.avatar_url  AS req_avatar,
    p_asgn.id  AS asgn_id,  p_asgn.display_name AS asgn_name,  p_asgn.avatar_url AS asgn_avatar
  FROM briefs b
  JOIN persons p_req  ON p_req.id  = b.requested_by
  LEFT JOIN persons p_asgn ON p_asgn.id = b.assigned_to
`

export async function listBriefs(userId: string, roles: string[], filters: BriefFilters): Promise<BriefListResult> {
  const isLeader = roles.some(r => ['co_leader', 'marketing_leader'].includes(r))
  const isDesign = roles.some(r => ['design_member', 'video_editor'].includes(r))

  const conditions: string[] = []
  const params: unknown[] = []
  let idx = 1

  if (!isLeader) {
    if (isDesign) {
      conditions.push(`(b.requested_by = $${idx} OR b.assigned_to = $${idx})`)
    } else {
      conditions.push(`b.requested_by = $${idx}`)
    }
    params.push(userId); idx++
  }

  if (filters.status?.length) {
    conditions.push(`b.current_status = ANY($${idx}::text[])`)
    params.push(filters.status); idx++
  }
  if (filters.brief_type) {
    conditions.push(`b.brief_type_code = $${idx}`)
    params.push(filters.brief_type); idx++
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
  const page = filters.page ?? 1
  const perPage = filters.per_page ?? 20
  const offset = (page - 1) * perPage

  const countResult = await db.query<{ count: string }>(
    `SELECT COUNT(*) FROM briefs b ${where}`, params
  )
  const total = parseInt(countResult.rows[0].count, 10)

  params.push(perPage, offset)
  const result = await db.query<Record<string, unknown>>(
    `${BASE_QUERY} ${where} ORDER BY b.created_at DESC LIMIT $${idx} OFFSET $${idx + 1}`,
    params
  )

  return {
    data: result.rows.map(buildBriefFromRow),
    meta: { total, page, per_page: perPage, has_next: offset + perPage < total, next_cursor: null },
  }
}

export async function getBriefById(briefId: string, userId: string, roles: string[]): Promise<Brief> {
  const isLeader = roles.some(r => ['co_leader', 'marketing_leader'].includes(r))

  let ownerCheck = ''
  const params: unknown[] = [briefId]
  if (!isLeader) {
    ownerCheck = `AND (b.requested_by = $2 OR b.assigned_to = $2)`
    params.push(userId)
  }

  const result = await db.query<Record<string, unknown>>(
    `${BASE_QUERY} WHERE b.id = $1 ${ownerCheck}`, params
  )
  if (!result.rows[0]) throw new NotFoundError('RESOURCE_NOT_FOUND', 'Brief không tồn tại')

  const brief = buildBriefFromRow(result.rows[0])

  // Fetch history
  const histResult = await db.query<Record<string, unknown>>(
    `SELECT bsl.event_type, p.display_name AS actor_name, bsl.notes, bsl.created_at
     FROM brief_status_log bsl
     LEFT JOIN persons p ON p.id = bsl.actor_id
     WHERE bsl.brief_id = $1 ORDER BY bsl.created_at ASC`, [briefId]
  )
  brief.status_history = histResult.rows.map(r => ({
    event_type: r.event_type as BriefStatus,
    actor_name: r.actor_name as string | null,
    notes: r.notes as string | null,
    created_at: (r.created_at as Date).toISOString(),
  }))

  return brief
}

export async function createBrief(data: CreateBriefInput, requestedById: string): Promise<Brief> {
  const result = await db.query<{ id: string }>(
    `INSERT INTO briefs (brief_type_code, title, description, deadline, size_format, post_id, requested_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
    [data.brief_type_code, data.title, data.description, data.deadline, data.size_format ?? null, data.post_id ?? null, requestedById]
  )
  const briefId = result.rows[0].id

  // Audit
  await auditBriefStatus({ brief_id: briefId, event_type: 'submitted', actor_id: requestedById })

  // Notify design/video team
  const teamResult = await db.query<{ person_id: string }>(
    `SELECT DISTINCT person_id FROM person_roles
     WHERE role_code = $1 AND valid_until IS NULL`,
    [data.brief_type_code === 'design' ? 'design_member' : 'video_editor']
  )
  for (const row of teamResult.rows) {
    await createNotification(
      row.person_id, 'lead_new', 'normal',
      'Brief mới cần xử lý',
      `Brief ${BRIEF_TYPE_LABELS[data.brief_type_code]}: "${data.title}"`,
      'brief', briefId
    ).catch(() => {})
  }

  return getBriefById(briefId, requestedById, ['co_leader'])
}

export async function performBriefAction(
  briefId: string,
  actorId: string,
  roles: string[],
  action: BriefActionInput
): Promise<Brief> {
  const isLeader = roles.some(r => ['co_leader', 'marketing_leader'].includes(r))
  const isDesign = roles.some(r => ['design_member', 'video_editor'].includes(r))

  // Fetch current brief
  const cur = await db.query<{ current_status: string; requested_by: string; assigned_to: string | null }>(
    `SELECT current_status, requested_by, assigned_to FROM briefs WHERE id = $1`, [briefId]
  )
  if (!cur.rows[0]) throw new NotFoundError('RESOURCE_NOT_FOUND', 'Brief không tồn tại')

  const currentStatus = cur.rows[0].current_status as BriefStatus
  const requestedBy = cur.rows[0].requested_by

  // Validate transition
  const allowed = TRANSITIONS[currentStatus] ?? []
  let targetStatus: BriefStatus

  switch (action.action_type) {
    case 'acknowledge': targetStatus = 'in_progress'; break
    case 'deliver':     targetStatus = 'review';       break
    case 'complete':    targetStatus = 'completed';    break
    case 'request_revision': targetStatus = 'in_progress'; break
    case 'cancel':      targetStatus = 'cancelled';   break
  }

  if (!allowed.includes(targetStatus)) {
    throw new ConflictError('INVALID_BRIEF_TRANSITION',
      `Không thể chuyển từ "${currentStatus}" sang "${targetStatus}"`)
  }

  // Role checks
  if (['acknowledge', 'deliver'].includes(action.action_type) && !isDesign && !isLeader) {
    throw new ConflictError('INSUFFICIENT_ROLE', 'Chỉ Design/Editing team mới có thể thực hiện hành động này')
  }
  if (['complete', 'request_revision'].includes(action.action_type) && isDesign && !isLeader) {
    throw new ConflictError('INSUFFICIENT_ROLE', 'Chỉ Marketing team mới có thể thực hiện hành động này')
  }
  if (action.action_type === 'cancel' && actorId !== requestedBy && !isLeader) {
    throw new ConflictError('OWNERSHIP_VIOLATION', 'Chỉ người tạo brief mới có thể huỷ')
  }

  const updates: Record<string, unknown> = { current_status: targetStatus, updated_at: new Date() }
  if (action.action_type === 'deliver') {
    updates.deliverable_url = (action as { deliverable_url: string }).deliverable_url
    updates.assigned_to = actorId
  }

  const setClauses = Object.keys(updates).map((k, i) => `${k} = $${i + 2}`).join(', ')
  await db.query(
    `UPDATE briefs SET ${setClauses} WHERE id = $1`,
    [briefId, ...Object.values(updates)]
  )

  // Audit
  await auditBriefStatus({
    brief_id: briefId,
    event_type: targetStatus,
    actor_id: actorId,
    notes: (action as { notes?: string }).notes,
  })

  // Notifications
  if (targetStatus === 'completed') {
    await createNotification(requestedBy, 'brief_completed', 'normal',
      'Brief đã hoàn thành', `Brief của bạn đã được giao nộp thành công`, 'brief', briefId).catch(() => {})
  }

  return getBriefById(briefId, actorId, isLeader ? ['marketing_leader'] : roles)
}
