// src/mocks/handlers/briefs.ts
import { http, HttpResponse } from 'msw'
import { getCurrentMockUserId, getCurrentMockPerson, unauthorized, forbidden, notFound } from '../config'
import { MOCK_BRIEFS } from '../data/briefs'
import type { Brief } from '@modules/briefs/types'

const ADMIN_STATUS_ROLES = ['admin', 'owner']

export const briefsHandlers = [
  http.get('*/api/mkt/briefs', async ({ request }) => {
    const personId = await getCurrentMockUserId()
    if (!personId) return unauthorized()

    const url    = new URL(request.url)
    const page   = Number(url.searchParams.get('page')  ?? '1')
    const limit  = Number(url.searchParams.get('limit') ?? '20')
    const type   = url.searchParams.get('brief_type')
    const status = url.searchParams.get('status')

    let items = [...MOCK_BRIEFS]
    if (type)   items = items.filter(b => b.brief_type === type)
    if (status) items = items.filter(b => b.status === status)

    const total = items.length
    const paged = items.slice((page - 1) * limit, page * limit)
    return HttpResponse.json({ data: paged, meta: { page, limit, total } })
  }),

  http.post('*/api/mkt/briefs', async ({ request }) => {
    const personId = await getCurrentMockUserId()
    if (!personId) return unauthorized()

    const body = await request.json() as Partial<Brief>
    const errors: string[] = []
    if (!body.brief_type)  errors.push('brief_type should not be empty')
    if (!body.description) errors.push('description should not be empty')
    if (!body.deadline)    errors.push('deadline should not be empty')
    if (body.brief_type === 'design'  && !body.dimensions)     errors.push('dimensions required for design briefs')
    if (body.brief_type === 'editing' && !body.editing_format) errors.push('editing_format required for editing briefs')
    if (errors.length) {
      return HttpResponse.json({ statusCode: 400, message: errors, error: 'Bad Request' }, { status: 400 })
    }

    const now = new Date().toISOString()
    const created: Brief = {
      id: crypto.randomUUID(),
      person_id: personId,
      brief_type: body.brief_type!,
      description: body.description!,
      dimensions: body.dimensions,
      editing_format: body.editing_format,
      deadline: body.deadline!,
      status: 'pending',
      created_at: now,
      updated_at: now,
    }
    MOCK_BRIEFS.push(created)
    return HttpResponse.json({ data: created }, { status: 201 })
  }),

  http.patch('*/api/mkt/briefs/:id', async ({ params, request }) => {
    const person = await getCurrentMockPerson()
    if (!person) return unauthorized()

    const idx = MOCK_BRIEFS.findIndex(b => b.id === params.id)
    if (idx < 0) return notFound()

    const body = await request.json() as Partial<Brief>
    if (body.status !== undefined) {
      if (!person.roles.some(r => ADMIN_STATUS_ROLES.includes(r))) {
        return forbidden('Chỉ Admin/Owner mới được cập nhật trạng thái brief')
      }
    }

    MOCK_BRIEFS[idx] = { ...MOCK_BRIEFS[idx], ...body, updated_at: new Date().toISOString() }
    return HttpResponse.json({ data: MOCK_BRIEFS[idx] })
  }),
]
