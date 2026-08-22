import { motion } from 'framer-motion'

import { useReducedMotion } from '../../hooks/useReducedMotion'
import { EASE } from '../../lib/motion'

type Props = {
  text: string
  className?: string
  delay?: number
  /** Задержка между словами. */
  step?: number
}

/**
 * Пословное появление с маской: слова выезжают из-под линии отсечения.
 * Разбиение идёт по словам, а не по буквам — на длинных русских заголовках
 * посимвольный стаггер выглядит суетливо и мешает читать.
 */
export function StaggerText({ text, className, delay = 0, step = 0.075 }: Props) {
  const reduced = useReducedMotion()
  const words = text.split(' ')

  // При отключённом движении текст просто есть — без выезда из-под маски.
  if (reduced) return <span className={className}>{text}</span>

  return (
    <span className={className}>
      {words.map((word, i) => (
        <span key={`${word}-${i}`} className="inline-block overflow-hidden align-bottom pb-[0.08em]">
          <motion.span
            className="inline-block"
            initial={{ y: '110%' }}
            animate={{ y: 0 }}
            transition={{ duration: 1.1, ease: EASE, delay: delay + i * step }}
          >
            {word}
            {i < words.length - 1 ? ' ' : ''}
          </motion.span>
        </span>
      ))}
    </span>
  )
}
