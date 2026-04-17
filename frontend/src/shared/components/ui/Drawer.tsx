import { ReactNode, useEffect } from 'react'
import { clsx } from 'clsx'

interface DrawerProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  subtitle?: string
  icon?: ReactNode
  children: ReactNode
  /** Remove default body padding (for forms that manage their own layout) */
  noPadding?: boolean
}

export function Drawer({ isOpen, onClose, title, subtitle, icon, children, noPadding }: DrawerProps) {
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  return (
    <>
      {/* Overlay */}
      <div
        className={clsx(
          'fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-300',
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer panel */}
      <div
        role="dialog"
        aria-modal="true"
        className={clsx(
          'fixed right-0 top-0 z-50 h-full bg-white shadow-2xl',
          'flex flex-col transition-transform duration-300 ease-in-out',
          isOpen ? 'translate-x-0' : 'translate-x-full',
        )}
        style={{ width: 480, maxWidth: '96vw' }}
      >
        {/* Header */}
        <div style={{
          padding: '13px 15px 10px',
          borderBottom: '1px solid rgba(0,0,0,0.09)',
          background: '#F9FAFB',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              {icon}
              {title && (
                <div>
                  <div style={{ fontSize: 13, fontWeight: 900, color: '#111827' }}>{title}</div>
                  {subtitle && <div style={{ fontSize: 10, color: '#6B7280' }}>{subtitle}</div>}
                </div>
              )}
            </div>
            <button
              onClick={onClose}
              style={{
                width: 28, height: 28, borderRadius: 7,
                border: '1px solid rgba(0,0,0,0.09)', background: '#f3f4f6',
                cursor: 'pointer', fontSize: 16, color: '#6B7280',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                lineHeight: 1,
              }}
              aria-label="Đóng"
            >
              ×
            </button>
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', ...(noPadding ? {} : { padding: '13px 15px' }) }}>
          {children}
        </div>
      </div>
    </>
  )
}
