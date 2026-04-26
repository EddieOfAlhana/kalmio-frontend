import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslation } from 'react-i18next'
import { Loader2, KeyRound, Mail, CheckCircle2, ArrowLeft } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const emailSchema = z.object({
  email: z.string().email(),
})
type EmailForm = z.infer<typeof emailSchema>

type Step =
  | { mode: 'home' }
  | { mode: 'sent'; email: string; intent: 'magic' | 'passkey' }

export function Auth() {
  const { t } = useTranslation()
  const [step, setStep] = useState<Step>({ mode: 'home' })
  const [intent, setIntent] = useState<'magic' | 'passkey' | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const form = useForm<EmailForm>({ resolver: zodResolver(emailSchema) })

  const sendLink = async ({ email }: EmailForm, currentIntent: 'magic' | 'passkey') => {
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: { auth_intent: currentIntent },
      },
    })
    setLoading(false)
    if (error) return setError(error.message)
    setStep({ mode: 'sent', email, intent: currentIntent })
  }

  const onSubmit = (values: EmailForm) => sendLink(values, intent ?? 'magic')

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

          {/* ── Initial form ── */}
          {step.mode === 'home' && (
            <div className="space-y-6">
              <div>
                <h1 className="font-headline text-2xl font-bold text-midnight-black">
                  {t('auth.headline')}
                </h1>
                <p className="mt-1 text-sm text-gray-500">{t('auth.subheadline')}</p>
              </div>

              {/* Passkey button — visually primary; same flow, WebAuthn triggered post-login if enrolled */}
              <Button
                type="button"
                onClick={() => {
                  setIntent('passkey')
                  // If email already filled, submit immediately; otherwise focus the field
                  const email = form.getValues('email')
                  if (email && !form.formState.errors.email) {
                    sendLink({ email }, 'passkey')
                  } else {
                    form.setFocus('email')
                  }
                }}
                disabled={loading}
                className="w-full h-12 rounded-2xl bg-midnight-black hover:bg-midnight-black/90 text-white gap-3 text-sm font-semibold"
              >
                {loading && intent === 'passkey'
                  ? <Loader2 size={17} className="animate-spin" />
                  : <KeyRound size={17} />}
                {loading && intent === 'passkey' ? t('auth.sending') : t('auth.continueWithPasskey')}
              </Button>

              {/* Divider */}
              <div className="flex items-center gap-4">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-xs text-gray-400 uppercase tracking-widest">{t('auth.or')}</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>

              {/* Email form — shared by both paths */}
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="auth-email" className="text-sm font-medium">
                    {t('auth.emailLabel')}
                  </Label>
                  <Input
                    id="auth-email"
                    type="email"
                    placeholder="you@example.com"
                    autoComplete="email webauthn"
                    className="h-11 rounded-xl"
                    {...form.register('email')}
                  />
                  {form.formState.errors.email && (
                    <p className="text-xs text-red-500">{t('auth.invalidEmail')}</p>
                  )}
                </div>
                <Button
                  type="submit"
                  onClick={() => setIntent('magic')}
                  disabled={loading}
                  className="w-full h-11 rounded-2xl bg-energy-orange hover:bg-energy-orange/90 text-white gap-2 text-sm font-semibold"
                >
                  {loading && intent === 'magic'
                    ? <Loader2 size={16} className="animate-spin" />
                    : <Mail size={16} />}
                  {loading && intent === 'magic' ? t('auth.sending') : t('auth.continueWithEmail')}
                </Button>
              </form>

              {error && <p className="text-xs text-red-500 text-center">{error}</p>}

              <p className="text-xs text-gray-400 text-center leading-relaxed">
                {t('auth.noPassword')}
              </p>
            </div>
          )}

          {/* ── Check email ── */}
          {step.mode === 'sent' && (
            <div className="text-center space-y-5 py-6">
              <CheckCircle2 className="mx-auto text-vital-green" size={52} />
              <div>
                <h2 className="font-headline text-xl font-bold text-midnight-black">
                  {t('auth.checkEmail')}
                </h2>
                <p className="mt-2 text-sm text-gray-500 max-w-xs mx-auto">
                  {step.intent === 'passkey'
                    ? t('auth.checkEmailPasskeyHint', { email: step.email })
                    : t('auth.checkEmailHint', { email: step.email })}
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
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
