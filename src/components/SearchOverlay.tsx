import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Search, X } from 'lucide-react'

import { formatPriceOrInquire, minPrice, searchProducts, type Product } from '../data/catalog'
import { useBodyScrollLock } from '../hooks/useBodyScrollLock'
import { EASE } from '../lib/motion'
import { navigateTo, productHref } from '../lib/router'

type Props = {
  open: boolean
  onClose: () => void
}

/**
 * Поиск по каталогу: модель, артикул, тип, раздел.
 *
 * 81 SKU — это объём, на котором полноценный поисковый бэкенд избыточен;
 * substring-индекс из data/catalog.ts даёт мгновенный результат прямо в
 * браузере. Открывается по клику на иконку в шапке или по Cmd/Ctrl+K.
 */
export function SearchOverlay({ open, onClose }: Props) {
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const results = searchProducts(query)

  useEffect(() => {
    if (open) {
      setQuery('')
      // Модалка ещё не отрисована в момент открытия — ждём кадр.
      requestAnimationFrame(() => inputRef.current?.focus())
    }
  }, [open])

  // Открытие по Cmd/Ctrl+K живёт на уровне App (нужен доступ к состоянию,
  // когда оверлей ещё не смонтирован); здесь — только закрытие по Escape.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  useBodyScrollLock(open)

  const openResult = (product: Product) => {
    navigateTo(`/${productHref(product)}`)
    onClose()
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[80] flex items-start justify-center px-4 pt-[12vh] sm:pt-[16vh]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25, ease: EASE }}
        >
          <button
            type="button"
            aria-label="Закрыть поиск"
            onClick={onClose}
            className="absolute inset-0 cursor-default bg-ink/30 backdrop-blur-[2px]"
          />

          <motion.div
            initial={{ opacity: 0, y: -16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.98 }}
            transition={{ duration: 0.3, ease: EASE }}
            className="relative w-full max-w-xl overflow-hidden rounded-2xl bg-porcelain shadow-[0_40px_90px_-30px_rgba(26,28,30,0.45)]"
          >
            <div className="flex items-center gap-3 border-b border-graphite/[0.1] px-5 py-4">
              <Search size={18} className="shrink-0 text-titanium" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Модель, артикул или тип оборудования"
                aria-label="Поиск по каталогу"
                className="min-w-0 flex-1 bg-transparent text-[1rem] text-graphite outline-none placeholder:text-smoke"
              />
              <button
                type="button"
                onClick={onClose}
                aria-label="Закрыть"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-titanium transition-colors duration-400 ease-premium hover:bg-graphite/10 hover:text-graphite"
              >
                <X size={15} />
              </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto overscroll-contain">
              {query.trim() === '' ? (
                <p className="px-5 py-8 text-center text-[0.875rem] text-titanium">
                  Например: EP830, EB202A, B1825A, «подложка», «круг», V80
                </p>
              ) : results.length === 0 ? (
                <p className="px-5 py-8 text-center text-[0.875rem] text-titanium">
                  По запросу «{query}» ничего не найдено. Полный ассортимент — в разделе «Каталог».
                </p>
              ) : (
                <ul>
                  {results.map((product) => {
                    const price = minPrice(product)
                    return (
                      <li key={product.slug}>
                        <button
                          type="button"
                          onClick={() => openResult(product)}
                          className="flex w-full items-center gap-4 px-5 py-3 text-left transition-colors duration-300 ease-premium hover:bg-mist"
                        >
                          <img
                            src={product.image.replace('.webp', '-thumb.webp')}
                            alt=""
                            width={56}
                            height={56}
                            className="h-11 w-11 shrink-0 object-contain"
                          />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[0.9375rem] tracking-tight">
                              {product.model}
                            </span>
                            <span className="block truncate text-[0.75rem] text-titanium">
                              {product.kind}
                            </span>
                          </span>
                          <span className="shrink-0 text-[0.8125rem] text-slate">
                            {formatPriceOrInquire(price)}
                          </span>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
