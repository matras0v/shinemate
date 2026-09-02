import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useScroll, useTransform } from 'framer-motion'
import { ArrowDown, ChevronLeft, ChevronRight } from 'lucide-react'

import { useClearCoat } from '../../hooks/useClearCoat'
import { useReducedMotion } from '../../hooks/useReducedMotion'
import { useSmoothPointer } from '../../hooks/useSmoothPointer'
import { EASE } from '../../lib/motion'
import { MagneticButton } from '../ui/MagneticButton'
import { StaggerText } from '../ui/StaggerText'

/**
 * Слайды карусели — один и тот же товарный ряд ShineMate, показанный с
 * разных ракурсов (общий лайнап / DA-машинка / круги / пасты V-Range).
 * CTA у всех слайдов одинаковые: сайт продаёт весь каталог, а не что-то
 * одно, поэтому разводить кнопки по слайдам было бы нечестным акцентом.
 */
type Slide = {
  slug: string
  alt: string
  lines: [string, string, string]
  /** Индексы строк заголовка (0-based), которые красятся приглушённым тоном. */
  dim: number[]
  lead: string
}

const SLIDES: Slide[] = [
  {
    slug: 'hero',
    alt: 'Линейка оборудования ShineMate: роторная и эксцентриковые машинки, полировальный круг и состав V-Range',
    lines: ['Технология', 'безупречного', 'результата'],
    dim: [1],
    lead: 'Профессиональное оборудование для точной, быстрой и контролируемой работы с лакокрасочным покрытием.',
  },
  {
    slug: 'hero-da',
    alt: 'Эксцентриковая машинка ShineMate EX620',
    lines: ['Точность', 'в каждом', 'движении'],
    dim: [1],
    lead: 'Эксцентриковые машинки ShineMate — контролируемая полировка без риска пережога покрытия.',
  },
  {
    slug: 'hero-pads',
    alt: 'Полировальные круги ShineMate Black Diamond разной жёсткости',
    lines: ['Круги', 'под', 'любую задачу'],
    dim: [2],
    lead: 'От грубой абразивной обработки до финального глянца — подложка и круг на каждый этап полировки.',
  },
  {
    slug: 'hero-chemistry',
    alt: 'Полировальные пасты ShineMate V-Range',
    lines: ['Пасты', 'V-Range', 'для результата'],
    dim: [1],
    lead: 'Полировальные пасты V-Range — предсказуемый результат на любом типе лакокрасочного покрытия.',
  },
]

const AUTOPLAY_MS = 6000

export function Hero() {
  const section = useRef<HTMLElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const reduced = useReducedMotion()
  const { ref: pointerRef, pointer } = useSmoothPointer<HTMLDivElement>(0.08)

  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const slide = SLIDES[index]

  /*
   * Заголовок первого слайда "выезжает" из-под маски пословно (см.
   * StaggerText) — это красиво один раз при заходе на сайт, но при
   * автопрокрутке та же анимация повторялась на КАЖДОЙ смене слайда: пока
   * старый текст гас (0.5с) и новый только начинал выезжать (ещё ~1.2с),
   * заголовок почти секунду-полторы выглядел пустым/обрезанным — это и
   * поймал Андрей на скрине. После первого захода смена слайдов — простой
   * быстрый кроссфейд без пословной анимации.
   */
  const [introDone, setIntroDone] = useState(false)
  useEffect(() => {
    const t = window.setTimeout(() => setIntroDone(true), 1600)
    return () => window.clearTimeout(t)
  }, [])
  const showIntroReveal = !introDone && index === 0 && !reduced

  useClearCoat(canvas, { pointer, intensity: 0.9, enabled: !reduced })

  useEffect(() => {
    if (reduced || paused) return
    const id = window.setInterval(() => {
      // Вкладка, свёрнутая в фон, не выполняет rAF — таймер продолжает
      // тикать, а CSS-переход нет. Без этой проверки за время в фоне могло
      // накопиться несколько смен слайда разом, и по возвращении на вкладку
      // фото и текст оказывались от разных слайдов (десинхрон).
      if (document.hidden) return
      setIndex((i) => (i + 1) % SLIDES.length)
    }, AUTOPLAY_MS)
    return () => window.clearInterval(id)
  }, [reduced, paused])

  const go = (delta: number) => {
    setIndex((i) => (i + delta + SLIDES.length) % SLIDES.length)
  }

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
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
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
          <AnimatePresence initial={false}>
            <motion.img
              key={slide.slug}
              src={`media/${slide.slug}-1920.webp`}
              srcSet={`media/${slide.slug}-800.webp 800w, media/${slide.slug}-1280.webp 1280w, media/${slide.slug}-1920.webp 1920w`}
              sizes="(min-width: 1024px) 56vw, 100vw"
              alt={slide.alt}
              decoding="async"
              initial={reduced ? undefined : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={reduced ? undefined : { opacity: 0 }}
              transition={{ duration: 0.5, ease: EASE }}
              className="absolute inset-0 h-full w-full object-cover object-center"
              style={{ backgroundImage: `url(media/${slide.slug}-poster.webp)`, backgroundSize: 'cover' }}
            />
          </AnimatePresence>

          {/* Навигация карусели: единая "таблетка" со стрелками и счётчиком.
              Лежит внутри контейнера фото (не всей секции) — раньше она была
              привязана к левому краю всей секции и на lg заезжала прямо на
              текстовую колонку и CTA-кнопки под ней. Внутри контейнера фото
              она всегда остаётся над снимком, где бы текст ни заканчивался. */}
          <div className="absolute bottom-5 left-5 z-20 flex items-center gap-1 rounded-full bg-porcelain p-1 shadow-[0_4px_16px_rgba(26,28,30,0.14)] lg:bottom-8 lg:left-8">
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label="Предыдущий слайд"
              className="flex h-7 w-7 items-center justify-center rounded-full text-graphite transition-colors duration-400 ease-premium hover:bg-ink hover:text-porcelain"
            >
              <ChevronLeft size={15} />
            </button>
            <span className="px-1.5 font-mono text-[0.6875rem] tabular-nums tracking-[0.1em] text-graphite">
              {String(index + 1).padStart(2, '0')} / {String(SLIDES.length).padStart(2, '0')}
            </span>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label="Следующий слайд"
              className="flex h-7 w-7 items-center justify-center rounded-full text-graphite transition-colors duration-400 ease-premium hover:bg-ink hover:text-porcelain"
            >
              <ChevronRight size={15} />
            </button>
          </div>
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
          // Клиент отметил на видео: этот бейдж терялся, особенно на
          // телефоне — крупнее, жирнее, с фирменным акцентом ShineMate,
          // а не приглушённым titanium, как обычные эйбрау секций. Текст
          // стал длиннее ("Официальный дистрибьютор" вместо
          // "Представительство") — whitespace-nowrap на узких экранах
          // выталкивал его за пределы контейнера и он просто не был виден;
          // на телефоне даём перенос на 2 строки, от sm возвращаем nowrap.
          className="max-w-[26ch] font-mono text-[0.8125rem] font-semibold uppercase leading-snug tracking-[0.08em] text-ember sm:max-w-none sm:whitespace-nowrap sm:text-[0.875rem] sm:tracking-[0.16em]"
        >
          ShineMate · Официальный дистрибьютор в России
        </motion.p>

        <h1 className="h1 mt-5 grid max-w-[13ch] font-semibold lg:mt-6">
          {/*
            Раньше слайды при смене крестфейдили оба в потоке — старый и
            новый текст просто накладывались друг на друга в разметке
            (толкали высоту), а не визуально поверх друг друга. Grid с общей
            ячейкой (все элементы на col/row-start:1) держит их в одном
            месте: у кого выше opacity, тот и виден, высота блока не прыгает.
          */}
          <AnimatePresence initial={false}>
            <motion.span
              key={slide.slug}
              className="col-start-1 row-start-1 block"
              initial={reduced ? undefined : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={reduced ? undefined : { opacity: 0 }}
              transition={{ duration: 0.4, ease: EASE }}
            >
              {showIntroReveal ? (
                <>
                  <StaggerText text={slide.lines[0]} delay={0.3} />
                  <br />
                  <StaggerText
                    text={slide.lines[1]}
                    delay={0.4}
                    className={slide.dim.includes(1) ? 'text-graphite/45' : undefined}
                  />
                  <br />
                  <StaggerText
                    text={slide.lines[2]}
                    delay={0.5}
                    className={slide.dim.includes(2) ? 'text-graphite/45' : undefined}
                  />
                </>
              ) : (
                <>
                  {slide.lines[0]}
                  <br />
                  <span className={slide.dim.includes(1) ? 'text-graphite/45' : undefined}>
                    {slide.lines[1]}
                  </span>
                  <br />
                  <span className={slide.dim.includes(2) ? 'text-graphite/45' : undefined}>
                    {slide.lines[2]}
                  </span>
                </>
              )}
            </motion.span>
          </AnimatePresence>
        </h1>

        <div className="lead mt-6 grid max-w-[42ch] text-graphite/65 lg:mt-8">
          <AnimatePresence initial={false}>
            <motion.p
              key={slide.slug}
              className="col-start-1 row-start-1"
              initial={reduced ? undefined : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={reduced ? undefined : { opacity: 0 }}
              transition={{ duration: 0.4, ease: EASE, delay: showIntroReveal ? 0.85 : 0 }}
            >
              {slide.lead}
            </motion.p>
          </AnimatePresence>
        </div>

        <motion.div
          {...enter(1)}
          className="mt-7 flex flex-wrap items-center gap-3 lg:mt-10"
        >
          <MagneticButton href="catalog">Смотреть оборудование</MagneticButton>
          <MagneticButton href="#contacts" variant="ghost">
            Запросить прайс
          </MagneticButton>
        </motion.div>

        {/*
          Клиент отметил: на первом кадре видны только машины, а систему
          "машина + круг + паста" видно, только если дождаться автопрокрутки
          карусели до 2-го/4-го слайда. Строка ниже даёт это с одного
          взгляда, не трогая саму фотографию (официальный пресс-снимок
          ShineMate — компоновка внутри него не наша, редактировать её
          рискованно и уже приводило к жалобам на "самодельный" вид фото).
        */}
        <motion.div
          {...enter(1.15)}
          className="mt-8 flex items-center gap-5 border-t border-graphite/10 pt-6 lg:mt-10"
        >
          {[
            { src: 'catalog-media/ex620-thumb.webp', label: 'Машины' },
            { src: 'catalog-media/foam-diamond-t80-thumb.webp', label: 'Круги' },
            { src: 'catalog-media/v40-thumb.webp', label: 'Пасты' },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-2">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-mist">
                <img src={item.src} alt="" className="h-6 w-6 object-contain" />
              </div>
              <span className="text-[0.75rem] text-graphite/55">{item.label}</span>
            </div>
          ))}
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
