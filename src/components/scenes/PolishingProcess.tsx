import { motion } from 'framer-motion'

import { useReducedMotion } from '../../hooks/useReducedMotion'
import { revealProps, rise, riseProps, stagger } from '../../lib/motion'

/**
 * Этапы обработки и что на каждом применяется.
 *
 * Данные — с официальной «Таблицы применения» ShineMate (shinemate.com,
 * раздел Технологии): те же четыре стадии, те же дефекты и те же градации
 * кругов и паст. Ничего не додумано — это карта подбора, по которой мастер
 * реально выбирает связку «паста + круг», а не рекламный текст.
 */
type Stage = {
  index: string
  title: string
  goal: string
  defects: string[]
  paste: string
  pads: { kind: string; grade: string }[]
}

const STAGES: Stage[] = [
  {
    index: '01',
    title: 'Шлифование',
    goal: 'Снять грубые дефекты до полировки',
    defects: ['Глубокие царапины', 'Апельсиновая корка', 'Перелив краски'],
    paste: 'Без пасты — абразивные диски 2000/3000',
    pads: [{ kind: 'Шлифовальная машина', grade: 'ES516 · ES700' }],
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

export function PolishingProcess() {
  const reduced = useReducedMotion()

  return (
    <section className="scene relative bg-porcelain py-24 sm:py-28 md:py-36">
      <div className="shell">
        <motion.div {...revealProps(reduced, stagger(0, 0.09))}>
          <motion.p variants={rise} className="eyebrow">
            Подбор связки
          </motion.p>
          <motion.h2 variants={rise} className="h2 mt-5 max-w-[18ch]">
            Какой круг и пасту брать под задачу
          </motion.h2>
          <motion.p
            variants={rise}
            className="lead mt-6 max-w-[54ch] text-graphite/65"
          >
            Обработка идёт стадиями: от снятия грубых дефектов до финишного
            блеска. На каждой стадии — своя пара «паста + круг», и именно от
            неё зависит результат.
          </motion.p>
        </motion.div>

        <div className="mt-14 grid gap-px overflow-hidden rounded-2xl bg-graphite/[0.12] md:mt-16 md:grid-cols-2 xl:grid-cols-4">
          {STAGES.map((stage, i) => (
            <motion.article
              key={stage.index}
              {...revealProps(reduced, stagger(Math.min(i, 3) * 0.08, 0.06))}
              className="flex flex-col bg-porcelain p-7 sm:p-8"
            >
              <motion.p
                variants={rise}
                className="font-mono text-[0.625rem] uppercase tracking-[0.16em] text-titanium"
              >
                {stage.index}
              </motion.p>
              <motion.h3 variants={rise} className="mt-4 text-2xl tracking-tight">
                {stage.title}
              </motion.h3>
              <motion.p
                variants={rise}
                className="mt-2.5 text-[0.875rem] leading-relaxed text-graphite/60"
              >
                {stage.goal}
              </motion.p>

              <motion.div variants={rise} className="mt-7 border-t border-graphite/[0.12] pt-5">
                <p className="font-mono text-[0.625rem] uppercase tracking-[0.14em] text-titanium">
                  Что убирает
                </p>
                <ul className="mt-3 space-y-1.5">
                  {stage.defects.map((d) => (
                    <li key={d} className="text-[0.8125rem] leading-relaxed text-graphite/70">
                      {d}
                    </li>
                  ))}
                </ul>
              </motion.div>

              <motion.div variants={rise} className="mt-6 border-t border-graphite/[0.12] pt-5">
                <p className="font-mono text-[0.625rem] uppercase tracking-[0.14em] text-titanium">
                  Паста
                </p>
                <p className="mt-2.5 text-[0.875rem] leading-relaxed text-graphite">
                  {stage.paste}
                </p>
              </motion.div>

              <div className="flex-1" />

              <motion.div variants={rise} className="mt-6 border-t border-graphite/[0.12] pt-5">
                <p className="font-mono text-[0.625rem] uppercase tracking-[0.14em] text-titanium">
                  Круг
                </p>
                <dl className="mt-2.5 space-y-2">
                  {stage.pads.map((pad) => (
                    <div key={pad.kind}>
                      <dt className="text-[0.75rem] text-graphite/45">{pad.kind}</dt>
                      <dd className="mt-0.5 text-[0.875rem] leading-relaxed text-graphite">
                        {pad.grade}
                      </dd>
                    </div>
                  ))}
                </dl>
              </motion.div>
            </motion.article>
          ))}
        </div>

        <motion.p
          {...riseProps(reduced, { y: 20, amount: 0.3 })}
          className="mt-8 max-w-[62ch] text-[0.8125rem] leading-relaxed text-graphite/50"
        >
          Схема подбора — по официальной таблице применения ShineMate. Точную
          связку под ваше покрытие и объём работ подскажем по запросу.
        </motion.p>
      </div>
    </section>
  )
}
