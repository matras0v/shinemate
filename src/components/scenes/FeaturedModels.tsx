import { motion } from 'framer-motion'
import { ArrowUpRight } from 'lucide-react'

import { featured, priceNote, totalSkus } from '../../data/catalog'
import { revealProps, rise, stagger } from '../../lib/motion'
import { ProductCard } from '../catalog/ProductCard'
import { useReducedMotion } from '../../hooks/useReducedMotion'

export function FeaturedModels() {
  const reduced = useReducedMotion()
  return (
    <section id="models" className="scene relative bg-porcelain py-24 sm:py-28 md:py-36">
      <motion.div
        {...revealProps(reduced, stagger(0, 0.08))}
        className="shell-wide"
      >
        <motion.p variants={rise} className="eyebrow">
          Избранные модели
        </motion.p>
        <div className="mt-5 flex flex-col gap-5 md:flex-row md:items-end md:justify-between md:gap-10">
          <motion.h2 variants={rise} className="h2 max-w-[16ch]">
            Машинки, с которых начинают
          </motion.h2>
          <motion.div variants={rise} className="shrink-0 md:text-right">
            <a
              href="catalog"
              className="group inline-flex items-center gap-2 text-[0.9375rem] text-slate transition-colors duration-500 ease-premium hover:text-graphite"
            >
              Все {totalSkus} позиций каталога
              <ArrowUpRight
                size={16}
                className="transition-transform duration-500 ease-premium group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              />
            </a>
            <p className="mt-2 font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-titanium">
              {priceNote}
            </p>
          </motion.div>
        </div>
      </motion.div>

      {/*
        Клиент: «не надо любой ценой впихивать 4 карточки в строку — если
        от этого товар становится мелким, лучше 3». Максимум три колонки:
        на 1440–1680px карточка получается ~500px, и машинка на фото
        читается, а не угадывается.
      */}
      <div className="shell-wide mt-12 sm:mt-14">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {/* Шесть, а не семь: при трёх колонках седьмая карточка оставалась
              одна в последней строке и выглядела обрывом сетки. */}
          {featured.slice(0, 6).map((product, i) => (
            <ProductCard key={product.slug} product={product} index={i} />
          ))}
        </div>
      </div>
    </section>
  )
}
