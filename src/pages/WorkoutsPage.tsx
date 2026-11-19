import { Button } from 'antd'
import { useNavigate } from 'react-router-dom'
import { resetWorkoutDraft } from '../features/workouts/workoutDraft'

export function WorkoutsPage() {
  const navigate = useNavigate()

  const startCreate = () => {
    resetWorkoutDraft()
    navigate('/workouts/new')
  }

  return (
    <div className="bg-[#f7f7f5] pb-8 text-[#171c18]">
      <header className="bg-[#101914] px-6 pb-8 pt-12 text-white">
        <p className="text-sm font-bold uppercase tracking-[0.24em] text-[#a3e635]">CrossfitBuddy</p>
        <h1 className="mt-3 text-4xl font-black">Тренировки</h1>
      </header>
      <div className="space-y-4 p-6">
        <Button type="primary" block size="large" onClick={startCreate}>
          Создать тренировку
        </Button>
        <p className="text-center text-sm text-stone-500">Список тренировок подключим в задаче CB-18709</p>
      </div>
    </div>
  )
}