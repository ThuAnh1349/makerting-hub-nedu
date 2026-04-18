// src/mocks/handlers/notifications.ts
import { http, HttpResponse } from 'msw'
import { getCurrentMockUserId, unauthorized, notFound, forbidden } from '../config'
import { MOCK_NOTIFICATIONS } from '../data/notifications'

export const notificationsHandlers = [
  http.get('*/api/mkt/notifications', async ({ request }) => {
    const personId = await getCurrentMockUserId()
    if (!personId) return unauthorized()

    const url   = new URL(request.url)
    const page  = Number(url.searchParams.get('page')  ?? '1')
    const limit = Number(url.searchParams.get('limit') ?? '20')
    const read  = url.searchParams.get('read')

    let items = MOCK_NOTIFICATIONS.filter(n => n.person_id === personId)
    if (read !== null) items = items.filter(n => String(n.read) === read)

    const total = items.length
    const paged = items.slice((page - 1) * limit, page * limit)
    return HttpResponse.json({ data: paged, meta: { page, limit, total } })
  }),

  http.patch('*/api/mkt/notifications/:id/read', async ({ params }) => {
    const personId = await getCurrentMockUserId()
    if (!personId) return unauthorized()

    const idx = MOCK_NOTIFICATIONS.findIndex(n => n.id === params.id)
    if (idx < 0) return notFound()
    if (MOCK_NOTIFICATIONS[idx].person_id !== personId) return forbidden('Not your notification')

    MOCK_NOTIFICATIONS[idx] = { ...MOCK_NOTIFICATIONS[idx], read: true }
    return HttpResponse.json({ data: MOCK_NOTIFICATIONS[idx] })
  }),

  http.post('*/api/mkt/notifications/read-all', async () => {
    const personId = await getCurrentMockUserId()
    if (!personId) return unauthorized()

    let count = 0
    for (let i = 0; i < MOCK_NOTIFICATIONS.length; i++) {
      if (MOCK_NOTIFICATIONS[i].person_id === personId && !MOCK_NOTIFICATIONS[i].read) {
        MOCK_NOTIFICATIONS[i] = { ...MOCK_NOTIFICATIONS[i], read: true }
        count++
      }
    }
    return HttpResponse.json({ data: { updated_count: count } })
  }),
]
