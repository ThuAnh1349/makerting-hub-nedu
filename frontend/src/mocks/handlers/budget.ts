// src/mocks/handlers/budget.ts
import { http, HttpResponse } from 'msw'
import { getCurrentMockPerson, unauthorized, forbidden, notFound } from '../config'
import { MOCK_BUDGET } from '../data/budget'

const BUDGET_ROLES = ['marketing_leader', 'admin', 'owner']

export const budgetHandlers = [
  http.get('*/api/mkt/budget-summary', async ({ request }) => {
    const person = await getCurrentMockPerson()
    if (!person) return unauthorized()
    if (!person.roles.some(r => BUDGET_ROLES.includes(r))) return forbidden('Không đủ role')

    const url   = new URL(request.url)
    const label = url.searchParams.get('period_label') ?? '2026-04'
    const record = MOCK_BUDGET.find(b => b.period_label === label)
    if (!record) return notFound()

    return HttpResponse.json({ data: record })
  }),
]
