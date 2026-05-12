import { create } from 'zustand'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { clearPasskeyToken } from '@/lib/passkeySession'

export type AppRole = 'USER' | 'ADMIN'

interface AuthState {
  user: User | null
  session: Session | null
  initialized: boolean
  appRole: AppRole | null
  isAdmin: boolean
  impersonationToken: string | null
  impersonatedEmail: string | null
  setSession: (session: Session | null) => void
  updateSession: (session: Session | null) => void
  setAppRole: (role: AppRole | null) => void
  signOut: () => Promise<void>
  startImpersonation: (token: string, email: string) => void
  stopImpersonation: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  initialized: false,
  appRole: null,
  isAdmin: false,
  impersonationToken: null,
  impersonatedEmail: null,
  setSession: (session) =>
    set({ session, user: session?.user ?? null, initialized: true }),
  updateSession: (session) =>
    set({ session, user: session?.user ?? null }),
  setAppRole: (role) =>
    set({ appRole: role, isAdmin: role === 'ADMIN' }),
  signOut: async () => {
    clearPasskeyToken()
    await supabase.auth.signOut()
    set({ session: null, user: null, appRole: null, isAdmin: false, impersonationToken: null, impersonatedEmail: null })
  },
  startImpersonation: (token, email) =>
    set({ impersonationToken: token, impersonatedEmail: email }),
  stopImpersonation: () =>
    set({ impersonationToken: null, impersonatedEmail: null }),
}))
