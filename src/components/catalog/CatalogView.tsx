import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, ChevronDown, SlidersHorizontal, X } from 'lucide-react'

import {
  categories,
  categoryGroups,
  countByCategory,
  priceNote,
  products,
  sortProducts,
  totalSkus,
  type CategoryId,
  type SortOrder,
} from '../../data/catalog'
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock'
import { useReducedMotion } from '../../hooks/useReducedMotion'
import { EASE } from '../../lib/motion'
import { navigate } from '../../lib/router'
import { ProductCard } from './ProductCard'

type Props = {
  category: CategoryId | 'all'
}

const SORT_LABELS: Record<SortOrder, string> = {
  recommended: 'Рекомендуемые',
  'price-asc': 'Цена: по возрастанию',
  'price-desc': 'Цена: по убыванию',
  alpha: 'По названию',
}

export function CatalogView({ category }: Props) {
  const reduced = useReducedMotion()
  const [sort, setSort] = useState<SortOrder>('recommended')
  const [mobileCategoriesOpen, setMobileCategoriesOpen] = useState(false)
  const [sortOpen, setSortOpen] = useState(false)

  // Каждый раздел открывается сверху, а не с позиции прошлой прокрутки.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [category])

  const filtered = useMemo(
    () => (category === 'all' ? products : products.filter((p) => p.category === category)),
    [category],
  )
  const list = useMemo(() => sortProducts(filtered, sort), [filtered, sort])

  const active = categories.find((c) => c.id === category)
  const shownSkus = list.reduce((n, p) => n + p.variants.length, 0)

  return (
    <div className="min-h-[100dvh] bg-mist pb-24 pt-[5.5rem] md:pb-32">
      <div className="shell pt-8 md:pt-12">
        <a
          href="."
          className="group inline-flex items-center gap-2 text-[0.875rem] text-slate transition-colors duration-500 ease-premium hover:text-graphite"
        >
          <ArrowLeft
            size={15}
            className="transition-transform duration-500 ease-premium group-hover:-translate-x-0.5"
          />
          На главную
        </a>

        <motion.div
          key={category}
          {...(reduced
            ? {}
            : { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.7, ease: EASE } })}
          className="mt-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between md:gap-10"
        >
          <div className="min-w-0">
            <p className="eyebrow">Каталог ShineMate</p>
            <h1 className="h1-sm mt-4 max-w-[18ch]">
              {active ? active.title : 'Всё оборудование и расходные материалы'}
            </h1>
            {active && (
              <p className="mt-4 max-w-[52ch] text-[1rem] leading-relaxed text-slate">
                {active.subtitle}
              </p>
            )}
          </div>
          <p className="shrink-0 font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-titanium">
            {shownSkus} из {totalSkus} позиций · {priceNote}
          </p>
        </motion.div>
      </div>

      <div className="shell mt-10 lg:grid lg:grid-cols-[260px_1fr] lg:items-start lg:gap-12">
        {/* Desktop: вертикальная навигация по разделам, липкая под шапкой. */}
        <aside className="hidden lg:sticky lg:top-[6.5rem] lg:block">
          <CategorySidebar activeId={category} />
        </aside>

        <div className="min-w-0">
          {/* Mobile/tablet: та же навигация в виде bottom sheet по кнопке. */}
          <div className="flex items-center gap-2.5 lg:hidden">
            <button
              type="button"
              onClick={() => setMobileCategoriesOpen(true)}
              className="inline-flex flex-1 items-center justify-between gap-2 rounded-full border border-graphite/15 bg-porcelain px-5 py-3 text-[0.875rem] text-graphite"
            >
              <span className="truncate">{active ? active.title : 'Все категории'}</span>
              <SlidersHorizontal size={15} className="shrink-0 text-titanium" />
            </button>
            <SortControl sort={sort} onChange={setSort} open={sortOpen} setOpen={setSortOpen} compact />
          </div>

          <div className="mt-6 hidden items-center justify-between lg:flex">
            <p className="text-[0.875rem] text-slate">
              Найдено <span className="text-graphite">{list.length}</span>{' '}
              {pluralize(list.length)}
            </p>
            <SortControl sort={sort} onChange={setSort} open={sortOpen} setOpen={setSortOpen} />
          </div>

          <div className="mt-6 grid gap-px overflow-hidden rounded-[1.25rem] bg-graphite/[0.1] sm:grid-cols-2 xl:grid-cols-3 lg:mt-4">
            {list.map((product, i) => (
              <ProductCard key={product.slug} product={product} index={i} />
            ))}
          </div>

          <div className="mt-14 rounded-[1.25rem] bg-porcelain p-8 text-center md:p-12">
            <h2 className="h3 mx-auto max-w-[22ch]">
              Не нашли позицию — она может быть в полном прайсе
            </h2>
            <p className="mx-auto mt-4 max-w-[46ch] text-[0.9375rem] leading-relaxed text-slate">
              На сайте собраны основные группы. Пришлём актуальный прайс целиком и подберём
              конфигурацию под ваши задачи и объёмы.
            </p>
            <a
              href="contacts"
              className="mt-7 inline-flex items-center rounded-full bg-graphite px-7 py-3.5 text-sm text-porcelain transition-colors duration-500 ease-premium hover:bg-ink"
            >
              Запросить прайс
            </a>
          </div>
        </div>
      </div>

      <MobileCategorySheet
        open={mobileCategoriesOpen}
        onClose={() => setMobileCategoriesOpen(false)}
        activeId={category}
      />
    </div>
  )
}

function pluralize(n: number) {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return 'позиция'
  if ([2, 3, 4].includes(mod10) && ![12, 13, 14].includes(mod100)) return 'позиции'
  return 'позиций'
}

function CategorySidebar({ activeId }: { activeId: CategoryId | 'all' }) {
  return (
    <nav aria-label="Разделы каталога" className="space-y-8">
      <CategoryLink href="catalog" active={activeId === 'all'} label="Все товары" count={totalSkus} strong />
      {categoryGroups.map((group) => (
        <div key={group.title}>
          <p className="font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-titanium">
            {group.title}
          </p>
          <ul className="mt-3 space-y-0.5">
            {group.ids.map((id) => {
              const cat = categories.find((c) => c.id === id)
              if (!cat) return null
              return (
                <li key={id}>
                  <CategoryLink
                    href={`catalog/${id}`}
                    active={activeId === id}
                    label={cat.title}
                    count={countByCategory(id)}
                  />
                </li>
              )
            })}
          </ul>
        </div>
      ))}
    </nav>
  )
}

function CategoryLink({
  href,
  active,
  label,
  count,
  strong,
}: {
  href: string
  active: boolean
  label: string
  count: number
  strong?: boolean
}) {
  return (
    <a
      href={href}
      aria-current={active ? 'page' : undefined}
      className={`flex items-center justify-between gap-3 rounded-lg py-2 pl-3 pr-2.5 text-[0.875rem] transition-colors duration-300 ease-premium ${
        strong ? 'font-medium' : ''
      } ${
        active
          ? 'bg-graphite text-porcelain'
          : 'text-ash hover:bg-graphite/[0.06] hover:text-graphite'
      }`}
    >
      <span className="min-w-0 truncate">{label}</span>
      <span className={`shrink-0 font-mono text-[0.6875rem] ${active ? 'text-porcelain/55' : 'text-titanium'}`}>
        {count}
      </span>
    </a>
  )
}

function SortControl({
  sort,
  onChange,
  open,
  setOpen,
  compact,
}: {
  sort: SortOrder
  onChange: (order: SortOrder) => void
  open: boolean
  setOpen: (v: boolean) => void
  compact?: boolean
}) {
  return (
    <div className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className={`inline-flex items-center gap-2 rounded-full border border-graphite/15 bg-porcelain text-[0.8125rem] text-ash transition-colors duration-400 ease-premium hover:text-graphite ${
          compact ? 'p-3' : 'px-4 py-2.5'
        }`}
      >
        {!compact && <span className="whitespace-nowrap">{SORT_LABELS[sort]}</span>}
        <ChevronDown size={14} className={`transition-transform duration-400 ease-premium ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {open && (
          <>
            <button
              type="button"
              aria-hidden
              tabIndex={-1}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-30 cursor-default"
            />
            <motion.ul
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              transition={{ duration: 0.2, ease: EASE }}
              className="absolute right-0 top-full z-40 mt-2 w-52 overflow-hidden rounded-xl border border-graphite/[0.08] bg-porcelain py-1.5 shadow-[0_20px_50px_-20px_rgba(26,28,30,0.35)]"
            >
              {(Object.keys(SORT_LABELS) as SortOrder[]).map((key) => (
                <li key={key}>
                  <button
                    type="button"
                    onClick={() => {
                      onChange(key)
                      setOpen(false)
                    }}
                    className={`block w-full px-4 py-2.5 text-left text-[0.8125rem] transition-colors duration-300 ease-premium hover:bg-mist ${
                      key === sort ? 'text-graphite' : 'text-slate'
                    }`}
                  >
                    {SORT_LABELS[key]}
                  </button>
                </li>
              ))}
            </motion.ul>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

function MobileCategorySheet({
  open,
  onClose,
  activeId,
}: {
  open: boolean
  onClose: () => void
  activeId: CategoryId | 'all'
}) {
  useBodyScrollLock(open)

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[70] flex items-end lg:hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25, ease: EASE }}
        >
          <button
            type="button"
            aria-label="Закрыть"
            onClick={onClose}
            className="absolute inset-0 cursor-default bg-ink/30 backdrop-blur-[2px]"
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ duration: 0.4, ease: EASE }}
            className="relative max-h-[80dvh] w-full overflow-y-auto overscroll-contain rounded-t-[1.75rem] bg-porcelain pb-[max(1.5rem,env(safe-area-inset-bottom))]"
          >
            <div className="sticky top-0 flex items-center justify-between border-b border-graphite/[0.1] bg-porcelain px-6 py-4">
              <p className="text-[1.0625rem] tracking-tight">Категории</p>
              <button
                type="button"
                onClick={onClose}
                aria-label="Закрыть"
                className="flex h-9 w-9 items-center justify-center rounded-full text-slate transition-colors duration-400 ease-premium hover:bg-graphite/10 hover:text-graphite"
              >
                <X size={16} />
              </button>
            </div>
            <div className="px-6 py-5">
              <button
                type="button"
                onClick={() => {
                  navigate('/catalog')
                  onClose()
                }}
                className={`mb-6 flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-[0.9375rem] font-medium ${
                  activeId === 'all' ? 'bg-graphite text-porcelain' : 'text-graphite'
                }`}
              >
                Все товары
                <span className={`font-mono text-[0.75rem] ${activeId === 'all' ? 'text-porcelain/55' : 'text-titanium'}`}>
                  {totalSkus}
                </span>
              </button>

              {categoryGroups.map((group) => (
                <div key={group.title} className="mb-6 last:mb-0">
                  <p className="font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-titanium">
                    {group.title}
                  </p>
                  <ul className="mt-3 space-y-0.5">
                    {group.ids.map((id) => {
                      const cat = categories.find((c) => c.id === id)
                      if (!cat) return null
                      const isActive = activeId === id
                      return (
                        <li key={id}>
                          <button
                            type="button"
                            onClick={() => {
                              navigate(`/catalog/${id}`)
                              onClose()
                            }}
                            className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-[0.9375rem] transition-colors duration-300 ease-premium ${
                              isActive ? 'bg-graphite text-porcelain' : 'text-ash'
                            }`}
                          >
                            <span className="min-w-0 truncate text-left">{cat.title}</span>
                            <span
                              className={`shrink-0 font-mono text-[0.75rem] ${
                                isActive ? 'text-porcelain/55' : 'text-titanium'
                              }`}
                            >
                              {countByCategory(id)}
                            </span>
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
