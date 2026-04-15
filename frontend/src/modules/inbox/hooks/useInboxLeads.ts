import { useQuery } from '@tanstack/react-query'
import { inboxService } from '../services/inbox.service'
import type { LeadFilter } from '../inbox.types'

export function useInboxLeads(filters?: LeadFilter) {
  return useQuery({
    queryKey: ['inbox', 'leads', filters],
    queryFn: () => inboxService.getLeads(filters),
    refetchInterval: 30_000,
  })
}

export function useLeadDetail(leadId: string | null) {
  return useQuery({
    queryKey: ['inbox', 'lead', leadId],
    queryFn: () => inboxService.getLeadById(leadId!),
    enabled: !!leadId,
  })
}
