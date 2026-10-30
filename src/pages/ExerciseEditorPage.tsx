import { useParams } from 'react-router-dom'
import { ExerciseEditor } from '../features/exercises/ExerciseEditor'

export function ExerciseEditorPage() {
  const { id } = useParams()
  return <ExerciseEditor key={id ?? 'new'} id={id} />
}
