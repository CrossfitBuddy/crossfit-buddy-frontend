import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from './auth/useAuth'
import { getMenuItems } from './routes'

export function MobileShell() {
  const { activeRole } = useAuth()
  const darkProfile = useLocation().pathname === '/profile'
  const navigation = activeRole ? getMenuItems(activeRole) : []

  return (
    <div className={darkProfile ? "mx-auto min-h-dvh max-w-md bg-[#101914] pb-24 text-white shadow-xl" : "mx-auto min-h-dvh max-w-md bg-stone-50 pb-24 text-stone-950 shadow-xl"}>
      <main><Outlet /></main>
      <nav className={"fixed inset-x-0 bottom-0 z-10 mx-auto flex max-w-md justify-around border-t px-2 py-3 backdrop-blur " + (darkProfile ? "border-stone-700 bg-[#101914]/95" : "border-stone-200 bg-white/95")}>
        {navigation.map(({ path, title, icon: Icon }) => (
          <NavLink key={path} to={path} end className={({ isActive }) => `flex min-w-16 flex-col items-center gap-1 text-xs ${darkProfile ? isActive ? '!text-lime-400' : '!text-stone-400' : isActive ? 'text-emerald-700' : 'text-stone-500'}`}>
            {Icon && <Icon size={21} />}{title}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
