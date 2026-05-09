import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { LayoutDashboard, UtensilsCrossed, ChefHat, ShoppingCart, Store, LogOut, Settings, MessageSquarePlus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/auth'
import { FeedbackPanel } from '@/components/FeedbackPanel'
import { feedbackService } from '@/services/feedback'

export function MobileNav() {
  const { t } = useTranslation()
  const signOut = useAuthStore((s) => s.signOut)
  const isAdmin = useAuthStore((s) => s.isAdmin)
  const [feedbackOpen, setFeedbackOpen] = useState(false)

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['feedback', 'unread'],
    queryFn: isAdmin ? feedbackService.getAdminUnreadCount : feedbackService.getUnreadCount,
    refetchInterval: 30_000,
  })

  const navItems = [
    { to: '/app', icon: LayoutDashboard, label: t('nav.home') },
    { to: '/app/meal-plans', icon: UtensilsCrossed, label: t('nav.plans') },
    { to: '/app/recipes', icon: ChefHat, label: t('nav.recipes') },
    { to: '/app/shopping-list', icon: ShoppingCart, label: t('nav.shop') },
    { to: '/app/retail-products', icon: Store, label: t('nav.retail') },
    { to: '/app/settings', icon: Settings, label: t('nav.settings') },
  ]

  return (
    <>
    <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-[#1A1A1A] border-t border-white/10 safe-area-pb">
      <div className="flex items-center justify-around h-16">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/app'}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center gap-0.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors',
                isActive ? 'text-[#F28C28]' : 'text-white/60'
              )
            }
          >
            <Icon className="h-5 w-5" />
            {label}
          </NavLink>
        ))}
        <button
          onClick={() => setFeedbackOpen(true)}
          className="relative flex flex-col items-center gap-0.5 px-3 py-2 rounded-lg text-xs font-medium text-white/60 transition-colors"
        >
          <MessageSquarePlus className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 inline-flex items-center justify-center h-3.5 min-w-[0.875rem] px-0.5 rounded-full bg-[#F28C28] text-[8px] font-bold text-white leading-none">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
          {t('feedback.buttonTitleShort')}
        </button>
        <button
          onClick={signOut}
          className="flex flex-col items-center gap-0.5 px-3 py-2 rounded-lg text-xs font-medium text-white/60 transition-colors"
        >
          <LogOut className="h-5 w-5" />
          {t('common.signOut')}
        </button>
      </div>
    </nav>
    <FeedbackPanel open={feedbackOpen} onOpenChange={setFeedbackOpen} />
    </>
  )
}
