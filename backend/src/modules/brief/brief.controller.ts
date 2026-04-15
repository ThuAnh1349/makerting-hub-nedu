import { handleError } from '../../shared/middleware/error.handler.js'
import type { RequestContext } from '../../shared/middleware/auth.middleware.js'
import { CreateBriefSchema, BriefActionSchema, BriefListQuerySchema } from './brief.schema.js'
import { listBriefs, getBriefById, createBrief, performBriefAction } from './brief.service.js'

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
}

export async function handleListBriefs(req: Request, ctx: RequestContext): Promise<Response> {
  try {
    const url = new URL(req.url)
    const raw = Object.fromEntries(url.searchParams)
    const query = BriefListQuerySchema.parse({
      ...raw,
      status: raw.status ? raw.status.split(',') : undefined,
    })
    const result = await listBriefs(ctx.user.id, ctx.user.roles, query)
    return json(result)
  } catch (err) { return handleError(err, ctx.request_id) }
}

export async function handleGetBrief(req: Request, ctx: RequestContext, briefId: string): Promise<Response> {
  try {
    const brief = await getBriefById(briefId, ctx.user.id, ctx.user.roles)
    return json(brief)
  } catch (err) { return handleError(err, ctx.request_id) }
}

export async function handleCreateBrief(req: Request, ctx: RequestContext): Promise<Response> {
  try {
    const body = await req.json()
    const data = CreateBriefSchema.parse(body)
    const brief = await createBrief(data, ctx.user.id)
    return json(brief, 201)
  } catch (err) { return handleError(err, ctx.request_id) }
}

export async function handleBriefAction(req: Request, ctx: RequestContext, briefId: string): Promise<Response> {
  try {
    const body = await req.json()
    const action = BriefActionSchema.parse(body)
    const brief = await performBriefAction(briefId, ctx.user.id, ctx.user.roles, action)
    return json(brief)
  } catch (err) { return handleError(err, ctx.request_id) }
}
