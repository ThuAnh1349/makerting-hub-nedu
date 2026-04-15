import { Routes, Route, Navigate } from 'react-router-dom'
import { ProtectedRoute } from './protected.routes'
import { PublicRoute } from './public.routes'
import { ErrorBoundary } from '@/shared/components/ErrorBoundary'
import { ROLES } from '@/shared/constants/roles'

// Auth
import { LoginPage } from '@/modules/auth/pages/LoginPage'

// Pages
import { TodayPage } from '@/modules/today/pages/TodayPage'
import { InboxPage } from '@/modules/inbox/pages/InboxPage'
import { ContentPage } from '@/modules/content/pages/ContentPage'
import { CalendarPage } from '@/modules/calendar/pages/CalendarPage'
import { AnalyticsPage } from '@/modules/analytics/pages/AnalyticsPage'
import { DocsPage } from '@/modules/docs/pages/DocsPage'
import { CampaignPage } from '@/modules/campaign/pages/CampaignPage'
import { BrandHealthPage } from '@/modules/brand-health/pages/BrandHealthPage'
import { BudgetPage } from '@/modules/budget/pages/BudgetPage'
import { StoryPage } from '@/modules/story/pages/StoryPage'
import { ReferralPage } from '@/modules/referral/pages/ReferralPage'
import { BriefPage } from '@/modules/brief/pages/BriefPage'

const LEADER_ROLES = [ROLES.CO_LEADER, ROLES.MARKETING_LEADER]
const LEADER_ONLY = [ROLES.MARKETING_LEADER]

export function AppRoutes() {
  return (
    <ErrorBoundary>
      <Routes>
        {/* Root redirect */}
        <Route path="/" element={<Navigate to="/today" replace />} />

        {/* Public routes */}
        <Route element={<PublicRoute />}>
          <Route path="/login" element={<LoginPage />} />
        </Route>

        {/* Protected routes — all authenticated users */}
        <Route element={<ProtectedRoute />}>
          <Route path="/today" element={<ErrorBoundary><TodayPage /></ErrorBoundary>} />
          <Route path="/inbox" element={<ErrorBoundary><InboxPage /></ErrorBoundary>} />
          <Route path="/content" element={<ErrorBoundary><ContentPage /></ErrorBoundary>} />
          <Route path="/calendar" element={<ErrorBoundary><CalendarPage /></ErrorBoundary>} />
          <Route path="/analytics" element={<ErrorBoundary><AnalyticsPage /></ErrorBoundary>} />
          <Route path="/docs" element={<ErrorBoundary><DocsPage /></ErrorBoundary>} />
          <Route path="/stories" element={<ErrorBoundary><StoryPage /></ErrorBoundary>} />
          <Route path="/referral" element={<ErrorBoundary><ReferralPage /></ErrorBoundary>} />
          <Route path="/briefs" element={<ErrorBoundary><BriefPage /></ErrorBoundary>} />
        </Route>

        {/* Protected routes — co_leader + marketing_leader */}
        <Route element={<ProtectedRoute requiredRoles={LEADER_ROLES} />}>
          <Route path="/campaigns" element={<ErrorBoundary><CampaignPage /></ErrorBoundary>} />
          <Route path="/brand-health" element={<ErrorBoundary><BrandHealthPage /></ErrorBoundary>} />
        </Route>

        {/* Protected routes — marketing_leader only */}
        <Route element={<ProtectedRoute requiredRoles={LEADER_ONLY} />}>
          <Route path="/budget" element={<ErrorBoundary><BudgetPage /></ErrorBoundary>} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/today" replace />} />
      </Routes>
    </ErrorBoundary>
  )
}
