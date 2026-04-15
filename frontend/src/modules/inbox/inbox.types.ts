export type { LeadStatus, Lead, LeadActionEvent } from '@/modules/today/today.types'

export type LeadFilter = {
  status?: string[]
  channel_code?: string
  sla_overdue_only?: boolean
  page?: number
  per_page?: number
}

export interface PaginationMeta {
  total: number
  page: number
  per_page: number
  total_pages: number
}
