let activeStageIndex: number | null = null
let returnToStageIndex: number | null = null

export const getActiveStageIndex = () => activeStageIndex

export const beginRoundForStage = (stageIndex: number) => {
  activeStageIndex = stageIndex
}

export const clearRoundFlow = () => {
  activeStageIndex = null
}

export const rememberWorkoutCreateScrollStage = (stageIndex: number) => {
  returnToStageIndex = stageIndex
}

export const consumeWorkoutCreateScrollStage = () => {
  const index = returnToStageIndex
  returnToStageIndex = null
  return index
}