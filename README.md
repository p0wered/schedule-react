# Расписание

Небольшое React-приложение для отображения расписания по числителю и знаменателю.

## Стек

- React 19
- Vite 7
- TypeScript 5.8

## Локальный запуск

Требуется актуальная LTS-версия [Node.js](https://nodejs.org/en/download).

```shell
git clone https://github.com/p0wered/schedule-react.git
cd schedule-react
npm install
npm run dev
```

## Команды

```shell
npm run dev        # локальный сервер
npm run typecheck  # проверка TypeScript
npm run lint       # статический анализ
npm run test       # модульные и компонентные тесты
npm run build      # production-сборка
```

## Настройка расписания

Данные находятся в [`src/data/schedule.ts`](src/data/schedule.ts). Дата начала семестра задаётся без неоднозначного нулевого месяца:

```ts
semesterStart: { year: 2026, month: 8, day: 31 }
```

Для пары, которая различается по неделям, используется вариант `alternating`:

```ts
schedule: {
  kind: 'alternating',
  numerator: { type: 'lec', name: 'Дисциплина' },
  denominator: { type: 'lab', name: 'Дисциплина' },
}
```

Для пары, которая проходит каждую неделю:

```ts
schedule: {
  kind: 'every-week',
  discipline: { type: 'upr', name: 'Практика' },
}
```

Каждая пара должна иметь стабильный уникальный `id` в пределах расписания.
