import { NavLink } from 'react-router-dom'
import { LayoutDashboard, UtensilsCrossed, ChefHat, ShoppingCart, Leaf, Store, LogOut, Settings, ShieldCheck } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { useAuthStore } from '@/store/auth'

export function Sidebar() {
  const { t } = useTranslation()
  const signOut = useAuthStore((s) => s.signOut)
  const isAdmin = useAuthStore((s) => s.isAdmin)

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
      <div className="h-16 flex items-center px-6 border-b border-white/10">
        <span className="text-[#F28C28] font-headline text-xl font-bold tracking-tight">KALMIO</span>
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
    </aside>
  )
}
