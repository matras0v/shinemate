import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'

import type { Product, Variant } from '../data/catalog'
import { navigateTo } from './router'

export type Intent = 'retail' | 'wholesale'

type LeadContextValue = {
  /** Товар, с которым пользователь пришёл в форму — розничный сценарий. */
  product: Product | null
  /** Конкретное исполнение товара, выбранное в drawer, а не всегда первое. */
  variant: Variant | null
  intent: Intent
  /** Открыть форму с уже выбранным товаром (карточка/drawer каталога). */
  requestProduct: (product: Product, variant?: Variant) => void
  /** Открыть форму в оптовом режиме, без привязки к конкретному товару. */
  requestWholesale: () => void
  /** Открыть форму без контекста — обычный «Запросить прайс» в шапке. */
  requestGeneral: () => void
  clearProduct: () => void
}

const LeadContext = createContext<LeadContextValue | null>(null)

export function LeadProvider({ children }: { children: ReactNode }) {
  const [product, setProduct] = useState<Product | null>(null)
  const [variant, setVariant] = useState<Variant | null>(null)
  const [intent, setIntent] = useState<Intent>('retail')

  const requestProduct = useCallback((p: Product, v?: Variant) => {
    setProduct(p)
    setVariant(v ?? p.variants[0] ?? null)
    setIntent('retail')
    navigateTo('/#contacts')
  }, [])

  const requestWholesale = useCallback(() => {
    setProduct(null)
    setVariant(null)
    setIntent('wholesale')
    navigateTo('/#contacts')
  }, [])

  const requestGeneral = useCallback(() => {
    setProduct(null)
    setVariant(null)
    setIntent('retail')
    navigateTo('/#contacts')
  }, [])

  const clearProduct = useCallback(() => {
    setProduct(null)
    setVariant(null)
  }, [])

  const value = useMemo(
    () => ({ product, variant, intent, requestProduct, requestWholesale, requestGeneral, clearProduct }),
    [product, variant, intent, requestProduct, requestWholesale, requestGeneral, clearProduct],
  )

  return <LeadContext.Provider value={value}>{children}</LeadContext.Provider>
}

export function useLead() {
  const ctx = useContext(LeadContext)
  if (!ctx) throw new Error('useLead must be used within LeadProvider')
  return ctx
}
