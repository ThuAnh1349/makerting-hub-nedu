// src/mocks/handlers/brand-health.ts
import { http, HttpResponse } from 'msw'
import { getCurrentMockPerson, unauthorized, forbidden } from '../config'
import { MOCK_BRAND_HEALTH } from '../data/brand-health'

const BH_ROLES = ['marketing_leader', 'admin', 'owner']

export const brandHealthHandlers = [
  http.get('*/api/mkt/brand-health', async ({ request }) => {
    const person = await getCurrentMockPerson()
    if (!person) return unauthorized()
    if (!person.roles.some(r => BH_ROLES.includes(r))) return forbidden('Không đủ role')

    const url   = new URL(request.url)
    const label = url.searchParams.get('period_label')
    let record  = MOCK_BRAND_HEALTH.find(b => b.period_label === (label ?? '2026-W14'))
    if (!record) record = MOCK_BRAND_HEALTH[0]

    return HttpResponse.json({ data: record })
  }),

  http.post('*/api/mkt/brand-health/crisis', async () => {
    const person = await getCurrentMockPerson()
    if (!person) return unauthorized()
    if (!person.roles.some(r => BH_ROLES.includes(r))) return forbidden('Không đủ role')

    const idx = MOCK_BRAND_HEALTH.findIndex(b => !b.crisis_active)
    if (idx >= 0) {
      MOCK_BRAND_HEALTH[idx] = { ...MOCK_BRAND_HEALTH[idx], crisis_active: true }
      return HttpResponse.json({ data: MOCK_BRAND_HEALTH[idx] })
    }
    return HttpResponse.json(
      { statusCode: 422, message: 'Crisis Protocol đang được kích hoạt', error: 'Unprocessable Entity', code: 'MKT_CRISIS_ALREADY_ACTIVE' },
      { status: 422 },
    )
  }),
]
