import { motion } from 'framer-motion'
import { ArrowUpRight } from 'lucide-react'

import { products, totalSkus } from '../../data/catalog'
import { useReducedMotion } from '../../hooks/useReducedMotion'
import { revealProps, rise, riseProps, stagger } from '../../lib/motion'

/**
 * Содержимое страницы «О ShineMate».
 *
 * Осознанно НЕ повторяет блок о бренде с главной: клиент отметил, что
 * переход в пункт меню, где показывают ровно то же самое, что уже
 * пролистал на главной, бессмысленен. Здесь — то, чего на главной нет:
 * из чего состоит система, под какие поверхности рассчитана и что даёт
 * совместимость внутри линейки.
 *
 * Факты — с официальных материалов ShineMate (shinemate.com, раздел
 * About Us / Technologies) и из собственного прайса (catalog.ts).
 *
 * Блок "О бренде" описывает именно ShineMate как производителя (полный
 * цикл, R&D, сертификация) — это факт о бренде, а не о нашей компании.
 * Мы остаёмся дистрибьютором (см. company.role) — страна/город/площадь
 * завода намеренно не упоминаются, это не то, чем стоит козырять на
 * дилерском сайте, но сам факт "не noname-сборка, а серьёзный
 * производитель" — уместен и честен.
 */

const SURFACES = [
  { title: 'Автомобиль', note: 'Кузов, лак, локальная коррекция после покраски' },
  { title: 'Яхты', note: 'Гелькоут и крупные глянцевые поверхности' },
  { title: 'Мебель', note: 'Лакированные фасады и столешницы' },
  { title: 'Промышленность', note: 'Металл, композит, серийная обработка' },
]

const SYSTEM = [
  {
    step: '01',
    title: 'Машинка',
    body: 'Роторные для предсказуемого съёма, эксцентриковые с ходом 9–21 мм для коррекции без риска пережога, шлифовальные под подготовку.',
    image: 'catalog-media/ex620.webp',
  },
  {
    step: '02',
    title: 'Подложка',
    body: 'От 1,2" до 6" с резьбой M14, M8 и 5/16"-24 — под каждую машинку своя, чтобы не рвался баланс на оборотах.',
    image: 'catalog-media/plate-flexedge.webp',
  },
  {
    step: '03',
    title: 'Круг',
    body: 'Шерсть, микрофибра и поролон в градациях от T10 до T160 — один и тот же посадочный размер, меняется только жёсткость.',
    image: 'catalog-media/foam-diamond-t80.webp',
  },
  {
    step: '04',
    title: 'Паста',
    body: 'V80 и V82 на рез, V40 на полировку, V20 на финиш — линейка рассчитана под те же круги, что и машинка.',
    image: 'catalog-media/v40.webp',
  },
]

export function BrandStory() {
  const reduced = useReducedMotion()
  const machineCount = products.filter((p) =>
    ['rotary', 'da', 'sander', 'cordless'].includes(p.category),
  ).length

  return (
    <>
      <section className="scene relative bg-porcelain py-24 sm:py-28 md:py-36">
        <div className="shell">
          <motion.div {...revealProps(reduced, stagger(0, 0.09))} className="max-w-[52ch]">
            <motion.p variants={rise} className="eyebrow">
              О ShineMate
            </motion.p>
            <motion.h1 variants={rise} className="h2 mt-5">
              Не набор инструментов, а собранная система
            </motion.h1>
            <motion.p variants={rise} className="lead mt-6 text-graphite/65">
              ShineMate делает полировальное оборудование и расходники под один
              процесс: машинка, подложка, круг и паста рассчитаны друг под друга.
              Поэтому связку не приходится собирать из разных брендов и подгонять
              на ходу.
            </motion.p>
          </motion.div>

          <motion.dl
            {...revealProps(reduced, stagger(0.1, 0.08))}
            className="mt-14 grid gap-x-10 gap-y-8 border-t border-graphite/[0.12] pt-8 sm:grid-cols-3"
          >
            <motion.div variants={rise}>
              <dt className="font-mono text-[0.625rem] uppercase tracking-[0.14em] text-titanium">
                Позиций в прайсе
              </dt>
              <dd className="mt-2 text-[2rem] font-light leading-none tracking-tight">
                {totalSkus}
              </dd>
            </motion.div>
            <motion.div variants={rise}>
              <dt className="font-mono text-[0.625rem] uppercase tracking-[0.14em] text-titanium">
                Моделей машинок
              </dt>
              <dd className="mt-2 text-[2rem] font-light leading-none tracking-tight">
                {machineCount}
              </dd>
            </motion.div>
            <motion.div variants={rise}>
              <dt className="font-mono text-[0.625rem] uppercase tracking-[0.14em] text-titanium">
                Градации кругов
              </dt>
              <dd className="mt-2 text-[2rem] font-light leading-none tracking-tight">
                T10–T160
              </dd>
            </motion.div>
          </motion.dl>

          {/*
            Клиент отметил: страница ничего не говорит о самом бренде
            ShineMate — что это за компания, откуда уверенность в качестве.
            Факты ниже — с официального About Us на shinemate.com (собственное
            производство полного цикла, лаборатория R&D, сертификация,
            присутствие в 80+ странах). Сознательно без страны/города и
            площади завода — сайт дилерский, площадь производства не наша
            история для рассказа, важен факт полного цикла и контроля
            качества, а не то, где физически стоит завод.
          */}
          <motion.div
            {...revealProps(reduced, stagger(0, 0.08))}
            className="mt-14 max-w-[52ch] border-t border-graphite/[0.12] pt-10"
          >
            <motion.p variants={rise} className="eyebrow">
              О бренде
            </motion.p>
            <motion.p variants={rise} className="lead mt-5 text-graphite/65">
              ShineMate — не сборка компонентов от разных поставщиков, а
              собственное производство полного цикла: от проектирования и
              литья деталей до сборки машинок, кругов и полировальных паст.
              Каждая новая модель проходит проверку в собственной лаборатории
              разработки и тестирования, прежде чем попасть в продажу.
            </motion.p>
            <motion.dl
              variants={rise}
              className="mt-8 grid grid-cols-2 gap-x-8 gap-y-6 sm:grid-cols-3"
            >
              <div>
                <dt className="font-mono text-[0.625rem] uppercase tracking-[0.14em] text-titanium">
                  Продажи
                </dt>
                <dd className="mt-1.5 text-[1.0625rem] tracking-tight">80+ стран</dd>
              </div>
              <div>
                <dt className="font-mono text-[0.625rem] uppercase tracking-[0.14em] text-titanium">
                  Сертификация
                </dt>
                <dd className="mt-1.5 text-[1.0625rem] tracking-tight">ISO 9001, CE, CCC</dd>
              </div>
              <div>
                <dt className="font-mono text-[0.625rem] uppercase tracking-[0.14em] text-titanium">
                  Разработка
                </dt>
                <dd className="mt-1.5 text-[1.0625rem] tracking-tight">Своя лаборатория R&D</dd>
              </div>
            </motion.dl>
          </motion.div>
        </div>
      </section>

      <section className="scene relative bg-mist py-24 sm:py-28 md:py-32">
        <div className="shell">
          <motion.div {...revealProps(reduced, stagger(0, 0.09))} className="max-w-[46ch]">
            <motion.p variants={rise} className="eyebrow">
              Как собрана линейка
            </motion.p>
            <motion.h2 variants={rise} className="h2 mt-5">
              Четыре звена одной цепочки
            </motion.h2>
          </motion.div>

          <div className="mt-14 grid gap-px overflow-hidden rounded-2xl bg-graphite/[0.12] md:grid-cols-2 xl:grid-cols-4">
            {SYSTEM.map((item, i) => (
              <motion.article
                key={item.step}
                {...revealProps(reduced, stagger(Math.min(i, 3) * 0.08, 0.06))}
                className="bg-mist p-7 sm:p-8"
              >
                <motion.div
                  variants={rise}
                  className="flex h-28 items-center justify-center rounded-xl bg-porcelain"
                >
                  <img
                    src={item.image}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    className="max-h-24 max-w-[85%] object-contain"
                  />
                </motion.div>
                <motion.p
                  variants={rise}
                  className="mt-6 font-mono text-[0.625rem] uppercase tracking-[0.16em] text-titanium"
                >
                  {item.step}
                </motion.p>
                <motion.h3 variants={rise} className="mt-4 text-xl tracking-tight sm:text-2xl">
                  {item.title}
                </motion.h3>
                <motion.p
                  variants={rise}
                  className="mt-3 text-[0.875rem] leading-relaxed text-graphite/65"
                >
                  {item.body}
                </motion.p>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      <section className="scene relative bg-porcelain py-24 sm:py-28 md:py-32">
        <div className="shell">
          <motion.div {...revealProps(reduced, stagger(0, 0.09))} className="max-w-[48ch]">
            <motion.p variants={rise} className="eyebrow">
              Где применяется
            </motion.p>
            <motion.h2 variants={rise} className="h2 mt-5">
              Не только по кузову
            </motion.h2>
            <motion.p variants={rise} className="lead mt-6 text-graphite/65">
              Тем же набором машинок, кругов и паст работают там, где нужен
              контролируемый съём и чистый глянец на большой площади.
            </motion.p>
          </motion.div>

          <motion.ul
            {...revealProps(reduced, stagger(0.1, 0.07))}
            className="mt-12 grid gap-x-10 gap-y-8 sm:grid-cols-2 xl:grid-cols-4"
          >
            {SURFACES.map((s) => (
              <motion.li
                key={s.title}
                variants={rise}
                className="border-t border-graphite/[0.12] pt-5"
              >
                <p className="text-lg tracking-tight">{s.title}</p>
                <p className="mt-2 text-[0.8125rem] leading-relaxed text-graphite/60">
                  {s.note}
                </p>
              </motion.li>
            ))}
          </motion.ul>

          <motion.a
            {...riseProps(reduced, { y: 24, delay: 0.15, amount: 0.3 })}
            href="catalog"
            className="group mt-14 inline-flex items-center gap-2 rounded-full border border-graphite/20 px-6 py-3.5 text-sm transition-colors duration-500 ease-premium hover:border-graphite/50 hover:bg-graphite/[0.04]"
          >
            Смотреть весь каталог
            <ArrowUpRight
              size={16}
              className="transition-transform duration-500 ease-premium group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            />
          </motion.a>
        </div>
      </section>
    </>
  )
}
