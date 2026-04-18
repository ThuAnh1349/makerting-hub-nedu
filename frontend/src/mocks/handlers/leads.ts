// src/mocks/handlers/leads.ts
import { http, HttpResponse } from 'msw'
import {
  getCurrentMockUserId,
  unauthorized,
  forbidden,
  notFound,
} from '../config'
import { MOCK_LEADS, MOCK_LEAD_MESSAGES } from '../data/leads'
import type { Lead, LeadMessage } from '@modules/leads/types'

export const leadsHandlers = [
  // ─── LIST leads ──────────────────────────────────────────────
  http.get('*/api/mkt/leads', async ({ request }) => {
    const personId = await getCurrentMockUserId()
    if (!personId) return unauthorized()

    const url     = new URL(request.url)
    const page    = Number(url.searchParams.get('page')   ?? '1')
    const limit   = Number(url.searchParams.get('limit')  ?? '20')
    const status  = url.searchParams.get('status')
    const channel = url.searchParams.get('channel')
    const q       = url.searchParams.get('q')?.toLowerCase()

    let items: Lead[] = Object.values(MOCK_LEADS).flat()
    if (status)  items = items.filter(l => l.status === status)
    if (channel) items = items.filter(l => l.channel === channel)
    if (q) {
      items = items.filter(l =>
        l.lead_name.toLowerCase().includes(q) ||
        l.message_preview.toLowerCase().includes(q),
      )
    }

    const total = items.length
    const paged = items.slice((page - 1) * limit, page * limit)
    return HttpResponse.json({ data: paged, meta: { page, limit, total } })
  }),

  // ─── GET ONE ─────────────────────────────────────────────────
  http.get('*/api/mkt/leads/:id', async ({ params }) => {
    const personId = await getCurrentMockUserId()
    if (!personId) return unauthorized()

    const lead = Object.values(MOCK_LEADS).flat().find(l => l.id === params.id)
    if (!lead) return notFound()
    return HttpResponse.json({ data: lead })
  }),

  // ─── PATCH classify ──────────────────────────────────────────
  http.patch('*/api/mkt/leads/:id', async ({ params, request }) => {
    const personId = await getCurrentMockUserId()
    if (!personId) return unauthorized()

    const allLeads = Object.values(MOCK_LEADS).flat()
    const lead = allLeads.find(l => l.id === params.id)
    if (!lead) return notFound()
    if (lead.person_id !== personId) return forbidden('Not your lead')

    const body = await request.json() as Partial<Lead>
    Object.assign(lead, { ...body, updated_at: new Date().toISOString() })
    return HttpResponse.json({ data: lead })
  }),

  // ─── POST lead-pushes (v1.2: đổi từ /leads/bulk-push) ────────
  http.post('*/api/mkt/lead-pushes', async () => {
    const personId = await getCurrentMockUserId()
    if (!personId) return unauthorized()

    const hotLeads = Object.values(MOCK_LEADS).flat().filter(l => l.status === 'hot')
    if (hotLeads.length === 0) {
      return HttpResponse.json(
        {
          statusCode: 422,
          message: 'Không có Hot Lead nào để push',
          error: 'Unprocessable Entity',
          code: 'MKT_NO_HOT_LEADS',
        },
        { status: 422 },
      )
    }

    const now = new Date().toISOString()
    hotLeads.forEach(l => {
      l.status = 'pushed'
      l.push_at = now
      l.updated_at = now
    })

    return HttpResponse.json({
      data: {
        pushed_count: hotLeads.length,
        lead_ids: hotLeads.map(l => l.id),
      },
    })
  }),

  // ─── GET messages ─────────────────────────────────────────────
  http.get('*/api/mkt/leads/:id/messages', async ({ params, request }) => {
    const personId = await getCurrentMockUserId()
    if (!personId) return unauthorized()

    const url   = new URL(request.url)
    const page  = Number(url.searchParams.get('page')  ?? '1')
    const limit = Number(url.searchParams.get('limit') ?? '50')

    const msgs  = MOCK_LEAD_MESSAGES[params.id as string] ?? []
    const total = msgs.length
    const paged = msgs.slice((page - 1) * limit, page * limit)
    return HttpResponse.json({ data: paged, meta: { page, limit, total } })
  }),

  // ─── POST message ─────────────────────────────────────────────
  http.post('*/api/mkt/leads/:id/messages', async ({ params, request }) => {
    const personId = await getCurrentMockUserId()
    if (!personId) return unauthorized()

    const leadId = params.id as string
    const body   = await request.json() as Partial<LeadMessage>
    if (!body.content) {
      return HttpResponse.json(
        { statusCode: 400, message: ['content should not be empty'], error: 'Bad Request' },
        { status: 400 },
      )
    }

    const newMsg: LeadMessage = {
      id: crypto.randomUUID(),
      lead_id: leadId,
      person_id: personId,
      direction: 'outbound',
      content: body.content!,
      sent_at: new Date().toISOString(),
    }
    ;(MOCK_LEAD_MESSAGES[leadId] ??= []).push(newMsg)
    return HttpResponse.json({ data: newMsg }, { status: 201 })
  }),
]
