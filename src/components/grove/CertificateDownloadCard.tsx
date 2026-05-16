/**
 * CertificateDownloadCard — KALMIO-145 / E6.6
 *
 * Lets the graduated user download their HU or EN PDF certificate.
 * Calls GET /api/users/me/graduation-certificate.pdf with `?lang=hu|en`
 * query param (KALMIO-141 backend endpoint).
 *
 * Falls back gracefully when the backend endpoint is not yet deployed
 * (network / 404 error) — shows a descriptive error without crashing.
 *
 * Mobile-first. WCAG 2.1 AA: focus-visible rings, aria-busy on loading state.
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Download } from 'lucide-react'
import { api } from '@/lib/api'

// ── Types ─────────────────────────────────────────────────────────────────────

type Lang = 'hu' | 'en'
type DownloadState = 'idle' | 'downloading' | 'error'

// ── Helpers ───────────────────────────────────────────────────────────────────

async function downloadCertificate(lang: Lang): Promise<void> {
  const res = await api.get('/api/users/me/graduation-certificate.pdf', {
    params: { lang },
    responseType: 'blob',
  })

  const blob = new Blob([res.data as BlobPart], { type: 'application/pdf' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = `kalmio-oklevél-${lang}.pdf`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// ── Component ─────────────────────────────────────────────────────────────────

export function CertificateDownloadCard() {
  const { t } = useTranslation()
  const [downloadingLang, setDownloadingLang] = useState<Lang | null>(null)
  const [state, setState] = useState<DownloadState>('idle')

  async function handleDownload(lang: Lang) {
    if (downloadingLang !== null) return
    setDownloadingLang(lang)
    setState('downloading')
    try {
      await downloadCertificate(lang)
      setState('idle')
    } catch {
      setState('error')
    } finally {
      setDownloadingLang(null)
    }
  }

  const huBusy  = downloadingLang === 'hu'
  const enBusy  = downloadingLang === 'en'
  const anyBusy = downloadingLang !== null

  return (
    <div className="rounded-2xl bg-white border border-[#c4dabb]/60 shadow-sm px-5 py-5">
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <span
          className="shrink-0 mt-0.5 flex items-center justify-center w-9 h-9 rounded-full bg-[#eef6eb] text-[#4F7942]"
          aria-hidden="true"
        >
          <Download className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <h3 className="font-semibold text-[15px] text-[#1A1A1A] leading-snug">
            {t('grove.certificate.title')}
          </h3>
          <p className="mt-0.5 text-sm text-[#3d2008]/65 leading-relaxed">
            {t('grove.certificate.description')}
          </p>
        </div>
      </div>

      {/* Download buttons */}
      <div className="flex flex-col gap-2 sm:flex-row sm:gap-3 mt-4">
        <button
          type="button"
          disabled={anyBusy}
          aria-busy={huBusy}
          onClick={() => handleDownload('hu')}
          className="
            flex items-center justify-center gap-2
            w-full sm:w-auto flex-1
            rounded-xl border border-[#4F7942] bg-[#4F7942] px-4 py-2.5
            text-sm font-medium text-white
            hover:bg-[#3e6133] hover:border-[#3e6133]
            focus-visible:outline-none focus-visible:ring-2
            focus-visible:ring-[#4F7942] focus-visible:ring-offset-2
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-colors
          "
        >
          <Download className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          {huBusy
            ? t('grove.certificate.downloadingHu')
            : t('grove.certificate.downloadHu')}
        </button>

        <button
          type="button"
          disabled={anyBusy}
          aria-busy={enBusy}
          onClick={() => handleDownload('en')}
          className="
            flex items-center justify-center gap-2
            w-full sm:w-auto flex-1
            rounded-xl border border-[#4F7942] bg-white px-4 py-2.5
            text-sm font-medium text-[#4F7942]
            hover:bg-[#eef6eb]
            focus-visible:outline-none focus-visible:ring-2
            focus-visible:ring-[#4F7942] focus-visible:ring-offset-2
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-colors
          "
        >
          <Download className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          {enBusy
            ? t('grove.certificate.downloadingEn')
            : t('grove.certificate.downloadEn')}
        </button>
      </div>

      {/* Error state */}
      {state === 'error' && (
        <p
          role="alert"
          className="mt-3 text-sm text-red-600"
        >
          {t('grove.certificate.downloadError')}
        </p>
      )}
    </div>
  )
}
