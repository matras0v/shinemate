import { useEffect, useState } from 'react'

/**
 * Подписка на CSS-медиазапрос из React.
 *
 * Нужна там, где от ширины зависит не оформление, а САМА МЕХАНИКА сцены:
 * длинные sticky-сцены с пошаговой сборкой имеют смысл на большом экране,
 * а на телефоне тот же блок не помещается в высоту экрана и начинает
 * перекрывать соседние секции. Такое решение нельзя принять одними
 * классами Tailwind — нужен рендер другой разметки.
 *
 * Стартовое значение читается синхронно, чтобы первый кадр не мигал
 * «десктопной» версткой на телефоне.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(query).matches,
  )

  useEffect(() => {
    const mq = window.matchMedia(query)
    const sync = () => setMatches(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [query])

  return matches
}

/** Экран, на котором длинные sticky-сцены действительно помещаются. */
export const DESKTOP_SCENE_QUERY = '(min-width: 1024px)'
