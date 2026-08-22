import { useLayoutEffect } from 'react'

let lockCount = 0

/**
 * Блокирует прокрутку body, пока `active` — с учётом счётчика, чтобы
 * несколько одновременно открытых оверлеев не сбивали друг друга при
 * закрытии в произвольном порядке.
 *
 * useLayoutEffect, а не useEffect: снятие блокировки обязано произойти
 * синхронно в фазе коммита, до следующего кадра. Иначе сценарий «закрыть
 * модалку и в той же секунде перейти на другой маршрут со скроллом к
 * якорю» ловит гонку — requestAnimationFrame после навигации срабатывает
 * раньше отложенного useEffect-сброса, body всё ещё overflow:hidden,
 * и scrollIntoView молча ничего не делает.
 */
export function useBodyScrollLock(active: boolean) {
  useLayoutEffect(() => {
    if (!active) return
    lockCount++
    document.body.style.overflow = 'hidden'
    return () => {
      lockCount = Math.max(0, lockCount - 1)
      if (lockCount === 0) document.body.style.overflow = ''
    }
  }, [active])
}
