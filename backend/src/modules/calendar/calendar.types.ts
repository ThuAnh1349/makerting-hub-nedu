/**
 * Calendar module type definitions.
 *
 * The calendar view aggregates approved, scheduled, and published posts
 * onto a timeline grouped by scheduled_at date.
 */

export interface CalendarPost {
  id: string;
  caption: string;
  current_status: "approved" | "scheduled" | "published";
  scheduled_at: string;
  channels: Array<{ code: string; label: string; color_hex: string }>;
  author: { id: string; display_name: string; avatar_url: string | null };
  campaign_id: string | null;
  campaign_title: string | null;
}
