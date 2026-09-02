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
 * shinemate.com: наведение на раздел сразу подтягивает реальные модели с
 * крупными фото, а не список текстовых ссылок. Здесь то же самое —
 * слева структура разделов, справа три большие карточки товаров
 * наведённого раздела с ценой и типом. Данные и фото — из catalog.ts.
 */
export function CatalogMegaMenuContent({ onNavigate }: Props) {
  const [activeCategory, setActiveCategory] = useState<CategoryId>(DEFAULT_CATEGORY)
  const previewProducts = productsByCategory(activeCategory).slice(0, 3)

  return (
    <div className="grid grid-cols-[16rem_1fr] gap-8 xl:grid-cols-[18rem_1fr] xl:gap-12">
      {/* Левая колонка: структура разделов. */}
      <div className="space-y-6">
        {categoryGroups.map((group) => (
          <div key={group.title}>
            <p className="font-mono text-[0.625rem] uppercase tracking-[0.16em] text-titanium">
              {group.title}
            </p>
            <ul className="mt-2.5 space-y-0.5">
              {group.ids.map((id) => (
                <li key={id}>
                  <a
                    href={`catalog/${id}`}
                    onClick={onNavigate}
                    onMouseEnter={() => setActiveCategory(id)}
                    onFocus={() => setActiveCategory(id)}
                    className={`flex items-baseline justify-between gap-3 rounded-lg px-3 py-2 text-[0.875rem] transition-colors duration-300 ease-premium ${
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
        <div className="flex items-baseline justify-between gap-6">
          <div className="min-w-0">
            <p className="text-[1.0625rem] tracking-tight text-graphite">
              {categoryLabel(activeCategory)}
            </p>
            <p className="mt-1 truncate text-[0.8125rem] text-slate">{categoryNote(activeCategory)}</p>
          </div>
          <a
            href={`catalog/${activeCategory}`}
            onClick={onNavigate}
            className="group inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap text-[0.8125rem] text-ash transition-colors duration-300 ease-premium hover:text-graphite"
          >
            Весь раздел
            <ArrowRight
              size={13}
              className="transition-transform duration-300 ease-premium group-hover:translate-x-0.5"
            />
          </a>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-4">
          {previewProducts.map((product) => {
            const price = minPrice(product)
            const thumb = product.image.replace('.webp', '-thumb.webp')
            return (
              <a
                key={product.slug}
                href={productHref(product)}
                onClick={onNavigate}
                className="group flex flex-col rounded-2xl border border-transparent p-3 transition-colors duration-300 ease-premium hover:border-graphite/[0.12] hover:bg-mist/70"
              >
                <span className="flex aspect-[4/3] items-center justify-center rounded-xl bg-gradient-to-br from-frost/40 via-mist to-mist p-4 transition-colors duration-300 ease-premium group-hover:from-frost/60">
                  <img
                    src={thumb}
                    srcSet={`${thumb} 300w, ${product.image} 700w`}
                    sizes="220px"
                    alt={`ShineMate ${product.model}`}
                    loading="lazy"
                    decoding="async"
                    className="max-h-full w-auto max-w-full object-contain"
                  />
                </span>
                <span className="mt-3 flex items-center gap-1 text-[0.875rem] tracking-tight text-graphite">
                  <span className="min-w-0 truncate">{product.model}</span>
                  <ArrowUpRight
                    size={12}
                    className="shrink-0 text-graphite/25 transition-all duration-300 ease-premium group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-graphite/60"
                  />
                </span>
                <span className="mt-0.5 block truncate text-[0.6875rem] text-slate">{product.kind}</span>
                {price != null && (
                  <span className="mt-1.5 block text-[0.8125rem] tracking-tight text-ash">
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
      className="group mt-8 inline-flex items-center gap-2 border-t border-graphite/[0.08] pt-6 text-[0.9375rem] text-graphite transition-colors duration-400 ease-premium hover:text-ash"
    >
      Смотреть весь каталог — {totalSkus} позиций
      <ArrowRight
        size={15}
        className="transition-transform duration-400 ease-premium group-hover:translate-x-1"
      />
    </a>
  )
}
