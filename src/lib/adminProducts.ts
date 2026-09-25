import { categories, products, recountTotals, rebuildSearchIndex, type CategoryId, type Product, type Variant } from '../data/catalog'

/**
 * Товары, добавленные клиентом через /admin (api/catalog.php) — те же
 * push()+rebuildSearchIndex(), что и applyCatalogOverrides() для
 * variant.rrp/status: мутируем УЖЕ ИМПОРТИРОВАННЫЙ массив products из
 * catalog.ts до первого рендера (см. main.tsx), поэтому catalog/category
 * страницы, поиск, related-товары и роутинг по slug видят новые товары
 * без единой правки в самих компонентах — они уже читают products/
 * productsByCategory()/searchProducts() как обычно.
 *
 * api/catalog.php отдаёт ТОЛЬКО опубликованные товары и уже отфильтрован
 * от служебных полей на сервере, но здесь ВСЁ РАВНО валидируется форма
 * каждого поля — тот же принцип, что и у IMAGE_OVERRIDE_PATTERN в
 * overrides.ts: этот JSON лежит на изменяемом диске и приходит по сети,
 * а не из собранного бандла, поэтому мы ему не доверяем слепо.
 */

const CATEGORY_IDS = new Set(categories.map((c) => c.id))
const STATUSES = new Set(['in_stock', 'on_request', 'out_of_stock'])
// Тот же паттерн, что и у загруженных фото исполнений в overrides.ts —
// случайное server-side имя файла, никогда не произвольная строка.
const MEDIA_PATTERN = /^media\/admin-products\/[a-f0-9]{32}\.(webp|jpg)$/
const SAFE_IMAGE = (src: unknown): src is string =>
  typeof src === 'string' && (MEDIA_PATTERN.test(src) || /^catalog-media\/[a-z0-9-]+\.(webp|jpg|png)$/.test(src))

function isNonEmptyString(v: unknown): v is string {
  return typeof v === 'string' && v.trim() !== ''
}

function sanitizeVariant(raw: unknown): Variant | null {
  if (!raw || typeof raw !== 'object') return null
  const v = raw as Record<string, unknown>
  if (!isNonEmptyString(v.sku) || typeof v.rrp !== 'number' || !Number.isFinite(v.rrp) || v.rrp <= 0) return null
  const variant: Variant = {
    sku: v.sku.trim().slice(0, 60),
    label: isNonEmptyString(v.label) ? v.label.trim().slice(0, 80) : v.sku.trim(),
    rrp: v.rrp,
  }
  if (typeof v.status === 'string' && STATUSES.has(v.status)) variant.status = v.status as Variant['status']
  if (isNonEmptyString(v.axis1)) variant.axis1 = v.axis1.trim().slice(0, 40)
  if (isNonEmptyString(v.axis1Alt)) variant.axis1Alt = v.axis1Alt.trim().slice(0, 20)
  if (SAFE_IMAGE(v.image)) variant.image = v.image
  return variant
}

function sanitizeProduct(raw: unknown): Product | null {
  if (!raw || typeof raw !== 'object') return null
  const p = raw as Record<string, unknown>
  if (!isNonEmptyString(p.slug) || !isNonEmptyString(p.model) || !isNonEmptyString(p.category)) return null
  if (!CATEGORY_IDS.has(p.category as CategoryId)) return null
  // slug не должен совпасть с уже существующим товаром сборки (сервер уже
  // проверяет это при сохранении, но раз JSON лежит на изменяемом диске —
  // проверяем ещё раз здесь, а не доверяем слепо).
  if (products.some((existing) => existing.slug === p.slug)) return null
  if (!SAFE_IMAGE(p.image)) return null

  const variants = Array.isArray(p.variants) ? p.variants.map(sanitizeVariant).filter((v): v is Variant => v !== null) : []
  if (variants.length === 0) return null

  const specs = Array.isArray(p.specs)
    ? p.specs
        .filter((s): s is { label: unknown; value: unknown } => !!s && typeof s === 'object')
        .filter((s) => isNonEmptyString(s.label) && isNonEmptyString(s.value))
        .map((s) => ({ label: String(s.label).trim().slice(0, 60), value: String(s.value).trim().slice(0, 200) }))
    : []

  const product: Product = {
    slug: p.slug.trim().slice(0, 80),
    model: p.model.trim().slice(0, 150),
    category: p.category as CategoryId,
    kind: isNonEmptyString(p.kind) ? p.kind.trim().slice(0, 150) : p.model.trim(),
    lead: isNonEmptyString(p.lead) ? p.lead.trim().slice(0, 400) : '',
    specs,
    variants,
    image: p.image,
    imageWidth: typeof p.imageWidth === 'number' && p.imageWidth > 0 ? p.imageWidth : 900,
    imageHeight: typeof p.imageHeight === 'number' && p.imageHeight > 0 ? p.imageHeight : 900,
  }
  if (isNonEmptyString(p.description)) product.description = p.description.trim().slice(0, 4000)
  if (isNonEmptyString(p.axisLabel)) product.axisLabel = p.axisLabel.trim().slice(0, 30)
  if (Array.isArray(p.images)) {
    const extra = p.images.filter(SAFE_IMAGE)
    if (extra.length > 0) product.images = extra
  }
  return product
}

/**
 * Любая ошибка (сеть недоступна, endpoint не задеплоен, битый JSON) —
 * тихо оставляет каталог таким, каким он собран в бандле (см. п.29
 * брифа: сайт не должен зависеть от того, ответил ли этот endpoint).
 */
export async function applyAdminProducts(): Promise<void> {
  try {
    const controller = new AbortController()
    const timeout = window.setTimeout(() => controller.abort(), 3000)
    const res = await fetch('api/catalog.php', { cache: 'no-store', signal: controller.signal })
    window.clearTimeout(timeout)
    if (!res.ok) return

    const raw: unknown = await res.json()
    if (!raw || typeof raw !== 'object') return
    const body = raw as { ok?: unknown; products?: unknown }
    if (body.ok !== true || !Array.isArray(body.products)) return

    let added = false
    for (const item of body.products) {
      const product = sanitizeProduct(item)
      if (product) {
        products.push(product)
        added = true
      }
    }
    if (added) {
      rebuildSearchIndex()
      recountTotals()
    }
  } catch {
    // см. комментарий выше
  }
}
