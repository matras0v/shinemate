type Props = {
  /** compact — для шапки, full — для футера и финальной сцены. */
  variant?: 'compact' | 'full'
  className?: string
}

/**
 * Замок бренда.
 *
 * Официальный лого-локап ShineMate (текст + силуэт авто), перекрашенный в
 * графит под светлые фоны сайта. Файл один на оба варианта — это не
 * иконка-квадрат, а горизонтальный вордмарк, поэтому масштабируется только
 * по высоте с сохранением пропорций.
 */
export function BrandLockup({ variant = 'compact', className = '' }: Props) {
  if (variant === 'full') {
    return (
      <div className={className}>
        <img
          src="brand/logo-shinemate.webp"
          alt="ShineMate"
          width={1650}
          height={1159}
          loading="lazy"
          className="h-16 w-auto"
        />
        <p className="mt-3 text-[0.8125rem] leading-relaxed text-slate">
          Профессиональное полировальное оборудование
        </p>
      </div>
    )
  }

  return (
    <img
      src="brand/logo-shinemate.webp"
      alt="ShineMate"
      width={1650}
      height={1159}
      className={`h-8 w-auto shrink-0 md:h-12 lg:h-14 ${className}`}
    />
  )
}
