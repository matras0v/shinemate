import { useEffect, useState } from 'react'

import { CatalogView } from './components/catalog/CatalogView'
import { ProductDialog } from './components/catalog/ProductDialog'
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
import { ProductObject } from './components/scenes/ProductObject'
import { ReflectionReveal } from './components/scenes/ReflectionReveal'
import { ScrollStage } from './components/scenes/ScrollStage'
import { ScrollProgress } from './components/ui/ScrollProgress'
import type { Product } from './data/catalog'
import { dataProcessingConsent, privacyPolicy, type LegalDocument } from './data/legal'
import { LeadProvider } from './lib/leadContext'
import { useLinkInterceptor, useRoute } from './lib/router'

export default function App() {
  const [route] = useRoute()
  useLinkInterceptor()
  const [openProduct, setOpenProduct] = useState<Product | null>(null)
  const [searchOpen, setSearchOpen] = useState(false)
  const [legalDoc, setLegalDoc] = useState<LegalDocument | null>(null)

  // Заголовок вкладки следует за разделом.
  useEffect(() => {
    document.title =
      route.name === 'catalog'
        ? 'Каталог ShineMate'
        : 'ShineMate — профессиональное полировальное оборудование'
  }, [route])

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
          <CatalogView category={route.category} onOpenProduct={setOpenProduct} />
        </main>
      ) : (
        <main>
          <Hero />
          <ProductObject />
          <ReflectionReveal />
          <CategoryNavigator />
          <ScrollStage />
          <FeaturedModels onOpen={setOpenProduct} />
          <Engineering />
          <Contact onOpenConsent={() => setLegalDoc(dataProcessingConsent)} />
        </main>
      )}

      <Footer onOpenDoc={setLegalDoc} />
      <ProductDialog
        product={openProduct}
        onClose={() => setOpenProduct(null)}
        onSwitchProduct={setOpenProduct}
      />
      <SearchOverlay
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        onOpenProduct={setOpenProduct}
      />
      <LegalOverlay document={legalDoc} onClose={() => setLegalDoc(null)} />
      <CookieNotice onOpenPrivacy={() => setLegalDoc(privacyPolicy)} />
    </LeadProvider>
  )
}
