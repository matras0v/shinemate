import { motion } from 'framer-motion'

import { formatPriceOrInquire, minPrice, type Product } from '../../data/catalog'
import { useReducedMotion } from '../../hooks/useReducedMotion'
import { riseProps } from '../../lib/motion'

type Props = {
  product: Product
  index: number
  onOpen: (product: Product) => void
}

export function ProductCard({ product, index, onOpen }: Props) {
  const reduced = useReducedMotion()
  const multi = product.variants.length > 1
  const thumb = product.image.replace('.webp', '-thumb.webp')
  const price = minPrice(product)
  const topSpecs = product.specs.slice(0, 2)

  return (
    <motion.article
      {...riseProps(reduced, { y: 28, delay: Math.min(index, 5) * 0.05, amount: 0.15 })}
      className="group relative flex flex-col bg-porcelain transition-colors duration-500 ease-premium hover:bg-mist"
    >
      <button
        type="button"
        onClick={() => onOpen(product)}
        aria-label={`Открыть карточку ${product.model}`}
        className="flex flex-1 flex-col p-5 text-left outline-none focus-visible:ring-1 focus-visible:ring-graphite/40 sm:p-6"
      >
        <p className="font-mono text-[0.625rem] uppercase leading-relaxed tracking-[0.14em] text-titanium">
          {product.kind}
        </p>

        <div className="mt-5 flex h-32 items-center justify-center overflow-hidden sm:h-36">
          <img
            src={thumb}
            srcSet={`${thumb} 300w, ${product.image} 700w`}
            sizes="(min-width: 1280px) 280px, (min-width: 640px) 40vw, 80vw"
            width={product.imageWidth}
            height={product.imageHeight}
            alt={`ShineMate ${product.model}`}
            loading="lazy"
            decoding="async"
            className="max-h-full w-auto max-w-full object-contain transition-transform duration-[800ms] ease-premium group-hover:scale-[1.05]"
          />
        </div>

        <h3 className="mt-5 text-xl tracking-tight sm:text-2xl">{product.model}</h3>
        <p className="mt-2.5 line-clamp-2 text-[0.875rem] leading-relaxed text-graphite/60">
          {product.lead}
        </p>

        {topSpecs.length > 0 && (
          <dl className="mt-4 space-y-1">
            {topSpecs.map((spec) => (
              <div key={spec.label} className="flex items-baseline gap-2 text-[0.75rem]">
                <dt className="text-graphite/40">{spec.label}</dt>
                <dd className="font-mono text-graphite/70">{spec.value}</dd>
              </div>
            ))}
          </dl>
        )}

        <div className="flex-1" />

        <div className="mt-5 flex items-end justify-between gap-4 border-t border-graphite/[0.12] pt-4">
          <div className="min-w-0">
            <p className="font-mono text-[0.625rem] uppercase tracking-[0.14em] text-titanium">
              {multi ? `РРЦ от · ${product.variants.length} исполнения` : 'РРЦ'}
            </p>
            <p className="mt-1 truncate text-lg tracking-tight">{formatPriceOrInquire(price)}</p>
          </div>
        </div>
      </button>
    </motion.article>
  )
}
