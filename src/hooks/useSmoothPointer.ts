import { useEffect, useRef } from 'react'

export type Pointer = { x: number; y: number; active: boolean }

/**
 * Положение указателя внутри элемента, сглаженное интерполяцией в rAF.
 * Значение отдаётся через ref, чтобы не перерисовывать React на каждый кадр.
 */
export function useSmoothPointer<T extends HTMLElement>(ease = 0.12) {
  const ref = useRef<T | null>(null)
  const pointer = useRef<Pointer>({ x: 0.5, y: 0.5, active: false })
  const target = useRef({ x: 0.5, y: 0.5 })
  const frame = useRef(0)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const set = (clientX: number, clientY: number) => {
      const box = el.getBoundingClientRect()
      target.current = {
        x: (clientX - box.left) / box.width,
        y: (clientY - box.top) / box.height,
      }
    }

    const onPointerMove = (e: PointerEvent) => {
      pointer.current.active = true
      set(e.clientX, e.clientY)
    }
    const onPointerLeave = () => {
      pointer.current.active = false
      target.current = { x: 0.5, y: 0.5 }
    }

    const tick = () => {
      pointer.current.x += (target.current.x - pointer.current.x) * ease
      pointer.current.y += (target.current.y - pointer.current.y) * ease
      frame.current = requestAnimationFrame(tick)
    }

    el.addEventListener('pointermove', onPointerMove, { passive: true })
    el.addEventListener('pointerdown', onPointerMove, { passive: true })
    el.addEventListener('pointerleave', onPointerLeave)
    frame.current = requestAnimationFrame(tick)

    return () => {
      el.removeEventListener('pointermove', onPointerMove)
      el.removeEventListener('pointerdown', onPointerMove)
      el.removeEventListener('pointerleave', onPointerLeave)
      cancelAnimationFrame(frame.current)
    }
  }, [ease])

  return { ref, pointer }
}
