import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Download, X } from 'lucide-react'

import { useBodyScrollLock } from '../hooks/useBodyScrollLock'
import { EASE } from '../lib/motion'
import type { LegalDocument } from '../data/legal'

type Props = {
  document: LegalDocument | null
  onClose: () => void
}

/**
 * Модалка для правовых документов (политика конфиденциальности,
 * пользовательское соглашение) — тот же паттерн, что у SearchOverlay,
 * без отдельного маршрута: страница не индексируется поисковиками, зато
 * не тянет за собой роутинг ради двух статических текстов.
 */
export function LegalOverlay({ document, onClose }: Props) {
  useEffect(() => {
    if (!document) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [document, onClose])

  useBodyScrollLock(!!document)

  return (
    <AnimatePresence>
      {document && (
        <motion.div
          className="fixed inset-0 z-[80] flex items-start justify-center px-4 pt-[8vh] sm:pt-[10vh]"
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
            role="dialog"
            aria-modal="true"
            aria-label={document.title}
            initial={{ opacity: 0, y: -16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.98 }}
            transition={{ duration: 0.3, ease: EASE }}
            className="relative flex max-h-[80vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl bg-porcelain shadow-[0_40px_90px_-30px_rgba(26,28,30,0.45)]"
          >
            <div className="flex items-center justify-between gap-4 border-b border-graphite/[0.1] px-6 py-4 sm:px-8">
              <h2 className="text-[1.125rem] tracking-tight">{document.title}</h2>
              <div className="flex shrink-0 items-center gap-1">
                {document.pdfSlug && (
                  <a
                    href={`documents/${document.pdfSlug}.pdf`}
                    download
                    aria-label="Скачать PDF"
                    title="Скачать PDF"
                    className="flex h-8 w-8 items-center justify-center rounded-full text-graphite/40 transition-colors duration-400 ease-premium hover:bg-graphite/10 hover:text-graphite"
                  >
                    <Download size={15} />
                  </a>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Закрыть"
                  className="flex h-8 w-8 items-center justify-center rounded-full text-graphite/40 transition-colors duration-400 ease-premium hover:bg-graphite/10 hover:text-graphite"
                >
                  <X size={15} />
                </button>
              </div>
            </div>

            <div className="overflow-y-auto overscroll-contain px-6 py-6 sm:px-8">
              {document.sections.map((section) => (
                <div key={section.heading} className="mb-6 last:mb-0">
                  <h3 className="text-[0.875rem] font-medium tracking-tight text-graphite">
                    {section.heading}
                  </h3>
                  <div className="mt-2 space-y-2">
                    {section.body.map((paragraph) => (
                      <p
                        key={paragraph}
                        className="text-[0.8125rem] leading-relaxed text-graphite/65"
                      >
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
