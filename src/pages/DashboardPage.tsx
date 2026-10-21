const getGreeting = (hour: number) => {
  if (hour < 6) return 'Доброй ночи'
  if (hour < 12) return 'Доброе утро'
  if (hour < 18) return 'Добрый день'
  return 'Добрый вечер'
}

export function DashboardPage() {
  return (
    <header className="bg-[#101914] px-6 pb-10 pt-12 text-white">
      <p className="text-sm font-bold text-lime-400">CrossfitBuddy</p>
      <h1 className="mt-3 text-4xl font-black">{getGreeting(new Date().getHours())}!</h1>
    </header>
  )
}
