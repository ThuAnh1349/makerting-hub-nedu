import { create } from 'zustand'

interface NotificationState {
  unreadCount: number
  setUnreadCount: (n: number) => void
  incrementUnread: () => void
  decrementUnread: () => void
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  unreadCount: 0,

  setUnreadCount: (n: number) => set({ unreadCount: n }),

  incrementUnread: () => set({ unreadCount: get().unreadCount + 1 }),

  decrementUnread: () =>
    set({ unreadCount: Math.max(0, get().unreadCount - 1) }),
}))
