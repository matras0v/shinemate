import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown, Menu, Search, X } from 'lucide-react'

import { categoryGroups, categories, countByCategory } from '../data/catalog'
import { useBodyScrollLock } from '../hooks/useBodyScrollLock'
import { nav } from '../data/company'
import { useLead } from '../lib/leadContext'
import { EASE } from '../lib/motion'
import { navigateTo } from '../lib/router'
import { CatalogMegaMenuContent, CatalogMegaMenuFooter } from './CatalogMegaMenu'
import { BrandLockup } from './ui/BrandLockup'

type Props = {
  onHome: boolean
  onOpenSearch: () => void
}

export function Header({ onHome, onOpenSearch }: Props) {
  const [lifted, setLifted] = useState(!onHome)
  const [open, setOpen] = useState(false)
  const [catalogOpen, setCatalogOpen] = useState(false)
  const [mobileCatalogOpen, setMobileCatalogOpen] = useState(false)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const { requestWholesale, requestGeneral } = useLead()

  // Хедер становится контрастнее почти сразу после начала скролла — фиксированный
  // порог в пикселях, а не доля window.innerHeight. На мобильном Safari
  // innerHeight меняется прямо во время скролла (сворачивается адресная
  // строка), поэтому доля от него плавает и порог «срабатывает» в разных
  // местах на разных кадрах — из-за этого хедер подолгу оставался прозрачным
  // и контент hero просвечивал сквозь него. Небольшая фиксированная величина
  // не зависит от высоты вьюпорта и решает это архитектурно, а не подгонкой
  // под один скриншот.
  useEffect(() => {
    if (!onHome) {
      setLifted(true)
      return
    }
    const onScroll = () => setLifted(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [onHome])

  // Пока открыто мобильное меню, фон под ним не прокручивается.
  useBodyScrollLock(open)

  const go = (href: string) => {
    setOpen(false)
    navigateTo(href)
  }

  const openCatalogMenu = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current)
    setCatalogOpen(true)
  }
  const scheduleCloseCatalogMenu = () => {
    closeTimer.current = setTimeout(() => setCatalogOpen(false), 150)
  }

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-700 ease-premium ${
        lifted
          ? 'border-b border-graphite/[0.08] bg-porcelain/85 backdrop-blur-xl'
          : 'border-b border-transparent bg-transparent'
      }`}
    >
      <div className="shell flex h-[4.5rem] items-center justify-between gap-4">
        <a
          href="."
          onClick={(e) => {
            e.preventDefault()
            go('/')
          }}
          aria-label="ShineMate — на главную"
          className="shrink-0"
        >
          <BrandLockup />
        </a>

        <nav className="hidden items-center gap-6 lg:flex xl:gap-8">
          <div
            className="relative"
            onMouseEnter={openCatalogMenu}
            onMouseLeave={scheduleCloseCatalogMenu}
          >
            <a
              href="catalog"
              onClick={(e) => {
                e.preventDefault()
                go('/catalog')
              }}
              className="group flex items-center gap-1.5 whitespace-nowrap text-[0.9375rem] text-graphite/70 transition-colors duration-500 ease-premium hover:text-graphite"
            >
              Каталог
              <ChevronDown
                size={14}
                className={`transition-transform duration-400 ease-premium ${catalogOpen ? 'rotate-180' : ''}`}
              />
            </a>

            <AnimatePresence>
              {catalogOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ duration: 0.25, ease: EASE }}
                  className="absolute left-1/2 top-full z-40 mt-3 w-[34rem] -translate-x-1/2 rounded-2xl border border-graphite/[0.08] bg-porcelain p-8 shadow-[0_30px_70px_-30px_rgba(26,28,30,0.35)]"
                >
                  <CatalogMegaMenuContent onNavigate={() => setCatalogOpen(false)} />
                  <CatalogMegaMenuFooter onNavigate={() => setCatalogOpen(false)} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {nav.map((item) => (
            <a
              key={item.href}
              href={item.href}
              onClick={(e) => {
                e.preventDefault()
                setOpen(false)
                // "Контакты" — не просто маршрут: если человек только что был
                // в режиме "Розница/Опт" (intent остаётся в контексте), клик
                // сюда должен вернуть розничный вид, а не просто попытаться
                // сменить путь на тот же самый /contacts, где React ничего
                // не перерисует, раз адрес не изменился.
                if (item.href === 'contacts') {
                  requestGeneral()
                } else {
                  go(item.href)
                }
              }}
              className="group relative whitespace-nowrap text-[0.9375rem] text-graphite/70 transition-colors duration-500 ease-premium hover:text-graphite"
            >
              {item.label}
              <span className="absolute -bottom-1.5 left-0 h-px w-0 bg-graphite transition-all duration-500 ease-premium group-hover:w-full" />
            </a>
          ))}

          <a
            href="contacts"
            onClick={(e) => {
              e.preventDefault()
              setOpen(false)
              requestWholesale()
            }}
            className="whitespace-nowrap text-[0.9375rem] text-graphite/70 transition-colors duration-500 ease-premium hover:text-graphite"
          >
            Розница/Опт
          </a>
        </nav>

        <div className="flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            onClick={onOpenSearch}
            aria-label="Поиск по каталогу"
            className="flex h-10 w-10 items-center justify-center rounded-full text-graphite/60 transition-colors duration-400 ease-premium hover:bg-graphite/[0.06] hover:text-graphite"
          >
            <Search size={17} />
          </button>
          <a
            href="contacts"
            onClick={(e) => {
              e.preventDefault()
              setOpen(false)
              requestGeneral()
            }}
            className="ml-1 hidden whitespace-nowrap rounded-full bg-graphite px-5 py-2.5 text-sm text-porcelain transition-colors duration-500 ease-premium hover:bg-ink sm:inline-flex"
          >
            Запросить прайс
          </a>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? 'Закрыть меню' : 'Открыть меню'}
            aria-expanded={open}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-graphite/15 text-graphite lg:hidden"
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.45, ease: EASE }}
            className="max-h-[calc(100dvh-4.5rem)] overflow-y-auto border-t border-graphite/[0.08] bg-porcelain/95 backdrop-blur-xl lg:hidden"
          >
            <nav className="shell flex flex-col py-2">
              <button
                type="button"
                onClick={() => setMobileCatalogOpen((v) => !v)}
                aria-expanded={mobileCatalogOpen}
                className="flex items-center justify-between border-b border-graphite/[0.06] py-4 text-lg text-graphite"
              >
                Каталог
                <ChevronDown
                  size={18}
                  className={`text-graphite/40 transition-transform duration-400 ease-premium ${
                    mobileCatalogOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>
              <AnimatePresence initial={false}>
                {mobileCatalogOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: EASE }}
                    className="overflow-hidden border-b border-graphite/[0.06]"
                  >
                    <ul className="py-3">
                      <li>
                        <a
                          href="catalog"
                          onClick={(e) => {
                            e.preventDefault()
                            go('/catalog')
                          }}
                          className="flex items-center justify-between py-2.5 text-[0.9375rem] text-graphite"
                        >
                          Всё оборудование
                        </a>
                      </li>
                      {categoryGroups.flatMap((group) => group.ids).map((id) => {
                        const cat = categories.find((c) => c.id === id)
                        if (!cat) return null
                        return (
                          <li key={id}>
                            <a
                              href={`catalog/${id}`}
                              onClick={(e) => {
                                e.preventDefault()
                                go(`/catalog/${id}`)
                              }}
                              className="flex items-center justify-between py-2.5 text-[0.9375rem] text-graphite/70"
                            >
                              {cat.title}
                              <span className="font-mono text-[0.6875rem] text-titanium">
                                {countByCategory(id)}
                              </span>
                            </a>
                          </li>
                        )
                      })}
                    </ul>
                  </motion.div>
                )}
              </AnimatePresence>

              {nav.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={(e) => {
                    e.preventDefault()
                    setOpen(false)
                    if (item.href === 'contacts') {
                      requestGeneral()
                    } else {
                      go(item.href)
                    }
                  }}
                  className="border-b border-graphite/[0.06] py-4 text-lg text-graphite"
                >
                  {item.label}
                </a>
              ))}

              <a
                href="contacts"
                onClick={(e) => {
                  e.preventDefault()
                  setOpen(false)
                  requestWholesale()
                }}
                className="border-b border-graphite/[0.06] py-4 text-lg text-graphite last:border-0"
              >
                Розница/Опт
              </a>

              <a
                href="contacts"
                onClick={(e) => {
                  e.preventDefault()
                  setOpen(false)
                  requestGeneral()
                }}
                className="mb-3 mt-4 rounded-full bg-graphite px-5 py-3.5 text-center text-sm text-porcelain"
              >
                Запросить прайс
              </a>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
