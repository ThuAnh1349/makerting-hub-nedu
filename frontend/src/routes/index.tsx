import { Routes, Route, Navigate } from 'react-router-dom'
import { ProtectedRoute } from './protected.routes'
import { PublicRoute } from './public.routes'
import { ErrorBoundary } from '@/shared/components/ErrorBoundary'
import { ROLES } from '@/shared/constants/roles'

// Auth
import { LoginPage } from '@/modules/auth/pages/LoginPage'

// Dashboard (was: today)
import { TodayPage as DashboardPage } from '@/modules/today/pages/TodayPage'

// Leads (was: inbox)
import { InboxPage as LeadsPage } from '@/modules/inbox/pages/InboxPage'

// Posts (was: content)
import { ContentPage as PostsPage } from '@/modules/content/pages/ContentPage'

// Calendar
import { CalendarPage } from '@/modules/calendar/pages/CalendarPage'

// Analytics
import { AnalyticsPage } from '@/modules/analytics/pages/AnalyticsPage'

// Documents (was: docs)
import { DocsPage as DocumentsPage } from '@/modules/docs/pages/DocsPage'

// Campaigns (was: campaign)
import { CampaignPage as CampaignsPage } from '@/modules/campaign/pages/CampaignPage'

// Brand Health
import { BrandHealthPage } from '@/modules/brand-health/pages/BrandHealthPage'

// Budget
import { BudgetPage } from '@/modules/budget/pages/BudgetPage'

// Stories (was: story)
import { StoryPage as StoriesPage } from '@/modules/story/pages/StoryPage'

// Referrals (was: referral)
import { ReferralPage as ReferralsPage } from '@/modules/referral/pages/ReferralPage'

// Briefs (was: brief)
import { BriefPage as BriefsPage } from '@/modules/brief/pages/BriefPage'

const LEADER_ROLES = [ROLES.CO_LEADER, ROLES.MARKETING_LEADER]
const LEADER_ONLY = [ROLES.MARKETING_LEADER]

export function AppRoutes() {
  return (
    <ErrorBoundary>
      <Routes>
        {/* Root redirect */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* Public routes */}
        <Route element={<PublicRoute />}>
          <Route path="/login" element={<LoginPage />} />
        </Route>

        {/* Protected routes — all authenticated users */}
        <Route element={<ProtectedRoute />}>
          {/* New canonical paths */}
          <Route path="/dashboard" element={<ErrorBoundary><DashboardPage /></ErrorBoundary>} />
          <Route path="/leads" element={<ErrorBoundary><LeadsPage /></ErrorBoundary>} />
          <Route path="/posts" element={<ErrorBoundary><PostsPage /></ErrorBoundary>} />
          <Route path="/calendar" element={<ErrorBoundary><CalendarPage /></ErrorBoundary>} />
          <Route path="/analytics" element={<ErrorBoundary><AnalyticsPage /></ErrorBoundary>} />
          <Route path="/documents" element={<ErrorBoundary><DocumentsPage /></ErrorBoundary>} />
          <Route path="/stories" element={<ErrorBoundary><StoriesPage /></ErrorBoundary>} />
          <Route path="/referrals" element={<ErrorBoundary><ReferralsPage /></ErrorBoundary>} />
          <Route path="/briefs" element={<ErrorBoundary><BriefsPage /></ErrorBoundary>} />

          {/* Legacy redirects — keep working links */}
          <Route path="/today" element={<Navigate to="/dashboard" replace />} />
          <Route path="/inbox" element={<Navigate to="/leads" replace />} />
          <Route path="/content" element={<Navigate to="/posts" replace />} />
          <Route path="/docs" element={<Navigate to="/documents" replace />} />
          <Route path="/story" element={<Navigate to="/stories" replace />} />
          <Route path="/referral" element={<Navigate to="/referrals" replace />} />
          <Route path="/brief" element={<Navigate to="/briefs" replace />} />
        </Route>

        {/* Protected routes — co_leader + marketing_leader */}
        <Route element={<ProtectedRoute requiredRoles={LEADER_ROLES} />}>
          <Route path="/campaigns" element={<ErrorBoundary><CampaignsPage /></ErrorBoundary>} />
          <Route path="/brand-health" element={<ErrorBoundary><BrandHealthPage /></ErrorBoundary>} />
          {/* Legacy redirect */}
          <Route path="/campaign" element={<Navigate to="/campaigns" replace />} />
        </Route>

        {/* Protected routes — marketing_leader only */}
        <Route element={<ProtectedRoute requiredRoles={LEADER_ONLY} />}>
          <Route path="/budget" element={<ErrorBoundary><BudgetPage /></ErrorBoundary>} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </ErrorBoundary>
  )
}
