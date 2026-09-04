import { useRef, useState } from 'react'
import { motion, useMotionValueEvent, useScroll, useTransform } from 'framer-motion'

import { products } from '../../data/catalog'
import { DESKTOP_SCENE_QUERY, useMediaQuery } from '../../hooks/useMediaQuery'
import { useReducedMotion } from '../../hooks/useReducedMotion'
import { productHref } from '../../lib/router'

/**
 * «Одна система. Один результат.» — главная интерактивная сцена главной.
 *
 * Смысл, который она должна донести за один экран: ShineMate продаёт не
 * набор отдельных позиций, а цепочку, где каждое звено рассчитано под
 * соседнее. Поэтому по мере прокрутки цепочка СОБИРАЕТСЯ: машинка →
 * подложка → круг → состав → лак → результат, звено за звеном, а линия
 * прогресса дорастает до последнего шага.
 *
 * Первые четыре звена — реальные позиции каталога с настоящими кадрами и
 * ссылками на свои страницы. Последние два — лакокрасочное покрытие и
 * результат: это не товары, поэтому они показаны условной графикой и
 * подписаны как стадия, а не как SKU.
 *
 * Доступность: весь текст цепочки есть в DOM всегда, скролл управляет
 * только подсветкой. При prefers-reduced-motion сцена статична — без
 * sticky и без трансформаций, все звенья показаны сразу.
 */

const bySlug = (slug: string) => products.find((p) => p.slug === slug)

type Step = {
  role: string
  title: string
  note: string
  href?: string
  image?: string
}

const STEPS: Step[] = (() => {
  const chain: { role: string; slug: string; note: string }[] = [
    { role: '01 · Машинка', slug: 'ep820', note: 'Задаёт тип привода и скорость съёма' },
    { role: '02 · Подложка', slug: 'plates-rotary', note: 'Резьба под машинку, диаметр под круг' },
    { role: '03 · Круг', slug: 'foam-diamond-t40', note: 'Определяет агрессивность на стадии' },
    { role: '04 · Состав', slug: 'v40-medium-polish', note: 'Работает в паре с кругом своей стадии' },
  ]
  const items: Step[] = []
  for (const link of chain) {
    const product = bySlug(link.slug)
    if (!product) continue
    items.push({
      role: link.role,
      title: product.model,
      note: link.note,
      href: productHref(product),
      image: product.image,
    })
  }
  items.push(
    { role: '05 · Покрытие', title: 'Лакокрасочное покрытие', note: 'То, ради чего собирается вся цепочка' },
    { role: '06 · Результат', title: 'Ровное отражение', note: 'Итог даёт связка целиком, а не одно звено' },
  )
  return items
})()

/** Условная графика для двух последних звеньев — они не товары. */
function StepGlyph({ index }: { index: number }) {
  if (index === 4) {
    return (
      <svg viewBox="0 0 80 80" className="h-[62%] w-[62%] text-graphite" role="img" aria-label="Условная схема поверхности с дефектами">
        <rect x="6" y="18" width="68" height="44" rx="8" fill="currentColor" fillOpacity="0.08" />
        {[30, 42, 54].map((y, i) => (
          <path
            key={y}
            d={`M 14 ${y} Q 30 ${y - 7 + (i % 2) * 5}, 46 ${y} T 66 ${y}`}
            fill="none"
            stroke="currentColor"
            strokeOpacity="0.42"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        ))}
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 80 80" className="h-[62%] w-[62%]" role="img" aria-label="Условная схема ровного отражения">
      <rect x="6" y="18" width="68" height="44" rx="8" fill="#1A1C1E" />
      <ellipse cx="30" cy="33" rx="24" ry="10" fill="#FFFFFF" opacity="0.26" />
      <ellipse cx="52" cy="48" rx="17" ry="6" fill="#FFFFFF" opacity="0.14" />
      <rect x="6" y="18" width="68" height="44" rx="8" fill="none" stroke="#FE8B0C" strokeOpacity="0.45" strokeWidth="1.4" />
    </svg>
  )
}

function StepCard({ step, index, on }: { step: Step; index: number; on: boolean }) {
  const inner = (
    <>
      <span
        className={`relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-2xl transition-colors duration-500 ${
          on ? 'bg-porcelain ring-1 ring-ember/25' : 'bg-porcelain/70 ring-1 ring-graphite/[0.07]'
        }`}
      >
        {step.image ? (
          <img
            src={step.image.replace('.webp', '-thumb.webp')}
            alt=""
            loading="lazy"
            decoding="async"
            className={`h-[74%] w-[74%] object-contain transition-all duration-500 ${on ? 'opacity-100' : 'opacity-45 grayscale'}`}
          />
        ) : (
          <span className={`flex h-full w-full items-center justify-center transition-opacity duration-500 ${on ? 'opacity-100' : 'opacity-40'}`}>
            <StepGlyph index={index} />
          </span>
        )}
      </span>
      <span
        className={`mt-3 block font-mono text-[0.6875rem] uppercase tracking-[0.14em] transition-colors duration-500 ${
          on ? 'text-ember' : 'text-titanium'
        }`}
      >
        {step.role}
      </span>
      <span className={`mt-1 block text-[0.9375rem] leading-snug tracking-tight transition-colors duration-500 ${on ? 'text-graphite' : 'text-slate'}`}>
        {step.title}
      </span>
      <span className="mt-1 block text-[0.8125rem] leading-relaxed text-slate">{step.note}</span>
    </>
  )

  if (!step.href) return <div className="flex h-full flex-col">{inner}</div>
  return (
    <a
      href={step.href}
      className="group flex h-full flex-col rounded-2xl outline-none transition-transform duration-500 ease-premium focus-visible:ring-2 focus-visible:ring-ember/60 focus-visible:ring-offset-4 focus-visible:ring-offset-mist"
    >
      {inner}
    </a>
  )
}

export function SystemAssembly() {
  const reduced = useReducedMotion()
  /*
   * Ниже 1024px шесть карточек цепочки выше экрана: sticky-контейнер
   * высотой в экран их не удерживал, и содержимое налезало на соседние
   * секции. На таких ширинах показываем ту же цепочку обычным списком.
   */
  const desktop = useMediaQuery(DESKTOP_SCENE_QUERY)
  const track = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: track, offset: ['start start', 'end end'] })
  const [step, setStep] = useState(0)

  const n = STEPS.length
  useMotionValueEvent(scrollYProgress, 'change', (v) => {
    const next = Math.min(n - 1, Math.floor(v * (n + 0.4)))
    setStep((prev) => (prev === next ? prev : next))
  })
  // Линия прогресса дорастает ровно до текущего звена, а не «в никуда».
  const lineScale = useTransform(scrollYProgress, [0, 0.92], [0, 1])

  const header = (
    <div className="grid gap-x-16 gap-y-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-end">
      <div>
        <p className="eyebrow">Система</p>
        <h2 className="h2 mt-6 max-w-[16ch]">Одна система. Один результат.</h2>
      </div>
      <p className="lead max-w-[52ch] text-slate">
        Результат создаёт не один инструмент. Машинка, подложка, круг и состав рассчитаны друг под друга: совпадает
        резьба, диаметр и стадия обработки — поэтому связка собирается за минуты, а не подбирается методом проб.
      </p>
    </div>
  )

  const grid = (activeUpTo: number) => (
    <ol className="relative grid grid-cols-2 gap-x-4 gap-y-8 lg:grid-cols-6 lg:gap-x-4">
      {STEPS.map((s, i) => (
        <li key={s.role} className="relative" aria-current={i === activeUpTo ? 'step' : undefined}>
          <StepCard step={s} index={i} on={i <= activeUpTo} />
        </li>
      ))}
    </ol>
  )

  if (reduced || !desktop) {
    return (
      <section id="system" className="scene relative bg-mist py-20 md:py-28">
        <div className="shell-wide">
          {header}
          <div className="mt-12">{grid(n - 1)}</div>
        </div>
      </section>
    )
  }

  return (
    <section id="system" className="scene relative bg-mist">
      <div ref={track} className="relative" style={{ height: '250vh' }}>
        {/* pt под фиксированный хедер: иначе заголовок сцены уходит под шапку */}
        <div className="sticky top-0 flex h-[100svh] items-center pb-12 pt-24 lg:pt-28">
          <div className="shell-wide w-full">
            {header}

            {/* Рельс прогресса: линия дорастает по мере сборки цепочки */}
            <div className="relative mt-12 hidden h-px w-full bg-graphite/[0.12] lg:block">
              <motion.span
                aria-hidden
                style={{ scaleX: lineScale }}
                className="absolute inset-0 origin-left bg-ember/70"
              />
            </div>

            <div className="mt-8">{grid(step)}</div>
          </div>
        </div>
      </div>
    </section>
  )
}
