// src/modules/stories/types/index.ts
export type StoryStatus = 'pending' | 'approved' | 'deployed'

export interface Story {
  id: string
  person_id: string
  learner_name: string
  course_name: string
  pain_point: string
  transformation: string
  icp_tags: string[]
  status: StoryStatus
  deployed_campaign_id?: string
  created_at: string
  updated_at: string
}
