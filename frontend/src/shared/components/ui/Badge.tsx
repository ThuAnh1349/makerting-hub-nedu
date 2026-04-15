import { ReactNode } from 'react'
import { clsx } from 'clsx'

type BadgeVariant = 'green' | 'yellow' | 'red' | 'gray' | 'blue' | 'orange'

interface BadgeProps {
  variant?: BadgeVariant
  children: ReactNode
  className?: string
}

const variantClasses: Record<BadgeVariant, string> = {
  green: 'bg-green-100 text-green-800 ring-green-200',
  yellow: 'bg-yellow-100 text-yellow-800 ring-yellow-200',
  red: 'bg-red-100 text-red-800 ring-red-200',
  gray: 'bg-gray-100 text-gray-700 ring-gray-200',
  blue: 'bg-blue-100 text-blue-800 ring-blue-200',
  orange: 'bg-orange-100 text-orange-800 ring-orange-200',
}

export function Badge({ variant = 'gray', children, className }: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ring-1 ring-inset font-body',
        variantClasses[variant],
        className,
      )}
    >
      {children}
    </span>
  )
}
