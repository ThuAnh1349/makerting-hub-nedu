/**
 * Story module type definitions.
 */

export interface Story {
  id: string;
  student_name: string;
  student_avatar_url: string | null;
  course_name: string;
  pain_point: string;
  transformation: string;
  icp_tags: string[];
  current_status: "pending_review" | "approved" | "deployed";
  deployed_to_campaigns: Array<{ campaign_id: string; campaign_title: string }>;
  collected_by: { id: string; display_name: string; avatar_url: string | null };
  created_at: string;
}

export interface StoryListResult {
  data: Story[];
  meta: {
    total: number;
    page: number;
    per_page: number;
    has_next: boolean;
    next_cursor: string | null;
  };
}
