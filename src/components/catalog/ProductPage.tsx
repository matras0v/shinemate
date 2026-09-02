import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, Check, ChevronRight, X, ZoomIn } from 'lucide-react'

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
import { buildStory } from '../../data/story'
import { useReducedMotion } from '../../hooks/useReducedMotion'
import { useLead } from '../../lib/leadContext'
import { revealProps, rise, riseProps, stagger } from '../../lib/motion'
import { productHref } from '../../lib/router'
import {
  CompatSection,
  PurposeSection,
  ScaleSection,
  StoryCta,
  StoryScenes,
} from './ProductStorySections'

type Props = {
  product: Product
}

/**
 * Страница товара — реальный маршрут /catalog/<категория>/<slug>.
 *
 * Клиент показал на видео официальный shinemate.com: там товар не
 * заканчивается таблицей характеристик, а разворачивается в историю,
 * которую листают. Здесь та же глубина, но собранная из НАШИХ данных:
 * hero → назначение → сцены по реальным характеристикам → место в
 * системе → характеристики → исполнения → совместимость → похожие → CTA.
 *
 * Шаблон один на все 113 позиций (см. data/story.ts): глубина страницы
 * подстраивается под то, сколько реальных данных есть у конкретного
 * товара. У машинки с ходом эксцентрика, мощностью и платформой
 * получится длинная история; у аксессуара — честная компактная
 * страница без выдуманных блоков.
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
  const story = buildStory(product)

  return (
    <div className="min-h-[100dvh] bg-porcelain">
      {/* ─── 01. HERO ─────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-b from-mist via-porcelain to-porcelain pb-16 pt-[5.5rem] md:pb-24">
        <div className="shell pt-8 md:pt-12">
          <nav
            aria-label="Хлебные крошки"
            className="flex flex-wrap items-center gap-1.5 text-[0.8125rem] text-slate"
          >
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
            <span className="text-graphite">{product.model}</span>
          </nav>
        </div>

        <div className="shell mt-8 grid items-center gap-10 lg:grid-cols-[1.15fr_1fr] lg:gap-16">
          {/* Товар доминирует: крупный кадр с мягкой подложкой, а не
              маленькое фото в белой пустоте. */}
          <motion.div {...riseProps(reduced, { y: 24, amount: 0.25 })}>
            <button
              type="button"
              onClick={() => setZoomOpen(true)}
              aria-label="Увеличить фото"
              className="group relative flex aspect-[4/3] w-full items-center justify-center rounded-[2rem] bg-gradient-to-br from-frost/50 via-mist to-porcelain p-6 sm:p-10"
            >
              {/*
                Часть официальных фото у вендора — маленькие (у EP830
                исходник вообще 396×124). При w-auto такое фото рисовалось
                в натуральную величину и терялось в центре большого кадра.
                object-contain + w-full растягивает по ширине кадра, сохраняя
                пропорции: мелкий исходник занимает кадр целиком, крупный —
                не обрезается. Апскейл ограничен разумным пределом, чтобы не
                получить мыло из 396px-исходника.
              */}
              <img
                src={selectedVariant?.image ?? product.image}
                width={selectedVariant?.imageWidth ?? product.imageWidth}
                height={selectedVariant?.imageHeight ?? product.imageHeight}
                alt={`ShineMate ${product.model}${selectedVariant?.axis1 ? ` — ${selectedVariant.axis1}` : ''}`}
                className="max-h-full w-full max-w-[42rem] object-contain"
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
            <motion.p
              variants={rise}
              className="font-mono text-[0.6875rem] font-medium uppercase tracking-[0.16em] text-titanium"
            >
              {categoryTitle(product.category)}
            </motion.p>
            <motion.h1 variants={rise} className="h1-sm mt-4">
              {product.model}
            </motion.h1>
            <motion.p variants={rise} className="mt-2 text-[1rem] text-slate">
              {product.kind}
            </motion.p>
            <motion.p variants={rise} className="mt-5 max-w-[52ch] text-[1rem] leading-relaxed text-ash">
              {product.lead}
            </motion.p>

            {product.specs.length > 0 && (
              <motion.dl
                variants={rise}
                className="mt-8 grid grid-cols-2 gap-x-6 gap-y-5 border-t border-graphite/[0.12] pt-7 sm:grid-cols-3"
              >
                {product.specs.slice(0, 6).map((spec) => (
                  <div key={spec.label}>
                    <dt className="font-mono text-[0.625rem] uppercase tracking-[0.12em] text-titanium">
                      {spec.label}
                    </dt>
                    <dd className="mt-1.5 text-[1rem] tracking-tight">{spec.value}</dd>
                  </div>
                ))}
              </motion.dl>
            )}

            <motion.div
              variants={rise}
              className="mt-7 flex flex-wrap items-baseline gap-x-4 gap-y-1 border-t border-graphite/[0.12] pt-7"
            >
              <p className="text-[2rem] leading-none tracking-tight">
                {selectedVariant ? formatPrice(selectedVariant.rrp) : '—'}
              </p>
              <p className="font-mono text-[0.625rem] uppercase tracking-[0.14em] text-titanium">
                {priceNote}
              </p>
              <p className="w-full font-mono text-[0.8125rem] tracking-tight text-slate">
                Артикул: {selectedVariant?.sku}
              </p>
            </motion.div>

            <motion.div variants={rise} className="mt-8 flex flex-wrap gap-3">
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
      </div>

      {/* ─── 02. НАЗНАЧЕНИЕ ───────────────────────────────────────────── */}
      <PurposeSection purpose={story.purpose} />

      {/* ─── 03. СЦЕНЫ ПО РЕАЛЬНЫМ ХАРАКТЕРИСТИКАМ ────────────────────── */}
      <StoryScenes scenes={story.scenes} product={product} />

      {/* ─── 04. МЕСТО В СИСТЕМЕ / ЛИНЕЙКЕ ────────────────────────────── */}
      {story.scale && <ScaleSection scale={story.scale} />}

      {/* ─── 05. ХАРАКТЕРИСТИКИ + ИСПОЛНЕНИЯ ─────────────────────────── */}
      <section className="scene relative bg-porcelain py-20 md:py-28">
        <div className="shell grid gap-14 lg:grid-cols-[1fr_1fr] lg:gap-20">
          <motion.div {...riseProps(reduced, { y: 24, amount: 0.2 })}>
            <p className="eyebrow">Характеристики</p>
            <h2 className="h2 mt-5 max-w-[14ch]">Полные данные по позиции</h2>
            <dl className="mt-8 divide-y divide-graphite/[0.1] border-t border-graphite/[0.12]">
              {product.specs.map((spec) => (
                <div key={spec.label} className="flex items-baseline justify-between gap-6 py-4">
                  <dt className="text-[0.9375rem] text-slate">{spec.label}</dt>
                  <dd className="text-right font-mono text-[0.9375rem] tracking-tight">{spec.value}</dd>
                </div>
              ))}
            </dl>

            {product.includes && product.includes.length > 0 && (
              <div className="mt-12">
                <p className="eyebrow">Комплектация</p>
                <ul className="mt-4 space-y-2.5 border-t border-graphite/[0.12] pt-5">
                  {product.includes.map((item) => (
                    <li key={item} className="flex gap-3 text-[0.9375rem] leading-relaxed text-ash">
                      <Check size={15} className="mt-1 shrink-0 text-ember" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </motion.div>

          <motion.div {...riseProps(reduced, { y: 24, amount: 0.2 })}>
            <p className="eyebrow">
              {product.variants.length > 1 ? 'Исполнения и РРЦ' : 'Артикул и РРЦ'}
            </p>
            <h2 className="h2 mt-5 max-w-[14ch]">
              {product.variants.length > 1 ? 'Что выбрать' : 'Позиция в прайсе'}
            </h2>

            <div className="mt-8">
              {showAxisChips ? (
                <div className="space-y-6">
                  <div>
                    <p className="font-mono text-[0.625rem] uppercase tracking-[0.12em] text-titanium">
                      {product.axisLabel ?? 'Градация'}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
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
                      <p className="font-mono text-[0.625rem] uppercase tracking-[0.12em] text-titanium">
                        Размер
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
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
                  {selectedVariant && (
                    <div className="flex items-center justify-between gap-4 rounded-2xl bg-mist p-5">
                      <div className="min-w-0">
                        <p className="font-mono text-[0.875rem] tracking-tight">{selectedVariant.sku}</p>
                        {selectedVariant.label && (
                          <p className="mt-1 text-[0.8125rem] text-slate">{selectedVariant.label}</p>
                        )}
                      </div>
                      <p className="shrink-0 text-[1.125rem] tracking-tight">
                        {formatPrice(selectedVariant.rrp)}
                      </p>
                    </div>
                  )}
                </div>
              ) : product.variants.length > 1 ? (
                <ul className="space-y-2">
                  {product.variants.map((variant) => (
                    <li key={variant.sku}>
                      <button
                        type="button"
                        onClick={() => setSelectedSku(variant.sku)}
                        aria-pressed={selectedVariant?.sku === variant.sku}
                        className={`flex w-full items-center gap-3 rounded-2xl border p-4 text-left transition-colors duration-300 ease-premium ${
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
                          <span className="mt-0.5 block text-[0.8125rem] text-slate">{variant.label}</span>
                        </span>
                        <span className="shrink-0 text-[1.0625rem] tracking-tight">
                          {formatPrice(variant.rrp)}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="rounded-2xl bg-mist p-6">
                  <p className="font-mono text-[0.9375rem] tracking-tight">{product.variants[0]?.sku}</p>
                  <p className="mt-1.5 text-[0.875rem] text-slate">{product.variants[0]?.label}</p>
                  <p className="mt-4 text-[1.5rem] tracking-tight">
                    {product.variants[0] ? formatPrice(product.variants[0].rrp) : '—'}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── 06. СОВМЕСТИМОСТЬ ───────────────────────────────────────── */}
      <CompatSection groups={story.compat} />

      {/* ─── 07. ПОХОЖИЕ ПОЗИЦИИ ─────────────────────────────────────── */}
      {related.length > 0 && (
        <section className="scene relative bg-mist py-20 md:py-28">
          <div className="shell">
            <motion.div {...riseProps(reduced, { y: 24, amount: 0.2 })}>
              <p className="eyebrow">Соседи по разделу</p>
              <h2 className="h2 mt-5 max-w-[20ch]">Похожие модели этого раздела</h2>
            </motion.div>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((candidate) => {
                const price = minPrice(candidate)
                const thumb = candidate.image.replace('.webp', '-thumb.webp')
                return (
                  <motion.a
                    key={candidate.slug}
                    {...riseProps(reduced, { y: 20, amount: 0.15 })}
                    href={productHref(candidate)}
                    className="group flex items-center gap-4 rounded-2xl border border-graphite/[0.1] bg-porcelain p-4 transition-colors duration-400 ease-premium hover:border-graphite/25"
                  >
                    <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-mist p-2">
                      <img
                        src={thumb}
                        srcSet={`${thumb} 300w, ${candidate.image} 700w`}
                        sizes="160px"
                        alt={`ShineMate ${candidate.model}`}
                        loading="lazy"
                        decoding="async"
                        className="max-h-full w-auto max-w-full object-contain"
                      />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[1rem] tracking-tight">{candidate.model}</span>
                      <span className="mt-1 block truncate text-[0.8125rem] text-slate">
                        {relatedNote(candidate, product)}
                      </span>
                      {price != null && (
                        <span className="mt-2 block text-[0.9375rem] tracking-tight text-graphite">
                          {candidate.variants.length > 1 ? 'от ' : ''}
                          {formatPrice(price)}
                        </span>
                      )}
                    </span>
                    <ArrowRight
                      size={16}
                      className="shrink-0 text-graphite/30 transition-transform duration-400 ease-premium group-hover:translate-x-0.5 group-hover:text-graphite/60"
                    />
                  </motion.a>
                )
              })}
            </div>

            <motion.a
              {...riseProps(reduced, { y: 20, delay: 0.1, amount: 0.2 })}
              href={`catalog/${product.category}`}
              className="group mt-10 inline-flex items-center gap-2 text-[0.9375rem] text-ash transition-colors duration-500 ease-premium hover:text-graphite"
            >
              <ArrowLeft
                size={16}
                className="transition-transform duration-500 ease-premium group-hover:-translate-x-0.5"
              />
              Весь раздел «{categoryTitle(product.category)}»
            </motion.a>
          </div>
        </section>
      )}

      {/* ─── 08. CTA ─────────────────────────────────────────────────── */}
      <StoryCta
        product={product}
        onRequest={() => requestProduct(product, selectedVariant)}
        onWholesale={requestWholesale}
      />

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
