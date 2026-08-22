import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'

import { useReducedMotion } from '../../hooks/useReducedMotion'
import { revealProps, rise, riseProps, stagger } from '../../lib/motion'

const AFTER_SRCSET =
  'media/surface-after-800.webp 800w, media/surface-after-1280.webp 1280w, media/surface-after-1920.webp 1920w'
const BEFORE_SRCSET =
  'media/surface-before-800.webp 800w, media/surface-before-1280.webp 1280w, media/surface-before-1920.webp 1920w'

/** Мягкое затухание пятна. Маска статична — двигается только сам элемент. */
const SPOT_MASK =
  'radial-gradient(circle at center, #000 0%, #000 44%, rgba(0,0,0,0.5) 70%, rgba(0,0,0,0) 100%)'

/**
 * Раскрытие результата обработки.
 *
 * На устройствах с точным указателем круглое окно следует за курсором с
 * интерполяцией в rAF и открывает отполированный лак под слоем с голограммами.
 * Само окно и слой внутри него двигаются встречными translate3d — маска
 * задаётся один раз и в кадре не пересчитывается, иначе браузер каждый кадр
 * заново растрирует слой во весь экран.
 *
 * На тач-устройствах курсора нет, поэтому окно заменяется границей,
 * которую перетаскивают пальцем.
 */
export function ReflectionReveal() {
  const frame = useRef<HTMLDivElement>(null)
  const spot = useRef<HTMLDivElement>(null)
  const inner = useRef<HTMLDivElement>(null)
  const slider = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()
  const [fine, setFine] = useState(true)
  const [touched, setTouched] = useState(false)

  const showSpot = fine && !reduced
  // Без анимаций сцена показывает честную половину кадра и остаётся понятной.
  const showSlider = !fine || reduced

  useEffect(() => {
    const query = window.matchMedia('(hover: hover) and (pointer: fine)')
    const sync = () => setFine(query.matches)
    sync()
    query.addEventListener('change', sync)
    return () => query.removeEventListener('change', sync)
  }, [])

  useEffect(() => {
    const box = frame.current
    const dot = spot.current
    const layer = inner.current
    if (!box || !dot || !layer || !fine || reduced) return

    let size = 0
    let radius = 0
    const target = { x: 0, y: 0 }
    const current = { x: 0, y: 0 }
    let fade = 0
    let fadeTarget = 0
    let raf = 0

    const measure = () => {
      const rect = box.getBoundingClientRect()
      size = Math.round(Math.min(rect.width, rect.height) * 0.62)
      radius = size / 2
      dot.style.width = `${size}px`
      dot.style.height = `${size}px`
      layer.style.width = `${rect.width}px`
      layer.style.height = `${rect.height}px`
      if (!current.x && !current.y) {
        current.x = target.x = rect.width / 2
        current.y = target.y = rect.height / 2
      }
    }

    const onMove = (e: PointerEvent) => {
      const rect = box.getBoundingClientRect()
      target.x = e.clientX - rect.left
      target.y = e.clientY - rect.top
      fadeTarget = 1
      setTouched(true)
    }
    const onLeave = () => {
      fadeTarget = 0
    }

    const tick = () => {
      current.x += (target.x - current.x) * 0.14
      current.y += (target.y - current.y) * 0.14
      fade += (fadeTarget - fade) * 0.09

      // Окно и содержимое смещаются встречно, поэтому картинка внутри
      // остаётся точно совмещённой с нижним слоем.
      dot.style.transform = `translate3d(${current.x - radius}px, ${current.y - radius}px, 0)`
      dot.style.opacity = fade.toFixed(3)
      layer.style.transform = `translate3d(${radius - current.x}px, ${radius - current.y}px, 0)`

      raf = requestAnimationFrame(tick)
    }

    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(box)
    box.addEventListener('pointermove', onMove, { passive: true })
    box.addEventListener('pointerleave', onLeave)
    raf = requestAnimationFrame(tick)

    return () => {
      observer.disconnect()
      box.removeEventListener('pointermove', onMove)
      box.removeEventListener('pointerleave', onLeave)
      cancelAnimationFrame(raf)
    }
  }, [fine, reduced])

  // Тач-режим: граница между «до» и «после» перетаскивается пальцем.
  useEffect(() => {
    const box = frame.current
    const bar = slider.current
    if (!box || !bar || fine) return

    const apply = (ratio: number) => {
      const pct = (ratio * 100).toFixed(2)
      bar.style.clipPath = `inset(0 0 0 ${pct}%)`
      bar.style.setProperty('--handle', `${pct}%`)
    }

    const set = (clientX: number) => {
      const rect = box.getBoundingClientRect()
      apply(Math.min(1, Math.max(0, (clientX - rect.left) / rect.width)))
      setTouched(true)
    }

    const onDown = (e: PointerEvent) => {
      box.setPointerCapture(e.pointerId)
      set(e.clientX)
    }
    const onMove = (e: PointerEvent) => {
      if (box.hasPointerCapture(e.pointerId)) set(e.clientX)
    }

    apply(0.5)
    box.addEventListener('pointerdown', onDown)
    box.addEventListener('pointermove', onMove)
    return () => {
      box.removeEventListener('pointerdown', onDown)
      box.removeEventListener('pointermove', onMove)
    }
  }, [fine])

  return (
    <section id="reflection" className="scene relative overflow-hidden bg-porcelain pb-28 md:pb-36">
      <motion.div
        {...revealProps(reduced, stagger(0, 0.09))}
        className="shell"
      >
        <motion.p variants={rise} className="eyebrow">
          Результат обработки
        </motion.p>
        <div className="mt-6 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <motion.h2 variants={rise} className="h2 max-w-[14ch]">
            Разницу видно в отражении
          </motion.h2>
          <motion.p variants={rise} className="lead max-w-[38ch] text-graphite/60">
            {showSlider
              ? 'Слева — лак с голограммами и мутью. Справа — та же панель после машинной полировки: отражение держит форму и глубину.'
              : 'Вокруг — лак с голограммами и мутью. В окне — та же панель после машинной полировки: отражение держит форму и глубину.'}
          </motion.p>
        </div>
      </motion.div>

      <motion.div
        {...riseProps(reduced, { y: 44, amount: 0.25 })}
        className="shell mt-12"
      >
        <div
          ref={frame}
          className="relative aspect-[16/10] w-full touch-none overflow-hidden rounded-[1.75rem] bg-ink select-none md:aspect-[16/8] md:rounded-[2.5rem]"
        >
          <img
            src="media/surface-before-1920.webp"
            srcSet={BEFORE_SRCSET}
            sizes="(min-width: 1440px) 1280px, 100vw"
            alt="Лакокрасочное покрытие с голограммами до полировки"
            loading="lazy"
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover"
          />

          {showSpot && (
            <div
              ref={spot}
              aria-hidden
              className="pointer-events-none absolute left-0 top-0 overflow-hidden rounded-full opacity-0 will-change-transform"
              style={{ maskImage: SPOT_MASK, WebkitMaskImage: SPOT_MASK }}
            >
              <div ref={inner} className="absolute left-0 top-0 will-change-transform">
                <img
                  src="media/surface-after-1920.webp"
                  srcSet={AFTER_SRCSET}
                  sizes="(min-width: 1440px) 1280px, 100vw"
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
          )}

          {showSlider && (
            <div ref={slider} className="absolute inset-0" style={{ clipPath: 'inset(0 0 0 50%)' }}>
              <img
                src="media/surface-after-1920.webp"
                srcSet={AFTER_SRCSET}
                sizes="100vw"
                alt="То же покрытие после машинной полировки"
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover"
              />
              <span
                aria-hidden
                className="absolute inset-y-0 w-px bg-porcelain/70"
                style={{ left: 'var(--handle, 50%)' }}
              />
            </div>
          )}

          <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-5 md:p-8">
            <span className="font-mono text-[0.625rem] uppercase tracking-[0.22em] text-porcelain/50">
              До обработки
            </span>
            <span
              className={`rounded-full border border-porcelain/25 bg-ink/35 px-4 py-2 text-center font-mono text-[0.625rem] uppercase tracking-[0.2em] text-porcelain/80 backdrop-blur-md transition-opacity duration-700 ease-premium ${
                touched ? 'opacity-0' : 'opacity-100'
              }`}
            >
              {showSlider ? 'Потяните границу' : 'Проведите по поверхности'}
            </span>
            <span className="font-mono text-[0.625rem] uppercase tracking-[0.22em] text-porcelain/80">
              После полировки
            </span>
          </div>
        </div>
      </motion.div>
    </section>
  )
}
