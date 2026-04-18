import { Navigate } from 'react-router-dom'

// Demo mode — /login redirect thẳng về /today, không cần đăng nhập
export function PublicRoute() {
  return <Navigate to="/dashboard" replace />
}
