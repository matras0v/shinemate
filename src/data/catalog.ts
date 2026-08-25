/**
 * Каталог ShineMate.
 *
 * Цены, артикулы и технические значения — из прайса «ShineMate РНД.xlsx»
 * (листы «Price 2025», «Price 2025 Spec», «АКБ»), дата прайса 10.10.2025.
 * Фотографии — официальные рендеры shinemate.com, сохранённые локально
 * (см. scripts/build-catalog-images.py).
 *
 * Публично показывается только РРЦ. Оптовая колонка прайса в этот файл
 * не переносилась и на сайт не выводится.
 *
 * Описания написаны по-русски на основе реальных характеристик. Ничего,
 * чего нет в исходных данных, здесь появляться не должно.
 */

export type CategoryId =
  | 'rotary'
  | 'da'
  | 'sander'
  | 'cordless'
  | 'plates'
  | 'pads'
  | 'chemistry'
  | 'workshop'

/**
 * Исполнение одной модели — один конкретный физический SKU, а не
 * склеенная строка вида "34114-9 / 34116-9 / 34117-9". Когда исполнение
 * реально различается по двум независимым осям (например, градация И
 * размер, как у кругов), их можно указать через axis1/axis2 — тогда
 * карточка товара покажет два ряда переключателей вместо плоского списка.
 */
export type Variant = {
  sku: string
  label: string
  rrp: number
  /** Первая ось выбора: градация, тип подушки и т.п. */
  axis1?: string
  /** Вторая ось выбора: размер/диаметр. */
  axis2?: string
  /**
   * Официальное фото именно этого исполнения (например, зелёный T120),
   * когда оно реально отличается от фото товара по умолчанию — иначе
   * выбор градации визуально ничего не менял, хотя цвет в тексте другой.
   */
  image?: string
  imageWidth?: number
  imageHeight?: number
}

export type Spec = { label: string; value: string }

export type Product = {
  slug: string
  model: string
  category: CategoryId
  /** Короткий подзаголовок: тип инструмента. */
  kind: string
  lead: string
  specs: Spec[]
  includes?: string[]
  variants: Variant[]
  image: string
  imageWidth: number
  imageHeight: number
  /** Выносится в раздел избранных моделей на главной. */
  featured?: boolean
  /**
   * Явный порядок внутри категории — когда порядок принципиален (например,
   * составы V-Range всегда идут V20→V40→V80→V82) и не должен зависеть от
   * случайного порядка в этом файле. По умолчанию — порядок объявления.
   */
  sortOrder?: number
}

export const priceNote = 'РРЦ по предоставленному прайсу'

export const categories: {
  id: CategoryId
  index: string
  title: string
  subtitle: string
  image: string
}[] = [
  {
    id: 'rotary',
    index: '01',
    title: 'Роторные машины',
    subtitle: 'Постоянный крутящий момент и предсказуемый съём на больших плоскостях.',
    image: 'catalog-media/ep820-thumb.webp',
  },
  {
    id: 'da',
    index: '02',
    title: 'Эксцентриковые',
    subtitle: 'Ход эксцентрика от 9 до 21 мм — от финиша до тяжёлой коррекции.',
    image: 'catalog-media/ex620-thumb.webp',
  },
  {
    id: 'sander',
    index: '03',
    title: 'Шлифовальные машины',
    subtitle: 'Подготовка поверхности под окраску и полировку.',
    image: 'catalog-media/es700-thumb.webp',
  },
  {
    id: 'cordless',
    index: '04',
    title: 'Аккумуляторные машины',
    subtitle: 'Платформы 18 В и 10,8 В: полировка и шлифование без кабеля.',
    image: 'catalog-media/eb251-thumb.webp',
  },
  {
    id: 'plates',
    index: '05',
    title: 'Подложки и адаптеры',
    subtitle: 'От 1,2" до 6", резьба M14, M8 и 5/16"-24.',
    image: 'catalog-media/plate-flexedge-thumb.webp',
  },
  {
    id: 'pads',
    index: '06',
    title: 'Полировальные круги',
    subtitle: 'Шерсть, микрофибра и поролон в градациях от T10 до T160.',
    image: 'catalog-media/foam-flat-t40-thumb.webp',
  },
  {
    id: 'chemistry',
    index: '07',
    title: 'Составы V-Range',
    subtitle: 'Абразивная линейка под роторную и эксцентриковую обработку.',
    image: 'catalog-media/v40-thumb.webp',
  },
  {
    id: 'workshop',
    index: '08',
    title: 'Аксессуары',
    subtitle: 'Хранение, транспортировка и организация рабочего места.',
    image: 'catalog-media/tool-cart-thumb.webp',
  },
]

export const categoryTitle = (id: CategoryId) =>
  categories.find((c) => c.id === id)?.title ?? ''

/**
 * Коммерческая группировка разделов для вертикальной навигации каталога —
 * та же логика, что у обычного профильного интернет-магазина: разделы не
 * плоским списком, а по смысловым блокам.
 */
export const categoryGroups: { title: string; ids: CategoryId[] }[] = [
  { title: 'Оборудование', ids: ['rotary', 'da', 'sander', 'cordless'] },
  { title: 'Оснастка', ids: ['plates', 'pads'] },
  { title: 'Химия', ids: ['chemistry'] },
  { title: 'Рабочее место', ids: ['workshop'] },
]

export const products: Product[] = [
  // ───────────────────────── Роторные машинки ─────────────────────────
  {
    slug: 'ep830',
    model: 'EP830',
    category: 'rotary',
    kind: 'Роторная машинка, бесщёточный двигатель',
    lead:
      'Бесщёточная роторная машинка для смены за сменой. Двухступенчатая передача держит момент на низких оборотах, поэтому съём остаётся ровным даже там, где обычная роторная начинает «плавать».',
    specs: [
      { label: 'Обороты', value: '700–3000 об/мин' },
      { label: 'Мощность', value: '1500 Вт (220–240 В)' },
      { label: 'Резьба', value: 'M14' },
      { label: 'Подложка', value: '6"' },
      { label: 'Двигатель', value: 'Бесщёточный' },
    ],
    includes: ['Боковая рукоять', 'Ключ', 'Опорная подложка 6"'],
    variants: [{ sku: 'EP830 6"', label: 'с подложкой 6"', rrp: 27158.6 }],
    image: 'catalog-media/ep830.webp',
    imageWidth: 396,
    imageHeight: 124,
  },
  {
    slug: 'ep820',
    model: 'EP820',
    category: 'rotary',
    kind: 'Роторная машинка',
    lead:
      'Рабочая лошадь роторной линейки под круги 6"–8". Система двойного крутящего момента позволяет вести машинку медленно и уверенно, не теряя производительности на тяжёлых участках.',
    specs: [
      { label: 'Обороты', value: '700–2500 об/мин' },
      { label: 'Мощность', value: '1050 Вт (макс. 1500 Вт)' },
      { label: 'Резьба', value: 'M14' },
      { label: 'Подложка', value: '5" (арт. 13850)' },
      { label: 'Кабель', value: '5 м' },
    ],
    includes: ['Боковая рукоять', 'Ключ', 'Комплект угольных щёток', 'Опорная подложка'],
    variants: [{ sku: 'EP820 5"', label: 'с подложкой 5"', rrp: 19900 }],
    image: 'catalog-media/ep820.webp',
    imageWidth: 700,
    imageHeight: 393,
    featured: true,
  },
  {
    slug: 'ep801-g2',
    model: 'EP801 G2',
    category: 'rotary',
    kind: 'Роторная машинка',
    lead:
      'Более лёгкий корпус под круги 4"–7". Диапазон оборотов тот же, что у старшей модели, при меньшем весе — удобно на вертикальных панелях, стойках и сложной геометрии.',
    specs: [
      { label: 'Обороты', value: '700–2500 об/мин' },
      { label: 'Мощность', value: '800 Вт (макс. 1200 Вт)' },
      { label: 'Резьба', value: 'M14' },
      { label: 'Подложка', value: '5"' },
      { label: 'Кабель', value: '5 м' },
    ],
    includes: ['Боковая рукоять', 'Ключ', 'Комплект угольных щёток', 'Подложка 5"'],
    variants: [{ sku: 'EP801 G2', label: 'с подложкой 5"', rrp: 17300 }],
    image: 'catalog-media/ep801.webp',
    imageWidth: 700,
    imageHeight: 393,
    featured: true,
  },
  {
    slug: 'ep804',
    model: 'EP804',
    category: 'rotary',
    kind: 'Точечная роторная машинка',
    lead:
      'Компактная машинка под круги 1"–3" для локальной работы: стойки, пороги, зоны у ручек и кромки. В исполнении Kit добавлены удлинители вала и круги, чтобы доставать в узкие места.',
    specs: [
      { label: 'Обороты', value: '1000–4500 об/мин' },
      { label: 'Мощность', value: '500 Вт' },
      { label: 'Резьба', value: 'M14' },
      { label: 'Подложки', value: '1,25" · 2" · 3"' },
    ],
    includes: ['Подложки 1,25", 2", 3"'],
    variants: [
      { sku: 'EP804', label: 'машинка + три подложки', rrp: 12900 },
      { sku: 'EP804 Kit', label: 'полный комплект: + удлинители вала и круги', rrp: 17100 },
    ],
    image: 'catalog-media/ep804.webp',
    imageWidth: 700,
    imageHeight: 393,
    featured: true,
  },
  {
    slug: 'mpk-3',
    model: 'MPK-3',
    category: 'rotary',
    kind: 'Гибкий вал для точечной полировки',
    lead:
      'Комплект гибкого вала под роторную машинку. Позволяет работать кругами диаметром до 27 мм там, где корпус машинки физически не проходит.',
    specs: [
      { label: 'Макс. обороты', value: '4000 об/мин' },
      { label: 'Макс. диаметр круга', value: '27 мм' },
      { label: 'Хвостовик', value: '3 мм' },
    ],
    includes: [
      'Вал, переходник и ключ',
      'Две подложки 15 и 25 мм',
      'Поролоновые круги: 20 больших и 20 малых',
      '5 конусов и 5 шариков',
      '5 больших и 5 малых шерстяных насадок',
    ],
    variants: [{ sku: 'MPK-3', label: 'комплект', rrp: 9280 }],
    image: 'catalog-media/mpk3.webp',
    imageWidth: 308,
    imageHeight: 235,
  },

  // ───────────────────── Эксцентриковые ─────────────────────
  {
    slug: 'ex620',
    model: 'EX620',
    category: 'da',
    kind: 'Эксцентриковая машинка (DA)',
    lead:
      'Самый большой ход эксцентрика в линейке. Машина закрывает площадь быстро и без риска пережечь лак, поэтому на объёмных заказах именно она обычно становится основным инструментом.',
    specs: [
      { label: 'Ход эксцентрика', value: '21 мм или 15 мм' },
      { label: 'Обороты', value: '3000–5800 об/мин' },
      { label: 'Мощность', value: '800 Вт (макс. 1200 Вт)' },
      { label: 'Резьба', value: 'M8' },
      { label: 'Кабель', value: '5 м' },
    ],
    includes: ['4 полировальных круга', 'Ключ', 'Комплект угольных щёток'],
    variants: [
      { sku: 'EX620-6/21', label: 'подложка 6", ход 21 мм', rrp: 26600 },
      { sku: 'EX620-5/15', label: 'подложка 5", ход 15 мм', rrp: 25200 },
    ],
    image: 'catalog-media/ex620.webp',
    imageWidth: 700,
    imageHeight: 393,
    featured: true,
  },
  {
    slug: 'ex605',
    model: 'EX605',
    category: 'da',
    kind: 'Эксцентриковая машинка (DA)',
    lead:
      'Универсальная DA с ходом 12 мм и подложкой 5". Сбалансирована между скоростью прохода и контролем — подходит и для коррекции, и для финишного прохода.',
    specs: [
      { label: 'Ход эксцентрика', value: '12 мм' },
      { label: 'Обороты', value: '2500–5500 об/мин' },
      { label: 'Резьба', value: 'M8' },
      { label: 'Подложка', value: '5"' },
      { label: 'Кабель', value: '5 м' },
    ],
    includes: ['2 полировальных круга', 'Ключ', 'Комплект угольных щёток'],
    variants: [{ sku: 'EX605', label: 'ход 12 мм, + 2 круга', rrp: 17900 }],
    image: 'catalog-media/ex605.webp',
    imageWidth: 700,
    imageHeight: 393,
    featured: true,
  },
  {
    slug: 'ex603',
    model: 'EX603',
    category: 'da',
    kind: 'Эксцентриковая машинка (DA)',
    lead:
      'Трёхдюймовая DA с ходом 12 мм. Меньшая подложка позволяет заходить на локальные участки, сохраняя мягкий характер эксцентриковой обработки.',
    specs: [
      { label: 'Ход эксцентрика', value: '12 мм' },
      { label: 'Обороты', value: '2500–5500 об/мин' },
      { label: 'Резьба', value: '5/16"-24' },
      { label: 'Подложка', value: '3"' },
      { label: 'Кабель', value: '5 м' },
    ],
    includes: ['2 полировальных круга', 'Ключ', 'Комплект угольных щёток'],
    variants: [{ sku: 'EX603', label: 'ход 12 мм, + 2 круга', rrp: 15400 }],
    image: 'catalog-media/ex603.webp',
    imageWidth: 700,
    imageHeight: 393,
  },
  {
    slug: 'ero600-g2',
    model: 'ERO600 G2',
    category: 'da',
    kind: 'Эксцентриковая машинка (DA)',
    lead:
      'Короткий ход 9 мм и обороты до 6500 — машинка для финиша и работы по сложному рельефу, где важнее точность, чем скорость съёма.',
    specs: [
      { label: 'Ход эксцентрика', value: '9 мм' },
      { label: 'Обороты', value: '2500–6500 об/мин' },
      { label: 'Резьба', value: 'M8' },
      { label: 'Подложка', value: '5"' },
      { label: 'Кабель', value: '5 м' },
    ],
    includes: ['1 полировальный круг', 'Ключ', 'Комплект угольных щёток', 'Подложка 5"'],
    variants: [{ sku: 'ERO600 G2', label: 'ход 9 мм, + 1 круг', rrp: 14900 }],
    image: 'catalog-media/ero600g2.webp',
    imageWidth: 700,
    imageHeight: 393,
    featured: true,
  },

  // ───────────────────── Шлифовальные машинки ─────────────────────
  {
    slug: 'es700',
    model: 'ES700',
    category: 'sander',
    kind: 'Эксцентриковая шлифовальная машинка',
    lead:
      'Шлифовальная машинка под подложку 6" со съёмным кабелем. Обороты до 10 000 позволяют быстро выравнивать поверхность перед полировкой.',
    specs: [
      { label: 'Обороты', value: '4000–10 000 об/мин' },
      { label: 'Мощность', value: '380 Вт' },
      { label: 'Подложка', value: '6" (148 мм)' },
      { label: 'Ход', value: '3 мм или 5 мм' },
      { label: 'Кабель', value: '5 м, съёмный' },
    ],
    includes: ['Ключ'],
    variants: [
      { sku: 'ES700-6/3', label: 'ход 3 мм', rrp: 26546.8 },
      { sku: 'ES700-6/5', label: 'ход 5 мм', rrp: 26546.8 },
    ],
    image: 'catalog-media/es700.webp',
    imageWidth: 700,
    imageHeight: 393,
  },
  {
    slug: 'es516',
    model: 'ES516',
    category: 'sander',
    kind: 'Эксцентриковая шлифовальная машинка',
    lead:
      'Шестидюймовая шлифовальная машинка на 400 Вт. Два исполнения по ходу эксцентрика закрывают и черновое выравнивание, и подготовку под финиш.',
    specs: [
      { label: 'Обороты', value: '4000–10 000 об/мин' },
      { label: 'Мощность', value: '400 Вт' },
      { label: 'Подложка', value: '6" (148 мм)' },
      { label: 'Резьба', value: 'M8' },
      { label: 'Кабель', value: '5 м' },
    ],
    includes: ['Комплект угольных щёток'],
    variants: [
      { sku: 'ES516-6/3', label: 'ход 3 мм', rrp: 14150 },
      { sku: 'ES516-6/5', label: 'ход 5 мм', rrp: 14150 },
    ],
    image: 'catalog-media/es516.webp',
    imageWidth: 700,
    imageHeight: 393,
  },
  {
    slug: 'es550',
    model: 'ES550',
    category: 'sander',
    kind: 'Плоскошлифовальная машинка',
    lead:
      'Длинная подошва 400×70 мм для работы по большим плоскостям: капот, крыша, борта. Держит геометрию панели там, где круглая машинка оставляет волну.',
    specs: [
      { label: 'Обороты', value: '4000–7000 об/мин' },
      { label: 'Мощность', value: '600 Вт' },
      { label: 'Подошва', value: '400 × 70 мм' },
      { label: 'Ход', value: '5 мм' },
      { label: 'Кабель', value: '5 м' },
    ],
    includes: ['Комплект угольных щёток'],
    variants: [{ sku: 'ES550', label: 'ход 5 мм', rrp: 22450 }],
    image: 'catalog-media/es550.webp',
    imageWidth: 700,
    imageHeight: 393,
  },

  // ───────────────────── Аккумуляторные машинки ─────────────────────
  {
    slug: 'eb251-5',
    model: 'EB251-5',
    category: 'cordless',
    kind: 'Аккумуляторная роторная машинка, 18 В',
    lead:
      'Роторная машинка на платформе 18 В для выездной работы и участков, где кабель мешает. Комплектуется подложкой 5" с резьбой M14 и боковой рукоятью.',
    specs: [
      { label: 'Платформа', value: '18 В' },
      { label: 'Подложка', value: '5", резьба M14' },
      { label: 'Артикул', value: '90110' },
    ],
    includes: ['Опорная подложка 5" M14', 'Боковая рукоять', 'Ключ'],
    variants: [{ sku: 'EB251-5', label: 'машинка без АКБ и зарядного', rrp: 16039.8 }],
    image: 'catalog-media/eb251.webp',
    imageWidth: 700,
    imageHeight: 393,
    featured: true,
  },
  {
    slug: 'eb351',
    model: 'EB351-5/15',
    category: 'cordless',
    kind: 'Аккумуляторная эксцентриковая машинка, 18 В',
    lead:
      'Эксцентриковая машинка 18 В с ходом 15 мм и подложкой 5". Полноразмерная DA-обработка без кабеля и без переходников.',
    specs: [
      { label: 'Платформа', value: '18 В' },
      { label: 'Ход эксцентрика', value: '15 мм' },
      { label: 'Подложка', value: '5"' },
      { label: 'Артикул', value: '90510' },
    ],
    includes: ['Опорная подложка 5"', 'Шестигранный ключ'],
    variants: [{ sku: 'EB351-5/15', label: 'машинка без АКБ и зарядного', rrp: 16332.4 }],
    image: 'catalog-media/eb351-5.webp',
    imageWidth: 700,
    imageHeight: 393,
  },
  {
    slug: 'eb350',
    model: 'EB350-3/12',
    category: 'cordless',
    kind: 'Аккумуляторная эксцентриковая машинка, 18 В',
    lead:
      'Компактная DA 18 В с подложкой 3" и ходом 12 мм — для локальной коррекции и работы по мелким деталям без питания от сети.',
    specs: [
      { label: 'Платформа', value: '18 В' },
      { label: 'Ход эксцентрика', value: '12 мм' },
      { label: 'Подложка', value: '3"' },
      { label: 'Артикул', value: '91310' },
    ],
    variants: [{ sku: 'EB350-3/12', label: 'машинка без АКБ и зарядного', rrp: 14204.4 }],
    image: 'catalog-media/eb350-3.webp',
    imageWidth: 700,
    imageHeight: 393,
  },
  {
    slug: 'eb210-kit',
    model: 'EB210 Kit',
    category: 'cordless',
    kind: 'Аккумуляторная многофункциональная машинка, 10,8 В',
    lead:
      'Одна рукоять и три сменные головки: эксцентрик с ходом 12 мм, низкооборотистая и высокооборотистая роторные. Полный комплект с двумя аккумуляторами и кейсом.',
    specs: [
      { label: 'Платформа', value: '10,8 В' },
      { label: 'Головки', value: 'DA12 · RO-L · RO-H' },
      { label: 'Подложки', value: '1,25" · 2" · 2,5"' },
      { label: 'Артикул', value: '91701' },
    ],
    includes: [
      'Три рабочие головки: DA12, RO-L, RO-H',
      'Быстросъёмные подложки 1,25", 2", 2,5"',
      'Резьбовые подложки 1,25", 2", 2,5"',
      'Зарядное BC122 и два аккумулятора B1225A',
      'Кейс TB1602',
    ],
    variants: [{ sku: 'EB210 Kit', label: 'полный комплект', rrp: 42560 }],
    image: 'catalog-media/eb210.webp',
    imageWidth: 700,
    imageHeight: 393,
  },
  {
    slug: 'eb212-eb213',
    model: 'EB212 / EB213',
    category: 'cordless',
    kind: 'Аккумуляторные машинки 10,8 В в комплекте',
    lead:
      'Готовые наборы под точечную работу: эксцентриковая EB212 и роторная EB213. Обе идут с подложкой 3", аккумулятором, зарядным и кругами в кейсе.',
    specs: [
      { label: 'Платформа', value: '10,8 В' },
      { label: 'Подложка', value: '3"' },
      { label: 'Аккумулятор', value: '2,5 А·ч' },
      { label: 'Кейс', value: 'TB1601' },
    ],
    includes: ['Подложка 3"', 'Аккумулятор 2,5 А·ч', 'Зарядное устройство', 'Шестигранный ключ'],
    variants: [
      { sku: 'EB212 KIT', label: 'эксцентриковая, + 2 поролоновых круга', rrp: 29041.88 },
      { sku: 'EB213 KIT', label: 'роторная, + 2 поролоновых и 1 шерстяной круг', rrp: 29041.88 },
    ],
    image: 'catalog-media/eb212.webp',
    imageWidth: 700,
    imageHeight: 393,
  },
  {
    slug: 'eb200a-eb201a',
    model: 'EB200A / EB201A',
    category: 'cordless',
    kind: 'Аккумуляторные шлифовальные машинки, 10,8 В',
    lead:
      'Точечное шлифование без кабеля. Наборы поставляются с подложками, набором дисков 2500 и 3000 грит, аккумулятором, зарядным и кейсом.',
    specs: [
      { label: 'Платформа', value: '10,8 В' },
      { label: 'Ход эксцентрика', value: '3 мм или 5 мм' },
      { label: 'Подложка', value: '1,25" или 3"' },
      { label: 'Аккумулятор', value: '2,5 А·ч' },
    ],
    includes: ['Аккумулятор 2,5 А·ч', 'Зарядное устройство', 'Диски 2500# и 3000#', 'Кейс'],
    variants: [
      { sku: 'EB200A KIT', label: 'ход 3 мм, две подложки 1,25"', rrp: 24934.84 },
      { sku: 'EB201A-1/3 KIT', label: 'ход 3 мм, подложки 1,25"', rrp: 24083.64 },
      { sku: 'EB201A-1/5 KIT', label: 'ход 5 мм, подложки 1,25"', rrp: 24083.64 },
      { sku: 'EB201A-3/3 KIT', label: 'ход 3 мм, подложка 3"', rrp: 23934.68 },
      { sku: 'EB201A-3/5 KIT', label: 'ход 5 мм, подложка 3"', rrp: 23934.68 },
    ],
    image: 'catalog-media/eb200a.webp',
    imageWidth: 700,
    imageHeight: 393,
  },
  {
    slug: 'eb202a',
    model: 'EB202A',
    category: 'cordless',
    kind: 'Аккумуляторная роторная шлифмашинка, 10,8 В',
    lead:
      'Роторное исполнение аккумуляторной шлифмашинки с подложкой Roll Lock 2". Поставляется набором с аккумулятором 5,0 А·ч и дисками.',
    specs: [
      { label: 'Платформа', value: '10,8 В' },
      { label: 'Подложка', value: '2", Roll Lock' },
      { label: 'Аккумулятор', value: '5,0 А·ч' },
    ],
    includes: ['Аккумулятор 5,0 А·ч', 'Зарядное устройство', '6 шлифовальных дисков Roll Lock', 'Ключ', 'Кейс'],
    variants: [{ sku: 'EB202A KIT', label: 'полный комплект', rrp: 22032.78 }],
    image: 'catalog-media/eb200a.webp',
    imageWidth: 700,
    imageHeight: 393,
  },
  {
    slug: 'battery-18v',
    model: 'Аккумуляторы 18 В',
    category: 'cordless',
    kind: 'Литий-ионные аккумуляторы платформы 18 В',
    lead:
      'Сменный аккумулятор для всей проводной-без-провода линейки EB на 18 В: один и тот же блок питания подходит и к роторной EB251-5, и к эксцентриковым EB350/EB351. Держите один-два запасных в кейсе — и машинка не встанет посреди смены на подзарядке.',
    specs: [
      { label: 'Напряжение', value: '18 В' },
      { label: 'Ёмкость', value: '2,5 А·ч или 5,0 А·ч' },
    ],
    variants: [
      { sku: 'B1825A', label: '18 В, 2,5 А·ч', rrp: 8033.2 },
      { sku: 'B1850A', label: '18 В, 5,0 А·ч', rrp: 13087.2 },
    ],
    image: 'catalog-media/battery-18v.webp',
    imageWidth: 700,
    imageHeight: 393,
  },
  {
    slug: 'battery-108v',
    model: 'Аккумуляторы 10,8 В',
    category: 'cordless',
    kind: 'Литий-ионные аккумуляторы платформы 10,8 В',
    lead:
      'Сменный аккумулятор платформы 10,8 В — общий для компактных EB210, EB212, EB213 и шлифовальных EB200A/EB201A/EB202A. Удобно держать запасной блок под рукой на точечных задачах, где машинка не снимается с руки по десять минут подряд.',
    specs: [
      { label: 'Напряжение', value: '10,8 В' },
      { label: 'Ёмкость', value: '2,5 А·ч или 5,0 А·ч' },
    ],
    variants: [
      { sku: 'B1225A', label: '10,8 В, 2,5 А·ч', rrp: 5681.76 },
      { sku: 'B1250A', label: '10,8 В, 5,0 А·ч', rrp: 7769.86 },
    ],
    image: 'catalog-media/battery-108v.webp',
    imageWidth: 700,
    imageHeight: 393,
  },
  {
    slug: 'chargers',
    model: 'Зарядные устройства',
    category: 'cordless',
    kind: 'Зарядные устройства для платформ 18 В и 10,8 В',
    lead:
      'Быстрая зарядка для обеих аккумуляторных платформ, включая двухканальное устройство для одновременной зарядки двух батарей.',
    specs: [
      { label: 'Вход', value: '100–240 В переменного тока' },
      { label: 'Выход', value: '18 В постоянного тока' },
    ],
    variants: [
      { sku: 'BC181', label: '18 В, 4 А', rrp: 4575.2 },
      { sku: 'BC121', label: '10,8 В, 3 А', rrp: 4067.14 },
      { sku: 'BC122', label: '10,8 В, 3 А × 2 канала', rrp: 8831.2 },
    ],
    image: 'catalog-media/charger-18v.webp',
    imageWidth: 700,
    imageHeight: 393,
  },

  // ───────────────────── Подложки и адаптеры ─────────────────────
  {
    slug: 'plates-rotary',
    model: 'Подложки для роторных машин',
    category: 'plates',
    kind: 'Опорные подложки, резьба M14',
    lead:
      'Линейка подложек под роторные машины от 1,2" до 6". Версии 5" и 6" идут с чёрным поролоновым слоем, который гасит вибрацию на больших кругах.',
    specs: [
      { label: 'Резьба', value: 'M14' },
      { label: 'Крепление', value: 'Липучка' },
      { label: 'Диаметры', value: 'от 30 до 148 мм' },
    ],
    variants: [
      { sku: '14212-24', label: '1,2" (30 мм)', rrp: 440 },
      { sku: '14220-24', label: '2" (48 мм)', rrp: 470 },
      { sku: '14231-24', label: '3" (74 мм)', rrp: 510 },
      { sku: '13850-2', label: '5" (123 мм), чёрный поролон', rrp: 900 },
      { sku: '13860-2', label: '6" (148 мм), чёрный поролон', rrp: 1150 },
    ],
    image: 'catalog-media/plate-flexedge.webp',
    imageWidth: 700,
    imageHeight: 393,
  },
  {
    slug: 'plates-da',
    model: 'Подложки для эксцентриковых машин',
    category: 'plates',
    kind: 'Опорные подложки для серии EX',
    lead:
      'Подложки под DA-машины. Резьба и вес подобраны под конкретные модели, поэтому баланс машины не нарушается.',
    specs: [
      { label: 'Резьба', value: 'M8 и 5/16"-24' },
      { label: 'Диаметры', value: '74 · 123 · 148 мм' },
    ],
    variants: [
      { sku: '23731-04', label: '3" (74 мм), 5/16"-24, 40 г — для EX603', rrp: 650 },
      { sku: '23854-04', label: '5" (123 мм), M8, 110 г — для машин EX 5"', rrp: 1280 },
      { sku: '23465-04', label: '6" (148 мм), M8, 134 г — для машин EX 6"', rrp: 1570 },
    ],
    image: 'catalog-media/plate-multihole.webp',
    imageWidth: 700,
    imageHeight: 393,
  },
  {
    slug: 'plates-sander',
    model: 'Подложки для шлифовальных машин',
    category: 'plates',
    kind: 'Опорные подложки для серии ES',
    lead: 'Сменные подложки для шлифовальных машин ES516, ES526, ES502 и ES700.',
    specs: [{ label: 'Диаметры', value: '123 и 148 мм' }],
    variants: [
      { sku: '23651-02', label: '5" (123 мм)', rrp: 1729 },
      { sku: '23665-04', label: '6" (148 мм)', rrp: 1729 },
    ],
    image: 'catalog-media/plate-sanding.webp',
    imageWidth: 700,
    imageHeight: 393,
  },
  {
    slug: 'adaptors-shafts',
    model: 'Адаптеры и удлинители вала',
    category: 'plates',
    kind: 'Переходники для точечной работы',
    lead:
      'Полый удлинитель вала выносит круг вперёд, не добавляя лишнего веса на кисть. Адаптер расширяет пятидюймовую роторную машину под круг 6".',
    specs: [
      { label: 'Резьба удлинителя', value: 'M14 внутренняя и внешняя' },
      { label: 'Длины', value: '40 и 80 мм' },
    ],
    variants: [
      { sku: 'ETS-40-14', label: 'удлинитель вала 40 мм', rrp: 800 },
      { sku: 'ETS-80-14', label: 'удлинитель вала 80 мм', rrp: 1000 },
      { sku: '75061', label: 'адаптер 6" (148 мм) для круга 5"', rrp: 725 },
    ],
    image: 'catalog-media/plate-flexedge-small.webp',
    imageWidth: 700,
    imageHeight: 393,
  },

  // ───────────────────── Полировальные круги ─────────────────────
  {
    slug: 'foam-flat',
    model: 'Поролоновые круги Flat-face',
    category: 'pads',
    kind: 'Плоские поролоновые круги, пять градаций',
    lead:
      'Плоская рабочая поверхность даёт равномерное пятно контакта. Пять градаций от T120 до T10 закрывают весь цикл: от тяжёлой коррекции до финиша.',
    specs: [
      { label: 'Градации', value: 'T120 · T80 · T60 · T40 · T10' },
      { label: 'Размеры', value: '4" · 6" · 7" (100 · 150 · 180 мм)' },
      { label: 'Толщина', value: '25 мм' },
      { label: 'Центральное отверстие', value: '22 мм у 6" и 7"' },
    ],
    variants: [
      { sku: '34124-9', label: 'зелёный, тяжёлый рез', rrp: 635, axis1: 'T120', axis2: '4"', image: 'catalog-media/foam-flat-t120.webp', imageWidth: 671, imageHeight: 473 },
      { sku: '34126-9', label: 'зелёный, тяжёлый рез', rrp: 635, axis1: 'T120', axis2: '6"', image: 'catalog-media/foam-flat-t120.webp', imageWidth: 671, imageHeight: 473 },
      { sku: '34127-9', label: 'зелёный, тяжёлый рез', rrp: 635, axis1: 'T120', axis2: '7"', image: 'catalog-media/foam-flat-t120.webp', imageWidth: 671, imageHeight: 473 },
      { sku: '34124-1', label: 'жёлтый, сильный рез', rrp: 635, axis1: 'T80', axis2: '4"', image: 'catalog-media/foam-flat-t80.webp', imageWidth: 632, imageHeight: 452 },
      { sku: '34126-1', label: 'жёлтый, сильный рез', rrp: 635, axis1: 'T80', axis2: '6"', image: 'catalog-media/foam-flat-t80.webp', imageWidth: 632, imageHeight: 452 },
      { sku: '34127-1', label: 'жёлтый, сильный рез', rrp: 635, axis1: 'T80', axis2: '7"', image: 'catalog-media/foam-flat-t80.webp', imageWidth: 632, imageHeight: 452 },
      { sku: '34124-6', label: 'синий, средний рез', rrp: 635, axis1: 'T60', axis2: '4"', image: 'catalog-media/foam-flat-t60.webp', imageWidth: 641, imageHeight: 467 },
      { sku: '34126-6', label: 'синий, средний рез', rrp: 635, axis1: 'T60', axis2: '6"', image: 'catalog-media/foam-flat-t60.webp', imageWidth: 641, imageHeight: 467 },
      { sku: '34127-6', label: 'синий, средний рез', rrp: 635, axis1: 'T60', axis2: '7"', image: 'catalog-media/foam-flat-t60.webp', imageWidth: 641, imageHeight: 467 },
      { sku: '34124-4', label: 'оранжевый, лёгкий рез', rrp: 635, axis1: 'T40', axis2: '4"' },
      { sku: '34126-4', label: 'оранжевый, лёгкий рез', rrp: 635, axis1: 'T40', axis2: '6"' },
      { sku: '34127-4', label: 'оранжевый, лёгкий рез', rrp: 635, axis1: 'T40', axis2: '7"' },
      { sku: '34124-7', label: 'красный, финиш', rrp: 635, axis1: 'T10', axis2: '4"', image: 'catalog-media/foam-flat-t10.webp', imageWidth: 630, imageHeight: 465 },
      { sku: '34126-7', label: 'красный, финиш', rrp: 635, axis1: 'T10', axis2: '6"', image: 'catalog-media/foam-flat-t10.webp', imageWidth: 630, imageHeight: 465 },
      { sku: '34127-7', label: 'красный, финиш', rrp: 635, axis1: 'T10', axis2: '7"', image: 'catalog-media/foam-flat-t10.webp', imageWidth: 630, imageHeight: 465 },
    ],
    image: 'catalog-media/foam-flat-t40.webp',
    imageWidth: 700,
    imageHeight: 393,
  },
  {
    slug: 'foam-diamond',
    model: 'Поролоновые круги Black Diamond',
    category: 'pads',
    kind: 'Рельефные поролоновые круги, пять градаций',
    lead:
      'Рельефная ячеистая поверхность лучше отводит тепло и распределяет пасту. Те же пять градаций, что и у плоской линейки.',
    specs: [
      { label: 'Градации', value: 'T120 · T80 · T60 · T40 · T10' },
      { label: 'Размеры', value: '4" · 6" · 7" (100 · 150 · 180 мм)' },
      { label: 'Толщина', value: '25 мм' },
      { label: 'Центральное отверстие', value: '22 мм у 6" и 7"' },
    ],
    variants: [
      { sku: '34114-9', label: 'зелёный, тяжёлый рез', rrp: 635, axis1: 'T120', axis2: '4"', image: 'catalog-media/foam-diamond-t120.webp', imageWidth: 603, imageHeight: 415 },
      { sku: '34116-9', label: 'зелёный, тяжёлый рез', rrp: 635, axis1: 'T120', axis2: '6"', image: 'catalog-media/foam-diamond-t120.webp', imageWidth: 603, imageHeight: 415 },
      { sku: '34117-9', label: 'зелёный, тяжёлый рез', rrp: 635, axis1: 'T120', axis2: '7"', image: 'catalog-media/foam-diamond-t120.webp', imageWidth: 603, imageHeight: 415 },
      { sku: '34114-1', label: 'жёлтый, сильный рез', rrp: 635, axis1: 'T80', axis2: '4"', image: 'catalog-media/foam-diamond-t80.webp', imageWidth: 629, imageHeight: 418 },
      { sku: '34116-1', label: 'жёлтый, сильный рез', rrp: 635, axis1: 'T80', axis2: '6"', image: 'catalog-media/foam-diamond-t80.webp', imageWidth: 629, imageHeight: 418 },
      { sku: '34117-1', label: 'жёлтый, сильный рез', rrp: 635, axis1: 'T80', axis2: '7"', image: 'catalog-media/foam-diamond-t80.webp', imageWidth: 629, imageHeight: 418 },
      { sku: '34114-6', label: 'синий, средний рез', rrp: 635, axis1: 'T60', axis2: '4"' },
      { sku: '34116-6', label: 'синий, средний рез', rrp: 635, axis1: 'T60', axis2: '6"' },
      { sku: '34117-6', label: 'синий, средний рез', rrp: 635, axis1: 'T60', axis2: '7"' },
      { sku: '34114-4', label: 'оранжевый, лёгкий рез', rrp: 635, axis1: 'T40', axis2: '4"', image: 'catalog-media/foam-diamond-t40.webp', imageWidth: 629, imageHeight: 416 },
      { sku: '34116-4', label: 'оранжевый, лёгкий рез', rrp: 635, axis1: 'T40', axis2: '6"', image: 'catalog-media/foam-diamond-t40.webp', imageWidth: 629, imageHeight: 416 },
      { sku: '34117-4', label: 'оранжевый, лёгкий рез', rrp: 635, axis1: 'T40', axis2: '7"', image: 'catalog-media/foam-diamond-t40.webp', imageWidth: 629, imageHeight: 416 },
      { sku: '34114-7', label: 'красный, финиш', rrp: 635, axis1: 'T10', axis2: '4"', image: 'catalog-media/foam-diamond-t10.webp', imageWidth: 690, imageHeight: 460 },
      { sku: '34116-7', label: 'красный, финиш', rrp: 635, axis1: 'T10', axis2: '6"', image: 'catalog-media/foam-diamond-t10.webp', imageWidth: 690, imageHeight: 460 },
      { sku: '34117-7', label: 'красный, финиш', rrp: 635, axis1: 'T10', axis2: '7"', image: 'catalog-media/foam-diamond-t10.webp', imageWidth: 690, imageHeight: 460 },
    ],
    image: 'catalog-media/foam-diamond-t60.webp',
    imageWidth: 700,
    imageHeight: 393,
  },
  {
    slug: 'wool-high-nap',
    model: 'Шерстяные круги с высоким ворсом',
    category: 'pads',
    kind: 'Шерсть для реза',
    lead:
      'Высокий ворс снимает быстрее поролона и меньше греет лак. Версия с подушкой 6 мм работает и на роторной, и на эксцентриковой машине.',
    specs: [
      { label: 'Диаметры', value: '84 · 130–134 · 155–159 мм' },
      { label: 'Подложки', value: '3" · 5" · 6"' },
      { label: 'Подушка', value: 'без подушки или 6 мм' },
    ],
    variants: [
      { sku: '41130', label: 'только роторные', rrp: 450, axis1: 'Без подушки', axis2: '84 мм' },
      { sku: '41150', label: 'только роторные', rrp: 450, axis1: 'Без подушки', axis2: '130 мм' },
      { sku: '41160', label: 'только роторные', rrp: 450, axis1: 'Без подушки', axis2: '155 мм' },
      { sku: '41935-A', label: 'роторные и DA', rrp: 550, axis1: 'Подушка 6 мм', axis2: '84 мм' },
      { sku: '41955-A', label: 'роторные и DA', rrp: 550, axis1: 'Подушка 6 мм', axis2: '134 мм' },
      { sku: '41965-A', label: 'роторные и DA', rrp: 550, axis1: 'Подушка 6 мм', axis2: '159 мм' },
    ],
    image: 'catalog-media/wool-t130.webp',
    imageWidth: 700,
    imageHeight: 393,
  },
  {
    slug: 'wool-short-nap',
    model: 'Шерстяные круги с коротким ворсом',
    category: 'pads',
    kind: 'Полосатая шерсть для реза',
    lead:
      'Короткий полосатый ворс режет агрессивнее и оставляет более предсказуемый след. Скошенная подушка 8 или 20 мм подбирается под тип машины.',
    specs: [
      { label: 'Диаметры', value: '84 · 134 · 159 мм' },
      { label: 'Подушка', value: 'скос 8 мм или 20 мм' },
      { label: 'Центральное отверстие', value: '22 мм у 134 и 159 мм' },
    ],
    variants: [
      { sku: '41735', label: 'роторные и DA', rrp: 490, axis1: 'Скос 8 мм', axis2: '84 мм', image: 'catalog-media/wool-short-red.webp', imageWidth: 616, imageHeight: 505 },
      { sku: '41755', label: 'роторные и DA', rrp: 490, axis1: 'Скос 8 мм', axis2: '134 мм', image: 'catalog-media/wool-short-red.webp', imageWidth: 616, imageHeight: 505 },
      { sku: '41765', label: 'роторные и DA', rrp: 490, axis1: 'Скос 8 мм', axis2: '159 мм', image: 'catalog-media/wool-short-red.webp', imageWidth: 616, imageHeight: 505 },
      { sku: '41340-7', label: 'только роторные', rrp: 550, axis1: 'Скос 20 мм', axis2: '84 мм', image: 'catalog-media/wool-short-blue.webp', imageWidth: 682, imageHeight: 469 },
      { sku: '41362-7', label: 'только роторные', rrp: 550, axis1: 'Скос 20 мм', axis2: '134 мм', image: 'catalog-media/wool-short-blue.webp', imageWidth: 682, imageHeight: 469 },
      { sku: '41372-7', label: 'только роторные', rrp: 550, axis1: 'Скос 20 мм', axis2: '159 мм', image: 'catalog-media/wool-short-blue.webp', imageWidth: 682, imageHeight: 469 },
    ],
    // Прежний дефолт (wool-t160) был фото пушистого нестриженого круга —
    // не совпадало с собственным описанием товара («полосатая шерсть»).
    // Оба новых фото — настоящие рендеры полосатой шерсти этой линейки.
    image: 'catalog-media/wool-short-red.webp',
    imageWidth: 616,
    imageHeight: 505,
  },
  {
    slug: 'microfiber',
    model: 'Микрофибровые круги',
    category: 'pads',
    kind: 'Микрофибра для DA-машин',
    lead:
      'Микрофибра даёт рез, близкий к шерсти, но оставляет более чистую поверхность. T100 — под коррекцию, T20 — под полировку и финиш.',
    specs: [
      { label: 'Градации', value: 'T100 и T20' },
      { label: 'Диаметры', value: '84–90 · 134–140 · 159–165 мм' },
      { label: 'Подушка', value: '6 мм прямая или 12 мм скос' },
    ],
    variants: [
      { sku: '41835', label: 'рез', rrp: 490, axis1: 'T100', axis2: '84 мм', image: 'catalog-media/microfiber-t100.webp', imageWidth: 660, imageHeight: 464 },
      { sku: '41855', label: 'рез', rrp: 490, axis1: 'T100', axis2: '134 мм', image: 'catalog-media/microfiber-t100.webp', imageWidth: 660, imageHeight: 464 },
      { sku: '41865', label: 'рез', rrp: 490, axis1: 'T100', axis2: '159 мм', image: 'catalog-media/microfiber-t100.webp', imageWidth: 660, imageHeight: 464 },
      { sku: '41236', label: 'полировка и финиш', rrp: 460, axis1: 'T20', axis2: '90 мм', image: 'catalog-media/microfiber-t20.webp', imageWidth: 621, imageHeight: 454 },
      { sku: '41255', label: 'полировка и финиш', rrp: 460, axis1: 'T20', axis2: '140 мм', image: 'catalog-media/microfiber-t20.webp', imageWidth: 621, imageHeight: 454 },
      { sku: '41265', label: 'полировка и финиш', rrp: 460, axis1: 'T20', axis2: '165 мм', image: 'catalog-media/microfiber-t20.webp', imageWidth: 621, imageHeight: 454 },
    ],
    image: 'catalog-media/microfiber-t100.webp',
    imageWidth: 700,
    imageHeight: 393,
  },
  {
    slug: 'spot-pads',
    model: 'Насадки для точечной полировки',
    category: 'pads',
    kind: 'Конусы и шарики под гибкий вал',
    lead:
      'Комплекты конусов и цилиндров с хвостовиком 3 мм для гибкого вала: кромки, стойки, рельеф и другие места, куда не заходит круг.',
    specs: [
      { label: 'Размер', value: 'D28 × H30 мм' },
      { label: 'Хвостовик', value: '3 мм' },
      { label: 'В комплекте', value: '5 шт.' },
    ],
    variants: [
      { sku: '48010-1X5', label: 'конусы, жёлтый T80', rrp: 580 },
      { sku: '48010-7X5', label: 'конусы, красный T10', rrp: 580 },
      { sku: '48310-1X5', label: 'цилиндры, жёлтый T80', rrp: 580 },
    ],
    // Отдельного официального фото самих конусов/цилиндров без машины в
    // выгрузке вендора нет — прежний дефолт (foam-flat-t80) показывал
    // вообще другой товар, плоский диск. Фото гибкого вала MPK-3 с
    // насаженным конусом на конце — тот же официальный рендер, где хотя бы
    // виден конус, а не постороннее изделие.
    image: 'catalog-media/mpk3.webp',
    imageWidth: 308,
    imageHeight: 235,
  },

  // ───────────────────── Составы V-Range ─────────────────────
  // Четыре реально разных состава под разные этапы обработки — раньше были
  // собраны в одну карточку как "исполнения", хотя это не варианты одного
  // товара (как размер круга), а разные позиции с разными задачами и ценой.
  // В таком виде раздел на витрине выглядел как один товар вместо четырёх.
  // Порядок закреплён явным sortOrder (V20→V40→V80→V82), а не позицией в
  // этом файле. Описания — по официальным материалам ShineMate (см. PDF),
  // а не дословный машинный перевод.
  {
    slug: 'v20-final-finish',
    model: 'V20 Final Finish',
    category: 'chemistry',
    kind: 'Абразивная паста, финиш, 500 мл',
    lead: 'Финишный состав линейки V-Range — снимает мельчайшие царапины, блики и хромовые дефекты после шлифовки диском 2500 и восстанавливает глубокий чистый глянец. Работает без пыли, с мягкими пенопластовыми подложками или микрофиброй — подходит и для ручной, и для машинной полировки.',
    specs: [
      { label: 'Объём', value: '500 мл' },
      { label: 'Тип', value: 'Финиш' },
      { label: 'Совместимость', value: 'Мягкие поролоновые подложки, микрофибра' },
    ],
    variants: [{ sku: '001320', label: '500 мл', rrp: 2800 }],
    image: 'catalog-media/v20.webp',
    imageWidth: 475,
    imageHeight: 617,
    sortOrder: 10,
  },
  {
    slug: 'v40-medium-polish',
    model: 'V40 Medium Polish',
    category: 'chemistry',
    kind: 'Абразивная паста, средний рез, 500 мл',
    lead: 'Среднеабразивный состав линейки V-Range для одностадийной обработки — снимает лёгкое окисление, царапины и голограммы, быстро убирает следы шлифовки диском 2000 зернистости и оставляет высокий глянец за один проход. Работает с подложками средней жёсткости T20–T60 или финишными подложками, почти без пыли.',
    specs: [
      { label: 'Объём', value: '500 мл' },
      { label: 'Тип', value: 'Средний рез, одна стадия' },
      { label: 'Совместимость', value: 'Подложки T20–T60, финишные подложки' },
    ],
    variants: [{ sku: '001315', label: '500 мл', rrp: 2580 }],
    image: 'catalog-media/v40.webp',
    imageWidth: 484,
    imageHeight: 628,
    sortOrder: 20,
  },
  {
    slug: 'v80-heavy-cut',
    model: 'V80 Heavy-Cut',
    category: 'chemistry',
    kind: 'Абразивная паста, тяжёлый рез, 500 мл',
    lead: 'Состав тяжёлого реза линейки V-Range — быстро снимает серьёзные царапины, окисление и оранжевую корку, убирает следы шлифовки диском 1500 зернистости перед более мягкими этапами полировки. Работает с подложками из вощёной пены T80–T240 или шерстяными, почти без пыли.',
    specs: [
      { label: 'Объём', value: '500 мл' },
      { label: 'Тип', value: 'Тяжёлый рез' },
      { label: 'Совместимость', value: 'Подложки T80–T240, шерсть' },
    ],
    variants: [{ sku: '001310', label: '500 мл', rrp: 2180 }],
    image: 'catalog-media/v80.webp',
    imageWidth: 481,
    imageHeight: 630,
    sortOrder: 30,
  },
  {
    slug: 'v82-fast-polish',
    model: 'V82 Fast Polish',
    category: 'chemistry',
    kind: 'Абразивная паста, быстрая полировка, 500 мл',
    lead: 'Быстрый одностадийный состав линейки V-Range с высоким глянцевым эффектом — снимает тяжёлое окисление, царапины и оранжевую корку за один проход, без отдельного финиша, для задач, где время дороже идеальной глубины реза. Работает с подложками из вощёной пены T40–T240 или шерстяными, без пыли.',
    specs: [
      { label: 'Объём', value: '500 мл' },
      { label: 'Тип', value: 'Быстрая полировка, одна стадия' },
      { label: 'Совместимость', value: 'Подложки T40–T240, шерсть' },
    ],
    variants: [{ sku: '001305', label: '500 мл', rrp: 2800 }],
    image: 'catalog-media/v82.webp',
    imageWidth: 478,
    imageHeight: 609,
    sortOrder: 40,
  },

  // ───────────────────── Аксессуары ─────────────────────
  {
    slug: 'tool-cart',
    model: 'Пост полировщика TC026',
    category: 'workshop',
    kind: 'Мобильная тележка для инструмента',
    lead:
      'Мобильный пост под весь инструмент и расходники: машины, круги, составы и оснастка собраны в одном месте и переезжают вместе с работой.',
    specs: [{ label: 'Артикул', value: 'TC026' }],
    variants: [{ sku: 'TC026', label: 'тележка в сборе', rrp: 48150 }],
    image: 'catalog-media/tool-cart.webp',
    imageWidth: 472,
    imageHeight: 606,
  },
  {
    slug: 'tool-bags',
    model: 'Сумки для инструмента',
    category: 'workshop',
    kind: 'Сумка детейлера',
    lead:
      'Усиленные сумки для машины, подложек, кругов и мелкой оснастки — чтобы всё нужное на выезд помещалось в одно место и не гремело по багажнику. Два размера: 18" под компактный набор, 20" под полный комплект с запасными кругами и составами.',
    specs: [{ label: 'Размеры', value: '18" и 20"' }],
    variants: [
      { sku: 'TB1801', label: 'сумка 18"', rrp: 4250 },
      { sku: 'TB2001', label: 'сумка 20"', rrp: 4580 },
    ],
    image: 'catalog-media/tool-bag.webp',
    imageWidth: 700,
    imageHeight: 486,
  },
  {
    slug: 'polisher-holders',
    model: 'Держатели машин',
    category: 'workshop',
    kind: 'Настенное и панельное крепление',
    lead:
      'Машина висит на своём месте, а не лежит на крыле. Полноразмерный держатель крепится на стену, компактный — на перфопанель.',
    specs: [{ label: 'Крепление', value: 'стена или перфопанель' }],
    variants: [
      { sku: 'UPH-01', label: 'полноразмерный, настенный', rrp: 2250 },
      { sku: 'UPH-05', label: 'компактный, на перфопанель', rrp: 1150 },
    ],
    image: 'catalog-media/polisher-hanger.webp',
    imageWidth: 491,
    imageHeight: 631,
  },
  {
    slug: 'wash-kit',
    model: 'Мойка и подготовка',
    category: 'workshop',
    kind: 'Вёдра, сепараторы, микрофибра',
    lead:
      'Сепаратор задерживает песок на дне ведра, поэтому грязь не возвращается на кузов и не добавляет рисок перед полировкой.',
    specs: [{ label: 'Объём ведра', value: '20 л' }],
    variants: [
      { sku: 'GS263-BK', label: 'сепаратор грязи, чёрный', rrp: 550, image: 'catalog-media/grit-separator.webp', imageWidth: 700, imageHeight: 360 },
      { sku: 'GS263-GY', label: 'сепаратор грязи, серый', rrp: 550, image: 'catalog-media/grit-separator.webp', imageWidth: 700, imageHeight: 360 },
      { sku: 'Bucket-20L', label: 'ведро 20 л', rrp: 1930, image: 'catalog-media/bucket.webp', imageWidth: 490, imageHeight: 653 },
      { sku: 'TW4030GO', label: 'микрофибра 40×30 см, 2 шт.', rrp: 500, image: 'catalog-media/towel.webp', imageWidth: 597, imageHeight: 384 },
      { sku: 'TW4040B', label: 'микрофибра 40×40 см, 5 шт.', rrp: 1100, image: 'catalog-media/towel.webp', imageWidth: 597, imageHeight: 384 },
    ],
    image: 'catalog-media/grit-separator.webp',
    imageWidth: 700,
    imageHeight: 360,
  },
]

/** Модели, вынесенные на главную страницу. */
export const featured = products.filter((p) => p.featured)

/**
 * Порядок внутри категории — explicit sortOrder (когда он важен, как у
 * V-Range), а не случайный порядок объявления в файле. Array.sort стабилен,
 * поэтому товары без sortOrder (сравниваются как 0 === 0) сохраняют
 * порядок объявления между собой.
 */
export const productsByCategory = (id: CategoryId) =>
  products.filter((p) => p.category === id).sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))

export const countByCategory = (id: CategoryId) =>
  products
    .filter((p) => p.category === id)
    .reduce((total, p) => total + p.variants.length, 0)

/** Минимальная РРЦ среди исполнений — для подписи «от …». */
export const minPrice = (p: Product) => {
  const value = Math.min(...p.variants.map((v) => v.rrp))
  return Number.isFinite(value) ? value : null
}

/** «1 вариант / 2 варианта / 5 вариантов» — русское склонение по числу. */
export const variantsLabel = (count: number) => {
  const mod10 = count % 10
  const mod100 = count % 100
  const word =
    mod10 === 1 && mod100 !== 11
      ? 'вариант'
      : [2, 3, 4].includes(mod10) && ![12, 13, 14].includes(mod100)
        ? 'варианта'
        : 'вариантов'
  return `${count} ${word}`
}

/**
 * Соседние модели той же категории, ближайшие по цене — как в магазине,
 * где рядом с товаром стоят реальные альтернативы, а не случайный набор.
 * Ничего не придумывается: и состав, и подписи ниже читаются из тех же
 * полей, что уже есть в карточке товара.
 */
export const getRelatedProducts = (product: Product, max = 3): Product[] => {
  const base = minPrice(product) ?? 0
  return productsByCategory(product.category)
    .filter((p) => p.slug !== product.slug)
    .sort((a, b) => Math.abs((minPrice(a) ?? 0) - base) - Math.abs((minPrice(b) ?? 0) - base))
    .slice(0, max)
}

/** Короткая, честная причина посмотреть на альтернативу — только из реальных полей. */
export const relatedNote = (candidate: Product, current: Product) => {
  const a = minPrice(candidate)
  const b = minPrice(current)
  if (a != null && b != null && a !== b) return a < b ? 'Дешевле' : 'Дороже'
  if (candidate.kind !== current.kind) return candidate.kind
  return categoryTitle(candidate.category)
}

const money = (fractionDigits: number) =>
  new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  })

const whole = money(0)
const kopecks = money(2)

/** Копейки показываются только у тех позиций, где они есть в прайсе. */
export const formatPrice = (value: number) =>
  Number.isInteger(value) ? whole.format(value) : kopecks.format(value)

/** Честный текст вместо «0 ₽», если у позиции по какой-то причине нет цены. */
export const formatPriceOrInquire = (value: number | null) =>
  value === null ? 'Цена по запросу' : formatPrice(value)

export const totalSkus = products.reduce((n, p) => n + p.variants.length, 0)

/** Крупные значения для инженерной сцены — всё взято из карточек выше. */
export const engineeringFacts: { value: string; unit: string; caption: string }[] = [
  { value: '3000', unit: 'об/мин', caption: 'Верхний предел бесщёточной EP830 при 1500 Вт' },
  { value: '21', unit: 'мм', caption: 'Максимальный ход эксцентрика — EX620-6/21' },
  { value: '10 000', unit: 'об/мин', caption: 'Верхний предел шлифовальных ES516 и ES700' },
  { value: '400×70', unit: 'мм', caption: 'Подошва плоскошлифовальной ES550' },
  { value: '18', unit: 'В', caption: 'Аккумуляторная платформа линейки EB' },
  { value: '5', unit: 'м', caption: 'Длина сетевого кабеля на всей проводной линейке' },
]

export type SortOrder = 'recommended' | 'price-asc' | 'price-desc' | 'alpha'

/**
 * Курируемый порядок каталога — explicit sortOrder, где он задан (V-Range
 * обязан идти V20→V40→V80→V82), иначе порядок объявления в файле. Array.sort
 * стабилен: товары без sortOrder (0 === 0) не меняются местами друг с другом.
 */
export function sortProducts(list: Product[], order: SortOrder): Product[] {
  if (order === 'recommended') {
    return [...list].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
  }
  const withPrice = (p: Product) => minPrice(p) ?? Number.POSITIVE_INFINITY
  const sorted = [...list]
  if (order === 'price-asc') sorted.sort((a, b) => withPrice(a) - withPrice(b))
  else if (order === 'price-desc') sorted.sort((a, b) => withPrice(b) - withPrice(a))
  else sorted.sort((a, b) => a.model.localeCompare(b.model, 'ru'))
  return sorted
}

/**
 * Клиентский поиск по 40 товарным карточкам и 113 артикулам.
 *
 * Индекс строится один раз при загрузке модуля: для внешнего API это простой
 * substring-match по названию, артикулам, типу и разделу — при таком объёме
 * данных полноценный fuzzy-поисковый движок был бы избыточен, а substring
 * уже покрывает и «EP830», и «аккумулятор», и «V80».
 */
const searchIndex = products.map((product) => {
  const haystack = [
    product.model,
    product.kind,
    categoryTitle(product.category),
    ...product.variants.map((v) => v.sku),
  ]
    .join(' ')
    .toLowerCase()
  // Числовые токены (например «4», «9» — обрезки артикулов вроде «34124-4»)
  // исключены из words: у них нет падежных окончаний, а короткое числовое
  // совпадение в sharesStem (startsWith при длине < 3) превращало любой
  // запрос вроде «41130» в совпадение с половиной каталога, где встречался
  // хвост «-4» или «-1». Точный поиск по артикулу и так работает через
  // haystack.includes(term) ниже — числам эвристика не нужна.
  return {
    product,
    haystack,
    words: haystack.split(/[^a-zа-яё0-9]+/i).filter((w) => w.length > 0 && !/^\d+$/.test(w)),
  }
})

/**
 * Русские существительные меняют окончание по числу и падежу («подложка» /
 * «подложки» / «подложек»), а substring-поиск по полному запросу этого не
 * прощает. Здесь считается длина общего префикса двух слов: если она
 * покрывает почти всю короткую из строк (кроме одного-двух хвостовых
 * символов — как раз падежное окончание), слова считаются одной и той же
 * основой. Для очень коротких токенов (артикулы вроде «V80») этого не
 * происходит — там остаётся обычное совпадение по префиксу.
 */
function sharesStem(a: string, b: string): boolean {
  const len = Math.min(a.length, b.length)
  if (len < 3) return a.startsWith(b) || b.startsWith(a)
  let common = 0
  while (common < len && a[common] === b[common]) common++
  return common >= Math.max(3, len - 2)
}

export function searchProducts(query: string, limit = 8): Product[] {
  const q = query.trim().toLowerCase()
  if (!q) return []
  const terms = q.split(/\s+/).filter(Boolean)
  return searchIndex
    .filter(({ haystack, words }) =>
      terms.every((term) => haystack.includes(term) || words.some((word) => sharesStem(term, word))),
    )
    .slice(0, limit)
    .map(({ product }) => product)
}
