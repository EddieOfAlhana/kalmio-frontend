import { NavLink } from 'react-router-dom'
import { LayoutDashboard, UtensilsCrossed, ChefHat, ShoppingCart, Store, LogOut } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/auth'

export function MobileNav() {
  const { t } = useTranslation()
  const signOut = useAuthStore((s) => s.signOut)

  const navItems = [
    { to: '/app', icon: LayoutDashboard, label: t('nav.home') },
    { to: '/app/meal-plans', icon: UtensilsCrossed, label: t('nav.plans') },
    { to: '/app/recipes', icon: ChefHat, label: t('nav.recipes') },
    { to: '/app/shopping-list', icon: ShoppingCart, label: t('nav.shop') },
    { to: '/app/retail-products', icon: Store, label: t('nav.retail') },
  ]

  return (
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
          onClick={signOut}
          className="flex flex-col items-center gap-0.5 px-3 py-2 rounded-lg text-xs font-medium text-white/60 transition-colors"
        >
          <LogOut className="h-5 w-5" />
          {t('common.signOut')}
        </button>
      </div>
    </nav>
  )
}
