import { products, type Variant } from '../data/catalog'

/**
 * Оперативные правки каталога с /admin (REG.RU, PHP) — только цена и
 * наличие, по SKU исполнения. Артикул, характеристики, фото, состав —
 * из catalog.ts, он остаётся единственным источником истины.
 */
type Override = {
  price?: number
  status?: 'in_stock' | 'on_request' | 'out_of_stock'
}

const STATUSES = new Set(['in_stock', 'on_request', 'out_of_stock'])

/**
 * Забирает data/catalog-overrides.json и мутирует УЖЕ ИМПОРТИРОВАННЫЕ
 * объекты variant — их держит единственный модуль-синглтон catalog.ts,
 * поэтому любой компонент, читающий variant.rrp/variant.status
 * ПОСЛЕ этого вызова, увидит применённое значение без единой правки в
 * самих компонентах. Вызывается один раз до первого рендера (main.tsx).
 *
 * Любая ошибка — сеть недоступна, файла нет, битый JSON, значение не
 * прошло валидацию — тихо оставляет каталог таким, каким он собран в
 * бандле. Сайт не должен зависеть от того, ответил ли этот файл.
 */
export async function applyCatalogOverrides(): Promise<void> {
  try {
    const controller = new AbortController()
    const timeout = window.setTimeout(() => controller.abort(), 3000)
    const res = await fetch('data/catalog-overrides.json', {
      cache: 'no-store',
      signal: controller.signal,
    })
    window.clearTimeout(timeout)
    if (!res.ok) return

    const raw: unknown = await res.json()
    if (!raw || typeof raw !== 'object') return
    const overrides = raw as Record<string, unknown>

    const bySku = new Map<string, Variant>()
    for (const product of products) {
      for (const variant of product.variants) bySku.set(variant.sku, variant)
    }

    for (const [sku, value] of Object.entries(overrides)) {
      const variant = bySku.get(sku)
      if (!variant || !value || typeof value !== 'object') continue
      const o = value as Override

      if (typeof o.price === 'number' && Number.isFinite(o.price) && o.price >= 0) {
        variant.rrp = o.price
      }
      if (typeof o.status === 'string' && STATUSES.has(o.status)) {
        variant.status = o.status as Variant['status']
      }
    }
  } catch {
    // см. комментарий выше — молча остаёмся на статичных данных
  }
}
