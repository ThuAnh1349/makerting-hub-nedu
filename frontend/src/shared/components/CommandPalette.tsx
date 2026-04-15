import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

interface Command {
  id: string
  label: string
  description?: string
  path: string
  icon?: string
}

const ALL_COMMANDS: Command[] = [
  { id: 'today', label: 'Hôm nay', description: 'Tổng quan ngày hôm nay', path: '/today', icon: '☀️' },
  { id: 'inbox', label: 'Inbox & Lead', description: 'Quản lý lead và tin nhắn', path: '/inbox', icon: '📥' },
  { id: 'content', label: 'Nội dung', description: 'Quản lý nội dung', path: '/content', icon: '📝' },
  { id: 'calendar', label: 'Lịch đăng bài', description: 'Lịch xuất bản nội dung', path: '/calendar', icon: '📅' },
  { id: 'analytics', label: 'Kết quả & KPI', description: 'Báo cáo và phân tích', path: '/analytics', icon: '📊' },
  { id: 'docs', label: 'Hệ thống tài liệu', description: 'Tài liệu nội bộ', path: '/docs', icon: '📚' },
  { id: 'campaigns', label: 'Campaign View', description: 'Quản lý chiến dịch', path: '/campaigns', icon: '🎯' },
  { id: 'brand-health', label: 'Brand Health', description: 'Sức khỏe thương hiệu', path: '/brand-health', icon: '❤️' },
  { id: 'budget', label: 'Budget & ROI', description: 'Ngân sách và hiệu quả đầu tư', path: '/budget', icon: '💰' },
  { id: 'stories', label: 'Story Pipeline', description: 'Quản lý story', path: '/stories', icon: '🎬' },
  { id: 'referral', label: 'Referral Loop', description: 'Chương trình giới thiệu', path: '/referral', icon: '🔗' },
  { id: 'briefs', label: 'Đặt việc', description: 'Tạo và quản lý brief', path: '/briefs', icon: '📋' },
]

interface CommandPaletteProps {
  isOpen: boolean
  onClose: () => void
}

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const filtered = query.trim()
    ? ALL_COMMANDS.filter(
        (c) =>
          c.label.toLowerCase().includes(query.toLowerCase()) ||
          (c.description?.toLowerCase().includes(query.toLowerCase()) ?? false),
      )
    : ALL_COMMANDS

  useEffect(() => {
    if (isOpen) {
      setQuery('')
      setSelectedIndex(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [isOpen])

  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  const handleSelect = (command: Command) => {
    navigate(command.path)
    onClose()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (filtered[selectedIndex]) handleSelect(filtered[selectedIndex])
    } else if (e.key === 'Escape') {
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] px-4"
      role="dialog"
      aria-modal="true"
      aria-label="Command Palette"
    >
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-200">
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200">
          <svg
            className="w-4 h-4 text-gray-400 shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Tìm kiếm trang..."
            className="flex-1 text-sm text-gray-900 placeholder-gray-400 outline-none font-body bg-transparent"
          />
          <kbd className="hidden sm:inline-flex px-1.5 py-0.5 text-xs font-mono bg-gray-100 border border-gray-300 rounded text-gray-500">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <ul
          className="max-h-72 overflow-y-auto py-2"
          role="listbox"
        >
          {filtered.length === 0 ? (
            <li className="px-4 py-8 text-center text-sm text-gray-400 font-body">
              Không tìm thấy kết quả
            </li>
          ) : (
            filtered.map((command, index) => (
              <li key={command.id} role="option" aria-selected={index === selectedIndex}>
                <button
                  onClick={() => handleSelect(command)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                    index === selectedIndex
                      ? 'bg-nedu-primary text-white'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span className="text-base leading-none w-5 text-center">
                    {command.icon}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm font-medium font-body truncate ${
                        index === selectedIndex ? 'text-white' : 'text-gray-900'
                      }`}
                    >
                      {command.label}
                    </p>
                    {command.description && (
                      <p
                        className={`text-xs truncate mt-0.5 font-body ${
                          index === selectedIndex
                            ? 'text-white/70'
                            : 'text-gray-400'
                        }`}
                      >
                        {command.description}
                      </p>
                    )}
                  </div>
                  {index === selectedIndex && (
                    <kbd className="shrink-0 px-1.5 py-0.5 text-xs font-mono bg-white/20 rounded text-white/80">
                      ↵
                    </kbd>
                  )}
                </button>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  )
}
