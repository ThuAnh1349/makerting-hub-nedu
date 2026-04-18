// src/mocks/handlers/index.ts
// Aggregate all handlers — used by browser.ts via direct imports
// This file kept for backward compatibility
import { authHandlers }          from './auth'
import { dashboardHandlers }     from './dashboard'
import { leadsHandlers }         from './leads'
import { postsHandlers }         from './posts'
import { analyticsHandlers }     from './analytics'
import { brandHealthHandlers }   from './brand-health'
import { campaignsHandlers }     from './campaigns'
import { storiesHandlers }       from './stories'
import { budgetHandlers }        from './budget'
import { referralsHandlers }     from './referrals'
import { briefsHandlers }        from './briefs'
import { notificationsHandlers } from './notifications'
import { documentsHandlers }     from './documents'

export const handlers = [
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
]
