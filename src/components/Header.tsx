import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown, ChevronRight, Menu, Search, X } from 'lucide-react'

import { categoryGroups, categories, countByCategory, totalSkus } from '../data/catalog'
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
  // Клавиатура: Tab внутрь меню держит его открытым (mouseleave тут не
  // срабатывает вовсе), Tab наружу или Escape закрывают. relatedTarget —
  // куда фокус переходит ПОСЛЕ blur — если это всё ещё внутри обёртки,
  // меню не закрываем.
  const onCatalogBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
      setCatalogOpen(false)
    }
  }
  useEffect(() => {
    if (!catalogOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setCatalogOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [catalogOpen])

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-700 ease-premium ${
        lifted
          ? 'border-b border-graphite/[0.08] bg-porcelain/85 backdrop-blur-xl'
          : 'border-b border-transparent bg-transparent'
      }`}
    >
      <div className="shell flex h-[4.75rem] items-center justify-between gap-4 lg:h-[5.25rem]">
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

        <nav className="hidden items-center gap-7 lg:flex xl:gap-9">
          <div
            className="relative"
            onMouseEnter={openCatalogMenu}
            onMouseLeave={scheduleCloseCatalogMenu}
            onFocus={openCatalogMenu}
            onBlur={onCatalogBlur}
          >
            <a
              href="catalog"
              onClick={(e) => {
                e.preventDefault()
                go('/catalog')
              }}
              aria-expanded={catalogOpen}
              aria-haspopup="true"
              className={`group flex items-center gap-1.5 whitespace-nowrap text-[1rem] transition-colors duration-500 ease-premium ${
                catalogOpen ? 'text-graphite' : 'text-ash hover:text-graphite'
              }`}
            >
              Каталог
              <ChevronDown
                size={15}
                className={`transition-transform duration-400 ease-premium ${catalogOpen ? 'rotate-180' : ''}`}
              />
            </a>
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
              className={`group relative whitespace-nowrap text-[1rem] transition-colors duration-500 ease-premium ${
                item.href === 'contacts'
                  ? 'font-semibold text-ember hover:text-ember/70'
                  : 'text-ash hover:text-graphite'
              }`}
            >
              {item.label}
              <span className="absolute -bottom-1.5 left-0 h-px w-0 bg-graphite transition-all duration-500 ease-premium group-hover:w-full" />
            </a>
          ))}

          <a
            href="wholesale"
            onClick={(e) => {
              e.preventDefault()
              setOpen(false)
              requestWholesale()
            }}
            // Клиент отметил на видео: "Контакты"/"Розница/Опт" в шапке
            // терялись среди остальных пунктов — жирнее и с фирменным
            // акцентом, чтобы было видно, что это отдельные CTA, а не
            // рядовые ссылки навигации.
            //
            // Отдельно клиент отметил, что сама формулировка "Розница/Опт"
            // звучит странно: страница за ней — не переключатель вида
            // "розница или опт", а форма ТОЛЬКО для оптовиков (см.
            // Wholesale.tsx). Название кнопки приведено в соответствие с
            // тем, что на неё реально ведёт.
            className="whitespace-nowrap text-[1rem] font-semibold text-ember transition-colors duration-500 ease-premium hover:text-ember/70"
          >
            Оптовикам
          </a>
        </nav>

        <div className="flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            onClick={onOpenSearch}
            aria-label="Поиск по каталогу"
            className="flex h-10 w-10 items-center justify-center rounded-full text-slate transition-colors duration-400 ease-premium hover:bg-graphite/[0.06] hover:text-graphite"
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

      {/*
        Мега-меню каталога — не «плашка под пунктом», а полноширинная
        панель на всю сетку страницы. Клиент прямо просил ощущение
        оригинального shinemate.com: открыл каталог — перед глазами
        крупный товарный браузер, а не список ссылок в углу. Панель живёт
        на уровне <header>, а не внутри пункта навигации: так её ширина
        задаётся вьюпортом, а не положением слова «Каталог», и никакой
        центровки, вылезающей за экран на 1280px, больше не требуется.
      */}
      <AnimatePresence>
        {catalogOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: EASE }}
            onMouseEnter={openCatalogMenu}
            onMouseLeave={scheduleCloseCatalogMenu}
            onBlur={onCatalogBlur}
            className="absolute inset-x-0 top-full z-40 hidden lg:block"
          >
            <div className="shell-wide pb-6">
              <div className="max-h-[calc(100dvh-7rem)] overflow-y-auto rounded-[1.75rem] border border-graphite/[0.08] bg-porcelain p-8 shadow-[0_40px_90px_-40px_rgba(26,28,30,0.45)] xl:p-10">
                <CatalogMegaMenuContent onNavigate={() => setCatalogOpen(false)} />
                <CatalogMegaMenuFooter onNavigate={() => setCatalogOpen(false)} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.45, ease: EASE }}
            className="max-h-[calc(100dvh-4.75rem)] overflow-y-auto border-t border-graphite/[0.08] bg-porcelain/95 backdrop-blur-xl lg:hidden"
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
                  className={`text-titanium transition-transform duration-400 ease-premium ${
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
                    {/*
                      Мобильный каталог — не сжатое desktop-меню: hover тут
                      нет вообще. Разделы сгруппированы так же, как в
                      каталоге, у каждого — крупная область нажатия (не
                      меньше 56px), реальное фото раздела и счётчик позиций,
                      чтобы выбор делался одним касанием без промахов.
                    */}
                    <div className="space-y-5 py-4">
                      <a
                        href="catalog"
                        onClick={(e) => {
                          e.preventDefault()
                          go('/catalog')
                        }}
                        className="flex items-center justify-between rounded-xl bg-graphite px-4 py-3.5 text-[0.9375rem] text-porcelain"
                      >
                        Всё оборудование
                        <span className="font-mono text-[0.75rem] text-porcelain/60">{totalSkus}</span>
                      </a>

                      {categoryGroups.map((group) => (
                        <div key={group.title}>
                          <p className="font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-titanium">
                            {group.title}
                          </p>
                          <ul className="mt-2 space-y-1.5">
                            {group.ids.map((id) => {
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
                                    className="flex min-h-[3.5rem] items-center gap-3 rounded-xl border border-graphite/[0.08] bg-mist/60 px-3 py-2.5 active:bg-mist"
                                  >
                                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-porcelain p-1.5">
                                      <img
                                        src={cat.image}
                                        alt=""
                                        loading="lazy"
                                        decoding="async"
                                        className="max-h-full w-auto max-w-full object-contain"
                                      />
                                    </span>
                                    <span className="min-w-0 flex-1">
                                      <span className="block truncate text-[0.9375rem] text-graphite">
                                        {cat.title}
                                      </span>
                                      <span className="mt-0.5 block truncate text-[0.75rem] text-slate">
                                        {countByCategory(id)} позиций
                                      </span>
                                    </span>
                                    <ChevronRight size={16} className="shrink-0 text-titanium" />
                                  </a>
                                </li>
                              )
                            })}
                          </ul>
                        </div>
                      ))}
                    </div>
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
                  className={`border-b border-graphite/[0.06] py-4 text-lg ${
                    item.href === 'contacts' ? 'font-semibold text-ember' : 'text-graphite'
                  }`}
                >
                  {item.label}
                </a>
              ))}

              <a
                href="wholesale"
                onClick={(e) => {
                  e.preventDefault()
                  setOpen(false)
                  requestWholesale()
                }}
                className="border-b border-graphite/[0.06] py-4 text-lg font-semibold text-ember last:border-0"
              >
                Оптовикам
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
