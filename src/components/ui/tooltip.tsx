import * as TooltipPrimitive from '@radix-ui/react-tooltip'

// eslint-disable-next-line react-refresh/only-export-components
export const TooltipProvider = TooltipPrimitive.Provider
// eslint-disable-next-line react-refresh/only-export-components
export const Tooltip = TooltipPrimitive.Root
// eslint-disable-next-line react-refresh/only-export-components
export const TooltipTrigger = TooltipPrimitive.Trigger

export function TooltipContent({
  children,
  side = 'top',
  align = 'center',
  ...props
}: TooltipPrimitive.TooltipContentProps) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        side={side}
        align={align}
        sideOffset={6}
        className="z-50 rounded-md bg-[#1A1A1A] px-2.5 py-1.5 text-xs text-white shadow-md animate-in fade-in-0 zoom-in-95"
        {...props}
      >
        {children}
        <TooltipPrimitive.Arrow className="fill-[#1A1A1A]" />
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  )
}
