export const ROLES = {
  MARKETING_STAFF: 'marketing_staff',
  CO_LEADER: 'co_leader',
  MARKETING_LEADER: 'marketing_leader',
  DESIGN_MEMBER: 'design_member',
  VIDEO_EDITOR: 'video_editor',
} as const

export type Role = (typeof ROLES)[keyof typeof ROLES]
