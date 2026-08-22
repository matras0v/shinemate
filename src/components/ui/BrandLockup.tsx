type Props = {
  /** compact — для шапки, full — для футера и финальной сцены. */
  variant?: 'compact' | 'full'
  className?: string
}

/**
 * Замок бренда.
 *
 * Сайт — самостоятельный продукт под брендом ShineMate, без сторонней
 * фирменной графики: используется только текстовый вордмарк.
 */
export function BrandLockup({ variant = 'compact', className = '' }: Props) {
  if (variant === 'full') {
    return (
      <div className={className}>
        <p className="text-[1.0625rem] font-medium uppercase leading-none tracking-[0.1em]">
          ShineMate
        </p>
        <p className="mt-2 text-[0.8125rem] leading-relaxed text-graphite/50">
          Профессиональное полировальное оборудование
        </p>
      </div>
    )
  }

  return (
    <span className={`flex min-w-0 flex-col leading-none ${className}`}>
      <span className="text-[0.8125rem] font-medium uppercase tracking-[0.13em] text-graphite md:text-sm">
        ShineMate
      </span>
      <span className="mt-1 text-[0.625rem] uppercase tracking-[0.13em] text-graphite/40 md:text-[0.6875rem]">
        Профессиональное оборудование
      </span>
    </span>
  )
}
