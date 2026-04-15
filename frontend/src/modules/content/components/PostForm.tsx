import { useState, useEffect } from 'react'
import { Button } from '@/shared/components/ui/Button'
import { useChannels } from '../hooks/useContent'
import { MediaUploader } from './MediaUploader'
import type { Post, CreatePostBody, PostMedia } from '../content.types'

interface PostFormProps {
  initialValues?: Partial<Post>
  onSubmit: (data: CreatePostBody) => Promise<void>
  onCancel: () => void
  isLoading: boolean
  submitLabel?: string
}

interface RefLink {
  url: string
  label: string
}

const MAX_CAPTION = 5000

export function PostForm({
  initialValues,
  onSubmit,
  onCancel,
  isLoading,
  submitLabel = 'Lưu bài',
}: PostFormProps) {
  const { data: channels = [], isLoading: channelsLoading } = useChannels()

  const [caption, setCaption] = useState(initialValues?.caption ?? '')
  const [selectedChannelCodes, setSelectedChannelCodes] = useState<string[]>(
    initialValues?.channels?.map((c) => c.code) ?? [],
  )
  const [refLinks, setRefLinks] = useState<RefLink[]>(
    initialValues?.reference_links?.length
      ? initialValues.reference_links
      : [],
  )
  const [campaignId, setCampaignId] = useState(initialValues?.campaign_id ?? '')
  const [existingMedia] = useState<PostMedia[]>(initialValues?.media ?? [])
  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  const [isUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Sync initial values if they change (e.g. edit mode reload)
  useEffect(() => {
    if (initialValues?.caption !== undefined) setCaption(initialValues.caption)
    if (initialValues?.channels) {
      setSelectedChannelCodes(initialValues.channels.map((c) => c.code))
    }
    if (initialValues?.reference_links) setRefLinks(initialValues.reference_links)
    if (initialValues?.campaign_id !== undefined) setCampaignId(initialValues.campaign_id ?? '')
  }, [initialValues?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const toggleChannel = (code: string) => {
    setSelectedChannelCodes((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code],
    )
  }

  const addRefLink = () => {
    setRefLinks((prev) => [...prev, { url: '', label: '' }])
  }

  const updateRefLink = (index: number, field: 'url' | 'label', value: string) => {
    setRefLinks((prev) =>
      prev.map((link, i) => (i === index ? { ...link, [field]: value } : link)),
    )
  }

  const removeRefLink = (index: number) => {
    setRefLinks((prev) => prev.filter((_, i) => i !== index))
  }

  const handleFilesSelected = (files: File[]) => {
    setPendingFiles((prev) => [...prev, ...files])
  }

  const isValid = caption.trim().length > 0 && selectedChannelCodes.length > 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!isValid) return

    const validLinks = refLinks.filter((l) => l.url.trim())

    try {
      await onSubmit({
        caption: caption.trim(),
        channel_codes: selectedChannelCodes,
        reference_links: validLinks,
        campaign_id: campaignId.trim() || null,
        scheduled_at: null,
      })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err?.message ?? 'Đã có lỗi xảy ra. Vui lòng thử lại.')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Caption */}
      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700 font-body">
          Caption <span className="text-red-500">*</span>
        </label>
        <textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value.slice(0, MAX_CAPTION))}
          rows={5}
          placeholder="Nhập nội dung bài đăng..."
          className="
            w-full rounded-lg border border-gray-300 px-3 py-2
            text-sm font-body text-gray-900 placeholder-gray-400
            focus:outline-none focus:ring-2 focus:ring-nedu-primary focus:border-transparent
            resize-y min-h-[120px]
          "
          required
        />
        <div className="flex justify-end">
          <span
            className={`text-xs font-body ${
              caption.length > MAX_CAPTION * 0.9 ? 'text-orange-500' : 'text-gray-400'
            }`}
          >
            {caption.length.toLocaleString('vi-VN')} / {MAX_CAPTION.toLocaleString('vi-VN')}
          </span>
        </div>
      </div>

      {/* Channel selector */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 font-body">
          Kênh đăng <span className="text-red-500">*</span>
        </label>
        {channelsLoading ? (
          <div className="flex gap-2 flex-wrap">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-8 w-24 animate-pulse bg-gray-200 rounded-full" />
            ))}
          </div>
        ) : channels.length === 0 ? (
          <p className="text-sm text-gray-400 font-body">Không có kênh nào.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {channels.map((ch) => {
              const checked = selectedChannelCodes.includes(ch.code)
              return (
                <button
                  key={ch.code}
                  type="button"
                  onClick={() => toggleChannel(ch.code)}
                  className={`
                    inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium
                    border transition-all duration-150 font-body
                    ${
                      checked
                        ? 'border-transparent text-white shadow-sm'
                        : 'border-gray-300 text-gray-600 bg-white hover:border-gray-400'
                    }
                  `}
                  style={checked ? { backgroundColor: ch.color_hex } : {}}
                  aria-pressed={checked}
                >
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: checked ? 'rgba(255,255,255,0.7)' : ch.color_hex }}
                    aria-hidden="true"
                  />
                  {ch.label}
                  {checked && (
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </button>
              )
            })}
          </div>
        )}
        {selectedChannelCodes.length === 0 && (
          <p className="text-xs text-red-500 font-body">Chọn ít nhất 1 kênh.</p>
        )}
      </div>

      {/* Reference links */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 font-body">
          Link tham khảo
        </label>
        {refLinks.length > 0 && (
          <div className="space-y-2">
            {refLinks.map((link, index) => (
              <div key={index} className="flex items-center gap-2">
                <input
                  type="url"
                  value={link.url}
                  onChange={(e) => updateRefLink(index, 'url', e.target.value)}
                  placeholder="https://..."
                  className="
                    flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-body
                    focus:outline-none focus:ring-2 focus:ring-nedu-primary focus:border-transparent
                  "
                />
                <input
                  type="text"
                  value={link.label}
                  onChange={(e) => updateRefLink(index, 'label', e.target.value)}
                  placeholder="Nhãn (tuỳ chọn)"
                  className="
                    w-36 rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-body
                    focus:outline-none focus:ring-2 focus:ring-nedu-primary focus:border-transparent
                  "
                />
                <button
                  type="button"
                  onClick={() => removeRefLink(index)}
                  className="p-1.5 text-gray-400 hover:text-red-500 transition-colors rounded"
                  aria-label="Xóa link"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
        <button
          type="button"
          onClick={addRefLink}
          className="inline-flex items-center gap-1 text-sm text-nedu-primary hover:underline font-body"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Thêm link
        </button>
      </div>

      {/* Campaign */}
      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700 font-body">
          Campaign <span className="text-gray-400 font-normal">(tuỳ chọn)</span>
        </label>
        <input
          type="text"
          value={campaignId}
          onChange={(e) => setCampaignId(e.target.value)}
          placeholder="ID hoặc tên campaign..."
          className="
            w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-body
            focus:outline-none focus:ring-2 focus:ring-nedu-primary focus:border-transparent
          "
        />
      </div>

      {/* Media */}
      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700 font-body">
          Ảnh / Video
        </label>
        <MediaUploader
          onFilesSelected={handleFilesSelected}
          existingMedia={existingMedia}
          isUploading={isUploading}
        />
        {pendingFiles.length > 0 && (
          <p className="text-xs text-gray-500 font-body">
            {pendingFiles.length} file đang chờ tải lên sau khi lưu bài.
          </p>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          <p className="text-sm text-red-700 font-body">{error}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={isLoading}>
          Huỷ
        </Button>
        <Button
          type="submit"
          variant="primary"
          isLoading={isLoading}
          disabled={!isValid || isLoading}
        >
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}
