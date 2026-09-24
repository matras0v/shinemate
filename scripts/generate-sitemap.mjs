/**
 * Генерирует public/sitemap.xml перед сборкой — реальные маршруты
 * SPA (главная, разделы каталога, товары, информационные страницы) на
 * продакшен-домене. Источник — тот же catalog.ts/router.ts, что и сам
 * сайт, поэтому список не может разойтись с реальными страницами.
 *
 * Не включает: /admin, служебные и тестовые пути, 404-заглушку —
 * их в приложении просто нет как отдельных проиндексируемых URL.
 */
import { execFileSync } from 'node:child_process'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const DOMAIN = 'https://shinemate-russia.ru'

const out = mkdtempSync(join(tmpdir(), 'sitemap-'))
const bundle = join(out, 'catalog.mjs')
execFileSync(
  join(root, 'node_modules/.bin/esbuild'),
  [join(root, 'src/data/catalog.ts'), '--bundle', '--format=esm', '--platform=node', `--outfile=${bundle}`],
  { stdio: 'pipe' },
)
const { products, categories } = await import(bundle)

const urls = []
const add = (path, changefreq, priority) => urls.push({ loc: `${DOMAIN}${path}`, changefreq, priority })

add('/', 'weekly', '1.0')
add('/catalog', 'weekly', '0.9')
for (const c of categories) add(`/catalog/${c.id}`, 'weekly', '0.8')
for (const p of products) add(`/catalog/${p.category}/${p.slug}`, 'weekly', '0.7')
add('/about', 'monthly', '0.5')
add('/technologies', 'monthly', '0.5')
add('/contacts', 'monthly', '0.5')
add('/wholesale', 'monthly', '0.5')

const body = urls
  .map((u) => `  <url>\n    <loc>${u.loc}</loc>\n    <changefreq>${u.changefreq}</changefreq>\n    <priority>${u.priority}</priority>\n  </url>`)
  .join('\n')

const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`

writeFileSync(join(root, 'public/sitemap.xml'), xml, 'utf8')
console.log(`[sitemap] ok: ${urls.length} URL (${products.length} товаров, ${categories.length} разделов)`)
