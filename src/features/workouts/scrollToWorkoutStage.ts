const SCROLL_TOP_OFFSET_PX = 20

export const scrollToWorkoutStage = (stageIndex: number) => {
  const target =
    document.getElementById(`stage-card-${stageIndex}`) ??
    document.getElementById(`stage-round-${stageIndex}`) ??
    document.getElementById(`stage-${stageIndex}`)
  if (!target) return false
  const top = target.getBoundingClientRect().top + window.scrollY - SCROLL_TOP_OFFSET_PX
  window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' })
  return true
}