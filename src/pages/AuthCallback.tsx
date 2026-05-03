import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth'

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
      navigate('/app', { replace: true })
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
