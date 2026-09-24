/**
 * Генерирует public/admin-data/catalog-index.json — лёгкий список
 * SKU для /admin (PHP): список товаров для поиска и белый список
 * артикулов, которым вообще разрешено иметь override. Сам PHP не
 * читает TypeScript, поэтому источник истины (catalog.ts) экспортируется
 * сюда при каждой сборке — руками этот файл никогда не редактируется.
 *
 * Только то, что нужно для управления ценой/наличием: ни описаний,
 * ни характеристик, ни фото — это не дублирует каталог, а даёт админке
 * ровно необходимый минимум.
 */
import { execFileSync } from 'node:child_process'
import { mkdtempSync, writeFileSync, mkdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')

const out = mkdtempSync(join(tmpdir(), 'admin-catalog-'))
const bundle = join(out, 'catalog.mjs')
execFileSync(
  join(root, 'node_modules/.bin/esbuild'),
  [join(root, 'src/data/catalog.ts'), '--bundle', '--format=esm', '--platform=node', `--outfile=${bundle}`],
  { stdio: 'pipe' },
)
const { products, categoryTitle } = await import(bundle)

const items = []
for (const product of products) {
  for (const variant of product.variants) {
    items.push({
      sku: variant.sku,
      model: variant.model ?? product.model,
      variantLabel: product.variants.length > 1 ? variant.label : null,
      category: categoryTitle(product.category),
      slug: product.slug,
      rrp: variant.rrp,
      status: variant.status ?? 'in_stock',
    })
  }
}

items.sort((a, b) => a.model.localeCompare(b.model, 'ru') || a.sku.localeCompare(b.sku, 'ru'))

const dir = join(root, 'public/admin-data')
mkdirSync(dir, { recursive: true })
writeFileSync(join(dir, 'catalog-index.json'), JSON.stringify(items, null, 2) + '\n', 'utf8')
console.log(`[admin-catalog] ok: ${items.length} SKU экспортировано для /admin`)
