// src/mocks/config.ts
import { MOCK_PERSONS, type MockPerson } from './data/persons'
import { HttpResponse } from 'msw'

// Try to get Supabase session email for person lookup
// Falls back to first mock person (marketing_leader) if no session — supports demo mode
async function getSessionEmail(): Promise<string | null> {
  try {
    const { supabase } = await import('@shared/config/supabase')
    const { data: { session } } = await supabase.auth.getSession()
    return session?.user?.email ?? null
  } catch {
    return null
  }
}

export async function getCurrentMockUserId(): Promise<string | null> {
  const email = await getSessionEmail()
  if (email) {
    const person = MOCK_PERSONS.find(p => p.email === email)
    if (person) return person.id
  }
  // Demo mode fallback — use marketing_leader (MOCK_PERSONS[1])
  return MOCK_PERSONS[1].id
}

export async function getCurrentMockPerson(): Promise<MockPerson | null> {
  const id = await getCurrentMockUserId()
  return id ? MOCK_PERSONS.find(p => p.id === id) ?? null : null
}

export const unauthorized = () => HttpResponse.json(
  { statusCode: 401, message: 'Unauthorized', error: 'Unauthorized' },
  { status: 401 },
)
export const forbidden = (msg = 'Forbidden') => HttpResponse.json(
  { statusCode: 403, message: msg, error: 'Forbidden' },
  { status: 403 },
)
export const notFound = (msg = 'Not found') => HttpResponse.json(
  { statusCode: 404, message: msg, error: 'Not Found' },
  { status: 404 },
)
export const badRequest = (errors: string[]) => HttpResponse.json(
  { statusCode: 400, message: errors, error: 'Bad Request' },
  { status: 400 },
)
