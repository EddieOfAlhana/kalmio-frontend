import * as React from 'react'
import * as ToastPrimitives from '@radix-ui/react-toast'
import { X } from 'lucide-react'

const ToastProvider = ToastPrimitives.Provider

const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Viewport
    ref={ref}
    className={[
      'fixed bottom-4 right-4 z-[100] flex max-h-screen w-full max-w-[380px] flex-col gap-2 p-2',
      className,
    ].filter(Boolean).join(' ')}
    {...props}
  />
))
ToastViewport.displayName = ToastPrimitives.Viewport.displayName

type ToastVariant = 'default' | 'success' | 'destructive'

const variantClasses: Record<ToastVariant, string> = {
  default: 'bg-white border border-gray-200 text-gray-900',
  success: 'bg-white border border-green-200 text-gray-900',
  destructive: 'bg-white border border-red-200 text-gray-900',
}

const Toast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root> & { variant?: ToastVariant }
>(({ className, variant = 'default', ...props }, ref) => (
  <ToastPrimitives.Root
    ref={ref}
    className={[
      'group pointer-events-auto relative flex w-full items-center justify-between gap-3 overflow-hidden rounded-xl p-4 shadow-lg transition-all',
      'data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)]',
      'data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out',
      'data-[state=closed]:fade-out-80 data-[state=open]:slide-in-from-bottom-4',
      variantClasses[variant],
      className,
    ].filter(Boolean).join(' ')}
    {...props}
  />
))
Toast.displayName = ToastPrimitives.Root.displayName

const ToastTitle = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Title>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Title
    ref={ref}
    className={['text-sm font-semibold', className].filter(Boolean).join(' ')}
    {...props}
  />
))
ToastTitle.displayName = ToastPrimitives.Title.displayName

const ToastDescription = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Description>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Description
    ref={ref}
    className={['text-sm text-gray-500', className].filter(Boolean).join(' ')}
    {...props}
  />
))
ToastDescription.displayName = ToastPrimitives.Description.displayName

const ToastClose = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Close>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Close>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Close
    ref={ref}
    className={[
      'shrink-0 rounded-md p-1 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-300',
      className,
    ].filter(Boolean).join(' ')}
    toast-close=""
    {...props}
  >
    <X size={14} />
  </ToastPrimitives.Close>
))
ToastClose.displayName = ToastPrimitives.Close.displayName

// ── Imperative toast API ──────────────────────────────────────────────────────

export type ToastOptions = {
  title: string
  description?: string
  variant?: ToastVariant
  duration?: number
}

type ToastEntry = ToastOptions & { id: string; open: boolean }

type ToastListener = (toasts: ToastEntry[]) => void
const listeners: Set<ToastListener> = new Set()
let toasts: ToastEntry[] = []

function dispatch(update: ToastEntry[]) {
  toasts = update
  listeners.forEach((l) => l(toasts))
}

export function toast(options: ToastOptions) {
  const id = Math.random().toString(36).slice(2)
  dispatch([...toasts, { ...options, id, open: true }])
  return id
}

function dismiss(id: string) {
  dispatch(toasts.map((t) => (t.id === id ? { ...t, open: false } : t)))
  setTimeout(() => { dispatch(toasts.filter((t) => t.id !== id)) }, 300)
}

// ── Toaster (mount once in App.tsx) ──────────────────────────────────────────

export function Toaster() {
  const [state, setState] = React.useState<ToastEntry[]>([])

  React.useEffect(() => {
    listeners.add(setState)
    return () => { listeners.delete(setState) }
  }, [])

  return (
    <ToastProvider swipeDirection="right">
      {state.map(({ id, title, description, variant, duration, open }) => (
        <Toast
          key={id}
          open={open}
          onOpenChange={(o) => { if (!o) dismiss(id) }}
          variant={variant}
          duration={duration ?? 4000}
        >
          <div className="flex-1 min-w-0">
            <ToastTitle>{title}</ToastTitle>
            {description && <ToastDescription>{description}</ToastDescription>}
          </div>
          <ToastClose />
        </Toast>
      ))}
      <ToastViewport />
    </ToastProvider>
  )
}
