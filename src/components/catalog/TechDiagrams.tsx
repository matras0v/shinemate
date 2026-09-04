import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { motion, useInView, useMotionValueEvent, useScroll, useTransform } from 'framer-motion'

import { DESKTOP_SCENE_QUERY, useMediaQuery } from '../../hooks/useMediaQuery'
import { useReducedMotion } from '../../hooks/useReducedMotion'

/**
 * Технические схемы страницы товара.
 *
 * ГЛАВНОЕ ПРАВИЛО ЭТОГО ФАЙЛА: здесь нет ни одной выдуманной детали
 * конструкции. Официальных разрезов, CAD-моделей и фотографий редуктора
 * у ShineMate в открытом доступе нет, поэтому мы НЕ рисуем «внутреннее
 * устройство EP830». Мы рисуем ПРИНЦИП: как движется рабочая
 * поверхность, какой диапазон оборотов у модели, как собирается стек
 * «машинка → подложка → круг», куда идёт энергия у аккумуляторной серии.
 * Все числа приходят из прайса (catalog.ts), формы — геометрия, а не
 * псевдо-инженерия.
 *
 * Схемы сделаны на SVG, а не растром: они остаются резкими на любом
 * экране, весят десятки байт и не требуют генерации изображений.
 */

const EMBER = '#FE8B0C'

/**
 * Схемы принципа работы живут на тёмной полосе — это «технологический»
 * акцент длинной страницы. Палитра берётся отсюда, чтобы светлый и
 * тёмный варианты не расходились по тону.
 */
const T = (dark?: boolean) => ({
  ink: dark ? '#F7F6F2' : '#1A1C1E',
  faint: dark ? 0.42 : 0.6,
  disc: dark ? '#3A4145' : '#C6D2D5',
  discTop: dark ? '#4C555A' : '#E7EDEE',
  stroke: dark ? 0.5 : 0.35,
  grid: dark ? 'text-porcelain/[0.09]' : 'text-graphite/[0.16]',
})

/** Тонкая техническая сетка под схемой — как на чертёжной подложке. */
function Grid({ id, step = 28 }: { id: string; step?: number }) {
  return (
    <defs>
      <pattern id={id} width={step} height={step} patternUnits="userSpaceOnUse">
        <path d={`M ${step} 0 L 0 0 0 ${step}`} fill="none" stroke="currentColor" strokeWidth="1" />
      </pattern>
    </defs>
  )
}

/* ───────────────────────── Роторный привод ───────────────────────── */

/**
 * Прямой привод: ось вращения совпадает с осью круга, пятно контакта
 * работает постоянно. Показываем именно это — без корпуса, редуктора и
 * прочего, чего мы не знаем.
 */
export function RotaryPrinciple({ rpm, dark }: { rpm?: string; dark?: boolean }) {
  const reduced = useReducedMotion()
  const t = T(dark)
  return (
    <svg
      viewBox="0 0 520 420"
      role="img"
      aria-label="Схема работы роторного привода: круг вращается вокруг одной оси"
      className={`h-full w-full ${t.grid}`}
    >
      <Grid id="rot-grid" />
      <rect width="520" height="420" fill="url(#rot-grid)" />

      {/* Ось вращения */}
      <line x1="260" y1="28" x2="260" y2="268" stroke={t.ink} strokeWidth="2" strokeDasharray="7 7" opacity="0.5" />
      <circle cx="260" cy="28" r="4.5" fill={t.ink} opacity="0.65" />
      <text x="276" y="34" fontSize="13" fill={t.ink} fillOpacity={t.faint} fontFamily="ui-monospace, monospace">
        ОСЬ
      </text>

      {/* Шпиндель */}
      <rect x="246" y="150" width="28" height="76" rx="7" fill={t.ink} opacity="0.88" />
      <rect x="238" y="218" width="44" height="14" rx="5" fill={t.ink} opacity="0.7" />

      {/* Подложка и круг: плотные объёмы, а не бледные контуры */}
      <ellipse cx="260" cy="268" rx="150" ry="44" fill={t.ink} opacity="0.14" />
      <ellipse cx="260" cy="252" rx="150" ry="44" fill={t.disc} />
      <ellipse cx="260" cy="252" rx="150" ry="44" fill="none" stroke={t.ink} strokeOpacity={t.stroke} strokeWidth="2" />
      <ellipse cx="260" cy="244" rx="150" ry="44" fill={t.discTop} />
      <ellipse cx="260" cy="244" rx="150" ry="44" fill="none" stroke={t.ink} strokeOpacity={t.stroke} strokeWidth="1.6" />
      <ellipse cx="260" cy="244" rx="92" ry="27" fill="none" stroke={t.ink} strokeOpacity={dark ? 0.25 : 0.18} strokeWidth="1.4" />

      {/* Направление вращения */}
      <ellipse
        cx="260"
        cy="244"
        rx="120"
        ry="35"
        fill="none"
        stroke={EMBER}
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray="46 24"
        className={reduced ? undefined : 'sm-dash'}
      />
      <path d="M 386 234 L 370 246 L 388 256 Z" fill={EMBER} />

      {/* Пятно контакта */}
      <ellipse cx="132" cy="262" rx="46" ry="15" fill={EMBER} opacity="0.22" />
      <ellipse cx="132" cy="262" rx="46" ry="15" fill="none" stroke={EMBER} strokeWidth="2" strokeDasharray="5 5" />
      <line x1="132" y1="277" x2="132" y2="342" stroke={t.ink} strokeOpacity={t.stroke} strokeWidth="1.2" />
      <text x="132" y="364" textAnchor="middle" fontSize="13" fill={t.ink} fillOpacity={t.faint} fontFamily="ui-monospace, monospace">
        ПЯТНО КОНТАКТА
      </text>
      <text x="132" y="384" textAnchor="middle" fontSize="12" fill={t.ink} fillOpacity={dark ? 0.32 : 0.45} fontFamily="ui-monospace, monospace">
        РАБОТАЕТ ПОСТОЯННО
      </text>

      {rpm && (
        <>
          <text x="504" y="368" textAnchor="end" fontSize="13" fill={t.ink} fillOpacity={dark ? 0.36 : 0.5} fontFamily="ui-monospace, monospace">
            ДИАПАЗОН
          </text>
          <text x="504" y="392" textAnchor="end" fontSize="17" fill={t.ink} fillOpacity={dark ? 0.95 : 0.9} fontFamily="ui-monospace, monospace">
            {rpm}
          </text>
        </>
      )}
    </svg>
  )
}

/* ───────────────────────── Эксцентрик (DA) ───────────────────────── */

/**
 * Орбита: круг одновременно вращается и ходит по окружности заданного
 * диаметра. Диаметр орбиты в подписи — реальный ход эксцентрика из
 * прайса, а не декоративное число.
 */
export function OrbitPrinciple({ orbit, dark }: { orbit?: string; dark?: boolean }) {
  const reduced = useReducedMotion()
  const t = T(dark)
  const cx = 260
  const cy = 196
  const orb = 48 // радиус орбиты на схеме
  const pad = 92 // радиус круга на схеме
  return (
    <svg
      viewBox="0 0 520 420"
      role="img"
      aria-label="Схема работы эксцентрика: круг вращается и одновременно ходит по орбите"
      className={`h-full w-full ${t.grid}`}
    >
      <Grid id="orb-grid" />
      <rect width="520" height="420" fill="url(#orb-grid)" />

      {/* Крайние положения круга — орбита читается даже на статичном кадре */}
      <circle cx={cx - orb} cy={cy} r={pad} fill="none" stroke={t.ink} strokeOpacity={dark ? 0.16 : 0.13} strokeWidth="1.4" strokeDasharray="4 5" />
      <circle cx={cx + orb} cy={cy} r={pad} fill="none" stroke={t.ink} strokeOpacity={dark ? 0.16 : 0.13} strokeWidth="1.4" strokeDasharray="4 5" />

      {/* Траектория центра круга */}
      <circle cx={cx} cy={cy} r={orb} fill="none" stroke={EMBER} strokeOpacity="0.55" strokeWidth="1.6" strokeDasharray="5 6" />
      <circle cx={cx} cy={cy} r="3.5" fill={t.ink} opacity="0.55" />

      {/*
        Круг делает ДВЕ независимые вещи одновременно, и это должно
        читаться как два разных движения, а не одно: внешняя группа несёт
        диск по орбите вокруг (cx, cy) за 6с, а сам диск внутри неё
        вращается вокруг собственной оси заметно быстрее (1.6с) — на
        схеме это видно по спице-индикатору, которая крутится «сама по
        себе», пока весь узел одновременно едет по кругу. Раньше диск был
        жёстко привязан к орбите (одна и та же угловая скорость), и на
        статичном взгляде схема читалась как один эксцентричный обод, а
        не как «вращение + орбита».
      */}
      {/* transformOrigin инлайном: Tailwind не генерирует классы из
          вычисляемых строк, а центр орбиты здесь параметрический. */}
      <g
        className={reduced ? undefined : 'animate-[spin_6s_linear_infinite]'}
        style={{ transformOrigin: `${cx}px ${cy}px` }}
      >
        <g transform={`translate(${-orb},0)`}>
          <g
            className={reduced ? undefined : 'animate-[spin_1.6s_linear_infinite]'}
            style={{ transformOrigin: `${cx}px ${cy}px` }}
          >
            <circle cx={cx} cy={cy} r={pad} fill={t.disc} />
            <circle cx={cx} cy={cy} r={pad} fill="none" stroke={t.ink} strokeOpacity={t.stroke} strokeWidth="1.8" />
            <circle cx={cx} cy={cy} r={pad * 0.62} fill={t.discTop} />
            <circle cx={cx} cy={cy} r={pad * 0.62} fill="none" stroke={t.ink} strokeOpacity={dark ? 0.28 : 0.16} strokeWidth="1.3" />
            <circle cx={cx} cy={cy} r="8" fill={EMBER} />
            <line x1={cx} y1={cy} x2={cx} y2={cy - pad + 8} stroke={EMBER} strokeWidth="3.5" strokeLinecap="round" />
          </g>
        </g>
      </g>

      {/* Размерная линия орбиты */}
      <g stroke={t.ink} strokeOpacity={dark ? 0.4 : 0.45} strokeWidth="1.2">
        <line x1={cx - orb} y1="330" x2={cx + orb} y2="330" />
        <line x1={cx - orb} y1="322" x2={cx - orb} y2="338" />
        <line x1={cx + orb} y1="322" x2={cx + orb} y2="338" />
      </g>
      <text x={cx} y="356" textAnchor="middle" fontSize="13" fill={t.ink} fillOpacity={t.faint} fontFamily="ui-monospace, monospace">
        {orbit ? `ХОД ЭКСЦЕНТРИКА ${orbit}` : 'ХОД ЭКСЦЕНТРИКА'}
      </text>
      <text x={cx} y="380" textAnchor="middle" fontSize="12" fill={t.ink} fillOpacity={dark ? 0.34 : 0.44} fontFamily="ui-monospace, monospace">
        ОДНА ТОЧКА ЛАКА НЕ ГРЕЕТСЯ ПОСТОЯННО
      </text>

      <text x="24" y="46" fontSize="13" fill={t.ink} fillOpacity={t.faint} fontFamily="ui-monospace, monospace">
        ВРАЩЕНИЕ + ОРБИТА
      </text>
    </svg>
  )
}

/* ───────────────────────── Диапазон оборотов ───────────────────────── */

const polar = (cx: number, cy: number, r: number, deg: number) => {
  const a = ((deg - 180) * Math.PI) / 180
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)]
}

/**
 * Регулятор оборотов: дуга от минимума до максимума модели с реальными
 * промежуточными значениями. Точки кликабельны — это не декоративная
 * шкала, а способ увидеть, что диапазон делает в работе.
 */
export function SpeedDial({ min, max, unit }: { min: number; max: number; unit: string }) {
  const reduced = useReducedMotion()
  const steps = 4
  const values = Array.from({ length: steps }, (_, i) => Math.round(min + ((max - min) * i) / (steps - 1)))
  const notes = [
    'Разгон пасты, работа по кромкам',
    'Основная коррекция на панели',
    'Съём на плоскостях',
    'Вывод глянца и производительность',
  ]
  const [active, setActive] = useState(reduced ? steps - 1 : 0)

  /*
   * При первом появлении шкала должна ПРОЙТИ диапазон, а не сразу
   * показать готовый максимум — иначе пользователь видит статичную
   * цифру и не понимает, что регулятор вообще двигается. Разовый свип
   * 0 → максимум на входе во вьюпорт, дальше — обычный hover/tap как
   * раньше (стейт тот же, sweep его не блокирует).
   */
  const wrap = useRef<HTMLDivElement>(null)
  const inView = useInView(wrap, { once: true, amount: 0.5 })
  // Свип обрывается, как только человек сам тронул регулятор — иначе
  // ручной выбор чипа посреди 780-миллисекундного свипа сбросило бы
  // следующим тиком.
  const userTouched = useRef(false)
  useEffect(() => {
    if (!inView || reduced) return
    let i = 0
    const id = window.setInterval(() => {
      if (userTouched.current) {
        window.clearInterval(id)
        return
      }
      i += 1
      setActive(Math.min(i, steps - 1))
      if (i >= steps - 1) window.clearInterval(id)
    }, 260)
    return () => window.clearInterval(id)
  }, [inView, reduced])

  const cx = 260
  const cy = 250
  const r = 168
  const arc = (from: number, to: number) => {
    const [x1, y1] = polar(cx, cy, r, from)
    const [x2, y2] = polar(cx, cy, r, to)
    return `M ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2}`
  }
  const angleFor = (i: number) => (180 / (steps - 1)) * i

  return (
    <div ref={wrap} className="flex h-full w-full flex-col justify-center">
      <svg viewBox="0 0 520 300" role="img" aria-label={`Диапазон оборотов от ${min} до ${max} ${unit}`} className="w-full">
        <path d={arc(0, 180)} fill="none" stroke="#1A1C1E" strokeOpacity="0.14" strokeWidth="10" strokeLinecap="round" />
        <path
          d={arc(0, Math.max(angleFor(active), 0.01))}
          fill="none"
          stroke={EMBER}
          strokeWidth="10"
          strokeLinecap="round"
          className="transition-all duration-500 ease-premium"
        />
        {values.map((v, i) => {
          const [x, y] = polar(cx, cy, r, angleFor(i))
          return (
            <g
              key={v}
              onMouseEnter={() => {
                userTouched.current = true
                setActive(i)
              }}
              className="cursor-pointer"
            >
              <circle cx={x} cy={y} r="16" fill="transparent" />
              <circle
                cx={x}
                cy={y}
                r={i === active ? 9 : 6}
                fill={i <= active ? EMBER : '#FFFFFF'}
                stroke={i <= active ? EMBER : '#1A1C1E'}
                strokeOpacity={i <= active ? 1 : 0.3}
                strokeWidth="2"
                className="transition-all duration-300 ease-premium"
              />
            </g>
          )
        })}
        <text x={cx} y={cy - 46} textAnchor="middle" fontSize="52" fontWeight="500" fill="#1A1C1E" letterSpacing="-1.5">
          {values[active].toLocaleString('ru-RU')}
        </text>
        <text x={cx} y={cy - 18} textAnchor="middle" fontSize="14" fill="#1A1C1E" fillOpacity="0.55" fontFamily="ui-monospace, monospace">
          {unit}
        </text>
      </svg>

      <div className="mt-1 flex flex-wrap items-center justify-center gap-2">
        {values.map((v, i) => (
          <button
            key={v}
            type="button"
            onClick={() => {
              userTouched.current = true
              setActive(i)
            }}
            aria-pressed={i === active}
            className={`rounded-full border px-3.5 py-1.5 font-mono text-[0.75rem] tabular-nums transition-colors duration-300 ease-premium ${
              i === active
                ? 'border-graphite bg-graphite text-porcelain'
                : 'border-graphite/20 text-ash hover:border-graphite/45'
            }`}
          >
            {v.toLocaleString('ru-RU')}
          </button>
        ))}
      </div>
      <p className="mt-4 text-center text-[0.9375rem] leading-relaxed text-slate">{notes[active]}</p>
    </div>
  )
}

/* ───────────────────────── Мощность: номинал и пик ───────────────────────── */

export function PowerBar({
  rated,
  peak,
  unit,
  family = [],
  model,
}: {
  rated: number
  peak?: number
  unit: string
  /** Мощность соседей по разделу — из прайса, для масштаба. */
  family?: { model: string; watts: number }[]
  model?: string
}) {
  const reduced = useReducedMotion()
  const scaleMax = Math.max(peak ?? rated, ...family.map((f) => f.watts))
  const pct = (w: number) => Math.max((w / scaleMax) * 100, 4)
  /*
   * Полосы раньше рисовались сразу в конечную ширину — «резерв» мощности
   * был просто фактом на экране, а не тем, что видно. Заполнение теперь
   * идёт от нуля один раз при входе во вьюпорт: сначала номинал, чуть
   * позже — полупрозрачный пик поверх него, ровно в порядке чтения.
   */
  return (
    <div className="flex h-full w-full flex-col justify-center">
      <div className="flex items-baseline gap-3">
        <span className="text-[clamp(3rem,2rem+3.6vw,5rem)] font-medium leading-none tracking-tight text-graphite">
          {rated.toLocaleString('ru-RU')}
        </span>
        <span className="font-mono text-[0.9375rem] uppercase tracking-[0.14em] text-titanium">{unit}</span>
      </div>

      <div className="mt-7">
        <div className="relative h-3.5 w-full overflow-hidden rounded-full bg-graphite/[0.09]">
          {peak && peak !== rated && (
            <motion.div
              className="absolute inset-y-0 left-0 rounded-full bg-ember/25"
              initial={reduced ? false : { width: '0%' }}
              whileInView={{ width: `${pct(peak)}%` }}
              viewport={{ once: true, amount: 0.6 }}
              transition={{ duration: 0.85, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
              style={reduced ? { width: `${pct(peak)}%` } : undefined}
            />
          )}
          <motion.div
            className="absolute inset-y-0 left-0 rounded-full bg-graphite"
            initial={reduced ? false : { width: '0%' }}
            whileInView={{ width: `${pct(rated)}%` }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            style={reduced ? { width: `${pct(rated)}%` } : undefined}
          />
        </div>
        <div className="mt-3 flex items-baseline justify-between font-mono text-[0.6875rem] uppercase tracking-[0.14em]">
          <span className="text-titanium">Номинал</span>
          {peak && peak !== rated && (
            <span className="text-ember">Пик {peak.toLocaleString('ru-RU')} {unit}</span>
          )}
        </div>
      </div>

      {family.length > 1 && (
        <ul className="mt-9 space-y-3 border-t border-graphite/[0.12] pt-7">
          {family.map((f, i) => {
            const on = f.model === model
            return (
              <li key={f.model} className="flex items-center gap-4">
                <span className={`w-[7.5rem] shrink-0 truncate text-[0.8125rem] ${on ? 'text-graphite' : 'text-titanium'}`}>
                  {f.model}
                </span>
                <span className="h-2 flex-1 overflow-hidden rounded-full bg-graphite/[0.08]">
                  <motion.span
                    className={`block h-full rounded-full ${on ? 'bg-ember' : 'bg-graphite/35'}`}
                    initial={reduced ? false : { width: '0%' }}
                    whileInView={{ width: `${pct(f.watts)}%` }}
                    viewport={{ once: true, amount: 0.6 }}
                    transition={{ duration: 0.6, delay: 0.15 + i * 0.06, ease: [0.16, 1, 0.3, 1] }}
                    style={reduced ? { width: `${pct(f.watts)}%` } : undefined}
                  />
                </span>
                <span className={`w-16 shrink-0 text-right font-mono text-[0.75rem] tabular-nums ${on ? 'text-graphite' : 'text-slate'}`}>
                  {f.watts.toLocaleString('ru-RU')}
                </span>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

/* ───────────────────────── Стек «машинка → круг» ───────────────────────── */

export type MountItem = { src: string; label: string; note: string }

/**
 * Собранная из РЕАЛЬНЫХ кадров каталога цепочка посадки: машинка →
 * подложка → круг. Никакой пририсованной геометрии — это те же файлы,
 * что лежат в каталоге, просто выстроенные по одной оси с размерными
 * подписями из прайса.
 */
export function MountStack({ items }: { items: MountItem[] }) {
  const reduced = useReducedMotion()
  const n = items.length
  /*
   * Боковой сдвиг имеет смысл, только когда звенья реально стоят В РЯД
   * (sm и шире, см. flex-row у <ol> ниже) — на мобильном они уложены в
   * колонку на всю ширину, и тот же -26px по x там не «сходится», а
   * просто вылезает за левый край экрана (реальный горизонтальный
   * оверфлоу нашёлся именно на этом фиксе — MountStack используется на
   * каждой странице машинки и подложки, поэтому баг был массовым).
   */
  const [rowLayout, setRowLayout] = useState(false)
  useEffect(() => {
    const query = window.matchMedia('(min-width: 640px)')
    const sync = () => setRowLayout(query.matches)
    sync()
    query.addEventListener('change', sync)
    return () => query.removeEventListener('change', sync)
  }, [])
  const step = (i: number) => {
    if (reduced) return {}
    const edge = rowLayout ? 26 : 0
    const x = n > 1 ? (i === 0 ? -edge : i === n - 1 ? edge : 0) : 0
    return {
      initial: { opacity: 0, x, y: 14 },
      whileInView: { opacity: 1, x: 0, y: 0 },
      viewport: { once: true, amount: 0.35 },
      transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as const, delay: i * 0.14 },
    }
  }
  return (
    <ol className="flex w-full flex-col gap-3 sm:flex-row sm:items-stretch">
      {items.map((item, i) => (
        <motion.li key={item.label} {...step(i)} className="flex flex-1 items-center gap-3 sm:flex-col sm:gap-0">
          {/*
            Фон кадра заметно глубже белого: у ShineMate часть оснастки
            (многодырчатые подложки, белая шерсть) снята на белом, и на
            почти белом градиенте товар буквально исчезал.
          */}
          <div className="relative flex aspect-square w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[radial-gradient(120%_100%_at_50%_0%,#F2F6F7_0%,#DFE8EA_55%,#CBD7DA_100%)] ring-1 ring-inset ring-graphite/[0.07] sm:aspect-[4/3] sm:w-full">
            <span
              aria-hidden
              className="absolute bottom-[14%] left-1/2 h-[9%] w-[46%] -translate-x-1/2 rounded-[50%] bg-graphite/20 blur-xl"
            />
            <span className="absolute left-3 top-2.5 font-mono text-[0.6875rem] tracking-[0.16em] text-titanium">
              {String(i + 1).padStart(2, '0')}
            </span>
            <img
              src={item.src}
              alt=""
              loading="lazy"
              decoding="async"
              className="relative h-[78%] w-[82%] object-contain"
            />
          </div>
          <div className="min-w-0 sm:mt-4 sm:w-full sm:border-t sm:border-graphite/[0.14] sm:pt-3">
            <p className="text-[0.9375rem] leading-snug tracking-tight text-graphite">{item.label}</p>
            <p className="mt-1 text-[0.8125rem] leading-relaxed text-slate">{item.note}</p>
          </div>
        </motion.li>
      ))}
    </ol>
  )
}

/* ───────────────────────── Серия / линейка реальными кадрами ───────────────────────── */

export type SeriesItem = { slug: string; href: string; label: string; note: string; image: string; active: boolean }

/**
 * Ряд соседей по серии настоящими кадрами каталога: градации круга от
 * мягкой к жёсткой, составы V-Range от финиша к тяжёлому резу. Каждый
 * элемент — ссылка на свой товар, текущий подсвечен.
 *
 * Порядок и подписи берутся из прайса: никакого «условного рейтинга»
 * или придуманных процентов реза здесь нет.
 */
export function SeriesRow({ items, from, to }: { items: SeriesItem[]; from: string; to: string }) {
  const reduced = useReducedMotion()
  return (
    <div className="w-full">
      <div className="flex items-baseline justify-between font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-titanium">
        <span>{from}</span>
        <span className="text-right">{to}</span>
      </div>
      {/*
        Число колонок = числу позиций (максимум пять). Жёсткие пять колонок
        оставляли у линейки V-Range из четырёх составов пустую ячейку
        справа: ряд обрывался на середине, а подпись «V20 · финиш» висела
        над пустотой. У кругов позиций пять — там сетка не меняется.
      */}
      <ol
        className={`mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:gap-4 ${
          items.length <= 3 ? 'lg:grid-cols-3' : items.length === 4 ? 'lg:grid-cols-4' : 'lg:grid-cols-5'
        }`}
      >
        {items.map((item, i) => (
          <motion.li
            key={item.slug}
            {...(reduced
              ? {}
              : {
                  initial: { opacity: 0, y: 16 },
                  whileInView: { opacity: 1, y: 0 },
                  viewport: { once: true, amount: 0.3 },
                  transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const, delay: i * 0.07 },
                })}
          >
            <a
              href={item.href}
              aria-current={item.active ? 'true' : undefined}
              className={`group flex h-full flex-col rounded-2xl border p-3 transition-colors duration-300 ease-premium ${
                item.active
                  ? 'border-graphite bg-porcelain shadow-[0_18px_40px_-24px_rgba(26,28,30,0.5)]'
                  : 'border-graphite/[0.12] hover:border-graphite/35 hover:bg-porcelain/70'
              }`}
            >
              <span className="flex aspect-square items-center justify-center overflow-hidden rounded-xl bg-[radial-gradient(120%_100%_at_50%_0%,#F4F7F8_0%,#E2EAEC_60%,#D2DDDF_100%)]">
                <img
                  src={item.image.replace('.webp', '-thumb.webp')}
                  srcSet={`${item.image.replace('.webp', '-thumb.webp')} 320w, ${item.image} 760w`}
                  sizes="220px"
                  alt=""
                  loading="lazy"
                  decoding="async"
                  // Активная позиция линейки чуть выходит вперёд сама по
                  // себе — не только по наведению: так видно, где ты
                  // сейчас находишься в шкале, даже не касаясь ряда.
                  className={`h-[86%] w-[86%] object-contain transition-transform duration-500 ease-premium group-hover:scale-[1.06] ${
                    item.active ? 'scale-[1.04]' : ''
                  }`}
                />
              </span>
              <span
                className={`mt-3 block font-mono text-[0.8125rem] tabular-nums ${
                  item.active ? 'text-graphite' : 'text-ash'
                }`}
              >
                {item.label}
              </span>
              <span className="mt-1 block text-[0.75rem] leading-snug text-titanium">{item.note}</span>
            </a>
          </motion.li>
        ))}
      </ol>
    </div>
  )
}

/* ──────────────────────── Выбор исполнения в истории ──────────────────────── */

export type VariantItem = { sku: string; label: string; note?: string; image: string }

/**
 * Настоящий переключатель исполнений, а не ряд декоративных карточек.
 *
 * Здесь была одна из тех «фальшивых кнопок», о которых отдельно говорил
 * клиент: карточки исполнений вели ссылкой на ту же самую страницу и
 * подсвечивали жёстко первую позицию. Теперь компонент управляемый —
 * он получает выбранный SKU снаружи и сообщает наверх о смене, поэтому
 * артикул, цена и кадр на первом экране меняются вместе с ним.
 */
export function VariantPicker({
  items,
  activeSku,
  onSelect,
}: {
  items: VariantItem[]
  activeSku?: string
  onSelect?: (sku: string) => void
}) {
  const reduced = useReducedMotion()
  return (
    // Та же логика, что и у ряда серии: колонок ровно столько, сколько
    // исполнений. У сумок их два — в жёсткой сетке из четырёх половина
    // ряда оставалась пустой.
    <ol
      className={`grid w-full grid-cols-2 gap-3 lg:gap-4 ${
        items.length === 2
          ? 'sm:grid-cols-2'
          : items.length === 3
            ? 'sm:grid-cols-3'
            : 'sm:grid-cols-3 lg:grid-cols-4'
      }`}
    >
      {items.map((item, i) => {
        const active = item.sku === activeSku
        return (
          <motion.li
            key={item.sku}
            {...(reduced
              ? {}
              : {
                  initial: { opacity: 0, y: 16 },
                  whileInView: { opacity: 1, y: 0 },
                  viewport: { once: true, amount: 0.3 },
                  transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const, delay: i * 0.07 },
                })}
          >
            <button
              type="button"
              onClick={() => onSelect?.(item.sku)}
              aria-pressed={active}
              className={`group flex h-full w-full flex-col rounded-2xl border p-3 text-left transition-colors duration-300 ease-premium ${
                active
                  ? 'border-graphite bg-porcelain shadow-[0_18px_40px_-24px_rgba(26,28,30,0.5)]'
                  : 'border-graphite/[0.12] hover:border-graphite/35 hover:bg-porcelain/70'
              }`}
            >
              <span className="flex aspect-square items-center justify-center overflow-hidden rounded-xl bg-[radial-gradient(120%_100%_at_50%_0%,#F4F7F8_0%,#E2EAEC_60%,#D2DDDF_100%)]">
                <img
                  src={item.image.replace('.webp', '-thumb.webp')}
                  srcSet={`${item.image.replace('.webp', '-thumb.webp')} 320w, ${item.image} 760w`}
                  sizes="220px"
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className="h-[86%] w-[86%] object-contain transition-transform duration-500 ease-premium group-hover:scale-[1.06]"
                />
              </span>
              <span
                className={`mt-3 block font-mono text-[0.8125rem] tabular-nums ${
                  active ? 'text-graphite' : 'text-ash'
                }`}
              >
                {item.label}
              </span>
              {item.note && (
                <span className="mt-1 block text-[0.75rem] leading-snug text-titanium">{item.note}</span>
              )}
            </button>
          </motion.li>
        )
      })}
    </ol>
  )
}

/* ───────────────────────── Аккумуляторная платформа ───────────────────────── */

export function BatteryFlow({ platform, capacity }: { platform: string; capacity?: string }) {
  const reduced = useReducedMotion()
  return (
    <svg
      viewBox="0 0 520 250"
      role="img"
      aria-label={`Аккумуляторная платформа ${platform}`}
      className="h-full w-full text-graphite/[0.16]"
    >
      <Grid id="bat-grid" step={26} />
      <rect width="520" height="250" fill="url(#bat-grid)" />

      {/*
        Блок аккумулятора «встаёт на место» один раз при входе во
        вьюпорт — короткий выезд слева с лёгким перелётом и возвратом,
        как ощущается настоящая фиксация, а не абстрактный fade. Схема
        не утверждает конкретный механизм крепления (защёлка, салазки,
        байонет) — это принцип «аккумулятор подключается к инструменту»,
        а не чертёж конкретного разъёма.
      */}
      <motion.g
        initial={reduced ? undefined : { x: -22, opacity: 0 }}
        whileInView={reduced ? undefined : { x: [-22, 6, 0], opacity: 1 }}
        viewport={{ once: true, amount: 0.5 }}
        transition={reduced ? undefined : { duration: 0.65, ease: [0.16, 1, 0.3, 1], times: [0, 0.7, 1] }}
      >
        <rect x="18" y="62" width="176" height="128" rx="16" fill="#1A1C1E" />
        <rect x="46" y="40" width="52" height="26" rx="7" fill="#1A1C1E" />
        <rect x="114" y="40" width="52" height="26" rx="7" fill="#1A1C1E" />
        <rect x="18" y="150" width="176" height="40" rx="0" fill={EMBER} opacity="0.9" />
        <path d="M 18 176 h 176 v 14 a 16 16 0 0 1 -16 16 h -144 a 16 16 0 0 1 -16 -16 z" fill="#1A1C1E" opacity="0" />
        <text x="106" y="122" textAnchor="middle" fontSize="44" fontWeight="600" fill="#FFFFFF" letterSpacing="-1">
          {platform}
        </text>
        {capacity && (
          <text x="106" y="177" textAnchor="middle" fontSize="17" fontWeight="600" fill="#1A1C1E" fontFamily="ui-monospace, monospace">
            {capacity}
          </text>
        )}
      </motion.g>

      {/* Поток энергии */}
      <line x1="210" y1="126" x2="330" y2="126" stroke="#1A1C1E" strokeOpacity="0.22" strokeWidth="2.5" strokeDasharray="8 8" />
      {!reduced &&
        [0, 1, 2].map((i) => (
          <circle key={i} r="6" fill={EMBER}>
            <animateMotion dur="2.4s" begin={`${i * 0.8}s`} repeatCount="indefinite" path="M 210 126 L 330 126" />
          </circle>
        ))}
      <path d="M 326 116 L 348 126 L 326 136 Z" fill={EMBER} />

      {/* Рабочая головка */}
      <ellipse cx="428" cy="140" rx="78" ry="24" fill="#1A1C1E" opacity="0.1" />
      <circle cx="428" cy="126" r="76" fill="#D9E2E4" />
      <circle cx="428" cy="126" r="76" fill="none" stroke="#1A1C1E" strokeOpacity="0.3" strokeWidth="2" />
      <circle cx="428" cy="126" r="42" fill="#EFF3F4" stroke="#1A1C1E" strokeOpacity="0.16" strokeWidth="1.4" />
      <circle cx="428" cy="126" r="9" fill="#1A1C1E" opacity="0.65" />

      <text x="106" y="228" textAnchor="middle" fontSize="13" fill="#1A1C1E" fillOpacity="0.58" fontFamily="ui-monospace, monospace">
        БЕЗ КАБЕЛЯ
      </text>
      <text x="428" y="228" textAnchor="middle" fontSize="13" fill="#1A1C1E" fillOpacity="0.58" fontFamily="ui-monospace, monospace">
        РАБОЧАЯ ГОЛОВКА
      </text>
    </svg>
  )
}

/* ───────────────────────── Шкала жёсткости круга ───────────────────────── */

/**
 * Положение круга на реальной шкале градаций каталога. Никаких
 * «cut 8/10» — таких данных у вендора нет; есть только порядок градаций
 * T10…T160, и именно он показывается.
 */
export type GradeStop = {
  value: number
  color?: string
  label?: string
  /** Реальная позиция каталога с этой градацией — чип ведёт на неё. */
  href?: string
  image?: string
  /** Задача этой градации — из типа круга в прайсе. */
  task?: string
}

/**
 * Шкала градаций: от мягкого финиша к тяжёлому резу. Цвета точек —
 * РЕАЛЬНЫЕ цвета кругов из характеристик позиции («T40, оранжевый»), а не
 * декоративный градиент; там, где цвет в данных не указан (микрофибра),
 * точка остаётся нейтральной. Позиция маркера рисуется сразу, без
 * «доезда» по появлению во вьюпорте: если IntersectionObserver не
 * сработает, шкала не должна врать про градацию круга.
 */
export function CutMeter({ grades, active }: { grades: GradeStop[]; active: number }) {
  const i = Math.max(grades.findIndex((g) => g.value === active), 0)
  const activeStop = grades[i]

  return (
    <div className="w-full">
      <div className="flex items-baseline justify-between font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-titanium">
        <span>Мягче · чище глянец</span>
        <span>Жёстче · больше съём</span>
      </div>

      <div className="relative mt-6 h-[3px] w-full rounded-full bg-gradient-to-r from-graphite/15 via-graphite/30 to-graphite">
        {/* Точки серии в реальных цветах — по позиции своей градации */}
        {grades.map((g, gi) => {
          const left = grades.length > 1 ? (gi / (grades.length - 1)) * 100 : 0
          const on = g.value === active
          return (
            <span
              key={g.value}
              aria-hidden
              className={`absolute rounded-full border-porcelain transition-all duration-500 ease-premium ${
                on ? 'z-10 h-[19px] w-[19px] border-[3px]' : 'h-[11px] w-[11px] border-2'
              }`}
              style={{
                left: `calc(${left}% - ${on ? 9.5 : 5.5}px)`,
                top: on ? -8 : -4,
                background: g.color ?? (on ? EMBER : '#8A9296'),
                boxShadow: on ? `0 0 0 3px rgba(254,139,12,0.28)` : undefined,
              }}
            />
          )
        })}
      </div>

      {/*
        Чипы градаций — рабочие ссылки на реальные позиции каталога, а не
        подписи под шкалой: раньше шкала выглядела кликабельной, но ничего
        не делала. Градация без своей позиции остаётся неактивной подписью
        и не притворяется ссылкой.
      */}
      <ol className="mt-7 flex flex-wrap gap-2">
        {grades.map((g) => {
          const on = g.value === active
          const chip = (
            <>
              {g.color && (
                <span aria-hidden className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: g.color }} />
              )}
              T{g.value}
            </>
          )
          const base =
            'flex items-center gap-2 rounded-full border px-3.5 py-1.5 font-mono text-[0.75rem] tabular-nums transition-colors duration-300 ease-premium'
          if (on || !g.href) {
            return (
              <li
                key={g.value}
                aria-current={on ? 'true' : undefined}
                className={`${base} ${on ? 'border-graphite bg-graphite text-porcelain' : 'border-graphite/[0.16] text-titanium'}`}
              >
                {chip}
              </li>
            )
          }
          return (
            <li key={g.value}>
              <a
                href={g.href}
                title={g.task ? `T${g.value} — ${g.task}` : `T${g.value}`}
                className={`${base} border-graphite/[0.16] text-slate hover:border-graphite/45 hover:text-graphite`}
              >
                {chip}
              </a>
            </li>
          )
        })}
      </ol>

      {activeStop && (
        <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3 border-t border-graphite/[0.12] pt-5">
          {activeStop.image && (
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-porcelain ring-1 ring-graphite/[0.08]">
              <img src={activeStop.image} alt="" loading="lazy" decoding="async" className="h-[76%] w-[76%] object-contain" />
            </span>
          )}
          <p className="max-w-[52ch] text-[0.875rem] leading-relaxed text-slate">
            {activeStop.label && (
              <>
                Открытая позиция — <span className="text-graphite">{activeStop.label}</span>.{' '}
              </>
            )}
            {activeStop.task && <>Задача этой градации: {activeStop.task.toLowerCase()}. </>}
            Соседние градации отличаются жёсткостью, а не посадкой: круг меняется на той же подложке.
          </p>
        </div>
      )}
    </div>
  )
}

/* Позиция маркера считается по индексу, поэтому шкала одинаково работает
   и для 5 градаций серии, и для полного набора каталога. */

/* ───────────────────────── Сравнение хода эксцентрика ───────────────────────── */

export function StrokeScale({
  items,
  activeModel,
}: {
  items: { model: string; mm: number }[]
  activeModel: string
}) {
  const max = Math.max(...items.map((x) => x.mm))
  return (
    <ul className="flex w-full flex-wrap items-end justify-between gap-6">
      {items.map((item) => {
        const on = item.model === activeModel
        const size = 34 + (item.mm / max) * 78
        /*
         * Круги сами по себе уже показывали разницу в ходе размером —
         * но размер статичен, и «9 мм против 21 мм» приходилось читать
         * глазами по линейке, а не почувствовать. Точка внутри реально
         * проходит эту амплитуду: её вылет — доля радиуса круга, то есть
         * пропорционален настоящему ходу эксцентрика из прайса.
         */
        const amp = Math.max(size * 0.22, 3)
        return (
          <li key={item.model} className="flex flex-col items-center gap-3">
            <span
              aria-hidden
              className={`relative flex items-center justify-center overflow-hidden rounded-full ${on ? 'bg-ember/20 ring-2 ring-ember' : 'bg-graphite/[0.08] ring-1 ring-graphite/20'}`}
              style={{ width: size, height: size }}
            >
              <span
                className={`sm-orbit-dot block h-2 w-2 rounded-full ${on ? 'bg-ember' : 'bg-graphite/50'}`}
                style={{ '--amp': `${amp}px` } as CSSProperties}
              />
            </span>
            <span className={`font-mono text-[0.8125rem] tabular-nums ${on ? 'text-graphite' : 'text-slate'}`}>
              {item.mm} мм
            </span>
            <span className={`text-[0.8125rem] ${on ? 'text-graphite' : 'text-titanium'}`}>{item.model}</span>
          </li>
        )
      })}
    </ul>
  )
}

/* ───────────────────────── Размерный ряд ───────────────────────── */

export type SizeItem = {
  label: string
  note: string
  mm: number
  /** Реальный кадр этого исполнения — размер показывается товаром, а не кружком. */
  image?: string
  active?: boolean
}

/**
 * Размерный ряд НАСТОЯЩИМИ кадрами позиции в едином масштабе.
 *
 * Раньше здесь стояли пустые круги разного диаметра: формально «шкала»,
 * фактически заглушка, из которой нельзя понять ни что это за товар, ни
 * зачем ему разные размеры. Теперь каждое исполнение показано своим
 * кадром, пропорция между кадрами берётся из реальных миллиметров
 * прайса, а под рядом идёт размерная линия с теми же цифрами.
 *
 * Масштаб намеренно сжат (0.44…1 вместо 0…1): 30 мм рядом со 148 мм
 * превращались бы в точку, и ряд снова читался бы как декорация.
 */
export function SizeScale({ items, unit = 'мм' }: { items: SizeItem[]; unit?: string }) {
  const reduced = useReducedMotion()
  const valid = items.filter((i) => i.mm > 0)
  const list = valid.length >= 2 ? valid : items
  const max = Math.max(...list.map((i) => i.mm || 1))
  const min = Math.min(...list.map((i) => i.mm || max))
  /*
   * Пропорция — ЧЕСТНАЯ: отношение размеров, а не растянутая на весь
   * диапазон шкала. Растяжение врало бы на близких размерах: 18" и 20"
   * отличаются на десятую часть, а «нормализованная» шкала показывала
   * бы их как 0.44 и 1.0. Нижняя граница нужна только для того, чтобы
   * 30 мм рядом со 148 мм не превращались в точку.
   */
  const FLOOR = 0.42
  const clamped = min / max < FLOOR
  const scaleOf = (mm: number) => (!mm ? FLOOR : Math.max(mm / max, FLOOR))

  return (
    <div className="w-full">
      <ul className="flex w-full flex-wrap items-end justify-start gap-x-6 gap-y-10 sm:gap-x-10">
        {list.map((item, i) => {
          const k = scaleOf(item.mm)
          return (
            <motion.li
              key={item.label + item.note}
              initial={reduced ? undefined : { opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.35 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] as const, delay: i * 0.08 }}
              className="flex w-[8rem] flex-col items-center gap-3 sm:w-[10rem]"
            >
              <div className="flex h-[9rem] w-full items-end justify-center sm:h-[11rem]">
                {item.image ? (
                  <img
                    src={item.image}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    className="w-auto max-w-full object-contain drop-shadow-[0_10px_18px_rgba(26,28,30,0.12)]"
                    style={{ height: `${Math.round(k * 100)}%` }}
                  />
                ) : (
                  <span
                    aria-hidden
                    className="block rounded-full border border-graphite/25 bg-[radial-gradient(120%_100%_at_50%_0%,#FFFFFF_0%,#E7EDEE_100%)]"
                    style={{ width: `${Math.round(k * 88)}%`, aspectRatio: '1 / 1' }}
                  />
                )}
              </div>

              {/* Размерная линия под кадром — как на чертеже, а не просто подпись */}
              <div className="flex w-full flex-col items-center">
                <span aria-hidden className="flex w-full items-center opacity-60">
                  <span className="h-2 w-px bg-graphite/45" />
                  <span className="h-px flex-1 bg-graphite/25" />
                  <span className="h-2 w-px bg-graphite/45" />
                </span>
                <span
                  className={`mt-2 font-mono text-[0.8125rem] tabular-nums ${
                    item.active ? 'text-ember' : 'text-graphite'
                  }`}
                >
                  {item.label}
                </span>
                <span className="mt-1 text-center text-[0.75rem] leading-snug text-titanium">{item.note}</span>
              </div>
            </motion.li>
          )
        })}
      </ul>
      {valid.length >= 2 && (
        <p className="mt-8 border-t border-graphite/[0.12] pt-4 font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-titanium">
          {clamped
            ? `Диапазон от ${min} до ${max} ${unit} · самые мелкие показаны крупнее, чтобы оставаться читаемыми`
            : `Пропорции соответствуют реальным размерам · от ${min} до ${max} ${unit}`}
        </p>
      )}
    </div>
  )
}

/* ───────────────────────── Сепаратор: грязь остаётся внизу ───────────────────────── */

/**
 * Условный разрез ведра: губка работает в верхнем слое, песок проходит
 * сквозь решётку и остаётся под ней. Частицы опускаются один раз при
 * появлении блока — это объяснение принципа, а не симуляция и не разрез
 * конкретного изделия. Никаких «задерживает N% грязи»: таких данных нет.
 */
export function GritSeparator() {
  const reduced = useReducedMotion()
  const grains = [
    { x: 78, delay: 0 },
    { x: 104, delay: 0.12 },
    { x: 130, delay: 0.24 },
    { x: 156, delay: 0.08 },
    { x: 182, delay: 0.3 },
    { x: 118, delay: 0.4 },
    { x: 146, delay: 0.5 },
  ]
  return (
    <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,24rem)_1fr] lg:gap-14">
      <div className="rounded-[1.5rem] border border-graphite/[0.08] bg-[radial-gradient(120%_100%_at_50%_0%,#FFFFFF_0%,#EFF3F4_55%,#E3EAEC_100%)] p-6 sm:p-8">
        <svg viewBox="0 0 260 230" className="w-full" role="img" aria-label="Условный разрез ведра: сепаратор задерживает песок на дне">
          <path d="M 52 26 L 208 26 L 192 206 L 68 206 Z" fill="#1A1C1E" fillOpacity="0.05" stroke="#1A1C1E" strokeOpacity="0.28" strokeWidth="2" />
          <path d="M 56 52 L 204 52 L 191 200 L 69 200 Z" fill="#2D5FA6" fillOpacity="0.1" />
          <line x1="56" y1="52" x2="204" y2="52" stroke="#2D5FA6" strokeOpacity="0.4" strokeWidth="2" />

          <rect x="96" y="62" width="66" height="26" rx="7" fill="#1A1C1E" fillOpacity="0.16" />
          <text x="129" y="79" textAnchor="middle" fontSize="10" fontFamily="ui-monospace, monospace" fill="#1A1C1E" fillOpacity="0.55">
            ГУБКА
          </text>

          <g stroke={EMBER} strokeWidth="2.4" strokeLinecap="round">
            <line x1="74" y1="152" x2="186" y2="152" />
            {Array.from({ length: 9 }, (_, i) => 80 + i * 13).map((x) => (
              <line key={x} x1={x} y1="146" x2={x} y2="158" strokeOpacity="0.5" />
            ))}
          </g>
          <text x="192" y="140" fontSize="10" fontFamily="ui-monospace, monospace" fill="#1A1C1E" fillOpacity="0.5" textAnchor="end">
            СЕПАРАТОР
          </text>

          {grains.map((g, i) => (
            <motion.circle
              key={i}
              cx={g.x}
              r={3 + (i % 3)}
              fill="#1A1C1E"
              fillOpacity="0.42"
              initial={reduced ? { cy: 182 } : { cy: 96, opacity: 0 }}
              whileInView={reduced ? {} : { cy: 176 + (i % 3) * 6, opacity: 1 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 1.1, delay: 0.3 + g.delay, ease: [0.4, 0, 0.2, 1] as const }}
            />
          ))}
          <path d="M 70 200 Q 130 186 190 200 L 190 202 L 70 202 Z" fill="#1A1C1E" fillOpacity="0.22" />
        </svg>
      </div>

      <ol className="space-y-4">
        {[
          { n: '01', t: 'Губка работает в верхнем слое', d: 'Забирает воду оттуда, где грязи уже нет' },
          { n: '02', t: 'Решётка пропускает песок вниз', d: 'Частицы проходят сквозь неё и остаются под решёткой' },
          { n: '03', t: 'Осадок не поднимается обратно', d: 'Следующий заход губки не выносит грязь на кузов' },
        ].map((x) => (
          <li key={x.n} className="border-l-2 border-ember/40 pl-4">
            <p className="font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-titanium">{x.n}</p>
            <p className="mt-1 text-[0.9375rem] leading-snug tracking-tight text-graphite">{x.t}</p>
            <p className="mt-1 text-[0.8125rem] leading-relaxed text-slate">{x.d}</p>
          </li>
        ))}
        <li className="pl-4 text-[0.75rem] leading-relaxed text-titanium">Схема принципа, а не разрез конкретного изделия.</li>
      </ol>
    </div>
  )
}

/* ───────────────────────── Держатель: у машинки своё место ───────────────────────── */

/**
 * Куда машинка возвращается между проходами.
 *
 * Слева — как это выглядит без держателя: инструмент лежит на панели
 * кузова, кабель на полу, круг собирает пыль. Справа — машинка на своём
 * месте: при появлении блока она один раз «приезжает» в держатель.
 * Кадры настоящие: и машинка, и держатель — позиции каталога.
 */
export function HolderScene({ machineImage, holderImage }: { machineImage: string; holderImage?: string }) {
  const reduced = useReducedMotion()

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {/* Без держателя */}
      <div className="relative overflow-hidden rounded-2xl border border-graphite/[0.12] bg-hazeSurface p-6">
        <div className="relative flex h-40 items-end justify-center sm:h-48">
          {/*
            Условная панель кузова: тёмный лак с бликом, а не чёрное
            пятно. Машинка лежит НА ней, поэтому её нижний край заходит
            на панель, а не висит над ним.
          */}
          <span
            aria-hidden
            className="absolute bottom-6 h-20 w-[92%] rounded-t-[46%] bg-[linear-gradient(180deg,#31363B_0%,#1B1E22_60%,#101214_100%)]"
          />
          <span aria-hidden className="absolute bottom-[4.5rem] h-6 w-[62%] rounded-[50%] bg-white/[0.09] blur-[6px]" />
          <img
            src={machineImage}
            alt=""
            loading="lazy"
            decoding="async"
            className="relative z-10 mb-10 h-24 w-auto rotate-[-7deg] object-contain drop-shadow-[0_14px_18px_rgba(0,0,0,0.45)] sm:h-28"
          />
        </div>
        <p className="mt-4 font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-titanium">Без держателя</p>
        <p className="mt-2 text-[0.875rem] leading-relaxed text-slate">
          Машинка лежит на кузове или на полу: круг собирает пыль, кабель попадает под ноги, корпус царапает панель.
        </p>
      </div>

      {/* С держателем */}
      <div className="relative overflow-hidden rounded-2xl border border-ember/40 bg-porcelain p-6">
        <div className="relative flex h-40 items-center justify-center sm:h-48">
          {/* Перфопанель — фон рабочего места */}
          <svg aria-hidden className="absolute inset-0 h-full w-full text-graphite/[0.12]">
            <defs>
              <pattern id="pegboard" width="18" height="18" patternUnits="userSpaceOnUse">
                <circle cx="9" cy="9" r="2" fill="currentColor" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#pegboard)" />
          </svg>

          {holderImage && (
            <img
              src={holderImage}
              alt=""
              loading="lazy"
              decoding="async"
              className="relative z-10 h-32 w-auto object-contain sm:h-40"
            />
          )}
          {/* Машинка один раз приезжает на своё место */}
          <motion.img
            src={machineImage}
            alt=""
            loading="lazy"
            decoding="async"
            initial={reduced ? { x: 0, opacity: 1 } : { x: 90, opacity: 0 }}
            whileInView={{ x: 0, opacity: 1 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] as const, delay: 0.25 }}
            className="relative z-20 -ml-8 h-24 w-auto object-contain drop-shadow-[0_12px_20px_rgba(26,28,30,0.2)] sm:h-28"
          />
        </div>
        <p className="mt-4 font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-ember">С держателем</p>
        <p className="mt-2 text-[0.875rem] leading-relaxed text-slate">
          У инструмента постоянное место в шаге от рабочей зоны: машинка висит, кабель не на полу, круг не в пыли.
        </p>
      </div>
    </div>
  )
}

/* ───────────────────────── Липучка: новая против изношенной ───────────────────────── */

/**
 * Почему крепление подложки — расходник.
 *
 * Слева крючки стоят вертикально и плотно, справа примяты и забиты
 * пылью. Это ПРИНЦИП износа, а не фотография конкретной подложки и не
 * заявление о ресурсе: ни того, ни другого в данных нет, поэтому ни
 * «через N часов», ни «через N кругов» здесь не появляется.
 */
export function VelcroWear() {
  const reduced = useReducedMotion()

  const hooks = (worn: boolean) =>
    Array.from({ length: 26 }, (_, i) => {
      const x = 14 + i * 7
      if (!worn) return { x, d: `M ${x} 74 L ${x} 40 q 0 -8 7 -8` }
      // Изношенные: разной длины, завалены в стороны, часть почти легла.
      const lean = (i % 3) - 1
      const h = 74 - (16 + (i % 4) * 5)
      return { x, d: `M ${x} 74 L ${x + lean * 5} ${h} q ${lean * 4} -3 ${lean * 7} -1` }
    })

  const panel = (worn: boolean) => (
    <div
      className={`relative overflow-hidden rounded-2xl border p-6 ${
        worn ? 'border-graphite/[0.12] bg-hazeSurface' : 'border-ember/40 bg-porcelain'
      }`}
    >
      <svg viewBox="0 0 200 92" className="h-24 w-full" role="img" aria-label={worn ? 'Изношенное крепление: крючки примяты' : 'Новое крепление: крючки стоят плотно'}>
        {/* Основание ленты */}
        <rect x="8" y="74" width="184" height="10" rx="3" fill="#1A1C1E" fillOpacity={worn ? 0.5 : 0.72} />
        {hooks(worn).map((h, i) => (
          <motion.path
            key={h.x}
            d={h.d}
            fill="none"
            stroke="#1A1C1E"
            strokeOpacity={worn ? 0.34 : 0.6}
            strokeWidth="2"
            strokeLinecap="round"
            initial={reduced ? undefined : { opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.35, delay: (worn ? 0.35 : 0.05) + i * 0.012 }}
          />
        ))}
        {/* Забившая ворс пыль — только у изношенного */}
        {worn &&
          [30, 62, 96, 128, 158].map((x, i) => (
            <circle key={x} cx={x} cy={62 - (i % 2) * 6} r="3.2" fill="#1A1C1E" fillOpacity="0.14" />
          ))}
      </svg>
      <p className={`mt-5 font-mono text-[0.6875rem] uppercase tracking-[0.16em] ${worn ? 'text-titanium' : 'text-ember'}`}>
        {worn ? 'Изношенное крепление' : 'Новое крепление'}
      </p>
      <p className="mt-2 text-[0.875rem] leading-relaxed text-slate">
        {worn
          ? 'Ворс примят и забит пылью — круг держится хуже и начинает смещаться под нагрузкой.'
          : 'Ворс стоит плотно и держит круг по всей плоскости — пятно контакта не смещается.'}
      </p>
    </div>
  )

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {panel(false)}
      {panel(true)}
    </div>
  )
}

/* ───────────────────────── Машинка как система: сборка по скроллу ───────────────────────── */

export type ExplodedData = {
  /** Реальные кадры каталога — машинка, её штатная подложка и совместимый круг. */
  machineImage: string
  machineLabel: string
  plateImage?: string
  plateLabel?: string
  padImage?: string
  padLabel?: string
  /** Узлы рабочего тракта — общими терминами, без выдуманного разреза. */
  nodes: { label: string; note: string }[]
  /** Тип движения рабочей поверхности — определяет анимацию в финале сцены. */
  motion: 'rotary' | 'orbit'
  /** Подпись движения: реальный ход эксцентрика или диапазон оборотов из прайса. */
  motionNote?: string
}

/**
 * Главная сцена страницы машинки: инструмент собирается в систему по мере
 * скролла. Сначала подсвечивается рабочий тракт (управление → двигатель →
 * привод → рабочий узел), затем к машинке снизу подходит её штатная
 * подложка, затем на подложку садится круг, и в финале рабочая
 * поверхность начинает двигаться так, как двигается именно этот тип
 * машинки: ротор — вокруг одной оси, эксцентрик — вращение плюс орбита.
 *
 * ЧТО ЗДЕСЬ ЧЕСТНО, А ЧТО НЕТ. Фотографии — настоящие кадры каталога
 * (машинка, подложка, круг). Узлы тракта названы общими для любой
 * полировальной машинки словами: точной компоновки редуктора и обмотки
 * у ShineMate в открытом доступе нет, и «разрез EP830» здесь не рисуется
 * ни в каком виде. Движение в финале — принцип привода, а не симуляция.
 *
 * ДОСТУПНОСТЬ. Весь текст сцены присутствует в DOM всегда: скролл меняет
 * только подсветку и положение, но не прячет информацию. При
 * prefers-reduced-motion сцена превращается в обычный статичный блок —
 * без sticky, без трансформаций, все узлы показаны сразу.
 */
export function MachineExploded(data: ExplodedData) {
  const reduced = useReducedMotion()
  /*
   * Sticky-сцена на всю высоту экрана имеет смысл только там, где она
   * действительно помещается. На телефоне тот же блок (кадр + шесть узлов
   * тракта) выше экрана, вылезал за пределы липкого контейнера и налезал
   * на соседние секции. Ниже 1024px показываем ту же историю обычной
   * вертикальной раскладкой — весь текст и вся оснастка на месте.
   */
  const desktop = useMediaQuery(DESKTOP_SCENE_QUERY)
  const track = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: track, offset: ['start start', 'end end'] })
  const [step, setStep] = useState(0)

  const n = data.nodes.length
  /*
   * Первая половина прокрутки разбирается по узлам тракта, вторая —
   * на сборку подложки и круга. Индекс шага считается один раз здесь,
   * а не в каждом узле: так подсветка списка и положение оснастки
   * всегда согласованы между собой.
   */
  useMotionValueEvent(scrollYProgress, 'change', (v) => {
    const next = Math.min(n - 1, Math.floor(v * (n + 0.35)))
    setStep((prev) => (prev === next ? prev : next))
  })

  const plateY = useTransform(scrollYProgress, [0.34, 0.6], [120, 0])
  const plateOpacity = useTransform(scrollYProgress, [0.32, 0.52], [0, 1])
  const padY = useTransform(scrollYProgress, [0.58, 0.84], [150, 0])
  const padOpacity = useTransform(scrollYProgress, [0.56, 0.76], [0, 1])
  const machineY = useTransform(scrollYProgress, [0, 0.6], [0, -18])
  const runOpacity = useTransform(scrollYProgress, [0.82, 0.95], [0, 1])
  /* Ось монтажа прорисовывается перед тем, как по ней приходит оснастка. */
  const axisScale = useTransform(scrollYProgress, [0.26, 0.42], [0, 1])
  /*
   * Короткий «щелчок» посадки: деталь чуть переразмеривается в момент
   * стыковки и садится на место. Без него подложка просто подъезжала и
   * останавливалась — стыковка не читалась.
   */
  const plateScale = useTransform(scrollYProgress, [0.48, 0.56, 0.62], [1, 1.06, 1])
  const padScale = useTransform(scrollYProgress, [0.72, 0.8, 0.86], [1, 1.06, 1])

  /* Статичная раскладка: то же содержание, без sticky и без скролл-трансформаций. */
  if (reduced || !desktop) {
    return (
      <div className="grid gap-8 lg:grid-cols-[1fr_minmax(0,20rem)] lg:items-center">
        <div className="relative flex flex-col items-center overflow-hidden rounded-[1.75rem] bg-[radial-gradient(120%_100%_at_50%_0%,#FFFFFF_0%,#EEF2F3_45%,#E2E9EB_100%)] px-5 py-8">
          <svg aria-hidden className="pointer-events-none absolute inset-0 h-full w-full text-graphite/[0.07]">
            <Grid id="exploded-grid-static" step={30} />
            <rect width="100%" height="100%" fill="url(#exploded-grid-static)" />
          </svg>
          <img
            src={data.machineImage}
            alt={data.machineLabel}
            className="relative z-10 h-32 w-auto max-w-full object-contain drop-shadow-[0_16px_26px_rgba(26,28,30,0.14)] sm:h-40"
          />
          {(data.plateImage || data.padImage) && (
            <div className="relative z-10 mt-6 flex items-start justify-center gap-8">
              <span aria-hidden className="absolute -top-6 left-1/2 h-6 w-px -translate-x-1/2 bg-ember/45" />
              {data.plateImage && (
                <figure className="flex w-24 flex-col items-center gap-2">
                  <span className="flex h-[4.25rem] w-[4.25rem] items-center justify-center rounded-full bg-porcelain shadow-[0_8px_18px_rgba(26,28,30,0.1)] ring-1 ring-graphite/[0.08]">
                    <img src={data.plateImage} alt={data.plateLabel ?? ''} className="h-[74%] w-[74%] object-contain" />
                  </span>
                  <figcaption className="text-center font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-titanium">Подложка</figcaption>
                </figure>
              )}
              {data.padImage && (
                <figure className="flex w-24 flex-col items-center gap-2">
                  <span className="flex h-[4.25rem] w-[4.25rem] items-center justify-center rounded-full bg-porcelain shadow-[0_8px_18px_rgba(26,28,30,0.1)] ring-1 ring-graphite/[0.08]">
                    <img src={data.padImage} alt={data.padLabel ?? ''} className="h-[74%] w-[74%] object-contain" />
                  </span>
                  <figcaption className="text-center font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-titanium">Круг</figcaption>
                </figure>
              )}
            </div>
          )}
          <p className="relative z-10 mt-6 rounded-full bg-porcelain/90 px-4 py-1.5 text-center font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-titanium">
            {data.motion === 'rotary' ? 'Вращение' : 'Вращение + орбита'}
            {data.motionNote ? ` · ${data.motionNote}` : ''}
          </p>
        </div>
        <ol className="space-y-4">
          {data.nodes.map((node, i) => (
            <li key={node.label} className="border-l-2 border-ember/40 pl-4">
              <p className="font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-titanium">{String(i + 1).padStart(2, '0')}</p>
              <p className="mt-1 text-[0.9375rem] tracking-tight text-graphite">{node.label}</p>
              <p className="mt-1 text-[0.8125rem] leading-relaxed text-slate">{node.note}</p>
            </li>
          ))}
        </ol>
      </div>
    )
  }

  return (
    <div ref={track} className="relative" style={{ height: `${Math.min(300, 110 + n * 30)}vh` }}>
      {/*
        Высота липкого блока равна экрану, а содержимое РАСТЯГИВАЕТСЯ на всю
        эту высоту (items-stretch + h-full у кадра). Иначе, когда блок
        открепляется в конце трека, снизу остаётся пустой экран — ровно та
        «дыра», которой на премиальной странице быть не должно.
      */}
      {/* pt-24 — запас под фиксированный хедер: без него верх сцены уходит под шапку. */}
      <div className="sticky top-0 flex h-[100svh] items-center pb-10 pt-24 lg:pb-12 lg:pt-28">
        <div className="grid h-full w-full gap-6 lg:grid-cols-[1fr_minmax(0,19rem)] lg:items-stretch lg:gap-12">
          {/*
            Сборка идёт по ОДНОЙ ОСИ: машинка сверху, под ней вертикальная
            ось монтажа, по которой снизу поднимаются подложка и круг и
            встают в один стек. Раньше подложка и круг стояли двумя
            кружками рядом — это читалось как две иконки под фотографией,
            а не как сборка инструмента.
          */}
          <div className="relative flex h-full min-h-[20rem] flex-col items-center justify-center overflow-hidden rounded-[1.75rem] bg-[radial-gradient(120%_100%_at_50%_0%,#FFFFFF_0%,#EEF2F3_45%,#E2E9EB_100%)] px-6 py-8">
            <svg aria-hidden className="pointer-events-none absolute inset-0 h-full w-full text-graphite/[0.07]">
              <Grid id="exploded-grid" step={32} />
              <rect width="100%" height="100%" fill="url(#exploded-grid)" />
            </svg>

            <motion.img
              src={data.machineImage}
              alt={data.machineLabel}
              style={{ y: machineY }}
              className="relative z-30 max-h-[40%] w-auto max-w-full flex-shrink-0 object-contain drop-shadow-[0_22px_34px_rgba(26,28,30,0.15)]"
            />

            {/* Ось монтажа: по ней оснастка и приходит к шпинделю */}
            <motion.span
              aria-hidden
              style={{ scaleY: axisScale }}
              className="relative z-10 mt-1 h-10 w-px origin-top bg-[linear-gradient(180deg,rgba(254,139,12,0.6),rgba(254,139,12,0.15))]"
            />

            {/* Стек оснастки: подложка, под ней круг — по одной оси */}
            <div className="relative z-20 flex flex-col items-center">
              {data.plateImage && (
                <motion.figure
                  style={{ y: plateY, opacity: plateOpacity, scale: plateScale }}
                  className="flex flex-col items-center"
                >
                  <span className="flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-full bg-porcelain shadow-[0_10px_22px_rgba(26,28,30,0.12)] ring-1 ring-graphite/[0.08] sm:h-24 sm:w-24">
                    <img src={data.plateImage} alt={data.plateLabel ?? ''} className="h-[76%] w-[76%] object-contain" />
                  </span>
                  <figcaption className="mt-2 font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-titanium">
                    Подложка
                  </figcaption>
                </motion.figure>
              )}
              {data.padImage && (
                <motion.figure
                  style={{ y: padY, opacity: padOpacity, scale: padScale }}
                  className="-mt-3 flex flex-col items-center"
                >
                  <span className="flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-full bg-porcelain shadow-[0_10px_22px_rgba(26,28,30,0.12)] ring-1 ring-graphite/[0.08] sm:h-24 sm:w-24">
                    <img
                      src={data.padImage}
                      alt={data.padLabel ?? ''}
                      className={`h-[76%] w-[76%] object-contain ${data.motion === 'rotary' ? 'sm-spin-slow' : 'sm-orbit-pad'}`}
                    />
                  </span>
                  <figcaption className="mt-2 font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-titanium">
                    Круг
                  </figcaption>
                </motion.figure>
              )}
            </div>

            <motion.p
              style={{ opacity: runOpacity }}
              className="relative z-20 mt-6 rounded-full bg-porcelain/90 px-4 py-1.5 text-center font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-titanium"
            >
              {data.motion === 'rotary' ? 'Вращение' : 'Вращение + орбита'}
              {data.motionNote ? ` · ${data.motionNote}` : ''}
            </motion.p>
          </div>

          {/*
            Рабочий тракт: активный узел подсвечен, остальные читаются всегда.
            self-center — чтобы длинный список (у аккумуляторных моделей семь
            узлов) центрировался по высоте кадра, а не растягивался и не
            уезжал верхним пунктом под фиксированный хедер.
          */}
          <ol className="space-y-3 self-center">
            {data.nodes.map((node, i) => {
              const on = i <= step
              return (
                <li
                  key={node.label}
                  aria-current={i === step ? 'step' : undefined}
                  className={`border-l-2 pl-4 transition-colors duration-500 ${on ? 'border-ember' : 'border-graphite/15'}`}
                >
                  <p className={`font-mono text-[0.6875rem] uppercase tracking-[0.16em] transition-colors duration-500 ${on ? 'text-ember' : 'text-titanium'}`}>
                    {String(i + 1).padStart(2, '0')}
                  </p>
                  <p className={`mt-1 text-[0.9375rem] tracking-tight transition-colors duration-500 ${on ? 'text-graphite' : 'text-slate'}`}>
                    {node.label}
                  </p>
                  <p className="mt-1 text-[0.8125rem] leading-relaxed text-slate">{node.note}</p>
                </li>
              )
            })}
          </ol>
        </div>
      </div>
    </div>
  )
}

/* ───────────────────────── Устройство круга: слои ───────────────────────── */

export type LayerItem = { label: string; note: string }

export type PadFace = 'diamond' | 'flat' | 'nap' | 'fiber'

/**
 * Рабочая поверхность в разрезе — у каждого материала своя. Это не один
 * SVG, покрашенный в разные цвета: у рельефного круга гранёный профиль,
 * у плоского — ровная кромка, у шерсти — ворс, у микрофибры — короткие
 * волокна. Форма берётся из того, что видно на реальных кадрах товара и
 * прямо написано в его названии/характеристиках.
 */
function FaceProfile({ face, color }: { face: PadFace; color: string }) {
  if (face === 'diamond') {
    // Волнистая рельефная кромка — «алмазная грань» серии Black Diamond.
    // Волны считаются по ширине, а не набиваются вручную: раньше хвост
    // справа оставался плоским, и рельеф читался как брак фигуры.
    const waves = 9
    const w = 162 / waves
    const crest = Array.from({ length: waves }, () => `q ${w / 2} -13 ${w} 0`).join(' ')
    return <path d={`M 18 34 ${crest} L 180 46 L 18 46 Z`} fill={color} />
  }
  if (face === 'nap') {
    // Высокий ворс шерсти: пучки разной длины поверх основы.
    return (
      <g>
        <rect x="18" y="36" width="162" height="10" fill={color} />
        {Array.from({ length: 27 }, (_, i) => 20 + i * 6).map((x, i) => (
          <path key={x} d={`M ${x} 36 q 2 -${11 + (i % 3) * 5} 5 -${13 + (i % 3) * 5}`} stroke={color} strokeWidth="2.4" strokeLinecap="round" fill="none" />
        ))}
      </g>
    )
  }
  if (face === 'fiber') {
    // Микрофибра: короткий плотный ворс одинаковой длины.
    return (
      <g>
        <rect x="18" y="34" width="162" height="12" fill={color} />
        {Array.from({ length: 41 }, (_, i) => 19 + i * 4).map((x) => (
          <line key={x} x1={x} y1="34" x2={x} y2="25" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
        ))}
      </g>
    )
  }
  // Flat-face: ровная рабочая плоскость.
  return <rect x="18" y="28" width="162" height="18" rx="2" fill={color} />
}

/**
 * Круг в разрезе: рабочая поверхность → тело → крепление Velcro, плюс
 * реальные размеры из прайса — толщина и центральное отверстие, если они
 * у позиции указаны. Слои расходятся один раз при появлении в кадре,
 * подписи стоят рядом со своим слоем.
 *
 * Что здесь честно: форма рабочей кромки соответствует типу круга
 * (рельеф / плоскость / ворс / микрофибра), размерная линия показывает
 * ТУ цифру толщины, которая указана в характеристиках позиции. Толщины
 * отдельных слоёв внутри круга нигде не заявляются — таких данных нет.
 */
export function PadConstruction({
  items,
  face = 'flat',
  color = '#8A9296',
  thickness,
  hole,
}: {
  items: LayerItem[]
  face?: PadFace
  color?: string
  /** Реальная толщина из характеристик, например «25 мм». */
  thickness?: string
  /** Реальное центральное отверстие, например «22 мм у 6" и 7"». */
  hole?: string
}) {
  const reduced = useReducedMotion()
  const layerY = [0, 54, 96]
  const restY = [0, 30, 54]

  return (
    <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,26rem)_1fr] lg:gap-14">
      <div className="rounded-[1.5rem] border border-graphite/[0.08] bg-[radial-gradient(120%_100%_at_50%_0%,#FFFFFF_0%,#EFF3F4_55%,#E3EAEC_100%)] p-6 sm:p-8">
        <svg
          viewBox="0 0 260 190"
          className="w-full"
          role="img"
          aria-label={`Круг в разрезе: рабочая поверхность, тело круга, крепление Velcro${thickness ? `, толщина ${thickness}` : ''}`}
        >
          <Grid id="pad-profile-grid" step={26} />
          <rect width="260" height="190" fill="url(#pad-profile-grid)" className="text-graphite/[0.09]" />

        {/* 01 — рабочая поверхность */}
        <motion.g
          initial={reduced ? { opacity: 1, y: layerY[0] } : { opacity: 0, y: restY[0] }}
          whileInView={{ opacity: 1, y: layerY[0] }}
          viewport={{ once: true, amount: 0.45 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] as const, delay: 0.05 }}
        >
          <FaceProfile face={face} color={color} />
        </motion.g>

        {/* 02 — тело круга */}
        <motion.g
          initial={reduced ? { opacity: 1, y: layerY[1] } : { opacity: 0, y: restY[1] }}
          whileInView={{ opacity: 1, y: layerY[1] }}
          viewport={{ once: true, amount: 0.45 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] as const, delay: 0.19 }}
        >
          <rect x="18" y="20" width="162" height="30" rx="4" fill={color} fillOpacity="0.55" />
          <rect x="18" y="20" width="162" height="30" rx="4" fill="none" stroke="#1A1C1E" strokeOpacity="0.16" strokeWidth="1" />
          {hole && <rect x="90" y="20" width="18" height="30" fill="#F4F7F7" stroke="#1A1C1E" strokeOpacity="0.14" strokeWidth="1" />}
        </motion.g>

        {/* 03 — крепление Velcro: короткие крючки по всей плоскости */}
        <motion.g
          initial={reduced ? { opacity: 1, y: layerY[2] } : { opacity: 0, y: restY[2] }}
          whileInView={{ opacity: 1, y: layerY[2] }}
          viewport={{ once: true, amount: 0.45 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] as const, delay: 0.33 }}
        >
          <rect x="18" y="24" width="162" height="9" rx="2" fill="#1A1C1E" fillOpacity="0.72" />
          {Array.from({ length: 32 }, (_, i) => 21 + i * 5).map((x) => (
            <line key={x} x1={x} y1="33" x2={x} y2="38" stroke="#1A1C1E" strokeOpacity="0.42" strokeWidth="1.5" strokeLinecap="round" />
          ))}
        </motion.g>

        {/* Размерная линия толщины — только когда цифра действительно есть */}
        {thickness && (
          <motion.g
            initial={reduced ? { opacity: 1 } : { opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, amount: 0.45 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <g stroke="#1A1C1E" strokeOpacity="0.42" strokeWidth="1.1">
              <line x1="196" y1="20" x2="196" y2="146" />
              <line x1="190" y1="20" x2="202" y2="20" />
              <line x1="190" y1="146" x2="202" y2="146" />
            </g>
            <text x="208" y="87" fontSize="12" fontFamily="ui-monospace, monospace" fill="#1A1C1E" fillOpacity="0.62">
              {thickness}
            </text>
          </motion.g>
        )}
        </svg>
      </div>

      <ol className="space-y-4">
        {items.map((item, i) => (
          <motion.li
            key={item.label}
            initial={reduced ? undefined : { opacity: 0, x: 12 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] as const, delay: 0.2 + i * 0.14 }}
            className="border-l-2 border-ember/40 pl-4"
          >
            <p className="font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-titanium">{String(i + 1).padStart(2, '0')}</p>
            <p className="mt-1 text-[0.9375rem] leading-snug tracking-tight text-graphite">{item.label}</p>
            <p className="mt-1 text-[0.8125rem] leading-relaxed text-slate">{item.note}</p>
          </motion.li>
        ))}
        {hole && (
          <li className="border-l-2 border-graphite/15 pl-4">
            <p className="font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-titanium">Центральное отверстие</p>
            <p className="mt-1 text-[0.875rem] leading-relaxed text-slate">{hole} — под штифт подложки, круг садится по центру без смещения.</p>
          </li>
        )}
      </ol>
    </div>
  )
}

/* ───────────────────────── Три материала рядом ───────────────────────── */

type MaterialKey = 'foam' | 'microfiber' | 'wool'

/**
 * Статичное сравнение, одинаковое на каждой странице круга — меняется
 * только то, какая карточка активна (материал этого товара). Формулировки
 * — те же, что уже используются в материал-специфичных сценах истории:
 * никаких новых цифр реза здесь не появляется, только относительное
 * поведение (агрессивнее / чище / для какой стадии).
 */
const MATERIALS: {
  key: MaterialKey
  label: string
  trait: string
  body: string
  use: string
  /** Как материал ведёт себя в пятне контакта — без выдуманных цифр. */
  contact: string
}[] = [
  {
    key: 'foam',
    label: 'Поролон',
    trait: 'Универсальный',
    body: 'Жёсткость определяет задачу: от тяжёлого реза до чистого финиша — вся линейка держится на одном материале, меняется только градация.',
    use: 'Все стадии, по градации',
    contact: 'Сплошное пятно, сжимается под нажимом',
  },
  {
    key: 'microfiber',
    label: 'Микрофибра',
    trait: 'Рез шерсти, чистота поролона',
    body: 'Снимает почти как шерсть, но оставляет заметно более чистую поверхность — часто закрывает коррекцию и финиш меньшим числом проходов.',
    use: 'Коррекция и финиш',
    contact: 'Плотное короткое волокно, ровный след',
  },
  {
    key: 'wool',
    label: 'Шерсть',
    trait: 'Максимальный рез',
    body: 'Ворс снимает лак агрессивнее поролона и меньше держит тепло в пятне контакта — стандарт для тяжёлой коррекции.',
    use: 'Тяжёлая коррекция',
    contact: 'Длинный ворс, работает кончиками прядей',
  },
]

/**
 * Макро-структура материала. Три разных рисунка, а не один перекрашенный:
 * поролон — открытые поры, микрофибра — плотный короткий ворс, шерсть —
 * длинные пряди. Это условная графика структуры, а не микрофотография.
 */
function MaterialTexture({ kind, large }: { kind: MaterialKey; large?: boolean }) {
  const ink = '#1A1C1E'
  const box = large ? 'h-32 w-full sm:h-40' : 'h-14 w-full'
  if (kind === 'foam') {
    const cells: { x: number; y: number; r: number }[] = []
    for (let row = 0; row < 4; row += 1) {
      for (let col = 0; col < 9; col += 1) {
        cells.push({ x: 10 + col * 20 + (row % 2) * 9, y: 12 + row * 17, r: 5.5 + ((row + col) % 3) * 1.6 })
      }
    }
    return (
      <svg viewBox="0 0 190 78" className={box} role="img" aria-label="Структура поролона: открытые поры">
        {cells.map((c, i) => (
          <circle key={i} cx={c.x} cy={c.y} r={c.r} fill="none" stroke={ink} strokeOpacity="0.3" strokeWidth="1.3" />
        ))}
      </svg>
    )
  }
  if (kind === 'microfiber') {
    return (
      <svg viewBox="0 0 190 78" className={box} role="img" aria-label="Структура микрофибры: плотный короткий ворс">
        <line x1="6" y1="62" x2="184" y2="62" stroke={ink} strokeOpacity="0.28" strokeWidth="1.4" />
        {Array.from({ length: 46 }, (_, i) => 7 + i * 4).map((x, i) => (
          <line
            key={x}
            x1={x}
            y1="62"
            x2={x + (i % 3) - 1}
            y2={24 + (i % 4) * 4}
            stroke={ink}
            strokeOpacity="0.32"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        ))}
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 190 78" className={box} role="img" aria-label="Структура шерсти: длинные пряди ворса">
      <line x1="6" y1="66" x2="184" y2="66" stroke={ink} strokeOpacity="0.28" strokeWidth="1.4" />
      {Array.from({ length: 19 }, (_, i) => 8 + i * 9.6).map((x, i) => (
        <path
          key={x}
          d={`M ${x} 66 q ${i % 2 === 0 ? 7 : -7} -20 ${i % 3 === 0 ? 3 : -2} -${34 + (i % 3) * 8}`}
          stroke={ink}
          strokeOpacity="0.3"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />
      ))}
    </svg>
  )
}

/** Реальные кадры кругов каждого материала — из каталога, не иллюстрации. */
export type MaterialSample = { key: MaterialKey; image: string; model: string; href: string }

/**
 * Материал круга как ИНТЕРАКТИВНЫЙ разбор, а не три текстовые карточки.
 *
 * Слева — крупная макро-структура выбранного материала (у каждого своя:
 * открытые поры поролона, плотное короткое волокно микрофибры, длинные
 * пряди шерсти) плюс реальный кадр круга этого материала из каталога.
 * Справа — что это меняет в работе. Переключатель материалов работает
 * руками; материал открытого товара выбран по умолчанию и помечен.
 *
 * Структуры условные: это графика принципа, а не микрофотография. Ни
 * одной новой цифры реза здесь не появляется — только относительное
 * поведение, уже сказанное в тексте товара.
 */
export function MaterialCompare({ active, samples = [] }: { active: MaterialKey; samples?: MaterialSample[] }) {
  const reduced = useReducedMotion()
  const [picked, setPicked] = useState<MaterialKey>(active)
  useEffect(() => setPicked(active), [active])
  const current = MATERIALS.find((m) => m.key === picked) ?? MATERIALS[0]
  const sample = samples.find((s) => s.key === picked)

  return (
    <div>
      {/* Переключатель материалов */}
      <ul className="flex flex-wrap gap-2">
        {MATERIALS.map((m) => {
          const on = m.key === picked
          return (
            <li key={m.key}>
              <button
                type="button"
                onClick={() => setPicked(m.key)}
                aria-pressed={on}
                className={`rounded-full border px-4 py-2 text-[0.875rem] transition-colors duration-300 ease-premium ${
                  on
                    ? 'border-graphite bg-graphite text-porcelain'
                    : 'border-graphite/20 text-slate hover:border-graphite/45 hover:text-graphite'
                }`}
              >
                {m.label}
                {m.key === active && <span className="ml-2 text-ember">•</span>}
              </button>
            </li>
          )
        })}
      </ul>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-10">
        {/* Крупная макро-структура выбранного материала + реальный круг */}
        <div className="relative overflow-hidden rounded-[1.5rem] border border-graphite/[0.08] bg-[radial-gradient(120%_100%_at_50%_0%,#FFFFFF_0%,#EFF3F4_55%,#E3EAEC_100%)] p-6 sm:p-8">
          <motion.div
            key={picked}
            initial={reduced ? undefined : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] as const }}
            className="flex flex-col gap-6 sm:flex-row sm:items-center"
          >
            <div className="min-w-0 flex-1 text-graphite">
              <MaterialTexture kind={picked} large />
            </div>
            {sample && (
              <a
                href={sample.href}
                className="group flex w-full shrink-0 flex-col items-center gap-2 sm:w-40"
                aria-label={`Открыть ${sample.model}`}
              >
                <span className="flex h-28 w-28 items-center justify-center rounded-full bg-porcelain shadow-[0_10px_24px_rgba(26,28,30,0.12)] ring-1 ring-graphite/[0.07] sm:h-32 sm:w-32">
                  <img
                    src={sample.image}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    className="h-[76%] w-[76%] object-contain transition-transform duration-500 ease-premium group-hover:scale-[1.05]"
                  />
                </span>
                <span className="text-center text-[0.8125rem] leading-snug text-slate transition-colors duration-300 group-hover:text-graphite">
                  {sample.model}
                </span>
              </a>
            )}
          </motion.div>
          <p className="mt-6 font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-titanium">
            Структура — условная графика принципа
          </p>
        </div>

        {/* Что это меняет в работе */}
        <motion.div
          key={`${picked}-text`}
          initial={reduced ? undefined : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.05, ease: [0.16, 1, 0.3, 1] as const }}
          className="flex flex-col justify-center"
        >
          <p className="font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-ember">{current.trait}</p>
          <p className="mt-3 text-[clamp(1.25rem,1.05rem+0.7vw,1.75rem)] leading-[1.15] tracking-tight text-graphite">
            {current.label}
          </p>
          <p className="mt-4 max-w-[46ch] text-[1rem] leading-relaxed text-ash">{current.body}</p>
          <dl className="mt-7 space-y-3 border-t border-graphite/[0.12] pt-5">
            <div className="flex items-baseline justify-between gap-6">
              <dt className="text-[0.875rem] text-slate">Где работает</dt>
              <dd className="text-right text-[0.9375rem] tracking-tight text-graphite">{current.use}</dd>
            </div>
            <div className="flex items-baseline justify-between gap-6">
              <dt className="text-[0.875rem] text-slate">Контакт с лаком</dt>
              <dd className="text-right text-[0.9375rem] tracking-tight text-graphite">{current.contact}</dd>
            </div>
          </dl>
        </motion.div>
      </div>
    </div>
  )
}

/* ───────────────────────── Роли внутри линейки ───────────────────────── */

export type RoleItem = {
  href: string
  image: string
  model: string
  /** Реальная характеристика «Тип» из прайса: тяжёлый рез / финиш и т. д. */
  role: string
  /** Реальная характеристика «Совместимость» из прайса. */
  compat?: string
  stage?: string
  active: boolean
}

/**
 * У каждого состава V-Range своя роль, и это НЕ четыре одинаковые карточки
 * с разным названием: и «Тип», и «Совместимость» здесь — реальные
 * характеристики позиции из прайса. Активный состав подсвечен, остальные
 * кликабельны.
 */
export function RoleLine({ items }: { items: RoleItem[] }) {
  const reduced = useReducedMotion()
  return (
    <ol className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item, i) => (
        <motion.li
          key={item.model}
          initial={reduced ? undefined : { opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] as const, delay: i * 0.09 }}
        >
          <a
            href={item.href}
            aria-current={item.active ? 'true' : undefined}
            className={`flex h-full flex-col rounded-2xl border p-5 transition-colors duration-300 ${
              item.active
                ? 'border-ember/50 bg-porcelain shadow-[0_0_0_1px_rgba(254,139,12,0.12)]'
                : 'border-graphite/[0.1] bg-hazeSurface hover:border-graphite/25'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-porcelain ring-1 ring-graphite/[0.07]">
                <img src={item.image} alt="" loading="lazy" decoding="async" className="h-[78%] w-[78%] object-contain" />
              </span>
              {/*
                Подпись стадии занимает две строки у одних составов и одну у
                других — фиксируем высоту, иначе карточки в ряду разъезжаются
                по вертикали и ряд выглядит собранным на глаз.
              */}
              <div className="min-w-0">
                <p className="truncate text-[0.9375rem] tracking-tight text-graphite">{item.model}</p>
                {item.stage && (
                  <p className="mt-0.5 min-h-[2.1em] font-mono text-[0.6875rem] uppercase leading-[1.05em] tracking-[0.14em] text-titanium">
                    {item.stage}
                  </p>
                )}
              </div>
            </div>
            <p className={`mt-4 text-[0.875rem] leading-snug ${item.active ? 'text-graphite' : 'text-slate'}`}>{item.role}</p>
            {item.compat && (
              <p className="mt-auto border-t border-graphite/[0.1] pt-3 text-[0.75rem] leading-relaxed text-titanium">
                Круги: {item.compat}
              </p>
            )}
          </a>
        </motion.li>
      ))}
    </ol>
  )
}

/* ───────────────────────── Дефект → абразив → результат ───────────────────────── */

export type DefectProcessData = {
  /** Реальные дефекты этой стадии — из официальной таблицы применения. */
  defects: string[]
  padLabel: string
  padImage: string
  compoundLabel: string
  compoundImage: string
  /** Что стадия реально даёт — формулировка из тех же данных, что и таблица применения. */
  resultNote: string
}

/**
 * Единственная в проекте схема, которая говорит не о механике, а о
 * ПРОЦЕССЕ: что было на панели, чем это снимают и что получают в итоге.
 * Левая и правая иллюстрации — намеренно условные (волны и рельефный
 * блик, а не фотографии конкретной панели): у нас нет исходной пары
 * «до/после» именно для этого состава, и подделывать её фотореалистично
 * означало бы выдать схему за реальный кейс. Средняя карточка — честная:
 * это те же кадры пасты и круга, что и в каталоге.
 */
export function DefectProcess({ defects, padLabel, padImage, compoundLabel, compoundImage, resultNote }: DefectProcessData) {
  const reduced = useReducedMotion()
  const desktop = useMediaQuery(DESKTOP_SCENE_QUERY)

  /*
   * Главная сцена страницы состава: панель исправляется РУКАМИ человека,
   * который её прокручивает. Слева поверхность с рисками, справа — рабочая
   * пара «состав + круг», которая по ходу прокрутки проходит по панели;
   * риски слабеют, блик выравнивается, и в конце остаётся ровное
   * отражение.
   *
   * ЧЕСТНОСТЬ. Панель — намеренно условная графика, а не фотография: пары
   * «до/после» именно для этого состава у нас нет, и подделывать её
   * фотореалистично значило бы выдать схему за реальный кейс. Кадры
   * состава и круга — настоящие, из каталога. Дефекты — из официальной
   * таблицы применения, а не придуманы под картинку.
   */
  const track = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: track,
    offset: desktop ? ['start start', 'end end'] : ['start 0.9', 'end 0.4'],
  })

  const defectOpacity = useTransform(scrollYProgress, [0.1, 0.8], [0.55, 0.05])
  const defectWidth = useTransform(scrollYProgress, [0.1, 0.8], [2.6, 0.6])
  const glossOpacity = useTransform(scrollYProgress, [0.25, 0.9], [0.06, 0.32])
  const glossScale = useTransform(scrollYProgress, [0.25, 0.95], [0.82, 1])
  /* Рабочая пара проходит по панели слева направо — это и есть «проход». */
  const headX = useTransform(scrollYProgress, [0.08, 0.86], ['4%', '78%'])
  const headOpacity = useTransform(scrollYProgress, [0.02, 0.12, 0.9, 0.98], [0, 1, 1, 0])
  const resultOpacity = useTransform(scrollYProgress, [0.55, 0.78], [0, 1])

  /** Панель лака: риски слабеют, ровный блик проступает. */
  const panel = (
    <div className="relative aspect-[16/10] w-full overflow-hidden rounded-[1.5rem] bg-[linear-gradient(150deg,#23262A_0%,#15171A_55%,#1E2226_100%)] sm:aspect-[16/9]">
      <svg viewBox="0 0 400 225" className="absolute inset-0 h-full w-full" role="img" aria-label="Условная схема: риски на лаке выводятся и остаётся ровное отражение">
        {/*
          Блик — мягкий градиент, а не сплошная заливка: плоское белое
          пятно читалось как серый прямоугольник поверх панели, а не как
          отражение на лаке.
        */}
        <defs>
          <radialGradient id="gloss-a" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
            <stop offset="55%" stopColor="#FFFFFF" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </radialGradient>
        </defs>
        <motion.ellipse
          cx="150"
          cy="72"
          rx="160"
          ry="58"
          fill="url(#gloss-a)"
          style={reduced ? { opacity: 0.26 } : { opacity: glossOpacity, scale: glossScale }}
        />
        <motion.ellipse
          cx="290"
          cy="164"
          rx="115"
          ry="38"
          fill="url(#gloss-a)"
          style={reduced ? { opacity: 0.14 } : { opacity: glossOpacity, scale: glossScale }}
        />
        {/* Риски — те, что выводит именно эта стадия */}
        {[52, 84, 116, 148, 180].map((y, i) => (
          <motion.path
            key={y}
            d={`M 24 ${y} Q 110 ${y - 16 + (i % 2) * 12}, 200 ${y} T 376 ${y}`}
            fill="none"
            stroke="#FFFFFF"
            strokeLinecap="round"
            style={reduced ? { opacity: 0.4, strokeWidth: 2 } : { opacity: defectOpacity, strokeWidth: defectWidth }}
          />
        ))}
      </svg>

      {/* Рабочая пара идёт по панели */}
      <motion.div
        style={reduced ? { left: '42%', opacity: 1 } : { left: headX, opacity: headOpacity }}
        className="absolute top-1/2 hidden -translate-y-1/2 sm:block"
      >
        <span className="relative flex h-24 w-24 items-center justify-center rounded-full bg-porcelain shadow-[0_12px_30px_rgba(0,0,0,0.35)] lg:h-28 lg:w-28">
          <img
            src={padImage}
            alt=""
            loading="lazy"
            decoding="async"
            className={`h-[78%] w-[78%] object-contain ${reduced ? '' : 'sm-spin-slow'}`}
          />
        </span>
      </motion.div>

      {/* Итог стадии подписывается только когда проход закончен */}
      <motion.p
        style={reduced ? { opacity: 1 } : { opacity: resultOpacity }}
        className="absolute bottom-4 left-4 right-4 rounded-full bg-porcelain px-4 py-2 text-center font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-graphite shadow-[0_8px_20px_rgba(0,0,0,0.28)] sm:bottom-6 sm:left-auto sm:right-6 sm:w-auto sm:text-left"
      >
        {resultNote}
      </motion.p>

      <span className="absolute left-4 top-4 rounded-full bg-graphite/70 px-3 py-1 font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-porcelain/80">
        Схема процесса
      </span>
    </div>
  )

  /** Что именно выводится и чем — рядом с панелью, а не отдельной карточкой. */
  const legend = (
    <div className="flex flex-col justify-center gap-7">
      <div>
        <p className="font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-titanium">Что выводится</p>
        <ul className="mt-3 space-y-2">
          {defects.map((d) => (
            <li key={d} className="flex gap-3 text-[0.9375rem] leading-snug text-graphite">
              <span aria-hidden className="mt-2.5 h-px w-4 shrink-0 bg-ember" />
              {d}
            </li>
          ))}
        </ul>
      </div>

      <div className="border-t border-graphite/[0.12] pt-6">
        <p className="font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-titanium">Чем</p>
        <div className="mt-4 flex items-center gap-4">
          <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-porcelain ring-1 ring-graphite/[0.08]">
            <img src={compoundImage} alt="" loading="lazy" decoding="async" className="h-[80%] w-[80%] object-contain" />
          </span>
          <span aria-hidden className="text-graphite/30">
            <ArrowGlyph />
          </span>
          <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[radial-gradient(120%_100%_at_50%_0%,#F4F7F8_0%,#E2EAEC_60%,#D2DDDF_100%)]">
            <img src={padImage} alt="" loading="lazy" decoding="async" className="h-[78%] w-[78%] object-contain" />
          </span>
        </div>
        <p className="mt-4 max-w-[42ch] text-[0.9375rem] leading-relaxed text-slate">
          {compoundLabel} работает в паре с кругом {padLabel}: состав задаёт абразив, круг — жёсткость и площадь
          контакта.
        </p>
      </div>
    </div>
  )

  /* Ниже 1024px sticky-сцена не помещается — та же история идёт стопкой. */
  if (reduced || !desktop) {
    return (
      <div ref={track} className="grid gap-8">
        {panel}
        {legend}
      </div>
    )
  }

  return (
    <div ref={track} className="relative" style={{ height: '230vh' }}>
      <div className="sticky top-0 flex h-[100svh] items-center pb-12 pt-24 lg:pt-28">
        <div className="grid w-full items-center gap-10 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:gap-14">
          {panel}
          {legend}
        </div>
      </div>
    </div>
  )
}

/* ───────────────────────── Путь энергии: управление → рабочая поверхность ───────────────────────── */

export type AssemblyItem = { label: string; note: string }

/**
 * Цепочка узлов от управления к рабочей поверхности — общими для всей
 * категории терминами (управление, привод, рабочий блок, крепление), а
 * не разрезом конкретного мотора: точной компоновки редуктора у вендора
 * в открытом доступе нет, и рисовать «внутреннее устройство EP830» было
 * бы подделкой. Карточки появляются по очереди слева направо — единожды,
 * без повторов при обратном скролле.
 */
export function AssemblyChain({ items }: { items: AssemblyItem[] }) {
  const reduced = useReducedMotion()
  const card = (i: number) =>
    reduced
      ? {}
      : {
          initial: { opacity: 0, y: 16 },
          whileInView: { opacity: 1, y: 0 },
          viewport: { once: true, amount: 0.4 },
          transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const, delay: i * 0.14 },
        }

  return (
    <div className="grid items-stretch gap-3 lg:grid-flow-col lg:auto-cols-fr">
      {items.map((item, i) => (
        <div key={item.label} className="contents">
          <motion.div {...card(i)} className="flex flex-col rounded-2xl border border-graphite/[0.1] bg-hazeSurface p-5">
            <span className="font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-titanium">{String(i + 1).padStart(2, '0')}</span>
            <p className="mt-2 text-[0.9375rem] tracking-tight text-graphite">{item.label}</p>
            <p className="mt-2 text-[0.8125rem] leading-relaxed text-slate">{item.note}</p>
          </motion.div>
          {i < items.length - 1 && (
            <div aria-hidden className="flex items-center justify-center text-graphite/25 lg:rotate-0 max-lg:rotate-90 max-lg:py-0.5">
              <ArrowGlyph />
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function ArrowGlyph() {
  return (
    <svg width="28" height="16" viewBox="0 0 28 16" fill="none" aria-hidden>
      <path d="M0 8H26M26 8L19 1M26 8L19 15" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
