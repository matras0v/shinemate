import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'

import { products } from '../../data/catalog'
import { useReducedMotion } from '../../hooks/useReducedMotion'
import { productHref } from '../../lib/router'
import { revealProps, rise, riseProps, stagger } from '../../lib/motion'

/*
 * Реальная связка каталога для строки «система» ниже: одна машинка, одна
 * подложка, один круг, один состав — те же четыре роли, что и в system
 * builder на странице товара («Собери систему»), просто на конкретных
 * представителях линейки, а не абстрактной иконкой.
 */
const SYSTEM_STEPS = (() => {
  const bySlug = (slug: string) => products.find((p) => p.slug === slug)
  return [
    { role: '01 · Машинка', product: bySlug('ep820') },
    { role: '02 · Подложка', product: bySlug('plates-rotary') },
    { role: '03 · Круг', product: bySlug('foam-diamond-t40') },
    { role: '04 · Паста', product: bySlug('v40-medium-polish') },
  ].filter((s): s is { role: string; product: NonNullable<typeof s.product> } => Boolean(s.product))
})()

/**
 * Кадр кампании, который «встаёт» из перспективы по мере прокрутки.
 * Механика та же, что в известном ContainerScroll: перспектива на обёртке,
 * rotateX и scale на сцене от scrollYProgress. Оформление полностью своё —
 * светлая рама вместо тёмного демо-корпуса.
 */
export function ScrollStage() {
  const section = useRef<HTMLElement>(null)
  const reduced = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: section, offset: ['start end', 'end end'] })

  const rotateX = useTransform(scrollYProgress, [0, 1], [26, 0])
  const scale = useTransform(scrollYProgress, [0, 1], [0.86, 1])
  const translateY = useTransform(scrollYProgress, [0, 1], [70, 0])
  const captionY = useTransform(scrollYProgress, [0, 1], [46, 0])
  const captionOpacity = useTransform(scrollYProgress, [0.1, 0.6], [0, 1])

  return (
    <section
      id="stage"
      ref={section}
      className="scene relative overflow-hidden bg-mist pb-28 pt-6 md:pb-36"
      style={{ perspective: '1400px' }}
    >
      <div className="shell">
        <motion.div
          style={
            reduced
              ? undefined
              : { rotateX, scale, y: translateY, transformStyle: 'preserve-3d' }
          }
          className="relative origin-[50%_0%] overflow-hidden rounded-[1.75rem] border border-graphite/[0.08] bg-porcelain shadow-[0_50px_90px_-40px_rgba(26,28,30,0.28)] md:rounded-[2.5rem]"
        >
          <img
            src="media/stage-1920.webp"
            srcSet="media/stage-800.webp 800w, media/stage-1280.webp 1280w, media/stage-1920.webp 1920w"
            sizes="(min-width: 1440px) 1280px, 100vw"
            alt="Полировальная машинка ShineMate и оснастка в студийной композиции"
            loading="lazy"
            decoding="async"
            className="aspect-[16/10] w-full object-cover md:aspect-[16/9]"
          />

          <motion.div
            style={reduced ? undefined : { y: captionY, opacity: captionOpacity }}
            className="pointer-events-none absolute inset-x-0 top-0 p-6 md:p-12"
          >
            <p className="font-mono text-[0.625rem] uppercase tracking-[0.24em] text-titanium">
              Система
            </p>
            <p className="mt-3 max-w-[22ch] text-[clamp(1.25rem,0.95rem+1.5vw,2.5rem)] leading-[1.08] tracking-tight text-graphite md:max-w-[26ch]">
              Машинка, подложка и круг работают как один инструмент
            </p>
          </motion.div>
        </motion.div>
      </div>

      <div className="shell mt-10 grid gap-10 lg:grid-cols-[1fr_1.3fr] lg:items-start lg:gap-16">
        <motion.p {...riseProps(reduced, { y: 24, amount: 0.5 })} className="lead max-w-[52ch] text-slate">
          Резьба M14, M8 и 5/16"-24, подложки от 1,2" до 6", круги из шерсти,
          микрофибры и поролона в градациях от T10 до T120 — совместимость
          просчитана внутри линейки, поэтому подбор занимает минуты.
        </motion.p>

        {SYSTEM_STEPS.length === 4 && (
          <motion.ol
            {...revealProps(reduced, stagger(0.1, 0.09))}
            className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4"
          >
            {SYSTEM_STEPS.map(({ role, product }) => (
              <motion.li key={product.slug} variants={rise}>
                <a
                  href={productHref(product)}
                  className="group flex h-full flex-col rounded-2xl border border-graphite/[0.1] bg-porcelain p-3 transition-colors duration-300 ease-premium hover:border-graphite/35"
                >
                  <span className="flex aspect-square items-center justify-center overflow-hidden rounded-xl bg-[radial-gradient(120%_100%_at_50%_0%,#F4F7F8_0%,#E2EAEC_60%,#D2DDDF_100%)]">
                    <img
                      src={product.image.replace('.webp', '-thumb.webp')}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      className="h-[80%] w-[80%] object-contain transition-transform duration-500 ease-premium group-hover:scale-[1.06]"
                    />
                  </span>
                  <span className="mt-3 block font-mono text-[0.625rem] uppercase tracking-[0.14em] text-titanium">
                    {role}
                  </span>
                  <span className="mt-1 block truncate text-[0.9375rem] tracking-tight text-graphite">
                    {product.model}
                  </span>
                </a>
              </motion.li>
            ))}
          </motion.ol>
        )}
      </div>
    </section>
  )
}
