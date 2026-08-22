import { useRef, type ReactNode } from 'react'
import { motion, useMotionValue, useSpring } from 'framer-motion'

import { useReducedMotion } from '../../hooks/useReducedMotion'

type Props = {
  children: ReactNode
  href: string
  variant?: 'solid' | 'ghost'
  className?: string
}

/**
 * Кнопка с очень слабым магнитным откликом: смещение ограничено 6 px,
 * чтобы движение читалось как качество отклика, а не как трюк.
 */
export function MagneticButton({ children, href, variant = 'solid', className = '' }: Props) {
  const ref = useRef<HTMLAnchorElement>(null)
  const reduced = useReducedMotion()
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const sx = useSpring(x, { stiffness: 220, damping: 22, mass: 0.4 })
  const sy = useSpring(y, { stiffness: 220, damping: 22, mass: 0.4 })

  const onMove = (e: React.PointerEvent<HTMLAnchorElement>) => {
    if (reduced || !ref.current) return
    const box = ref.current.getBoundingClientRect()
    x.set(((e.clientX - box.left) / box.width - 0.5) * 12)
    y.set(((e.clientY - box.top) / box.height - 0.5) * 12)
  }

  const reset = () => {
    x.set(0)
    y.set(0)
  }

  const base =
    'group relative inline-flex items-center justify-center gap-2.5 rounded-full px-7 py-3.5 text-sm tracking-tight transition-colors duration-500 ease-premium'
  const skin =
    variant === 'solid'
      ? 'bg-graphite text-porcelain hover:bg-ink'
      : 'border border-graphite/20 text-graphite hover:border-graphite/50 hover:bg-graphite/[0.04]'

  return (
    <motion.a
      ref={ref}
      href={href}
      style={{ x: sx, y: sy }}
      onPointerMove={onMove}
      onPointerLeave={reset}
      className={`${base} ${skin} ${className}`}
    >
      {children}
    </motion.a>
  )
}
