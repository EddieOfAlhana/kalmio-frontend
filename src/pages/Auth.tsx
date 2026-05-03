import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslation } from 'react-i18next'
import { Loader2, Fingerprint, Mail, CheckCircle2, ArrowLeft, ChevronDown } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { authenticateWithPasskeyDiscoverable, authenticateWithPasskey } from '@/services/passkey'
import { useAuthStore } from '@/store/auth'

const emailSchema = z.object({ email: z.string().email() })
type EmailForm = z.infer<typeof emailSchema>

type Step = { mode: 'home' } | { mode: 'sent'; email: string }

export function Auth() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const setSession = useAuthStore((s) => s.setSession)

  const [step, setStep] = useState<Step>({ mode: 'home' })
  const [passkeyLoading, setPasskeyLoading] = useState(false)
  const [emailLoading, setEmailLoading] = useState(false)
  const [showEmailFallback, setShowEmailFallback] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const form = useForm<EmailForm>({ resolver: zodResolver(emailSchema) })

  // ── Helpers ───────────────────────────────────────────────────────────────

  const storeSessionFromToken = (accessToken: string) => {
    // Decode JWT payload to extract user info
    const payload = JSON.parse(atob(accessToken.split('.')[1]))
    const expiresAt = payload.exp as number

    // Build a minimal Session object compatible with Supabase's Session type
    const session = {
      access_token: accessToken,
      refresh_token: '',
      expires_at: expiresAt,
      expires_in: expiresAt - Math.floor(Date.now() / 1000),
      token_type: 'bearer' as const,
      user: {
        id: payload.sub as string,
        email: payload.email as string,
        role: 'authenticated',
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
        created_at: '',
      },
    } as import('@supabase/supabase-js').Session

    // Write into Supabase's localStorage key so the Axios interceptor finds it
    const projectRef = import.meta.env.VITE_SUPABASE_URL
      ?.replace('https://', '')
      .replace('.supabase.co', '')
    if (projectRef) {
      localStorage.setItem(
        `sb-${projectRef}-auth-token`,
        JSON.stringify({ access_token: accessToken, refresh_token: '', expires_at: expiresAt }),
      )
    }

    setSession(session)
  }

  // ── Passkey flows ─────────────────────────────────────────────────────────

  /** Primary: discoverable credential — browser picks from all enrolled passkeys */
  const signInWithPasskeyDiscoverable = async () => {
    setPasskeyLoading(true)
    setError(null)
    try {
      const result = await authenticateWithPasskeyDiscoverable()
      storeSessionFromToken(result.accessToken)
      navigate('/app', { replace: true })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : ''
      // User cancelled or no passkey available — reveal the email fallback quietly
      if (msg.includes('NotAllowedError') || msg.includes('cancelled') || msg.includes('timed out')) {
        setShowEmailFallback(true)
      } else {
        setError(t('auth.passkeyError'))
        setShowEmailFallback(true)
      }
    } finally {
      setPasskeyLoading(false)
    }
  }

  /** Fallback: email-targeted passkey when user types their email first */
  const signInWithPasskeyForEmail = async (email: string) => {
    setPasskeyLoading(true)
    setError(null)
    try {
      const result = await authenticateWithPasskey(email)
      storeSessionFromToken(result.accessToken)
      navigate('/app', { replace: true })
    } catch {
      setError(t('auth.passkeyError'))
    } finally {
      setPasskeyLoading(false)
    }
  }

  // ── Magic link ────────────────────────────────────────────────────────────

  const sendMagicLink = async ({ email }: EmailForm) => {
    setEmailLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    })
    setEmailLoading(false)
    if (error) { setError(error.message); return }
    setStep({ mode: 'sent', email })
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">

      {/* ── Left: Hero ── */}
      <div className="hidden lg:block relative overflow-hidden bg-midnight-black">
        <img
          src="/assets/images/auth-hero.png"
          alt=""
          className="absolute inset-0 w-full object-cover opacity-60"
        />
        <div className="relative flex flex-col justify-end h-full p-12 bg-gradient-to-t from-midnight-black/80 via-transparent to-transparent">
          <p className="font-headline text-4xl font-bold text-white leading-snug max-w-xs whitespace-pre-line">
            {t('auth.heroQuote')}
          </p>
          <p className="mt-3 text-white/55 text-sm">{t('auth.heroSub')}</p>
        </div>
      </div>

      {/* ── Right: Card ── */}
      <div className="flex items-center justify-center bg-[#fafafa] p-6 lg:p-12">
        <div className="w-full max-w-md">

          <div className="mb-8">
            <span className="font-headline text-2xl font-bold text-midnight-black">Kalmio</span>
          </div>

          <AnimatePresence mode="wait">

            {/* ── Home ── */}
            {step.mode === 'home' && (
              <motion.div
                key="home"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
                className="space-y-5"
              >
                <div>
                  <h1 className="font-headline text-2xl font-bold text-midnight-black">
                    {t('auth.headline')}
                  </h1>
                  <p className="mt-1 text-sm text-gray-500">{t('auth.subheadline')}</p>
                </div>

                {/* Primary CTA: passkey (no email needed) */}
                <Button
                  type="button"
                  onClick={signInWithPasskeyDiscoverable}
                  disabled={passkeyLoading || emailLoading}
                  className="w-full h-12 rounded-2xl bg-midnight-black hover:bg-midnight-black/90 text-white gap-3 text-base font-semibold"
                >
                  {passkeyLoading
                    ? <Loader2 size={18} className="animate-spin" />
                    : <Fingerprint size={18} />}
                  {passkeyLoading ? t('auth.passkeyVerifying') : t('auth.continueWithPasskey')}
                </Button>

                {/* "Use email instead" — subtle link, expands the email fallback */}
                <AnimatePresence>
                  {!showEmailFallback && (
                    <motion.button
                      key="show-email"
                      initial={{ opacity: 1 }}
                      exit={{ opacity: 0, height: 0 }}
                      type="button"
                      onClick={() => setShowEmailFallback(true)}
                      className="w-full flex items-center justify-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors py-1"
                    >
                      <Mail size={13} />
                      {t('auth.useEmailInstead')}
                      <ChevronDown size={12} />
                    </motion.button>
                  )}
                </AnimatePresence>

                {/* Email fallback — slides in */}
                <AnimatePresence>
                  {showEmailFallback && (
                    <motion.div
                      key="email-fallback"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="flex items-center gap-4 mb-4">
                        <div className="flex-1 h-px bg-gray-200" />
                        <span className="text-xs text-gray-400 uppercase tracking-widest">{t('auth.or')}</span>
                        <div className="flex-1 h-px bg-gray-200" />
                      </div>

                      <form onSubmit={form.handleSubmit(sendMagicLink)} className="space-y-3">
                        <div className="space-y-1.5">
                          <Label htmlFor="auth-email" className="text-sm font-medium">
                            {t('auth.emailLabel')}
                          </Label>
                          <Input
                            id="auth-email"
                            type="email"
                            placeholder="you@example.com"
                            autoComplete="email webauthn"
                            autoFocus
                            className="h-11 rounded-xl"
                            {...form.register('email')}
                          />
                          {form.formState.errors.email && (
                            <p className="text-xs text-red-500">{t('auth.invalidEmail')}</p>
                          )}
                        </div>

                        <div className="flex gap-2">
                          {/* Passkey for this specific email */}
                          <Button
                            type="button"
                            disabled={passkeyLoading || emailLoading}
                            onClick={() => {
                              const email = form.getValues('email')
                              if (email && !form.formState.errors.email) {
                                signInWithPasskeyForEmail(email)
                              } else {
                                form.trigger('email')
                              }
                            }}
                            className="flex-1 h-11 rounded-xl bg-midnight-black hover:bg-midnight-black/90 text-white gap-2 text-sm font-medium"
                          >
                            {passkeyLoading
                              ? <Loader2 size={15} className="animate-spin" />
                              : <Fingerprint size={15} />}
                            {passkeyLoading ? t('auth.passkeyVerifying') : t('auth.passkeyForEmail')}
                          </Button>

                          {/* Magic link */}
                          <Button
                            type="submit"
                            disabled={emailLoading || passkeyLoading}
                            className="flex-1 h-11 rounded-xl bg-energy-orange hover:bg-energy-orange/90 text-white gap-2 text-sm font-medium"
                          >
                            {emailLoading
                              ? <Loader2 size={15} className="animate-spin" />
                              : <Mail size={15} />}
                            {t('auth.continueWithEmail')}
                          </Button>
                        </div>
                      </form>
                    </motion.div>
                  )}
                </AnimatePresence>

                {error && <p className="text-xs text-red-500 text-center">{error}</p>}

                <p className="text-xs text-gray-400 text-center leading-relaxed">
                  {t('auth.noPassword')}
                </p>
              </motion.div>
            )}

            {/* ── Sent ── */}
            {step.mode === 'sent' && (
              <motion.div
                key="sent"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
                className="text-center space-y-5 py-6"
              >
                <CheckCircle2 className="mx-auto text-vital-green" size={52} />
                <div>
                  <h2 className="font-headline text-xl font-bold text-midnight-black">
                    {t('auth.checkEmail')}
                  </h2>
                  <p className="mt-2 text-sm text-gray-500 max-w-xs mx-auto">
                    {t('auth.checkEmailHint', { email: step.email })}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  onClick={() => { setStep({ mode: 'home' }); setError(null) }}
                  className="text-sm text-gray-500 gap-2"
                >
                  <ArrowLeft size={14} />
                  {t('auth.tryDifferentEmail')}
                </Button>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
