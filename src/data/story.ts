import { categoryTitle, products, productsByCategory, type Product } from './catalog'

/**
 * Продуктовая история — то, что читает человек, открывший карточку товара.
 *
 * ГЛАВНОЕ ПРАВИЛО ЭТОГО ФАЙЛА: здесь нет ни одного придуманного факта.
 * Всё, что попадает на страницу, либо лежит в catalog.ts (характеристики
 * из прайса клиента), либо вычисляется из него же (позиция модели внутри
 * линейки, совместимость по резьбе и диаметру, место круга/пасты в
 * таблице применения). Формулировки объясняют, что означает реальная
 * цифра в работе — но новых цифр, моторов, сертификатов и "технологий"
 * не появляется.
 *
 * Клиент показывал на видео официальный shinemate.com как ориентир по
 * ГЛУБИНЕ подачи: там товар не заканчивается таблицей, а разворачивается
 * в историю. Здесь та же глубина, но на своих данных и по-русски —
 * их сцены с вшитым в картинку английским текстом сюда не переносятся.
 */

/* ─────────────────────────── Таблица применения ─────────────────────────── */

export type PolishStage = {
  index: string
  title: string
  goal: string
  defects: string[]
  paste: string
  pads: { kind: string; grade: string }[]
}

/**
 * Четыре стадии обработки — с официальной «Таблицы применения» ShineMate.
 * Единый источник правды: этим же массивом рендерится страница
 * «Технологии» и определяется место конкретного круга/пасты в цикле.
 */
export const POLISH_STAGES: PolishStage[] = [
  {
    index: '01',
    title: 'Шлифование',
    goal: 'Снять грубые дефекты до полировки',
    defects: ['Глубокие царапины', 'Апельсиновая корка', 'Перелив краски'],
    paste: 'Без пасты — абразивные диски 2000/3000',
    pads: [{ kind: 'Шлифовальная машинка', grade: 'ES516 · ES700' }],
  },
  {
    index: '02',
    title: 'Тяжёлая коррекция',
    goal: 'Убрать след шлифовки и сильное окисление',
    defects: ['Сильное окисление', 'Следы шлифовального диска', 'Глубокие голограммы'],
    paste: 'V80 Heavy-Cut · V82 Fast Polish',
    pads: [
      { kind: 'Шерсть', grade: 'T160 высокий ворс · T140 короткий' },
      { kind: 'Поролон', grade: 'T120 зелёный · T80 жёлтый' },
    ],
  },
  {
    index: '03',
    title: 'Полировка',
    goal: 'Выровнять поверхность и убрать среднюю дефектность',
    defects: ['Лёгкие царапины', 'Среднее окисление', 'Выраженные разводы'],
    paste: 'V40 Medium Polish',
    pads: [
      { kind: 'Поролон', grade: 'T60 синий · T40 оранжевый' },
      { kind: 'Микрофибра', grade: 'T100 — рез' },
    ],
  },
  {
    index: '04',
    title: 'Финиш',
    goal: 'Вывести чистый глубокий блеск',
    defects: ['Царапины от мойки', 'Тончайшие разводы', 'Голограммы', 'Мутность'],
    paste: 'V20 Final Finish',
    pads: [
      { kind: 'Поролон', grade: 'T20 · T10 красный' },
      { kind: 'Микрофибра', grade: 'T20 — финиш' },
    ],
  },
]

/* ──────────────────────────── Модель истории ──────────────────────────── */

/** Крупная сцена: заголовок, объяснение и — если есть — реальная цифра из прайса. */
export type StoryScene = {
  title: string
  body: string
  /** Значение берётся из specs товара, поэтому никогда не расходится с прайсом. */
  metric?: { value: string; caption: string }
  /** Иллюстрация — только реальное фото из каталога, если оно уместно. */
  image?: string
}

/** Позиция товара на шкале «рез → финиш» (для кругов и паст). */
export type CutScale = {
  caption: string
  steps: { label: string; note: string; active: boolean }[]
}

export type CompatGroup = {
  title: string
  note: string
  items: Product[]
}

/**
 * Сравнение модели с соседями по разделу — только те характеристики,
 * которые реально заполнены минимум у двух моделей раздела. Если общих
 * характеристик нет, таблица не строится вовсе: пустая таблица со
 * сплошными прочерками хуже её отсутствия.
 */
export type ComparisonTable = {
  caption: string
  columns: string[]
  rows: {
    slug: string
    /** Готовая ссылка на карточку (категория + slug), как в остальном каталоге. */
    href: string
    model: string
    kind: string
    image: string
    values: (string | null)[]
    active: boolean
  }[]
}

/**
 * Связка «машинка → подложка → круг → паста»: то, что клиент называл
 * «собери правильную систему ShineMate». Каждый шаг — реальная позиция
 * каталога, а не абстрактная иконка; шаг самого товара подсвечен.
 */
export type SystemChain = {
  caption: string
  note: string
  steps: { role: string; product: Product; note: string; active: boolean }[]
}

export type ProductStory = {
  /** Что это за товар и для какой работы — крупный блок под hero. */
  purpose: { title: string; body: string; points: string[] }
  /** Ключевые характеристики крупными значениями (не таблицей). */
  highlights: { label: string; value: string }[]
  /** Все реальные кадры позиции: фото товара + фото исполнений. */
  gallery: string[]
  /** Официальные съёмочные кадры: товар в работе, а не рендер на белом. */
  photos: StoryPhoto[]
  /** Полный цикл обработки — показывается там, где позиция участвует во всех стадиях. */
  process?: { caption: string; note: string; stages: PolishStage[] }
  /** Визуальные сцены: чередуются по композиции при рендере. */
  scenes: StoryScene[]
  /** Место в линейке / в цикле обработки. */
  scale?: CutScale
  /** Шкала жёсткости кругов T10…T160 — только для кругов. */
  grades?: CutScale
  /** Чем модель отличается от соседей по разделу. */
  comparison?: ComparisonTable
  /** Место позиции в связке машинка → подложка → круг → паста. */
  chain?: SystemChain
  /** Совместимость — только реальные товары из этого же каталога. */
  compat: CompatGroup[]
}

/* ─────────────────────────────── Утилиты ─────────────────────────────── */

const specValue = (p: Product, label: string) =>
  p.specs.find((s) => s.label.toLowerCase().includes(label.toLowerCase()))?.value

const bySlug = (slug: string) => products.find((p) => p.slug === slug)
const bySlugs = (slugs: string[]) => slugs.map(bySlug).filter((p): p is Product => !!p)

/** Первое число в строке — чтобы сравнивать модели между собой по реальной цифре. */
const firstNumber = (value?: string) => {
  if (!value) return null
  const m = value.replace(/\s/g, '').match(/(\d+(?:[.,]\d+)?)/)
  return m ? Number(m[1].replace(',', '.')) : null
}

/** Градация круга (T10…T160) из модели товара. */
const padGrade = (p: Product) => {
  const m = p.model.match(/T(\d{2,3})/)
  return m ? Number(m[1]) : null
}

/*
 * Порядок проверок важен: у ES516/ES700 kind — «Эксцентриковая
 * шлифовальная машинка», и если сначала спросить про эксцентрик, шлифовалка
 * будет описана как полировальная DA и получит подложку не своей серии.
 * Поэтому «шлифовальная» проверяется первой, а гибкий вал (MPK-3) вынесен
 * отдельно — он не роторная машинка и не аккумуляторная.
 */
const isSanderLike = (p: Product) => /шлифов/i.test(p.kind)
const isShaftLike = (p: Product) => /гибкий вал/i.test(p.kind)
const isRotaryLike = (p: Product) => !isSanderLike(p) && /роторн/i.test(p.kind)
const isOrbitalLike = (p: Product) => !isSanderLike(p) && /эксцентриков/i.test(p.kind)

/* ─────────────────────────── История: машинки ─────────────────────────── */

function machinePurpose(p: Product): ProductStory['purpose'] {
  const orbit = specValue(p, 'Ход эксцентрика')
  const speed = specValue(p, 'Обороты')
  const power = specValue(p, 'Мощность')
  const platform = specValue(p, 'Платформа')

  const points: string[] = []
  if (orbit) points.push(`Ход эксцентрика ${orbit} — определяет, насколько агрессивно машинка снимает лак`)
  if (speed) points.push(`Рабочий диапазон ${speed} — нижние обороты под пасту, верхние под съём`)
  if (power) points.push(`Мощность ${power} — запас, чтобы обороты не проседали под нажимом`)
  if (platform) points.push(`Аккумуляторная платформа ${platform} — работа без кабеля и удлинителей`)

  if (isRotaryLike(p)) {
    return {
      title: 'Прямой привод — предсказуемый съём',
      body:
        'Роторная машинка вращает круг по одной оси: пятно контакта работает постоянно, поэтому съём идёт быстро и ровно там, куда её ведут. Это инструмент коррекции — им снимают следы шлифовки, глубокие царапины и сильное окисление, где эксцентрик работал бы слишком долго.',
      points,
    }
  }
  if (isOrbitalLike(p)) {
    return {
      title: 'Эксцентрик — коррекция без риска пережога',
      body:
        'Круг одновременно вращается и ходит по орбите, поэтому одна и та же точка лака не греется постоянно. Машинка прощает ошибку по нажиму и углу — ей работают по всему кузову, включая тонкий лак и участки, где ротор пережёг бы покрытие.',
      points,
    }
  }
  if (isSanderLike(p)) {
    return {
      title: 'Подготовка поверхности до полировки',
      body:
        'Шлифовальная машинка снимает то, что полировкой не убрать: перелив краски, апельсиновую корку, грубые дефекты после покраски. После неё поверхность уходит на коррекцию — след от диска выводится пастой и кругом соответствующей градации.',
      points,
    }
  }
  if (isShaftLike(p)) {
    return {
      title: 'Доступ туда, куда не заходит круг',
      body:
        'Гибкий вал выносит рабочую насадку вперёд и позволяет работать в местах, где полноразмерная машинка просто не встанет: кромки, стойки, рельеф, зоны у ручек. Основную площадь по-прежнему закрывает обычная машинка — это дополнение к ней, а не замена.',
      points,
    }
  }
  return {
    title: 'Работа без кабеля',
    body:
      'Аккумуляторное исполнение снимает главное ограничение выездной работы — розетку рядом. Тот же процесс полировки, но машинка не тянет за собой провод по свежевымытому кузову и не ограничивает радиус.',
    points,
  }
}

/**
 * Сцены для машинки. Каждая привязана к РЕАЛЬНОЙ характеристике из прайса:
 * нет характеристики — нет сцены. Поэтому у EP830 появляется блок про
 * бесщёточный двигатель (это есть в kind), а у EP801 G2 — нет.
 */
function machineScenes(p: Product): StoryScene[] {
  const scenes: StoryScene[] = []
  const speed = specValue(p, 'Обороты')
  const orbit = specValue(p, 'Ход эксцентрика')
  const power = specValue(p, 'Мощность')
  const plate = specValue(p, 'Подложка') ?? specValue(p, 'Подложки')
  const platform = specValue(p, 'Платформа')
  const cable = specValue(p, 'Кабель')

  if (/бесщёточн|brushless/i.test(p.kind + p.lead)) {
    scenes.push({
      title: 'Бесщёточный двигатель',
      body:
        'Нет щёток — нет расходника, который стирается и меняется. Двигатель ровнее держит момент под нагрузкой и меньше греется на долгой смене, а обслуживание сводится к чистке.',
      image: p.image,
    })
  }

  if (speed) {
    scenes.push({
      title: 'Диапазон под задачу, а не одна скорость',
      body:
        'Нижние обороты — разгон пасты и работа по кромкам, где важно не сжечь лак. Верхние — съём и вывод глянца на плоскостях. Регулятор позволяет держать одну и ту же скорость всю смену, а не подбирать её заново на каждой панели.',
      metric: { value: speed, caption: 'Рабочий диапазон' },
    })
  }

  if (orbit) {
    scenes.push({
      title: 'Ход эксцентрика решает, как быстро идёт съём',
      body:
        'Чем больше ход, тем больше площадь за проход и тем агрессивнее коррекция. Малый ход точнее ведёт себя на рельефе и мелких деталях, большой — быстрее закрывает капот и крышу.',
      metric: { value: orbit, caption: 'Ход эксцентрика' },
    })
  }

  if (power) {
    scenes.push({
      title: 'Запас мощности, а не паспортная цифра',
      body:
        'Важна не сама мощность, а то, что обороты не проваливаются, когда мастер добавляет нажим на тяжёлом участке. Запас по пиковому значению как раз для таких моментов.',
      metric: { value: power, caption: 'Мощность' },
    })
  }

  if (platform) {
    scenes.push({
      title: 'Одна аккумуляторная платформа на линейку',
      body:
        'Аккумулятор и зарядное общие для всех машинок этой платформы: докупается инструмент, а не новый комплект питания. Чип в батарее и в машинке согласуют режим заряда между собой.',
      metric: { value: platform, caption: 'Платформа' },
    })
  }

  if (plate) {
    scenes.push({
      title: 'Подложка — часть машинки, а не мелочь',
      body:
        'Диаметр и резьба заданы конструкцией: подложка не по размеру рвёт баланс на оборотах и добавляет вибрацию в кисть. В каталоге подложки разведены по типам машинок именно поэтому.',
      metric: { value: plate, caption: 'Штатная подложка' },
    })
  }

  if (cable) {
    scenes.push({
      title: 'Длина кабеля под реальный бокс',
      body:
        'Кабель рассчитан так, чтобы обойти автомобиль по кругу от одной розетки и не тянуть удлинитель через пост.',
      metric: { value: cable, caption: 'Кабель' },
    })
  }

  return scenes
}

/** Позиция модели внутри своей категории по реальной цифре из прайса. */
function machineScale(p: Product): CutScale | undefined {
  const family = productsByCategory(p.category)
  if (family.length < 2) return undefined

  const metricLabel = specValue(p, 'Ход эксцентрика') ? 'Ход эксцентрика' : 'Обороты'
  const scored = family
    .map((item) => ({ item, n: firstNumber(specValue(item, metricLabel)) }))
    .filter((x): x is { item: Product; n: number } => x.n !== null)
  if (scored.length < 2) return undefined

  scored.sort((a, b) => a.n - b.n)
  return {
    caption:
      metricLabel === 'Ход эксцентрика'
        ? 'Ход эксцентрика в линейке — от точной работы к быстрому съёму'
        : 'Обороты в линейке — от мягкой работы к производительной',
    steps: scored.map(({ item, n }) => ({
      label: item.model,
      note: `${n}${metricLabel === 'Ход эксцентрика' ? ' мм' : ' об/мин'}`,
      active: item.slug === p.slug,
    })),
  }
}

/** Совместимость машинки — реальные товары каталога, подобранные по типу привода. */
function machineCompat(p: Product): CompatGroup[] {
  const plateSlug = isOrbitalLike(p)
    ? 'plates-da'
    : isSanderLike(p)
      ? 'plates-sander'
      : 'plates-rotary'

  const groups: CompatGroup[] = []

  const plate = bySlug(plateSlug)
  if (plate) {
    groups.push({
      title: 'Подложка',
      note: 'Под тип привода и резьбу этой машинки',
      items: [plate],
    })
  }

  if (isShaftLike(p)) {
    // Гибкому валу штатно нужны насадки для точечной работы, а не
    // полноразмерные круги.
    groups.push({
      title: 'Насадки',
      note: 'Под точечную работу с гибким валом',
      items: bySlugs(['spot-pads', 'adaptors-shafts']),
    })
  } else if (!isSanderLike(p)) {
    groups.push({
      title: 'Круги по стадиям',
      note: 'От тяжёлой коррекции к финишу — по таблице применения',
      items: bySlugs([
        'wool-short-nap',
        'foam-diamond-t80',
        'foam-diamond-t40',
        'foam-diamond-t10',
      ]),
    })
    groups.push({
      title: 'Пасты V-Range',
      note: 'Линейка рассчитана под те же круги',
      items: bySlugs(['v80-heavy-cut', 'v40-medium-polish', 'v20-final-finish']),
    })
  }

  if (p.category === 'cordless') {
    groups.push({
      title: 'Питание',
      note: 'Аккумулятор и зарядное той же платформы',
      items: bySlugs(['battery-18v', 'battery-108v', 'chargers']),
    })
  }

  return groups.filter((g) => g.items.length > 0)
}

/* ──────────────────────────── История: круги ──────────────────────────── */

const GRADE_STAGE: { max: number; stageIndex: number }[] = [
  { max: 30, stageIndex: 3 },
  { max: 70, stageIndex: 2 },
  { max: 200, stageIndex: 1 },
]

function padStageIndex(p: Product): number | null {
  const g = padGrade(p)
  if (g === null) return /шерст/i.test(p.kind) ? 1 : null
  return GRADE_STAGE.find((r) => g <= r.max)?.stageIndex ?? 1
}

function padPurpose(p: Product): ProductStory['purpose'] {
  const stage = padStageIndex(p)
  const st = stage !== null ? POLISH_STAGES[stage] : null
  const material = /шерст/i.test(p.kind)
    ? 'Шерсть'
    : /микрофибр/i.test(p.kind)
      ? 'Микрофибра'
      : 'Поролон'

  const points = [
    `Материал: ${material.toLowerCase()}`,
    ...(st ? [`Стадия обработки: ${st.title.toLowerCase()}`] : []),
    ...(st ? [`Работает с пастой: ${st.paste}`] : []),
    `Диаметры: ${specValue(p, 'Диаметры') ?? p.variants.map((v) => v.label).join(' · ')}`,
  ]

  return {
    title: st ? `Круг для стадии «${st.title}»` : 'Круг под конкретный этап',
    body: st
      ? `${p.lead} На этой стадии выводят: ${st.defects.join(', ').toLowerCase()}.`
      : p.lead,
    points,
  }
}

function padScenes(p: Product): StoryScene[] {
  const scenes: StoryScene[] = []
  const grade = padGrade(p)
  const stage = padStageIndex(p)

  if (/black diamond/i.test(p.model)) {
    scenes.push({
      title: 'Рельеф «алмазная грань»',
      body:
        'Гранёная поверхность уменьшает разбрызгивание пасты и держит форму под нагревом. Пятно контакта остаётся ровным дольше, поэтому меньше голограмм и меньше переделок за смену.',
      image: p.image,
    })
  }

  if (/flat-face/i.test(p.model)) {
    scenes.push({
      title: 'Ровное пятно контакта',
      body:
        'Плоская рабочая поверхность даёт одинаковое давление по всей площади круга — предсказуемый результат на плоскостях и повторяемость от панели к панели.',
      image: p.image,
    })
  }

  if (/шерст/i.test(p.kind)) {
    scenes.push({
      title: 'Шерсть режет быстрее и греет меньше',
      body:
        'Ворс снимает лак агрессивнее поролона и при этом хуже держит тепло в пятне контакта — на тяжёлой коррекции это меньше риска для покрытия.',
      image: p.image,
    })
  }

  if (/микрофибр/i.test(p.kind)) {
    scenes.push({
      title: 'Рез шерсти — чистота поролона',
      body:
        'Микрофибра снимает почти как шерсть, но оставляет заметно более чистую поверхность: часто это позволяет закрыть коррекцию и финиш меньшим числом проходов.',
      image: p.image,
    })
  }

  if (grade !== null) {
    scenes.push({
      title: 'Что означает градация',
      body:
        'Цифра в названии — жёсткость и агрессивность круга: чем она выше, тем больше съём и грубее след, чем ниже — тем мягче работа и чище глянец. Посадочный размер при этом не меняется, поэтому в рамках одной машинки круги переставляются без подбора подложки.',
      metric: { value: `T${grade}`, caption: 'Градация' },
    })
  }

  if (stage !== null) {
    const st = POLISH_STAGES[stage]
    scenes.push({
      title: 'Место в цикле обработки',
      body: `${st.goal}. Именно на этой стадии круг работает штатно — раньше он не даст съёма, позже начнёт оставлять свой след.`,
      metric: { value: st.title, caption: `Стадия ${st.index}` },
    })
  }

  return scenes
}

function padScale(p: Product): CutScale | undefined {
  const stage = padStageIndex(p)
  if (stage === null) return undefined
  return {
    caption: 'Место круга в цикле — от снятия дефектов к чистому глянцу',
    steps: POLISH_STAGES.map((st, i) => ({
      label: st.title,
      note: st.paste.split('·')[0].trim(),
      active: i === stage,
    })),
  }
}

/**
 * Шкала градаций кругов, построенная по РЕАЛЬНОМУ составу каталога:
 * берутся все круги, у которых в названии есть градация T…, дедуплицируются
 * по числу и сортируются по возрастанию жёсткости. Никаких «процентов
 * реза» — их в исходных данных нет, и придумывать их нельзя.
 */
function padGradeScale(p: Product): CutScale | undefined {
  const grade = padGrade(p)
  if (grade === null) return undefined
  const byGrade = new Map<number, Product>()
  for (const item of productsByCategory('pads')) {
    const g = padGrade(item)
    if (g === null) continue
    if (!byGrade.has(g)) byGrade.set(g, item)
  }
  const steps = [...byGrade.entries()].sort((a, b) => a[0] - b[0])
  if (steps.length < 3) return undefined
  return {
    caption: 'Градация — от чистого финиша к тяжёлому резу',
    steps: steps.map(([g, item]) => ({
      label: `T${g}`,
      note: item.kind.replace(/^.*?круг,?\s*/i, '') || item.kind,
      active: g === grade,
    })),
  }
}

function padCompat(p: Product): CompatGroup[] {
  // Конусы и шарики ставятся на гибкий вал, а не на полноразмерную
  // машинку — им и подложка не нужна.
  if (/гибкий вал|конус/i.test(p.kind)) {
    return [
      {
        title: 'С чем работает',
        note: 'Хвостовик 3 мм под гибкий вал',
        items: bySlugs(['mpk-3', 'adaptors-shafts', 'ep804']),
      },
    ].filter((g) => g.items.length > 0)
  }

  const stage = padStageIndex(p)
  const st = stage !== null ? POLISH_STAGES[stage] : null

  const pasteSlug = st
    ? st.paste.includes('V80')
      ? ['v80-heavy-cut', 'v82-fast-polish']
      : st.paste.includes('V40')
        ? ['v40-medium-polish']
        : st.paste.includes('V20')
          ? ['v20-final-finish']
          : []
    : []

  const groups: CompatGroup[] = []
  if (pasteSlug.length) {
    groups.push({
      title: 'Паста для этой стадии',
      note: 'По таблице применения ShineMate',
      items: bySlugs(pasteSlug),
    })
  }
  groups.push({
    title: 'Подложки',
    note: 'Посадка под ротор и эксцентрик',
    items: bySlugs(['plates-rotary', 'plates-da']),
  })
  groups.push({
    title: 'Машинки',
    note: 'С чем этот круг обычно работает',
    items: /микрофибр/i.test(p.kind)
      ? bySlugs(['ex620', 'ex605'])
      : bySlugs(['ep820', 'ex620']),
  })
  return groups.filter((g) => g.items.length > 0)
}

/* ──────────────────────────── История: пасты ──────────────────────────── */

const COMPOUND_STAGE: Record<string, number> = {
  'v80-heavy-cut': 1,
  'v82-fast-polish': 1,
  'v40-medium-polish': 2,
  'v20-final-finish': 3,
}

function compoundPurpose(p: Product): ProductStory['purpose'] {
  const stage = COMPOUND_STAGE[p.slug]
  const st = stage !== undefined ? POLISH_STAGES[stage] : null
  return {
    title: st ? `Паста стадии «${st.title}»` : 'Паста линейки V-Range',
    body: st
      ? `${p.lead} Что выводится на этой стадии: ${st.defects.join(', ').toLowerCase()}.`
      : p.lead,
    points: [
      ...(st ? [`Стадия обработки: ${st.title.toLowerCase()}`] : []),
      ...(st ? [`Круги этой стадии: ${st.pads.map((x) => `${x.kind} ${x.grade}`).join('; ')}`] : []),
      `Объём: ${specValue(p, 'Объём') ?? p.variants[0]?.label ?? '500 мл'}`,
    ],
  }
}

function compoundScenes(p: Product): StoryScene[] {
  const stage = COMPOUND_STAGE[p.slug]
  const scenes: StoryScene[] = []

  scenes.push({
    title: 'Что делает состав',
    body: p.lead,
    image: p.image,
  })

  if (stage !== undefined) {
    const st = POLISH_STAGES[stage]
    scenes.push({
      title: 'С какими кругами работает',
      body: `Паста рассчитана на круги своей стадии: ${st.pads
        .map((x) => `${x.kind.toLowerCase()} ${x.grade}`)
        .join('; ')}. Связка «паста + круг» и определяет результат — по отдельности ни то, ни другое не даёт предсказуемого съёма.`,
      metric: { value: st.title, caption: `Стадия ${st.index}` },
    })
    scenes.push({
      title: 'Какие дефекты закрывает',
      body: `${st.goal}: ${st.defects.join(', ').toLowerCase()}. Если дефект глубже — сначала отрабатывает предыдущая стадия, иначе паста просто «замыливает» его вместо снятия.`,
    })
  }

  return scenes
}

function compoundScale(p: Product): CutScale | undefined {
  const stage = COMPOUND_STAGE[p.slug]
  if (stage === undefined) return undefined
  const order = ['v80-heavy-cut', 'v82-fast-polish', 'v40-medium-polish', 'v20-final-finish']
  const line = bySlugs(order)
  if (!line.length) return undefined
  return {
    caption: 'Линейка V-Range — от тяжёлого реза к финишу',
    steps: line.map((item) => ({
      label: item.model.replace(/\s.*/, ''),
      note: item.model.split(' ').slice(1).join(' '),
      active: item.slug === p.slug,
    })),
  }
}

function compoundCompat(p: Product): CompatGroup[] {
  const stage = COMPOUND_STAGE[p.slug]
  const padsForStage: Record<number, string[]> = {
    1: ['wool-short-nap', 'foam-diamond-t120', 'foam-diamond-t80'],
    2: ['foam-diamond-t60', 'foam-diamond-t40', 'microfiber-t100'],
    3: ['foam-diamond-t10', 'foam-flat-t10', 'microfiber-t20'],
  }
  const groups: CompatGroup[] = []
  const padSlugs = stage !== undefined ? padsForStage[stage] : undefined
  if (padSlugs) {
    groups.push({
      title: 'Круги под эту пасту',
      note: 'Та же стадия обработки',
      items: bySlugs(padSlugs),
    })
  }
  groups.push({
    title: 'Остальная линейка',
    note: 'Соседние стадии цикла',
    items: productsByCategory('chemistry').filter((x) => x.slug !== p.slug),
  })
  return groups.filter((g) => g.items.length > 0)
}

/* ─────────────────── История: подложки и аксессуары ─────────────────── */

function simplePurpose(p: Product): ProductStory['purpose'] {
  return {
    title: p.kind,
    body: p.lead,
    points: p.specs.map((s) => `${s.label}: ${s.value}`),
  }
}

/**
 * Сцены для позиций без «крупных» характеристик машинки — подложек,
 * аккумуляторов, зарядных и оснастки рабочего места.
 *
 * Тексты объясняют, почему конкретная характеристика важна в работе, и
 * появляются ТОЛЬКО если сама характеристика есть в прайсе. Ничего
 * общего-декоративного «чтобы блок не пустовал» здесь не генерируется:
 * если у позиции нет ни одной из перечисленных характеристик, сцен не
 * будет вовсе и страница останется честно компактной.
 */
const SPEC_SCENES: { match: RegExp; valueMatch?: RegExp; title: string; body: string }[] = [
  {
    match: /резьба/i,
    title: 'Резьба должна совпадать с машинкой',
    body:
      'Посадка — это не «подойдёт любая»: у роторных машинок M14, у эксцентриковых M8 и 5/16"-24. Неверная резьба либо не встанет, либо будет работать с биением.',
  },
  {
    match: /диаметр/i,
    title: 'Диаметр задаёт баланс на оборотах',
    body:
      'Подложка не по размеру круга рвёт баланс: появляется вибрация в кисть и неравномерный съём. Поэтому диаметры разведены по типам машинок, а не даются «универсальным» набором.',
  },
  {
    match: /^ёмкость$/i,
    title: 'Ёмкость — это время до подзарядки',
    body:
      'Чем выше ёмкость, тем дольше машинка работает без паузы. На выезде обычно держат два блока: один в работе, второй на зарядном.',
  },
  {
    match: /напряжение|платформа/i,
    title: 'Одно напряжение — одна платформа',
    body:
      'Аккумулятор подходит ко всем машинкам своего напряжения: докупается инструмент, а не новый комплект питания. Чип в батарее и в машинке согласуют режим заряда между собой.',
  },
  {
    match: /выход|вход/i,
    title: 'Питание от обычной сети',
    body:
      'Зарядное рассчитано на стандартную сеть, поэтому пост не требует отдельной подготовки — блок ставится там, где есть розетка.',
  },
  {
    match: /крепление/i,
    // Иначе правило цепляло «Крепление: липучка» у подложек и выдавало
    // на их странице текст про настенный держатель.
    valueMatch: /стен|панел|кронштейн/i,
    title: 'У инструмента своё место',
    body:
      'Машинка на держателе не лежит на крыле и не падает с тележки: меньше риска и для покрытия, и для самого инструмента.',
  },
]

function specScenes(p: Product, max = 3): StoryScene[] {
  const used = new Set<string>()
  const out: StoryScene[] = []
  for (const spec of p.specs) {
    const rule = SPEC_SCENES.find(
      (r) => r.match.test(spec.label) && (!r.valueMatch || r.valueMatch.test(spec.value)),
    )
    if (!rule || used.has(rule.title)) continue
    used.add(rule.title)
    out.push({
      title: rule.title,
      body: rule.body,
      metric: { value: spec.value, caption: spec.label },
    })
    if (out.length >= max) break
  }
  return out
}

function plateCompat(p: Product): CompatGroup[] {
  const machines = /роторн/i.test(p.model)
    ? bySlugs(['ep820', 'ep801-g2', 'ep830'])
    : /эксцентриков/i.test(p.model)
      ? bySlugs(['ex620', 'ex605', 'ero600-g2'])
      : /шлифоваль/i.test(p.model)
        ? bySlugs(['es516', 'es700'])
        : []

  const groups: CompatGroup[] = []
  if (machines.length) {
    groups.push({ title: 'Машинки', note: 'Под эту посадку и резьбу', items: machines })
  }
  groups.push({
    title: 'Круги',
    note: 'Что ставится на эту подложку',
    items: bySlugs(['foam-diamond-t80', 'foam-diamond-t40', 'wool-short-nap']),
  })
  return groups.filter((g) => g.items.length > 0)
}

function accessoryCompat(p: Product): CompatGroup[] {
  const related = productsByCategory(p.category).filter((x) => x.slug !== p.slug)
  return related.length
    ? [{ title: 'Рабочее место', note: 'Остальное из этого раздела', items: related.slice(0, 3) }]
    : []
}

/* ───────────────── Ключевые характеристики крупным планом ───────────────── */

/**
 * Порядок важности характеристик для editorial-блока под hero.
 *
 * Клиент отдельно просил: главные параметры — крупными значениями, а не
 * строкой в таблице (таблица остаётся ниже, целиком). Список ранжирует
 * реальные метки из прайса; берутся ПЕРВЫЕ ЧЕТЫРЕ существующие у товара,
 * ничего не добирается «для красоты», если характеристик меньше.
 */
const HIGHLIGHT_ORDER = [
  'Обороты',
  'Ход эксцентрика',
  'Ход',
  'Мощность',
  'Платформа',
  'Напряжение',
  'Ёмкость',
  'Подложка',
  'Подложки',
  'Градация',
  'Диаметры',
  'Объём',
  'Резьба',
  'Толщина',
  'Хвостовик',
  'Кабель',
  'Тип',
  'Крепление',
]

function highlights(p: Product): { label: string; value: string }[] {
  const out: { label: string; value: string }[] = []
  for (const label of HIGHLIGHT_ORDER) {
    const spec = p.specs.find((s) => s.label === label)
    if (spec) out.push(spec)
    if (out.length === 4) break
  }
  // Позиция может быть описана метками вне списка (например, «Совместимость»
  // у адаптеров) — тогда добираем по порядку из прайса, но не выдумываем.
  if (out.length < 3) {
    for (const spec of p.specs) {
      if (out.length === 4) break
      if (!out.some((s) => s.label === spec.label)) out.push(spec)
    }
  }
  return out
}

/** Все реальные кадры позиции без повторов: фото товара + фото исполнений. */
function gallery(p: Product): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const src of [p.image, ...p.variants.map((v) => v.image)]) {
    if (!src || seen.has(src)) continue
    seen.add(src)
    out.push(src)
  }
  return out
}

/* ───────────────────────── Сравнение с соседями ───────────────────────── */

/** Метки, по которым осмысленно сравнивать модели одного раздела. */
const COMPARE_LABELS = [
  'Ход эксцентрика',
  'Обороты',
  'Мощность',
  'Подложка',
  'Платформа',
  'Кабель',
  'Градация',
  'Толщина',
  'Диаметры',
  'Объём',
  'Резьба',
]

function comparison(p: Product): ComparisonTable | undefined {
  const family = productsByCategory(p.category)
  if (family.length < 2) return undefined

  // Колонка попадает в таблицу, только если значение есть минимум у двух
  // моделей раздела — иначе получилась бы таблица из прочерков.
  const columns = COMPARE_LABELS.filter(
    (label) => family.filter((item) => item.specs.some((s) => s.label === label)).length >= 2,
  ).slice(0, 4)
  if (!columns.length) return undefined

  // Максимум пять строк: сама модель плюс ближайшие соседи по цене — так
  // сравнение остаётся читаемым и на мобильном, и в разделе из 19 позиций.
  const price = (item: Product) => Math.min(...item.variants.map((v) => v.rrp))
  const own = price(p)
  const rows = [p, ...family.filter((x) => x.slug !== p.slug).sort((a, b) => Math.abs(price(a) - own) - Math.abs(price(b) - own)).slice(0, 4)]
    .sort((a, b) => price(a) - price(b))
    .map((item) => ({
      slug: item.slug,
      href: `catalog/${item.category}/${item.slug}`,
      model: item.model,
      kind: item.kind,
      image: item.image,
      values: columns.map((label) => item.specs.find((s) => s.label === label)?.value ?? null),
      active: item.slug === p.slug,
    }))

  if (rows.length < 2) return undefined
  return { caption: `${categoryTitle(p.category)} — чем модели отличаются`, columns, rows }
}

/* ──────────────────────── Связка «система ShineMate» ──────────────────────── */

/**
 * Собирает цепочку машинка → подложка → круг → паста вокруг текущей
 * позиции. Все четыре шага — реальные товары каталога; шаг, которым
 * является сам товар, помечается active. Если какого-то звена в каталоге
 * нет, цепочка просто короче — заглушек не появляется.
 */
function systemChain(p: Product): SystemChain | undefined {
  const kind = storyKind(p)
  if (kind === 'accessory') return undefined

  // Для не-машинок нужна модель-представитель: у подложки её задаёт
  // собственное название (роторная/эксцентриковая), у круга и пасты —
  // эксцентриковая машинка как самый ходовой инструмент линейки.
  const machine =
    kind === 'machine'
      ? p
      : kind === 'plate' && /роторн/i.test(p.model)
        ? bySlug('ep820')
        : kind === 'plate' && /шлифоваль/i.test(p.model)
          ? bySlug('es516')
          : bySlug('ex620')
  const plate =
    kind === 'plate'
      ? p
      : bySlug(
          kind === 'machine'
            ? isOrbitalLike(p)
              ? 'plates-da'
              : isSanderLike(p)
                ? 'plates-sander'
                : 'plates-rotary'
            : 'plates-da',
        )
  const pad =
    kind === 'pad'
      ? p
      : (() => {
          const stage = kind === 'compound' ? COMPOUND_STAGE[p.slug] : undefined
          const bySt: Record<number, string> = {
            1: 'foam-diamond-t80',
            2: 'foam-diamond-t40',
            3: 'foam-diamond-t10',
          }
          return bySlug(stage !== undefined ? (bySt[stage] ?? 'foam-diamond-t40') : 'foam-diamond-t40')
        })()
  const compound =
    kind === 'compound'
      ? p
      : (() => {
          const stage = kind === 'pad' ? padStageIndex(p) : null
          const bySt: Record<number, string> = {
            1: 'v80-heavy-cut',
            2: 'v40-medium-polish',
            3: 'v20-final-finish',
          }
          return bySlug(stage !== null ? (bySt[stage] ?? 'v40-medium-polish') : 'v40-medium-polish')
        })()

  const steps: SystemChain['steps'] = []
  const push = (role: string, product: Product | undefined, note: string) => {
    if (product) steps.push({ role, product, note, active: product.slug === p.slug })
  }
  push('01 · Машинка', machine, 'Задаёт тип привода и скорость съёма')
  push('02 · Подложка', plate, 'Резьба и диаметр под эту машинку')
  push('03 · Круг', pad, 'Определяет агрессивность на этой стадии')
  push('04 · Паста', compound, 'Работает в паре с кругом своей стадии')

  if (steps.length < 3) return undefined
  return {
    caption: 'Связка, в которой работает эта позиция',
    note:
      'Результат даёт не отдельный инструмент, а сочетание: привод, посадка, круг и состав рассчитаны друг под друга внутри одной линейки.',
    steps,
  }
}

/* ─────────────────────────────── Сборка ─────────────────────────────── */

export type StoryKind = 'machine' | 'pad' | 'compound' | 'plate' | 'accessory'

export function storyKind(p: Product): StoryKind {
  if (['rotary', 'da', 'sander', 'cordless'].includes(p.category)) return 'machine'
  if (p.category === 'pads') return 'pad'
  if (p.category === 'chemistry') return 'compound'
  if (p.category === 'plates') return 'plate'
  return 'accessory'
}

/**
 * Единая точка входа: по товару собирается его история. Один и тот же
 * рендер обслуживает все 113 позиций — отдельных страниц руками не
 * создаётся, глубина story подстраивается под то, сколько реальных
 * данных есть у конкретной позиции.
 */
export function buildStory(p: Product): ProductStory {
  const core = buildCore(p)
  return {
    ...core,
    highlights: highlights(p),
    gallery: gallery(p),
    photos: storyPhotos(p),
    process: machineProcess(p),
  }
}

/**
 * Полный цикл обработки на странице машинки.
 *
 * У круга и пасты есть СВОЯ стадия — им показывается шкала (ScaleSection).
 * Машинкой же проходят весь цикл, поэтому здесь честнее показать все
 * четыре стадии целиком: что снимается, какой пастой и каким кругом.
 * Данные — та же официальная «Таблица применения», что и на странице
 * «Технологии», один массив на весь сайт.
 */
function machineProcess(p: Product): ProductStory['process'] {
  if (storyKind(p) !== 'machine') return undefined
  // Аккумуляторы, зарядные и прочая обвязка полировкой не занимаются.
  if (!/машинка|полировк|шлифов|вал/i.test(p.kind)) return undefined
  const sander = isSanderLike(p)
  return {
    caption: sander ? 'Где машинка стоит в цикле обработки' : 'Полный цикл обработки этой машинкой',
    note: sander
      ? 'Шлифование — первая стадия: после неё поверхность уходит на коррекцию и финиш полировальными машинками.'
      : 'От снятия грубых дефектов до чистого глянца. На каждой стадии — своя паста и своя градация круга.',
    stages: POLISH_STAGES,
  }
}

type StoryCore = Omit<ProductStory, 'highlights' | 'gallery' | 'photos' | 'process'>

function buildCore(p: Product): StoryCore {
  switch (storyKind(p)) {
    case 'machine': {
      // У аккумуляторов и зарядных нет оборотов/хода/мощности — для них
      // сцены собираются из их собственных характеристик.
      const scenes = machineScenes(p).length ? machineScenes(p) : specScenes(p)
      // История должна открываться кадром товара, а не сразу цифрой:
      // если ни у одной сцены нет своей иллюстрации, отдаём первой
      // сцене фото позиции (у товара оно ровно одно, дублировать его в
      // нескольких сценах смысла нет).
      if (scenes.length && !scenes.some((s) => s.image)) {
        scenes[0] = { ...scenes[0], image: p.image }
      }
      return {
        purpose: machinePurpose(p),
        scenes,
        scale: machineScale(p),
        comparison: comparison(p),
        chain: systemChain(p),
        compat: machineCompat(p),
      }
    }
    case 'pad':
      return {
        purpose: padPurpose(p),
        scenes: padScenes(p),
        scale: padScale(p),
        grades: padGradeScale(p),
        comparison: comparison(p),
        chain: systemChain(p),
        compat: padCompat(p),
      }
    case 'compound':
      return {
        purpose: compoundPurpose(p),
        scenes: compoundScenes(p),
        scale: compoundScale(p),
        comparison: comparison(p),
        chain: systemChain(p),
        compat: compoundCompat(p),
      }
    case 'plate':
      return {
        purpose: simplePurpose(p),
        scenes: specScenes(p),
        comparison: comparison(p),
        chain: systemChain(p),
        compat: plateCompat(p),
      }
    default:
      return {
        purpose: simplePurpose(p),
        scenes: specScenes(p, 2),
        comparison: comparison(p),
        compat: accessoryCompat(p),
      }
  }
}

/** Подпись раздела в хлебных крошках и заголовке story. */
export const storyKindLabel = (p: Product) => categoryTitle(p.category)

/* ─────────────────── Реальные съёмочные кадры ShineMate ─────────────────── */

/**
 * Официальные фотографии ShineMate с их же продуктовых страниц — товар в
 * работе, а не рендер на белом фоне. Отобраны вручную по одному критерию:
 * на кадре НЕТ вшитого английского маркетингового текста (надписи на
 * этикетках самих флаконов — это упаковка товара, а не наш перевод).
 * Кадры с текстом либо обрезаны по границе фотографии, либо не взяты.
 *
 * Ключ — либо slug конкретной модели (у машинок свой кадр), либо общая
 * сцена раздела (круги, пасты). Размеры — реальные размеры файлов в
 * public/catalog-media/scene, чтобы браузер не пересчитывал раскладку
 * после загрузки.
 */
const SCENE_SIZES: Record<string, [number, number]> = {
  'compound-apply': [746, 586],
  'eb210-kit': [1155, 650],
  'eb251-5': [1155, 650],
  eb350: [1155, 650],
  eb351: [1155, 650],
  'ep801-g2': [1155, 650],
  ep804: [1150, 650],
  ep820: [1155, 650],
  'ero600-g2': [1155, 650],
  es516: [1155, 650],
  es550: [1155, 650],
  es700: [960, 1010],
  ex603: [1155, 650],
  ex605: [1155, 650],
  ex620: [1155, 650],
  'mpk-3': [1155, 650],
  'pad-workshop': [776, 781],
  'tool-cart': [851, 581],
  'eb212-eb213': [790, 960],
  'battery-18v': [1400, 860],
  'battery-108v': [1400, 860],
  chargers: [1400, 820],
  'polisher-holders': [870, 645],
  'tool-bags': [770, 620],
  'wash-kit': [870, 670],
  'eb200a-eb201a': [690, 610],
  'v-range': [780, 650],
}

export type StoryPhoto = {
  key: string
  src: string
  srcSmall: string
  width: number
  height: number
  eyebrow: string
  title: string
  body: string
}

function photo(key: string, eyebrow: string, title: string, body: string): StoryPhoto | null {
  const size = SCENE_SIZES[key]
  if (!size) return null
  return {
    key,
    src: `catalog-media/scene/${key}.webp`,
    srcSmall: `catalog-media/scene/${key}-800.webp`,
    width: size[0],
    height: size[1],
    eyebrow,
    title,
    body,
  }
}

/**
 * Подпись к кадру собирается из РЕАЛЬНЫХ характеристик позиции, поэтому
 * у EP820 и EX620 под одинаковой по смыслу фотографией стоят разные
 * цифры и разный текст — страницы не выглядят одинаковыми.
 */
function machinePhoto(p: Product): StoryPhoto | null {
  // Аккумуляторы и зарядные — часть платформы, а не полировальный
  // инструмент: у них своя подпись, иначе под фотографией батареи стоял
  // бы текст про работу по кузову.
  if (p.slug === 'battery-18v' || p.slug === 'battery-108v') {
    return photo(
      p.slug,
      'Платформа',
      'Один аккумулятор на всю линейку своего напряжения',
      `${p.lead} Обычно держат два блока: один в работе, второй на зарядном — тогда смена не останавливается.`,
    )
  }
  if (p.slug === 'chargers') {
    return photo(
      p.slug,
      'Платформа',
      'Зарядное под ту же платформу',
      `${p.lead} Блок ставится там, где есть обычная розетка: отдельная подготовка поста не нужна.`,
    )
  }

  const speed = specValue(p, 'Обороты')
  const orbit = specValue(p, 'Ход эксцентрика')
  const plate = specValue(p, 'Подложка') ?? specValue(p, 'Подложки')
  const platform = specValue(p, 'Платформа')

  if (isShaftLike(p)) {
    return photo(
      p.slug,
      'В работе',
      'Туда, где полноразмерная машинка не встаёт',
      `Вал выносит насадку вперёд: кромки, стойки, рельеф и зоны у ручек обрабатываются без риска задеть соседнюю панель корпусом машинки.${
        speed ? ` Рабочий диапазон — ${speed}.` : ''
      }`,
    )
  }
  if (isSanderLike(p)) {
    return photo(
      p.slug,
      'В работе',
      'Подготовка поверхности до полировки',
      `Шлифование идёт до коррекции: снимается перелив, корка и грубые дефекты, после чего след от диска выводится пастой и кругом своей градации.${
        orbit ? ` Ход — ${orbit}.` : ''
      }`,
    )
  }
  if (platform) {
    return photo(
      p.slug,
      'В работе',
      'Без кабеля — по всему кузову и на выезде',
      `Аккумуляторное исполнение снимает главное ограничение выездной работы: провод не тянется по свежевымытому кузову и не ограничивает радиус.${
        platform ? ` Платформа ${platform}.` : ''
      }${speed ? ` Обороты ${speed}.` : ''}`,
    )
  }
  if (isOrbitalLike(p)) {
    return photo(
      p.slug,
      'В работе',
      'Коррекция по всему кузову, включая тонкий лак',
      `Круг одновременно вращается и ходит по орбите, поэтому одна точка лака не греется постоянно.${
        orbit ? ` Ход эксцентрика ${orbit}.` : ''
      }${speed ? ` Диапазон ${speed}.` : ''}`,
    )
  }
  return photo(
    p.slug,
    'В работе',
    'Съём под контролем на больших плоскостях',
    `Прямой привод держит пятно контакта в работе постоянно — капот и крыша закрываются заметно быстрее, чем эксцентриком.${
      speed ? ` Диапазон ${speed}.` : ''
    }${plate ? ` Штатная подложка ${plate}.` : ''}`,
  )
}

function storyPhotos(p: Product): StoryPhoto[] {
  const kind = storyKind(p)
  const out: (StoryPhoto | null)[] = []

  if (kind === 'machine') {
    out.push(machinePhoto(p))
  } else if (kind === 'compound') {
    out.push(
      photo(
        'compound-apply',
        'Как наносится',
        'Состав работает в паре с кругом',
        'Паста наносится точками на рабочую поверхность круга и разгоняется на низких оборотах. Результат даёт связка «паста + круг»: по отдельности ни то, ни другое не даёт предсказуемого съёма.',
      ),
    )
    out.push(
      photo(
        'v-range',
        'Линейка',
        'Место состава в линейке V-Range',
        'V80 — тяжёлый рез, V82 — рез и финиш за один проход, V40 — средняя коррекция, V20 — финиш. Составы рассчитаны под круги своей стадии и работают и на роторной, и на эксцентриковой машинке.',
      ),
    )
  } else if (kind === 'pad') {
    out.push(
      photo(
        'pad-workshop',
        'В работе',
        'Круг меняется за секунды',
        'Липучка держит круг на подложке и позволяет менять его прямо в процессе — под каждую стадию свой круг, без перестановки оснастки и без пауз на подбор.',
      ),
    )
  } else if (kind === 'accessory') {
    const copy: Record<string, [string, string, string]> = {
      'tool-cart': [
        'В работе',
        'Весь пост полировщика на одной тележке',
        'Машинка, круги по градациям и составы V-Range лежат на своих местах и едут к автомобилю вместе с мастером — вместо того чтобы стоять на полу и на крыле.',
      ],
      'polisher-holders': [
        'В работе',
        'Машинки висят на своих местах',
        'Держатели ставятся на перфопанель или на стену: инструмент не лежит на крыле, не падает с тележки и всегда на виду — видно, что взято и что на месте.',
      ],
      'tool-bags': [
        'Материал',
        'Плотный полиэстер и усиленные швы',
        'Сумка рассчитана на вес машинки, подложек и кругов: усиленное дно и стропы держат комплект, который каждый день ездит на выезд.',
      ],
      'wash-kit': [
        'В работе',
        'Подготовка перед полировкой',
        'Полировка начинается с чистого кузова: то, что не смыли и не сняли микрофиброй, круг втянет в пятно контакта и оставит на лаке.',
      ],
    }
    const c = copy[p.slug]
    if (c) out.push(photo(p.slug, c[0], c[1], c[2]))
  } else if (kind === 'plate') {
    out.push(
      photo(
        'pad-workshop',
        'В работе',
        'Подложка — то, через что круг держится на машинке',
        'Диаметр и резьба заданы конструкцией машинки: на правильной подложке круг садится ровно, не бьёт на оборотах и меняется одним движением.',
      ),
    )
  }

  return out.filter((x): x is StoryPhoto => x !== null)
}
