import { useRef, useState } from 'react'
import { motion, useMotionValueEvent, useScroll, useTransform } from 'framer-motion'
import { ArrowRight } from 'lucide-react'

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

/**
 * Условная графика для двух последних звеньев — это не товары, а стадии.
 * Обе нарисованы как одна и та же тёмная лаковая панель с диагональным
 * бликом — тот же мотив, что и в настоящих макрофото полировки выше на
 * главной (ReflectionReveal), только абстрактный. Схематично НАМЕРЕННО:
 * настоящей пары «до/после» именно для этой связки у нас нет, и
 * подделывать её фотореалистично значило бы выдать схему за кейс.
 *
 * Раньше блик рисовался парой смутных эллипсов — клиент на видео отметил,
 * что это читается как нерендернувшаяся картинка, «пустой квадрат», а не
 * как осознанная схема. Клиновидный блик и рез риски поперёк него —
 * тот же язык, что и в реальных фото, поэтому связь считывается сразу.
 */
function StepGlyph({ index }: { index: number }) {
  const defect = index === 4
  const streak = 'M10 64 C 30 53, 42 45, 92 15 L 92 25 C 44 53, 33 60, 18 72 Z'
  return (
    <svg
      viewBox="0 0 100 76"
      className="h-[86%] w-[86%]"
      role="img"
      aria-label={defect ? 'Условная схема покрытия с дефектами' : 'Условная схема ровного отражения после обработки'}
    >
      <rect x="4" y="6" width="92" height="64" rx="10" fill="#1A1C1E" />
      {defect ? (
        <>
          <path d={streak} fill="#FFFFFF" opacity="0.28" />
          {[
            [10, 20, 60, 30],
            [26, 62, 76, 24],
            [16, 44, 58, 14],
          ].map(([x1, y1, x2, y2], i) => (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="#FFFFFF"
              strokeOpacity="0.4"
              strokeWidth="1.25"
              strokeLinecap="round"
            />
          ))}
        </>
      ) : (
        <>
          <path d={streak} fill="#FFFFFF" opacity="0.85" />
          <path d="M18 66 C 34 56, 44 49, 90 20" fill="none" stroke="#FFFFFF" strokeWidth="1" strokeOpacity="0.6" />
          <rect x="4" y="6" width="92" height="64" rx="10" fill="none" stroke="#FE8B0C" strokeOpacity="0.5" strokeWidth="1.5" />
        </>
      )}
    </svg>
  )
}

function StepCard({ step, index, on }: { step: Step; index: number; on: boolean }) {
  const reducedTilt = useReducedMotion()
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 })

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
    <motion.a
      href={step.href}
      /*
        Лёгкий наклон вслед за курсором: карточка перестаёт быть плоской
        плиткой и читается как физический объект. Порог намеренно низкий
        (±7°) — это акцент на наведении, а не аттракцион. Мышь считается
        от центра карточки, поэтому наклон одинаково работает в любой
        позиции сетки. На touch событий mouse нет, и карточка остаётся
        ровной: наклонять то, что нельзя навести, незачем.
      */
      onMouseMove={(e) => {
        if (reducedTilt) return
        const r = e.currentTarget.getBoundingClientRect()
        const px = (e.clientX - r.left) / r.width - 0.5
        const py = (e.clientY - r.top) / r.height - 0.5
        setTilt({ rx: -py * 14, ry: px * 14 })
      }}
      onMouseLeave={() => setTilt({ rx: 0, ry: 0 })}
      style={{ transformPerspective: 700, rotateX: tilt.rx, rotateY: tilt.ry }}
      transition={{ type: 'spring', stiffness: 220, damping: 18 }}
      className="group flex h-full flex-col rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-ember/60 focus-visible:ring-offset-4 focus-visible:ring-offset-mist"
    >
      {inner}
    </motion.a>
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

  /*
    Ниже desktop-порога шесть карточек в сетке 2×3 растягивали экран вниз
    почти на полторы высоты — цепочка переставала читаться как цепочка и
    превращалась в длинный список. Здесь она идёт горизонтальным рельсом
    со scroll-snap: свайп перекидывает ровно на следующее звено, и вся
    секция занимает один экран.
  */
  if (reduced || !desktop) {
    return (
      <section id="system" className="scene relative bg-mist py-20 md:py-28">
        <div className="shell-wide">{header}</div>
        <ol className="sm-rail mt-12 flex snap-x snap-mandatory gap-4 overflow-x-auto px-[var(--shell)] pb-4">
          {STEPS.map((s, i) => (
            <li key={s.role} className="w-[15rem] shrink-0 snap-start sm:w-[17rem]">
              <StepCard step={s} index={i} on />
            </li>
          ))}
        </ol>
        <p className="shell-wide mt-1 flex items-center gap-1.5 font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-titanium">
          Листайте цепочку вправо
          <ArrowRight size={13} />
        </p>
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
