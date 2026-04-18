// src/mocks/handlers/documents.ts
import { http, HttpResponse } from 'msw'
import { getCurrentMockPerson, getCurrentMockUserId, unauthorized, forbidden, notFound } from '../config'
import { MOCK_DOCUMENTS } from '../data/documents'
import type { Document } from '@modules/documents/types'

const DOC_ADMIN_ROLES = ['admin', 'owner']

export const documentsHandlers = [
  http.get('*/api/mkt/documents', async ({ request }) => {
    const personId = await getCurrentMockUserId()
    if (!personId) return unauthorized()

    const url    = new URL(request.url)
    const status = url.searchParams.get('status')

    let items = [...MOCK_DOCUMENTS]
    if (status) items = items.filter(d => d.status === status)

    return HttpResponse.json({ data: items })
  }),

  http.patch('*/api/mkt/documents/:id', async ({ params, request }) => {
    const person = await getCurrentMockPerson()
    if (!person) return unauthorized()
    if (!person.roles.some(r => DOC_ADMIN_ROLES.includes(r))) {
      return forbidden('Chỉ Admin/Owner mới được cập nhật tài liệu')
    }

    const idx = MOCK_DOCUMENTS.findIndex(d => d.id === params.id)
    if (idx < 0) return notFound()

    const patch = await request.json() as Partial<Document>
    MOCK_DOCUMENTS[idx] = { ...MOCK_DOCUMENTS[idx], ...patch, updated_at: new Date().toISOString() }
    return HttpResponse.json({ data: MOCK_DOCUMENTS[idx] })
  }),
]
