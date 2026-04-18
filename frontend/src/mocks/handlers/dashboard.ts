// src/mocks/handlers/dashboard.ts
import { http, HttpResponse } from 'msw'
import { getCurrentMockUserId, unauthorized } from '../config'
import { MOCK_DASHBOARD } from '../data/dashboard'

export const dashboardHandlers = [
  http.get('*/api/mkt/dashboard', async () => {
    const personId = await getCurrentMockUserId()
    if (!personId) return unauthorized()

    const summary = MOCK_DASHBOARD[personId] ?? MOCK_DASHBOARD[Object.keys(MOCK_DASHBOARD)[0]]
    return HttpResponse.json({ data: summary })
  }),
]
