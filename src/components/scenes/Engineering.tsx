import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'

import { engineeringFacts } from '../../data/catalog'
import { useReducedMotion } from '../../hooks/useReducedMotion'
import { riseProps } from '../../lib/motion'

export function Engineering() {
  const section = useRef<HTMLElement>(null)
  const reduced = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: section, offset: ['start end', 'end start'] })
  // Фоновая подложка едет медленнее контента — секция получает глубину.
  const backdropY = useTransform(scrollYProgress, [0, 1], ['-8%', '8%'])

  return (
    <section
      id="tech"
      ref={section}
      className="scene grain relative overflow-hidden bg-graphite py-28 text-porcelain md:py-40"
    >
      <motion.div
        aria-hidden
        style={reduced ? undefined : { y: backdropY }}
        className="pointer-events-none absolute inset-0 opacity-[0.16]"
      >
        <img
          src="media/surface-after-1280.webp"
          alt=""
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover"
        />
      </motion.div>

      <div className="shell relative z-10">
        <motion.p
          {...riseProps(reduced, { y: 0, amount: 0.1 })}
          className="font-mono text-[0.6875rem] uppercase tracking-[0.24em] text-porcelain/40"
        >
          Технологии
        </motion.p>
        <motion.h2
          {...riseProps(reduced, { y: 32, delay: 0.08, amount: 0.1 })}
          className="h2 mt-5 max-w-[16ch]"
        >
          Цифры, по которым выбирают
        </motion.h2>

        <div className="mt-16 grid gap-x-12 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
          {engineeringFacts.map((fact, index) => (
            <motion.div
              key={fact.value + fact.unit}
              {...riseProps(reduced, { y: 34, delay: (index % 3) * 0.1, amount: 0.4 })}
              className="border-t border-porcelain/15 pt-6"
            >
              <p className="flex items-baseline gap-2 tracking-tight">
                <span className="text-[clamp(2.75rem,2rem+3.4vw,5rem)] font-light leading-none">
                  {fact.value}
                </span>
                <span className="font-mono text-sm text-porcelain/45">{fact.unit}</span>
              </p>
              <p className="mt-5 max-w-[30ch] text-[0.9375rem] leading-relaxed text-porcelain/55">
                {fact.caption}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
