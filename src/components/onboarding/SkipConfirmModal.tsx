/**
 * SkipConfirmModal — KALMIO-167
 *
 * Confirmation dialog shown when the user taps "Kihagyom most" from step 2
 * onward. Uses the existing @radix-ui/react-dialog primitive (AlertDialog is
 * not installed; Dialog is semantically adequate here because the action
 * is recoverable — the user can always complete onboarding from Profile).
 *
 * Tone: warm, deferential, te-form. No exclamation marks.
 */

import { useTranslation } from 'react-i18next'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface SkipConfirmModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Called when the user confirms they want to skip. */
  onConfirm: () => void
}

export function SkipConfirmModal({ open, onOpenChange, onConfirm }: SkipConfirmModalProps) {
  const { t } = useTranslation()

  function handleConfirm() {
    onOpenChange(false)
    onConfirm()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm" aria-describedby="skip-confirm-desc">
        <DialogHeader>
          <DialogTitle>{t('onboarding.shell.skipConfirm.title')}</DialogTitle>
          <DialogDescription id="skip-confirm-desc">
            {t('onboarding.shell.skipConfirm.body')}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 mt-4">
          <Button
            variant="primary"
            size="md"
            onClick={handleConfirm}
            className="w-full"
          >
            {t('onboarding.shell.skipConfirm.confirm')}
          </Button>

          <DialogClose asChild>
            <Button variant="ghost" size="md" className="w-full">
              {t('onboarding.shell.skipConfirm.cancel')}
            </Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  )
}
