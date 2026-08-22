import { motion, useScroll, useSpring } from 'framer-motion'

/** Тонкая линия прогресса чтения поверх страницы. */
export function ScrollProgress() {
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, { stiffness: 140, damping: 30, restDelta: 0.001 })

  return (
    <motion.div
      aria-hidden
      style={{ scaleX }}
      className="fixed inset-x-0 top-0 z-[60] h-px origin-left bg-graphite/70"
    />
  )
}
