import { ArrowRightOutlined, PlusOutlined } from '@ant-design/icons'
import { Button, Card, Segmented, Tag } from 'antd'

export function DashboardPage() {
  return (
    <div>
      <header className="bg-[#101914] px-6 pb-8 pt-10 text-white">
        <Segmented<string>
          size="small"
          value="ATHLETE"
          options={['ATHLETE', 'TRAINER']}
          aria-label="Активная роль"
        />
        <h1 className="mt-2 text-3xl font-black tracking-tight">Пора двигаться</h1>
        <p className="mt-2 text-sm text-stone-300">Тренировки, результаты и прогресс — в одном месте.</p>
      </header>
      <section className="space-y-4 px-5 py-6">
        <Button type="primary" size="large" block icon={<PlusOutlined />}>Начать тренировку</Button>
        <Card bordered>
          <Tag color="lime">СЛЕДУЮЩАЯ ТРЕНИРОВКА</Tag>
          <h2 className="mt-3 text-xl font-bold">Тренировка пока не назначена</h2>
          <p className="mt-1 text-sm text-stone-600">Создайте собственный комплекс или дождитесь назначения тренера.</p>
          <Button type="link" className="mt-2 !px-0" icon={<ArrowRightOutlined />} iconPosition="end">Все тренировки</Button>
        </Card>
      </section>
    </div>
  )
}
