import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { ArrowUpRight } from 'lucide-react'

import { products } from '../../data/catalog'
import { useReducedMotion } from '../../hooks/useReducedMotion'
import { revealProps, rise, stagger } from '../../lib/motion'

// В качестве героя сцены — EP820: официальный рендер вендора высокого разрешения.
const hero = products.find((p) => p.slug === 'ep820') ?? products[0]

export function ProductObject() {
  const section = useRef<HTMLElement>(null)
  const reduced = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: section, offset: ['start end', 'end start'] })

  // Объект входит в кадр, набирает масштаб и уходит — одно непрерывное движение.
  const y = useTransform(scrollYProgress, [0, 0.5, 1], ['10%', '0%', '-10%'])
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.94, 1.03, 0.99])
  const glow = useTransform(scrollYProgress, [0, 0.5, 1], [0, 0.7, 0])

  return (
    <section
      id="about"
      ref={section}
      className="scene relative overflow-hidden bg-porcelain py-24 sm:py-28 md:py-36"
    >
      {/*
        На мобильном текст и картинка идут прямо в DOM-порядке одной колонкой,
        поэтому фото стоит между вводным абзацем и блоком характеристик — так
        длинная текстовая простыня разбивается визуально, а не откладывается
        на самый конец секции. На lg — явная раскладка по col/row-start:
        фото занимает вторую колонку на всю высоту, оба текстовых блока
        держатся в первой друг под другом, ровно как раньше в едином блоке.
      */}
      <div className="shell grid items-center gap-10 lg:grid-cols-2 lg:items-stretch lg:gap-16 xl:gap-24">
        <motion.div
          {...revealProps(reduced, stagger(0, 0.09))}
          className="min-w-0 lg:col-start-1 lg:row-start-1"
        >
          <motion.p variants={rise} className="eyebrow">
            О ShineMate
          </motion.p>
          <motion.h2 variants={rise} className="h2 mt-5 max-w-[15ch]">
            Инструмент, который держит результат
          </motion.h2>
          <motion.p variants={rise} className="lead mt-6 max-w-[46ch] text-graphite/65">
            ShineMate выпускает полный цикл оборудования для подготовки и полировки
            кузова: роторные и эксцентриковые машины, шлифование, аккумуляторные
            платформы, подложки, круги и составы. Линейка собрана так, чтобы машина,
            подложка и круг работали как один инструмент.
          </motion.p>
        </motion.div>

        <div className="relative min-w-0 lg:col-start-2 lg:row-span-2 lg:row-start-1">
          <motion.div
            aria-hidden
            style={reduced ? undefined : { opacity: glow }}
            className="pointer-events-none absolute left-1/2 top-1/2 h-[62%] w-[78%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,#DCE7EA_0%,rgba(220,231,234,0)_70%)] blur-2xl"
          />
          <motion.img
            src="media/product-1600.webp"
            srcSet="media/product-640.webp 640w, media/product-1000.webp 1000w, media/product-1600.webp 1600w"
            sizes="(min-width: 1024px) 48vw, 92vw"
            width={1600}
            height={1195}
            alt="Роторная полировальная машина ShineMate в студийном свете"
            loading="lazy"
            decoding="async"
            style={reduced ? undefined : { y, scale }}
            className="relative w-full select-none rounded-[1.5rem] md:rounded-[2rem]"
          />
        </div>

        <motion.div
          {...revealProps(reduced, stagger(0, 0.09))}
          className="min-w-0 lg:col-start-1 lg:row-start-2"
        >
          <motion.div variants={rise} className="border-t border-graphite/[0.12] pt-6">
            <p className="font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-titanium">
              Флагман линейки · {hero.model}
            </p>
            <p className="mt-3 max-w-[44ch] text-[0.9375rem] leading-relaxed text-graphite/60">
              {hero.lead}
            </p>
          </motion.div>

          <motion.dl variants={rise} className="mt-8 grid grid-cols-2 gap-x-6 gap-y-6 sm:gap-x-10">
            {hero.specs.slice(0, 4).map((spec) => (
              <div key={spec.label} className="min-w-0 border-t border-graphite/[0.12] pt-3.5">
                <dt className="font-mono text-[0.625rem] uppercase tracking-[0.14em] text-titanium">
                  {spec.label}
                </dt>
                <dd className="mt-2 text-[0.9375rem] tracking-tight text-graphite sm:text-[1.0625rem]">
                  {spec.value}
                </dd>
              </div>
            ))}
          </motion.dl>

          <motion.a
            variants={rise}
            href="catalog"
            className="group mt-9 inline-flex items-center gap-2 rounded-full border border-graphite/20 px-6 py-3.5 text-sm transition-colors duration-500 ease-premium hover:border-graphite/50 hover:bg-graphite/[0.04]"
          >
            Смотреть каталог
            <ArrowUpRight
              size={16}
              className="transition-transform duration-500 ease-premium group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            />
          </motion.a>
        </motion.div>
      </div>
    </section>
  )
}
