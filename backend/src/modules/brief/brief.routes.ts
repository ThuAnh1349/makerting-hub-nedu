import type { RequestContext } from '../../shared/middleware/auth.middleware.js'
import { handleListBriefs, handleGetBrief, handleCreateBrief, handleBriefAction } from './brief.controller.js'

const BRIEFS_RE     = /^\/api\/v1\/marketing\/briefs$/
const BRIEF_ID_RE   = /^\/api\/v1\/marketing\/briefs\/(?<briefId>[^/]+)$/
const BRIEF_ACT_RE  = /^\/api\/v1\/marketing\/briefs\/(?<briefId>[^/]+)\/actions$/

export async function briefRoutes(req: Request, ctx: RequestContext): Promise<Response | null> {
  const { pathname } = new URL(req.url)

  if (BRIEF_ACT_RE.test(pathname) && req.method === 'POST') {
    const { briefId } = BRIEF_ACT_RE.exec(pathname)!.groups!
    return handleBriefAction(req, ctx, briefId)
  }
  if (BRIEF_ID_RE.test(pathname) && req.method === 'GET') {
    const { briefId } = BRIEF_ID_RE.exec(pathname)!.groups!
    return handleGetBrief(req, ctx, briefId)
  }
  if (BRIEFS_RE.test(pathname)) {
    if (req.method === 'GET')  return handleListBriefs(req, ctx)
    if (req.method === 'POST') return handleCreateBrief(req, ctx)
  }
  return null
}
