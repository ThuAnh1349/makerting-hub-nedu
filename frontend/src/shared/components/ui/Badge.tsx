import { ReactNode } from 'react'

type BadgeVariant = 'green' | 'yellow' | 'red' | 'gray' | 'blue' | 'orange' | 'purple'

interface BadgeProps {
  variant?: BadgeVariant
  children: ReactNode
  className?: string
}

const variantStyles: Record<BadgeVariant, React.CSSProperties> = {
  green:  { background: 'rgba(45,155,107,0.1)',  color: '#1a5c46' },
  yellow: { background: 'rgba(217,119,6,0.1)',   color: '#92400e' },
  red:    { background: 'rgba(239,68,68,0.1)',   color: '#b91c1c' },
  gray:   { background: 'rgba(0,0,0,0.06)',      color: '#374151' },
  blue:   { background: 'rgba(37,99,235,0.1)',   color: '#1d4ed8' },
  orange: { background: 'rgba(234,88,12,0.1)',   color: '#9a3412' },
  purple: { background: 'rgba(124,58,237,0.1)',  color: '#5b21b6' },
}

export function Badge({ variant = 'gray', children, className }: BadgeProps) {
  return (
    <span
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '2px 8px',
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 600,
        lineHeight: 1.5,
        ...variantStyles[variant],
      }}
    >
      {children}
    </span>
  )
}
