import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { clearRoundFlow, getActiveStageIndex, rememberWorkoutCreateScrollStage } from '../workouts/roundFlow'
import { setStageRound } from '../workouts/workoutDraft'
import { RoundForm } from './RoundForm'
import { resetSelection } from './selection'

export function RoundRoute() {
  const navigate = useNavigate()
  const stageIndex = getActiveStageIndex()

  useEffect(() => {
    if (stageIndex === null) navigate('/workouts/new', { replace: true })
  }, [navigate, stageIndex])

  if (stageIndex === null) return null

  return (
    <RoundForm
      onConfirm={(round) => {
        if (stageIndex === null) return
        setStageRound(stageIndex, round)
        rememberWorkoutCreateScrollStage(stageIndex)
        clearRoundFlow()
        resetSelection()
        navigate('/workouts/new', { state: { scrollToStage: stageIndex } })
      }}
    />
  )
}