// src/mocks/handlers/auth.ts
import { http, HttpResponse } from 'msw'
import { getCurrentMockPerson, unauthorized } from '../config'

export const authHandlers = [
  http.get('*/api/auth/me', async () => {
    const person = await getCurrentMockPerson()
    if (!person) return unauthorized()
    return HttpResponse.json({
      data: {
        person_id:    person.id,
        email:        person.email,
        full_name:    person.full_name,
        avatar_url:   person.avatar_url,
        roles:        person.roles,
        primary_role: person.primary_role,
      },
    })
  }),
]
