import { useCallback, useEffect, useState } from 'react'

import { categories, type CategoryId } from '../data/catalog'

export type Route =
  | { name: 'home' }
  | { name: 'catalog'; category: CategoryId | 'all' }

const CATEGORY_IDS = categories.map((c) => c.id)

/**
 * Подпуть, под которым реально живёт сайт: "/" в dev, "/shinemate/" на
 * GitHub Pages (см. vite.config.ts). Все остальные функции этого файла
 * работают с «прикладными» путями вида "/catalog/rotary" — как если бы
 * сайт был в корне домена — и только здесь, в двух функциях ниже,
 * происходит перевод в реальный путь браузера и обратно. Компоненты
 * (href="catalog/rotary" и т.д.) про это вообще не знают.
 */
const BASE = import.meta.env.BASE_URL

/** Прикладной путь ("/", "/catalog/rotary") → реальный путь браузера. */
function withBase(appPath: string): string {
  if (appPath === '/') return BASE
  return BASE + appPath.replace(/^\/+/, '')
}

/** Реальный путь браузера → прикладной путь. Обратная операция withBase. */
function stripBase(realPath: string): string {
  if (!realPath.startsWith(BASE)) return realPath
  const rest = realPath.slice(BASE.length)
  return '/' + rest
}

export function parseRoute(pathname: string): Route {
  const appPath = stripBase(pathname)
  const parts = appPath.replace(/^\/+|\/+$/g, '').split('/')
  if (parts[0] !== 'catalog') return { name: 'home' }
  const slug = parts[1]
  const category = CATEGORY_IDS.find((id) => id === slug)
  return { name: 'catalog', category: category ?? 'all' }
}

export function routePath(route: Route) {
  if (route.name === 'home') return '/'
  return route.category === 'all' ? '/catalog' : `/catalog/${route.category}`
}

const EVENT = 'app:navigate'

/** Переход без перезагрузки. Принимает прикладной путь, пишет в адресную строку реальный. */
export function navigate(appPath: string, options: { replace?: boolean } = {}) {
  const realPath = withBase(appPath)
  if (options.replace) window.history.replaceState({}, '', realPath)
  else window.history.pushState({}, '', realPath)
  window.dispatchEvent(new Event(EVENT))
}

const reducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * Скроллит к якорю в пределах уже открытой страницы — курсивный,
 * анимированный переход, потому что layout здесь уже стабилен.
 */
function scrollToHash(hash: string) {
  document.getElementById(hash)?.scrollIntoView({
    behavior: reducedMotion() ? 'instant' : 'smooth',
    block: 'start',
  })
}

/**
 * Прыгает к якорю сразу после смены маршрута.
 *
 * Здесь обязательно `behavior: 'instant'`, а не 'auto': в index.css на
 * <html> стоит глобальный `scroll-behavior: smooth`, и спецификация
 * scrollIntoView предписывает 'auto' брать поведение именно из этого
 * CSS-свойства — то есть 'auto' здесь тихо превращался бы в многосекундный
 * плавный скролл через всю страницу. Пока он идёт, пользователь смотрит на
 * hero и не понимает, что переход вообще случился — ровно так когда-то и
 * выглядел баг «кнопка отправляет на hero». 'instant' обходит CSS и прыгает
 * без анимации, как и должен вести себя переход между разделами.
 *
 * Секции ещё нет в DOM в момент вызова (маршрут только что переключился) —
 * ждём реального рендера, прежде чем её искать. Опрос идёт через setTimeout,
 * а не requestAnimationFrame: браузеры приостанавливают rAF для неактивных
 * или свёрнутых вкладок, а таймер сработает в любом случае (в фоне — просто
 * с задержкой из-за троттлинга, но не бесконечно).
 */
function scrollToHashAfterNavigate(hash: string, attemptsLeft = 30) {
  const el = document.getElementById(hash)
  if (!el) {
    if (attemptsLeft > 0) setTimeout(() => scrollToHashAfterNavigate(hash, attemptsLeft - 1), 16)
    return
  }
  el.scrollIntoView({ behavior: 'instant', block: 'start' })
}

/**
 * Единая точка перехода для ЛЮБОЙ внутренней ссылки — обычной или с якорем.
 * Принимает прикладной путь ("/catalog/rotary", "/#contacts", "/").
 *
 * Раньше ссылки вида "/#contacts" работали только там, где отдельный
 * компонент (Header) вручную вызывал scrollIntoView. Везде остальном клик
 * уходил в делегированный перехватчик, который умел лишь менять путь и
 * ничего не знал про якоря — переход с каталога на "/#contacts" тихо
 * перекидывал на верх главной страницы вместо раздела контактов. Теперь
 * Header, перехватчик и любой будущий CTA используют одну эту функцию,
 * поэтому баг не может вернуться из-за забытого частного случая.
 */
export function navigateTo(href: string) {
  const hashIndex = href.indexOf('#')
  if (hashIndex === -1) {
    navigate(href)
    return
  }

  const appPath = href.slice(0, hashIndex) || '/'
  const hash = href.slice(hashIndex + 1)
  const realPath = withBase(appPath)
  const onSamePath = realPath === window.location.pathname

  if (onSamePath) {
    window.history.replaceState({}, '', realPath + '#' + hash)
    scrollToHash(hash)
    return
  }

  navigate(appPath)
  scrollToHashAfterNavigate(hash)
}

export function useRoute(): [Route, (path: string) => void] {
  const [route, setRoute] = useState<Route>(() => parseRoute(window.location.pathname))

  useEffect(() => {
    const sync = () => setRoute(parseRoute(window.location.pathname))
    window.addEventListener('popstate', sync)
    window.addEventListener(EVENT, sync)
    return () => {
      window.removeEventListener('popstate', sync)
      window.removeEventListener(EVENT, sync)
    }
  }, [])

  const go = useCallback((path: string) => navigateTo(path), [])
  return [route, go]
}

/**
 * Перехватывает клики по внутренним ссылкам, чтобы обычные <a href="catalog">
 * и <a href="#contacts"> работали как переходы внутри приложения — вместе
 * со скроллом к якорю — и оставались правым кликом открываемыми в новой
 * вкладке.
 *
 * Ссылки в разметке пишутся БЕЗ ведущего слэша (href="catalog/rotary",
 * href="#contacts", href=".") — это осознанно: браузер резолвит их через
 * <base> (см. index.html), и поэтому «открыть в новой вкладке» / «копировать
 * адрес ссылки» работают корректно и на GitHub Pages под /shinemate/, и в
 * dev-режиме, без единой ручной подстановки префикса в JSX. Здесь для
 * SPA-перехода читаются уже РЕЗОЛВЛЕННЫЕ браузером anchor.origin/.pathname/
 * .hash — не сырой атрибут href — по той же причине.
 */
export function useLinkInterceptor() {
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
        return
      }
      const anchor = (e.target as HTMLElement | null)?.closest?.('a')
      if (!anchor) return
      if (anchor.target === '_blank') return
      // Разный origin — внешняя ссылка; для tel:/mailto: origin равен "null"
      // строкой, тоже не совпадёт. В обоих случаях отдаём клик браузеру.
      if (anchor.origin !== window.location.origin) return
      e.preventDefault()
      navigateTo(stripBase(anchor.pathname) + anchor.hash)
    }
    document.addEventListener('click', onClick)
    return () => document.removeEventListener('click', onClick)
  }, [])
}
