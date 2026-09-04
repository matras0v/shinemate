/**
 * Проверка целостности каталога перед сборкой.
 *
 * Ловит ровно тот класс ошибок, из-за которого на странице микрофибры
 * оставался «Объём ведра 20 л»: характеристика одного предмета,
 * показанная у другого. Проверка идёт по ИСХОДНИКУ данных, поэтому
 * ошибка видна до деплоя, а не на живом сайте.
 *
 * Запускается в npm run build. Падение = сборка не проходит.
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')

/* Данные — TypeScript, поэтому сначала собираем их в один JS-модуль. */
const out = mkdtempSync(join(tmpdir(), 'catalog-'))
const bundle = join(out, 'catalog.mjs')
execFileSync(
  join(root, 'node_modules/.bin/esbuild'),
  [join(root, 'src/data/catalog.ts'), '--bundle', '--format=esm', '--platform=node', `--outfile=${bundle}`],
  { stdio: 'pipe' },
)
const { products, resolveProductView } = await import(bundle)

const errors = []
const warn = []

/**
 * Характеристики, которые физически относятся только к своему типу
 * товара. Ключ — метка характеристики, значение — как выглядит товар,
 * которому она может принадлежать.
 */
const SPEC_OWNER = [
  { label: /^Объём ведра$/i, allowed: /ведро/i, what: 'объём ведра' },
  { label: /^Градация$/i, allowed: /круг|поролон|микрофибр|шерст/i, what: 'градация круга' },
  { label: /^Ход эксцентрика$/i, allowed: /машинка|полировальн|шлифовальн/i, what: 'ход эксцентрика' },
  { label: /^Резьба$/i, allowed: /подложк|машинка|адаптер|удлинител|вал/i, what: 'резьба' },
  { label: /^Ёмкость$|^Аккумулятор$/i, allowed: /аккумулятор|машинка|зарядн|комплект/i, what: 'ёмкость аккумулятора' },
]

for (const product of products) {
  const label = (v) => `${product.slug}${v ? ` / ${v.sku}` : ''}`

  if (!product.variants.length) errors.push(`${label()}: нет ни одного исполнения`)

  const skus = new Set()
  for (const v of product.variants) {
    if (skus.has(v.sku)) errors.push(`${label(v)}: артикул повторяется внутри позиции`)
    skus.add(v.sku)
    if (!(v.rrp > 0)) errors.push(`${label(v)}: РРЦ отсутствует или не положительная`)
  }

  /* Проверяем КАЖДОЕ исполнение так, как его увидит пользователь. */
  for (const v of product.variants) {
    const view = resolveProductView(product, v)
    const identity = `${view.model} ${view.kind}`

    for (const rule of SPEC_OWNER) {
      const hit = view.specs.find((s) => rule.label.test(s.label))
      if (hit && !rule.allowed.test(identity)) {
        errors.push(
          `${label(v)}: у «${view.model} — ${view.kind}» показывается ${rule.what} («${hit.label}: ${hit.value}»)`,
        )
      }
    }

    if (!view.model || !view.kind || !view.lead) {
      errors.push(`${label(v)}: пустое название, подзаголовок или описание`)
    }
    if (!view.image) errors.push(`${label(v)}: нет изображения`)
  }

  /*
   * Если исполнения — разные предметы (у них свои названия), то каждому
   * нужен и свой набор характеристик: иначе на экране снова окажется
   * чужая строка.
   */
  const isGroup = product.variants.some((v) => v.model)
  if (isGroup) {
    for (const v of product.variants) {
      if (!v.specs) warn.push(`${label(v)}: исполнение с собственным названием, но без своих характеристик`)
    }
  }
}

/* Уникальность slug по всему каталогу — маршруты не должны конфликтовать. */
const seen = new Set()
for (const p of products) {
  if (seen.has(p.slug)) errors.push(`${p.slug}: slug повторяется`)
  seen.add(p.slug)
}

if (warn.length) {
  console.warn(`\n[catalog] предупреждений: ${warn.length}`)
  warn.forEach((w) => console.warn('  ! ' + w))
}

if (errors.length) {
  console.error(`\n[catalog] ОШИБОК: ${errors.length}`)
  errors.forEach((e) => console.error('  × ' + e))
  process.exit(1)
}

console.log(`[catalog] ok: ${products.length} позиций, ${products.reduce((n, p) => n + p.variants.length, 0)} исполнений`)
