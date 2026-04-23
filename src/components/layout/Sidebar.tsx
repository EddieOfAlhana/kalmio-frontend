import { NavLink } from 'react-router-dom'
import { LayoutDashboard, UtensilsCrossed, ChefHat, ShoppingCart, Leaf } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/meal-plans', icon: UtensilsCrossed, label: 'Meal Plans' },
  { to: '/recipes', icon: ChefHat, label: 'Recipes' },
  { to: '/ingredients', icon: Leaf, label: 'Ingredients' },
  { to: '/shopping-list', icon: ShoppingCart, label: 'Shopping List' },
]

export function Sidebar() {
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
            end={to === '/'}
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
      </nav>

      <div className="px-6 py-4 border-t border-white/10">
        <p className="text-xs text-white/40">Nutrition Engine v0.1</p>
      </div>
    </aside>
  )
}
