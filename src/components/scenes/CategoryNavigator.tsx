import { useCallback, useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowUpRight } from 'lucide-react'

import { categories, countByCategory } from '../../data/catalog'
import { useReducedMotion } from '../../hooks/useReducedMotion'
import { revealProps, rise, stagger } from '../../lib/motion'

const PREVIEW_W = 300
const PREVIEW_H = 300

/**
 * Навигатор по разделам каталога.
 *
 * Превью появляется мгновенно: все изображения предзагружаются один раз при
 * монтировании, а сам блок всегда есть в DOM и только переставляется
 * трансформом. Позиция берётся от геометрии наведённой строки, поэтому
 * картинка стоит напротив неё, а не в случайном месте экрана.
 *
 * Строка — ссылка на раздел каталога, а не декоративный текст.
 */
export function CategoryNavigator() {
  const list = useRef<HTMLUListElement>(null)
  const preview = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState<string | null>(null)
  const reduced = useReducedMotion()

  // Предзагрузка: к моменту первого наведения файлы уже в кэше.
  useEffect(() => {
    categories.forEach((c) => {
      const img = new Image()
      img.src = c.image
    })
  }, [])

  const place = useCallback((row: HTMLElement) => {
    const box = preview.current
    const container = list.current
    if (!box || !container) return

    const rowRect = row.getBoundingClientRect()
    const listRect = container.getBoundingClientRect()

    // По вертикали — центр строки, но превью не должно вылезать за вьюпорт.
    const wanted = rowRect.top + rowRect.height / 2 - PREVIEW_H / 2
    const clamped = Math.min(
      Math.max(wanted, 88),
      window.innerHeight - PREVIEW_H - 24,
    )
    // По горизонтали — правый край списка, с отступом внутрь.
    const left = listRect.right - PREVIEW_W - 24

    box.style.transform = `translate3d(${Math.round(left - listRect.left)}px, ${Math.round(
      clamped - listRect.top,
    )}px, 0)`
  }, [])

  const onEnter = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    place(e.currentTarget)
    setActive(id)
  }

  const current = categories.find((c) => c.id === active)

  return (
    <section id="equipment" className="scene relative bg-mist py-24 sm:py-28 md:py-36">
      <motion.div
        {...revealProps(reduced, stagger(0, 0.08))}
        className="shell"
      >
        <motion.p variants={rise} className="eyebrow">
          Оборудование
        </motion.p>
        <div className="mt-5 flex flex-col gap-5 md:flex-row md:items-end md:justify-between md:gap-10">
          <motion.h2 variants={rise} className="h2 max-w-[16ch]">
            Восемь разделов под весь цикл работ
          </motion.h2>
          <motion.a
            variants={rise}
            href="catalog"
            className="group inline-flex shrink-0 items-center gap-2 text-[0.9375rem] text-slate transition-colors duration-500 ease-premium hover:text-graphite"
          >
            Открыть весь каталог
            <ArrowUpRight
              size={16}
              className="transition-transform duration-500 ease-premium group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            />
          </motion.a>
        </div>
      </motion.div>

      <div className="shell relative mt-10 sm:mt-12">
        <motion.ul
          ref={list}
          {...revealProps(reduced, stagger(0.08, 0.05))}
          onMouseLeave={() => setActive(null)}
          className="relative border-t border-graphite/[0.12]"
        >
          {/* Превью всегда в DOM: показ — это только смена opacity. */}
          <div
            ref={preview}
            aria-hidden
            className={`pointer-events-none absolute left-0 top-0 z-20 hidden xl:block ${
              reduced ? '' : 'transition-opacity duration-200 ease-premium'
            }`}
            style={{ width: PREVIEW_W, height: PREVIEW_H, opacity: current ? 1 : 0 }}
          >
            <div className="relative flex h-full w-full items-center justify-center rounded-[1.5rem] bg-porcelain/80 p-6 shadow-[0_24px_60px_-28px_rgba(26,28,30,0.35)] backdrop-blur-sm">
              {categories.map((c) => (
                <img
                  key={c.id}
                  src={c.image}
                  alt=""
                  width={300}
                  height={300}
                  className="absolute max-h-[86%] max-w-[86%] object-contain transition-opacity duration-200 ease-premium"
                  style={{ opacity: c.id === active ? 1 : 0 }}
                />
              ))}
            </div>
          </div>

          {categories.map((category) => (
            <motion.li key={category.id} variants={rise} className="border-b border-graphite/[0.12]">
              <a
                href={`catalog/${category.id}`}
                onMouseEnter={(e) => onEnter(e, category.id)}
                onFocus={(e) => onEnter(e as unknown as React.MouseEvent<HTMLAnchorElement>, category.id)}
                onBlur={() => setActive(null)}
                className="group flex flex-col gap-3 py-6 outline-none transition-transform duration-700 ease-premium focus-visible:ring-1 focus-visible:ring-graphite/40 md:flex-row md:items-baseline md:gap-8 md:py-7 xl:group-hover:translate-x-2"
              >
                <span className="font-mono text-[0.6875rem] tracking-[0.16em] text-titanium md:w-10 md:shrink-0">
                  {category.index}
                </span>

                <span className="flex items-center gap-3 md:w-[32%] md:shrink-0">
                  <img
                    src={category.image}
                    alt=""
                    aria-hidden
                    width={300}
                    height={300}
                    loading="lazy"
                    decoding="async"
                    className="h-12 w-12 shrink-0 object-contain xl:hidden"
                  />
                  <span className="h3 leading-tight">{category.title}</span>
                </span>

                <span className="min-w-0 md:flex-1 xl:pr-[20rem]">
                  <span className="block max-w-[46ch] text-[0.9375rem] leading-relaxed text-slate">
                    {category.subtitle}
                  </span>
                  <span className="mt-2 block font-mono text-[0.75rem] tracking-tight text-titanium">
                    {countByCategory(category.id)} позиций в прайсе
                  </span>
                </span>

                <ArrowUpRight
                  size={18}
                  className="hidden shrink-0 text-graphite/25 transition-all duration-500 ease-premium group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-graphite md:block"
                />
              </a>
            </motion.li>
          ))}
        </motion.ul>
      </div>
    </section>
  )
}
