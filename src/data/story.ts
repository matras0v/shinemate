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

/**
 * Техническая схема сцены.
 *
 * Схемы показывают ПРИНЦИП (движение рабочей поверхности, диапазон,
 * посадку, поток энергии), а не внутреннее устройство: официальных
 * разрезов и CAD у ShineMate в открытом доступе нет, и придумывать
 * редуктор с обмоткой мы не имеем права. Все числа — из прайса.
 */
export type SceneDiagram =
  | { kind: 'rotary'; rpm?: string }
  | { kind: 'orbit'; orbit?: string }
  | { kind: 'speed'; min: number; max: number; unit: string }
  | { kind: 'power'; rated: number; peak?: number; unit: string; family?: { model: string; watts: number }[]; model?: string }
  | { kind: 'mount'; items: { src: string; label: string; note: string }[] }
  | { kind: 'battery'; platform: string; capacity?: string }
  | { kind: 'cut'; grades: number[]; active: number }
  | { kind: 'stroke'; items: { model: string; mm: number }[]; activeModel: string }
  | { kind: 'sizes'; items: { label: string; note: string; mm: number }[] }
  /*
   * Из чего собран круг — общий принцип конструкции (рабочая поверхность
   * → тело круга → крепление Velcro), а не разрез конкретной модели:
   * точной раскладки слоёв и толщин каждого слоя в прайсе нет.
   */
  | { kind: 'layers'; items: { label: string; note: string }[] }
  /*
   * Три материала кругов рядом: статичное сравнение, переиспользуемое на
   * каждой странице круга — меняется только то, какая карточка активна.
   */
  | { kind: 'materials'; active: 'foam' | 'microfiber' | 'wool' }
  /*
   * Путь энергии от управления к рабочей поверхности — общими для всей
   * категории узлами (управление, привод, рабочий блок, крепление), а не
   * разрезом конкретного мотора: точной компоновки редуктора у вендора
   * в открытом доступе нет.
   */
  | { kind: 'assembly'; items: { label: string; note: string }[] }
  /*
   * Дефект → абразив → результат. Только для составов, только с реальными
   * дефектами стадии из официальной таблицы применения — никаких
   * придуманных повреждений и никакой фотореалистичной подделки «было/стало».
   */
  | {
      kind: 'process'
      defects: string[]
      padLabel: string
      padImage: string
      compoundLabel: string
      compoundImage: string
      resultNote: string
    }
  /*
   * Реальный переключатель исполнений внутри истории. Раньше исполнения
   * аксессуаров показывались рядом ссылок на ту же самую страницу с
   * жёстко прибитой «активной» первой карточкой: клик не делал ничего,
   * а подсветка не отражала выбранное исполнение. Теперь карточка
   * действительно выбирает SKU — меняются артикул, цена и кадр.
   */
  | { kind: 'variants'; items: { sku: string; label: string; note?: string; image: string }[] }
  | {
      kind: 'series'
      from: string
      to: string
      items: { slug: string; href: string; label: string; note: string; image: string; active: boolean }[]
    }

/** Крупная сцена: заголовок, объяснение и — если есть — реальная цифра из прайса. */
export type StoryScene = {
  title: string
  body: string
  /** Значение берётся из specs товара, поэтому никогда не расходится с прайсом. */
  metric?: { value: string; caption: string }
  /** Иллюстрация — только реальное фото из каталога, если оно уместно. */
  image?: string
  /** Схема принципа работы — семантически связана с заголовком сцены. */
  diagram?: SceneDiagram
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
/** Питание платформы — это не машинка: ни оборотов, ни круга у него нет. */
const isPowerPart = (p: Product) => /аккумулятор[ыа]?\s|зарядн/i.test(p.kind)
const isShaftLike = (p: Product) =>
  p.category !== 'pads' && /гибкий вал/i.test(p.kind)
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
/** «700–2500 об/мин» → {min:700, max:2500, unit:'об/мин'}. */
function parseRange(value?: string): { min: number; max: number; unit: string } | null {
  if (!value) return null
  const m = value.replace(/\s/g, ' ').match(/(\d[\d\s]*)\s*[–—-]\s*(\d[\d\s]*)\s*(.*)$/)
  if (!m) return null
  const min = Number(m[1].replace(/\s/g, ''))
  const max = Number(m[2].replace(/\s/g, ''))
  if (!Number.isFinite(min) || !Number.isFinite(max) || max <= min) return null
  return { min, max, unit: (m[3] || '').trim() || 'об/мин' }
}

/**
 * «1050 Вт (макс. 1500 Вт)» → номинал 1050, пик 1500.
 * «1500 Вт (220–240 В)» → номинал 1500, пика нет: в скобках напряжение
 * сети, а не мощность, и подставлять его в шкалу мощности нельзя.
 */
function parsePower(value?: string): { rated: number; peak?: number; unit: string } | null {
  if (!value) return null
  const rated = value.match(/^(\d[\d\s]*)\s*Вт/)
  if (!rated) return null
  const peak = value.match(/макс\.?\s*(\d[\d\s]*)\s*Вт/i)
  const r = Number(rated[1].replace(/\s/g, ''))
  const pk = peak ? Number(peak[1].replace(/\s/g, '')) : undefined
  return { rated: r, peak: pk && pk > r ? pk : undefined, unit: 'Вт' }
}

/** Ход эксцентрика в мм — первое число строки («21 мм или 15 мм» → 21). */
const strokeMm = (p: Product) => firstNumber(specValue(p, 'Ход эксцентрика'))

/** Стек посадки из РЕАЛЬНЫХ кадров каталога: машинка → подложка → круг. */
function mountItems(p: Product): { src: string; label: string; note: string }[] | null {
  /*
   * Стек собирается по РЕАЛЬНОЙ посадке машинки, а не по её разделу.
   * Раньше «аккумуляторная» означала «роторная подложка», и на странице
   * EB202A с посадкой 2" Roll Lock стоял кадр M14-подложки и круга 6",
   * которые на неё не встают. Нет определимой посадки — нет и сцены.
   */
  const plate = plateForMachine(p)
  const pad = bySlug(isSanderLike(p) ? 'foam-flat-t80' : 'foam-diamond-t40')
  if (!plate) return null
  const thread = specValue(p, 'Резьба')
  const own = specValue(p, 'Подложка') ?? specValue(p, 'Подложки')
  const items = [
    {
      src: p.image,
      label: p.model,
      note: thread ? `Резьба шпинделя ${thread}` : p.kind,
    },
    {
      src: plate.image,
      label: 'Подложка',
      note: own ? `Штатный размер ${own}` : (specValue(plate, 'Диаметры') ?? plate.kind),
    },
  ]
  if (pad && !isSanderLike(p)) {
    items.push({
      src: pad.image,
      label: 'Круг',
      note: 'Садится на липучку подложки',
    })
  }
  return items
}

/**
 * Сцены для машинки. Каждая привязана к РЕАЛЬНОЙ характеристике из
 * прайса и получает СВОЙ визуал: привод — схема движения, мощность —
 * шкала номинал/пик, обороты — регулятор, посадка — стек из настоящих
 * кадров каталога. Одна и та же фотография больше не иллюстрирует
 * четыре разные мысли подряд.
 */
function machineScenes(p: Product): StoryScene[] {
  const scenes: StoryScene[] = []
  const speed = specValue(p, 'Обороты')
  const orbit = specValue(p, 'Ход эксцентрика')
  const power = specValue(p, 'Мощность')
  const plate = specValue(p, 'Подложка') ?? specValue(p, 'Подложки')
  const platform = specValue(p, 'Платформа')
  const cable = specValue(p, 'Кабель')
  const capacity = specValue(p, 'Аккумулятор') ?? specValue(p, 'Ёмкость')

  // 01. Принцип привода — то, что отличает роторную от эксцентриковой.
  if (isOrbitalLike(p) || (isSanderLike(p) && orbit)) {
    scenes.push({
      title: 'Вращение и орбита одновременно',
      body:
        'Круг вращается вокруг своей оси и одновременно ходит по окружности. Из-за этого одна и та же точка лака не работает под кругом постоянно и не успевает перегреться — машинка прощает ошибку по нажиму и углу.',
      metric: orbit ? { value: orbit, caption: 'Ход эксцентрика' } : undefined,
      diagram: { kind: 'orbit', orbit },
    })
  } else if (isRotaryLike(p)) {
    scenes.push({
      title: 'Прямой привод: пятно контакта работает постоянно',
      body:
        'Ось вращения совпадает с осью круга, поэтому съём идёт непрерывно и ровно там, куда машинку ведут. Это инструмент коррекции: следы шлифовки, глубокие царапины и сильное окисление снимаются заметно быстрее, чем эксцентриком.',
      metric: speed ? { value: speed, caption: 'Рабочий диапазон' } : undefined,
      diagram: { kind: 'rotary', rpm: speed },
    })
  }

  /*
   * 01.5. Путь энергии от управления к рабочей поверхности — «сигнатурный»
   * момент страницы машинки. Узлы названы общими для любой полировальной
   * машинки терминами (управление, привод, рабочий блок, крепление):
   * точной раскладки редуктора и обмотки у ShineMate в открытом доступе
   * нет, и рисовать «разрез EP830» значило бы выдать схему за факт.
   */
  const orbital = isOrbitalLike(p) || (isSanderLike(p) && !!orbit)
  if (orbital || isRotaryLike(p)) {
    const workUnit = orbital
      ? { label: 'Орбитальный узел', note: 'Задаёт орбитальную траекторию рабочей поверхности' }
      : { label: 'Шпиндель', note: 'Ось вращения совпадает с осью круга' }
    const items: { label: string; note: string }[] = [
      ...(p.category === 'cordless'
        ? [{ label: 'Аккумулятор', note: 'Источник питания, общий для всей платформы' }]
        : []),
      { label: 'Управление', note: 'Держит выбранные обороты под нажимом и нагрузкой' },
      { label: 'Привод', note: 'Передаёт вращение от двигателя к рабочему узлу' },
      workUnit,
      { label: 'Подложка и круг', note: 'Превращают траекторию рабочего узла в работу по лаку' },
    ]
    scenes.push({
      title: 'От управления к рабочей поверхности',
      body:
        'Каждый узел решает свою задачу: управление держит режим, привод передаёт вращение, рабочий блок задаёт траекторию, а подложка с кругом превращают её в работу по лакокрасочному покрытию.',
      diagram: { kind: 'assembly', items },
    })
  }

  // 02. Мощность — номинал против пика.
  const pw = parsePower(power)
  if (pw) {
    scenes.push({
      title: pw.peak ? 'Запас, а не паспортная цифра' : 'Мощность под постоянную нагрузку',
      body: pw.peak
        ? 'Важна не сама мощность, а то, что обороты не проваливаются, когда мастер добавляет нажим на тяжёлом участке. Разница между номиналом и пиком — это и есть тот запас.'
        : 'Мощность рассчитана на работу сменами, а не на короткие рывки: обороты держатся под нажимом, а не проседают на первой же тяжёлой панели.',
      metric: { value: power!, caption: 'Мощность' },
      diagram: {
        kind: 'power',
        ...pw,
        model: p.model,
        // Соседи по разделу с реальной мощностью из прайса — цифра
        // получает масштаб, а не висит в воздухе.
        family: familyOf(p)
          .map((item) => ({ model: item.model, watts: parsePower(specValue(item, 'Мощность'))?.rated ?? 0 }))
          .filter((x) => x.watts > 0)
          .sort((a, b) => a.watts - b.watts),
      },
    })
  }

  // 03. Диапазон оборотов — интерактивный регулятор.
  const rng = parseRange(speed)
  if (rng) {
    scenes.push({
      title: 'Диапазон под задачу, а не одна скорость',
      body:
        'Нижние обороты — разгон пасты и работа по кромкам, где важно не сжечь лак. Верхние — съём и вывод глянца на плоскостях. Регулятор позволяет держать одну и ту же скорость всю смену, а не подбирать её заново на каждой панели.',
      diagram: { kind: 'speed', ...rng },
    })
  }

  // 04. Ход эксцентрика в масштабе линейки.
  const mm = strokeMm(p)
  if (mm !== null) {
    const family = familyOf(p)
      .map((item) => ({ model: item.model, mm: strokeMm(item) }))
      .filter((x): x is { model: string; mm: number } => x.mm !== null)
    /*
     * Дедуп по ходу, но текущая модель имеет приоритет: у EX603 и EX605
     * одинаковые 12 мм, и «первый попавшийся» вариант выкидывал со шкалы
     * саму открытую позицию — активная точка не подсвечивалась вообще.
     */
    const uniq = family
      .filter((x, i, a) => {
        const same = a.filter((y) => y.mm === x.mm)
        const preferred = same.find((y) => y.model === p.model) ?? same[0]
        return a.indexOf(preferred) === i
      })
      .sort((a, b) => a.mm - b.mm)
    if (uniq.length >= 2) {
      scenes.push({
        title: 'Чем больше ход, тем быстрее закрывается панель',
        body:
          'Малый ход точнее ведёт себя на рельефе и мелких деталях, большой — быстрее закрывает капот и крышу. Кружки ниже — реальные ходы эксцентрика моделей этого раздела в одном масштабе.',
        diagram: { kind: 'stroke', items: uniq, activeModel: p.model },
      })
    }
  }

  // 05. Посадка: машинка → подложка → круг реальными кадрами.
  if (plate || specValue(p, 'Резьба')) {
    const items = mountItems(p)
    if (items) {
      scenes.push({
        title: 'Посадка: что именно стоит между машинкой и лаком',
        body:
          'Диаметр и резьба заданы конструкцией. Подложка не по размеру рвёт баланс на оборотах и добавляет вибрацию в кисть, поэтому подложки в каталоге разведены по типам машинок, а не даются «универсальным» набором.',
        metric: plate ? { value: plate, caption: 'Штатная подложка' } : undefined,
        diagram: { kind: 'mount', items },
      })
    }
  }

  /*
   * Комплект поставки — это ровно то, по чему выбирают аккумуляторный
   * набор: у EB210 Kit три головки, шесть подложек, два аккумулятора и
   * кейс, и всё это есть в прайсе. Только для аккумуляторных: сетевой
   * машинке аккумулятор с зарядным в комплект приписывать нельзя.
   */
  if (p.category === 'cordless' && p.includes && p.includes.length >= 3) {
    const battery = platform && /10,8|10\.8/.test(platform) ? bySlug('battery-108v') : bySlug('battery-18v')
    const charger = bySlug('chargers')
    scenes.push({
      title: 'Это комплект, а не одна машинка',
      // Строчной делается только первая буква пункта: сплошной toLowerCase
      // превращал модели головок DA12 · RO-L · RO-H в «da12, ro-l, ro-h».
      body: `В коробке: ${p.includes
        .map((x) => x.charAt(0).toLowerCase() + x.slice(1))
        .join('; ')}. Отдельно докупать питание и оснастку под первый запуск не нужно — набор собран так, чтобы начать работу сразу.`,
      metric: { value: String(p.includes.length), caption: 'Позиций в комплекте' },
      ...(battery && charger
        ? {
            diagram: {
              kind: 'mount' as const,
              items: [
                { src: p.image, label: p.model, note: p.kind },
                { src: battery.image, label: 'Аккумулятор', note: battery.model },
                { src: charger.image, label: 'Зарядное', note: charger.model },
              ],
            },
          }
        : {}),
    })
  }

  // 06. Аккумуляторная платформа.
  if (platform) {
    scenes.push({
      title: 'Одна платформа на всю линейку',
      body:
        'Аккумулятор и зарядное общие для всех машинок этого напряжения: докупается инструмент, а не новый комплект питания. На выезде держат два блока — один в работе, второй на зарядном.',
      diagram: { kind: 'battery', platform, capacity },
    })
  }

  // 07. Бесщёточный двигатель — только там, где это прямо указано у вендора.
  if (/бесщёточн|brushless/i.test(p.kind + p.lead)) {
    scenes.push({
      title: 'Бесщёточный двигатель',
      body:
        'Нет щёток — нет расходника, который стирается и меняется. Двигатель ровнее держит момент под нагрузкой и меньше греется на долгой смене, а обслуживание сводится к чистке.',
      image: p.image,
    })
  }

  // 08. Кабель — спокойный текстовый блок между визуальными сценами.
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
  const family = familyOf(p)
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
  const groups: CompatGroup[] = []

  // Подложка — только та, что реально встаёт по посадке из прайса.
  const plate = plateForMachine(p)
  // У гибкого вала опорной подложки нет вовсе: насадка садится прямо на
  // хвостовик 3 мм, поэтому блок «Подложка» ему не показывается.
  if (plate && !isShaftLike(p)) {
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
  } else if (!isSanderLike(p) && plate) {
    // Круги и пасты показываются только машинке, у которой есть подложка
    // каталога: без неё полноразмерный круг на неё просто не встанет.
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
    /*
     * «Той же платформы» — значит именно той же: машинке 10,8 В больше не
     * предлагается аккумулятор 18 В. Платформа берётся из её же строки
     * прайса, а не из раздела.
     */
    const platform = specValue(p, 'Платформа') ?? ''
    const battery = /10,8|10\.8/.test(platform)
      ? 'battery-108v'
      : /18/.test(platform)
        ? 'battery-18v'
        : null
    const items = bySlugs([...(battery ? [battery] : ['battery-18v', 'battery-108v']), 'chargers'])
    groups.push({
      title: 'Питание',
      note: battery ? `Аккумулятор и зарядное платформы ${platform}` : 'Аккумулятор и зарядное той же платформы',
      items,
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

  /*
   * Насадки на гибкий вал — не круг под одну стадию: в одном артикуле
   * идут разные градации, и стадия у них не одна. Общий заголовок
   * «Круг под конкретный этап» на этой позиции просто врал.
   */
  if (/гибкий вал|конус/i.test(p.kind)) {
    return {
      title: 'Насадки под точечную работу',
      body: p.lead,
      points: [
        `Материал: ${material.toLowerCase()}`,
        ...(specValue(p, 'Хвостовик') ? [`Хвостовик: ${specValue(p, 'Хвостовик')}`] : []),
        ...(specValue(p, 'Размер') ? [`Размер насадки: ${specValue(p, 'Размер')}`] : []),
        `Исполнения: ${p.variants.map((v) => v.label).join(' · ')}`,
      ],
    }
  }

  return {
    title: st ? `Круг для стадии «${st.title}»` : 'Круг под конкретный этап',
    body: st
      ? `${p.lead} На этой стадии выводят: ${st.defects.join(', ').toLowerCase()}.`
      : p.lead,
    points,
  }
}

/**
 * «Как устроен рабочий круг» — общий принцип конструкции hook-and-loop
 * круга (рабочая поверхность → тело → крепление Velcro), верный для всей
 * категории. Мы намеренно не рисуем толщину слоёв и не разбираем
 * конкретную модель: в прайсе нет данных по внутренней раскладке, а на
 * фото-референсах клиента одна и та же позиция подписана то 24, то
 * 25 мм — то есть это не источник, которому можно доверять цифру.
 */
function padConstructionScene(p: Product): StoryScene | null {
  if (/гибкий вал|конус/i.test(p.kind)) return null
  const material = /шерст/i.test(p.kind) ? 'шерсть' : /микрофибр/i.test(p.kind) ? 'микрофибра' : 'поролон'
  const faceNote =
    material === 'шерсть'
      ? 'Ворс определяет характер контакта с ЛКП и скорость съёма'
      : material === 'микрофибра'
        ? 'Плетение определяет характер контакта с ЛКП и чистоту финиша'
        : 'Жёсткость поролона определяет характер контакта с ЛКП'
  return {
    title: 'Как устроен рабочий круг',
    body:
      'Круг — это не один сплошной материал, а несколько слоёв с разной задачей: у каждого своя роль в передаче давления от машинки к лакокрасочному покрытию.',
    diagram: {
      kind: 'layers',
      items: [
        { label: 'Рабочая поверхность', note: faceNote },
        { label: `Тело круга — ${material}`, note: 'Держит форму и амортизирует нажим машинки' },
        { label: 'Крепление Velcro', note: 'Фиксирует круг на подложке, позволяет менять его без инструмента' },
      ],
    },
  }
}

/**
 * Три материала кругов рядом — статичное сравнение без придуманных
 * цифр реза: относительное поведение (агрессивнее/чище/для какой
 * стадии) взято из тех же формулировок, что уже используются в
 * материал-специфичных сценах выше по этой же функции.
 */
function padMaterialScene(p: Product): StoryScene | null {
  if (/гибкий вал|конус/i.test(p.kind)) return null
  const active: 'foam' | 'microfiber' | 'wool' = /шерст/i.test(p.kind)
    ? 'wool'
    : /микрофибр/i.test(p.kind)
      ? 'microfiber'
      : 'foam'
  return {
    title: 'Материал меняет характер работы',
    body: 'Один и тот же диаметр круга ведёт себя по-разному в зависимости от материала рабочей поверхности — это то, что определяет выбор между поролоном, микрофиброй и шерстью.',
    diagram: { kind: 'materials', active },
  }
}

function padScenes(p: Product): StoryScene[] {
  const scenes: StoryScene[] = []
  const grade = padGrade(p)
  const stage = padStageIndex(p)

  /*
   * Насадки на гибкий вал раньше не получали НИ ОДНОЙ сцены: их отсекали
   * все ветки обычного круга (нет подложки, нет стадии, нет градации в
   * названии), и страница обрывалась сразу после назначения. Здесь у них
   * своя короткая история: чем ставятся, что именно ставится и во что
   * это собирается.
   */
  if (/гибкий вал|конус/i.test(p.kind)) {
    const shaft = bySlug('mpk-3')
    scenes.push(...specScenes(p, 2))
    if (shaft) {
      scenes.push({
        title: 'Что стоит между машинкой и кромкой',
        body:
          'Насадка работает не на шпинделе машинки, а на гибком валу: привод остаётся в руке, а рабочая головка уходит вперёд на длину вала. Поэтому в узкую зону заходит насадка диаметром меньше 30 мм, а не полноразмерный круг.',
        diagram: {
          kind: 'mount',
          items: [
            { src: shaft.image, label: shaft.model, note: specValue(shaft, 'Хвостовик') ? `Цанга ${specValue(shaft, 'Хвостовик')}` : shaft.kind },
            { src: p.image, label: 'Насадки', note: specValue(p, 'Размер') ?? p.kind },
          ],
        },
      })
    }
    scenes.push({
      title: 'Исполнения в прайсе',
      body:
        'Комплекты отличаются формой и градацией: конусы заходят в углы и на стыки, цилиндры работают по прямым кромкам. Выберите исполнение — артикул и РРЦ обновятся вместе с ним.',
      diagram: {
        kind: 'variants',
        items: p.variants.map((v) => ({
          sku: v.sku,
          label: v.sku,
          note: v.label,
          image: v.image ?? p.image,
        })),
      },
    })
    return scenes
  }

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

  const construction = padConstructionScene(p)
  if (construction) scenes.push(construction)

  const compare = padMaterialScene(p)
  if (compare) scenes.push(compare)

  if (grade !== null) {
    // Шкала строится по РЕАЛЬНОМУ составу каталога: все градации, которые
    // действительно есть в прайсе, без придуманных «cut 8 из 10».
    const grades = Array.from(
      new Set(
        productsByCategory('pads')
          .map(padGrade)
          .filter((g): g is number => g !== null),
      ),
    ).sort((a, b) => a - b)
    scenes.push({
      title: 'Что означает градация',
      body:
        'Цифра в названии — жёсткость и агрессивность круга: чем она выше, тем больше съём и грубее след, чем ниже — тем мягче работа и чище глянец. Посадочный размер при этом не меняется, поэтому в рамках одной машинки круги переставляются без подбора подложки.',
      metric: { value: `T${grade}`, caption: 'Градация' },
      diagram: grades.length >= 3 ? { kind: 'cut', grades, active: grade } : undefined,
    })
  }

  // Ряд своей серии реальными кадрами: видно, что T120 зелёный, а T10
  // красный, и где среди них стоит открытый круг.
  const series = familyOf(p)
    .map((item) => ({ item, g: padGrade(item) }))
    .filter((x): x is { item: Product; g: number } => x.g !== null)
    .sort((a, b) => a.g - b.g)
  if (series.length >= 3) {
    const seriesName = /black diamond/i.test(p.model)
      ? 'Black Diamond'
      : /flat-face/i.test(p.model)
        ? 'Flat-face'
        : /микрофибр/i.test(p.kind)
          ? 'Микрофибра'
          : 'Серия'
    scenes.push({
      title: `Вся серия ${seriesName} в одном ряду`,
      body:
        'Цвет в этой линейке — не украшение, а маркировка жёсткости: чем ниже градация, тем мягче круг и чище глянец. Соседние градации кликабельны — можно сразу перейти к нужной.',
      diagram: {
        kind: 'series',
        from: 'T10 · финиш',
        to: `T${series[series.length - 1].g} · тяжёлый рез`,
        items: series.map(({ item, g }) => ({
          slug: item.slug,
          href: `catalog/${item.category}/${item.slug}`,
          label: `T${g}`,
          note: item.model.replace(/^.*?—\s*/, '').replace(/\s*\(T\d+\)/, ''),
          image: item.image,
          active: item.slug === p.slug,
        })),
      },
    })
  }

  const mount = padMountScene(p)
  if (mount) scenes.push(mount)

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

/** Стек «машинка → подложка → круг» со стороны круга. */
/**
 * Машинка и подложка для круга берутся по ЕГО собственной
 * совместимости, а не «эксцентриковая по умолчанию»: полосатая шерсть
 * со скосом 20 мм в прайсе помечена как «только для роторных машинок»,
 * и показывать рядом с ней DA-машинку было бы ошибкой.
 */
function padRig(p: Product): { machine?: Product; plate?: Product } {
  const rotaryOnly = /только для роторных/i.test(p.lead) || /для роторных машинок/i.test(p.lead)
  const daOnly = /da-машин|эксцентриков/i.test(p.kind)
  if (rotaryOnly && !daOnly) return { machine: bySlug('ep820'), plate: bySlug('plates-rotary') }
  return { machine: bySlug('ex620'), plate: bySlug('plates-da') }
}

/** Стадия круга → реальный состав этой же стадии (обратная связь к COMPOUND_STAGE). */
const STAGE_COMPOUND_SLUG: Record<number, string> = {
  1: 'v80-heavy-cut',
  2: 'v40-medium-polish',
  3: 'v20-final-finish',
}

function padMountScene(p: Product): StoryScene | null {
  if (/гибкий вал|конус/i.test(p.kind)) return null
  const { machine, plate } = padRig(p)
  if (!machine || !plate) return null
  const stage = padStageIndex(p)
  const compound = stage !== null ? bySlug(STAGE_COMPOUND_SLUG[stage]) : undefined
  const items = [
    { src: machine.image, label: machine.model, note: specValue(machine, 'Резьба') ? `Резьба ${specValue(machine, 'Резьба')}` : machine.kind },
    { src: plate.image, label: 'Подложка', note: specValue(plate, 'Диаметры') ?? plate.kind },
    { src: p.image, label: p.model, note: specValue(p, 'Диаметры') ?? p.kind },
    ...(compound ? [{ src: compound.image, label: compound.model, note: 'Работает в паре с кругом этой стадии' }] : []),
  ]
  return {
    title: compound ? 'Круг не работает в отрыве от системы' : 'Как круг попадает на машинку',
    body: compound
      ? 'Круг не ставится на машинку напрямую: между ними подложка, а результат даёт только связка с составом своей стадии — по отдельности ни круг, ни паста предсказуемого съёма не дают.'
      : 'Круг не ставится на машинку напрямую: между ними подложка. Её диаметр подбирают под круг, а резьбу — под машинку, поэтому один и тот же круг работает и на роторной, и на эксцентриковой при правильной подложке.',
    diagram: { kind: 'mount', items },
  }
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
  const rig = padRig(p)
  groups.push({
    title: 'Подложка',
    note: rig.plate === bySlug('plates-rotary') ? 'Резьба M14 под роторную машинку' : 'Резьба M8 под эксцентриковую',
    items: rig.plate ? [rig.plate] : [],
  })
  groups.push({
    title: 'Машинки',
    note: 'С чем этот круг работает по прайсу',
    items: /только для роторных/i.test(p.lead)
      ? bySlugs(['ep820', 'ep801-g2', 'ep830'])
      : /микрофибр/i.test(p.kind)
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

  /*
   * Главная «конфетка» страницы пасты: не механика (у состава её нет),
   * а сам процесс обработки. Дефекты и цель — та же официальная таблица
   * применения, что и в PolishingProcess на главной, круг — реальная
   * совместимая позиция каталога. Ничего не придумано: если стадия
   * неизвестна, сцена просто не показывается.
   */
  if (stage !== undefined) {
    const st = POLISH_STAGES[stage]
    const padSlugForStage: Record<number, string> = {
      1: 'foam-diamond-t80',
      2: 'foam-diamond-t40',
      3: 'foam-diamond-t10',
    }
    const pad = bySlug(padSlugForStage[stage] ?? 'foam-diamond-t40')
    if (pad) {
      scenes.push({
        title: 'Дефект → абразив → результат',
        body: `${st.goal}. Состав наносится точками на рабочую поверхность круга и разгоняется на низких оборотах — абразив работает в паре с кругом, а не сам по себе.`,
        diagram: {
          kind: 'process',
          defects: st.defects,
          padLabel: pad.model,
          padImage: pad.image,
          compoundLabel: p.model,
          compoundImage: p.image,
          resultNote: st.goal,
        },
      })
    }
  }

  // Линейка V-Range реальными кадрами: от тяжёлого реза к финишу.
  const order = ['v80-heavy-cut', 'v82-fast-polish', 'v40-medium-polish', 'v20-final-finish']
  const line = bySlugs(order)
  if (line.length >= 3) {
    scenes.push({
      title: 'Вся линейка V-Range по стадиям',
      body:
        'Составы идут от тяжёлого реза к финишу. Выбор начинается не с пасты, а с дефекта: если он глубже, чем закрывает состав, паста просто «замылит» его вместо снятия.',
      diagram: {
        kind: 'series',
        from: 'V80 · тяжёлый рез',
        to: 'V20 · финиш',
        items: line.map((item) => ({
          slug: item.slug,
          href: `catalog/${item.category}/${item.slug}`,
          label: item.model.split(' ')[0],
          note: item.model.split(' ').slice(1).join(' '),
          image: item.image,
          active: item.slug === p.slug,
        })),
      },
    })
  }

  const cm = compoundMountScene(p)
  if (cm) scenes.push(cm)

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

/** Связка «паста → круг → машинка» реальными кадрами каталога. */
function compoundMountScene(p: Product): StoryScene | null {
  const stage = COMPOUND_STAGE[p.slug]
  const padSlug: Record<number, string> = {
    1: 'foam-diamond-t80',
    2: 'foam-diamond-t40',
    3: 'foam-diamond-t10',
  }
  const pad = bySlug(stage !== undefined ? (padSlug[stage] ?? 'foam-diamond-t40') : 'foam-diamond-t40')
  const machine = bySlug('ex620')
  if (!pad || !machine) return null
  return {
    title: 'Связка, в которой состав работает',
    body:
      'Паста наносится точками на рабочую поверхность круга и разгоняется на низких оборотах. Результат даёт именно связка: паста задаёт абразив, круг — жёсткость и площадь контакта, машинка — скорость и характер движения.',
    diagram: {
      kind: 'mount',
      items: [
        { src: p.image, label: p.model, note: specValue(p, 'Объём') ?? p.kind },
        { src: pad.image, label: pad.model, note: 'Круг своей стадии' },
        { src: machine.image, label: machine.model, note: machine.kind },
      ],
    },
  }
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

/* ─────────────────── История: питание платформы ─────────────────── */

/** Напряжение платформы из характеристик — «18 В», «10,8 В». */
const platformVolts = (p: Product) =>
  specValue(p, 'Платформа') ?? specValue(p, 'Напряжение') ?? (p.model.match(/([\d,]+\s*В)/)?.[1] ?? undefined)

/** Машинки, которые реально питаются от этой платформы. */
function platformMachines(p: Product): Product[] {
  const v = platformVolts(p)
  if (!v) return []
  const norm = v.replace(/\s/g, '')
  return productsByCategory('cordless').filter(
    (x) => storyKind(x) === 'machine' && (specValue(x, 'Платформа') ?? '').replace(/\s/g, '') === norm,
  )
}

function powerPurpose(p: Product): ProductStory['purpose'] {
  const charger = /зарядн/i.test(p.kind)
  const v = platformVolts(p)
  return {
    title: charger ? 'Зарядное под платформу, а не под модель' : 'Один аккумулятор на всю платформу',
    body: charger
      ? `${p.lead} Блок ставится там, где есть обычная розетка: отдельная подготовка поста не нужна.`
      : `${p.lead} Аккумулятор подходит ко всем машинкам своего напряжения — докупается инструмент, а не новый комплект питания.`,
    points: [
      ...(v ? [`Платформа: ${v}`] : []),
      ...p.specs.filter((x) => !/платформа|напряжение/i.test(x.label)).map((x) => `${x.label}: ${x.value}`),
      ...(p.variants.length > 1 ? [`Исполнений в прайсе: ${p.variants.length}`] : []),
    ],
  }
}

function powerScenes(p: Product): StoryScene[] {
  const scenes: StoryScene[] = []
  const v = platformVolts(p)
  const charger = /зарядн/i.test(p.kind)
  const capacity = specValue(p, 'Ёмкость') ?? specValue(p, 'Аккумулятор')

  if (v && !charger) {
    scenes.push({
      title: 'Куда уходит заряд',
      body:
        'Энергия идёт напрямую в рабочую головку — без кабеля, удлинителей и привязки к розетке. Именно поэтому на выезде держат два блока: один в работе, второй на зарядном.',
      diagram: { kind: 'battery', platform: v, capacity },
    })
  }

  if (p.variants.length >= 2) {
    scenes.push({
      title: charger ? 'Исполнения зарядных в прайсе' : 'Ёмкости в прайсе',
      body: charger
        ? 'Разные исполнения отличаются числом посадочных мест и платформой. Всё остальное — те же разъёмы и та же сеть.'
        : 'Ёмкость — это время до подзарядки, а не мощность машинки. Чем она выше, тем дольше блок держит смену без паузы.',
      diagram: {
        kind: 'sizes',
        items: p.variants.map((x) => ({
          label: x.axis1 ?? x.label,
          note: x.label,
          mm: firstNumber(x.label) ?? 0,
        })),
      },
    })
  }

  return scenes
}

function powerCompat(p: Product): CompatGroup[] {
  const groups: CompatGroup[] = []
  const charger = /зарядн/i.test(p.kind)
  // Зарядные в прайсе идут на обе платформы сразу, поэтому им
  // показывается вся аккумуляторная линейка, а не одно напряжение.
  const machines = charger
    ? productsByCategory('cordless').filter((x) => storyKind(x) === 'machine').slice(0, 4)
    : platformMachines(p)
  if (machines.length) {
    groups.push({
      title: charger ? 'Что заряжает' : 'Машинки этой платформы',
      note: charger
        ? 'Аккумуляторные машинки линейки — платформы 18 В и 10,8 В'
        : `Работают от того же напряжения${platformVolts(p) ? ` (${platformVolts(p)})` : ''}`,
      items: machines.slice(0, 4),
    })
  }
  const siblings = productsByCategory('cordless').filter(
    (x) => storyKind(x) === 'power' && x.slug !== p.slug,
  )
  if (siblings.length) {
    groups.push({ title: 'Остальное питание', note: 'Аккумуляторы и зарядные линейки', items: siblings })
  }
  return groups
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
const SPEC_SCENES: {
  match: RegExp
  valueMatch?: RegExp
  /** Ограничение по товару: одна и та же метка у разных типов значит разное. */
  only?: (p: Product) => boolean
  title: string
  body: string
}[] = [
  {
    match: /резьба/i,
    title: 'Резьба должна совпадать с машинкой',
    body:
      'Посадка — это не «подойдёт любая»: у роторных машинок M14, у эксцентриковых M8 и 5/16"-24. Неверная резьба либо не встанет, либо будет работать с биением.',
  },
  {
    match: /^макс\.? диаметр/i,
    title: 'Размер насадки решает, куда она пролезет',
    body:
      'Диаметр рабочей насадки на валу ограничен конструкцией: чем он меньше, тем в более тесную зону заходит инструмент. Ограничение здесь — не недостаток, а условие доступа: полноразмерный круг в эти места не входит вообще.',
  },
  {
    match: /хвостовик/i,
    title: 'Хвостовик задаёт, что можно поставить',
    body:
      'Насадки под точечную работу идут с одним хвостовиком — по нему они и подбираются. Совпал хвостовик — насадка встала в цангу вала без переходников.',
  },
  {
    /*
     * Правило про баланс подложки — только для оснастки. Раньше оно
     * цеплялось за «Макс. диаметр круга» у гибкого вала, и на странице
     * MPK-3 стоял текст про подложку, которой у вала вообще нет.
     */
    match: /диаметр/i,
    only: (p) => p.category === 'plates',
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
      (r) =>
        r.match.test(spec.label) &&
        (!r.valueMatch || r.valueMatch.test(spec.value)) &&
        (!r.only || r.only(p)),
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

/**
 * Сцены подложки. У подложки нет оборотов и мощности, зато есть то, что
 * реально определяет её выбор: резьба, диаметры и место между машинкой
 * и кругом. Всё это показывается схемами, а не абзацами подряд.
 */
function plateScenes(p: Product): StoryScene[] {
  const scenes: StoryScene[] = []
  const thread = specValue(p, 'Резьба')
  const diameters = specValue(p, 'Диаметры')
  const mount = specValue(p, 'Крепление')

  /*
   * Машинка в стеке выбирается по резьбе САМОЙ оснастки: у «Адаптеров и
   * удлинителей вала» резьба M14, но по названию они не «роторные», и
   * стек показывал их вместе с EX620, у которой M8 — физически такой
   * стек не собрать.
   */
  const machine = /роторн/i.test(p.model) || /M14/i.test(thread ?? '')
    ? bySlug('ep820')
    : /шлифоваль/i.test(p.model)
      ? bySlug('es516')
      : bySlug('ex620')
  /*
   * Шлифовальная подложка НЕ несёт полировальный круг: абразивных дисков
   * в прайсе нет, и ставить сюда жёлтый поролон T80 было прямым враньём
   * на картинке. У шлифовальной оснастки стек заканчивается подложкой,
   * и текст говорит про диск, а не про круг.
   */
  const sanding = /шлифоваль/i.test(p.model)
  const pad = sanding ? undefined : bySlug('foam-diamond-t40')

  if (machine) {
    const items = [
      {
        src: machine.image,
        label: machine.model,
        note: specValue(machine, 'Резьба') ? `Резьба ${specValue(machine, 'Резьба')}` : machine.kind,
      },
      { src: p.image, label: p.model, note: thread ? `Резьба ${thread}` : p.kind },
      ...(pad
        ? [{ src: pad.image, label: pad.model, note: mount ? `Крепление: ${mount.toLowerCase()}` : pad.kind }]
        : []),
    ]
    scenes.push({
      title: sanding ? 'Место подложки: между шпинделем и диском' : 'Место подложки: между шпинделем и кругом',
      body: sanding
        ? 'Подложка — единственная деталь, через которую ход машинки доходит до абразива. Диаметр подложки задаёт размер диска, а посадка — конкретную модель серии ES: сменная подложка меняется отдельно от машинки, когда её липучка выработалась.'
        : 'Подложка — единственная деталь, через которую момент машинки доходит до круга. Резьба должна совпасть со шпинделем, диаметр — с кругом: иначе появляется биение, вибрация в кисть и неравномерный съём.',
      diagram: { kind: 'mount', items },
    })
  }

  if (thread) {
    scenes.push({
      title: 'Резьба должна совпадать с машинкой',
      body:
        'Посадка — это не «подойдёт любая»: у роторных машинок M14, у эксцентриковых M8 и 5/16"-24. Неверная резьба либо не встанет, либо будет работать с биением.',
      metric: { value: thread, caption: 'Резьба' },
    })
  }

  // Реальные исполнения как размерный ряд: цифры прямо из прайса.
  if (p.variants.length >= 2) {
    scenes.push({
      title: sanding ? 'Размерный ряд под разные диски' : 'Размерный ряд под разные круги',
      body: sanding
        ? 'Диаметр подложки задаёт размер абразивного диска: 123 мм — под 5", 148 мм — под 6". Ниже — исполнения этой позиции из прайса.'
        : 'Диаметр подложки подбирают под круг, а не наоборот: на маленькой подложке большой круг «гуляет» по краю, на большой — теряется гибкость на рельефе. Ниже — исполнения этой позиции из прайса.',
      metric: diameters ? { value: diameters, caption: 'Диаметры' } : undefined,
      diagram: {
        kind: 'sizes',
        items: p.variants.map((v) => ({ label: v.axis1 ?? v.label, note: v.label, mm: firstNumber(v.label) ?? 0 })),
      },
    })
  }

  return scenes
}

function plateCompat(p: Product): CompatGroup[] {
  /*
   * Машинки подбираются по резьбе позиции, а не только по её названию:
   * «Адаптеры и удлинители вала» — это M14, то есть роторная линейка,
   * но по слову «роторные» они не проходили и оставались вообще без
   * блока совместимости.
   */
  const thread = specValue(p, 'Резьба') ?? ''
  const machines = /роторн/i.test(p.model) || /M14/i.test(thread)
    ? bySlugs(['ep820', 'ep801-g2', 'ep830'])
    : /эксцентриков/i.test(p.model) || /M8|5\/16/i.test(thread)
      ? bySlugs(['ex620', 'ex605', 'ero600-g2'])
      : /шлифоваль/i.test(p.model)
        ? bySlugs(['es516', 'es700'])
        : []

  const groups: CompatGroup[] = []
  if (machines.length) {
    groups.push({ title: 'Машинки', note: 'Под эту посадку и резьбу', items: machines })
  }

  /*
   * Круги подбираются по РЕАЛЬНОЙ посадке этой подложки, а не одним
   * зашитым списком на все три типа. Раньше и роторная, и эксцентриковая,
   * и — что хуже — шлифовальная подложка показывали одну и ту же тройку
   * полировальных кругов: у шлифовальной оснастки полировальных кругов
   * в прайсе нет вовсе, а шерсть «только для роторных» попадала на
   * страницу DA-подложки. Теперь источник один — padRig(), та же
   * функция, по которой круг выбирает себе подложку.
   */
  if (!/шлифоваль/i.test(p.model)) {
    /*
     * Круги берутся по посадке. У адаптеров своей группы кругов в прайсе
     * нет — они выносят вперёд уже собранную роторную оснастку, поэтому
     * им показываются круги роторной подложки.
     */
    const host = /M14/i.test(thread) && !/подложк/i.test(p.model) ? 'plates-rotary' : p.slug
    const pads = products
      .filter((x) => x.category === 'pads' && !/гибкий вал|конус/i.test(x.kind))
      .filter((x) => padRig(x).plate?.slug === host)
    // По одному представителю на семейство: подложка показывает РАЗНЫЕ
    // типы кругов (поролон, шерсть, микрофибру), а не три соседние
    // градации одной и той же серии.
    const byFamily = pads.filter(
      (x, i, a) => a.findIndex((y) => productFamily(y) === productFamily(x)) === i,
    )
    const items = (byFamily.length >= 2 ? byFamily : pads).slice(0, 3)
    if (items.length) {
      groups.push({ title: 'Круги', note: 'Что ставится на эту подложку', items })
    }
  }
  return groups.filter((g) => g.items.length > 0)
}

/**
 * Сцены аксессуара. У оснастки рабочего места нет оборотов и резьбы,
 * зато есть реальные исполнения из прайса — их и показываем рядом, с
 * ценой у каждого: это ровно то, по чему её выбирают.
 */
function accessoryScenes(p: Product): StoryScene[] {
  const scenes = specScenes(p, 2)

  /*
   * Аксессуар не должен обрываться после двух строк характеристик.
   * У тележки и сумки характеристика ровно одна (артикул или размер),
   * и страница выходила самой пустой на сайте. Здесь у раздела
   * появляется своя мысль: что именно на этом посту хранится и где он
   * стоит в рабочем дне — на реальных кадрах каталога, без выдуманных
   * материалов, объёмов и нагрузок.
   */
  if (/тележк|сумка|держател/i.test(p.kind)) {
    const carried = bySlugs(['ep820', 'foam-diamond-t40', 'v40-medium-polish']).filter(Boolean)
    if (carried.length === 3) {
      scenes.push({
        title: 'Что уезжает вместе с постом',
        body:
          'Машинка, круги и составы — это три разные группы расходников, и на выезде они обычно едут вместе. Позиция собирает их в одном месте, поэтому подготовка к работе не начинается с поиска подложки по багажнику.',
        diagram: {
          kind: 'mount',
          items: [
            { src: carried[0].image, label: carried[0].model, note: carried[0].kind },
            { src: carried[1].image, label: 'Круги', note: 'Полировальные круги каталога' },
            { src: carried[2].image, label: 'Составы', note: 'Линейка V-Range' },
          ],
        },
      })
    }
  }

  /*
   * Мойка стоит ДО полировки — это единственная позиция каталога,
   * которая работает раньше первой стадии цикла, и об этом честно
   * сказать полезнее, чем добирать страницу общими словами.
   */
  if (/вёдра|ведра|сепаратор|микрофибр/i.test(p.kind)) {
    scenes.push({
      title: 'Стадия, которая идёт до первой стадии',
      body:
        'Полировка начинается с чистой поверхности: песок, оставшийся на кузове после мойки, работает под кругом как абразив и добавляет ровно те риски, которые потом выводят пастой. Сепаратор задерживает грязь на дне ведра, поэтому она не возвращается на лак со следующим заходом губки.',
      image: p.image,
    })
  }

  if (p.variants.length >= 2) {
    scenes.push({
      title: 'Исполнения в прайсе',
      body:
        'Позиция поставляется несколькими исполнениями — они отличаются размером, комплектом или креплением. Выберите нужное прямо здесь: артикул, РРЦ и кадр на первом экране обновятся вместе с ним.',
      diagram: {
        kind: 'variants',
        items: p.variants.map((v) => ({
          sku: v.sku,
          label: v.sku,
          note: v.label,
          image: v.image ?? p.image,
        })),
      },
    })
  }
  return scenes
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
  /*
   * Артикул — идентификатор, а не параметр. В блоке ключевых значений он
   * дублировал строку из первого экрана и у тележки оставался ЕДИНСТВЕННЫМ
   * «параметром»: тёмная полоса на пол-экрана держала одно повторённое
   * слово. Идентификаторы сюда не берём совсем.
   */
  const usable = p.specs.filter((s) => !/^артикул$/i.test(s.label))
  for (const label of HIGHLIGHT_ORDER) {
    const spec = usable.find((s) => s.label === label)
    if (spec) out.push(spec)
    if (out.length === 4) break
  }
  // Позиция может быть описана метками вне списка (например, «Совместимость»
  // у адаптеров) — тогда добираем по порядку из прайса, но не выдумываем.
  if (out.length < 3) {
    for (const spec of usable) {
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

/** Заголовок сравнения называет именно семейство, а не весь раздел. */
function comparisonCaption(p: Product): string {
  const f = productFamily(p)
  const map: Record<string, string> = {
    rotary: 'Роторные машинки — чем модели отличаются',
    orbital: 'Эксцентриковые машинки — чем модели отличаются',
    sander: 'Шлифовальные машинки — чем модели отличаются',
    'cordless-rotary': 'Аккумуляторные роторные — чем модели отличаются',
    'cordless-orbital': 'Аккумуляторные эксцентриковые — чем модели отличаются',
    'cordless-sander': 'Аккумуляторные шлифмашинки — чем модели отличаются',
    'cordless-machine': 'Аккумуляторные комплекты — чем отличаются',
    'power-battery': 'Аккумуляторы платформ — чем отличаются',
    'power-charger': 'Зарядные устройства — чем отличаются',
    'pad-foam-diamond': 'Black Diamond — чем градации отличаются',
    'pad-foam-flat': 'Flat-face — чем градации отличаются',
    'pad-wool': 'Шерстяные круги — чем отличаются',
    'pad-microfiber': 'Микрофибровые круги — чем отличаются',
    chemistry: 'Пасты V-Range — чем составы отличаются',
    plates: 'Подложки и адаптеры — чем отличаются',
    workshop: 'Рабочее место — что ещё есть в разделе',
  }
  return map[f] ?? `${categoryTitle(p.category)} — чем модели отличаются`
}

/** Метки, по которым осмысленно сравнивать модели одного раздела. */
/*
 * Метки, по которым имеет смысл сравнивать соседей. Порядок = приоритет
 * колонок. Сюда добавлено всё, что РЕАЛЬНО различается внутри семейств
 * прайса: «Ход» у шлифовальных, «Напряжение» у аккумуляторов,
 * «Совместимость» у паст, «Исполнение» у шерсти, «Подушка» у микрофибры.
 * Артикул сюда не попадает: он ничего не помогает выбрать.
 */
const COMPARE_LABELS = [
  'Ход эксцентрика',
  'Ход',
  'Тип',
  'Обороты',
  'Мощность',
  'Напряжение',
  'Подложка',
  'Платформа',
  'Кабель',
  'Градация',
  'Исполнение',
  'Подушка',
  'Толщина',
  'Диаметры',
  'Совместимость',
  'Объём',
  'Резьба',
]

function comparison(p: Product): ComparisonTable | undefined {
  const family = familyOf(p)
  if (family.length < 2) return undefined

  /*
   * Колонка попадает в таблицу, только если значение есть минимум у двух
   * моделей раздела — иначе получилась бы таблица из прочерков. И ТОЛЬКО
   * если значения РАЗЛИЧАЮТСЯ: у всех четырёх паст V-Range объём 500 мл,
   * и колонка «Объём» занимала место, ничем не помогая выбрать. Сравнение
   * должно показывать разницу, а не повторять одну цифру четыре раза.
   */
  const distinct = (label: string) =>
    new Set(
      family
        .map((item) => item.specs.find((s) => s.label === label)?.value)
        .filter((v): v is string => Boolean(v)),
    ).size
  const columns = COMPARE_LABELS.filter(
    (label) =>
      family.filter((item) => item.specs.some((s) => s.label === label)).length >= 2 &&
      distinct(label) >= 2,
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
  return { caption: comparisonCaption(p), columns, rows }
}

/* ──────────────────────── Связка «система ShineMate» ──────────────────────── */

/**
 * Собирает цепочку машинка → подложка → круг → паста вокруг текущей
 * позиции. Все четыре шага — реальные товары каталога; шаг, которым
 * является сам товар, помечается active. Если какого-то звена в каталоге
 * нет, цепочка просто короче — заглушек не появляется.
 */
/**
 * Какая подложка каталога реально встаёт на эту машинку.
 *
 * Раньше подложку выбирал РАЗДЕЛ («аккумуляторная» → роторная подложка),
 * и компактные машинки 10,8 В получали оснастку, которая на них физически
 * не встаёт: у EB202A посадка 2" Roll Lock, у EB210 Kit головки 1,25"–2,5",
 * а подложки каталога — M14/M8 диаметром до 148 мм. Теперь решает
 * собственная посадка машинки из прайса; если её определить нельзя, ни
 * подложки, ни кругов, ни пасты машинке не приписывается.
 */
function plateForMachine(m: Product): Product | undefined {
  if (isShaftLike(m)) return undefined
  if (isSanderLike(m)) {
    /*
     * Шлифовальные подложки каталога — 123 и 148 мм (5" и 6"). Размер
     * сверяется по целому токену: «1,25"» содержит подстроку «5"», и по
     * ней аккумуляторная EB200A с головкой 1,25" ошибочно получала
     * подложку 6".
     */
    const size = m.specs.find((x) => /^Подложк/i.test(x.label))?.value ?? ''
    return /(^|[^\d,.])[56]"|\b(123|148)\b/.test(size) ? bySlug('plates-sander') : undefined
  }
  const mount = `${specValue(m, 'Резьба') ?? ''} ${m.specs.find((x) => /^Подложк/i.test(x.label))?.value ?? ''}`
  if (/M14/i.test(mount)) return bySlug('plates-rotary')
  if (/M8|5\/16/i.test(mount)) return bySlug('plates-da')
  return undefined
}

function systemChain(p: Product): SystemChain | undefined {
  const kind = storyKind(p)
  // Аксессуары и питание в связке «машинка → круг → паста» не участвуют:
  // у аккумулятора нет ни посадки, ни круга, и строить для него цепочку
  // полировки — прямая ложь о товаре.
  if (kind === 'accessory' || kind === 'power') return undefined
  /*
   * Шлифование заканчивается подложкой и абразивным диском: полировальный
   * круг и паста на него не ставятся. Раньше признак считался только по
   * машинке, и страница ШЛИФОВАЛЬНОЙ подложки всё равно достраивала
   * связку до «Black Diamond T40 + V40» — оснастка серии ES получала
   * полировальный круг, которого на ней не бывает.
   */
  const sanding =
    (kind === 'machine' && isSanderLike(p)) || (kind === 'plate' && /шлифоваль/i.test(p.model))

  // Гибкий вал и точечные насадки живут в своей связке: полноразмерный
  // круг и подложка на них не ставятся, у них хвостовик 3 мм.
  const spot = isShaftLike(p) || (kind === 'pad' && /гибкий вал|конус/i.test(p.kind))
  if (spot) {
    const shaft = kind === 'machine' ? p : bySlug('mpk-3')
    const tips = kind === 'pad' ? p : bySlug('spot-pads')
    const adaptors = bySlug('adaptors-shafts')
    const st: SystemChain['steps'] = []
    if (shaft) st.push({ role: '01 · Привод', product: shaft, note: 'Выносит насадку вперёд', active: shaft.slug === p.slug })
    if (adaptors) st.push({ role: '02 · Вал', product: adaptors, note: 'Удлинители и адаптеры хвостовика', active: adaptors.slug === p.slug })
    if (tips) st.push({ role: '03 · Насадка', product: tips, note: 'Конусы и шарики под хвостовик 3 мм', active: tips.slug === p.slug })
    if (st.length < 2) return undefined
    return {
      caption: 'Связка точечной работы',
      note: 'Кромки, стойки и рельеф обрабатываются насадкой на гибком валу — полноразмерная машинка туда просто не встаёт.',
      steps: st,
    }
  }

  // Для не-машинок нужна модель-представитель: у подложки её задаёт
  // собственное название, у круга — его собственная совместимость по
  // прайсу, у пасты — эксцентриковая машинка как самый ходовой инструмент.
  const rig = kind === 'pad' ? padRig(p) : null

  /*
   * У оснастки машинку задаёт её собственная посадка, а не порядок в
   * файле. «Адаптеры и удлинители вала» — резьба M14 под РОТОРНУЮ
   * машинку, но попадали в общий else и вставали в связку с EX620, у
   * которой M8: связка показывала физически несобираемый стек.
   */
  const plateThread = kind === 'plate' ? p.specs.map((x) => x.value).join(' ') : ''
  const machine =
    kind === 'machine'
      ? p
      : rig?.machine
        ? rig.machine
        : kind === 'plate' && /шлифоваль/i.test(p.model)
          ? bySlug('es516')
          : kind === 'plate' && (/роторн/i.test(p.model) || /M14/.test(plateThread))
            ? bySlug('ep820')
            : bySlug('ex620')

  const plate =
    kind === 'plate'
      ? p
      : rig?.plate
        ? rig.plate
        : kind === 'machine'
          ? plateForMachine(p)
          : bySlug('plates-da')

  // Машинка без определимой посадки не получает придуманную связку.
  if (kind === 'machine' && !plate) return undefined

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
  if (!sanding) {
    push('03 · Круг', pad, 'Определяет агрессивность на этой стадии')
    push('04 · Паста', compound, 'Работает в паре с кругом своей стадии')
  }

  if (steps.length < 2) return undefined
  return {
    caption: sanding ? 'Чем работает шлифовальная машинка' : 'Связка, в которой работает эта позиция',
    note: sanding
      ? 'Шлифование заканчивается подложкой и абразивным диском: полировальный круг и паста подключаются уже на следующей стадии, другой машинкой.'
      : 'Результат даёт не отдельный инструмент, а сочетание: привод, посадка, круг и состав рассчитаны друг под друга внутри одной линейки.',
    steps,
  }
}

/* ─────────────────────────────── Сборка ─────────────────────────────── */

export type StoryKind = 'machine' | 'power' | 'pad' | 'compound' | 'plate' | 'accessory'

export function storyKind(p: Product): StoryKind {
  // Аккумуляторы и зарядные лежат в разделе аккумуляторных машинок, но
  // машинками не являются: у них нет ни привода, ни круга, ни пасты, и
  // сравнивать их с полировальными моделями бессмысленно.
  if (isPowerPart(p)) return 'power'
  if (['rotary', 'da', 'sander', 'cordless'].includes(p.category)) return 'machine'
  if (p.category === 'pads') return 'pad'
  if (p.category === 'chemistry') return 'compound'
  if (p.category === 'plates') return 'plate'
  return 'accessory'
}

/**
 * Семейство позиции — то, с чем её ЕСТЬ СМЫСЛ сравнивать.
 *
 * Раздел не равен семейству: в «Роторных машинках» рядом с EP830 лежит
 * гибкий вал MPK-3, а в «Аккумуляторных» — сами аккумуляторы и зарядные.
 * Ставить их в одну таблицу сравнения с полноразмерной машинкой значит
 * сравнивать несравнимое, поэтому сравнение и «соседи» считаются по
 * семейству, а не по категории.
 */
export function productFamily(p: Product): string {
  if (isPowerPart(p)) return /зарядн/i.test(p.kind) ? 'power-charger' : 'power-battery'
  if (isShaftLike(p)) return 'shaft'
  if (p.category === 'pads') {
    if (/конус|гибкий вал/i.test(p.kind)) return 'pad-spot'
    if (/микрофибр/i.test(p.kind)) return 'pad-microfiber'
    if (/шерст/i.test(p.kind)) return 'pad-wool'
    if (/black diamond/i.test(p.model)) return 'pad-foam-diamond'
    if (/flat-face/i.test(p.model)) return 'pad-foam-flat'
    return 'pad-foam'
  }
  if (['rotary', 'da', 'sander', 'cordless'].includes(p.category)) {
    const cordless = p.category === 'cordless' ? 'cordless-' : ''
    if (isSanderLike(p)) return `${cordless}sander`
    if (isOrbitalLike(p)) return `${cordless}orbital`
    if (isRotaryLike(p)) return `${cordless}rotary`
    return `${cordless}machine`
  }
  return p.category
}

/** Соседи по семейству — основа и для сравнения, и для «похожих». */
export const familyOf = (p: Product) => products.filter((x) => productFamily(x) === productFamily(p))

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
  // Гибкий вал — приставка к машинке, а не машинка: «полный цикл этой
  // машинкой» на его странице звучал как подмена товара.
  const shaft = /гибкий вал/i.test(p.kind)
  return {
    caption: shaft
      ? 'Где гибкий вал стоит в цикле обработки'
      : sander
        ? 'Где машинка стоит в цикле обработки'
        : 'Полный цикл обработки этой машинкой',
    note: shaft
      ? 'Вал работает на тех же стадиях, что и машинка, но только по труднодоступным зонам: кромкам, стойкам и рельефу. Основную площадь на каждой стадии по-прежнему закрывает полноразмерная машинка.'
      : sander
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
    case 'power':
      return {
        purpose: powerPurpose(p),
        scenes: powerScenes(p),
        comparison: comparison(p),
        compat: powerCompat(p),
      }
    case 'plate':
      return {
        purpose: simplePurpose(p),
        scenes: plateScenes(p).length ? plateScenes(p) : specScenes(p),
        comparison: comparison(p),
        chain: systemChain(p),
        compat: plateCompat(p),
      }
    default:
      return {
        purpose: simplePurpose(p),
        scenes: accessoryScenes(p),
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

  if (kind === 'machine' || kind === 'power') {
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
    /*
     * У насадок на гибкий вал нет ни липучки, ни подложки — общий кадр
     * «круг меняется за секунды» с текстом про липучку прямо противоречил
     * товару с хвостовиком 3 мм. Им идёт свой текст к тому же кадру поста.
     */
    out.push(
      /гибкий вал|конус/i.test(p.kind)
        ? photo(
            'pad-workshop',
            'В работе',
            'Мелкая оснастка живёт рядом с постом',
            'Конусы и цилиндры подбирают под конкретную зону: кромку, стойку, стык. Комплект из пяти штук держат на посту вместе с кругами — насадка меняется в цанге вала за несколько секунд.',
          )
        : photo(
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
    // Шлифовальная оснастка несёт абразивный диск, а не полировальный круг.
    const sanding = /шлифоваль/i.test(p.model)
    out.push(
      photo(
        'pad-workshop',
        'В работе',
        sanding
          ? 'Подложка — то, через что диск держится на машинке'
          : 'Подложка — то, через что круг держится на машинке',
        sanding
          ? 'Диаметр задан конструкцией машинки: на своей подложке диск садится ровно, не бьёт на ходу и меняется одним движением. Липучка изнашивается быстрее самой машинки — поэтому подложка идёт отдельной позицией.'
          : 'Диаметр и резьба заданы конструкцией машинки: на правильной подложке круг садится ровно, не бьёт на оборотах и меняется одним движением.',
      ),
    )
  }

  return out.filter((x): x is StoryPhoto => x !== null)
}
