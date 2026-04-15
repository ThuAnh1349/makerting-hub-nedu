interface Channel {
  code: string
  label: string
  color_hex: string
}

interface ChannelBadgeProps {
  channel: Channel
  className?: string
}

export function ChannelBadge({ channel, className }: ChannelBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 font-body ${className ?? ''}`}
    >
      <span
        className="w-2 h-2 rounded-full shrink-0"
        style={{ backgroundColor: channel.color_hex }}
        aria-hidden="true"
      />
      {channel.label}
    </span>
  )
}
