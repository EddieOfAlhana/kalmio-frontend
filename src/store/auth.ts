import { create } from 'zustand'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

interface AuthState {
  user: User | null
  session: Session | null
  initialized: boolean
  setSession: (session: Session | null) => void
  signOut: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  initialized: false,
  setSession: (session) =>
    set({ session, user: session?.user ?? null, initialized: true }),
  signOut: async () => {
    await supabase.auth.signOut()
    set({ session: null, user: null })
  },
}))
