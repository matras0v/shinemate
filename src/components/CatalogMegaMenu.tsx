import { categories, categoryGroups, countByCategory, totalSkus } from '../data/catalog'

type Props = { onNavigate?: () => void }

const categoryLabel = (id: string) => categories.find((c) => c.id === id)?.title ?? id

/**
 * Содержимое каталожного меню: та же группировка, что в sidebar каталога.
 * Используется и в desktop hover-меню, и в мобильном drawer-аккордеоне —
 * один источник правды на оба места.
 */
export function CatalogMegaMenuContent({ onNavigate }: Props) {
  return (
    <div className="grid grid-cols-2 gap-x-12 gap-y-8">
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
                  className="flex items-baseline justify-between gap-3 text-[0.875rem] text-graphite/70 transition-colors duration-400 ease-premium hover:text-graphite"
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
  )
}

export function CatalogMegaMenuFooter({ onNavigate }: Props) {
  return (
    <a
      href="catalog"
      onClick={onNavigate}
      className="group mt-7 inline-flex items-center gap-2 text-[0.875rem] text-graphite transition-colors duration-400 ease-premium hover:text-graphite/60"
    >
      Смотреть весь каталог — {totalSkus} позиций
      <span aria-hidden className="transition-transform duration-400 ease-premium group-hover:translate-x-1">
        →
      </span>
    </a>
  )
}
