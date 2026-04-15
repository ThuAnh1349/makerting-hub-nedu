import { useState } from 'react'
import { Modal } from '@/shared/components/ui/Modal'
import { Button } from '@/shared/components/ui/Button'

interface CrisisModalProps {
  isOpen: boolean
  onClose: () => void
  onActivate: (title: string, desc?: string) => Promise<void>
}

export function CrisisModal({ isOpen, onClose, onActivate }: CrisisModalProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) {
      setError('Tiêu đề là bắt buộc')
      return
    }
    setError(null)
    setIsSubmitting(true)
    try {
      await onActivate(title.trim(), description.trim() || undefined)
      setTitle('')
      setDescription('')
      onClose()
    } catch {
      setError('Có lỗi xảy ra. Vui lòng thử lại.')
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleClose() {
    if (isSubmitting) return
    setTitle('')
    setDescription('')
    setError(null)
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Kích hoạt Crisis Mode" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Warning banner */}
        <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700 font-body">
          <span className="shrink-0 text-base">⚠️</span>
          <span>
            Khi kích hoạt, Telegram alert sẽ được gửi đến tất cả Leader ngay lập tức
          </span>
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 font-body mb-1">
            Tiêu đề khủng hoảng <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="VD: Phản ứng tiêu cực lan rộng trên TikTok"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-body focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent"
            disabled={isSubmitting}
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 font-body mb-1">
            Mô tả (tuỳ chọn)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Mô tả ngắn về tình huống..."
            rows={3}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-body focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent resize-none"
            disabled={isSubmitting}
          />
        </div>

        {error && (
          <p className="text-sm text-red-600 font-body">{error}</p>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Huỷ
          </Button>
          <Button
            type="submit"
            variant="danger"
            size="sm"
            isLoading={isSubmitting}
          >
            Kích hoạt Crisis Mode
          </Button>
        </div>
      </form>
    </Modal>
  )
}
