import { create } from 'zustand'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

export type AppRole = 'USER' | 'ADMIN'

interface AuthState {
  user: User | null
  session: Session | null
  initialized: boolean
  appRole: AppRole | null
  isAdmin: boolean
  setSession: (session: Session | null) => void
  setAppRole: (role: AppRole | null) => void
  signOut: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  initialized: false,
  appRole: null,
  isAdmin: false,
  setSession: (session) =>
    set({ session, user: session?.user ?? null, initialized: true }),
  setAppRole: (role) =>
    set({ appRole: role, isAdmin: role === 'ADMIN' }),
  signOut: async () => {
    await supabase.auth.signOut()
    set({ session: null, user: null, appRole: null, isAdmin: false })
  },
}))
