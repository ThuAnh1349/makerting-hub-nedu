import { QueryClient } from '@tanstack/react-query'
import { supabase } from './supabase'

let toastFn: ((msg: string, type: string) => void) | null = null

export function registerToastForQueryClient(
  fn: (msg: string, type: string) => void,
) {
  toastFn = fn
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
    mutations: {
      retry: 0,
    },
  },
})

queryClient.getQueryCache().subscribe((event) => {
  if (event.type === 'updated' && event.query.state.status === 'error') {
    const error = event.query.state.error as { message?: string } | null
    const message = error?.message ?? ''

    if (message.includes('401') || message === 'Unauthorized') {
      supabase.auth.signOut().then(() => {
        window.location.href = '/login'
      })
    } else if (message.includes('403')) {
      toastFn?.('Không có quyền truy cập', 'error')
    }
  }
})
