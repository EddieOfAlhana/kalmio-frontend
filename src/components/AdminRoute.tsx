import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/store/auth'

export function AdminRoute() {
  const isAdmin = useAuthStore((s) => s.isAdmin)
  const initialized = useAuthStore((s) => s.initialized)

  if (!initialized) return null

  if (!isAdmin) {
    return <Navigate to="/app" replace />
  }

  return <Outlet />
}
