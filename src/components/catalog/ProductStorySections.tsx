import { motion } from 'framer-motion'
import { ArrowRight, Check } from 'lucide-react'

import { formatPrice, minPrice, type Product } from '../../data/catalog'
import type {
  ComparisonTable,
  CompatGroup,
  CutScale,
  ProductStory,
  StoryPhoto,
  StoryScene,
  SystemChain,
} from '../../data/story'
import { useReducedMotion } from '../../hooks/useReducedMotion'
import { revealProps, rise, riseProps, stagger } from '../../lib/motion'
import { productHref } from '../../lib/router'

/**
 * Презентационный слой продуктовой истории.
 *
 * Клиент показывал официальный shinemate.com как ориентир по подаче:
 * товар не заканчивается таблицей, а разворачивается длинной визуальной
 * историей, где продукт занимает половину экрана, крупные цифры вынесены
 * в тёмные полосы, а связка «машинка → подложка → круг → паста» показана
 * реальными фото, а не текстом.
 *
 * Здесь собраны блоки, из которых эта история складывается. Данные
 * приходят готовыми из data/story.ts — тут только композиция. Фон секций
 * идёт заданным ритмом (porcelain → mist → haze → graphite), чтобы
 * длинная страница не читалась одной белой простынёй.
 */

/* ─────────────────── Ключевые характеристики крупно ─────────────────── */

/**
 * Главные параметры позиции — крупными значениями сразу под hero.
 * Полная таблица характеристик остаётся ниже по странице: здесь только
 * то, по чему модель узнают и сравнивают.
 */
export function SpecHighlights({
  items,
  kicker,
}: {
  items: ProductStory['highlights']
  kicker: string
}) {
  const reduced = useReducedMotion()
  if (!items.length) return null
  return (
    <section className="scene relative bg-graphite py-14 text-porcelain md:py-20">
      <div className="shell-wide">
        <motion.div {...revealProps(reduced, stagger(0, 0.07))}>
          <motion.p
            variants={rise}
            className="font-mono text-[0.6875rem] uppercase tracking-[0.22em] text-ember"
          >
            {kicker}
          </motion.p>
          <motion.dl
            variants={rise}
            className="mt-9 grid gap-x-10 gap-y-9 sm:grid-cols-2 lg:grid-cols-4"
          >
            {items.map((item) => (
              <div key={item.label} className="border-t border-porcelain/20 pt-5">
                <dt className="font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-porcelain/50">
                  {item.label}
                </dt>
                <dd className="mt-3 text-[clamp(1.375rem,1.05rem+1.1vw,2.125rem)] font-medium leading-[1.1] tracking-tight text-porcelain">
                  {item.value}
                </dd>
              </div>
            ))}
          </motion.dl>
        </motion.div>
      </div>
    </section>
  )
}

/* ─────────────────────────────── Назначение ─────────────────────────────── */

export function PurposeSection({ purpose }: { purpose: ProductStory['purpose'] }) {
  const reduced = useReducedMotion()
  return (
    <section className="scene relative bg-mist py-20 md:py-32">
      <div className="shell-wide">
        <motion.div
          {...revealProps(reduced, stagger(0, 0.08))}
          className="grid gap-10 lg:grid-cols-[1fr_1.15fr] lg:gap-24"
        >
          <div>
            <motion.p variants={rise} className="eyebrow">
              Назначение
            </motion.p>
            <motion.h2 variants={rise} className="h2 mt-6 max-w-[15ch]">
              {purpose.title}
            </motion.h2>
          </div>
          <div>
            <motion.p
              variants={rise}
              className="text-[clamp(1.0625rem,1rem+0.35vw,1.375rem)] leading-[1.6] text-ash"
            >
              {purpose.body}
            </motion.p>
            {purpose.points.length > 0 && (
              <motion.ul variants={rise} className="mt-10 space-y-4 border-t border-graphite/[0.12] pt-8">
                {purpose.points.map((point) => (
                  <li key={point} className="flex gap-4 text-[1rem] leading-relaxed text-slate">
                    <span aria-hidden className="mt-2.5 h-px w-5 shrink-0 bg-ember" />
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
 * Композиция сцены выбирается по индексу, а не по данным.
 *
 * У большинства машинок все сцены приходят с цифрой и без собственного
 * фото (официальный кадр у позиции ровно один). Если рендерить их
 * одинаково, страница превращается в стопку идентичных карточек — ровно
 * то, чего просили избежать. Поэтому вариантов пять и они чередуются:
 * широкий кадр во весь экран → крупная цифра → тёмная полоса → кадр с
 * текстом сбоку → спокойный текстовый блок.
 */
type SceneVariant = 'split' | 'metric' | 'band' | 'plain' | 'detail'

function variantFor(scene: StoryScene, index: number): SceneVariant {
  /*
   * Кадры товара — это вырезанные рендеры вендора шириной 350–800px
   * (медиана ~505). В широкой «киносцене» на 1568px такой файл занимал
   * бы треть кадра и терялся в пустоте — ровно та претензия, которую
   * клиент формулировал как «маленький PNG в огромном белом поле».
   * Поэтому рендеры всегда идут в половинном кадре 4:3, где товар
   * занимает почти всю площадь, а во всю ширину раскрываются только
   * настоящие фотографии (см. PhotoScene).
   */
  if (scene.image) return 'split'
  if (!scene.metric) return 'plain'
  // Порядок подобран так, чтобы тёмная полоса не шла подряд с другой
  // тёмной секцией: кадр → цифра → деталь → текст → тёмная полоса.
  const cycle: SceneVariant[] = ['metric', 'detail', 'plain', 'band', 'detail', 'metric']
  return cycle[index % cycle.length]
}

/**
 * Три кадрирования одного и того же официального снимка: рабочая
 * головка, корпус, хвост с кабелем. Настоящих детальных фото у вендора
 * по позиции нет, поэтому вместо выдуманных «разрезов двигателя» здесь
 * честное увеличение фрагмента реального снимка — так же, как это
 * делают в печатных каталогах.
 */
const DETAIL_CROPS = [
  { pos: '30% 45%', scale: 1.55 },
  { pos: '55% 50%', scale: 1.4 },
  { pos: '72% 55%', scale: 1.55 },
]

/** Кадр товара на «сцене»: мягкая студийная подложка + отражение. */
function ProductStage({ src, alt, className = '' }: { src: string; alt: string; className?: string }) {
  return (
    <div
      className={`relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-[2rem] bg-[radial-gradient(120%_100%_at_50%_0%,#FFFFFF_0%,#EEF2F3_45%,#E2E9EB_100%)] ${className}`}
    >
      {/* Мягкая тень под товаром — «студийный стол», а не картинка в рамке. */}
      <span
        aria-hidden
        className="absolute bottom-[12%] left-1/2 h-[8%] w-[52%] -translate-x-1/2 rounded-[50%] bg-graphite/[0.13] blur-2xl"
      />
      <img
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        className="relative h-[88%] w-[92%] object-contain"
      />
    </div>
  )
}

function Scene({
  scene,
  index,
  product,
  photo,
}: {
  scene: StoryScene
  index: number
  product: Product
  /** Официальный снимок позиции — источник для «детальных» кадров. */
  photo?: StoryPhoto
}) {
  const reduced = useReducedMotion()
  const variant = variantFor(scene, index)
  const flipped = index % 4 === 3 || index % 4 === 2
  const bg = index % 2 === 0 ? 'bg-porcelain' : 'bg-hazeSurface'
  const alt = `ShineMate ${product.model}`

  // Тёмная полоса с крупной цифрой — сильный акцент в середине истории.
  if (variant === 'band') {
    return (
      <section className="scene relative bg-graphite py-20 text-porcelain md:py-28">
        <div className="shell-wide">
          <motion.div
            {...revealProps(reduced, stagger(0, 0.08))}
            className="grid items-end gap-10 md:grid-cols-[1fr_auto] md:gap-20"
          >
            <motion.div variants={rise} className="max-w-[42ch]">
              <h3 className="text-[clamp(1.5rem,1.15rem+1.4vw,2.5rem)] leading-[1.1] tracking-tight text-porcelain">
                {scene.title}
              </h3>
              <p className="mt-6 text-[1.0625rem] leading-relaxed text-porcelain/70">{scene.body}</p>
            </motion.div>
            {scene.metric && (
              <motion.div variants={rise} className="shrink-0 md:text-right">
                <p className="font-mono text-[0.6875rem] uppercase tracking-[0.18em] text-ember">
                  {scene.metric.caption}
                </p>
                <p className="mt-4 text-[clamp(2.5rem,1.6rem+3.4vw,4.75rem)] font-medium leading-[0.95] tracking-tight text-porcelain">
                  {scene.metric.value}
                </p>
              </motion.div>
            )}
          </motion.div>
        </div>
      </section>
    )
  }

  // Спокойный текстовый блок — воздух между акцентами.
  if (variant === 'plain') {
    return (
      <section className={`scene relative py-16 md:py-24 ${bg}`}>
        <div className="shell-wide">
          <motion.div
            {...revealProps(reduced, stagger(0, 0.08))}
            className="grid gap-8 border-t border-graphite/[0.12] pt-12 md:grid-cols-[1fr_1.4fr] md:gap-20"
          >
            <motion.h3
              variants={rise}
              className="text-[clamp(1.375rem,1.05rem+1.1vw,2rem)] leading-[1.12] tracking-tight"
            >
              {scene.title}
            </motion.h3>
            <motion.div variants={rise}>
              <p className="max-w-[56ch] text-[1.0625rem] leading-relaxed text-ash">{scene.body}</p>
              {scene.metric && (
                <p className="mt-7 inline-flex items-baseline gap-3 rounded-full border border-ember/25 bg-ember/[0.07] px-5 py-2.5">
                  <span className="text-[1.0625rem] tracking-tight text-graphite">
                    {scene.metric.value}
                  </span>
                  <span className="font-mono text-[0.625rem] uppercase tracking-[0.14em] text-titanium">
                    {scene.metric.caption}
                  </span>
                </p>
              )}
            </motion.div>
          </motion.div>
        </div>
      </section>
    )
  }

  // Крупная цифра как самостоятельный визуальный объект.
  if (variant === 'metric') {
    return (
      <section className={`scene relative py-16 md:py-24 ${bg}`}>
        <div className="shell-wide">
          <motion.div
            {...revealProps(reduced, stagger(0, 0.08))}
            className="grid items-center gap-10 overflow-hidden rounded-[2rem] border border-graphite/[0.08] bg-[linear-gradient(120deg,#FFFFFF_0%,#EEF2F3_60%,#E4EBEC_100%)] p-9 md:grid-cols-[minmax(0,26rem)_1fr] md:gap-20 md:p-16"
          >
            <motion.div variants={rise}>
              <p className="font-mono text-[0.6875rem] uppercase tracking-[0.18em] text-titanium">
                {scene.metric?.caption}
              </p>
              <p className="mt-4 text-[clamp(2rem,1.35rem+2.4vw,3.5rem)] font-medium leading-[1.02] tracking-tight text-graphite">
                {scene.metric?.value}
              </p>
            </motion.div>
            <motion.div variants={rise}>
              <h3 className="text-[clamp(1.375rem,1.05rem+1.1vw,2rem)] leading-[1.12] tracking-tight">
                {scene.title}
              </h3>
              <p className="mt-5 max-w-[54ch] text-[1rem] leading-relaxed text-ash">{scene.body}</p>
            </motion.div>
          </motion.div>
        </div>
      </section>
    )
  }

  // Крупный фрагмент реального снимка — «деталь» вместо ещё одного
  // текстового блока подряд.
  if (variant === 'detail') {
    const crop = DETAIL_CROPS[Math.floor(index / 2) % DETAIL_CROPS.length]
    return (
      <section className="scene relative bg-mist py-16 md:py-24">
        <div className="shell-wide">
          <motion.div
            {...revealProps(reduced, stagger(0, 0.08))}
            className="grid items-stretch gap-8 lg:grid-cols-2 lg:gap-14"
          >
            <motion.div
              variants={rise}
              className={`relative min-h-[16rem] overflow-hidden rounded-[2rem] bg-[radial-gradient(120%_100%_at_50%_0%,#FFFFFF_0%,#EAEFF1_55%,#D8E2E4_100%)] sm:min-h-[22rem] lg:min-h-[28rem] ${
                flipped ? 'lg:order-2' : ''
              }`}
            >
              {/*
                Детальный кадр берётся из НАСТОЯЩЕЙ фотографии позиции
                (1155×650), а не из вырезанного рендера: рендеры у вендора
                350–800px, и при таком увеличении они превращались бы в
                мыло. Если фотографии у позиции нет, увеличение рендера
                ограничено полутора кратами.
              */}
              {photo ? (
                <img
                  src={photo.src}
                  srcSet={`${photo.srcSmall} 800w, ${photo.src} 1400w`}
                  sizes="(min-width: 1024px) 46vw, 92vw"
                  alt={alt}
                  loading="lazy"
                  decoding="async"
                  className="absolute inset-0 h-full w-full object-cover"
                  style={{ objectPosition: crop.pos }}
                />
              ) : (
                <img
                  src={product.image}
                  alt={alt}
                  loading="lazy"
                  decoding="async"
                  className="absolute inset-0 h-full w-full object-contain"
                  style={{ objectPosition: crop.pos, transform: `scale(${crop.scale})` }}
                />
              )}
            </motion.div>
            <motion.div
              variants={rise}
              className={`flex flex-col justify-center px-1 py-2 lg:px-10 ${flipped ? 'lg:order-1' : ''}`}
            >
              {scene.metric && (
                <p className="font-mono text-[0.6875rem] uppercase tracking-[0.2em] text-ember">
                  {scene.metric.caption}
                </p>
              )}
              <h3 className="mt-4 text-[clamp(1.5rem,1.15rem+1.4vw,2.375rem)] leading-[1.1] tracking-tight text-graphite">
                {scene.title}
              </h3>
              {scene.metric && (
                <p className="mt-5 text-[clamp(1.75rem,1.3rem+1.8vw,2.75rem)] font-medium leading-none tracking-tight text-graphite">
                  {scene.metric.value}
                </p>
              )}
              <p className="mt-6 max-w-[48ch] text-[1.0625rem] leading-relaxed text-ash">
                {scene.body}
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>
    )
  }

  // Кадр с товаром: текст и изображение меняются сторонами.
  return (
    <section className={`scene relative py-16 md:py-24 ${bg}`}>
      <div className="shell-wide">
        <motion.div
          {...revealProps(reduced, stagger(0, 0.08))}
          className="grid items-center gap-10 lg:grid-cols-2 lg:gap-20"
        >
          <motion.div variants={rise} className={flipped ? 'lg:order-2' : undefined}>
            <h3 className="text-[clamp(1.5rem,1.15rem+1.4vw,2.375rem)] leading-[1.1] tracking-tight">
              {scene.title}
            </h3>
            <p className="mt-6 max-w-[52ch] text-[1.0625rem] leading-relaxed text-ash">{scene.body}</p>
            {scene.metric && (
              <div className="mt-8 inline-flex items-baseline gap-3 rounded-full border border-ember/25 bg-ember/[0.07] px-5 py-2.5">
                <span className="text-[1.0625rem] tracking-tight text-graphite">{scene.metric.value}</span>
                <span className="font-mono text-[0.625rem] uppercase tracking-[0.14em] text-titanium">
                  {scene.metric.caption}
                </span>
              </div>
            )}
          </motion.div>

          <motion.div variants={rise} className={flipped ? 'lg:order-1' : undefined}>
            <ProductStage src={scene.image ?? product.image} alt={alt} />
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}

export function StoryScenes({
  scenes,
  product,
  photo,
}: {
  scenes: StoryScene[]
  product: Product
  photo?: StoryPhoto
}) {
  if (!scenes.length) return null
  return (
    <>
      {scenes.map((scene, i) => (
        <Scene key={scene.title} scene={scene} index={i} product={product} photo={photo} />
      ))}
    </>
  )
}

/* ─────────────────────────── Шкала / место в цикле ─────────────────────────── */

export function ScaleSection({
  scale,
  eyebrow = 'Место в системе',
  tone = 'haze',
}: {
  scale: CutScale
  eyebrow?: string
  tone?: 'haze' | 'porcelain'
}) {
  const reduced = useReducedMotion()
  return (
    <section
      className={`scene relative py-20 md:py-28 ${tone === 'haze' ? 'bg-haze' : 'bg-porcelain'}`}
    >
      <div className="shell-wide">
        <motion.div {...revealProps(reduced, stagger(0, 0.08))}>
          <motion.p variants={rise} className="eyebrow">
            {eyebrow}
          </motion.p>
          <motion.h2 variants={rise} className="h2 mt-6 max-w-[20ch]">
            {scale.caption}
          </motion.h2>

          <motion.ol
            variants={rise}
            className="mt-12 grid gap-px overflow-hidden rounded-[1.5rem] bg-graphite/[0.1] sm:grid-cols-2 lg:grid-cols-4 xl:auto-cols-fr xl:grid-flow-col"
          >
            {scale.steps.map((step) => (
              <li
                key={step.label}
                aria-current={step.active ? 'step' : undefined}
                className={`relative p-7 sm:p-8 ${
                  step.active ? 'bg-graphite text-porcelain' : 'bg-hazeSurface'
                }`}
              >
                {step.active && <span aria-hidden className="absolute left-0 top-0 h-1 w-full bg-ember" />}
                <p
                  className={`text-[1.125rem] tracking-tight ${
                    step.active ? 'text-porcelain' : 'text-graphite'
                  }`}
                >
                  {step.label}
                </p>
                <p
                  className={`mt-2 text-[0.875rem] leading-relaxed ${
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

/* ──────────────────────── Связка «система ShineMate» ──────────────────────── */

/**
 * Цепочка машинка → подложка → круг → паста реальными фото.
 *
 * Клиент называл это главной фишкой сайта: человек должен видеть не
 * «похожие товары», а собранную систему, в которой позиция работает.
 * Текущая позиция в цепочке подсвечена, остальные звенья — кликабельны.
 */
export function SystemChainSection({ chain }: { chain: SystemChain }) {
  const reduced = useReducedMotion()
  return (
    <section className="scene relative bg-porcelain py-20 md:py-28">
      <div className="shell-wide">
        <motion.div {...revealProps(reduced, stagger(0, 0.08))}>
          <motion.p variants={rise} className="eyebrow">
            Собери систему
          </motion.p>
          <motion.h2 variants={rise} className="h2 mt-6 max-w-[18ch]">
            {chain.caption}
          </motion.h2>
          <motion.p variants={rise} className="lead mt-6 max-w-[58ch] text-ash">
            {chain.note}
          </motion.p>

          <motion.ol
            variants={rise}
            className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5"
          >
            {chain.steps.map((step) => {
              const thumb = step.product.image.replace('.webp', '-thumb.webp')
              const body = (
                <>
                  <span className="flex items-center justify-between gap-3">
                    <span
                      className={`font-mono text-[0.625rem] uppercase tracking-[0.16em] ${
                        step.active ? 'text-ember' : 'text-titanium'
                      }`}
                    >
                      {step.role}
                    </span>
                    {step.active && (
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-ember text-porcelain">
                        <Check size={11} />
                      </span>
                    )}
                  </span>
                  <span
                    className={`mt-5 flex h-32 items-center justify-center rounded-xl sm:h-36 ${
                      step.active ? 'bg-porcelain/10' : 'bg-mist'
                    }`}
                  >
                    <img
                      src={thumb}
                      srcSet={`${thumb} 300w, ${step.product.image} 700w`}
                      sizes="240px"
                      alt={`ShineMate ${step.product.model}`}
                      loading="lazy"
                      decoding="async"
                      className="max-h-full w-auto max-w-full object-contain"
                    />
                  </span>
                  <span
                    className={`mt-5 block text-[1.0625rem] leading-snug tracking-tight ${
                      step.active ? 'text-porcelain' : 'text-graphite'
                    }`}
                  >
                    {step.product.model}
                  </span>
                  <span
                    className={`mt-2 block text-[0.8125rem] leading-relaxed ${
                      step.active ? 'text-porcelain/65' : 'text-slate'
                    }`}
                  >
                    {step.note}
                  </span>
                </>
              )
              return (
                <li key={step.role}>
                  {step.active ? (
                    <div className="flex h-full flex-col rounded-2xl bg-graphite p-5 sm:p-6">{body}</div>
                  ) : (
                    <a
                      href={productHref(step.product)}
                      className="group flex h-full flex-col rounded-2xl border border-graphite/[0.1] bg-porcelain p-5 transition-colors duration-400 ease-premium hover:border-graphite/30 hover:bg-mist/60 sm:p-6"
                    >
                      {body}
                    </a>
                  )}
                </li>
              )
            })}
          </motion.ol>
        </motion.div>
      </div>
    </section>
  )
}

/* ─────────────────────────── Сравнение с соседями ─────────────────────────── */

/**
 * Таблица отличий внутри раздела. На узких экранах превращается в
 * горизонтально прокручиваемую ленту — сжимать четыре колонки цифр в
 * 375px нечитаемо, а прятать сравнение на мобильном клиент запретил.
 */
export function ComparisonSection({ table }: { table: ComparisonTable }) {
  const reduced = useReducedMotion()
  return (
    <section className="scene relative bg-mist py-20 md:py-28">
      <div className="shell-wide">
        <motion.div {...riseProps(reduced, { y: 24, amount: 0.2 })}>
          <p className="eyebrow">Сравнение</p>
          <h2 className="h2 mt-6 max-w-[20ch]">{table.caption}</h2>
        </motion.div>

        <motion.div
          {...riseProps(reduced, { y: 24, amount: 0.1 })}
          className="-mx-[var(--shell)] mt-12 overflow-x-auto px-[var(--shell)] pb-2"
        >
          <table className="w-full min-w-[46rem] border-collapse text-left">
            <thead>
              <tr className="border-b border-graphite/20">
                <th className="w-[22rem] py-4 pr-6 font-mono text-[0.625rem] font-medium uppercase tracking-[0.16em] text-titanium">
                  Модель
                </th>
                {table.columns.map((col) => (
                  <th
                    key={col}
                    className="py-4 pr-6 font-mono text-[0.625rem] font-medium uppercase tracking-[0.16em] text-titanium"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {table.rows.map((row) => {
                const thumb = row.image.replace('.webp', '-thumb.webp')
                return (
                  <tr
                    key={row.slug}
                    className={`border-b border-graphite/[0.1] align-middle ${
                      row.active ? 'bg-porcelain' : ''
                    }`}
                  >
                    <td className="py-4 pr-6">
                      <a
                        href={row.href}
                        className="group flex items-center gap-4"
                        aria-current={row.active ? 'true' : undefined}
                      >
                        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-porcelain p-1.5">
                          <img
                            src={thumb}
                            alt=""
                            loading="lazy"
                            decoding="async"
                            className="max-h-full w-auto max-w-full object-contain"
                          />
                        </span>
                        <span className="min-w-0">
                          <span
                            className={`block truncate text-[0.9375rem] tracking-tight ${
                              row.active ? 'text-graphite' : 'text-ash group-hover:text-graphite'
                            }`}
                          >
                            {row.model}
                            {row.active && (
                              <span className="ml-2 font-mono text-[0.625rem] uppercase tracking-[0.12em] text-ember">
                                эта модель
                              </span>
                            )}
                          </span>
                          <span className="mt-0.5 block truncate text-[0.75rem] text-slate">
                            {row.kind}
                          </span>
                        </span>
                      </a>
                    </td>
                    {row.values.map((value, i) => (
                      <td
                        key={table.columns[i]}
                        className={`py-4 pr-6 font-mono text-[0.875rem] tracking-tight ${
                          value ? 'text-graphite' : 'text-smoke'
                        }`}
                      >
                        {value ?? '—'}
                      </td>
                    ))}
                  </tr>
                )
              })}
            </tbody>
          </table>
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
      className="group flex flex-col rounded-2xl border border-graphite/[0.1] bg-porcelain p-5 transition-colors duration-400 ease-premium hover:border-graphite/25 hover:bg-mist/60"
    >
      <span className="flex h-40 items-center justify-center overflow-hidden rounded-xl bg-mist p-4 transition-colors duration-400 ease-premium group-hover:bg-porcelain sm:h-44">
        <img
          src={thumb}
          srcSet={`${thumb} 300w, ${item.image} 700w`}
          sizes="(min-width: 1024px) 300px, 45vw"
          alt={`ShineMate ${item.model}`}
          loading="lazy"
          decoding="async"
          className="max-h-full w-auto max-w-full object-contain transition-transform duration-500 ease-premium group-hover:scale-[1.04]"
        />
      </span>
      <span className="mt-5 block text-[1.0625rem] leading-snug tracking-tight text-graphite">
        {item.model}
      </span>
      <span className="mt-1.5 block text-[0.8125rem] leading-relaxed text-slate">{item.kind}</span>
      <span className="flex-1" />
      <span className="mt-4 flex items-center justify-between gap-2 border-t border-graphite/[0.1] pt-4">
        <span className="text-[0.9375rem] tracking-tight text-graphite">
          {price != null ? `${item.variants.length > 1 ? 'от ' : ''}${formatPrice(price)}` : '—'}
        </span>
        <ArrowRight
          size={15}
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
    <section className="scene relative bg-hazeSurface py-20 md:py-28">
      <div className="shell-wide">
        <motion.div {...riseProps(reduced, { y: 24, amount: 0.2 })}>
          <p className="eyebrow">Совместимость</p>
          <h2 className="h2 mt-6 max-w-[22ch]">Что работает с этой позицией</h2>
          <p className="lead mt-6 max-w-[56ch] text-ash">
            Подбор внутри линейки просчитан: машинка, подложка, круг и паста рассчитаны друг под
            друга, поэтому связку не приходится собирать из разных брендов.
          </p>
        </motion.div>

        <div className="mt-14 space-y-14">
          {groups.map((group) => (
            <motion.div key={group.title} {...riseProps(reduced, { y: 24, amount: 0.15 })}>
              <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-t border-graphite/[0.12] pt-6">
                <h3 className="text-[1.25rem] tracking-tight">{group.title}</h3>
                <p className="text-[0.875rem] text-slate">{group.note}</p>
              </div>
              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
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
  const thumb = product.image.replace('.webp', '-thumb.webp')
  return (
    <section className="scene relative overflow-hidden bg-graphite py-20 text-porcelain md:py-28">
      <div className="shell-wide">
        <motion.div
          {...riseProps(reduced, { y: 24, amount: 0.25 })}
          className="grid items-center gap-12 lg:grid-cols-[1.2fr_1fr] lg:gap-20"
        >
          <div className="max-w-[46ch]">
            <p className="font-mono text-[0.6875rem] uppercase tracking-[0.2em] text-ember">
              {product.model}
            </p>
            <h2 className="h2 mt-6 text-porcelain">Подберём конфигурацию под вашу задачу</h2>
            <p className="lead mt-6 text-porcelain/70">
              Расскажите, с какими покрытиями и объёмами работаете — предложим связку машинки,
              подложек, кругов и паст и пришлём актуальный прайс.
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={onRequest}
                className="inline-flex items-center rounded-full bg-porcelain px-8 py-4 text-[0.9375rem] text-graphite transition-colors duration-500 ease-premium hover:bg-mist"
              >
                Запросить прайс
              </button>
              <button
                type="button"
                onClick={onWholesale}
                className="inline-flex items-center rounded-full border border-porcelain/25 px-8 py-4 text-[0.9375rem] text-porcelain transition-colors duration-500 ease-premium hover:border-porcelain/60"
              >
                Оптовые условия
              </button>
            </div>
          </div>

          {/* Товар остаётся перед глазами в момент решения — не абстрактный
              тёмный блок с кнопками, а закрывающий кадр именно этой позиции. */}
          <div className="relative hidden aspect-[4/3] items-center justify-center lg:flex">
            <span
              aria-hidden
              className="absolute inset-x-[8%] bottom-[16%] h-[10%] rounded-[50%] bg-ink/60 blur-2xl"
            />
            <img
              src={thumb}
              srcSet={`${thumb} 300w, ${product.image} 700w`}
              sizes="480px"
              alt=""
              loading="lazy"
              decoding="async"
              className="relative max-h-full w-full max-w-[26rem] object-contain"
            />
          </div>
        </motion.div>
      </div>
    </section>
  )
}

/* ─────────────────────────── Официальный кадр в работе ─────────────────────────── */

/**
 * Широкая сцена с настоящей фотографией ShineMate.
 *
 * Клиент отдельно требовал: «каждые 1–2 экрана — сильный визуальный
 * момент», и товар в работе, а не только рендер на белом. Кадр здесь
 * идёт почти во всю ширину вьюпорта (шире контентной сетки), текст —
 * поверх снимка на десктопе и под ним на мобильном, чтобы не закрывать
 * инструмент на узком экране.
 *
 * `variant='left'` переворачивает композицию — на длинной странице с
 * двумя кадрами подряд они не читаются одинаково.
 */
export function PhotoScene({
  photo,
  variant = 'right',
  tone = 'light',
}: {
  photo: StoryPhoto
  variant?: 'left' | 'right'
  tone?: 'light' | 'dark'
}) {
  const reduced = useReducedMotion()
  const dark = tone === 'dark'
  return (
    <section
      className={`scene relative overflow-hidden py-16 md:py-24 ${dark ? 'bg-graphite' : 'bg-hazeSurface'}`}
    >
      <div className="shell-wide">
        <motion.figure {...revealProps(reduced, stagger(0, 0.08))}>
          {/*
            Кадр идёт во всю ширину контентной сетки и не закрывается
            текстом: на официальных снимках инструмент стоит в разных
            местах кадра, и любая накладка поверх рано или поздно легла бы
            прямо на машинку. Подпись — отдельной строкой под снимком,
            как в editorial-вёрстке.
          */}
          <motion.div variants={rise} className="overflow-hidden rounded-[2rem]">
            <img
              src={photo.src}
              srcSet={`${photo.srcSmall} 800w, ${photo.src} 1400w`}
              sizes="(min-width: 1024px) 92vw, 100vw"
              width={photo.width}
              height={photo.height}
              alt={photo.title}
              loading="lazy"
              decoding="async"
              className="h-[20rem] w-full object-cover sm:h-[26rem] lg:h-[32rem] xl:h-[38rem]"
            />
          </motion.div>

          <motion.figcaption
            variants={rise}
            className={`mt-9 grid gap-6 border-t pt-8 md:grid-cols-[1fr_1fr] md:gap-16 ${
              dark ? 'border-porcelain/20' : 'border-graphite/[0.14]'
            } ${variant === 'left' ? 'md:[direction:rtl] md:[&>*]:[direction:ltr]' : ''}`}
          >
            <div>
              <p className="font-mono text-[0.6875rem] uppercase tracking-[0.22em] text-ember">
                {photo.eyebrow}
              </p>
              <h3
                className={`mt-4 text-[clamp(1.5rem,1.15rem+1.4vw,2.5rem)] leading-[1.1] tracking-tight ${
                  dark ? 'text-porcelain' : 'text-graphite'
                }`}
              >
                {photo.title}
              </h3>
            </div>
            <p
              className={`max-w-[52ch] self-center text-[1.0625rem] leading-relaxed ${
                dark ? 'text-porcelain/70' : 'text-ash'
              }`}
            >
              {photo.body}
            </p>
          </motion.figcaption>
        </motion.figure>
      </div>
    </section>
  )
}

/* ─────────────────────────── Цикл обработки ─────────────────────────── */

/**
 * Четыре стадии обработки с реальными пастами и градациями кругов —
 * та же официальная «Таблица применения», что и на странице «Технологии».
 * На странице машинки это отвечает на вопрос «что я вообще делаю этим
 * инструментом», которого не закрывает ни одна таблица характеристик.
 */
export function ProcessSection({ process }: { process: NonNullable<ProductStory['process']> }) {
  const reduced = useReducedMotion()
  return (
    <section className="scene relative bg-haze py-20 md:py-28">
      <div className="shell-wide">
        <motion.div {...revealProps(reduced, stagger(0, 0.08))}>
          <motion.p variants={rise} className="eyebrow">
            Цикл обработки
          </motion.p>
          <motion.h2 variants={rise} className="h2 mt-6 max-w-[18ch]">
            {process.caption}
          </motion.h2>
          <motion.p variants={rise} className="lead mt-6 max-w-[56ch] text-ash">
            {process.note}
          </motion.p>

          <motion.ol variants={rise} className="mt-12 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {process.stages.map((stage) => (
              <li
                key={stage.index}
                className="flex flex-col rounded-2xl border border-graphite/[0.1] bg-hazeSurface p-6 sm:p-7"
              >
                <p className="font-mono text-[0.6875rem] uppercase tracking-[0.18em] text-ember">
                  {stage.index}
                </p>
                <h3 className="mt-4 text-[1.25rem] tracking-tight">{stage.title}</h3>
                <p className="mt-2.5 text-[0.9375rem] leading-relaxed text-slate">{stage.goal}</p>

                <div className="mt-6 border-t border-graphite/[0.12] pt-5">
                  <p className="font-mono text-[0.625rem] uppercase tracking-[0.14em] text-titanium">
                    Что снимается
                  </p>
                  <ul className="mt-2.5 space-y-1.5">
                    {stage.defects.map((d) => (
                      <li key={d} className="flex gap-2.5 text-[0.875rem] leading-relaxed text-ash">
                        <span aria-hidden className="mt-2 h-px w-3 shrink-0 bg-graphite/30" />
                        {d}
                      </li>
                    ))}
                  </ul>
                </div>

                <span className="flex-1" />

                <div className="mt-6 border-t border-graphite/[0.12] pt-5">
                  <p className="font-mono text-[0.625rem] uppercase tracking-[0.14em] text-titanium">
                    Паста
                  </p>
                  <p className="mt-1.5 text-[0.9375rem] leading-snug text-graphite">{stage.paste}</p>
                  <p className="mt-4 font-mono text-[0.625rem] uppercase tracking-[0.14em] text-titanium">
                    Круг
                  </p>
                  {stage.pads.map((pad) => (
                    <p key={pad.kind} className="mt-1.5 text-[0.9375rem] leading-snug text-graphite">
                      {pad.kind} — {pad.grade}
                    </p>
                  ))}
                </div>
              </li>
            ))}
          </motion.ol>
        </motion.div>
      </div>
    </section>
  )
}
