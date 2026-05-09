import { useEffect, useRef, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { Header } from '@/components/layout/Header'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Spinner } from '@/components/ui/spinner'
import { UserAvatar } from '@/components/ui/UserAvatar'
import { toast } from '@/components/ui/toast'
import { usersService, type UpdateProfileRequest } from '@/services/users'

interface FormValues {
  firstName: string
  lastName: string
}

const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_SIZE = 5 * 1024 * 1024 // 5 MB

export function Profile() {
  const { t } = useTranslation()
  const qc = useQueryClient()

  const { data: user, isLoading } = useQuery({
    queryKey: ['me'],
    queryFn: usersService.getMe,
  })

  const { register, handleSubmit, reset } = useForm<FormValues>()

  useEffect(() => {
    if (user) {
      reset({
        firstName: user.firstName ?? '',
        lastName: user.lastName ?? '',
      })
    }
  }, [user, reset])

  const mutation = useMutation({
    mutationFn: (body: UpdateProfileRequest) => usersService.updateProfile(body),
    onSuccess: (data) => {
      qc.setQueryData(['me'], data)
      toast({ title: t('profile.saveSuccess'), variant: 'success' })
    },
    onError: () => {
      toast({ title: t('profile.saveError'), variant: 'destructive' })
    },
  })

  const onSubmit = (values: FormValues) => {
    mutation.mutate({
      firstName: values.firstName.trim() || null,
      lastName: values.lastName.trim() || null,
    })
  }

  // ── Avatar upload ─────────────────────────────────────────────────────────
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)

  async function uploadAvatar(file: File) {
    if (!ACCEPTED.includes(file.type)) {
      toast({ title: t('profile.avatarUploadError'), variant: 'destructive' })
      return
    }
    if (file.size > MAX_SIZE) {
      toast({ title: t('profile.avatarUploadError'), variant: 'destructive' })
      return
    }

    setUploading(true)
    try {
      const updated = await usersService.uploadAvatar(file)
      qc.setQueryData(['me'], updated)
      toast({ title: t('profile.avatarUploadSuccess'), variant: 'success' })
    } catch {
      toast({ title: t('profile.avatarUploadError'), variant: 'destructive' })
    } finally {
      setUploading(false)
    }
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) uploadAvatar(file)
    e.target.value = ''
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) uploadAvatar(file)
  }

  // ── Render ────────────────────────────────────────────────────────────────
  if (isLoading) {
    return <div className="flex justify-center py-12"><Spinner /></div>
  }

  const displayName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.email || ''
  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
    : null

  return (
    <div>
      <Header
        title={t('profile.title')}
        subtitle={t('profile.subtitle')}
      />

      <div className="max-w-lg space-y-6">
        {/* Avatar card */}
        <Card>
          <CardContent className="pt-6 pb-5">
            <div className="flex items-center gap-4">
              {/* Clickable / droppable avatar */}
              <div
                role="button"
                tabIndex={0}
                aria-label={t('profile.avatarUploadHint')}
                className={[
                  'relative shrink-0 rounded-full cursor-pointer group',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#E8956D]',
                  dragOver ? 'ring-2 ring-[#E8956D]' : '',
                ].join(' ')}
                onClick={() => !uploading && fileInputRef.current?.click()}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && !uploading && fileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={onDrop}
              >
                <UserAvatar
                  firstName={user?.firstName}
                  lastName={user?.lastName}
                  email={user?.email}
                  avatarUrl={user?.avatarUrl}
                  size="lg"
                />
                {/* Hover overlay */}
                <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  {uploading
                    ? <Spinner className="text-white h-5 w-5" />
                    : <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                      </svg>
                  }
                </div>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPTED.join(',')}
                className="hidden"
                onChange={onFileChange}
              />

              <div className="min-w-0">
                <p className="font-semibold text-[#1A1A1A] truncate">{displayName}</p>
                <p className="text-xs text-gray-400 truncate mt-0.5">{user?.email}</p>
                {memberSince && (
                  <p className="text-xs text-gray-400 mt-1">
                    {t('profile.memberSince', { date: memberSince })}
                  </p>
                )}
                <p className="text-xs text-gray-400 mt-1">{t('profile.avatarUploadHint')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Edit form */}
        <form onSubmit={handleSubmit(onSubmit)}>
          <Card>
            <CardContent className="pt-5 space-y-4">
              <h2 className="font-semibold text-sm text-[#1A1A1A]">{t('profile.personalInfo')}</h2>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>{t('profile.firstName')}</Label>
                  <Input
                    {...register('firstName')}
                    placeholder={t('profile.firstNamePlaceholder')}
                    maxLength={100}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>{t('profile.lastName')}</Label>
                  <Input
                    {...register('lastName')}
                    placeholder={t('profile.lastNamePlaceholder')}
                    maxLength={100}
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label>{t('profile.email')}</Label>
                <Input
                  value={user?.email ?? ''}
                  readOnly
                  disabled
                  className="mt-1 bg-gray-50 text-gray-500"
                />
              </div>
            </CardContent>
          </Card>

          <Button type="submit" disabled={mutation.isPending} className="mt-4">
            {mutation.isPending ? `${t('common.save')}…` : t('common.save')}
          </Button>
        </form>
      </div>
    </div>
  )
}
