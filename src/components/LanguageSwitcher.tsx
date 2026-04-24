import { useTranslation } from 'react-i18next'

export function LanguageSwitcher() {
  const { i18n } = useTranslation()
  const current = i18n.language?.startsWith('en') ? 'en' : 'hu'

  function toggle() {
    i18n.changeLanguage(current === 'hu' ? 'en' : 'hu')
  }

  return (
    <button
      onClick={toggle}
      className="flex items-center gap-1 text-xs font-bold tracking-wide text-white/50 hover:text-white transition-colors px-2 py-1 rounded-lg hover:bg-white/10"
      title={current === 'hu' ? 'Switch to English' : 'Váltás magyarra'}
    >
      <span className={current === 'hu' ? 'text-white' : 'text-white/40'}>HU</span>
      <span className="text-white/20">/</span>
      <span className={current === 'en' ? 'text-white' : 'text-white/40'}>EN</span>
    </button>
  )
}
