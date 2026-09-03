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
import { Wholesale } from './components/scenes/Wholesale'
import { ScrollProgress } from './components/ui/ScrollProgress'
import { products } from './data/catalog'
import { dataProcessingConsent, privacyPolicy, type LegalDocument } from './data/legal'
import { LeadProvider } from './lib/leadContext'
import { useLinkInterceptor, useRoute } from './lib/router'

export default function App() {
  const [route] = useRoute()
  useLinkInterceptor()
  const [searchOpen, setSearchOpen] = useState(false)
  const [legalDoc, setLegalDoc] = useState<LegalDocument | null>(null)
  const productForRoute = route.name === 'product' ? products.find((p) => p.slug === route.slug) : undefined

  // Заголовок вкладки следует за разделом.
  useEffect(() => {
    document.title =
      route.name === 'catalog'
        ? 'Каталог ShineMate'
        : route.name === 'product'
          ? productForRoute
            ? `${productForRoute.model} — ShineMate`
            : 'ShineMate'
          : route.name === 'about'
            ? 'О ShineMate'
            : route.name === 'technologies'
              ? 'Технологии ShineMate'
              : route.name === 'contacts'
                ? 'Контакты ShineMate'
                : route.name === 'wholesale'
                  ? 'Оптовикам — ShineMate'
                  : 'ShineMate — профессиональное полировальное оборудование'
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
          <Contact onOpenConsent={() => setLegalDoc(dataProcessingConsent)} />
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
