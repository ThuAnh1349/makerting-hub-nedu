import { ReactNode } from 'react'
import { Sidebar } from './Sidebar'
import { useAuthStore } from '@/shared/stores/auth.store'
import { useNotificationStore } from '@/shared/stores/notification.store'

interface PageLayoutProps {
  title: string
  subtitle?: string
  children?: ReactNode
  actions?: ReactNode
  /** Remove the standard page header (for pages that have their own header) */
  noHeader?: boolean
}

export function PageLayout({ title, subtitle, children, actions, noHeader }: PageLayoutProps) {
  const user = useAuthStore((s) => s.user)
  const unreadCount = useNotificationStore((s) => s.unreadCount)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#F0F4F8', overflow: 'hidden' }}>
      {/* ── ws-topbar ─────────────────────────────────────────────────────── */}
      <div style={{
        height: 44,
        minHeight: 44,
        background: '#fff',
        borderBottom: '1px solid rgba(0,0,0,0.09)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 16px',
        gap: 10,
        flexShrink: 0,
        zIndex: 100,
      }}>
        <button style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontSize: 13,
          color: '#6b7280',
          padding: '2px 8px',
          borderRadius: 6,
        }}>
          ‹ Workspace
        </button>
        <div style={{ width: 1, height: 20, background: 'rgba(0,0,0,0.1)' }} />
        <div style={{
          width: 28,
          height: 28,
          background: 'linear-gradient(135deg,#ea580c,#c83800)',
          borderRadius: 7,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 16,
        }}>
          📣
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#111827', lineHeight: 1.2 }}>
            Marketing Hub
          </div>
          <div style={{ fontSize: 10, color: '#6b7280', lineHeight: 1.2 }}>
            space.nedu.vn · Phễu tầng 1 · Thu hút &amp; Chuyển đổi
          </div>
        </div>
        <div style={{ flex: 1 }} />
        {/* Recording indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#6b7280' }}>
          <span style={{
            width: 7,
            height: 7,
            borderRadius: '50%',
            background: '#2d9b6b',
            display: 'inline-block',
            boxShadow: '0 0 0 2px rgba(45,155,107,0.3)',
            animation: 'pulse 2s infinite',
          }} />
          Đang ghi
        </div>
        {/* User avatar */}
        {user && (
          <div style={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            background: 'linear-gradient(135deg,#2d9b6b,#22c575)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: 12,
            fontWeight: 700,
            cursor: 'pointer',
          }}>
            {user.display_name.charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      {/* ── Body row ──────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}>
        <Sidebar />

        {/* Main area */}
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          {/* Page nav / header */}
          {!noHeader && (
            <div style={{
              height: 52,
              minHeight: 52,
              background: '#fff',
              borderBottom: '1px solid rgba(0,0,0,0.09)',
              display: 'flex',
              alignItems: 'center',
              padding: '0 20px',
              gap: 12,
              flexShrink: 0,
              zIndex: 90,
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#111827', lineHeight: 1.2 }}>
                  {title}
                </div>
                {subtitle && (
                  <div style={{ fontSize: 11, color: '#6b7280', lineHeight: 1.2 }}>
                    {subtitle}
                  </div>
                )}
              </div>
              {/* Notification bell */}
              <button style={{
                position: 'relative',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: 18,
                padding: 4,
                borderRadius: 8,
                color: '#374151',
                flexShrink: 0,
              }}>
                🔔
                {unreadCount > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: 2,
                    right: 2,
                    background: '#ef4444',
                    color: '#fff',
                    borderRadius: 999,
                    fontSize: 9,
                    fontWeight: 700,
                    padding: '0 3px',
                    lineHeight: '14px',
                    minWidth: 14,
                    textAlign: 'center',
                  }}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
              {actions && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                  {actions}
                </div>
              )}
            </div>
          )}

          {/* Page content — only this scrolls */}
          <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: 20 }}>
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
