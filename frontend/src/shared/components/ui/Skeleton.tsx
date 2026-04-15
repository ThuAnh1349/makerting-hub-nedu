import { clsx } from 'clsx'

type SkeletonVariant = 'line' | 'card' | 'avatar'

interface SkeletonProps {
  variant?: SkeletonVariant
  className?: string
  lines?: number
}

const baseClasses = 'animate-pulse bg-gray-200 rounded'

export function Skeleton({ variant = 'line', className, lines = 1 }: SkeletonProps) {
  if (variant === 'avatar') {
    return (
      <div
        className={clsx(baseClasses, 'w-10 h-10 rounded-full shrink-0', className)}
        aria-hidden="true"
      />
    )
  }

  if (variant === 'card') {
    return (
      <div
        className={clsx(
          'animate-pulse bg-white border border-gray-200 rounded-xl p-4 space-y-3',
          className,
        )}
        aria-hidden="true"
      >
        <div className="flex items-center gap-3">
          <div className={clsx(baseClasses, 'w-8 h-8 rounded-full')} />
          <div className={clsx(baseClasses, 'h-4 w-32 rounded')} />
        </div>
        <div className={clsx(baseClasses, 'h-3 w-full rounded')} />
        <div className={clsx(baseClasses, 'h-3 w-4/5 rounded')} />
        <div className={clsx(baseClasses, 'h-3 w-2/3 rounded')} />
      </div>
    )
  }

  // line variant — can render multiple lines
  return (
    <div className={clsx('space-y-2', className)} aria-hidden="true">
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={clsx(
            baseClasses,
            'h-4 rounded',
            i === lines - 1 && lines > 1 ? 'w-3/4' : 'w-full',
          )}
        />
      ))}
    </div>
  )
}
