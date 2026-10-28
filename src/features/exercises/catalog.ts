export type Exercise = {
  id: string
  name: string
  category: string
  equipment: string
  description: string
}

export const exerciseCategories = ['Грудь', 'Икры', 'Кардио', 'Ноги', 'Плечи', 'Пресс', 'Руки', 'Спина']
export const exerciseEquipment = ['Без оборудования', 'Гантели', 'Гиря', 'Скакалка', 'Турник', 'Штанга']

export const exercises: Exercise[] = [
  { id: 'burpee', name: 'Берпи', category: 'Кардио', equipment: 'Без оборудования', description: 'Из упора лёжа отжимание, прыжок к рукам и выпрыгивание вверх.' },
  { id: 'lunge', name: 'Выпады', category: 'Ноги', equipment: 'Гантели', description: 'Шаг вперёд и опускание заднего колена, затем возврат в стойку.' },
  { id: 'row', name: 'Гребля', category: 'Кардио', equipment: 'Без оборудования', description: 'Тяга руками к поясу с прямой спиной и отведением лопаток.' },
  { id: 'bench', name: 'Жим лёжа', category: 'Грудь', equipment: 'Штанга', description: 'Лёжа на скамье выжать штангу от груди до прямых рук.' },
  { id: 'swing', name: 'Махи гирей', category: 'Плечи', equipment: 'Гиря', description: 'Мах гирей до уровня глаз за счёт таза и ног, руки не поднимают вес сами.' },
  { id: 'pushup', name: 'Отжимания', category: 'Грудь', equipment: 'Без оборудования', description: 'Опускание грудью к полу из упора лёжа и возврат в исходное положение.' },
  { id: 'plank', name: 'Планка', category: 'Пресс', equipment: 'Без оборудования', description: 'Удержание прямого тела в упоре на предплечьях.' },
  { id: 'pullup', name: 'Подтягивания', category: 'Спина', equipment: 'Турник', description: 'Подтягивание подбородка выше перекладины прямым хватом.' },
  { id: 'calf', name: 'Подъём на носки', category: 'Икры', equipment: 'Без оборудования', description: 'Подъём на носки и медленное опускание пяток.' },
  { id: 'squat', name: 'Приседания', category: 'Ноги', equipment: 'Штанга', description: 'Присед до параллели бедра с полом и вставание со штангой на плечах.' },
  { id: 'curl', name: 'Сгибания рук', category: 'Руки', equipment: 'Гантели', description: 'Сгибание рук с гантелями, локти остаются у корпуса.' },
  { id: 'rope', name: 'Скакалка', category: 'Кардио', equipment: 'Скакалка', description: 'Прыжки через скакалку в ровном ритме.' },
  { id: 'deadlift', name: 'Становая тяга', category: 'Спина', equipment: 'Штанга', description: 'Подъём штанги с пола до полного выпрямления, спина нейтральная.' },
  { id: 'thruster', name: 'Трастеры', category: 'Плечи', equipment: 'Штанга', description: 'Присед со штангой у плеч и сразу жим над головой.' },
]

export function filterExercises(source: Exercise[], query: string, category: string, equipment: string) {
  const text = query.trim().toLocaleLowerCase('ru')
  return source
    .filter((exercise) => {
      const matchesText = text.length === 0 || exercise.name.toLocaleLowerCase('ru').includes(text)
      const matchesCategory = category === 'all' || exercise.category === category
      const matchesEquipment = equipment === 'all' || exercise.equipment === equipment
      return matchesText && matchesCategory && matchesEquipment
    })
    .sort((left, right) => left.name.localeCompare(right.name, 'ru'))
}

export function groupByLetter(source: Exercise[]) {
  const groups: { letter: string; items: Exercise[] }[] = []
  for (const exercise of source) {
    const letter = exercise.name[0]?.toLocaleUpperCase('ru') ?? ''
    const current = groups[groups.length - 1]
    if (!current || current.letter !== letter) groups.push({ letter, items: [exercise] })
    else current.items.push(exercise)
  }
  return groups
}
