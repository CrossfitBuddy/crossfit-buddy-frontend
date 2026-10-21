import { useAuth } from './auth/useAuth'
import { getMenuItems } from './routes'
import { NavLink, Outlet, useLocation } from 'react-router-dom'

export function MobileShell() {
  const { activeRole } = useAuth()
  const navigation = activeRole ? getMenuItems(activeRole) : []
  const darkProfile = useLocation().pathname === '/profile'
  return (
    <div className={`mx-auto min-h-dvh max-w-md pb-24 shadow-xl ${darkProfile ? 'bg-[#101914] text-white' : 'bg-stone-50 text-stone-950'}`}>
      <main><Outlet /></main>
      <nav className={`fixed inset-x-0 bottom-0 z-10 mx-auto flex max-w-md justify-around border-t px-2 py-3 backdrop-blur ${darkProfile ? 'border-stone-700 bg-[#101914]/95' : 'border-stone-200 bg-white/95'}`}>
        {navigation.map(({ path: to, title: label, icon: Icon }) => (
          <NavLink key={to} to={to} end className={({ isActive }) => `flex min-w-16 flex-col items-center gap-1 text-xs ${darkProfile ? isActive ? '!text-lime-400' : '!text-stone-400' : isActive ? '!text-emerald-700' : '!text-stone-500'}`}>
            {Icon && <Icon size={21} />}{label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
