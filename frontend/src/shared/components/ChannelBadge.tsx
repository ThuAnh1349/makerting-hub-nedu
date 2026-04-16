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
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: '2px 8px',
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 600,
        background: `${channel.color_hex}18`,
        color: channel.color_hex,
        border: `1px solid ${channel.color_hex}30`,
      }}
    >
      <span
        style={{
          width: 7,
          height: 7,
          borderRadius: '50%',
          flexShrink: 0,
          backgroundColor: channel.color_hex,
        }}
        aria-hidden="true"
      />
      {channel.label}
    </span>
  )
}
