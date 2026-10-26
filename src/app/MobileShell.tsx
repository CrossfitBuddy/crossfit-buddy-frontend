import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from './auth/useAuth'
import { getMenuItems } from './routes'

export function MobileShell() {
  const { activeRole } = useAuth()
  const navigation = activeRole ? getMenuItems(activeRole) : []

  return (
    <div className="mx-auto min-h-dvh max-w-md bg-stone-50 pb-24 text-stone-950 shadow-xl">
      <main><Outlet /></main>
      <nav className="fixed inset-x-0 bottom-0 z-10 mx-auto flex max-w-md justify-around border-t border-stone-200 bg-white/95 px-2 py-3 backdrop-blur">
        {navigation.map(({ path, title, icon: Icon }) => (
          <NavLink key={path} to={path} end className={({ isActive }) => `flex min-w-16 flex-col items-center gap-1 text-xs ${isActive ? 'text-emerald-700' : 'text-stone-500'}`}>
            {Icon && <Icon size={21} />}{title}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
