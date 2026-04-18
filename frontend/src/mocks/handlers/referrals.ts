// src/mocks/handlers/referrals.ts
import { http, HttpResponse } from 'msw'
import { getCurrentMockUserId, unauthorized, notFound } from '../config'
import { MOCK_REFERRAL_LEADS, MOCK_AMBASSADORS } from '../data/referrals'
import type { Ambassador } from '@modules/referrals/types'

export const referralsHandlers = [
  http.get('*/api/mkt/referral-leads', async ({ request }) => {
    const personId = await getCurrentMockUserId()
    if (!personId) return unauthorized()

    const url          = new URL(request.url)
    const page         = Number(url.searchParams.get('page')         ?? '1')
    const limit        = Number(url.searchParams.get('limit')        ?? '20')
    const ambassadorId = url.searchParams.get('ambassador_id')
    const converted    = url.searchParams.get('converted')

    let items = [...MOCK_REFERRAL_LEADS]
    if (ambassadorId) items = items.filter(r => r.ambassador_id === ambassadorId)
    if (converted !== null) items = items.filter(r => String(r.converted) === converted)

    const total = items.length
    const paged = items.slice((page - 1) * limit, page * limit)
    return HttpResponse.json({ data: paged, meta: { page, limit, total } })
  }),

  http.get('*/api/mkt/ambassadors', async ({ request }) => {
    const personId = await getCurrentMockUserId()
    if (!personId) return unauthorized()

    const url   = new URL(request.url)
    const page  = Number(url.searchParams.get('page')  ?? '1')
    const limit = Number(url.searchParams.get('limit') ?? '10')

    const sorted = [...MOCK_AMBASSADORS].sort((a, b) => b.referral_count - a.referral_count)
    const total  = sorted.length
    const paged  = sorted.slice((page - 1) * limit, page * limit)
    return HttpResponse.json({ data: paged, meta: { page, limit, total } })
  }),

  http.post('*/api/mkt/ambassadors/:id/referral-links', async ({ params }) => {
    const personId = await getCurrentMockUserId()
    if (!personId) return unauthorized()

    const amb = MOCK_AMBASSADORS.find(a => a.id === params.id)
    if (!amb) return notFound()

    const link = `https://nedu.vn?utm_source=referral&utm_campaign=ambassador-ref-${params.id?.toString().slice(0, 8)}&utm_medium=alumni`
    return HttpResponse.json({ data: { referral_link: link, ambassador_id: params.id } }, { status: 201 })
  }),

  http.patch('*/api/mkt/ambassadors/:id/care', async ({ params, request }) => {
    const personId = await getCurrentMockUserId()
    if (!personId) return unauthorized()

    const idx = MOCK_AMBASSADORS.findIndex(a => a.id === params.id)
    if (idx < 0) return notFound()

    const body = await request.json() as Pick<Ambassador, 'care_checklist'>
    if (!Array.isArray(body.care_checklist)) {
      return HttpResponse.json({ statusCode: 400, message: ['care_checklist must be an array'], error: 'Bad Request' }, { status: 400 })
    }

    MOCK_AMBASSADORS[idx] = { ...MOCK_AMBASSADORS[idx], care_checklist: body.care_checklist, updated_at: new Date().toISOString() }
    return HttpResponse.json({ data: MOCK_AMBASSADORS[idx] })
  }),
]
