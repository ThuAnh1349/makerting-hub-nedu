import { z } from 'zod'

export const CreateBriefSchema = z.object({
  brief_type_code: z.enum(['design', 'video_editing']),
  title: z.string().min(1).max(200),
  description: z.string().min(1),
  deadline: z.string().datetime(),
  size_format: z.string().optional(),
  post_id: z.string().uuid().optional(),
})

export const BriefActionSchema = z.discriminatedUnion('action_type', [
  z.object({ action_type: z.literal('acknowledge') }),
  z.object({
    action_type: z.literal('deliver'),
    deliverable_url: z.string().url('URL file giao nộp là bắt buộc'),
    notes: z.string().optional(),
  }),
  z.object({ action_type: z.literal('complete'), notes: z.string().optional() }),
  z.object({
    action_type: z.literal('request_revision'),
    notes: z.string().min(1, 'Ghi chú yêu cầu chỉnh sửa là bắt buộc'),
  }),
  z.object({ action_type: z.literal('cancel'), notes: z.string().optional() }),
])

export const BriefListQuerySchema = z.object({
  status: z.string().optional(),
  brief_type: z.enum(['design', 'video_editing']).optional(),
  page: z.coerce.number().int().positive().default(1),
  per_page: z.coerce.number().int().positive().max(100).default(20),
})

export type CreateBriefInput = z.infer<typeof CreateBriefSchema>
export type BriefActionInput = z.infer<typeof BriefActionSchema>
