interface ReturnedLeadBannerProps {
  reason: string
}

export function ReturnedLeadBanner({ reason }: ReturnedLeadBannerProps) {
  return (
    <div
      className="bg-yellow-50 border border-yellow-300 rounded-lg p-4 mb-4"
      role="alert"
    >
      <div className="flex items-start gap-2">
        <span className="text-yellow-600 shrink-0 mt-0.5" aria-hidden="true">
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
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-yellow-800 font-headline">
            Lead bị Tư vấn viên trả về
          </p>
          <p className="mt-1 text-sm text-yellow-700 font-body italic">
            &ldquo;{reason}&rdquo;
          </p>
          <p className="mt-1 text-xs text-yellow-600 font-body">
            Gợi ý: Phân loại lại hoặc đánh dấu Rác
          </p>
        </div>
      </div>
    </div>
  )
}
