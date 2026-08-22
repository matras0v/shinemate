import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { ArrowDown } from 'lucide-react'

import { useClearCoat } from '../../hooks/useClearCoat'
import { useReducedMotion } from '../../hooks/useReducedMotion'
import { useSmoothPointer } from '../../hooks/useSmoothPointer'
import { EASE } from '../../lib/motion'
import { MagneticButton } from '../ui/MagneticButton'
import { StaggerText } from '../ui/StaggerText'

export function Hero() {
  const section = useRef<HTMLElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const reduced = useReducedMotion()
  const { ref: pointerRef, pointer } = useSmoothPointer<HTMLDivElement>(0.08)

  useClearCoat(canvas, { pointer, intensity: 0.9, enabled: !reduced })

  /** Стартовое состояние блока hero: при отключённом движении его нет. */
  const enter = (delay: number) =>
    reduced
      ? {}
      : {
          initial: { opacity: 0, y: 18 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 1, ease: EASE, delay },
        }

  const { scrollYProgress } = useScroll({ target: section, offset: ['start start', 'end start'] })
  // Кадр уходит вглубь медленнее текста — из этого рождается ощущение объёма.
  const mediaY = useTransform(scrollYProgress, [0, 1], ['0%', '14%'])
  const mediaScale = useTransform(scrollYProgress, [0, 1], [1, 1.08])
  const copyY = useTransform(scrollYProgress, [0, 1], ['0%', '38%'])
  const copyOpacity = useTransform(scrollYProgress, [0, 0.65], [1, 0])

  return (
    <section
      id="top"
      ref={section}
      className="scene grain relative h-[100dvh] min-h-[40rem] w-full overflow-hidden bg-porcelain"
    >
      {/*
        Узкие экраны: кадр сверху, текст под ним на чистом фоне — иначе
        портретный кроп 16:9 превращает машину в нечитаемое макро.
        От lg кадр занимает правую часть сцены, текст лежит слева.
      */}
      <div
        ref={pointerRef}
        className="absolute inset-x-0 top-0 h-[46dvh] lg:inset-0 lg:h-auto"
      >
        <motion.div
          style={reduced ? undefined : { y: mediaY, scale: mediaScale }}
          className="absolute inset-0 origin-center lg:left-auto lg:w-[56%]"
        >
          <img
            src="media/hero-1920.webp"
            srcSet="media/hero-800.webp 800w, media/hero-1280.webp 1280w, media/hero-1920.webp 1920w"
            sizes="(min-width: 1024px) 56vw, 100vw"
            alt="Полировальная машина ShineMate на лаковой поверхности кузова в детейлинг-студии"
            decoding="async"
            className="h-full w-full object-cover object-[58%_center] lg:object-[72%_center]"
            style={{ backgroundImage: 'url(media/hero-poster.webp)', backgroundSize: 'cover' }}
          />
        </motion.div>

        {/* Слой живого света поверх кадра. */}
        {!reduced && (
          <canvas
            ref={canvas}
            aria-hidden
            className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.42] mix-blend-screen"
          />
        )}

        {/* Растворение кадра в фоне страницы: вниз на мобильном, влево на десктопе. */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-porcelain via-porcelain/70 to-transparent lg:hidden" />
        <div className="pointer-events-none absolute inset-0 hidden lg:block lg:bg-[linear-gradient(96deg,#F7F6F2_0%,#F7F6F2_38%,rgba(247,246,242,0.72)_47%,rgba(247,246,242,0.22)_55%,rgba(247,246,242,0)_64%)]" />
      </div>

      <motion.div
        style={reduced ? undefined : { y: copyY, opacity: copyOpacity }}
        /*
         * До lg текст был просто "inset-x-0" на всю ширину секции, а от
         * наплыва на картинку его удерживал только max-w у самого h1 (в ch).
         * На part десктопных ширин заголовок при увеличенном clamp()-размере
         * шрифта оказывался шире своего "отведённого" отступа от картинки
         * (правый край текста реально заезжал под кадр — не на скриншоте
         * дефект, а в самой геометрии). Явная ширина колонки в 44% (кадр
         * занимает 56%) закрывает это на уровне контейнера, а не отдельных
         * элементов — и уже не зависит от языка, длины слов или брейкпоинта.
         */
        className="shell absolute inset-x-0 bottom-0 top-[46dvh] z-20 flex flex-col justify-center pb-[max(1.5rem,env(safe-area-inset-bottom))] lg:inset-x-auto lg:left-0 lg:top-0 lg:w-[44%] lg:justify-end lg:pb-14"
      >
        <motion.p
          {...enter(0.15)}
          className="eyebrow whitespace-nowrap tracking-[0.14em] sm:tracking-[0.24em]"
        >
          ShineMate · Представительство в России
        </motion.p>

        <h1 className="h1 mt-5 max-w-[13ch] font-medium lg:mt-6">
          <StaggerText text="Технология" delay={0.3} />
          <br />
          <StaggerText text="безупречного" delay={0.4} className="text-graphite/45" />
          <br />
          <StaggerText text="отражения" delay={0.5} />
        </h1>

        <motion.p {...enter(0.85)} className="lead mt-6 max-w-[42ch] text-graphite/65 lg:mt-8">
          Профессиональное оборудование для точной, быстрой и контролируемой работы
          с лакокрасочным покрытием.
        </motion.p>

        <motion.div
          {...enter(1)}
          className="mt-7 flex flex-wrap items-center gap-3 lg:mt-10"
        >
          <MagneticButton href="#equipment">Смотреть оборудование</MagneticButton>
          <MagneticButton href="#contacts" variant="ghost">
            Запросить прайс
          </MagneticButton>
        </motion.div>
      </motion.div>

      <motion.a
        href="#about"
        {...enter(1.4)}
        className="absolute bottom-8 right-[var(--shell)] z-20 hidden h-12 w-12 items-center justify-center rounded-full border border-graphite/15 text-graphite/60 transition-colors duration-500 ease-premium hover:border-graphite/40 hover:text-graphite lg:flex"
        aria-label="К следующей секции"
      >
        <ArrowDown size={16} />
      </motion.a>
    </section>
  )
}
