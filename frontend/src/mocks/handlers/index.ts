import { todayHandlers } from './today.mock'
import { leadHandlers } from './lead.mock'
import { postHandlers } from './post.mock'
import { channelHandlers } from './channel.mock'
import { notificationHandlers } from './notification.mock'
import { calendarHandlers } from './calendar.mock'
import { analyticsHandlers } from './analytics.mock'
import { brandHealthHandlers } from './brand-health.mock'
import { campaignHandlers } from './campaign.mock'
import { briefHandlers } from './brief.mock'
import { docsHandlers } from './docs.mock'
import { storyHandlers } from './story.mock'
import { budgetHandlers } from './budget.mock'
import { referralHandlers } from './referral.mock'

export const handlers = [
  ...todayHandlers,
  ...leadHandlers,
  ...postHandlers,
  ...channelHandlers,
  ...notificationHandlers,
  ...calendarHandlers,
  ...analyticsHandlers,
  ...brandHealthHandlers,
  ...campaignHandlers,
  ...briefHandlers,
  ...docsHandlers,
  ...storyHandlers,
  ...budgetHandlers,
  ...referralHandlers,
]
