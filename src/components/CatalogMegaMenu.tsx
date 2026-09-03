import { useState } from 'react'
import { ArrowRight, ArrowUpRight } from 'lucide-react'

import {
  categories,
  categoryGroups,
  countByCategory,
  formatPrice,
  minPrice,
  productsByCategory,
  totalSkus,
  type CategoryId,
} from '../data/catalog'
import { productHref } from '../lib/router'

type Props = { onNavigate?: () => void }

const categoryLabel = (id: string) => categories.find((c) => c.id === id)?.title ?? id
const categoryNote = (id: string) => categories.find((c) => c.id === id)?.subtitle ?? ''

const DEFAULT_CATEGORY: CategoryId = categoryGroups[0].ids[0]

/**
 * Каталожное меню — только desktop hover (мобильная навигация устроена
 * отдельно, см. Header: там tap + drill-down, а не сжатый десктоп).
 *
 * Клиент показывал на видео product navigation оригинального
 * shinemate.com и отдельно требовал масштаба: «открываешь каталог — перед
 * глазами большой товарный браузер». Поэтому слева структура разделов,
 * справа — КРУПНЫЕ карточки реальных товаров наведённого раздела с фото,
 * моделью, типом и ценой. Товар должен быть виден, а не угадываться по
 * иконке 50×50. На 1024–1279px карточек две, от 1280px — три: лучше
 * показать меньше позиций, но крупно.
 *
 * Данные и фото — из catalog.ts, никаких отдельных списков «для меню».
 */
export function CatalogMegaMenuContent({ onNavigate }: Props) {
  const [activeCategory, setActiveCategory] = useState<CategoryId>(DEFAULT_CATEGORY)
  const previewProducts = productsByCategory(activeCategory).slice(0, 3)

  return (
    <div className="grid grid-cols-[15.5rem_1fr] gap-8 xl:grid-cols-[17.5rem_1fr] xl:gap-12">
      {/* Левая колонка: структура разделов. */}
      <div className="space-y-7">
        {categoryGroups.map((group) => (
          <div key={group.title}>
            <p className="font-mono text-[0.625rem] uppercase tracking-[0.18em] text-titanium">
              {group.title}
            </p>
            <ul className="mt-3 space-y-0.5">
              {group.ids.map((id) => (
                <li key={id}>
                  <a
                    href={`catalog/${id}`}
                    onClick={onNavigate}
                    onMouseEnter={() => setActiveCategory(id)}
                    onFocus={() => setActiveCategory(id)}
                    className={`flex items-baseline justify-between gap-3 rounded-lg px-3.5 py-2.5 text-[0.9375rem] transition-colors duration-300 ease-premium ${
                      activeCategory === id
                        ? 'bg-graphite text-porcelain'
                        : 'text-ash hover:bg-graphite/[0.05] hover:text-graphite'
                    }`}
                  >
                    <span className="min-w-0 truncate">{categoryLabel(id)}</span>
                    <span
                      className={`shrink-0 font-mono text-[0.6875rem] ${
                        activeCategory === id ? 'text-porcelain/60' : 'text-titanium'
                      }`}
                    >
                      {countByCategory(id)}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Правая область: крупные карточки товаров наведённого раздела. */}
      <div className="min-w-0 border-l border-graphite/[0.08] pl-8 xl:pl-12">
        <div className="flex items-end justify-between gap-8">
          <div className="min-w-0">
            <p className="text-[1.375rem] tracking-tight text-graphite">
              {categoryLabel(activeCategory)}
            </p>
            <p className="mt-2 max-w-[52ch] text-[0.9375rem] leading-relaxed text-slate">
              {categoryNote(activeCategory)}
            </p>
          </div>
          <a
            href={`catalog/${activeCategory}`}
            onClick={onNavigate}
            className="group inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full border border-graphite/20 px-5 py-2.5 text-[0.875rem] text-graphite transition-colors duration-300 ease-premium hover:border-graphite/50 hover:bg-graphite/[0.04]"
          >
            Весь раздел
            <ArrowRight
              size={14}
              className="transition-transform duration-300 ease-premium group-hover:translate-x-0.5"
            />
          </a>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-5 xl:grid-cols-3">
          {previewProducts.map((product, i) => {
            const price = minPrice(product)
            const thumb = product.image.replace('.webp', '-thumb.webp')
            return (
              <a
                key={product.slug}
                href={productHref(product)}
                onClick={onNavigate}
                // Третья карточка появляется только от xl: на 1024–1279px
                // три крупных кадра в этой колонке уже не помещаются, и
                // сжимать их до миниатюр — ровно то, на что жаловался клиент.
                className={`group flex flex-col rounded-2xl border border-graphite/[0.08] p-3 transition-colors duration-300 ease-premium hover:border-graphite/25 hover:bg-mist/60 ${
                  i === 2 ? 'hidden xl:flex' : ''
                }`}
              >
                {/* Квадратный кадр с минимальным внутренним отступом: при 4:3 и
                    p-5 официальное фото ужималось до ~120px и снова читалось
                    как иконка — ровно то, на что клиент жаловался. */}
                <span className="flex aspect-square items-center justify-center overflow-hidden rounded-xl bg-[radial-gradient(120%_100%_at_50%_0%,#FFFFFF_0%,#EFF3F4_50%,#E3EAEC_100%)] p-3 transition-colors duration-300 ease-premium">
                  <img
                    src={thumb}
                    srcSet={`${thumb} 300w, ${product.image} 700w`}
                    sizes="360px"
                    alt={`ShineMate ${product.model}`}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-contain transition-transform duration-500 ease-premium group-hover:scale-[1.05]"
                  />
                </span>
                <span className="mt-4 flex items-center gap-1.5 text-[1.0625rem] tracking-tight text-graphite">
                  <span className="min-w-0 truncate">{product.model}</span>
                  <ArrowUpRight
                    size={14}
                    className="shrink-0 text-graphite/25 transition-all duration-300 ease-premium group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-graphite/60"
                  />
                </span>
                <span className="mt-1 block truncate text-[0.8125rem] text-slate">{product.kind}</span>
                {price != null && (
                  <span className="mt-3 block text-[0.9375rem] tracking-tight text-ash">
                    {product.variants.length > 1 ? 'от ' : ''}
                    {formatPrice(price)}
                  </span>
                )}
              </a>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export function CatalogMegaMenuFooter({ onNavigate }: Props) {
  return (
    <a
      href="catalog"
      onClick={onNavigate}
      className="group mt-9 inline-flex items-center gap-2 border-t border-graphite/[0.08] pt-7 text-[1rem] text-graphite transition-colors duration-400 ease-premium hover:text-ash"
    >
      Смотреть весь каталог — {totalSkus} позиций
      <ArrowRight
        size={16}
        className="transition-transform duration-400 ease-premium group-hover:translate-x-1"
      />
    </a>
  )
}
