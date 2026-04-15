import { ReactNode } from 'react'
import { clsx } from 'clsx'

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
      className={clsx(
        'flex flex-col items-center justify-center py-16 px-6 text-center',
        className,
      )}
    >
      {icon && (
        <div className="mb-4 text-gray-300 [&_svg]:w-16 [&_svg]:h-16">{icon}</div>
      )}
      {!icon && (
        <div className="mb-4 text-gray-300">
          <svg
            className="w-16 h-16 mx-auto"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
            />
          </svg>
        </div>
      )}
      <h3 className="text-lg font-semibold font-headline text-gray-700 mb-1">
        {title}
      </h3>
      {description && (
        <p className="text-sm text-gray-500 font-body max-w-sm">{description}</p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="mt-4 inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-nedu-primary rounded-lg hover:bg-nedu-primary-600 transition-colors font-body"
        >
          {action.label}
        </button>
      )}
    </div>
  )
}
