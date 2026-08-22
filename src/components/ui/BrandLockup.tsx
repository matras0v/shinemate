type Props = {
  /** compact — для шапки, full — для футера и финальной сцены. */
  variant?: 'compact' | 'full'
  className?: string
}

/**
 * Замок бренда.
 *
 * Сайт принадлежит «Правильным Технологиям», ShineMate — представляемая марка
 * оборудования. Поэтому знак и название компании идут первыми, а ShineMate
 * стоит за разделителем как продуктовый бренд.
 */
export function BrandLockup({ variant = 'compact', className = '' }: Props) {
  if (variant === 'full') {
    return (
      <div className={`flex items-start gap-4 ${className}`}>
        <img
          src="brand/logo-mark.webp"
          alt=""
          aria-hidden
          width={513}
          height={511}
          loading="lazy"
          className="h-14 w-14 shrink-0"
        />
        <div className="min-w-0 pt-0.5">
          <p className="text-[0.9375rem] font-medium uppercase leading-[1.15] tracking-[0.08em]">
            Правильные
            <br />
            Технологии
          </p>
          <p className="mt-2 text-[0.8125rem] leading-relaxed text-graphite/50">
            ShineMate — профессиональное оборудование
          </p>
        </div>
      </div>
    )
  }

  return (
    <span className={`flex items-center gap-3 ${className}`}>
      <img
        src="brand/logo-mark.webp"
        alt=""
        aria-hidden
        width={513}
        height={511}
        className="h-9 w-9 shrink-0 md:h-10 md:w-10"
      />
      <span className="flex min-w-0 flex-col leading-none">
        <span className="text-[0.6875rem] font-medium uppercase tracking-[0.13em] text-graphite md:text-xs">
          Правильные&nbsp;Технологии
        </span>
        <span className="mt-1 text-[0.6875rem] uppercase tracking-[0.13em] text-graphite/40 md:text-xs">
          ShineMate
        </span>
      </span>
    </span>
  )
}
