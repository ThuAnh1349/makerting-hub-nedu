/**
 * Post module Zod validation schemas.
 *
 * Used by controllers to parse and validate incoming request bodies.
 */

import { z } from "zod";

// ── CreatePost ────────────────────────────────────────────────────────────────

export const CreatePostSchema = z.object({
  caption: z.string().min(1, "Caption is required").max(5000),
  channel_codes: z
    .array(z.string().min(1))
    .min(1, "At least one channel is required"),
  reference_links: z
    .array(
      z.object({
        url: z.string().url("Invalid URL in reference_links"),
        label: z.string().min(1, "Link label is required"),
      })
    )
    .optional()
    .default([]),
  campaign_id: z.string().uuid("campaign_id must be a valid UUID").optional(),
  scheduled_at: z
    .string()
    .datetime({ message: "scheduled_at must be a valid ISO datetime" })
    .optional(),
});

export type CreatePostInput = z.infer<typeof CreatePostSchema>;

// ── UpdatePost ────────────────────────────────────────────────────────────────

export const UpdatePostSchema = z.object({
  caption: z.string().min(1).max(5000).optional(),
  channel_codes: z.array(z.string().min(1)).min(1).optional(),
  reference_links: z
    .array(
      z.object({
        url: z.string().url("Invalid URL in reference_links"),
        label: z.string().min(1),
      })
    )
    .optional(),
  scheduled_at: z
    .string()
    .datetime({ message: "scheduled_at must be a valid ISO datetime" })
    .nullable()
    .optional(),
});

export type UpdatePostInput = z.infer<typeof UpdatePostSchema>;

// ── PostAction ────────────────────────────────────────────────────────────────

export const PostActionSchema = z.discriminatedUnion("action_type", [
  z.object({
    action_type: z.literal("submit_review"),
  }),
  z.object({
    action_type: z.literal("approve"),
    notes: z.string().optional(),
  }),
  z.object({
    action_type: z.literal("reject"),
    notes: z.string().min(1, "Ghi chú từ chối là bắt buộc"),
  }),
  z.object({
    action_type: z.literal("schedule"),
    scheduled_at: z.string().datetime({ message: "scheduled_at must be a valid ISO datetime" }),
  }),
]);

export type PostActionInput = z.infer<typeof PostActionSchema>;

// ── PostListQuery ─────────────────────────────────────────────────────────────

export const PostListQuerySchema = z.object({
  status: z
    .string()
    .optional()
    .transform((v) => (v ? v.split(",") : undefined)),
  campaign_id: z.string().uuid().optional(),
  channel_code: z.string().optional(),
  page: z
    .string()
    .optional()
    .transform((v) => (v ? Math.max(1, parseInt(v, 10)) : 1)),
  per_page: z
    .string()
    .optional()
    .transform((v) =>
      v ? Math.min(100, Math.max(1, parseInt(v, 10))) : 20
    ),
});

export type PostListQueryInput = z.infer<typeof PostListQuerySchema>;
