import { create } from 'zustand'

interface AuthUser {
  id: string
  display_name: string
  avatar_url: string | null
  roles: string[]
}

interface AuthState {
  user: AuthUser | null
  isLoading: boolean
  isAuthenticated: boolean
  hasRole: (role: string) => boolean
  hasAnyRole: (roles: string[]) => boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  initialize: () => Promise<void>
}

// Demo user — marketing_leader có đủ quyền xem toàn bộ app
const DEMO_USER: AuthUser = {
  id: 'demo-user-001',
  display_name: 'Thu Anh (Demo)',
  avatar_url: null,
  roles: ['marketing_leader'],
}

export const useAuthStore = create<AuthState>((set, get) => ({
  // Auto-login ngay từ đầu — không cần màn hình đăng nhập
  user: DEMO_USER,
  isLoading: false,
  isAuthenticated: true,

  hasRole: (role: string) => {
    const { user } = get()
    return user?.roles.includes(role) ?? false
  },

  hasAnyRole: (roles: string[]) => {
    const { user } = get()
    if (!user) return false
    return roles.some((r) => user.roles.includes(r))
  },

  login: async (_email: string, _password: string) => {
    set({ user: DEMO_USER, isAuthenticated: true, isLoading: false })
  },

  logout: async () => {
    // Demo mode — logout xong tự vào lại luôn
    set({ user: DEMO_USER, isAuthenticated: true, isLoading: false })
  },

  initialize: async () => {
    // Không cần khởi tạo — đã auto-login từ initial state
    set({ user: DEMO_USER, isAuthenticated: true, isLoading: false })
  },
}))
