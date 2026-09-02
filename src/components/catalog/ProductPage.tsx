import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, Check, ChevronRight, X, ZoomIn } from 'lucide-react'

import {
  categoryTitle,
  formatPrice,
  getRelatedProducts,
  minPrice,
  priceNote,
  productHighlights,
  relatedNote,
  type Product,
  type Variant,
} from '../../data/catalog'
import { useReducedMotion } from '../../hooks/useReducedMotion'
import { useLead } from '../../lib/leadContext'
import { revealProps, rise, riseProps, stagger } from '../../lib/motion'
import { productHref } from '../../lib/router'

type Props = {
  product: Product
}

/**
 * Полноценная страница товара — реальный маршрут /catalog/<категория>/<slug>,
 * а не выезжающий drawer поверх сетки. Клиент явно попросил именно так:
 * работающий "Назад" в браузере, прямой переход по ссылке, обновление
 * страницы без 404. Drawer (ProductDialog) для этого не годился — у него
 * никогда не было собственного URL — поэтому вся его логика (выбор
 * исполнения по осям, похожие товары, увеличение фото) перенесена сюда.
 *
 * Контент собирается только из полей Product — никаких выдуманных галерей,
 * "деталей конструкции" или маркетинговых буллетов, которых нет в прайсе
 * клиента. Там, где реальных данных для богатой презентации недостаточно
 * (у большинства из 113 позиций есть только: фото, характеристики, состав
 * комплекта и цена) — страница остаётся компактной, но не пустой.
 */
export function ProductPage({ product }: Props) {
  const reduced = useReducedMotion()
  const { requestProduct, requestWholesale } = useLead()

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [product.slug])

  const [zoomOpen, setZoomOpen] = useState(false)
  useEffect(() => setZoomOpen(false), [product.slug])
  useEffect(() => {
    if (!zoomOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setZoomOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [zoomOpen])

  const [selectedSku, setSelectedSku] = useState<string | undefined>(product.variants[0]?.sku)
  useEffect(() => {
    setSelectedSku(product.variants[0]?.sku)
  }, [product.slug, product.variants])
  const selectedVariant: Variant | undefined =
    product.variants.find((v) => v.sku === selectedSku) ?? product.variants[0]

  const showAxisChips = product.variants.length > 1 && product.variants.every((v) => v.axis1)
  const axis1Options = showAxisChips ? Array.from(new Set(product.variants.map((v) => v.axis1!))) : []
  const axis2Options = showAxisChips
    ? Array.from(
        new Set(
          product.variants
            .filter((v) => v.axis1 === selectedVariant?.axis1)
            .map((v) => v.axis2)
            .filter((v): v is string => Boolean(v)),
        ),
      )
    : []
  const selectAxis1 = (axis1: string) => {
    const candidates = product.variants.filter((v) => v.axis1 === axis1)
    const keepSame = candidates.find((v) => v.axis2 === selectedVariant?.axis2)
    setSelectedSku((keepSame ?? candidates[0])?.sku)
  }
  const selectAxis2 = (axis2: string) => {
    const match = product.variants.find((v) => v.axis1 === selectedVariant?.axis1 && v.axis2 === axis2)
    if (match) setSelectedSku(match.sku)
  }

  const related = getRelatedProducts(product)
  const highlights = productHighlights(product)

  return (
    <div className="min-h-[100dvh] bg-porcelain pb-24 pt-[5.5rem] md:pb-32">
      <div className="shell pt-8 md:pt-12">
        {/* Хлебные крошки — тот путь, которым реально пришли: каталог →
            категория → модель. Работают как обычные ссылки проекта. */}
        <nav aria-label="Хлебные крошки" className="flex flex-wrap items-center gap-1.5 text-[0.8125rem] text-slate">
          <a href="catalog" className="transition-colors duration-400 ease-premium hover:text-graphite">
            Каталог
          </a>
          <ChevronRight size={13} className="shrink-0 text-graphite/25" />
          <a
            href={`catalog/${product.category}`}
            className="transition-colors duration-400 ease-premium hover:text-graphite"
          >
            {categoryTitle(product.category)}
          </a>
          <ChevronRight size={13} className="shrink-0 text-graphite/25" />
          <span className="text-ash">{product.model}</span>
        </nav>

        <a
          href={`catalog/${product.category}`}
          className="group mt-5 inline-flex items-center gap-2 text-[0.875rem] text-slate transition-colors duration-500 ease-premium hover:text-graphite"
        >
          <ArrowLeft size={15} className="transition-transform duration-500 ease-premium group-hover:-translate-x-0.5" />
          Назад в каталог
        </a>
      </div>

      {/* 01 — HERO: фото, название, артикул, цена, CTA. */}
      <div className="shell mt-8 grid gap-10 lg:grid-cols-2 lg:gap-16">
        <motion.div {...riseProps(reduced, { y: 24, amount: 0.3 })}>
          <button
            type="button"
            onClick={() => setZoomOpen(true)}
            aria-label="Увеличить фото"
            className="group relative flex h-80 w-full items-center justify-center rounded-[1.75rem] bg-mist p-8 sm:h-[26rem]"
          >
            <img
              src={selectedVariant?.image ?? product.image}
              width={selectedVariant?.imageWidth ?? product.imageWidth}
              height={selectedVariant?.imageHeight ?? product.imageHeight}
              alt={`ShineMate ${product.model}${selectedVariant?.axis1 ? ` — ${selectedVariant.axis1}` : ''}`}
              className="max-h-full w-auto max-w-full object-contain"
            />
            <span
              aria-hidden
              className="absolute bottom-4 right-4 flex h-10 w-10 items-center justify-center rounded-full border border-graphite/15 bg-porcelain/90 text-slate backdrop-blur-sm transition-colors duration-300 ease-premium group-hover:border-graphite/40 group-hover:text-graphite"
            >
              <ZoomIn size={16} />
            </span>
          </button>
          {selectedVariant?.note && (
            <p className="mt-3 text-[0.8125rem] leading-relaxed text-titanium">{selectedVariant.note}</p>
          )}
        </motion.div>

        <motion.div {...revealProps(reduced, stagger(0, 0.08))}>
          <motion.p variants={rise} className="font-mono text-[0.6875rem] font-medium uppercase tracking-[0.16em] text-ash">
            {categoryTitle(product.category)} · {product.kind}
          </motion.p>
          <motion.h1 variants={rise} className="h1-sm mt-4">
            {product.model}
          </motion.h1>
          <motion.p variants={rise} className="mt-2 font-mono text-[0.875rem] tracking-tight text-slate">
            Артикул: {selectedVariant?.sku}
          </motion.p>
          <motion.p variants={rise} className="mt-5 max-w-[52ch] text-[1rem] leading-relaxed text-ash">
            {product.lead}
          </motion.p>

          {/* Компактные ключевые характеристики рядом с ценой — не вся
              таблица, а те 3-4 значения, что нужны для первого решения. */}
          {product.specs.length > 0 && (
            <motion.dl variants={rise} className="mt-7 grid grid-cols-2 gap-x-6 gap-y-4 border-t border-graphite/[0.12] pt-6 sm:grid-cols-3">
              {product.specs.slice(0, 6).map((spec) => (
                <div key={spec.label}>
                  <dt className="font-mono text-[0.625rem] uppercase tracking-[0.12em] text-titanium">
                    {spec.label}
                  </dt>
                  <dd className="mt-1 text-[0.9375rem] tracking-tight">{spec.value}</dd>
                </div>
              ))}
            </motion.dl>
          )}

          <motion.div variants={rise} className="mt-7 flex items-baseline gap-3 border-t border-graphite/[0.12] pt-6">
            <p className="text-[1.75rem] tracking-tight">
              {selectedVariant ? formatPrice(selectedVariant.rrp) : '—'}
            </p>
            <p className="font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-titanium">{priceNote}</p>
          </motion.div>

          <motion.div variants={rise} className="mt-7 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => requestProduct(product, selectedVariant)}
              className="inline-flex items-center rounded-full bg-graphite px-7 py-3.5 text-sm text-porcelain transition-colors duration-500 ease-premium hover:bg-ink"
            >
              Запросить прайс
            </button>
            <button
              type="button"
              onClick={requestWholesale}
              className="inline-flex items-center rounded-full border border-graphite/20 px-7 py-3.5 text-sm text-graphite transition-colors duration-500 ease-premium hover:border-graphite/50 hover:bg-graphite/[0.04]"
            >
              Получить консультацию
            </button>
          </motion.div>
        </motion.div>
      </div>

      <div className="shell mt-16 grid gap-16 lg:grid-cols-[1fr_20rem] lg:items-start">
        <div className="min-w-0">
          {/* 02 — Практические преимущества, только там, где факт подтверждён
              в другом месте сайта (см. productHighlights). */}
          {highlights && highlights.length > 0 && (
            <section>
              <h2 className="eyebrow">Преимущества платформы</h2>
              <ul className="mt-4 space-y-2.5 border-t border-graphite/[0.12] pt-5">
                {highlights.map((h) => (
                  <li key={h} className="flex gap-3 text-[0.9375rem] leading-relaxed text-ash">
                    <Check size={16} className="mt-0.5 shrink-0 text-ember" />
                    {h}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* 03 — Полные характеристики. */}
          <section className={highlights ? 'mt-12' : undefined}>
            <h2 className="eyebrow">Характеристики</h2>
            <dl className="mt-4 divide-y divide-graphite/[0.1] border-t border-graphite/[0.12]">
              {product.specs.map((spec) => (
                <div key={spec.label} className="flex items-baseline justify-between gap-6 py-3.5">
                  <dt className="text-[0.9375rem] text-slate">{spec.label}</dt>
                  <dd className="text-right font-mono text-[0.9375rem] tracking-tight">{spec.value}</dd>
                </div>
              ))}
            </dl>
          </section>

          {/* Комплектация. */}
          {product.includes && product.includes.length > 0 && (
            <section className="mt-12">
              <h2 className="eyebrow">Комплектация</h2>
              <ul className="mt-4 space-y-2.5 border-t border-graphite/[0.12] pt-5">
                {product.includes.map((item) => (
                  <li key={item} className="flex gap-3 text-[0.9375rem] leading-relaxed text-ash">
                    <span aria-hidden className="mt-2.5 h-px w-3 shrink-0 bg-graphite/30" />
                    {item}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Исполнения — выбор влияет на фото/артикул/цену выше. */}
          <section className="mt-12">
            <h2 className="eyebrow">
              {product.variants.length > 1 ? 'Исполнения и РРЦ' : 'Артикул и РРЦ'}
            </h2>

            {showAxisChips ? (
              <div className="mt-4 space-y-5">
                <div>
                  <p className="text-[0.75rem] uppercase tracking-[0.1em] text-titanium">
                    {product.axisLabel ?? 'Градация'}
                  </p>
                  <div className="mt-2.5 flex flex-wrap gap-2">
                    {axis1Options.map((axis1) => (
                      <button
                        key={axis1}
                        type="button"
                        onClick={() => selectAxis1(axis1)}
                        aria-pressed={selectedVariant?.axis1 === axis1}
                        className={`rounded-full border px-4 py-2 text-[0.875rem] tracking-tight transition-colors duration-300 ease-premium ${
                          selectedVariant?.axis1 === axis1
                            ? 'border-graphite bg-graphite text-porcelain'
                            : 'border-graphite/[0.15] text-graphite hover:border-graphite/40'
                        }`}
                      >
                        {axis1}
                      </button>
                    ))}
                  </div>
                </div>
                {axis2Options.length > 0 && (
                  <div>
                    <p className="text-[0.75rem] uppercase tracking-[0.1em] text-titanium">Размер</p>
                    <div className="mt-2.5 flex flex-wrap gap-2">
                      {axis2Options.map((axis2) => (
                        <button
                          key={axis2}
                          type="button"
                          onClick={() => selectAxis2(axis2)}
                          aria-pressed={selectedVariant?.axis2 === axis2}
                          className={`rounded-full border px-4 py-2 text-[0.875rem] tracking-tight transition-colors duration-300 ease-premium ${
                            selectedVariant?.axis2 === axis2
                              ? 'border-graphite bg-graphite text-porcelain'
                              : 'border-graphite/[0.15] text-graphite hover:border-graphite/40'
                          }`}
                        >
                          {axis2}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              product.variants.length > 1 && (
                <>
                  <p className="mt-1 text-[0.8125rem] text-titanium">Выберите нужное — оно попадёт в заявку.</p>
                  <ul className="mt-4 space-y-2">
                    {product.variants.map((variant) => (
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
                            <span className="block font-mono text-[0.8125rem] tracking-tight">{variant.sku}</span>
                            <span className="mt-0.5 block text-[0.8125rem] text-slate">{variant.label}</span>
                          </span>
                          <span className="shrink-0 text-[1.0625rem] tracking-tight">{formatPrice(variant.rrp)}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </>
              )
            )}
          </section>
        </div>

        {/* Похожие товары той же категории — реальные соседи по прайсу,
            ближайшие по цене (см. getRelatedProducts), а не выдуманная
            "система совместимости" на уровне конкретных SKU, которой в
            данных клиента нет. */}
        {related.length > 0 && (
          <aside className="lg:sticky lg:top-[6.5rem]">
            <h2 className="eyebrow">Смотрите также</h2>
            <ul className="mt-4 space-y-3">
              {related.map((candidate) => {
                const price = minPrice(candidate)
                return (
                  <li key={candidate.slug}>
                    <a
                      href={productHref(candidate)}
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
                        <span className="block truncate text-[0.9375rem] tracking-tight">{candidate.model}</span>
                        <span className="mt-0.5 block truncate text-[0.8125rem] text-slate">
                          {relatedNote(candidate, product)}
                        </span>
                      </span>
                      <span className="flex shrink-0 items-center gap-2">
                        {price != null && (
                          <span className="text-[0.875rem] tracking-tight text-ash">
                            {candidate.variants.length > 1 ? 'от ' : ''}
                            {formatPrice(price)}
                          </span>
                        )}
                        <ArrowRight
                          size={15}
                          className="shrink-0 text-graphite/30 transition-transform duration-400 ease-premium group-hover:translate-x-0.5 group-hover:text-slate"
                        />
                      </span>
                    </a>
                  </li>
                )
              })}
            </ul>
          </aside>
        )}
      </div>

      {zoomOpen && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-6">
          <button
            type="button"
            aria-label="Закрыть увеличенное фото"
            onClick={() => setZoomOpen(false)}
            className="absolute inset-0 cursor-zoom-out bg-ink/85 backdrop-blur-sm"
          />
          <img
            src={selectedVariant?.image ?? product.image}
            width={selectedVariant?.imageWidth ?? product.imageWidth}
            height={selectedVariant?.imageHeight ?? product.imageHeight}
            alt={`ShineMate ${product.model}${selectedVariant?.axis1 ? ` — ${selectedVariant.axis1}` : ''}`}
            className="relative max-h-[85vh] max-w-[92vw] object-contain"
          />
          <button
            type="button"
            onClick={() => setZoomOpen(false)}
            aria-label="Закрыть"
            className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-full border border-porcelain/25 text-porcelain transition-colors duration-300 ease-premium hover:border-porcelain/50"
          >
            <X size={17} />
          </button>
        </div>
      )}
    </div>
  )
}
