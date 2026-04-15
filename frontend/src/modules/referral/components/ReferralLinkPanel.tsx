import { useToast } from '@/shared/components/ui/Toast'
import { Button } from '@/shared/components/ui/Button'
import { Badge } from '@/shared/components/ui/Badge'
import type { Ambassador } from '../referral.types'

interface ReferralLinkPanelProps {
  ambassador: Ambassador
}

export function ReferralLinkPanel({ ambassador }: ReferralLinkPanelProps) {
  const { showToast } = useToast()

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(ambassador.referral_link)
      showToast('Đã copy link referral!', 'success')
    } catch {
      // Fallback for older browsers
      const el = document.createElement('textarea')
      el.value = ambassador.referral_link
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
      showToast('Đã copy link referral!', 'success')
    }
  }

  const conversionRate =
    ambassador.total_referrals > 0
      ? Math.round((ambassador.converted_referrals / ambassador.total_referrals) * 100)
      : 0

  // Parse UTM params from link
  let utmSource = 'referral'
  let utmCampaign = `ambassador-${ambassador.id}`
  try {
    const url = new URL(ambassador.referral_link)
    utmSource = url.searchParams.get('utm_source') ?? utmSource
    utmCampaign = url.searchParams.get('utm_campaign') ?? utmCampaign
  } catch {
    // ignore parse errors
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-gray-900 font-body">
            {ambassador.display_name}
          </p>
          <span className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-0.5 rounded mt-0.5 inline-block">
            {ambassador.referral_code}
          </span>
        </div>
        <Badge variant={ambassador.is_active ? 'green' : 'gray'}>
          {ambassador.is_active ? 'Đang hoạt động' : 'Không hoạt động'}
        </Badge>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <p className="text-xl font-bold text-gray-900 font-headline">
            {ambassador.total_referrals}
          </p>
          <p className="text-xs text-gray-500 font-body mt-0.5">Tổng referral</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <p className="text-xl font-bold text-green-600 font-headline">
            {ambassador.converted_referrals}
          </p>
          <p className="text-xs text-gray-500 font-body mt-0.5">Chuyển đổi</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <p
            className={`text-xl font-bold font-headline ${
              conversionRate >= 50
                ? 'text-green-600'
                : conversionRate >= 25
                ? 'text-yellow-600'
                : 'text-gray-600'
            }`}
          >
            {conversionRate}%
          </p>
          <p className="text-xs text-gray-500 font-body mt-0.5">Tỉ lệ CĐ</p>
        </div>
      </div>

      {/* Referral link */}
      <div>
        <p className="text-xs font-semibold text-gray-600 font-body mb-1.5">Link referral</p>
        <div className="flex gap-2">
          <input
            type="text"
            readOnly
            value={ambassador.referral_link}
            className="flex-1 px-3 py-2 text-xs font-mono border border-gray-300 rounded-lg bg-gray-50 text-gray-700 focus:outline-none select-all"
            onClick={(e) => (e.target as HTMLInputElement).select()}
          />
          <Button size="sm" variant="primary" onClick={handleCopy}>
            Copy Link
          </Button>
        </div>
      </div>

      {/* UTM breakdown */}
      <div>
        <p className="text-xs font-semibold text-gray-600 font-body mb-2">UTM Parameters</p>
        <div className="bg-gray-50 rounded-lg p-3 space-y-1.5">
          {[
            { key: 'utm_source', value: utmSource },
            { key: 'utm_medium', value: 'referral' },
            { key: 'utm_campaign', value: utmCampaign },
          ].map(({ key, value }) => (
            <div key={key} className="flex items-center gap-2">
              <span className="text-xs font-mono text-gray-400 w-32 shrink-0">{key}</span>
              <span className="text-xs font-mono text-nedu-primary bg-nedu-primary/10 px-2 py-0.5 rounded">
                {value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
