import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'

import { formatPrice, minPrice, type Product } from '../../data/catalog'
import type { CompatGroup, CutScale, ProductStory, StoryScene } from '../../data/story'
import { useReducedMotion } from '../../hooks/useReducedMotion'
import { revealProps, rise, riseProps, stagger } from '../../lib/motion'
import { productHref } from '../../lib/router'

/**
 * Презентационный слой продуктовой истории.
 *
 * Композиция сцен намеренно чередуется (текст слева / кадр слева /
 * широкая метрика), а фоны секций идут ритмом porcelain → mist →
 * porcelain, чтобы длинная страница не читалась как одна белая
 * простыня. Данные приходят готовыми из data/story.ts — здесь только
 * вёрстка.
 */

/* ─────────────────────────────── Назначение ─────────────────────────────── */

export function PurposeSection({ purpose }: { purpose: ProductStory['purpose'] }) {
  const reduced = useReducedMotion()
  return (
    <section className="scene relative bg-mist py-20 md:py-28">
      <div className="shell">
        <motion.div {...revealProps(reduced, stagger(0, 0.08))} className="grid gap-10 lg:grid-cols-[1fr_1fr] lg:gap-20">
          <div>
            <motion.p variants={rise} className="eyebrow">
              Назначение
            </motion.p>
            <motion.h2 variants={rise} className="h2 mt-5 max-w-[16ch]">
              {purpose.title}
            </motion.h2>
          </div>
          <div>
            <motion.p variants={rise} className="lead text-ash">
              {purpose.body}
            </motion.p>
            {purpose.points.length > 0 && (
              <motion.ul variants={rise} className="mt-8 space-y-3 border-t border-graphite/[0.12] pt-6">
                {purpose.points.map((point) => (
                  <li key={point} className="flex gap-3 text-[0.9375rem] leading-relaxed text-slate">
                    <span aria-hidden className="mt-2.5 h-px w-4 shrink-0 bg-ember" />
                    {point}
                  </li>
                ))}
              </motion.ul>
            )}
          </div>
        </motion.div>
      </div>
    </section>
  )
}

/* ──────────────────────────────── Сцены ──────────────────────────────── */

/**
 * Одна сцена истории. Вариант композиции выбирается по индексу, а не
 * задаётся в данных: сцены приходят из общего билдера для всех 113
 * позиций, и ритм страницы не должен зависеть от того, сколько именно
 * характеристик оказалось у конкретной модели.
 */
function Scene({ scene, index, product }: { scene: StoryScene; index: number; product: Product }) {
  const reduced = useReducedMotion()
  const flipped = index % 2 === 1
  const onMist = index % 2 === 0

  // Сцена с крупной цифрой и без фото — широкий акцентный блок.
  if (scene.metric && !scene.image) {
    return (
      <section className={`scene relative py-16 md:py-24 ${onMist ? 'bg-porcelain' : 'bg-mist'}`}>
        <div className="shell">
          <motion.div
            {...revealProps(reduced, stagger(0, 0.08))}
            className="grid items-center gap-8 rounded-[1.75rem] border border-graphite/[0.08] bg-gradient-to-br from-frost/40 via-porcelain to-porcelain p-8 md:grid-cols-[minmax(0,14rem)_1fr] md:gap-14 md:p-12"
          >
            <motion.div variants={rise}>
              <p className="font-mono text-[0.625rem] uppercase tracking-[0.16em] text-titanium">
                {scene.metric.caption}
              </p>
              <p className="mt-3 text-[clamp(1.75rem,1.2rem+1.8vw,2.75rem)] font-medium leading-[1.05] tracking-tight text-graphite">
                {scene.metric.value}
              </p>
            </motion.div>
            <motion.div variants={rise}>
              <h3 className="text-[clamp(1.25rem,1rem+0.9vw,1.75rem)] leading-tight tracking-tight">
                {scene.title}
              </h3>
              <p className="mt-4 max-w-[52ch] text-[0.9375rem] leading-relaxed text-ash">{scene.body}</p>
            </motion.div>
          </motion.div>
        </div>
      </section>
    )
  }

  // Сцена с фото — текст и кадр чередуются сторонами.
  return (
    <section className={`scene relative py-16 md:py-24 ${onMist ? 'bg-porcelain' : 'bg-mist'}`}>
      <div className="shell">
        <motion.div
          {...revealProps(reduced, stagger(0, 0.08))}
          className="grid items-center gap-10 lg:grid-cols-2 lg:gap-20"
        >
          <motion.div variants={rise} className={flipped ? 'lg:order-2' : undefined}>
            <h3 className="text-[clamp(1.375rem,1.05rem+1.1vw,2rem)] leading-tight tracking-tight">
              {scene.title}
            </h3>
            <p className="mt-5 max-w-[52ch] text-[1rem] leading-relaxed text-ash">{scene.body}</p>
            {scene.metric && (
              <div className="mt-7 inline-flex items-baseline gap-3 rounded-full border border-ember/25 bg-ember/[0.07] px-5 py-2.5">
                <span className="text-[1.0625rem] tracking-tight text-graphite">{scene.metric.value}</span>
                <span className="font-mono text-[0.625rem] uppercase tracking-[0.14em] text-titanium">
                  {scene.metric.caption}
                </span>
              </div>
            )}
          </motion.div>

          <motion.div
            variants={rise}
            className={`flex aspect-[4/3] items-center justify-center rounded-[1.75rem] bg-gradient-to-br from-frost/50 via-mist to-porcelain p-10 ${
              flipped ? 'lg:order-1' : ''
            }`}
          >
            {/* См. комментарий в ProductPage: у части позиций исходник
                маленький, w-full по кадру не даёт ему потеряться. */}
            <img
              src={scene.image ?? product.image}
              width={product.imageWidth}
              height={product.imageHeight}
              alt={`ShineMate ${product.model}`}
              loading="lazy"
              decoding="async"
              className="max-h-full w-full max-w-[34rem] object-contain"
            />
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}

export function StoryScenes({ scenes, product }: { scenes: StoryScene[]; product: Product }) {
  if (!scenes.length) return null
  return (
    <>
      {scenes.map((scene, i) => (
        <Scene key={scene.title} scene={scene} index={i} product={product} />
      ))}
    </>
  )
}

/* ─────────────────────────── Шкала / место в цикле ─────────────────────────── */

export function ScaleSection({ scale }: { scale: CutScale }) {
  const reduced = useReducedMotion()
  return (
    <section className="scene relative bg-haze py-20 md:py-28">
      <div className="shell">
        <motion.div {...revealProps(reduced, stagger(0, 0.08))}>
          <motion.p variants={rise} className="eyebrow">
            Место в системе
          </motion.p>
          <motion.h2 variants={rise} className="h2 mt-5 max-w-[20ch]">
            {scale.caption}
          </motion.h2>

          <motion.ol
            variants={rise}
            className="mt-12 grid gap-px overflow-hidden rounded-2xl bg-graphite/[0.1] sm:grid-cols-2 lg:grid-cols-4"
          >
            {scale.steps.map((step) => (
              <li
                key={step.label}
                aria-current={step.active ? 'step' : undefined}
                className={`relative p-6 sm:p-7 ${step.active ? 'bg-graphite text-porcelain' : 'bg-hazeSurface'}`}
              >
                {step.active && (
                  <span
                    aria-hidden
                    className="absolute left-0 top-0 h-1 w-full bg-ember"
                  />
                )}
                <p
                  className={`text-[1.0625rem] tracking-tight ${
                    step.active ? 'text-porcelain' : 'text-graphite'
                  }`}
                >
                  {step.label}
                </p>
                <p
                  className={`mt-1.5 text-[0.8125rem] leading-relaxed ${
                    step.active ? 'text-porcelain/70' : 'text-slate'
                  }`}
                >
                  {step.note}
                </p>
              </li>
            ))}
          </motion.ol>
        </motion.div>
      </div>
    </section>
  )
}

/* ────────────────────────────── Совместимость ────────────────────────────── */

function CompatCard({ item }: { item: Product }) {
  const price = minPrice(item)
  const thumb = item.image.replace('.webp', '-thumb.webp')
  return (
    <a
      href={productHref(item)}
      className="group flex flex-col rounded-2xl border border-graphite/[0.1] bg-porcelain p-4 transition-colors duration-400 ease-premium hover:border-graphite/25 hover:bg-mist/60"
    >
      <span className="flex h-28 items-center justify-center rounded-xl bg-mist p-3 transition-colors duration-400 ease-premium group-hover:bg-porcelain">
        <img
          src={thumb}
          srcSet={`${thumb} 300w, ${item.image} 700w`}
          sizes="180px"
          alt={`ShineMate ${item.model}`}
          loading="lazy"
          decoding="async"
          className="max-h-full w-auto max-w-full object-contain"
        />
      </span>
      <span className="mt-4 block text-[0.9375rem] leading-snug tracking-tight text-graphite">
        {item.model}
      </span>
      <span className="mt-1 block text-[0.75rem] leading-relaxed text-slate">{item.kind}</span>
      <span className="mt-3 flex items-center justify-between gap-2 border-t border-graphite/[0.1] pt-3">
        <span className="text-[0.875rem] tracking-tight text-graphite">
          {price != null ? `${item.variants.length > 1 ? 'от ' : ''}${formatPrice(price)}` : '—'}
        </span>
        <ArrowRight
          size={14}
          className="shrink-0 text-graphite/30 transition-transform duration-400 ease-premium group-hover:translate-x-0.5 group-hover:text-graphite/60"
        />
      </span>
    </a>
  )
}

export function CompatSection({ groups }: { groups: CompatGroup[] }) {
  const reduced = useReducedMotion()
  if (!groups.length) return null
  return (
    <section className="scene relative bg-porcelain py-20 md:py-28">
      <div className="shell">
        <motion.div {...riseProps(reduced, { y: 24, amount: 0.2 })}>
          <p className="eyebrow">Собирается в систему</p>
          <h2 className="h2 mt-5 max-w-[22ch]">Что работает с этой позицией</h2>
          <p className="lead mt-6 max-w-[52ch] text-ash">
            Подбор внутри линейки просчитан: машинка, подложка, круг и паста рассчитаны друг
            под друга, поэтому связку не приходится собирать из разных брендов.
          </p>
        </motion.div>

        <div className="mt-12 space-y-12">
          {groups.map((group) => (
            <motion.div key={group.title} {...riseProps(reduced, { y: 24, amount: 0.15 })}>
              <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-t border-graphite/[0.12] pt-5">
                <h3 className="text-[1.0625rem] tracking-tight">{group.title}</h3>
                <p className="text-[0.8125rem] text-slate">{group.note}</p>
              </div>
              <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {group.items.map((item) => (
                  <CompatCard key={item.slug} item={item} />
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ──────────────────────────────── Финальный CTA ──────────────────────────────── */

export function StoryCta({
  product,
  onRequest,
  onWholesale,
}: {
  product: Product
  onRequest: () => void
  onWholesale: () => void
}) {
  const reduced = useReducedMotion()
  return (
    <section className="scene relative overflow-hidden bg-graphite py-20 text-porcelain md:py-28">
      <div className="shell">
        <motion.div {...riseProps(reduced, { y: 24, amount: 0.25 })} className="max-w-[46ch]">
          <p className="font-mono text-[0.625rem] uppercase tracking-[0.18em] text-ember">
            {product.model}
          </p>
          <h2 className="h2 mt-5 text-porcelain">Подберём конфигурацию под вашу задачу</h2>
          <p className="lead mt-6 text-porcelain/70">
            Расскажите, с какими покрытиями и объёмами работаете — предложим связку машинки,
            подложек, кругов и паст и пришлём актуальный прайс.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={onRequest}
              className="inline-flex items-center rounded-full bg-porcelain px-7 py-3.5 text-sm text-graphite transition-colors duration-500 ease-premium hover:bg-mist"
            >
              Запросить прайс
            </button>
            <button
              type="button"
              onClick={onWholesale}
              className="inline-flex items-center rounded-full border border-porcelain/25 px-7 py-3.5 text-sm text-porcelain transition-colors duration-500 ease-premium hover:border-porcelain/60"
            >
              Оптовые условия
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
