import { useEffect, useState } from 'react'
import { supabase } from '@/shared/config/supabase'
import { useNotificationStore } from '@/shared/stores/notification.store'
import { useAuthStore } from '@/shared/stores/auth.store'
import { Drawer } from '@/shared/components/ui/Drawer'
import { apiClient } from '@/shared/config/api-client'

interface Notification {
  id: string
  message: string
  type: string
  is_read: boolean
  created_at: string
}

export function NotificationBell() {
  const { unreadCount, setUnreadCount, decrementUnread } =
    useNotificationStore()
  const { user } = useAuthStore()
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Subscribe to realtime notifications
  useEffect(() => {
    if (!user?.id) return

    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          useNotificationStore.getState().incrementUnread()
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user?.id])

  const fetchNotifications = async () => {
    setIsLoading(true)
    try {
      const data = await apiClient.get<Notification[]>(
        '/v1/marketing/notifications',
      )
      setNotifications(data)
      const unread = data.filter((n) => !n.is_read).length
      setUnreadCount(unread)
    } catch {
      // silently fail
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpen = () => {
    setIsOpen(true)
    fetchNotifications()
  }

  const markAsRead = async (id: string) => {
    try {
      await apiClient.patch(`/v1/marketing/notifications/${id}/read`)
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
      )
      decrementUnread()
    } catch {
      // silently fail
    }
  }

  return (
    <>
      <button
        onClick={handleOpen}
        className="relative p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
        aria-label={`Thông báo${unreadCount > 0 ? `, ${unreadCount} chưa đọc` : ''}`}
      >
        {/* Bell SVG */}
        <svg
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.8}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>

        {/* Unread badge */}
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-0.5 leading-none">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      <Drawer
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Thông báo"
      >
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <svg
              className="w-12 h-12 text-gray-300 mb-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
            <p className="text-sm text-gray-500">Không có thông báo nào</p>
          </div>
        ) : (
          <ul className="space-y-1 -mx-2">
            {notifications.map((n) => (
              <li key={n.id}>
                <button
                  onClick={() => !n.is_read && markAsRead(n.id)}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                    n.is_read
                      ? 'bg-white hover:bg-gray-50'
                      : 'bg-nedu-primary-50 hover:bg-nedu-primary-100 border-l-2 border-nedu-primary'
                  }`}
                >
                  <p
                    className={`text-sm font-body ${n.is_read ? 'text-gray-600' : 'text-gray-900 font-medium'}`}
                  >
                    {n.message}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(n.created_at).toLocaleString('vi-VN')}
                  </p>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Drawer>
    </>
  )
}
