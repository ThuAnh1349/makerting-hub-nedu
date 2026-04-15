interface SentimentChartProps {
  positive: number
  neutral: number
  negative: number
}

export function SentimentChart({ positive, neutral, negative }: SentimentChartProps) {
  const total = positive + neutral + negative
  const posPct = total > 0 ? (positive / total) * 100 : 0
  const neuPct = total > 0 ? (neutral / total) * 100 : 0
  const negPct = total > 0 ? (negative / total) * 100 : 0

  return (
    <div className="space-y-3">
      {/* Stacked bar */}
      <div className="w-full h-5 rounded-full overflow-hidden flex">
        {posPct > 0 && (
          <div
            className="bg-green-500 h-full transition-all"
            style={{ width: `${posPct}%` }}
            title={`Tích cực ${posPct.toFixed(1)}%`}
          />
        )}
        {neuPct > 0 && (
          <div
            className="bg-gray-300 h-full transition-all"
            style={{ width: `${neuPct}%` }}
            title={`Trung tính ${neuPct.toFixed(1)}%`}
          />
        )}
        {negPct > 0 && (
          <div
            className="bg-red-500 h-full transition-all"
            style={{ width: `${negPct}%` }}
            title={`Tiêu cực ${negPct.toFixed(1)}%`}
          />
        )}
        {total === 0 && (
          <div className="bg-gray-100 h-full w-full" />
        )}
      </div>

      {/* Labels */}
      <div className="flex gap-4 text-xs font-body text-gray-600 flex-wrap">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-green-500 shrink-0" />
          Tích cực {posPct.toFixed(0)}%
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-gray-300 shrink-0" />
          Trung tính {neuPct.toFixed(0)}%
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-red-500 shrink-0" />
          Tiêu cực {negPct.toFixed(0)}%
        </span>
      </div>
    </div>
  )
}
