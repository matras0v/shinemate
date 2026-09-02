import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'

import { useReducedMotion } from '../../hooks/useReducedMotion'
import { riseProps } from '../../lib/motion'

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

      <motion.p
        {...riseProps(reduced, { y: 24, amount: 0.5 })}
        className="shell lead mt-10 max-w-[52ch] text-slate"
      >
        Резьба M14, M8 и 5/16"-24, подложки от 1,2" до 6", круги из шерсти,
        микрофибры и поролона в градациях от T10 до T120 — совместимость
        просчитана внутри линейки, поэтому подбор занимает минуты.
      </motion.p>
    </section>
  )
}
