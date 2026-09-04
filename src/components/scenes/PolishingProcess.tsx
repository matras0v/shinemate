import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'

import { POLISH_STAGES } from '../../data/story'
import { useReducedMotion } from '../../hooks/useReducedMotion'
import { revealProps, rise, riseProps, stagger } from '../../lib/motion'

/**
 * Этапы обработки и что на каждом применяется.
 *
 * Данные — с официальной «Таблицы применения» ShineMate (shinemate.com,
 * раздел Технологии): те же четыре стадии, те же дефекты и те же градации
 * кругов и паст. Ничего не додумано — это карта подбора, по которой мастер
 * реально выбирает связку «паста + круг», а не рекламный текст.
 *
 * Сам массив живёт в data/story.ts: по нему же страницы кругов и паст
 * определяют своё место в цикле, и держать вторую копию здесь значило бы
 * рано или поздно разъехаться с ними.
 */


export function PolishingProcess() {
  const reduced = useReducedMotion()
  const grid = useRef<HTMLDivElement>(null)
  /*
   * Прогресс-линия идёт не по всей секции, а именно по ряду карточек:
   * offset подобран так, чтобы линия заполнялась, пока ряд проходит
   * через видимую часть экрана, и оставалась полной, когда он уже
   * пролистан — а не заполнялась ещё до того, как ряд появился.
   */
  const { scrollYProgress } = useScroll({ target: grid, offset: ['start 0.8', 'end 0.35'] })
  const railScale = useTransform(scrollYProgress, [0, 1], [0, 1])

  return (
    <section className="scene relative bg-porcelain py-24 sm:py-28 md:py-36">
      <div className="shell">
        <motion.div {...revealProps(reduced, stagger(0, 0.09))}>
          <motion.p variants={rise} className="eyebrow">
            Подбор связки
          </motion.p>
          {/*
            /technologies — самостоятельная страница без отдельного hero:
            этот блок был у неё единственным заголовком раздела, но h2 без
            h1 на странице — реальный пробел, найденный при сквозном
            прогоне (та же проверка, что раньше поймала отсутствие h1 на
            «Контактах»).
          */}
          <motion.h1 variants={rise} className="h2 mt-5 max-w-[18ch]">
            Какой круг и пасту брать под задачу
          </motion.h1>
          <motion.p
            variants={rise}
            className="lead mt-6 max-w-[54ch] text-ash"
          >
            Обработка идёт стадиями: от снятия грубых дефектов до финишного
            блеска. На каждой стадии — своя пара «паста + круг», и именно от
            неё зависит результат.
          </motion.p>
        </motion.div>

        <div ref={grid} className="relative mt-14 md:mt-16">
          {!reduced && (
            <div aria-hidden className="absolute -top-3 left-0 right-0 hidden h-[3px] rounded-full bg-graphite/10 xl:block">
              <motion.div
                className="h-full origin-left rounded-full bg-ember"
                style={{ scaleX: railScale }}
              />
            </div>
          )}
          <div className="grid gap-px overflow-hidden rounded-2xl bg-graphite/[0.12] md:grid-cols-2 xl:grid-cols-4">
          {POLISH_STAGES.map((stage, i) => (
            <motion.article
              key={stage.index}
              {...revealProps(reduced, stagger(Math.min(i, 3) * 0.08, 0.06))}
              className="flex flex-col bg-porcelain p-7 sm:p-8"
            >
              <motion.p
                variants={rise}
                className="font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-titanium"
              >
                {stage.index}
              </motion.p>
              <motion.h3 variants={rise} className="mt-4 text-2xl tracking-tight">
                {stage.title}
              </motion.h3>
              <motion.p
                variants={rise}
                className="mt-2.5 text-[0.875rem] leading-relaxed text-slate"
              >
                {stage.goal}
              </motion.p>

              <motion.div variants={rise} className="mt-7 border-t border-graphite/[0.12] pt-5">
                <p className="font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-titanium">
                  Что убирает
                </p>
                <ul className="mt-3 space-y-1.5">
                  {stage.defects.map((d) => (
                    <li key={d} className="text-[0.8125rem] leading-relaxed text-ash">
                      {d}
                    </li>
                  ))}
                </ul>
              </motion.div>

              <motion.div variants={rise} className="mt-6 border-t border-graphite/[0.12] pt-5">
                <p className="font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-titanium">
                  Паста
                </p>
                <p className="mt-2.5 text-[0.875rem] leading-relaxed text-graphite">
                  {stage.paste}
                </p>
              </motion.div>

              <div className="flex-1" />

              <motion.div variants={rise} className="mt-6 border-t border-graphite/[0.12] pt-5">
                <p className="font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-titanium">
                  Круг
                </p>
                <dl className="mt-2.5 space-y-2">
                  {stage.pads.map((pad) => (
                    <div key={pad.kind}>
                      <dt className="text-[0.75rem] text-titanium">{pad.kind}</dt>
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
        </div>

        <motion.p
          {...riseProps(reduced, { y: 20, amount: 0.3 })}
          className="mt-8 max-w-[62ch] text-[0.8125rem] leading-relaxed text-slate"
        >
          Схема подбора — по официальной таблице применения ShineMate. Точную
          связку под ваше покрытие и объём работ подскажем по запросу.
        </motion.p>
      </div>
    </section>
  )
}
