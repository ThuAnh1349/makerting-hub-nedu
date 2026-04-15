interface NPSCardProps {
  npsScore: number | null
}

function npsColor(score: number): { text: string; bg: string; ring: string } {
  if (score >= 50) return { text: 'text-green-600', bg: 'bg-green-50', ring: 'ring-green-200' }
  if (score >= 30) return { text: 'text-yellow-600', bg: 'bg-yellow-50', ring: 'ring-yellow-200' }
  return { text: 'text-red-600', bg: 'bg-red-50', ring: 'ring-red-200' }
}

export function NPSCard({ npsScore }: NPSCardProps) {
  const colors = npsScore !== null ? npsColor(npsScore) : null

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-3">
      <p className="text-xs font-medium text-gray-500 font-body uppercase tracking-wide">
        NPS Score
      </p>

      {npsScore !== null && colors ? (
        <>
          <div
            className={`inline-flex items-center justify-center w-20 h-20 rounded-full ring-4 ${colors.bg} ${colors.ring}`}
          >
            <span className={`text-3xl font-bold font-headline ${colors.text}`}>
              {npsScore}
            </span>
          </div>

          <div className="space-y-1">
            <p className={`text-sm font-medium font-body ${colors.text}`}>
              {npsScore >= 50
                ? 'Xuất sắc'
                : npsScore >= 30
                ? 'Ổn định'
                : 'Cần cải thiện'}
            </p>
            {npsScore < 30 && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-700 font-body">
                <span className="shrink-0">⚠️</span>
                <span>NPS di động — cần hành động ngay</span>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 ring-4 ring-gray-200">
          <span className="text-2xl font-bold text-gray-300">—</span>
        </div>
      )}
    </div>
  )
}
