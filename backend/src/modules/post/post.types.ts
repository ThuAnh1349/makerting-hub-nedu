/**
 * Post module type definitions.
 *
 * Covers post status lifecycle, media attachments, approval events,
 * and the full Post entity shape returned by the API.
 */

export type PostStatus =
  | "draft"
  | "pending_review"
  | "approved"
  | "scheduled"
  | "published"
  | "rejected";

export type PostActionType =
  | "submit_review"
  | "approve"
  | "reject"
  | "schedule";

export interface PostMedia {
  id: string;
  media_type: "image" | "video";
  url: string;
  thumbnail_url: string | null;
  duration_seconds: number | null;
  sort_order: number;
}

export interface PostApprovalEvent {
  event_type:
    | "submitted_for_review"
    | "approved"
    | "rejected"
    | "revision_requested";
  actor_name: string;
  notes: string | null;
  created_at: string;
}

export interface Post {
  id: string;
  caption: string;
  reference_links: Array<{ url: string; label: string }>;
  current_status: PostStatus;
  scheduled_at: string | null;
  published_at: string | null;
  author: { id: string; display_name: string; avatar_url: string | null };
  channels: Array<{ code: string; label: string; color_hex: string }>;
  campaign_id: string | null;
  campaign_title: string | null;
  media: PostMedia[];
  latest_approval_note: string | null;
  approval_history?: PostApprovalEvent[];
  created_at: string;
}

export interface PostListResult {
  data: Post[];
  meta: {
    total: number;
    page: number;
    per_page: number;
    has_next: boolean;
    next_cursor: string | null;
  };
}

export interface PostFilters {
  status?: PostStatus[];
  campaign_id?: string;
  channel_code?: string;
  page?: number;
  per_page?: number;
}
