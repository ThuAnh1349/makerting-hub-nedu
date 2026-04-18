import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppRoutes } from './routes/index'
import { CommandPalette } from './shared/components/CommandPalette'
import { OnboardingTour } from './shared/components/OnboardingTour'
import { Modal } from './shared/components/ui/Modal'
import { useAuthStore } from './shared/stores/auth.store'

const ROUTE_SHORTCUTS: Record<string, string> = {
  '1': '/dashboard',
  '2': '/leads',
  '3': '/posts',
  '4': '/calendar',
  '5': '/analytics',
  '6': '/documents',
}

export default function App() {
  const navigate = useNavigate()
  const { initialize, isAuthenticated } = useAuthStore()
  const [showShortcuts, setShowShortcuts] = useState(false)
  const [showCommandPalette, setShowCommandPalette] = useState(false)

  useEffect(() => {
    initialize()
  }, [initialize])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      const isTyping =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable

      if (isTyping) return

      // Meta+K or Ctrl+K → command palette
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setShowCommandPalette((prev) => !prev)
        return
      }

      // ? → shortcuts help
      if (e.key === '?') {
        e.preventDefault()
        setShowShortcuts((prev) => !prev)
        return
      }

      // 1-6 → navigate
      if (ROUTE_SHORTCUTS[e.key]) {
        e.preventDefault()
        navigate(ROUTE_SHORTCUTS[e.key])
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [navigate])

  return (
    <>
      <AppRoutes />

      {/* Onboarding tour — only shown to authenticated users on first login */}
      {isAuthenticated && <OnboardingTour />}

      <CommandPalette
        isOpen={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
      />

      <Modal
        isOpen={showShortcuts}
        onClose={() => setShowShortcuts(false)}
        title="Phím tắt bàn phím"
        size="sm"
      >
        <div className="space-y-3">
          <p className="text-sm text-gray-500 mb-4">
            Các phím tắt hoạt động khi không đang nhập liệu.
          </p>
          <div className="space-y-2">
            {[
              { key: '1', label: 'Hôm nay' },
              { key: '2', label: 'Inbox & Lead' },
              { key: '3', label: 'Nội dung' },
              { key: '4', label: 'Lịch đăng bài' },
              { key: '5', label: 'Kết quả & KPI' },
              { key: '6', label: 'Hệ thống tài liệu' },
              { key: '?', label: 'Hiện/ẩn bảng phím tắt' },
              { key: 'Ctrl+K', label: 'Mở Command Palette' },
            ].map(({ key, label }) => (
              <div key={key} className="flex items-center justify-between">
                <span className="text-sm text-gray-700">{label}</span>
                <kbd className="px-2 py-1 text-xs font-mono bg-gray-100 border border-gray-300 rounded text-gray-600">
                  {key}
                </kbd>
              </div>
            ))}
          </div>
        </div>
      </Modal>
    </>
  )
}
