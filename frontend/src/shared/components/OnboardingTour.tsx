import { useState, useEffect } from 'react'

const ONBOARDING_KEY = 'nedu_hub_onboarding_done'

interface TourStep {
  title: string
  description: string
  icon: string
}

const TOUR_STEPS: TourStep[] = [
  {
    icon: '☀️',
    title: 'Chào mừng đến Nedu Marketing Hub!',
    description:
      'Đây là trung tâm điều hành marketing của đội Nedu. Mỗi ngày bắt đầu tại trang Hôm nay để xem tổng quan công việc.',
  },
  {
    icon: '📥',
    title: 'Inbox & Lead',
    description:
      'Tất cả lead từ các kênh đổ vào đây. Phân loại, gán trạng thái và ghi chú trực tiếp trong giao diện.',
  },
  {
    icon: '📝',
    title: 'Nội dung & Lịch đăng',
    description:
      'Tạo bài viết, gửi duyệt và xem lịch xuất bản theo tuần/tháng. Nội dung nào chờ duyệt sẽ hiển thị rõ ràng.',
  },
  {
    icon: '📊',
    title: 'Analytics & Budget',
    description:
      'Xem KPI theo kênh — Reach, ER, Lead, CPL — và so sánh với benchmark. Xuất Excel chỉ một click.',
  },
  {
    icon: '⌨️',
    title: 'Phím tắt nhanh',
    description:
      'Nhấn phím 1–6 để chuyển trang tức thì. Ctrl+K mở tìm kiếm nhanh. Nhấn ? để xem toàn bộ phím tắt.',
  },
]

export function OnboardingTour() {
  const [visible, setVisible] = useState(false)
  const [step, setStep] = useState(0)

  useEffect(() => {
    const done = localStorage.getItem(ONBOARDING_KEY)
    if (!done) {
      // Small delay so the app loads first
      const t = setTimeout(() => setVisible(true), 800)
      return () => clearTimeout(t)
    }
  }, [])

  if (!visible) return null

  const currentStep = TOUR_STEPS[step]
  const isLast = step === TOUR_STEPS.length - 1

  function handleNext() {
    if (isLast) {
      handleDone()
    } else {
      setStep((s) => s + 1)
    }
  }

  function handleDone() {
    localStorage.setItem(ONBOARDING_KEY, '1')
    setVisible(false)
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center px-4"
      role="dialog"
      aria-modal="true"
      aria-label="Onboarding tour"
    >
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleDone}
        aria-hidden="true"
      />

      {/* Card */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-fade-in">
        {/* Progress bar */}
        <div className="h-1 bg-gray-100">
          <div
            className="h-1 bg-nedu-primary transition-all duration-300"
            style={{ width: `${((step + 1) / TOUR_STEPS.length) * 100}%` }}
          />
        </div>

        <div className="p-7">
          {/* Icon */}
          <div className="w-14 h-14 bg-nedu-primary/10 rounded-full flex items-center justify-center mb-5 text-2xl">
            {currentStep.icon}
          </div>

          {/* Content */}
          <h2 className="text-lg font-bold font-headline text-gray-900 mb-2">
            {currentStep.title}
          </h2>
          <p className="text-sm text-gray-500 font-body leading-relaxed">
            {currentStep.description}
          </p>

          {/* Step indicator */}
          <div className="flex items-center gap-1.5 mt-6 mb-6">
            {TOUR_STEPS.map((_, i) => (
              <button
                key={i}
                onClick={() => setStep(i)}
                className={`h-1.5 rounded-full transition-all ${
                  i === step
                    ? 'w-6 bg-nedu-primary'
                    : 'w-1.5 bg-gray-200 hover:bg-gray-300'
                }`}
                aria-label={`Bước ${i + 1}`}
              />
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <button
              onClick={handleDone}
              className="text-sm text-gray-400 hover:text-gray-600 font-body transition-colors"
            >
              Bỏ qua
            </button>
            <button
              onClick={handleNext}
              className="px-5 py-2 bg-nedu-primary text-white text-sm font-medium font-body rounded-lg hover:bg-nedu-primary/90 transition-colors flex items-center gap-1.5"
            >
              {isLast ? 'Bắt đầu →' : 'Tiếp theo →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
