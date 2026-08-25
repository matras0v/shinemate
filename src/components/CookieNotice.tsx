import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

import { EASE } from '../lib/motion'

const STORAGE_KEY = 'shinemate:notice-dismissed'

type Props = {
  onOpenPrivacy: () => void
}

/**
 * Уведомление внизу страницы про обработку данных. Сайт не использует
 * cookie-трекеры (см. data/legal.ts), поэтому баннер не спрашивает
 * «согласие на cookie» — это было бы враньём, — а прямо объясняет, что
 * происходит с данными формы, и даёт ссылку на полную политику.
 *
 * Закрытие запоминается в localStorage — единственное, что сайт вообще
 * сохраняет в браузере, и то не идентифицирует пользователя.
 */
export function CookieNotice({ onOpenPrivacy }: Props) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    try {
      if (!window.localStorage.getItem(STORAGE_KEY)) setVisible(true)
    } catch {
      // Приватный режим/заблокированный localStorage — молча не показываем
      // баннер повторно каждую загрузку, но и не роняем страницу.
      setVisible(false)
    }
  }, [])

  const dismiss = () => {
    setVisible(false)
    try {
      window.localStorage.setItem(STORAGE_KEY, '1')
    } catch {
      // ignore
    }
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ duration: 0.4, ease: EASE }}
          className="fixed inset-x-0 bottom-0 z-[60] px-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-6 sm:pb-6"
        >
          <div className="mx-auto flex max-w-2xl flex-col items-start gap-3 rounded-2xl border border-graphite/[0.12] bg-porcelain/95 p-4 shadow-[0_20px_60px_-20px_rgba(26,28,30,0.35)] backdrop-blur-xl sm:flex-row sm:items-center sm:gap-5 sm:p-5">
            <p className="text-[0.8125rem] leading-relaxed text-graphite/70">
              Сайт не использует cookie-трекеры и аналитику. Данные из формы уходят напрямую с
              вашей почты — сайт их не хранит.{' '}
              <button
                type="button"
                onClick={onOpenPrivacy}
                className="underline decoration-graphite/30 underline-offset-2 transition-colors duration-300 ease-premium hover:text-graphite"
              >
                Подробнее
              </button>
            </p>
            <button
              type="button"
              onClick={dismiss}
              className="shrink-0 rounded-full bg-graphite px-5 py-2.5 text-[0.8125rem] text-porcelain transition-colors duration-400 ease-premium hover:bg-ink sm:ml-auto"
            >
              Понятно
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
