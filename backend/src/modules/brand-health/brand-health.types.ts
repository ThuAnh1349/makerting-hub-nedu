/**
 * Type definitions for the Brand Health module.
 */

export interface BrandHealthEntry {
  id: string;
  week_start: string;
  nps_score: number | null;
  share_of_voice_pct: number | null;
  brand_mentions: number | null;
  sentiment_positive: number | null;
  sentiment_neutral: number | null;
  sentiment_negative: number | null;
  negative_topics: Array<{ topic: string; mention_count: number }>;
  data_source: "manual" | "api_brand24";
  recorded_by_name: string;
  created_at: string;
}

export interface CrisisProtocol {
  id: string;
  title: string;
  description: string | null;
  activated_by_name: string;
  steps_status: Array<{
    step: number;
    label: string;
    completed: boolean;
    completed_at: string | null;
  }>;
  is_resolved: boolean;
  resolved_at: string | null;
  created_at: string;
}
