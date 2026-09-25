import { useEffect, useState } from 'react'

import { CatalogView } from './components/catalog/CatalogView'
import { ProductPage } from './components/catalog/ProductPage'
import { CookieNotice } from './components/CookieNotice'
import { Footer } from './components/Footer'
import { Header } from './components/Header'
import { LegalOverlay } from './components/LegalOverlay'
import { SearchOverlay } from './components/SearchOverlay'
import { CategoryNavigator } from './components/scenes/CategoryNavigator'
import { Contact } from './components/scenes/Contact'
import { Engineering } from './components/scenes/Engineering'
import { FeaturedModels } from './components/scenes/FeaturedModels'
import { Hero } from './components/scenes/Hero'
import { BrandStory } from './components/scenes/BrandStory'
import { PolishingProcess } from './components/scenes/PolishingProcess'
import { ProductObject } from './components/scenes/ProductObject'
import { TechFeatures } from './components/scenes/TechFeatures'
import { ReflectionReveal } from './components/scenes/ReflectionReveal'
import { ScrollStage } from './components/scenes/ScrollStage'
import { SystemAssembly } from './components/scenes/SystemAssembly'
import { Wholesale } from './components/scenes/Wholesale'
import { ScrollProgress } from './components/ui/ScrollProgress'
import { categories, categoryTitle, products } from './data/catalog'
import { dataProcessingConsent, privacyPolicy, type LegalDocument } from './data/legal'
import { LeadProvider } from './lib/leadContext'
import { routePath, useLinkInterceptor, useRoute } from './lib/router'

/** Продакшен-домен — единственный, на который должны указывать canonical/JSON-LD/OG. */
const SITE_ORIGIN = 'https://shinemate-russia.ru'

const DEFAULT_DESCRIPTION =
  'ShineMate Россия — полировальное оборудование: роторные и эксцентриковые машинки, круги и пасты для детейлинга. Официальный дистрибьютор ShineMate в России.'

/**
 * Как категория реально ищется живым человеком — не выдуманные факты, а
 * естественная формулировка того, что и так верно про раздел. Нужно для
 * <title>/description: раньше у каталога и всех товаров был один и тот же
 * тег на весь сайт, и по запросам вроде «эксцентриковая машинка для
 * полировки» или «твёрдый круг для полировки» поисковик/Алиса не могли
 * понять, какая именно страница сайта отвечает на конкретный запрос.
 */
const CATEGORY_SEARCH_PHRASE: Record<string, string> = {
  rotary: 'роторные машинки для полировки',
  da: 'эксцентриковые машинки для полировки',
  sander: 'шлифовальные машинки',
  cordless: 'аккумуляторные машинки для полировки и шлифования',
  plates: 'подложки и адаптеры для полировальных машинок',
  pads: 'полировальные круги — поролон, микрофибра, шерсть',
  chemistry: 'полировальные пасты V-Range',
  workshop: 'аксессуары для полировки и детейлинга',
}

function truncate(text: string, max: number) {
  if (text.length <= max) return text
  const cut = text.slice(0, max)
  return cut.slice(0, cut.lastIndexOf(' ')) + '…'
}

function setMetaDescription(content: string) {
  document.querySelector('meta[name="description"]')?.setAttribute('content', content)
}

/**
 * Canonical на продакшен-домен для КАЖДОГО маршрута — Google рендерит
 * SPA и учитывает тег, проставленный уже после загрузки (в отличие от
 * OG-превью в мессенджерах, которые JS не выполняют и видят только
 * статичный index.html — поэтому OG-теги ниже остаются общими на весь
 * сайт, а не по разделу: без серверного рендеринга честно сделать их
 * per-page нельзя, не выдавая одно за другое).
 */
function setCanonical(path: string) {
  let link = document.querySelector<HTMLLinkElement>('link[rel="canonical"]')
  if (!link) {
    link = document.createElement('link')
    link.rel = 'canonical'
    document.head.appendChild(link)
  }
  link.href = `${SITE_ORIGIN}${path === '/' ? '' : path}`
}

/** JSON-LD по id тега — null убирает тег, если для маршрута он не применим. */
function setJsonLd(id: string, data: object | null) {
  const existing = document.getElementById(id)
  if (!data) {
    existing?.remove()
    return
  }
  const script = existing instanceof HTMLScriptElement ? existing : document.createElement('script')
  script.id = id
  script.type = 'application/ld+json'
  script.textContent = JSON.stringify(data)
  if (!existing) document.head.appendChild(script)
}

export default function App() {
  const [route] = useRoute()
  useLinkInterceptor()
  const [searchOpen, setSearchOpen] = useState(false)
  const [legalDoc, setLegalDoc] = useState<LegalDocument | null>(null)
  const productForRoute = route.name === 'product' ? products.find((p) => p.slug === route.slug) : undefined

  // Заголовок вкладки и meta description следуют за разделом.
  //
  // Раньше description был один статичный тег на весь сайт (из index.html)
  // — и каталог, и любая карточка товара отдавали в поиск/Алису одно и то
  // же общее описание. Человек ищет не «ShineMate» вообще, а «роторная
  // машинка для полировки» или конкретную модель — с одним тегом на сайт
  // ни один раздел не мог ответить на конкретный запрос точнее остальных.
  useEffect(() => {
    setCanonical(routePath(route))

    if (route.name === 'catalog') {
      const category = route.category === 'all' ? undefined : categories.find((c) => c.id === route.category)
      document.title = category ? `${category.title} ShineMate — каталог` : 'Каталог ShineMate'
      setMetaDescription(
        category
          ? `${category.title} ShineMate: ${CATEGORY_SEARCH_PHRASE[category.id] ?? category.title.toLowerCase()}. ${category.subtitle} Официальный дистрибьютор ShineMate в России.`
          : DEFAULT_DESCRIPTION,
      )
      setJsonLd(
        'ld-breadcrumb',
        category
          ? {
              '@context': 'https://schema.org',
              '@type': 'BreadcrumbList',
              itemListElement: [
                { '@type': 'ListItem', position: 1, name: 'ShineMate', item: SITE_ORIGIN },
                { '@type': 'ListItem', position: 2, name: 'Каталог', item: `${SITE_ORIGIN}/catalog` },
                { '@type': 'ListItem', position: 3, name: category.title, item: `${SITE_ORIGIN}/catalog/${category.id}` },
              ],
            }
          : {
              '@context': 'https://schema.org',
              '@type': 'BreadcrumbList',
              itemListElement: [
                { '@type': 'ListItem', position: 1, name: 'ShineMate', item: SITE_ORIGIN },
                { '@type': 'ListItem', position: 2, name: 'Каталог', item: `${SITE_ORIGIN}/catalog` },
              ],
            },
      )
      setJsonLd('ld-product', null)
    } else if (route.name === 'product') {
      if (productForRoute) {
        document.title = `${productForRoute.model} — ${categoryTitle(productForRoute.category)} ShineMate`
        setMetaDescription(truncate(`${productForRoute.model} (${productForRoute.kind}) ShineMate. ${productForRoute.lead}`, 300))

        const catTitle = categoryTitle(productForRoute.category)
        setJsonLd('ld-breadcrumb', {
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'ShineMate', item: SITE_ORIGIN },
            { '@type': 'ListItem', position: 2, name: 'Каталог', item: `${SITE_ORIGIN}/catalog` },
            { '@type': 'ListItem', position: 3, name: catTitle, item: `${SITE_ORIGIN}/catalog/${productForRoute.category}` },
            { '@type': 'ListItem', position: 4, name: productForRoute.model, item: `${SITE_ORIGIN}${routePath(route)}` },
          ],
        })

        // Offer — только когда есть реальная фиксированная цена. У
        // позиции «по запросу» (см. /admin, src/lib/overrides.ts)
        // числовой цены не существует в природе — не подставляем
        // выдуманную offers-цену просто чтобы схема была «полнее».
        const variant = productForRoute.variants[0]
        const offers =
          variant && variant.status !== 'on_request'
            ? {
                '@type': 'Offer',
                priceCurrency: 'RUB',
                price: variant.rrp,
                availability:
                  variant.status === 'out_of_stock' ? 'https://schema.org/OutOfStock' : 'https://schema.org/InStock',
                url: `${SITE_ORIGIN}${routePath(route)}`,
              }
            : undefined
        setJsonLd('ld-product', {
          '@context': 'https://schema.org',
          '@type': 'Product',
          name: productForRoute.model,
          sku: variant?.sku,
          category: catTitle,
          description: productForRoute.lead,
          image: `${SITE_ORIGIN}/${productForRoute.image}`,
          brand: { '@type': 'Brand', name: 'ShineMate' },
          ...(offers ? { offers } : {}),
        })
      } else {
        document.title = 'ShineMate'
        setMetaDescription(DEFAULT_DESCRIPTION)
        setJsonLd('ld-breadcrumb', null)
        setJsonLd('ld-product', null)
      }
    } else {
      document.title =
        route.name === 'about'
          ? 'О ShineMate'
          : route.name === 'technologies'
            ? 'Технологии ShineMate'
            : route.name === 'contacts'
              ? 'Контакты ShineMate'
              : route.name === 'wholesale'
                ? 'Оптовикам — ShineMate'
                : 'ShineMate Россия — официальный дистрибьютор оборудования для полировки'
      setMetaDescription(DEFAULT_DESCRIPTION)
      setJsonLd('ld-breadcrumb', null)
      setJsonLd('ld-product', null)
    }
  }, [route, productForRoute])

  // Cmd/Ctrl+K открывает поиск из любого места сайта.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setSearchOpen(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <LeadProvider>
      <ScrollProgress />
      <Header onHome={route.name === 'home'} onOpenSearch={() => setSearchOpen(true)} />

      {route.name === 'catalog' ? (
        <main>
          <CatalogView category={route.category} />
        </main>
      ) : route.name === 'product' ? (
        <main>
          {/*
            Прямой заход по URL на несуществующий/переименованный slug —
            честный возврат в каталог вместо пустой страницы. products
            генерируются из прайса при сборке, так что это не должно
            случаться в норме, но ссылка могла устареть.
          */}
          {productForRoute ? (
            <ProductPage product={productForRoute} />
          ) : (
            <CatalogView category="all" />
          )}
        </main>
      ) : route.name === 'about' ? (
        // Ни один блок с главной здесь не повторяется: клиент отметил, что
        // переход в пункт меню, где показывают уже пролистанное, лишён
        // смысла. BrandStory — отдельный материал: из чего собрана система,
        // совместимость внутри линейки и сферы применения.
        <main className="pt-[5.25rem]">
          <BrandStory />
        </main>
      ) : route.name === 'technologies' ? (
        // Тоже полностью своё наполнение: карта подбора связки по стадиям
        // обработки и технологии самого оборудования. Про завод здесь
        // ничего нет — сайт дилерский, мы продаём, а не производим.
        <main className="pt-[5.25rem]">
          <PolishingProcess />
          <TechFeatures />
        </main>
      ) : route.name === 'contacts' ? (
        <main className="pt-[5.25rem]">
          <Contact standalone onOpenConsent={() => setLegalDoc(dataProcessingConsent)} />
        </main>
      ) : route.name === 'wholesale' ? (
        <main className="pt-[5.25rem]">
          <Wholesale onOpenConsent={() => setLegalDoc(dataProcessingConsent)} />
        </main>
      ) : (
        <main>
          <Hero />
          <ProductObject />
          <ReflectionReveal />
          <CategoryNavigator />
          <ScrollStage />
          <SystemAssembly />
          <FeaturedModels />
          <Engineering />
          <Contact onOpenConsent={() => setLegalDoc(dataProcessingConsent)} />
        </main>
      )}

      <Footer onOpenDoc={setLegalDoc} />
      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
      <LegalOverlay document={legalDoc} onClose={() => setLegalDoc(null)} />
      <CookieNotice onOpenPrivacy={() => setLegalDoc(privacyPolicy)} />
    </LeadProvider>
  )
}
