/**
 * Type definitions for the Campaign module.
 */

export type CampaignPhase = "opening" | "build" | "close" | "cta" | "completed";

export interface Post {
  id: string;
  title: string;
  status: string;
  platform: string | null;
  scheduled_at: string | null;
  created_at: string;
}

export interface Campaign {
  id: string;
  title: string;
  description: string | null;
  current_phase: CampaignPhase;
  start_date: string | null;
  end_date: string | null;
  created_by: {
    id: string;
    display_name: string;
    avatar_url: string | null;
  };
  post_counts: {
    total: number;
    published: number;
    scheduled: number;
    draft: number;
  };
  posts?: Post[];
  created_at: string;
}
