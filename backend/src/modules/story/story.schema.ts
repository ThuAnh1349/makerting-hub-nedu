/**
 * Zod validation schemas for the Story module.
 */

import { z } from "zod";

export const CreateStorySchema = z.object({
  student_name: z.string().min(1, "student_name must not be empty"),
  course_name: z.string().min(1, "course_name must not be empty"),
  pain_point: z.string().min(1, "pain_point must not be empty"),
  transformation: z.string().min(1, "transformation must not be empty"),
  icp_tags: z.array(z.string()).min(1, "At least one icp_tag is required"),
  student_avatar_url: z.string().url("student_avatar_url must be a valid URL").optional(),
  ops_student_ref: z.string().optional(),
});

export const StoryActionSchema = z.discriminatedUnion("action_type", [
  z.object({
    action_type: z.literal("approve"),
  }),
  z.object({
    action_type: z.literal("deploy"),
    campaign_id: z.string().uuid("campaign_id must be a valid UUID"),
    post_id: z.string().uuid("post_id must be a valid UUID").optional(),
  }),
]);

export const StoryListQuerySchema = z.object({
  status: z
    .enum(["pending_review", "approved", "deployed"])
    .optional(),
  icp_tag: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  per_page: z.coerce.number().int().positive().max(100).default(20),
});

export type CreateStoryInput = z.infer<typeof CreateStorySchema>;
export type StoryActionInput = z.infer<typeof StoryActionSchema>;
export type StoryListQuery = z.infer<typeof StoryListQuerySchema>;
