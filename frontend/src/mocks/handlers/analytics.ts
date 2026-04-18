// src/mocks/handlers/analytics.ts
import { http, HttpResponse } from 'msw'
import { getCurrentMockPerson, unauthorized, forbidden } from '../config'
import { MOCK_ANALYTICS } from '../data/analytics'

const ANALYTICS_ROLES = ['marketing_leader', 'admin', 'owner']

export const analyticsHandlers = [
  http.get('*/api/mkt/analytics', async ({ request }) => {
    const person = await getCurrentMockPerson()
    if (!person) return unauthorized()
    if (!person.roles.some(r => ANALYTICS_ROLES.includes(r))) {
      return forbidden('Chỉ Marketing Leader, Admin, Owner mới được xem Analytics')
    }

    const url    = new URL(request.url)
    const period = url.searchParams.get('period')
    const label  = url.searchParams.get('period_label')

    let items = [...MOCK_ANALYTICS]
    if (period) items = items.filter(a => a.period === period)
    if (label)  items = items.filter(a => a.period_label === label)

    return HttpResponse.json({ data: items })
  }),
]
