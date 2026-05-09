import { useState } from 'react'
import { NavLink, Link } from 'react-router-dom'
import { LayoutDashboard, UtensilsCrossed, ChefHat, ShoppingCart, Leaf, Store, LogOut, Settings, ShieldCheck, MessageSquarePlus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { cn } from '@/lib/utils'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { useAuthStore } from '@/store/auth'
import { FeedbackPanel } from '@/components/FeedbackPanel'
import { feedbackService } from '@/services/feedback'

export function Sidebar() {
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
    { to: '/app', icon: LayoutDashboard, label: t('nav.dashboard') },
    { to: '/app/meal-plans', icon: UtensilsCrossed, label: t('nav.mealPlans') },
    { to: '/app/recipes', icon: ChefHat, label: t('nav.recipes') },
    { to: '/app/ingredients', icon: Leaf, label: t('nav.ingredients') },
    { to: '/app/shopping-list', icon: ShoppingCart, label: t('nav.shoppingList') },
    { to: '/app/retail-products', icon: Store, label: t('nav.retail') },
  ]

  return (
    <aside className="hidden md:flex flex-col w-64 min-h-screen bg-[#1A1A1A] text-white shrink-0">
      {/* Logo */}
      <div className="h-16 flex items-center px-4 border-b border-white/10">
        <Link to="/" className="hover:opacity-80 transition-opacity flex flex-col gap-1">
          <img src="/assets/images/logo.png" alt="Kalmio" className="h-9 object-contain object-left" />
          <span className="text-[10px] text-white/40 tracking-wide leading-none">{t('auth.tagline')}</span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/app'}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-[12px] text-sm font-medium transition-colors',
                isActive
                  ? 'bg-[#F28C28] text-white'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
              )
            }
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </NavLink>
        ))}

        {isAdmin && (
          <NavLink
            to="/app/admin/users"
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-[12px] text-sm font-medium transition-colors',
                isActive
                  ? 'bg-[#F28C28] text-white'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
              )
            }
          >
            <ShieldCheck className="h-4 w-4 shrink-0" />
            {t('nav.admin')}
          </NavLink>
        )}
      </nav>

      <div className="px-4 py-4 border-t border-white/10 flex items-center justify-between gap-2">
        <p className="text-xs text-white/40 truncate">{t('common.version')}</p>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => setFeedbackOpen(true)}
            title={t('feedback.buttonTitle')}
            className="relative p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
          >
            <MessageSquarePlus className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 inline-flex items-center justify-center h-4 min-w-[1rem] px-0.5 rounded-full bg-[#F28C28] text-[9px] font-bold text-white leading-none">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>
          <NavLink
            to="/app/settings"
            title={t('nav.settings')}
            className={({ isActive }) =>
              cn(
                'p-2 rounded-lg transition-colors',
                isActive ? 'text-[#F28C28]' : 'text-white/50 hover:text-white hover:bg-white/10'
              )
            }
          >
            <Settings className="h-4 w-4" />
          </NavLink>
          <LanguageSwitcher />
          <button
            onClick={signOut}
            title={t('common.signOut')}
            className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>

      <FeedbackPanel open={feedbackOpen} onOpenChange={setFeedbackOpen} />
    </aside>
  )
}
