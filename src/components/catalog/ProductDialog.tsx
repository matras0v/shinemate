import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, Check, X } from 'lucide-react'

import {
  categoryTitle,
  formatPrice,
  getRelatedProducts,
  minPrice,
  priceNote,
  relatedNote,
  type Product,
  type Variant,
} from '../../data/catalog'
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock'
import { useLead } from '../../lib/leadContext'
import { EASE } from '../../lib/motion'

type Props = {
  product: Product | null
  onClose: () => void
  onSwitchProduct: (product: Product) => void
}

/**
 * Подробная карточка товара.
 *
 * Выбран выезжающий drawer, а не отдельный маршрут: пользователь смотрит
 * несколько позиций подряд и не должен каждый раз терять место в сетке.
 */
export function ProductDialog({ product, onClose, onSwitchProduct }: Props) {
  const panel = useRef<HTMLDivElement>(null)
  const { requestProduct, requestWholesale } = useLead()

  useBodyScrollLock(!!product)

  useEffect(() => {
    if (!product) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    panel.current?.focus()
    return () => {
      document.removeEventListener('keydown', onKey)
    }
  }, [product, onClose])

  // Переключение на рекомендованный товар не переоткрывает drawer заново
  // (product меняется, а не появляется), поэтому скролл содержимого сам
  // не возвращается наверх — делаем это явно, чтобы новая карточка
  // открывалась с заголовка, а не с той же прокрутки, где был клик.
  const productSlug = product?.slug
  useEffect(() => {
    if (productSlug) panel.current?.scrollTo({ top: 0, behavior: 'instant' })
  }, [productSlug])

  // Строки исполнений выглядели как список опций, но нажатие на них ничего
  // не делало — выбор всегда уходил как первое исполнение. Теперь строка
  // реально выбирается, и именно она попадает в заявку.
  const [selectedSku, setSelectedSku] = useState<string | undefined>(product?.variants[0]?.sku)
  useEffect(() => {
    setSelectedSku(product?.variants[0]?.sku)
  }, [productSlug, product?.variants])
  const selectedVariant: Variant | undefined =
    product?.variants.find((v) => v.sku === selectedSku) ?? product?.variants[0]

  const related = product ? getRelatedProducts(product) : []

  return (
    <AnimatePresence>
      {product && (
        <motion.div
          className="fixed inset-0 z-[70] flex justify-end"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: EASE }}
        >
          <button
            type="button"
            aria-label="Закрыть"
            onClick={onClose}
            className="absolute inset-0 cursor-default bg-ink/25 backdrop-blur-[2px]"
          />

          <motion.div
            ref={panel}
            role="dialog"
            aria-modal="true"
            aria-label={`ShineMate ${product.model}`}
            tabIndex={-1}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.55, ease: EASE }}
            className="relative flex h-full w-full max-w-[34rem] flex-col overflow-y-auto overscroll-contain bg-porcelain outline-none"
          >
            <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-graphite/[0.1] bg-porcelain/90 px-6 py-4 backdrop-blur-xl sm:px-8">
              <p className="font-mono text-[0.625rem] uppercase tracking-[0.16em] text-titanium">
                {categoryTitle(product.category)}
              </p>
              <button
                type="button"
                onClick={onClose}
                aria-label="Закрыть карточку"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-graphite/15 text-graphite/60 transition-colors duration-500 ease-premium hover:border-graphite/50 hover:text-graphite"
              >
                <X size={16} />
              </button>
            </div>

            <div className="px-6 pb-[max(3rem,env(safe-area-inset-bottom))] sm:px-8">
              <div className="mt-6 flex h-60 items-center justify-center rounded-[1.5rem] bg-mist p-6 sm:h-72">
                <img
                  src={product.image}
                  width={product.imageWidth}
                  height={product.imageHeight}
                  alt={`ShineMate ${product.model}`}
                  className="max-h-full w-auto max-w-full object-contain"
                />
              </div>

              <h2 className="mt-7 text-[clamp(1.75rem,5vw,2.5rem)] leading-[1.05] tracking-tight">
                {product.model}
              </h2>
              <p className="mt-1.5 text-[0.9375rem] text-graphite/45">{product.kind}</p>
              <p className="mt-5 text-[0.9375rem] leading-relaxed text-graphite/70">{product.lead}</p>

              <h3 className="eyebrow mt-9">Характеристики</h3>
              <dl className="mt-4 space-y-3 border-t border-graphite/[0.12] pt-4">
                {product.specs.map((spec) => (
                  <div key={spec.label} className="flex items-baseline justify-between gap-6">
                    <dt className="text-[0.875rem] text-graphite/45">{spec.label}</dt>
                    <dd className="text-right font-mono text-[0.875rem] tracking-tight">
                      {spec.value}
                    </dd>
                  </div>
                ))}
              </dl>

              {product.includes && product.includes.length > 0 && (
                <>
                  <h3 className="eyebrow mt-9">Комплектация</h3>
                  <ul className="mt-4 space-y-2 border-t border-graphite/[0.12] pt-4">
                    {product.includes.map((item) => (
                      <li
                        key={item}
                        className="flex gap-3 text-[0.875rem] leading-relaxed text-graphite/70"
                      >
                        <span aria-hidden className="mt-2 h-px w-3 shrink-0 bg-graphite/30" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </>
              )}

              <h3 className="eyebrow mt-9">
                {product.variants.length > 1 ? 'Исполнения и РРЦ' : 'Артикул и РРЦ'}
              </h3>
              {product.variants.length > 1 ? (
                <p className="mt-1 text-[0.8125rem] text-graphite/45">
                  Выберите нужное — оно попадёт в заявку.
                </p>
              ) : null}
              <ul className="mt-4 space-y-2">
                {product.variants.map((variant) =>
                  product.variants.length > 1 ? (
                    <li key={variant.sku}>
                      <button
                        type="button"
                        onClick={() => setSelectedSku(variant.sku)}
                        aria-pressed={selectedVariant?.sku === variant.sku}
                        className={`flex w-full items-center gap-3 rounded-2xl border p-3.5 text-left transition-colors duration-300 ease-premium ${
                          selectedVariant?.sku === variant.sku
                            ? 'border-graphite bg-mist'
                            : 'border-graphite/[0.12] hover:border-graphite/30 hover:bg-mist/50'
                        }`}
                      >
                        <span
                          aria-hidden
                          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors duration-300 ease-premium ${
                            selectedVariant?.sku === variant.sku
                              ? 'border-graphite bg-graphite text-porcelain'
                              : 'border-graphite/25'
                          }`}
                        >
                          {selectedVariant?.sku === variant.sku && <Check size={12} />}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block font-mono text-[0.8125rem] tracking-tight">
                            {variant.sku}
                          </span>
                          <span className="mt-0.5 block text-[0.8125rem] text-graphite/50">
                            {variant.label}
                          </span>
                        </span>
                        <span className="shrink-0 text-[1.0625rem] tracking-tight">
                          {formatPrice(variant.rrp)}
                        </span>
                      </button>
                    </li>
                  ) : (
                    <li
                      key={variant.sku}
                      className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-t border-graphite/[0.12] py-3.5"
                    >
                      <span className="min-w-0">
                        <span className="block font-mono text-[0.8125rem] tracking-tight">
                          {variant.sku}
                        </span>
                        <span className="mt-0.5 block text-[0.8125rem] text-graphite/50">
                          {variant.label}
                        </span>
                      </span>
                      <span className="shrink-0 text-[1.0625rem] tracking-tight">
                        {formatPrice(variant.rrp)}
                      </span>
                    </li>
                  ),
                )}
              </ul>
              <p className="mt-3 font-mono text-[0.625rem] uppercase tracking-[0.14em] text-titanium">
                {priceNote}
              </p>

              <div className="mt-9">
                <button
                  type="button"
                  onClick={() => {
                    requestProduct(product, selectedVariant)
                    onClose()
                  }}
                  className="inline-flex items-center rounded-full bg-graphite px-6 py-3.5 text-sm text-porcelain transition-colors duration-500 ease-premium hover:bg-ink"
                >
                  Уточнить наличие
                </button>
                <button
                  type="button"
                  onClick={() => {
                    requestWholesale()
                    onClose()
                  }}
                  className="mt-4 block text-[0.8125rem] text-graphite/50 underline decoration-graphite/25 underline-offset-4 transition-colors duration-500 ease-premium hover:text-graphite"
                >
                  Нужна партия? Получить оптовый прайс →
                </button>
              </div>

              {related.length > 0 && (
                <div className="mt-11 border-t border-graphite/[0.12] pt-8">
                  <h3 className="eyebrow">Смотрите также</h3>
                  <ul className="mt-4 space-y-3">
                    {related.map((candidate) => {
                      const price = minPrice(candidate)
                      return (
                        <li key={candidate.slug}>
                          <button
                            type="button"
                            onClick={() => onSwitchProduct(candidate)}
                            className="group flex w-full items-center gap-4 rounded-2xl border border-graphite/[0.1] p-3 text-left transition-colors duration-400 ease-premium hover:border-graphite/30 hover:bg-mist/60"
                          >
                            <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-mist p-2">
                              <img
                                src={candidate.image}
                                alt={`ShineMate ${candidate.model}`}
                                className="max-h-full w-auto max-w-full object-contain"
                              />
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-[0.9375rem] tracking-tight">
                                {candidate.model}
                              </span>
                              <span className="mt-0.5 block truncate text-[0.8125rem] text-graphite/50">
                                {relatedNote(candidate, product)}
                              </span>
                            </span>
                            <span className="flex shrink-0 items-center gap-2">
                              {price != null && (
                                <span className="text-[0.875rem] tracking-tight text-graphite/80">
                                  {candidate.variants.length > 1 ? 'от ' : ''}
                                  {formatPrice(price)}
                                </span>
                              )}
                              <ArrowRight
                                size={15}
                                className="shrink-0 text-graphite/30 transition-transform duration-400 ease-premium group-hover:translate-x-0.5 group-hover:text-graphite/60"
                              />
                            </span>
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
