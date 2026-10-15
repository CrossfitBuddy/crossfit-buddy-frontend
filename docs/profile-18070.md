# Профиль — задача 18070

Задача: https://ai.nsu.ru/issues/18070

Ветка создана от master. Экран /profile встроен в существующий MobileShell. Компоновка взята из макетов собственного профиля атлета/тренера и редактирования; цвета — из текущей темы приложения.

## Данные

Полный будущий ProfileResponse пока не опубликован: в backend есть только прежний UserProfileResponse(id, email, displayName). Тип src/features/profile/types.ts — предварительный контракт, составленный по UserProfile, AthleteProfile, TrainerProfile и AccountResponse из backend-ветки feature/auth-and-profiles. При появлении согласованного DTO нужно сверить названия и вложенность в адаптере, прежде чем подключать реальный API.

Общие поля: id, email, roles, activeRole, firstName, lastName, birthDate (YYYY-MM-DD или null), gender (MALE/FEMALE/OTHER или null), city, about, avatarKey. athleteProfile содержит heightCm, weightKg, fitnessLevel (BEGINNER/INTERMEDIATE/ADVANCED), rxPreference (RX/SCALED). trainerProfile содержит specializations (строка), experienceYears и methodology. Необязательные поля передаются как null. В обновление входят только общие редактируемые поля и блок активной роли; email, id и права не изменяются.

Mock API изолирован от компонентов. Изменения живут в памяти до перезагрузки страницы, сохраняются при переходах внутри приложения. Смена роли в этом экране относится к mock-профилю; при объединении с PR ролевой навигации источником роли должен стать общий auth-контекст. Текущий mock не выполняет вход, загрузку файлов или запросы к backend.

Аватар: локальное превью JPG/PNG/WebP до 5 МБ. avatarKey остаётся ключом, blob URL хранится отдельно. Отмена восстанавливает исходный аватар; замена и удаление применяются при сохранении.

## Проверки

npm test, npm run lint, npm run build.

Автотесты: загрузка и повторная попытка после ошибки, отмена через кнопку и стрелку, валидация, успешное сохранение, сохранение полей другой роли, повторная попытка после ошибки, блокировка формы и повторной отправки во время запроса, переключение ролей, даты и ограничения аватара.

Mock-сценарии для ручной проверки через dev-сервер:
- /profile — атлет, доступно переключение на тренера;
- /profile?profileScenario=load-error — ошибка загрузки;
- /profile?profileScenario=save-error — ошибка сохранения, данные остаются в форме;
- /profile?profileScenario=slow — медленная загрузка и сохранение.

В production-сборке параметры mock-сценариев игнорируются. Чужой профиль, история изменений и удаление аккаунта не входят в задачу 18070 и не реализованы.
