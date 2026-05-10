import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AppShell } from '@/components/layout/AppShell'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { AdminRoute } from '@/components/AdminRoute'
import { LandingPage } from '@/pages/LandingPage'
import { Auth } from '@/pages/Auth'
import { AuthCallback } from '@/pages/AuthCallback'
import { Dashboard } from '@/pages/Dashboard'
import { MealPlan } from '@/pages/MealPlan'
import { Recipes } from '@/pages/Recipes'
import { Ingredients } from '@/pages/Ingredients'
import { ShoppingList } from '@/pages/ShoppingList'
import { Fridge } from '@/pages/Fridge'
import { Grooming } from '@/pages/Grooming'
import { RetailProducts } from '@/pages/RetailProducts'
import { Settings } from '@/pages/Settings'
import { Profile } from '@/pages/Profile'
import { UserManagement } from '@/pages/admin/UserManagement'
import { IpVault } from '@/pages/admin/IpVault'
import { InvestorVault } from '@/pages/InvestorVault'
import { BlogIndex } from '@/pages/BlogIndex'
import { BlogPost } from '@/pages/BlogPost'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth'
import { restorePasskeySession, clearPasskeyToken } from '@/lib/passkeySession'
import { usersService } from '@/services/users'
import { Toaster } from '@/components/ui/toast'
import { OfflineBanner } from '@/components/OfflineBanner'

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
})

function AuthProvider({ children }: { children: React.ReactNode }) {
  const setSession = useAuthStore((s) => s.setSession)
  const setAppRole = useAuthStore((s) => s.setAppRole)
  const session = useAuthStore((s) => s.session)

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        clearPasskeyToken()
        setSession(session)
      } else if (event === 'INITIAL_SESSION') {
        const restored = restorePasskeySession()
        setSession(restored)
      } else {
        clearPasskeyToken()
        setSession(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [setSession])

  useEffect(() => {
    if (session) {
      usersService.getMe()
        .then(user => setAppRole(user.role))
        .catch(() => setAppRole('USER'))
    } else {
      setAppRole(null)
    }
  }, [session, setAppRole])

  return <>{children}</>
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Toaster />
      <OfflineBanner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route element={<ProtectedRoute />}>
              <Route path="/app" element={<AppShell />}>
                <Route index element={<Dashboard />} />
                <Route path="meal-plans" element={<MealPlan />} />
                <Route path="recipes" element={<Recipes />} />
                <Route path="ingredients" element={<Ingredients />} />
                <Route path="shopping-list" element={<ShoppingList />} />
                <Route path="fridge" element={<Fridge />} />
                <Route path="grooming" element={<Grooming />} />
                <Route path="retail-products" element={<RetailProducts />} />
                <Route path="settings" element={<Settings />} />
                <Route path="profile" element={<Profile />} />
                <Route element={<AdminRoute />}>
                  <Route path="admin/users" element={<UserManagement />} />
                  <Route path="admin/ip-vault" element={<IpVault />} />
                </Route>
              </Route>
            </Route>
            <Route path="/vault" element={<InvestorVault />} />
            <Route path="/blog" element={<BlogIndex />} />
            <Route path="/blog/:slug" element={<BlogPost />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
