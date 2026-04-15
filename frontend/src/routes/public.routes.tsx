import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/shared/stores/auth.store'

export function PublicRoute() {
  const { isAuthenticated, isLoading } = useAuthStore()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="w-10 h-10 border-4 border-nedu-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (isAuthenticated) {
    return <Navigate to="/today" replace />
  }

  return <Outlet />
}
