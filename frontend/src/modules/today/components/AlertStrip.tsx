import type { TodaySummary } from '../today.types'

interface AlertStripProps {
  alerts: TodaySummary['alerts']
  onRepNow: (entityId: string) => void
}

export function AlertStrip({ alerts, onRepNow }: AlertStripProps) {
  const leadAlerts = alerts.filter((a) => a.alert_type === 'lead_sla_overdue')

  if (leadAlerts.length === 0) return null

  return (
    <div className="space-y-2 mb-4">
      {leadAlerts.map((alert) => {
        const isCritical =
          alert.minutes_overdue !== null && alert.minutes_overdue > 30

        return (
          <div
            key={alert.entity_id}
            className={
              isCritical
                ? 'bg-red-50 border border-red-300 rounded-xl p-4 flex items-start gap-3'
                : 'bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-start gap-3'
            }
            role="alert"
          >
            {/* Bell icon */}
            <span
              className={`shrink-0 mt-0.5 ${isCritical ? 'text-red-500' : 'text-orange-500'}`}
              aria-hidden="true"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
            </span>

            {/* Message */}
            <span
              className={`flex-1 text-sm font-body ${isCritical ? 'text-red-800' : 'text-orange-800'}`}
            >
              {alert.message}
              {alert.minutes_overdue !== null && (
                <span className="ml-1 font-semibold">
                  ({alert.minutes_overdue} phút)
                </span>
              )}
            </span>

            {/* Action button */}
            <button
              onClick={() => onRepNow(alert.entity_id)}
              className={`shrink-0 text-sm font-semibold font-body underline underline-offset-2 hover:no-underline transition-all ${
                isCritical
                  ? 'text-red-700 hover:text-red-900'
                  : 'text-orange-700 hover:text-orange-900'
              }`}
            >
              Rep ngay →
            </button>
          </div>
        )
      })}
    </div>
  )
}
