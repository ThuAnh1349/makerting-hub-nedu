// src/modules/dashboard/types/index.ts
export interface DashboardSummary {
  leads_pending: number
  messages_unread: number
  posts_today: number
  kpis: {
    task_completion_rate: number  // 0–100
    response_rate: number
    on_time_post_rate: number
  }
  alerts: Array<{
    type: 'urgent' | 'warning'
    message: string
    action: string    // 'go_leads' | 'go_content' | ...
  }>
}
