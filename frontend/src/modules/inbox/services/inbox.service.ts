import { apiClient } from '@/shared/config/api-client'
import type { Lead } from '@/modules/today/today.types'
import type { LeadFilter, PaginationMeta } from '../inbox.types'

export const inboxService = {
  getLeads: (filters?: LeadFilter) => {
    const params = new URLSearchParams()
    if (filters?.status && filters.status.length > 0) {
      filters.status.forEach((s) => params.append('status[]', s))
    }
    if (filters?.channel_code) params.set('channel_code', filters.channel_code)
    if (filters?.sla_overdue_only) params.set('sla_overdue_only', 'true')
    if (filters?.page) params.set('page', String(filters.page))
    if (filters?.per_page) params.set('per_page', String(filters.per_page))
    const qs = params.toString()
    return apiClient.get<{ data: Lead[]; meta: PaginationMeta }>(
      `/api/v1/marketing/leads${qs ? `?${qs}` : ''}`,
    )
  },

  getLeadById: (id: string) =>
    apiClient.get<Lead>(`/api/v1/marketing/leads/${id}`),

  performAction: (id: string, body: object) =>
    apiClient.post<Lead>(`/api/v1/marketing/leads/${id}/actions`, body),
}
