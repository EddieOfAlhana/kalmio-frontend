import { Navigate, Outlet } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useAuthStore } from '@/store/auth'

export function ProtectedRoute() {
  const { session, initialized } = useAuthStore()

  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-soft-sand">
        <Loader2 className="animate-spin text-energy-orange" size={32} />
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/auth" replace />
  }

  return <Outlet />
}
