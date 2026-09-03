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
  ComparisonSection,
  CompatSection,
  PhotoScene,
  ProcessSection,
  PurposeSection,
  ScaleSection,
  SpecHighlights,
  StoryCta,
  StoryScenes,
  SystemChainSection,
} from './ProductStorySections'

type Props = {
  product: Product
}

/**
 * Страница товара — реальный маршрут /catalog/<категория>/<slug>.
 *
 * Клиент показал на видео официальный shinemate.com: там товар не
 * заканчивается таблицей характеристик, а разворачивается в длинную
 * визуальную историю, которую листают. Здесь та же глубина, но собранная
 * из НАШИХ данных:
 *
 *   hero с галереей → ключевые цифры (тёмная полоса) → назначение →
 *   сцены по реальным характеристикам → место в линейке → сравнение с
 *   соседями → полные характеристики и исполнения → связка «система» →
 *   совместимость → похожие → CTA.
 *
 * Отдельных страниц руками не создаётся: композиция одна на все 113
 * позиций (см. data/story.ts), а глубина подстраивается под то, сколько
 * реальных данных есть у конкретного товара. У машинки с ходом
 * эксцентрика, мощностью и платформой получится длинная история; у
 * аксессуара — честная компактная страница без выдуманных блоков.
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

  /*
   * Галерея показывает только РЕАЛЬНЫЕ кадры позиции: фото товара плюс
   * отдельные фото исполнений там, где вендор их снимал (например,
   * зелёный T120 против жёлтого T80). Клонировать один и тот же снимок,
   * чтобы «набрать» галерею из шести миниатюр, здесь нельзя — тогда
   * переключение кадров ничего бы не меняло и выглядело обманом.
   */
  const [shot, setShot] = useState(0)
  useEffect(() => setShot(0), [product.slug])
  // Выбор исполнения переводит галерею на кадр этого исполнения, если он есть.
  useEffect(() => {
    if (!selectedVariant?.image) return
    const i = story.gallery.indexOf(selectedVariant.image)
    if (i >= 0) setShot(i)
  }, [selectedVariant?.image, story.gallery])

  const heroImage = story.gallery[shot] ?? selectedVariant?.image ?? product.image

  return (
    <div className="min-h-[100dvh] bg-porcelain">
      {/* ─── 01. HERO ─────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-b from-mist via-porcelain to-porcelain pb-16 pt-[6.5rem] md:pb-24">
        <div className="shell-wide pt-8 md:pt-12">
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

        <div className="shell-wide mt-8 grid items-start gap-10 lg:grid-cols-[1.25fr_1fr] lg:gap-16 xl:gap-20">
          {/* Товар доминирует: крупный кадр на студийной подложке, а не
              маленькое фото, потерянное в белой пустоте. */}
          <motion.div {...riseProps(reduced, { y: 24, amount: 0.2 })}>
            <button
              type="button"
              onClick={() => setZoomOpen(true)}
              aria-label="Увеличить фото"
              className="group relative flex aspect-[4/3] w-full items-center justify-center overflow-hidden rounded-[2rem] bg-[radial-gradient(120%_100%_at_50%_0%,#FFFFFF_0%,#EFF3F4_45%,#E1E9EB_100%)]"
            >
              <span
                aria-hidden
                className="absolute bottom-[13%] left-1/2 h-[8%] w-[54%] -translate-x-1/2 rounded-[50%] bg-graphite/[0.14] blur-2xl"
              />
              {/*
                Часть официальных фото у вендора мелкая (у EP830 исходник
                396×124). Процентная высота/ширина внутри кадра растягивает
                такой снимок по сцене, сохраняя пропорции: мелкий исходник
                занимает кадр целиком, крупный — не обрезается.
              */}
              <img
                src={heroImage}
                width={selectedVariant?.imageWidth ?? product.imageWidth}
                height={selectedVariant?.imageHeight ?? product.imageHeight}
                alt={`ShineMate ${product.model}${selectedVariant?.axis1 ? ` — ${selectedVariant.axis1}` : ''}`}
                className="relative h-[84%] w-[88%] object-contain transition-transform duration-700 ease-premium group-hover:scale-[1.03]"
              />
              <span
                aria-hidden
                className="absolute bottom-5 right-5 flex h-11 w-11 items-center justify-center rounded-full border border-graphite/15 bg-porcelain/90 text-slate backdrop-blur-sm transition-colors duration-300 ease-premium group-hover:border-graphite/40 group-hover:text-graphite"
              >
                <ZoomIn size={17} />
              </span>
            </button>

            {story.gallery.length > 1 && (
              <ul className="mt-4 flex flex-wrap gap-3">
                {story.gallery.map((src, i) => (
                  <li key={src}>
                    <button
                      type="button"
                      onClick={() => setShot(i)}
                      aria-label={`Кадр ${i + 1}`}
                      aria-pressed={i === shot}
                      className={`flex h-20 w-20 items-center justify-center rounded-xl border bg-mist p-2 transition-colors duration-300 ease-premium ${
                        i === shot
                          ? 'border-graphite'
                          : 'border-graphite/[0.12] hover:border-graphite/35'
                      }`}
                    >
                      <img
                        src={src.replace('.webp', '-thumb.webp')}
                        alt=""
                        loading="lazy"
                        decoding="async"
                        className="max-h-full w-auto max-w-full object-contain"
                      />
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {selectedVariant?.note && (
              <p className="mt-4 max-w-[52ch] text-[0.8125rem] leading-relaxed text-titanium">
                {selectedVariant.note}
              </p>
            )}
          </motion.div>

          <motion.div {...revealProps(reduced, stagger(0, 0.08))} className="lg:pt-6">
            <motion.p
              variants={rise}
              className="font-mono text-[0.6875rem] font-medium uppercase tracking-[0.18em] text-titanium"
            >
              {categoryTitle(product.category)}
            </motion.p>
            <motion.h1 variants={rise} className="h1-sm mt-4">
              {product.model}
            </motion.h1>
            <motion.p variants={rise} className="mt-3 text-[1.0625rem] text-slate">
              {product.kind}
            </motion.p>
            <motion.p
              variants={rise}
              className="mt-6 max-w-[52ch] text-[1.0625rem] leading-relaxed text-ash"
            >
              {product.lead}
            </motion.p>

            <motion.div
              variants={rise}
              className="mt-9 flex flex-wrap items-baseline gap-x-5 gap-y-2 border-t border-graphite/[0.12] pt-8"
            >
              <p className="text-[clamp(2rem,1.6rem+1.2vw,2.75rem)] leading-none tracking-tight">
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
                className="inline-flex items-center rounded-full bg-graphite px-8 py-4 text-[0.9375rem] text-porcelain transition-colors duration-500 ease-premium hover:bg-ink"
              >
                Запросить прайс
              </button>
              <button
                type="button"
                onClick={requestWholesale}
                className="inline-flex items-center rounded-full border border-graphite/20 px-8 py-4 text-[0.9375rem] text-graphite transition-colors duration-500 ease-premium hover:border-graphite/50 hover:bg-graphite/[0.04]"
              >
                Подобрать систему
              </button>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* ─── 02. КЛЮЧЕВЫЕ ЦИФРЫ ──────────────────────────────────────── */}
      <SpecHighlights items={story.highlights} kicker={`${product.model} · ключевые параметры`} />

      {/* ─── 03. ТОВАР В РАБОТЕ (официальный кадр ShineMate) ──────────── */}
      {story.photos[0] && <PhotoScene photo={story.photos[0]} variant="right" />}

      {/* ─── 04. НАЗНАЧЕНИЕ ───────────────────────────────────────────── */}
      <PurposeSection purpose={story.purpose} />

      {/* ─── 05. СЦЕНЫ ПО РЕАЛЬНЫМ ХАРАКТЕРИСТИКАМ ────────────────────── */}
      <StoryScenes scenes={story.scenes} product={product} photo={story.photos[0]} />

      {/* ─── 06. ВТОРОЙ КАДР, ЕСЛИ ОН ЕСТЬ (линейка паст) ────────────── */}
      {story.photos[1] && <PhotoScene photo={story.photos[1]} variant="left" tone="dark" />}

      {/* ─── 07. ЦИКЛ ОБРАБОТКИ (для машинок) ─────────────────────────── */}
      {story.process && <ProcessSection process={story.process} />}

      {/* ─── 08. МЕСТО В ЛИНЕЙКЕ / ЦИКЛЕ ──────────────────────────────── */}
      {story.scale && <ScaleSection scale={story.scale} />}

      {/* ─── 08b. ШКАЛА ГРАДАЦИЙ (круги) ─────────────────────────────── */}
      {story.grades && (
        <ScaleSection scale={story.grades} eyebrow="Жёсткость" tone="porcelain" />
      )}

      {/* ─── 09. ЧЕМ ОТЛИЧАЕТСЯ ОТ СОСЕДЕЙ ────────────────────────────── */}
      {story.comparison && <ComparisonSection table={story.comparison} />}

      {/* ─── 10. ХАРАКТЕРИСТИКИ + ИСПОЛНЕНИЯ ─────────────────────────── */}
      <section className="scene relative bg-porcelain py-20 md:py-28">
        <div className="shell-wide grid gap-14 lg:grid-cols-[1fr_1fr] lg:gap-24">
          <motion.div {...riseProps(reduced, { y: 24, amount: 0.2 })}>
            <p className="eyebrow">Характеристики</p>
            <h2 className="h2 mt-6 max-w-[14ch]">Полные данные по позиции</h2>
            <dl className="mt-10 divide-y divide-graphite/[0.1] border-t border-graphite/[0.12]">
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
                <ul className="mt-5 space-y-3 border-t border-graphite/[0.12] pt-6">
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
            <h2 className="h2 mt-6 max-w-[14ch]">
              {product.variants.length > 1 ? 'Что выбрать' : 'Позиция в прайсе'}
            </h2>

            <div className="mt-10">
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
                          className={`rounded-full border px-4 py-2.5 text-[0.875rem] tracking-tight transition-colors duration-300 ease-premium ${
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
                            className={`rounded-full border px-4 py-2.5 text-[0.875rem] tracking-tight transition-colors duration-300 ease-premium ${
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
                    <div className="flex items-center justify-between gap-4 rounded-2xl bg-mist p-6">
                      <div className="min-w-0">
                        <p className="font-mono text-[0.875rem] tracking-tight">{selectedVariant.sku}</p>
                        {selectedVariant.label && (
                          <p className="mt-1 text-[0.8125rem] text-slate">{selectedVariant.label}</p>
                        )}
                      </div>
                      <p className="shrink-0 text-[1.25rem] tracking-tight">
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
                <div className="rounded-2xl bg-mist p-7">
                  <p className="font-mono text-[0.9375rem] tracking-tight">{product.variants[0]?.sku}</p>
                  <p className="mt-1.5 text-[0.875rem] text-slate">{product.variants[0]?.label}</p>
                  <p className="mt-5 text-[1.75rem] tracking-tight">
                    {product.variants[0] ? formatPrice(product.variants[0].rrp) : '—'}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── 11. СВЯЗКА «СИСТЕМА SHINEMATE» ──────────────────────────── */}
      {story.chain && <SystemChainSection chain={story.chain} />}

      {/* ─── 12. СОВМЕСТИМОСТЬ ───────────────────────────────────────── */}
      <CompatSection groups={story.compat} />

      {/* ─── 13. ПОХОЖИЕ ПОЗИЦИИ ─────────────────────────────────────── */}
      {related.length > 0 && (
        <section className="scene relative bg-mist py-20 md:py-28">
          <div className="shell-wide">
            <motion.div {...riseProps(reduced, { y: 24, amount: 0.2 })}>
              <p className="eyebrow">Соседи по разделу</p>
              <h2 className="h2 mt-6 max-w-[20ch]">Похожие модели этого раздела</h2>
            </motion.div>
            <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((candidate) => {
                const price = minPrice(candidate)
                const thumb = candidate.image.replace('.webp', '-thumb.webp')
                return (
                  <motion.a
                    key={candidate.slug}
                    {...riseProps(reduced, { y: 20, amount: 0.15 })}
                    href={productHref(candidate)}
                    className="group flex flex-col rounded-2xl border border-graphite/[0.1] bg-porcelain p-6 transition-colors duration-400 ease-premium hover:border-graphite/25"
                  >
                    <span className="flex h-44 items-center justify-center overflow-hidden rounded-xl bg-mist p-4 transition-colors duration-400 ease-premium group-hover:bg-porcelain sm:h-48">
                      <img
                        src={thumb}
                        srcSet={`${thumb} 300w, ${candidate.image} 700w`}
                        sizes="(min-width: 1024px) 380px, 45vw"
                        alt={`ShineMate ${candidate.model}`}
                        loading="lazy"
                        decoding="async"
                        className="max-h-full w-auto max-w-full object-contain transition-transform duration-500 ease-premium group-hover:scale-[1.04]"
                      />
                    </span>
                    <span className="mt-6 block text-[1.25rem] tracking-tight">{candidate.model}</span>
                    <span className="mt-2 block text-[0.875rem] leading-relaxed text-slate">
                      {relatedNote(candidate, product)}
                    </span>
                    <span className="flex-1" />
                    <span className="mt-5 flex items-center justify-between gap-3 border-t border-graphite/[0.1] pt-4">
                      <span className="text-[1rem] tracking-tight text-graphite">
                        {price != null
                          ? `${candidate.variants.length > 1 ? 'от ' : ''}${formatPrice(price)}`
                          : '—'}
                      </span>
                      <ArrowRight
                        size={16}
                        className="shrink-0 text-graphite/30 transition-transform duration-400 ease-premium group-hover:translate-x-0.5 group-hover:text-graphite/60"
                      />
                    </span>
                  </motion.a>
                )
              })}
            </div>

            <motion.a
              {...riseProps(reduced, { y: 20, delay: 0.1, amount: 0.2 })}
              href={`catalog/${product.category}`}
              className="group mt-12 inline-flex items-center gap-2 text-[0.9375rem] text-ash transition-colors duration-500 ease-premium hover:text-graphite"
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

      {/* ─── 14. CTA ─────────────────────────────────────────────────── */}
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
            src={heroImage}
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
