// src/mocks/handlers/campaigns.ts
import { http, HttpResponse } from 'msw'
import { getCurrentMockPerson, unauthorized, forbidden, notFound } from '../config'
import { MOCK_CAMPAIGNS } from '../data/campaigns'
import type { Campaign } from '@modules/campaigns/types'

const CAMPAIGN_ROLES = ['marketing_leader', 'admin', 'owner']

export const campaignsHandlers = [
  http.get('*/api/mkt/campaigns', async ({ request }) => {
    const person = await getCurrentMockPerson()
    if (!person) return unauthorized()
    if (!person.roles.some(r => CAMPAIGN_ROLES.includes(r))) return forbidden('Không đủ role')

    const url   = new URL(request.url)
    const page  = Number(url.searchParams.get('page')  ?? '1')
    const limit = Number(url.searchParams.get('limit') ?? '20')
    const phase = url.searchParams.get('phase')

    let items = [...MOCK_CAMPAIGNS]
    if (phase) items = items.filter(c => c.phase === phase)

    const total = items.length
    const paged = items.slice((page - 1) * limit, page * limit)
    return HttpResponse.json({ data: paged, meta: { page, limit, total } })
  }),

  http.post('*/api/mkt/campaigns', async ({ request }) => {
    const person = await getCurrentMockPerson()
    if (!person) return unauthorized()
    if (!person.roles.some(r => CAMPAIGN_ROLES.includes(r))) return forbidden('Không đủ role')

    const body = await request.json() as Partial<Campaign>
    const errors: string[] = []
    if (!body.name)       errors.push('name should not be empty')
    if (!body.phase)      errors.push('phase should not be empty')
    if (!body.goal)       errors.push('goal should not be empty')
    if (!body.start_date) errors.push('start_date should not be empty')
    if (!body.end_date)   errors.push('end_date should not be empty')
    if (errors.length) {
      return HttpResponse.json({ statusCode: 400, message: errors, error: 'Bad Request' }, { status: 400 })
    }

    const now = new Date().toISOString()
    const created: Campaign = {
      id: crypto.randomUUID(),
      person_id: person.id,
      name: body.name!,
      phase: body.phase!,
      progress_percent: 0,
      goal: body.goal!,
      start_date: body.start_date!,
      end_date: body.end_date!,
      created_at: now,
      updated_at: now,
    }
    MOCK_CAMPAIGNS.push(created)
    return HttpResponse.json({ data: created }, { status: 201 })
  }),

  http.patch('*/api/mkt/campaigns/:id', async ({ params, request }) => {
    const person = await getCurrentMockPerson()
    if (!person) return unauthorized()
    if (!person.roles.some(r => CAMPAIGN_ROLES.includes(r))) return forbidden('Không đủ role')

    const idx = MOCK_CAMPAIGNS.findIndex(c => c.id === params.id)
    if (idx < 0) return notFound()

    const isOwner = MOCK_CAMPAIGNS[idx].person_id === person.id
    const isAdmin = person.roles.some(r => ['admin', 'owner'].includes(r))
    if (!isOwner && !isAdmin) return forbidden('Chỉ người tạo chiến dịch hoặc Admin/Owner mới được sửa')

    const patch = await request.json() as Partial<Campaign>
    MOCK_CAMPAIGNS[idx] = { ...MOCK_CAMPAIGNS[idx], ...patch, updated_at: new Date().toISOString() }
    return HttpResponse.json({ data: MOCK_CAMPAIGNS[idx] })
  }),
]
