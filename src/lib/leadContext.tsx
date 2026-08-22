import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'

import type { Product } from '../data/catalog'
import { navigateTo } from './router'

export type Intent = 'retail' | 'wholesale'

type LeadContextValue = {
  /** Товар, с которым пользователь пришёл в форму — розничный сценарий. */
  product: Product | null
  intent: Intent
  /** Открыть форму с уже выбранным товаром (карточка/drawer каталога). */
  requestProduct: (product: Product) => void
  /** Открыть форму в оптовом режиме, без привязки к конкретному товару. */
  requestWholesale: () => void
  /** Открыть форму без контекста — обычный «Запросить прайс» в шапке. */
  requestGeneral: () => void
  clearProduct: () => void
}

const LeadContext = createContext<LeadContextValue | null>(null)

export function LeadProvider({ children }: { children: ReactNode }) {
  const [product, setProduct] = useState<Product | null>(null)
  const [intent, setIntent] = useState<Intent>('retail')

  const requestProduct = useCallback((p: Product) => {
    setProduct(p)
    setIntent('retail')
    navigateTo('/#contacts')
  }, [])

  const requestWholesale = useCallback(() => {
    setProduct(null)
    setIntent('wholesale')
    navigateTo('/#contacts')
  }, [])

  const requestGeneral = useCallback(() => {
    setProduct(null)
    setIntent('retail')
    navigateTo('/#contacts')
  }, [])

  const clearProduct = useCallback(() => setProduct(null), [])

  const value = useMemo(
    () => ({ product, intent, requestProduct, requestWholesale, requestGeneral, clearProduct }),
    [product, intent, requestProduct, requestWholesale, requestGeneral, clearProduct],
  )

  return <LeadContext.Provider value={value}>{children}</LeadContext.Provider>
}

export function useLead() {
  const ctx = useContext(LeadContext)
  if (!ctx) throw new Error('useLead must be used within LeadProvider')
  return ctx
}
