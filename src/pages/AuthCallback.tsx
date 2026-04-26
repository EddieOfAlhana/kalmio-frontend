import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth'

export function AuthCallback() {
  const navigate = useNavigate()
  const setSession = useAuthStore((s) => s.setSession)
  const [status, setStatus] = useState('Signing you in…')

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

      // Check whether the user has a verified WebAuthn (passkey) factor
      const { data: factorsData } = await supabase.auth.mfa.listFactors()
      const webauthnFactor = factorsData?.all?.find(
        (f) => f.factor_type === 'webauthn' && f.status === 'verified',
      )

      if (!webauthnFactor) {
        navigate('/app', { replace: true })
        return
      }

      // Upgrade to AAL2 via passkey
      setStatus('Verifying your passkey…')
      const rpId = window.location.hostname
      const rpOrigins = [window.location.origin]

      const { data: challengeData, error: challengeError } =
        await supabase.auth.mfa.webauthn.challenge({
          factorId: webauthnFactor.id,
          webauthn: { rpId, rpOrigins },
        })

      if (challengeError || !challengeData) {
        // Passkey challenge failed — still signed in at AAL1, proceed
        navigate('/app', { replace: true })
        return
      }

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId: challengeData.factorId,
        challengeId: challengeData.challengeId,
        webauthn: {
          rpId,
          rpOrigins,
          type: 'request',
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          credential_response: challengeData.webauthn.credential_response as any,
        },
      })

      if (verifyError) {
        // Verification failed — still proceed at AAL1
        console.warn('WebAuthn verify error:', verifyError.message)
      }

      navigate('/app', { replace: true })
    }

    run()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-[#fafafa]">
      <Loader2 className="animate-spin text-energy-orange" size={36} />
      <p className="text-sm text-gray-400">{status}</p>
    </div>
  )
}
