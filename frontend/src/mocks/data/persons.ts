// src/mocks/data/persons.ts
import type { Role } from '@shared/types/auth'

export interface MockPerson {
  id: string
  email: string
  full_name: string
  avatar_url?: string
  roles: Role[]
  primary_role: Role
}

export const MOCK_PERSONS: MockPerson[] = [
  {
    id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    email: 'owner-01@nedu-mkt.vn',
    full_name: 'Owner 01',
    roles: ['owner'] as Role[],
    primary_role: 'owner' as Role,
  },
  {
    id: 'b2c3d4e5-f6a7-8901-bcde-f23456789012',
    email: 'marketing-leader-01@nedu-mkt.vn',
    full_name: 'Leader 01',
    roles: ['marketing_leader'] as Role[],
    primary_role: 'marketing_leader' as Role,
  },
  {
    id: 'c3d4e5f6-a7b8-9012-cdef-345678901234',
    email: 'co-leader-01@nedu-mkt.vn',
    full_name: 'Co-Leader 01',
    roles: ['co_leader'] as Role[],
    primary_role: 'co_leader' as Role,
  },
  {
    id: 'd4e5f6a7-b8c9-0123-defa-456789012345',
    email: 'staff-01@nedu-mkt.vn',
    full_name: 'Staff 01',
    roles: ['marketing_staff'] as Role[],
    primary_role: 'marketing_staff' as Role,
  },
  {
    id: 'e5f6a7b8-c9d0-1234-efab-567890123456',
    email: 'staff-02@nedu-mkt.vn',
    full_name: 'Staff 02',
    roles: ['marketing_staff'] as Role[],
    primary_role: 'marketing_staff' as Role,
  },
]
