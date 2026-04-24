import { NavLink } from 'react-router-dom'
import { LayoutDashboard, UtensilsCrossed, ChefHat, ShoppingCart, Store } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'

export function MobileNav() {
  const { t } = useTranslation()

  const navItems = [
    { to: '/', icon: LayoutDashboard, label: t('nav.home') },
    { to: '/meal-plans', icon: UtensilsCrossed, label: t('nav.plans') },
    { to: '/recipes', icon: ChefHat, label: t('nav.recipes') },
    { to: '/shopping-list', icon: ShoppingCart, label: t('nav.shop') },
    { to: '/retail-products', icon: Store, label: t('nav.retail') },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-[#1A1A1A] border-t border-white/10 safe-area-pb">
      <div className="flex items-center justify-around h-16">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
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
      </div>
    </nav>
  )
}
