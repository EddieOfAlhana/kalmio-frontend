import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth'
import { capture, identify } from '@/lib/analytics'

export function AuthCallback() {
  const navigate = useNavigate()
  const setSession = useAuthStore((s) => s.setSession)

  useEffect(() => {
    const run = async () => {
      const searchParams = new URLSearchParams(window.location.search)
      const code = searchParams.get('code')

      // Exchange PKCE code for session
      let session = null
      if (code) {
        const { data, error } = await supabase.auth.exchangeCodeForSession(code)
        if (error || !data.session) {
          navigate('/auth', { replace: true })
          return
        }
        session = data.session
      } else {
        // Fallback for implicit / hash flow
        const { data } = await supabase.auth.getSession()
        session = data.session
      }

      if (!session) {
        navigate('/auth', { replace: true })
        return
      }

      setSession(session)
      identify(session.user.id)
      capture('signup_complete', { method: 'email' })
      const next = new URLSearchParams(window.location.search).get('next') ?? '/app'
      navigate(next, { replace: true })
    }

    run()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-[#fafafa]">
      <Loader2 className="animate-spin text-energy-orange" size={36} />
      <p className="text-sm text-gray-400">Signing you in…</p>
    </div>
  )
}
