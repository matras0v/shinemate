import { motion } from 'framer-motion'

import { useReducedMotion } from '../../hooks/useReducedMotion'
import { revealProps, rise, stagger } from '../../lib/motion'

/**
 * Технологии самого оборудования — то, чем линейка отличается в работе.
 *
 * Формулировки — по официальным материалам ShineMate (shinemate.com,
 * разделы About Us и Technologies: Black Diamond, литий-ионная система,
 * контроль баланса эксцентрика). Про завод и производство здесь ничего
 * нет: сайт продаёт оборудование, а не производит его.
 */

type Feature = {
  index: string
  title: string
  lead: string
  points: string[]
  image: string
}

const FEATURES: Feature[] = [
  {
    index: '01',
    title: 'Black Diamond',
    lead: 'Поролоновый круг с рельефом «алмазная грань» — закрывает весь цикл от тяжёлого реза до финиша.',
    points: [
      'Рельеф уменьшает разбрызгивание пасты',
      'Держит форму под нагревом и после мойки',
      'Ровное пятно контакта — меньше голограмм',
      'Градации от T10 до T120 на одной посадке',
    ],
    image: 'catalog-media/foam-diamond-t80.webp',
  },
  {
    index: '02',
    title: 'Контроль баланса',
    lead: 'Эксцентриковые машинки балансируются так, чтобы гасить вибрацию на рабочих оборотах.',
    points: [
      'Меньше отдачи в кисть на длинной смене',
      'Ход эксцентрика 9, 12, 15 и 21 мм под задачу',
      'Круг не «прыгает» на кромках и рёбрах',
    ],
    image: 'catalog-media/ex620.webp',
  },
  {
    index: '03',
    title: 'Литий-ионная платформа',
    lead: 'Аккумуляторы, зарядные устройства и инструмент обмениваются данными между собой.',
    points: [
      'Чип в батарее и в машинке согласуют режим заряда',
      'Одна платформа 18 В на всю аккумуляторную линейку',
      'Отдельная платформа 10,8 В под компактные машинки',
      'Мощность выдаётся ровно, пока не сядет банка',
    ],
    image: 'catalog-media/battery-18v.webp',
  },
]

export function TechFeatures() {
  const reduced = useReducedMotion()

  return (
    <section className="scene relative bg-mist py-24 sm:py-28 md:py-32">
      <div className="shell">
        <motion.div {...revealProps(reduced, stagger(0, 0.09))} className="max-w-[48ch]">
          <motion.p variants={rise} className="eyebrow">
            В основе линейки
          </motion.p>
          <motion.h2 variants={rise} className="h2 mt-5">
            Что реально меняет результат
          </motion.h2>
          <motion.p variants={rise} className="lead mt-6 text-ash">
            Три вещи, из-за которых связка ведёт себя предсказуемо: рельеф
            круга, баланс машинки и то, как инструмент работает с питанием.
          </motion.p>
        </motion.div>

        <div className="mt-14 grid gap-px overflow-hidden rounded-2xl bg-graphite/[0.12] md:mt-16 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <motion.article
              key={f.index}
              {...revealProps(reduced, stagger(Math.min(i, 2) * 0.1, 0.06))}
              className="flex flex-col bg-mist p-7 sm:p-9"
            >
              <motion.div
                variants={rise}
                className="flex h-32 items-center justify-center rounded-xl bg-porcelain"
              >
                <img
                  src={f.image}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className="max-h-28 max-w-[85%] object-contain"
                />
              </motion.div>
              <motion.p
                variants={rise}
                className="mt-6 font-mono text-[0.625rem] uppercase tracking-[0.16em] text-titanium"
              >
                {f.index}
              </motion.p>
              <motion.h3 variants={rise} className="mt-4 text-2xl tracking-tight">
                {f.title}
              </motion.h3>
              <motion.p
                variants={rise}
                className="mt-3 text-[0.9375rem] leading-relaxed text-ash"
              >
                {f.lead}
              </motion.p>

              <div className="flex-1" />

              <motion.ul
                variants={rise}
                className="mt-7 space-y-2.5 border-t border-graphite/[0.12] pt-5"
              >
                {f.points.map((p) => (
                  <li
                    key={p}
                    className="text-[0.8125rem] leading-relaxed text-ash"
                  >
                    {p}
                  </li>
                ))}
              </motion.ul>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  )
}
