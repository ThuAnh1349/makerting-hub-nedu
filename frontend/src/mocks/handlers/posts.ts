// src/mocks/handlers/posts.ts
import { http, HttpResponse } from 'msw'
import {
  getCurrentMockUserId,
  getCurrentMockPerson,
  unauthorized,
  forbidden,
  notFound,
} from '../config'
import { MOCK_POSTS } from '../data/posts'
import type { Post } from '@modules/posts/types'

const REVIEW_ROLES = ['co_leader', 'marketing_leader', 'admin', 'owner']

export const postsHandlers = [
  // ─── LIST ────────────────────────────────────────────────────
  http.get('*/api/mkt/posts', async ({ request }) => {
    const personId = await getCurrentMockUserId()
    if (!personId) return unauthorized()

    const url       = new URL(request.url)
    const page      = Number(url.searchParams.get('page')    ?? '1')
    const limit     = Number(url.searchParams.get('limit')   ?? '20')
    const status    = url.searchParams.get('status')
    const channel   = url.searchParams.get('channel')
    const date_from = url.searchParams.get('date_from')
    const date_to   = url.searchParams.get('date_to')

    let items: Post[] = [...MOCK_POSTS]
    if (status)    items = items.filter(p => p.status === status)
    if (channel)   items = items.filter(p => p.channels.includes(channel as Post['channels'][0]))
    if (date_from) items = items.filter(p => p.scheduled_at && p.scheduled_at >= date_from)
    if (date_to)   items = items.filter(p => p.scheduled_at && p.scheduled_at <= date_to + 'T23:59:59.999Z')

    const total = items.length
    const paged = items.slice((page - 1) * limit, page * limit)
    return HttpResponse.json({ data: paged, meta: { page, limit, total } })
  }),

  // ─── GET ONE ─────────────────────────────────────────────────
  http.get('*/api/mkt/posts/:id', async ({ params }) => {
    const personId = await getCurrentMockUserId()
    if (!personId) return unauthorized()

    const post = MOCK_POSTS.find(p => p.id === params.id)
    if (!post) return notFound()
    return HttpResponse.json({ data: post })
  }),

  // ─── CREATE ──────────────────────────────────────────────────
  http.post('*/api/mkt/posts', async ({ request }) => {
    const personId = await getCurrentMockUserId()
    if (!personId) return unauthorized()

    const body = await request.json() as Partial<Post>
    const errors: string[] = []
    if (!body.caption)          errors.push('caption should not be empty')
    if (!body.channels?.length) errors.push('channels must not be empty')
    if (errors.length) {
      return HttpResponse.json(
        { statusCode: 400, message: errors, error: 'Bad Request' },
        { status: 400 },
      )
    }

    const now = new Date().toISOString()
    const created: Post = {
      id: crypto.randomUUID(),
      person_id: personId,
      caption: body.caption!,
      channels: body.channels!,
      media_urls: body.media_urls ?? [],
      reference_links: body.reference_links ?? [],
      status: 'draft',
      scheduled_at: body.scheduled_at,
      campaign_id: body.campaign_id,
      created_at: now,
      updated_at: now,
    }
    MOCK_POSTS.push(created)
    return HttpResponse.json({ data: created }, { status: 201 })
  }),

  // ─── PATCH (edit) ─────────────────────────────────────────────
  http.patch('*/api/mkt/posts/:id', async ({ params, request }) => {
    const personId = await getCurrentMockUserId()
    if (!personId) return unauthorized()

    const idx = MOCK_POSTS.findIndex(p => p.id === params.id)
    if (idx < 0) return notFound()
    if (MOCK_POSTS[idx].person_id !== personId) return forbidden('Not your post')

    const patch = await request.json() as Partial<Post>
    MOCK_POSTS[idx] = { ...MOCK_POSTS[idx], ...patch, updated_at: new Date().toISOString() }
    return HttpResponse.json({ data: MOCK_POSTS[idx] })
  }),

  // ─── DELETE ──────────────────────────────────────────────────
  http.delete('*/api/mkt/posts/:id', async ({ params }) => {
    const person = await getCurrentMockPerson()
    if (!person) return unauthorized()

    const idx = MOCK_POSTS.findIndex(p => p.id === params.id)
    if (idx < 0) return notFound()

    const isOwner = MOCK_POSTS[idx].person_id === person.id
    const canForce = person.roles.some(r => ['admin', 'owner'].includes(r))
    if (!isOwner && !canForce) return forbidden('Not your post')

    MOCK_POSTS.splice(idx, 1)
    return new HttpResponse(null, { status: 204 })
  }),

  // ─── SUBMIT for review ───────────────────────────────────────
  http.post('*/api/mkt/posts/:id/submissions', async ({ params }) => {
    const personId = await getCurrentMockUserId()
    if (!personId) return unauthorized()

    const idx = MOCK_POSTS.findIndex(p => p.id === params.id)
    if (idx < 0) return notFound()
    if (MOCK_POSTS[idx].person_id !== personId) return forbidden('Not your post')
    if (MOCK_POSTS[idx].status !== 'draft') {
      return HttpResponse.json(
        {
          statusCode: 422,
          message: 'Chỉ bài ở trạng thái draft mới có thể submit',
          error: 'Unprocessable Entity',
          code: 'MKT_POST_INVALID_STATUS_TRANSITION',
          details: { current_status: MOCK_POSTS[idx].status },
        },
        { status: 422 },
      )
    }

    MOCK_POSTS[idx] = {
      ...MOCK_POSTS[idx],
      status: 'pending_review',
      updated_at: new Date().toISOString(),
    }
    return HttpResponse.json({ data: MOCK_POSTS[idx] })
  }),

  // ─── APPROVE (v1.2: tách từ PATCH .../review) ────────────────
  http.post('*/api/mkt/posts/:id/approve', async ({ params }) => {
    const person = await getCurrentMockPerson()
    if (!person) return unauthorized()
    if (!person.roles.some(r => REVIEW_ROLES.includes(r))) {
      return forbidden('Chỉ Co-Leader, Leader, Admin, Owner mới được duyệt bài')
    }

    const idx = MOCK_POSTS.findIndex(p => p.id === params.id)
    if (idx < 0) return notFound()
    if (MOCK_POSTS[idx].status !== 'pending_review') {
      return HttpResponse.json(
        {
          statusCode: 422,
          message: 'Chỉ bài đang ở trạng thái pending_review mới có thể duyệt',
          error: 'Unprocessable Entity',
          code: 'MKT_POST_INVALID_STATUS_TRANSITION',
          details: { current_status: MOCK_POSTS[idx].status },
        },
        { status: 422 },
      )
    }

    const now = new Date().toISOString()
    MOCK_POSTS[idx] = {
      ...MOCK_POSTS[idx],
      status: 'approved',
      reviewer_id: person.id,
      reviewed_at: now,
      updated_at: now,
    }
    return HttpResponse.json({ data: MOCK_POSTS[idx] })
  }),

  // ─── REJECT (v1.2: tách từ PATCH .../review) ─────────────────
  http.post('*/api/mkt/posts/:id/reject', async ({ params, request }) => {
    const person = await getCurrentMockPerson()
    if (!person) return unauthorized()
    if (!person.roles.some(r => REVIEW_ROLES.includes(r))) {
      return forbidden('Chỉ Co-Leader, Leader, Admin, Owner mới được từ chối bài')
    }

    const idx = MOCK_POSTS.findIndex(p => p.id === params.id)
    if (idx < 0) return notFound()
    if (MOCK_POSTS[idx].status !== 'pending_review') {
      return HttpResponse.json(
        {
          statusCode: 422,
          message: 'Chỉ bài đang ở trạng thái pending_review mới có thể từ chối',
          error: 'Unprocessable Entity',
          code: 'MKT_POST_INVALID_STATUS_TRANSITION',
          details: { current_status: MOCK_POSTS[idx].status },
        },
        { status: 422 },
      )
    }

    const body = await request.json() as { rejection_note: string }
    if (!body.rejection_note) {
      return HttpResponse.json(
        { statusCode: 400, message: ['rejection_note should not be empty'], error: 'Bad Request' },
        { status: 400 },
      )
    }

    const now = new Date().toISOString()
    MOCK_POSTS[idx] = {
      ...MOCK_POSTS[idx],
      status: 'rejected',
      rejection_note: body.rejection_note,
      reviewer_id: person.id,
      reviewed_at: now,
      updated_at: now,
    }
    return HttpResponse.json({ data: MOCK_POSTS[idx] })
  }),
]
