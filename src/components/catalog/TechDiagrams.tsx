import { useState } from 'react'

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

      {/* Сам круг: одновременно едет по орбите и вращается вокруг себя */}
      {/* transformOrigin инлайном: Tailwind не генерирует классы из
          вычисляемых строк, а центр орбиты здесь параметрический. */}
      <g
        className={reduced ? undefined : 'animate-[spin_6s_linear_infinite]'}
        style={{ transformOrigin: `${cx}px ${cy}px` }}
      >
        <g transform={`translate(${-orb},0)`}>
          <circle cx={cx} cy={cy} r={pad} fill={t.disc} />
          <circle cx={cx} cy={cy} r={pad} fill="none" stroke={t.ink} strokeOpacity={t.stroke} strokeWidth="1.8" />
          <circle cx={cx} cy={cy} r={pad * 0.62} fill={t.discTop} />
          <circle cx={cx} cy={cy} r={pad * 0.62} fill="none" stroke={t.ink} strokeOpacity={dark ? 0.28 : 0.16} strokeWidth="1.3" />
          <circle cx={cx} cy={cy} r="8" fill={EMBER} />
          <line x1={cx} y1={cy} x2={cx} y2={cy - pad + 8} stroke={EMBER} strokeWidth="3.5" strokeLinecap="round" />
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
  const steps = 4
  const values = Array.from({ length: steps }, (_, i) => Math.round(min + ((max - min) * i) / (steps - 1)))
  const notes = [
    'Разгон пасты, работа по кромкам',
    'Основная коррекция на панели',
    'Съём на плоскостях',
    'Вывод глянца и производительность',
  ]
  const [active, setActive] = useState(steps - 1)

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
    <div className="flex h-full w-full flex-col justify-center">
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
            <g key={v} onMouseEnter={() => setActive(i)} className="cursor-pointer">
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
            onClick={() => setActive(i)}
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
  const scaleMax = Math.max(peak ?? rated, ...family.map((f) => f.watts))
  const pct = (w: number) => Math.max((w / scaleMax) * 100, 4)
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
            <div className="absolute inset-y-0 left-0 rounded-full bg-ember/25" style={{ width: `${pct(peak)}%` }} />
          )}
          <div className="absolute inset-y-0 left-0 rounded-full bg-graphite" style={{ width: `${pct(rated)}%` }} />
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
          {family.map((f) => {
            const on = f.model === model
            return (
              <li key={f.model} className="flex items-center gap-4">
                <span className={`w-[7.5rem] shrink-0 truncate text-[0.8125rem] ${on ? 'text-graphite' : 'text-titanium'}`}>
                  {f.model}
                </span>
                <span className="h-2 flex-1 overflow-hidden rounded-full bg-graphite/[0.08]">
                  <span
                    className={`block h-full rounded-full ${on ? 'bg-ember' : 'bg-graphite/35'}`}
                    style={{ width: `${pct(f.watts)}%` }}
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
  return (
    <ol className="flex w-full flex-col gap-3 sm:flex-row sm:items-stretch">
      {items.map((item, i) => (
        <li key={item.label} className="flex flex-1 items-center gap-3 sm:flex-col sm:gap-0">
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
            <span className="absolute left-3 top-2.5 font-mono text-[0.625rem] tracking-[0.16em] text-titanium">
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
        </li>
      ))}
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

      {/* Блок аккумулятора */}
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
export function CutMeter({ grades, active }: { grades: number[]; active: number }) {
  const i = Math.max(grades.indexOf(active), 0)
  const pct = grades.length > 1 ? (i / (grades.length - 1)) * 100 : 0

  return (
    <div className="w-full">
      <div className="flex items-baseline justify-between font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-titanium">
        <span>Мягче · чище глянец</span>
        <span>Жёстче · больше съём</span>
      </div>
      {/*
        Маркер рисуется сразу в нужной позиции, без «доезда» по появлению
        во вьюпорте: если IntersectionObserver не сработает (фон вкладки,
        нестандартный браузер), шкала не должна остаться на нуле и врать
        про градацию круга.
      */}
      <div className="relative mt-5 h-[3px] w-full rounded-full bg-gradient-to-r from-graphite/15 via-graphite/30 to-graphite">
        <span
          aria-hidden
          className="absolute -top-[7px] h-[17px] w-[17px] rounded-full border-[3px] border-porcelain bg-ember transition-[left] duration-500 ease-premium"
          style={{ left: `calc(${pct}% - 8px)` }}
        />
      </div>
      <ol className="mt-6 flex flex-wrap gap-2">
        {grades.map((g) => (
          <li
            key={g}
            aria-current={g === active ? 'true' : undefined}
            className={`rounded-full border px-3.5 py-1.5 font-mono text-[0.75rem] tabular-nums ${
              g === active ? 'border-graphite bg-graphite text-porcelain' : 'border-graphite/[0.16] text-slate'
            }`}
          >
            T{g}
          </li>
        ))}
      </ol>
    </div>
  )
}

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
        return (
          <li key={item.model} className="flex flex-col items-center gap-3">
            <span
              aria-hidden
              className={`block rounded-full ${on ? 'bg-ember/20 ring-2 ring-ember' : 'bg-graphite/[0.08] ring-1 ring-graphite/20'}`}
              style={{ width: size, height: size }}
            />
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

/**
 * Исполнения позиции в реальном масштабе: диаметр круга на схеме
 * пропорционален диаметру из прайса. Цифры — из variants, ничего не
 * округляется «на глаз».
 */
export function SizeScale({ items }: { items: { label: string; note: string; mm: number }[] }) {
  const valid = items.filter((i) => i.mm > 0)
  const list = valid.length >= 2 ? valid : items
  const max = Math.max(...list.map((i) => i.mm || 1))
  return (
    <ul className="flex w-full flex-wrap items-end gap-x-8 gap-y-8">
      {list.map((item) => {
        const size = 36 + ((item.mm || max * 0.4) / max) * 92
        return (
          <li key={item.label + item.note} className="flex flex-col items-center gap-3">
            <span
              aria-hidden
              className="block rounded-full border border-graphite/25 bg-[radial-gradient(120%_100%_at_50%_0%,#FFFFFF_0%,#E7EDEE_100%)]"
              style={{ width: size, height: size }}
            />
            <span className="font-mono text-[0.8125rem] tabular-nums text-graphite">{item.label}</span>
            <span className="max-w-[12rem] text-center text-[0.75rem] leading-snug text-titanium">{item.note}</span>
          </li>
        )
      })}
    </ul>
  )
}
