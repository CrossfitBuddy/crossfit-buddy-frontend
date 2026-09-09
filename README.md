# CrossfitBuddy Frontend

Mobile-first заготовка на React, TypeScript, Vite, Tailwind CSS и Ant Design. Подключены маршрутизация, TanStack Query, официальные Ant Design Icons и единая тема в `src/app/designSystem.ts`.

Ant Design используется для доступных интерактивных компонентов (формы, поля, кнопки, карточки, уведомления), а Tailwind CSS — для раскладки и адаптивности. Перед созданием своего компонента проверьте, нет ли подходящего компонента в Ant Design.

## Запуск

1. Установить Node.js 22 LTS.
2. Выполнить `npm install` (первый раз) или `npm ci` после появления lock-файла.
3. Скопировать `.env.example` в `.env` и при необходимости изменить API URL.
4. Запустить `npm run dev`.

Перед реализацией экранов синхронизируйте компоненты и токены с актуальным макетом Figma v1.3.
