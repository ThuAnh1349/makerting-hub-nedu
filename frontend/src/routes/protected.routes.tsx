import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/shared/stores/auth.store'
import { useToast } from '@/shared/components/ui/Toast'

interface ProtectedRouteProps {
  requiredRoles?: string[]
}

export function ProtectedRoute({ requiredRoles }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, hasAnyRole } = useAuthStore()
  const { showToast } = useToast()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-nedu-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500 font-body">Đang tải...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (requiredRoles && requiredRoles.length > 0 && !hasAnyRole(requiredRoles)) {
    showToast('Không có quyền truy cập trang này', 'error')
    return <Navigate to="/today" replace />
  }

  return <Outlet />
}
