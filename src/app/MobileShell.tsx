import { Dumbbell, History, House, UserRound } from 'lucide-react'
import { NavLink, Outlet } from 'react-router-dom'

const navigation = [
  { to: '/', label: 'Главная', icon: House },
  { to: '/workouts', label: 'Тренировки', icon: Dumbbell },
  { to: '/history', label: 'История', icon: History },
  { to: '/profile', label: 'Профиль', icon: UserRound },
]

export function MobileShell() {
  return (
    <div className="mx-auto min-h-dvh max-w-md bg-stone-50 pb-24 text-stone-950 shadow-xl">
      <main><Outlet /></main>
      <nav className="fixed inset-x-0 bottom-0 z-10 mx-auto flex max-w-md justify-around border-t border-stone-200 bg-white/95 px-2 py-3 backdrop-blur">
        {navigation.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} className={({ isActive }) => `flex min-w-16 flex-col items-center gap-1 text-xs ${isActive ? 'text-emerald-700' : 'text-stone-500'}`}>
            <Icon size={21} />{label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
