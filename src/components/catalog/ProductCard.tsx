import { useRef } from 'react'
import { ArrowUpRight } from 'lucide-react'
import { motion } from 'framer-motion'

import { formatPriceOrInquire, minPrice, variantsLabel, type Product } from '../../data/catalog'
import { useReducedMotion } from '../../hooks/useReducedMotion'
import { riseProps } from '../../lib/motion'
import { productHref } from '../../lib/router'

type Props = {
  product: Product
  index: number
}

export function ProductCard({ product, index }: Props) {
  const reduced = useReducedMotion()
  const cardRef = useRef<HTMLElement>(null)

  /*
   * Свечение и 3D-наклон фото под курсором задаются напрямую через
   * CSS-переменные на DOM-узле (минуя useState) — иначе каждое движение
   * мыши перерисовывало бы всю карточку. При отключённом движении
   * обработчик не вешаем вовсе.
   */
  const handlePointerMove = (event: React.MouseEvent<HTMLElement>) => {
    if (reduced) return
    const rect = cardRef.current?.getBoundingClientRect()
    if (!rect) return
    const px = (event.clientX - rect.left) / rect.width
    const py = (event.clientY - rect.top) / rect.height
    cardRef.current?.style.setProperty('--glow-x', `${px * 100}%`)
    cardRef.current?.style.setProperty('--glow-y', `${py * 100}%`)
    // Наклон мягкий (±6deg) и инвертирован по Y — курсор сверху "приподнимает" фото на себя.
    cardRef.current?.style.setProperty('--tilt-x', `${(px - 0.5) * 12}deg`)
    cardRef.current?.style.setProperty('--tilt-y', `${(0.5 - py) * 12}deg`)
  }
  const multi = product.variants.length > 1
  // Артикул на карточке — это variants[0], так что фото должно быть от
  // того же исполнения, а не товара по умолчанию: иначе показывали бы
  // зелёный T120 в артикуле рядом с оранжевым кругом на фото.
  const defaultVariant = product.variants[0]
  const cardImage = defaultVariant?.image ?? product.image
  const cardImageWidth = defaultVariant?.imageWidth ?? product.imageWidth
  const cardImageHeight = defaultVariant?.imageHeight ?? product.imageHeight
  const thumb = cardImage.replace('.webp', '-thumb.webp')
  const price = minPrice(product)
  const topSpecs = product.specs.slice(0, 2)

  return (
    <motion.article
      {...riseProps(reduced, { y: 28, delay: Math.min(index, 5) * 0.05, amount: 0.15 })}
      ref={cardRef}
      onMouseMove={handlePointerMove}
      className="group relative flex flex-col overflow-hidden bg-porcelain transition-colors duration-500 ease-premium hover:bg-mist"
    >
      {!reduced && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-0 opacity-0 transition-opacity duration-500 ease-premium group-hover:opacity-100"
          style={{
            background:
              'radial-gradient(280px circle at var(--glow-x, 50%) var(--glow-y, 50%), rgba(26,28,30,0.07), transparent 70%)',
          }}
        />
      )}

      {/*
        Раньше это была <button>, открывавшая drawer поверх сетки — клиент
        отметил, что клик по товару должен вести на настоящую страницу с
        собственным URL (работающий "Назад", прямая ссылка, refresh без
        404), а не в модалку без адреса. Теперь это обычная ссылка —
        подхватывается общим SPA-перехватчиком кликов (см. router.ts).
      */}
      <a
        href={productHref(product)}
        aria-label={`Открыть карточку ${product.model}`}
        className="relative z-10 flex flex-1 flex-col p-5 text-left outline-none focus-visible:ring-1 focus-visible:ring-graphite/40 sm:p-6"
      >
        {/* Клиент дважды отмечал, что подпись типа товара над фото плохо
            видна — titanium технически проходит контраст, но на мелком
            моноширинном тексте субъективно читается тускло. graphite/80
            + чуть более жирное начертание решает это радикальнее. */}
        <p className="font-mono text-[0.625rem] font-medium uppercase leading-relaxed tracking-[0.14em] text-graphite/80">
          {product.kind}
        </p>

        <div className="relative mt-5 flex h-32 items-center justify-center overflow-hidden sm:h-36 [perspective:700px]">
          {/*
            Бейдж числа вариантов виден всегда, не только на hover — на
            touch-экране hover не срабатывает вовсе, и было неясно, что за
            карточкой скрывается несколько позиций (например, 4 состава
            V-Range или 5 градаций круга), а не одна.
          */}
          {multi && (
            <span className="absolute right-0 top-0 rounded-full border border-graphite/15 bg-porcelain px-2.5 py-1 font-mono text-[0.625rem] uppercase tracking-[0.1em] text-graphite/70">
              {variantsLabel(product.variants.length)}
            </span>
          )}
          <img
            src={thumb}
            srcSet={`${thumb} 300w, ${cardImage} 700w`}
            sizes="(min-width: 1280px) 280px, (min-width: 640px) 40vw, 80vw"
            width={cardImageWidth}
            height={cardImageHeight}
            alt={`ShineMate ${product.model}`}
            loading="lazy"
            decoding="async"
            className="max-h-full w-auto max-w-full object-contain transition-transform duration-500 ease-premium group-hover:[transform:perspective(700px)_rotateX(var(--tilt-y,0deg))_rotateY(var(--tilt-x,0deg))_scale(1.05)]"
          />
        </div>

        <h3 className="mt-5 text-xl tracking-tight sm:text-2xl">{product.model}</h3>
        {/* Артикул виден сразу на карточке, а не только внутри drawer — для
            товара с одним исполнением это его SKU, для многовариантного —
            SKU того, что выбрано по умолчанию (бейдж выше поясняет, что есть ещё). */}
        <p className="mt-1 font-mono text-[0.75rem] tracking-tight text-graphite/45">
          Арт. {product.variants[0]?.sku}
        </p>
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
              {multi ? `РРЦ от · ${variantsLabel(product.variants.length)}` : 'РРЦ'}
            </p>
            <p className="mt-1 truncate text-lg tracking-tight">{formatPriceOrInquire(price)}</p>
          </div>
          {/* Всегда видимая стрелка — сигнал «нажми, откроется подробнее», не завязанный на hover. */}
          <span
            aria-hidden
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-graphite/15 text-graphite/50 transition-colors duration-500 ease-premium group-hover:border-graphite/40 group-hover:text-graphite"
          >
            <ArrowUpRight size={15} />
          </span>
        </div>
      </a>
    </motion.article>
  )
}
