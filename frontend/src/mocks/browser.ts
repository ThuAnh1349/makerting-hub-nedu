// src/mocks/browser.ts
import { setupWorker } from 'msw/browser'

// ── New architecture handlers (v1.3) ──────────────────────────────────────────
import { authHandlers }          from './handlers/auth'
import { dashboardHandlers }     from './handlers/dashboard'
import { leadsHandlers }         from './handlers/leads'
import { postsHandlers }         from './handlers/posts'
import { analyticsHandlers }     from './handlers/analytics'
import { brandHealthHandlers }   from './handlers/brand-health'
import { campaignsHandlers }     from './handlers/campaigns'
import { storiesHandlers }       from './handlers/stories'
import { budgetHandlers }        from './handlers/budget'
import { referralsHandlers }     from './handlers/referrals'
import { briefsHandlers }        from './handlers/briefs'
import { notificationsHandlers } from './handlers/notifications'
import { documentsHandlers }     from './handlers/documents'

// ── Legacy handlers — cover old /api/v1/marketing/* paths used by existing module pages ──
import { todayHandlers }         from './handlers/today.mock'
import { leadHandlers }          from './handlers/lead.mock'
import { postHandlers }          from './handlers/post.mock'
import { channelHandlers }       from './handlers/channel.mock'
import { notificationHandlers }  from './handlers/notification.mock'
import { calendarHandlers }      from './handlers/calendar.mock'
import { analyticsHandlers as analyticsLegacyHandlers }   from './handlers/analytics.mock'
import { brandHealthHandlers as brandHealthLegacyHandlers } from './handlers/brand-health.mock'
import { campaignHandlers }      from './handlers/campaign.mock'
import { briefHandlers }         from './handlers/brief.mock'
import { docsHandlers }          from './handlers/docs.mock'
import { storyHandlers }         from './handlers/story.mock'
import { budgetHandlers as budgetLegacyHandlers }          from './handlers/budget.mock'
import { referralHandlers }      from './handlers/referral.mock'

export const worker = setupWorker(
  // New architecture handlers (v1.3) — /api/mkt/* endpoints
  ...authHandlers,
  ...dashboardHandlers,
  ...leadsHandlers,
  ...postsHandlers,
  ...analyticsHandlers,
  ...brandHealthHandlers,
  ...campaignsHandlers,
  ...storiesHandlers,
  ...budgetHandlers,
  ...referralsHandlers,
  ...briefsHandlers,
  ...notificationsHandlers,
  ...documentsHandlers,

  // Legacy handlers — /api/v1/marketing/* endpoints used by existing module pages
  ...todayHandlers,
  ...leadHandlers,
  ...postHandlers,
  ...channelHandlers,
  ...notificationHandlers,
  ...calendarHandlers,
  ...analyticsLegacyHandlers,
  ...brandHealthLegacyHandlers,
  ...campaignHandlers,
  ...briefHandlers,
  ...docsHandlers,
  ...storyHandlers,
  ...budgetLegacyHandlers,
  ...referralHandlers,
)
