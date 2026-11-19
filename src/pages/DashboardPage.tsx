import { Button } from 'antd'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../app/auth/useAuth'
import { resetWorkoutDraft } from '../features/workouts/workoutDraft'

const getGreeting = (hour: number) => {
  if (hour < 6) return 'Доброй ночи'
  if (hour < 12) return 'Доброе утро'
  if (hour < 18) return 'Добрый день'
  return 'Добрый вечер'
}

export function DashboardPage() {
  const { activeRole } = useAuth()
  const navigate = useNavigate()

  const startCreate = () => {
    resetWorkoutDraft()
    navigate('/workouts/new')
  }

  return (
    <div className="bg-[#f7f7f5] pb-8">
      <header className="bg-[#101914] px-6 pb-10 pt-12 text-white">
        <p className="text-sm font-bold uppercase tracking-[0.24em] text-[#a3e635]">CrossfitBuddy</p>
        <h1 className="mt-3 text-4xl font-black">{getGreeting(new Date().getHours())}!</h1>
      </header>
      {activeRole === 'TRAINER' ? (
        <div className="p-6">
          <Button type="primary" block size="large" onClick={startCreate}>
            Создать тренировку
          </Button>
        </div>
      ) : null}
    </div>
  )
}
