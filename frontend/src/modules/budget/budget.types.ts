export interface BudgetSummary {
  month_start: string
  total_allocated_vnd: number
  total_spent_vnd: number
  budget_used_pct: number
  budget_warning: boolean
  total_leads: number
  overall_cpl: number | null
  by_channel: Array<{
    channel_id: string
    channel_label: string
    channel_color: string
    allocated_vnd: number | null
    spend_vnd: number | null
    lead_count: number | null
    cpl_actual: number | null
    cpl_benchmark: number | null
    budget_used_pct: number | null
  }>
}
