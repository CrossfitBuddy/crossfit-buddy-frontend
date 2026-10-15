export function PlaceholderPage({ title }: { title: string }) {
  return (
    <>
      <header className="bg-[#101914] px-6 pb-8 pt-12 text-white">
        <h1 className="text-3xl font-black">{title}</h1>
      </header>
      <p className="px-6 py-8 text-stone-500">Раздел в разработке</p>
    </>
  )
}
