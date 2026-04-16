import { ReactNode } from 'react'

interface EmptyStateAction {
  label: string
  onClick: () => void
}

interface EmptyStateProps {
  title: string
  description?: string
  icon?: ReactNode
  action?: EmptyStateAction
  className?: string
}

export function EmptyState({
  title,
  description,
  icon,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={className}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 24px',
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.5 }}>
        {icon ?? '📭'}
      </div>
      <div style={{ fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
        {title}
      </div>
      {description && (
        <div style={{ fontSize: 12, color: '#9ca3af', maxWidth: 280, lineHeight: 1.5 }}>
          {description}
        </div>
      )}
      {action && (
        <button
          onClick={action.onClick}
          style={{
            marginTop: 14,
            padding: '7px 14px',
            background: 'linear-gradient(135deg,#2d9b6b,#22c575)',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            fontSize: 12,
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          {action.label}
        </button>
      )}
    </div>
  )
}
