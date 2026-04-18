// src/mocks/handlers/stories.ts
import { http, HttpResponse } from 'msw'
import { getCurrentMockUserId, getCurrentMockPerson, unauthorized, forbidden, notFound } from '../config'
import { MOCK_STORIES } from '../data/stories'
import type { Story } from '@modules/stories/types'

const APPROVE_ROLES = ['co_leader', 'marketing_leader', 'admin', 'owner']

export const storiesHandlers = [
  http.get('*/api/mkt/stories', async ({ request }) => {
    const personId = await getCurrentMockUserId()
    if (!personId) return unauthorized()

    const url    = new URL(request.url)
    const page   = Number(url.searchParams.get('page')  ?? '1')
    const limit  = Number(url.searchParams.get('limit') ?? '20')
    const status = url.searchParams.get('status')
    const course = url.searchParams.get('course_name')

    let items = [...MOCK_STORIES]
    if (status) items = items.filter(s => s.status === status)
    if (course) items = items.filter(s => s.course_name.toLowerCase().includes(course.toLowerCase()))

    const total = items.length
    const paged = items.slice((page - 1) * limit, page * limit)
    return HttpResponse.json({ data: paged, meta: { page, limit, total } })
  }),

  http.post('*/api/mkt/stories', async ({ request }) => {
    const personId = await getCurrentMockUserId()
    if (!personId) return unauthorized()

    const body = await request.json() as Partial<Story>
    const errors: string[] = []
    if (!body.learner_name)   errors.push('learner_name should not be empty')
    if (!body.course_name)    errors.push('course_name should not be empty')
    if (!body.pain_point)     errors.push('pain_point should not be empty')
    if (!body.transformation) errors.push('transformation should not be empty')
    if (errors.length) {
      return HttpResponse.json({ statusCode: 400, message: errors, error: 'Bad Request' }, { status: 400 })
    }

    const now = new Date().toISOString()
    const created: Story = {
      id: crypto.randomUUID(),
      person_id: personId,
      learner_name: body.learner_name!,
      course_name: body.course_name!,
      pain_point: body.pain_point!,
      transformation: body.transformation!,
      icp_tags: body.icp_tags ?? [],
      status: 'pending',
      created_at: now,
      updated_at: now,
    }
    MOCK_STORIES.push(created)
    return HttpResponse.json({ data: created }, { status: 201 })
  }),

  http.patch('*/api/mkt/stories/:id', async ({ params, request }) => {
    const person = await getCurrentMockPerson()
    if (!person) return unauthorized()

    const idx = MOCK_STORIES.findIndex(s => s.id === params.id)
    if (idx < 0) return notFound()

    const body = await request.json() as Partial<Story>
    if (body.status !== undefined) {
      if (!person.roles.some(r => APPROVE_ROLES.includes(r))) {
        return forbidden('Chỉ Co-Leader+ mới được đổi trạng thái story')
      }
    }

    MOCK_STORIES[idx] = { ...MOCK_STORIES[idx], ...body, updated_at: new Date().toISOString() }
    return HttpResponse.json({ data: MOCK_STORIES[idx] })
  }),

  http.post('*/api/mkt/stories/:id/deployments', async ({ params, request }) => {
    const personId = await getCurrentMockUserId()
    if (!personId) return unauthorized()

    const idx = MOCK_STORIES.findIndex(s => s.id === params.id)
    if (idx < 0) return notFound()

    const body = await request.json() as { campaign_id: string }
    if (!body.campaign_id) {
      return HttpResponse.json({ statusCode: 400, message: ['campaign_id should not be empty'], error: 'Bad Request' }, { status: 400 })
    }
    if (MOCK_STORIES[idx].status !== 'approved') {
      return HttpResponse.json(
        { statusCode: 422, message: 'Chỉ story đã approved mới có thể deploy', error: 'Unprocessable Entity', code: 'MKT_STORY_NOT_APPROVED', details: { current_status: MOCK_STORIES[idx].status } },
        { status: 422 },
      )
    }

    MOCK_STORIES[idx] = {
      ...MOCK_STORIES[idx],
      status: 'deployed',
      deployed_campaign_id: body.campaign_id,
      updated_at: new Date().toISOString(),
    }
    return HttpResponse.json({ data: MOCK_STORIES[idx] })
  }),
]
