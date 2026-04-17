import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/shared/stores/auth.store'
import { useNotificationStore } from '@/shared/stores/notification.store'
import { ROLES } from '@/shared/constants/roles'

// ── Types ─────────────────────────────────────────────────────────────────────

interface NavSection {
  type: 'section'
  label: string
}

interface NavDivider {
  type: 'divider'
}

interface NavItem {
  type: 'item'
  label: string
  path: string
  emoji: string
  badge?: string
  badgeColor?: string
  requiredRoles?: string[]
}

type NavEntry = NavSection | NavDivider | NavItem

// ── Navigation config (mirrors marketing-hub-v8.html sidebar) ────────────────

const NAV_ENTRIES: NavEntry[] = [
  { type: 'item', label: 'Hôm nay',       path: '/today',        emoji: '🏠' },
  { type: 'item', label: 'Inbox & Lead',   path: '/inbox',        emoji: '📩' },
  { type: 'item', label: 'Nội dung',       path: '/content',      emoji: '✍️' },
  { type: 'item', label: 'Lịch đăng bài',  path: '/calendar',     emoji: '📅' },
  { type: 'item', label: 'Kết quả & KPI',  path: '/analytics',    emoji: '📊' },
  { type: 'divider' },
  { type: 'item', label: 'Hệ thống',       path: '/docs',         emoji: '🗂' },
  { type: 'divider' },
  { type: 'section', label: 'Tăng trưởng dài hạn' },
  {
    type: 'item', label: 'Brand Health',   path: '/brand-health', emoji: '🌡',
    requiredRoles: [ROLES.CO_LEADER, ROLES.MARKETING_LEADER],
  },
  {
    type: 'item', label: 'Campaign View',  path: '/campaigns',    emoji: '🎯',
    badge: '2 live', badgeColor: '#ea580c',
    requiredRoles: [ROLES.CO_LEADER, ROLES.MARKETING_LEADER],
  },
  {
    type: 'item', label: 'Story Pipeline', path: '/stories',      emoji: '✨',
    badge: '4 mới', badgeColor: '#7C3AED',
  },
  {
    type: 'item', label: 'Budget & ROI',   path: '/budget',       emoji: '💰',
    requiredRoles: [ROLES.MARKETING_LEADER],
  },
  {
    type: 'item', label: 'Referral Loop',  path: '/referral',     emoji: '🔄',
    badge: '12', badgeColor: '#16a34a',
  },
  { type: 'divider' },
  { type: 'section', label: 'Đặt việc' },
  { type: 'item', label: 'Đặt Design',     path: '/briefs?type=design',         emoji: '🎨' },
  { type: 'item', label: 'Đặt Editing',    path: '/briefs?type=video_editing',  emoji: '🎬' },
]

// ── Sidebar Component ─────────────────────────────────────────────────────────

export function Sidebar() {
  const { user, hasAnyRole, logout } = useAuthStore()
  const unreadCount = useNotificationStore((s) => s.unreadCount)
  const navigate = useNavigate()
  const location = useLocation()

  // Active check hỗ trợ cả query params (vd: /briefs?type=design)
  function isNavActive(path: string) {
    const [pathname, search] = path.split('?')
    if (search) {
      return location.pathname === pathname && location.search === `?${search}`
    }
    return location.pathname === pathname
  }

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <aside
      style={{
        width: 192,
        minWidth: 192,
        background: '#fff',
        borderRight: '1px solid rgba(0,0,0,0.09)',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflowY: 'auto',
        flexShrink: 0,
      }}
    >
      {/* Logo / App header */}
      <div style={{
        padding: '12px 10px 8px',
        borderBottom: '1px solid rgba(0,0,0,0.07)',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}>
        <div style={{
          width: 28,
          height: 28,
          background: 'linear-gradient(135deg,#ea580c,#c83800)',
          borderRadius: 7,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 16,
          flexShrink: 0,
        }}>
          📣
        </div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#111827', lineHeight: 1.2 }}>
            Marketing Hub
          </div>
          <div style={{ fontSize: 10, color: '#9ca3af', lineHeight: 1.2 }}>
            Phễu 1 · Thu hút
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '8px 0', overflowY: 'auto' }}>
        {NAV_ENTRIES.map((entry, idx) => {
          if (entry.type === 'divider') {
            return (
              <div key={idx} style={{
                height: 1,
                background: 'rgba(0,0,0,0.07)',
                margin: '4px 8px',
              }} />
            )
          }

          if (entry.type === 'section') {
            return (
              <div key={idx} style={{
                fontSize: 9,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: '#9ca3af',
                padding: '8px 12px 2px',
              }}>
                {entry.label}
              </div>
            )
          }

          // NavItem
          if (entry.requiredRoles && !hasAnyRole(entry.requiredRoles)) return null

          const isInbox = entry.path === '/inbox'
          const active = isNavActive(entry.path)

          return (
            <NavLink
              key={entry.path}
              to={entry.path}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                width: 'calc(100% - 8px)',
                padding: '5px 8px',
                borderRadius: 8,
                cursor: 'pointer',
                fontSize: 11,
                fontWeight: 500,
                color: active ? '#111827' : '#374151',
                background: active ? 'rgba(45,155,107,0.1)' : 'transparent',
                textDecoration: 'none',
                margin: '1px 4px',
                transition: 'background 0.15s',
              }}
            >
              {() => (
                <>
                  <div style={{
                    width: 30,
                    height: 30,
                    borderRadius: 7,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 16,
                    flexShrink: 0,
                    background: active
                      ? 'linear-gradient(135deg,#2d9b6b,#22c575)'
                      : '#f3f4f6',
                  }}>
                    {entry.emoji}
                  </div>
                  <span style={{ flex: 1, fontSize: 11, fontWeight: 500, lineHeight: 1.3 }}>
                    {entry.label}
                  </span>
                  {/* Notification badge for inbox */}
                  {isInbox && unreadCount > 0 && (
                    <span style={{
                      background: '#ef4444',
                      color: '#fff',
                      borderRadius: 999,
                      fontSize: 10,
                      fontWeight: 700,
                      padding: '1px 5px',
                      lineHeight: 1.4,
                    }}>
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                  {/* Optional badge */}
                  {entry.badge && (
                    <span style={{
                      background: entry.badgeColor ?? '#2d9b6b',
                      color: '#fff',
                      borderRadius: 999,
                      fontSize: 10,
                      fontWeight: 700,
                      padding: '1px 5px',
                      lineHeight: 1.4,
                      whiteSpace: 'nowrap',
                    }}>
                      {entry.badge}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          )
        })}
      </nav>

      {/* User footer */}
      {user && (
        <div style={{
          padding: '8px 10px',
          borderTop: '1px solid rgba(0,0,0,0.07)',
          display: 'flex',
          alignItems: 'center',
          gap: 7,
        }}>
          {user.avatar_url ? (
            <img
              src={user.avatar_url}
              alt={user.display_name}
              style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
            />
          ) : (
            <div style={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              background: 'linear-gradient(135deg,#2d9b6b,#22c575)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontSize: 11,
              fontWeight: 700,
              flexShrink: 0,
            }}>
              {user.display_name.charAt(0).toUpperCase()}
            </div>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user.display_name}
            </div>
            <div style={{ fontSize: 10, color: '#9ca3af', textTransform: 'capitalize' }}>
              {user.roles[0]?.replace(/_/g, ' ')}
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Đăng xuất"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 4,
              borderRadius: 6,
              color: '#9ca3af',
              fontSize: 14,
              lineHeight: 1,
            }}
          >
            ↪
          </button>
        </div>
      )}
    </aside>
  )
}
