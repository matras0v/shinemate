import { useState } from 'react'
import { ArrowUpRight } from 'lucide-react'

import { categories, categoryGroups, countByCategory, productsByCategory, totalSkus, type CategoryId } from '../data/catalog'
import { productHref } from '../lib/router'

type Props = { onNavigate?: () => void }

const categoryLabel = (id: string) => categories.find((c) => c.id === id)?.title ?? id

const DEFAULT_CATEGORY: CategoryId = categoryGroups[0].ids[0]

/**
 * Каталожное меню — только desktop hover (мобильный аккордеон в Header
 * устроен отдельно, у него нет места для второй колонки с превью).
 *
 * Слева — та же группировка разделов, что в sidebar каталога. Справа —
 * реальные товары наведённого раздела: клиент показал на видео, как это
 * сделано на официальном shinemate.com — наведение на категорию сразу
 * подтягивает фото и модели, а не только список текстовых ссылок. До 3
 * товаров на раздел, ничего не выдумано и не сгенерировано — те же
 * данные и фото, что в catalog.ts.
 */
export function CatalogMegaMenuContent({ onNavigate }: Props) {
  const [activeCategory, setActiveCategory] = useState<CategoryId>(DEFAULT_CATEGORY)
  const previewProducts = productsByCategory(activeCategory).slice(0, 3)

  return (
    <div className="grid grid-cols-[20rem_1fr] gap-10">
      <div className="grid grid-cols-2 gap-x-8 gap-y-8">
        {categoryGroups.map((group) => (
          <div key={group.title}>
            <p className="font-mono text-[0.625rem] uppercase tracking-[0.16em] text-titanium">
              {group.title}
            </p>
            <ul className="mt-3 space-y-2.5">
              {group.ids.map((id) => (
                <li key={id}>
                  <a
                    href={`catalog/${id}`}
                    onClick={onNavigate}
                    onMouseEnter={() => setActiveCategory(id)}
                    onFocus={() => setActiveCategory(id)}
                    className={`flex items-baseline justify-between gap-3 text-[0.875rem] transition-colors duration-300 ease-premium ${
                      activeCategory === id ? 'text-graphite' : 'text-ash hover:text-graphite'
                    }`}
                  >
                    <span className="min-w-0 truncate">{categoryLabel(id)}</span>
                    <span className="shrink-0 font-mono text-[0.6875rem] text-titanium">
                      {countByCategory(id)}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/*
        Визуальная часть: реальные товары раздела, наведённого слева. Второй
        заход клиента: маленькая иконка-круг с фото 48px "не давала визуальной
        информации" — теперь три большие карточки в ряд, фото занимает
        основную площадь карточки, а не крошечный кружок сбоку от текста.
      */}
      <div className="border-l border-graphite/[0.08] pl-8">
        <p className="font-mono text-[0.625rem] uppercase tracking-[0.16em] text-titanium">
          {categoryLabel(activeCategory)}
        </p>
        <div className="mt-3 grid grid-cols-3 gap-4">
          {previewProducts.map((product) => (
            <a
              key={product.slug}
              href={productHref(product)}
              onClick={onNavigate}
              className="group flex flex-col rounded-xl p-2 transition-colors duration-300 ease-premium hover:bg-mist"
            >
              <span className="flex h-24 items-center justify-center rounded-lg bg-mist p-3 group-hover:bg-porcelain">
                <img
                  src={product.image}
                  alt=""
                  className="max-h-full w-auto max-w-full object-contain"
                />
              </span>
              <span className="mt-3 flex items-center gap-1 truncate text-[0.8125rem] tracking-tight text-graphite">
                {product.model}
                <ArrowUpRight
                  size={12}
                  className="shrink-0 text-graphite/25 transition-all duration-300 ease-premium group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-slate"
                />
              </span>
              <span className="mt-0.5 block truncate text-[0.6875rem] text-titanium">{product.kind}</span>
            </a>
          ))}
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
      className="group mt-7 inline-flex items-center gap-2 text-[0.875rem] text-graphite transition-colors duration-400 ease-premium hover:text-slate"
    >
      Смотреть весь каталог — {totalSkus} позиций
      <span aria-hidden className="transition-transform duration-400 ease-premium group-hover:translate-x-1">
        →
      </span>
    </a>
  )
}
