import { create } from 'zustand'
import { supabase } from '@/shared/config/supabase'
import { apiClient } from '@/shared/config/api-client'

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

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,

  hasRole: (role: string) => {
    const { user } = get()
    return user?.roles.includes(role) ?? false
  },

  hasAnyRole: (roles: string[]) => {
    const { user } = get()
    if (!user) return false
    return roles.some((r) => user.roles.includes(r))
  },

  login: async (email: string, password: string) => {
    set({ isLoading: true })
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw new Error(error.message)

      const profile = await apiClient.get<AuthUser>(
        '/v1/marketing/persons/me',
      )
      set({
        user: profile,
        isAuthenticated: true,
        isLoading: false,
      })
    } catch (err) {
      set({ isLoading: false })
      throw err
    }
  },

  logout: async () => {
    await supabase.auth.signOut()
    set({ user: null, isAuthenticated: false, isLoading: false })
  },

  initialize: async () => {
    set({ isLoading: true })
    try {
      const { data } = await supabase.auth.getSession()
      if (data.session) {
        const profile = await apiClient.get<AuthUser>(
          '/v1/marketing/persons/me',
        )
        set({ user: profile, isAuthenticated: true, isLoading: false })
      } else {
        set({ user: null, isAuthenticated: false, isLoading: false })
      }
    } catch {
      set({ user: null, isAuthenticated: false, isLoading: false })
    }
  },
}))
