import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ProviderButtonProps {
  onClick: () => void
  disabled?: boolean
  loading?: boolean
  loadingLabel: string
  label: string
  icon: React.ReactNode
}

/**
 * Reusable OAuth provider button.
 *
 * Renders a white-background button with a light border, matching Google and
 * Apple brand button style. The `icon` slot accepts any React node so the
 * caller supplies the provider logo (GoogleLogo, future AppleLogo, etc.).
 */
export function ProviderButton({
  onClick,
  disabled = false,
  loading = false,
  loadingLabel,
  label,
  icon,
}: ProviderButtonProps) {
  return (
    <Button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className="w-full h-12 rounded-2xl bg-white hover:bg-gray-50 border border-gray-200 text-midnight-black gap-2 text-base font-semibold shadow-sm"
    >
      {loading ? (
        <Loader2 size={18} className="animate-spin" />
      ) : (
        <span className="flex items-center">{icon}</span>
      )}
      <span className="ml-1">{loading ? loadingLabel : label}</span>
    </Button>
  )
}
