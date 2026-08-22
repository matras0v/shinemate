import type { Transition, Variants } from 'framer-motion'

/** Единственная кривая на весь сайт — та же, что в CSS-переменной --ease. */
export const EASE = [0.16, 1, 0.3, 1] as const

export const smooth: Transition = { duration: 0.9, ease: EASE }

/** Базовое появление блока при входе во вьюпорт. */
export const rise: Variants = {
  hidden: { opacity: 0, y: 36 },
  show: { opacity: 1, y: 0, transition: smooth },
}

/** Контейнер для последовательного появления дочерних элементов. */
export const stagger = (delayChildren = 0, staggerChildren = 0.08): Variants => ({
  hidden: {},
  show: { transition: { delayChildren, staggerChildren } },
})

export const viewportOnce = { once: true, amount: 0.25 } as const

/**
 * Пропсы появления блока при входе во вьюпорт.
 *
 * Когда движение отключено, возвращается пустой объект: блок сразу
 * отрисовывается в конечном состоянии, а не остаётся в стартовом.
 * Иначе анимация — единственный способ показать контент, и при
 * prefers-reduced-motion страница осталась бы пустой.
 */
export function revealProps(reduced: boolean, variants: Variants) {
  if (reduced) return {}
  return {
    initial: 'hidden' as const,
    whileInView: 'show' as const,
    viewport: viewportOnce,
    variants,
  }
}

/** То же самое для точечных inline-анимаций без вариантов. */
export function riseProps(
  reduced: boolean,
  { y = 28, delay = 0, amount = 0.2 }: { y?: number; delay?: number; amount?: number } = {},
) {
  if (reduced) return {}
  return {
    initial: { opacity: 0, y },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount },
    transition: { duration: 0.8, ease: EASE, delay },
  }
}
