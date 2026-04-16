import { Outlet } from 'react-router-dom'

interface ProtectedRouteProps {
  requiredRoles?: string[]
}

// Demo mode — tất cả routes đều mở, không cần đăng nhập
export function ProtectedRoute({ requiredRoles: _requiredRoles }: ProtectedRouteProps) {
  return <Outlet />
}
